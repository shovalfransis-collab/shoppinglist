import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "shoppinglist",
  description: "Add an item and it's sorted into the right aisle for you.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F1F5F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1A15" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
