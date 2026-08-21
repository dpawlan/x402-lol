import Database from "better-sqlite3";
import path from "path";
import type { Listing, Activity, TrendingItem, LeaderboardEntry } from "./types";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "x402.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const fs = require("fs");
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      bid_usdc REAL NOT NULL DEFAULT 0,
      last_bid_at TEXT NOT NULL DEFAULT (datetime('now')),
      clicks INTEGER NOT NULL DEFAULT 0,
      resource_url TEXT NOT NULL,
      network TEXT NOT NULL DEFAULT 'base',
      asset TEXT NOT NULL DEFAULT 'USDC',
      price_per_call TEXT NOT NULL DEFAULT '$0.001',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      rank INTEGER NOT NULL,
      bid_amount REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES listings(id)
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      listing_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (listing_id) REFERENCES listings(id)
    );

    CREATE INDEX IF NOT EXISTS idx_listings_bid ON listings(bid_usdc DESC);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_clicks_listing ON clicks(listing_id);
    CREATE INDEX IF NOT EXISTS idx_clicks_created ON clicks(created_at);
  `);

  return db;
}

export function getLeaderboard(): LeaderboardEntry[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM listings ORDER BY bid_usdc DESC, last_bid_at ASC`
    )
    .all() as Array<{
    id: number;
    name: string;
    url: string;
    description: string;
    bid_usdc: number;
    last_bid_at: string;
    clicks: number;
    resource_url: string;
    network: string;
    asset: string;
    price_per_call: string;
    created_at: string;
  }>;

  return rows.map((row, index) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description,
    bidUsdc: row.bid_usdc,
    lastBidAt: row.last_bid_at,
    clicks: row.clicks,
    resourceUrl: row.resource_url,
    network: row.network,
    asset: row.asset,
    pricePerCall: row.price_per_call,
    createdAt: row.created_at,
    rank: index + 1,
  }));
}

export function getListingByUrl(url: string): Listing | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM listings WHERE url = ?`).get(url) as {
    id: number;
    name: string;
    url: string;
    description: string;
    bid_usdc: number;
    last_bid_at: string;
    clicks: number;
    resource_url: string;
    network: string;
    asset: string;
    price_per_call: string;
    created_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description,
    bidUsdc: row.bid_usdc,
    lastBidAt: row.last_bid_at,
    clicks: row.clicks,
    resourceUrl: row.resource_url,
    network: row.network,
    asset: row.asset,
    pricePerCall: row.price_per_call,
    createdAt: row.created_at,
  };
}

export function getListingById(id: number): Listing | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM listings WHERE id = ?`).get(id) as {
    id: number;
    name: string;
    url: string;
    description: string;
    bid_usdc: number;
    last_bid_at: string;
    clicks: number;
    resource_url: string;
    network: string;
    asset: string;
    price_per_call: string;
    created_at: string;
  } | undefined;

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description,
    bidUsdc: row.bid_usdc,
    lastBidAt: row.last_bid_at,
    clicks: row.clicks,
    resourceUrl: row.resource_url,
    network: row.network,
    asset: row.asset,
    pricePerCall: row.price_per_call,
    createdAt: row.created_at,
  };
}

export function createOrUpdateListing(
  url: string,
  name: string,
  description: string,
  bidAmount: number,
  resourceUrl?: string,
  network?: string,
  pricePerCall?: string
): { listing: Listing; amountCharged: number; isNew: boolean } {
  const db = getDb();
  const existing = getListingByUrl(url);

  if (existing) {
    const additionalBid = bidAmount;
    const newTotal = existing.bidUsdc + additionalBid;

    db.prepare(
      `UPDATE listings 
       SET bid_usdc = ?, 
           last_bid_at = datetime('now'),
           name = COALESCE(?, name),
           description = COALESCE(?, description),
           resource_url = COALESCE(?, resource_url),
           network = COALESCE(?, network),
           price_per_call = COALESCE(?, price_per_call)
       WHERE id = ?`
    ).run(newTotal, name || null, description || null, resourceUrl || null, network || null, pricePerCall || null, existing.id);

    const leaderboard = getLeaderboard();
    const rank = leaderboard.findIndex((l) => l.id === existing.id) + 1;

    db.prepare(
      `INSERT INTO activity (listing_id, name, url, rank, bid_amount) VALUES (?, ?, ?, ?, ?)`
    ).run(existing.id, existing.name, existing.url, rank, additionalBid);

    return {
      listing: getListingById(existing.id)!,
      amountCharged: additionalBid,
      isNew: false,
    };
  } else {
    const result = db
      .prepare(
        `INSERT INTO listings (name, url, description, bid_usdc, resource_url, network, price_per_call) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name || new URL(url).hostname,
        url,
        description || "",
        bidAmount,
        resourceUrl || url,
        network || "base",
        pricePerCall || "$0.001"
      );

    const listingId = result.lastInsertRowid as number;
    const leaderboard = getLeaderboard();
    const rank = leaderboard.findIndex((l) => l.id === listingId) + 1;

    db.prepare(
      `INSERT INTO activity (listing_id, name, url, rank, bid_amount) VALUES (?, ?, ?, ?, ?)`
    ).run(listingId, name || new URL(url).hostname, url, rank, bidAmount);

    return {
      listing: getListingById(listingId)!,
      amountCharged: bidAmount,
      isNew: true,
    };
  }
}

export function recordClick(listingId: number): void {
  const db = getDb();
  db.prepare(`INSERT INTO clicks (listing_id) VALUES (?)`).run(listingId);
  db.prepare(`UPDATE listings SET clicks = clicks + 1 WHERE id = ?`).run(listingId);
}

export function getRecentActivity(limit: number = 5): Activity[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM activity ORDER BY created_at DESC LIMIT ?`
    )
    .all(limit) as Array<{
    id: number;
    listing_id: number;
    name: string;
    url: string;
    rank: number;
    bid_amount: number;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    listingId: row.listing_id,
    name: row.name,
    url: row.url,
    rank: row.rank,
    bidAmount: row.bid_amount,
    createdAt: row.created_at,
  }));
}

export function getTrending(limit: number = 5): TrendingItem[] {
  const db = getDb();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const rows = db
    .prepare(
      `SELECT 
        l.id, l.name, l.url, 
        COUNT(c.id) as clicks_per_hour
       FROM listings l
       LEFT JOIN clicks c ON c.listing_id = l.id AND c.created_at > ?
       GROUP BY l.id
       ORDER BY clicks_per_hour DESC
       LIMIT ?`
    )
    .all(oneHourAgo, limit) as Array<{
    id: number;
    name: string;
    url: string;
    clicks_per_hour: number;
  }>;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    clicksPerHour: row.clicks_per_hour,
  }));
}

export function getTopBid(): number {
  const db = getDb();
  const row = db.prepare(`SELECT MAX(bid_usdc) as max_bid FROM listings`).get() as {
    max_bid: number | null;
  };
  return row.max_bid || 0;
}

export function getStats(): { totalListings: number; totalClicks: number; totalBids: number } {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT 
        COUNT(*) as total_listings,
        SUM(clicks) as total_clicks,
        SUM(bid_usdc) as total_bids
       FROM listings`
    )
    .get() as {
    total_listings: number;
    total_clicks: number | null;
    total_bids: number | null;
  };

  return {
    totalListings: row.total_listings,
    totalClicks: row.total_clicks || 0,
    totalBids: row.total_bids || 0,
  };
}

export function seedDatabase(): void {
  const db = getDb();
  const count = db.prepare(`SELECT COUNT(*) as count FROM listings`).get() as { count: number };

  if (count.count > 0) return;

  const seedData = [
    {
      name: "Weather Oracle",
      url: "https://weather-oracle.x402.dev",
      description: "Real-time weather data API with global coverage. Pay per request, no API key needed.",
      bidUsdc: 50,
      resourceUrl: "https://weather-oracle.x402.dev/api/weather",
      network: "base",
      pricePerCall: "$0.001",
    },
    {
      name: "GPT-4 Proxy",
      url: "https://gpt4-proxy.x402.dev",
      description: "OpenAI GPT-4 access via x402. No subscription, pay only for what you use.",
      bidUsdc: 45,
      resourceUrl: "https://gpt4-proxy.x402.dev/v1/chat/completions",
      network: "base",
      pricePerCall: "$0.01",
    },
    {
      name: "Image Gen Agent",
      url: "https://imagegen.x402.dev",
      description: "SDXL image generation. Agents can generate images programmatically.",
      bidUsdc: 38,
      resourceUrl: "https://imagegen.x402.dev/api/generate",
      network: "base",
      pricePerCall: "$0.05",
    },
    {
      name: "Code Review Bot",
      url: "https://codereview.x402.dev",
      description: "Automated code review powered by Claude. Submit PRs, get instant feedback.",
      bidUsdc: 30,
      resourceUrl: "https://codereview.x402.dev/api/review",
      network: "base",
      pricePerCall: "$0.02",
    },
    {
      name: "Stock Data API",
      url: "https://stocks.x402.dev",
      description: "Real-time and historical stock market data. Ideal for trading agents.",
      bidUsdc: 25,
      resourceUrl: "https://stocks.x402.dev/api/quote",
      network: "base",
      pricePerCall: "$0.005",
    },
    {
      name: "Translation Service",
      url: "https://translate.x402.dev",
      description: "Neural machine translation for 100+ languages. Low latency, high accuracy.",
      bidUsdc: 20,
      resourceUrl: "https://translate.x402.dev/api/translate",
      network: "base",
      pricePerCall: "$0.002",
    },
    {
      name: "PDF Parser",
      url: "https://pdf-parser.x402.dev",
      description: "Extract text, tables, and images from PDFs. Perfect for document processing pipelines.",
      bidUsdc: 15,
      resourceUrl: "https://pdf-parser.x402.dev/api/parse",
      network: "base",
      pricePerCall: "$0.01",
    },
    {
      name: "Email Validator",
      url: "https://email-check.x402.dev",
      description: "Verify email deliverability and detect disposable addresses in real-time.",
      bidUsdc: 10,
      resourceUrl: "https://email-check.x402.dev/api/validate",
      network: "base",
      pricePerCall: "$0.0005",
    },
    {
      name: "Sentiment Analyzer",
      url: "https://sentiment.x402.dev",
      description: "Analyze text sentiment with fine-grained emotion detection. Returns confidence scores.",
      bidUsdc: 8,
      resourceUrl: "https://sentiment.x402.dev/api/analyze",
      network: "base",
      pricePerCall: "$0.001",
    },
    {
      name: "URL Shortener",
      url: "https://short.x402.dev",
      description: "Create short links with analytics. Pay once, link lives forever.",
      bidUsdc: 5,
      resourceUrl: "https://short.x402.dev/api/shorten",
      network: "base",
      pricePerCall: "$0.001",
    },
  ];

  const insert = db.prepare(
    `INSERT INTO listings (name, url, description, bid_usdc, resource_url, network, price_per_call) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const insertActivity = db.prepare(
    `INSERT INTO activity (listing_id, name, url, rank, bid_amount, created_at) 
     VALUES (?, ?, ?, ?, ?, datetime('now', ?))`
  );

  const transaction = db.transaction(() => {
    seedData.forEach((item, index) => {
      const result = insert.run(
        item.name,
        item.url,
        item.description,
        item.bidUsdc,
        item.resourceUrl,
        item.network,
        item.pricePerCall
      );
      const listingId = result.lastInsertRowid as number;
      insertActivity.run(
        listingId,
        item.name,
        item.url,
        index + 1,
        item.bidUsdc,
        `-${Math.floor(Math.random() * 24)} hours`
      );
    });
  });

  transaction();
}

seedDatabase();
