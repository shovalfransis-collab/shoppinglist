#!/usr/bin/env python3
"""Proof of concept: compare one product's price across Shufersal, Rami Levy
and Osher Ad using the official price-transparency files.

Two steps, run the same script:

  STEP 1 - find the product and its barcode
      python compare_prices.py --query "קוטג" --brand "תנובה"

  STEP 2 - compare the price by barcode (copy a barcode from step 1)
      python compare_prices.py --barcode 07290004131074

The barcode (GTIN) is the same in every chain, so it is the key we match on.
Chains' own internal item codes are never used for matching.
"""

import argparse
import csv
import html
import re
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime
from pathlib import Path

import httpx
import israeli_prices as ilp

CHAINS = ["shufersal", "rami-levy", "osher-ad"]
DEFAULT_CITY = "תל אביב"
MAX_STORE_TRIES = 4  # how many branches to try per chain if one has no file
RETRIES = 4          # attempts per branch (portals, Shufersal especially, time out at random)
RETRY_WAIT = 5       # seconds to wait before the 2nd attempt; doubles each time
DEFAULT_SHUFERSAL_XML = (Path(__file__).parent / "shufersal-test" / "dumps" / "Shufersal"
                         / "PriceFull7290027600007-001-117-20261110-030000.xml")


def norm(text):
    """Lowercase and drop quote/apostrophe variants so קוטג' == קוטג."""
    return re.sub(r"[\"'`׳״’‘“”]", "", text or "").strip().lower()


def candidate_store_ids(chain, city, overrides):
    """Branch IDs to try, branches in the chosen city first."""
    if chain in overrides:
        return [overrides[chain]]
    stores = ilp.get_stores(chain).stores
    city_n = norm(city)

    def haystack(s):
        return norm(" ".join(x for x in (s.city, s.address, s.name) if x))

    local = [s.store_id for s in stores if city_n in haystack(s)]
    rest = [s.store_id for s in stores if s.store_id not in local]
    return local + rest


def file_published_at(chain, store_id):
    """When the chain published its newest full price file for this branch.
    Best effort: returns None if the portal does not answer."""
    try:
        refs = ilp.list_files(chain, ilp.FileType.PRICE_FULL, store_id=store_id, limit=1)
        return refs[0].published_at if refs else None
    except Exception:
        return None


def get_with_retries(chain, store_id):
    """Portals time out at random, so try again a few times with growing pauses."""
    wait = RETRY_WAIT
    for attempt in range(1, RETRIES + 1):
        try:
            return ilp.get_prices(chain, store_id=store_id)
        except ilp.PortalError as exc:
            if attempt == RETRIES:
                raise
            print(f"  attempt {attempt}/{RETRIES} failed ({type(exc).__name__}), "
                  f"retrying in {wait}s ...", flush=True)
            time.sleep(wait)
            wait *= 2


def load_prices(chain, city, overrides):
    """Download the full price file of one branch.
    Returns (store_id, PriceFile, published_at)."""
    last_error = None
    for store_id in candidate_store_ids(chain, city, overrides)[:MAX_STORE_TRIES]:
        try:
            price_file = get_with_retries(chain, store_id)
            if price_file.items:
                return store_id, price_file, file_published_at(chain, store_id)
        except ilp.IsraeliPricesError as exc:
            last_error = exc
    raise last_error or RuntimeError("no price file with items found")


def _xml_fallback(raw):
    """Plain-XML reader, used only if israeli_prices.parse() cannot read the file."""
    root = ET.fromstring(raw.decode("utf-8-sig"))

    def num(el, tag):
        text = el.findtext(tag)
        return float(text) if text else None

    def when(el, tag):
        text = el.findtext(tag)
        return datetime.fromisoformat(text) if text else None

    items = [
        ilp.PriceItem(
            item_code=(el.findtext("ItemCode") or "").strip(),
            item_type=int(el.findtext("ItemType") or 1),
            name=el.findtext("ItemName"),
            manufacturer=el.findtext("ManufactureName"),
            is_weighted=(el.findtext("bIsWeighted") == "1"),
            price=num(el, "ItemPrice"),
            price_update_time=when(el, "PriceUpdateTime"),
        )
        for el in root.iter("Item")
    ]
    return ilp.PriceFile(chain_id=root.findtext("ChainID"), store_id=root.findtext("StoreID"),
                         items=items)


SHUFERSAL_LIST_URL = "https://prices.shufersal.co.il/FileObject/UpdateCategory"
DEFAULT_SHUFERSAL_STORE = "117"
HTTP_TIMEOUT = 60    # seconds per request
HTTP_ATTEMPTS = 3    # tries per request; waits 1s, then 2s, between them


def _get_with_backoff(client, url, **kwargs):
    """GET with a few tries and a growing pause (1s, 2s) between them."""
    for attempt in range(1, HTTP_ATTEMPTS + 1):
        try:
            resp = client.get(url, **kwargs)
            resp.raise_for_status()
            return resp
        except httpx.HTTPError as exc:
            if attempt == HTTP_ATTEMPTS:
                raise
            wait = attempt  # 1s after the 1st failure, 2s after the 2nd
            print(f"  shufersal: attempt {attempt}/{HTTP_ATTEMPTS} failed "
                  f"({type(exc).__name__}), retrying in {wait}s ...", flush=True)
            time.sleep(wait)


def fetch_shufersal(store_id):
    """Fast Shufersal fetch: ask the portal for ONE branch's PriceFull files only
    (instead of paging through every branch), then download the newest one.
    Returns (store_id, PriceFile, published_at)."""
    store_id = str(store_id)
    with httpx.Client(timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        t0 = time.perf_counter()
        resp = _get_with_backoff(client, SHUFERSAL_LIST_URL,
                                 params={"catID": 2, "storeId": store_id, "page": 1})
        t_list = time.perf_counter() - t0

        links = [html.unescape(u) for u in re.findall(r'href="(https://[^"]+?\.gz[^"]*)"', resp.text)]
        candidates = []  # (timestamp, url)
        for url in links:
            name = url.split("?")[0].rsplit("/", 1)[-1]
            stamp = re.search(r"-(\d{8})-(\d{6})\.gz$", name)
            if name.startswith("PriceFull") and f"-{store_id}-" in name and stamp:
                candidates.append(("".join(stamp.groups()), url))
        if not candidates:
            raise RuntimeError(f"portal listed no PriceFull file for store {store_id} "
                               f"({len(links)} .gz links on page 1)")
        stamp, url = max(candidates)  # newest timestamp in the file name

        # The link is signed and expires within minutes, so download right away.
        t1 = time.perf_counter()
        data = _get_with_backoff(client, url).content
        t_download = time.perf_counter() - t1

    price_file = ilp.parse(data)
    published = datetime.strptime(stamp, "%Y%m%d%H%M%S")
    print(f"  shufersal timings: file list {t_list:.1f}s, download {t_download:.1f}s "
          f"({len(data) / 1e6:.1f} MB)", flush=True)
    return price_file.store_id, price_file, published


def load_shufersal_xml(path):
    """Read Shufersal prices from a PriceFull XML we already downloaded.
    Returns (store_id, PriceFile, published_at). The publish date comes from the
    file name, e.g. ...-117-20261110-030000.xml -> 2026-11-10 03:00."""
    path = Path(path)
    raw = path.read_bytes()
    try:
        price_file = ilp.parse(raw)
    except Exception as exc:
        print(f"  ilp.parse could not read the file ({type(exc).__name__}: {str(exc)[:100]}); "
              "using the xml.etree fallback")
        price_file = _xml_fallback(raw)
    match = re.search(r"-(\d{8})-(\d{6})\.", path.name)
    published = datetime.strptime("".join(match.groups()), "%Y%m%d%H%M%S") if match else None
    return price_file.store_id, price_file, published


def parse_overrides(pairs):
    """--store shufersal=413 --store rami-levy=17  ->  {'shufersal': '413', ...}"""
    out = {}
    for pair in pairs or []:
        chain, _, store_id = pair.partition("=")
        if chain not in CHAINS or not store_id:
            sys.exit(f"Bad --store value '{pair}'. Use e.g. shufersal=413")
        out[chain] = store_id
    return out


def fmt_price(item):
    return f"{item.price:.2f}" if item is not None and item.price is not None else "-"


def step1_find(files, query, brand):
    """List barcoded products whose name matches, lined up across chains."""
    q, b = norm(query), norm(brand)

    def matches(item):
        if item.is_weighted or not item.is_barcoded:
            return False
        name = norm(item.name)
        if q not in name:
            return False
        return not b or b in name or b in norm(item.manufacturer)

    filtered = {
        chain: ilp.PriceFile(
            chain_id=pf.chain_id,
            store_id=pf.store_id,
            items=[i for i in pf.items if matches(i)],
        )
        for chain, pf in files.items()
    }
    grouped = ilp.group_by_gtin(filtered, min_sources=1)

    # Products carried by the most chains first, then by name.
    def sort_key(entry):
        gtin, by_chain = entry
        first = next(iter(by_chain.values()))
        return (-len(by_chain), first.name or "", gtin)

    rows = sorted(grouped.items(), key=sort_key)
    print(f"\nFound {len(rows)} matching barcoded products "
          f"(query='{query}', brand='{brand or '-'}').\n")
    header = f"{'barcode':<16}" + "".join(f"{c:>11}" for c in files) + "   name"
    print(header)
    print("-" * len(header))
    for gtin, by_chain in rows:
        name = next(iter(by_chain.values())).name
        prices = "".join(f"{fmt_price(by_chain.get(c)):>11}" for c in files)
        print(f"{gtin:<16}{prices}   {name}")
    carried_by_all = sum(1 for _, bc in rows if len(bc) == len(files))
    print(f"\n{carried_by_all} of {len(rows)} are carried by all {len(files)} chains.")
    print("Pick one and run:  python compare_prices.py --barcode <barcode>")
    return rows


def fmt_dt(value):
    return value.strftime("%Y-%m-%d %H:%M") if value else "unknown"


def step2_compare(files, barcode, published, mongo_rows=None):
    """Show one product's price in every chain, cheapest first."""
    try:
        target = ilp.to_gtin14(barcode)
    except Exception:
        sys.exit(f"'{barcode}' does not look like a valid barcode.")
    grouped = ilp.group_by_gtin(files, min_sources=1)
    by_chain = grouped.get(target, {})
    if not by_chain:
        print(f"\nBarcode {target} was not found in any of the downloaded files.")
        return []

    print(f"\nBarcode {target}\n")
    found = sorted(by_chain.items(), key=lambda kv: kv[1].price or 10**9)
    rows = []
    for chain, item in found:
        store_id = files[chain].store_id
        price_changed = fmt_dt(item.price_update_time)
        file_date = fmt_dt(published.get(chain))
        print(f"{chain:<10} branch {store_id:<6} {fmt_price(item):>8} ILS   "
              f"file published {file_date}   price last changed {price_changed}   {item.name}")
        rows.append([target, chain, store_id, fmt_price(item), file_date, price_changed, item.name])
        if mongo_rows is not None:
            published_at = published.get(chain)
            mongo_rows.append({"barcode": target, "chain": chain, "branch": store_id, "name": item.name,
                               "price": item.price,
                               "file_date": published_at.isoformat() if published_at else None})
    missing = [c for c in files if c not in by_chain]
    for chain in missing:
        print(f"{chain:<10} does not carry this barcode in the branch we checked")
    if len(found) > 1 and found[0][1].price and found[-1][1].price:
        diff = found[-1][1].price - found[0][1].price
        print(f"\nCheapest: {found[0][0]}. Spread between cheapest and priciest: {diff:.2f} ILS")
    return rows


def save_csv(path, header, rows):
    with open(path, "w", newline="", encoding="utf-8-sig") as fh:  # opens cleanly in Excel
        csv.writer(fh).writerows([header, *rows])
    print(f"\nSaved {path}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--query", help="part of the product name, e.g. קוטג")
    ap.add_argument("--brand", default="", help="brand filter, e.g. תנובה")
    ap.add_argument("--barcode", nargs="+", help="compare these barcodes across chains")
    ap.add_argument("--shufersal-xml", nargs="?", const=str(DEFAULT_SHUFERSAL_XML), metavar="PATH",
                    help="read Shufersal from this downloaded PriceFull XML instead of fetching it "
                         "(without a PATH: the file in shufersal-test/)")
    ap.add_argument("--city", default=DEFAULT_CITY, help=f"prefer branches in this city (default {DEFAULT_CITY})")
    ap.add_argument("--store", action="append", metavar="CHAIN=ID", help="force a branch, e.g. shufersal=413")
    ap.add_argument("--csv", metavar="FILE", help="also save the result to a CSV file")
    ap.add_argument("--save-mongo", action="store_true",
                    help="after the table, save the prices to MongoDB (needs MONGODB_URI in .env; use with --barcode)")
    args = ap.parse_args()
    if not args.query and not args.barcode:
        ap.error("give --query (step 1) or --barcode (step 2)")

    overrides = parse_overrides(args.store)
    files, published = {}, {}
    for chain in CHAINS:
        print(f"Downloading {chain} ...", flush=True)
        started = time.perf_counter()
        try:
            if chain == "shufersal" and args.shufersal_xml:
                store_id, price_file, file_date = load_shufersal_xml(args.shufersal_xml)
            elif chain == "shufersal":
                store_id, price_file, file_date = fetch_shufersal(
                    overrides.get("shufersal", DEFAULT_SHUFERSAL_STORE))
            else:
                store_id, price_file, file_date = load_prices(chain, args.city, overrides)
            files[chain] = price_file
            published[chain] = file_date
            print(f"  branch {store_id}: {len(price_file.items)} items, "
                  f"file published {fmt_dt(file_date)}")
        except Exception as exc:  # keep going with the other chains
            print(f"  FAILED: {type(exc).__name__}: {str(exc)[:160]}")
        print(f"  {chain} took {time.perf_counter() - started:.1f}s", flush=True)
    if not files:
        sys.exit("\nCould not download any chain. Check your internet connection and try again.")

    if args.barcode:
        mongo_rows = []
        rows = [row for code in args.barcode for row in step2_compare(files, code, published, mongo_rows)]
        header = ["barcode", "chain", "branch", "price_ils", "file_published", "price_last_changed", "name"]
    else:
        found = step1_find(files, args.query, args.brand)
        rows = [[g, *(fmt_price(bc.get(c)) for c in files), next(iter(bc.values())).name]
                for g, bc in found]
        header = ["barcode", *files, "name"]
    if args.csv and rows:
        save_csv(args.csv, header, rows)
    if args.save_mongo:
        if not args.barcode:
            sys.exit("--save-mongo works with --barcode only.")
        import mongo_store  # imported here so plain runs don't need pymongo
        try:
            db = mongo_store.connect()
            mongo_store.ensure_indexes(db)
            saved, rejected = mongo_store.save_prices(db, mongo_rows)
        except Exception as exc:  # type only: pymongo messages can contain the host/URI
            sys.exit(f"MongoDB error: {type(exc).__name__}")
        print(f"\nMongoDB: {saved} saved, {rejected} rejected")


if __name__ == "__main__":
    main()
