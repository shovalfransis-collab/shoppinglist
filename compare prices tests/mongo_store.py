"""Save and read supermarket prices in MongoDB Atlas.

The connection string lives only in .env (MONGODB_URI) and is never printed.

    python mongo_store.py --show 07290004127077
"""
import argparse
import os
import sys
from datetime import datetime, timezone

from dotenv import load_dotenv
from pymongo import MongoClient

DB_NAME = "shoppinglist"
COLLECTION = "prices"
MIN_PRICE, MAX_PRICE = 0.1, 5000


def connect():
    """Return the 'shoppinglist' database. Errors never include the URI."""
    load_dotenv()
    # Strip whitespace and any surrounding quotes (a common copy-paste slip in secrets).
    uri = os.environ.get("MONGODB_URI", "").strip().strip("'\"").strip()
    if not uri.startswith(("mongodb://", "mongodb+srv://")):
        # Print only the length, never the value.
        sys.exit(f"MONGODB_URI is empty or invalid (length {len(uri)}). "
                 "Check the GitHub repository secret name and value.")
    return MongoClient(uri, serverSelectionTimeoutMS=15000)[DB_NAME]


def ensure_indexes(db):
    db[COLLECTION].create_index(
        [("barcode", 1), ("chain", 1), ("branch", 1)], unique=True, name="barcode_chain_branch")


def _valid(row):
    barcode = str(row.get("barcode", ""))
    if not barcode.isdigit():
        return False
    try:
        price = float(row["price"])
    except (KeyError, TypeError, ValueError):
        return False
    return MIN_PRICE <= price <= MAX_PRICE  # NaN fails this comparison too


def save_prices(db, rows):
    """Upsert rows by (barcode, chain, branch). Returns (saved, rejected)."""
    saved = rejected = 0
    now = datetime.now(timezone.utc)
    for row in rows:
        if not _valid(row):
            rejected += 1
            continue
        key = {"barcode": str(row["barcode"]), "chain": row["chain"], "branch": str(row["branch"])}
        doc = {**key, "name": row.get("name"), "price": float(row["price"]),
               "file_date": row.get("file_date"), "updated_at": now}
        db[COLLECTION].update_one(key, {"$set": doc}, upsert=True)
        saved += 1
    return saved, rejected


def cheapest(db, barcode):
    """All stored prices for a barcode, cheapest first."""
    return list(db[COLLECTION].find({"barcode": str(barcode)}, {"_id": 0}).sort("price", 1))


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--show", metavar="BARCODE", help="print stored prices for this barcode, cheapest first")
    ap.add_argument("--count", action="store_true", help="print how many documents the collection holds")
    args = ap.parse_args()
    if not args.show and not args.count:
        ap.error("give --show BARCODE or --count")
    try:
        db = connect()
        if args.count:
            print(f"{db[COLLECTION].count_documents({})} documents in {DB_NAME}.{COLLECTION}")
        if args.show:
            # Compare prices stores GTIN-14, so normalise what the user typed.
            import israeli_prices as ilp
            barcode = ilp.to_gtin14(args.show)
            docs = cheapest(db, barcode)
            if not docs:
                print(f"No stored prices for {barcode}.")
            for d in docs:
                print(f"{d['chain']:<10} branch {d['branch']:<6} {d['price']:>8.2f} ILS   "
                      f"file {d['file_date']}   saved {d['updated_at']:%Y-%m-%d %H:%M} UTC   {d['name']}")
    except SystemExit:
        raise
    except Exception as exc:  # print only the type: pymongo messages can contain the host/URI
        sys.exit(f"MongoDB error: {type(exc).__name__}")


if __name__ == "__main__":
    main()
