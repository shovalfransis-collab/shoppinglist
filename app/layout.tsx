import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { en } from "@/lib/i18n/en";
import { INIT_SCRIPT } from "@/lib/i18n/script";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

// Fonts are self-hosted from npm packages, so builds never depend on reaching Google Fonts.

// Display face: characterful grotesque for the title and aisle signs.
const display = localFont({
  variable: "--font-display",
  src: "../node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2",
  weight: "200 800",
});

// Body face: built for legibility, which matters when you're reading a list mid-aisle.
const body = localFont({
  variable: "--font-body",
  src: [
    {
      path: "../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2",
      weight: "400",
    },
    {
      path: "../node_modules/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2",
      weight: "700",
    },
  ],
});

// Hebrew has no glyphs in the two faces above, so it gets Rubik. Latin and Hebrew ship as separate
// files, so we load both and list them in order in --font-hebrew (globals.css). The automatic
// fallback font is turned off: it would grab the Hebrew letters before Rubik's Hebrew file.
const hebrewLatin = localFont({
  variable: "--font-rubik-latin",
  src: "../node_modules/@fontsource-variable/rubik/files/rubik-latin-wght-normal.woff2",
  weight: "300 900",
  adjustFontFallback: false,
  preload: false,
});

const hebrew = localFont({
  variable: "--font-rubik-hebrew",
  src: "../node_modules/@fontsource-variable/rubik/files/rubik-hebrew-wght-normal.woff2",
  weight: "300 900",
  adjustFontFallback: false,
  preload: false,
});

// The server can't know the visitor's language (it's picked in the browser), so the static
// metadata is English. <I18nProvider> swaps the tab title/description when the language is Hebrew.
export const metadata: Metadata = {
  title: en.meta.title,
  description: en.meta.description,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1F5F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1A15" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: INIT_SCRIPT sets lang/dir before React loads, so they can differ from the server HTML.
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${hebrewLatin.variable} ${hebrew.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
      </head>
      <body className="min-h-full">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
