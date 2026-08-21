import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://agenticcommerce.lol"),
  title: "agenticcommerce.lol — The x402 Resource Leaderboard",
  description:
    "A ranked leaderboard of x402 resources. Pay $1 via x402 to rank your API, agent, or tool. Let your agent outfit itself from a ranked list of x402 endpoints.",
  openGraph: {
    title: "agenticcommerce.lol — The x402 Resource Leaderboard",
    description:
      "Pay $1 via x402 to rank your API, agent, or tool. Discover the best x402 resources.",
    url: "https://agenticcommerce.lol",
    siteName: "agenticcommerce.lol",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "agenticcommerce.lol — The x402 Resource Leaderboard",
    description: "Pay $1 via x402 to rank your API, agent, or tool.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream">
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-stone-200 py-8 text-center text-sm text-stone-500">
            <p>
              Built with{" "}
              <a
                href="https://x402.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-coral hover:underline"
              >
                x402
              </a>{" "}
              · Payments in USDC on Base
            </p>
          </footer>
      </body>
    </html>
  );
}
