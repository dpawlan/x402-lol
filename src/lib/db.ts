import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import type { Listing, Activity, TrendingItem, LeaderboardEntry } from "./types";

const DATABASE_URL = process.env.DATABASE_URL;

let sql: NeonQueryFunction<false, false> | null = null;
let dbInitialized = false;

function getSql(): NeonQueryFunction<false, false> | null {
  if (!DATABASE_URL) {
    return null;
  }
  if (!sql) {
    sql = neon(DATABASE_URL);
  }
  return sql;
}

interface DbListing {
  id: number;
  name: string;
  url: string;
  description: string;
  bid_usdc: string | number;
  last_bid_at: string | Date;
  clicks: number;
  resource_url: string;
  network: string;
  asset: string;
  price_per_call: string;
  created_at: string | Date;
}

interface DbActivity {
  id: number;
  listing_id: number;
  name: string;
  url: string;
  rank: number;
  bid_amount: string | number;
  created_at: string | Date;
}

interface InMemoryStore {
  listings: Map<number, DbListing>;
  activity: DbActivity[];
  clicks: { listingId: number; createdAt: string }[];
  nextListingId: number;
  nextActivityId: number;
}

let inMemoryStore: InMemoryStore | null = null;

function getInMemoryStore(): InMemoryStore {
  if (!inMemoryStore) {
    inMemoryStore = {
      listings: new Map(),
      activity: [],
      clicks: [],
      nextListingId: 1,
      nextActivityId: 1,
    };
    seedInMemoryStore(inMemoryStore);
  }
  return inMemoryStore;
}

function seedInMemoryStore(store: InMemoryStore): void {
  const seedData = getSeedData();
  const now = new Date();

  seedData.forEach((item, index) => {
    const id = store.nextListingId++;
    const createdAt = new Date(now.getTime() - (index + 1) * 3600000).toISOString();
    store.listings.set(id, {
      id,
      name: item.name,
      url: item.url,
      description: item.description,
      bid_usdc: item.bidUsdc,
      last_bid_at: createdAt,
      clicks: Math.floor(Math.random() * 1000),
      resource_url: item.resourceUrl,
      network: item.network,
      asset: "USDC",
      price_per_call: item.pricePerCall,
      created_at: createdAt,
    });

    store.activity.push({
      id: store.nextActivityId++,
      listing_id: id,
      name: item.name,
      url: item.url,
      rank: index + 1,
      bid_amount: item.bidUsdc,
      created_at: createdAt,
    });
  });
}

function getSeedData() {
  return [
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
}

let initPromise: Promise<void> | null = null;

async function initializeDatabase(): Promise<void> {
  const client = getSql();
  if (!client || dbInitialized) return;
  // Memoize so concurrent first requests don't race on CREATE TABLE.
  if (!initPromise) {
    initPromise = runMigrations(client).catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

async function runMigrations(client: NeonQueryFunction<false, false>): Promise<void> {
  try {
    await client`
      CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        description TEXT NOT NULL,
        bid_usdc NUMERIC NOT NULL DEFAULT 0,
        last_bid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        clicks INTEGER NOT NULL DEFAULT 0,
        resource_url TEXT NOT NULL,
        network TEXT NOT NULL DEFAULT 'base',
        asset TEXT NOT NULL DEFAULT 'USDC',
        price_per_call TEXT NOT NULL DEFAULT '$0.001',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await client`
      CREATE TABLE IF NOT EXISTS activity (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER NOT NULL REFERENCES listings(id),
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        rank INTEGER NOT NULL,
        bid_amount NUMERIC NOT NULL,
        tx_hash TEXT,
        payer TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await client`ALTER TABLE activity ADD COLUMN IF NOT EXISTS tx_hash TEXT`;
    await client`ALTER TABLE activity ADD COLUMN IF NOT EXISTS payer TEXT`;

    await client`
      CREATE TABLE IF NOT EXISTS clicks (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER NOT NULL REFERENCES listings(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await client`CREATE INDEX IF NOT EXISTS idx_listings_bid ON listings(bid_usdc DESC)`;
    await client`CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC)`;
    await client`CREATE INDEX IF NOT EXISTS idx_clicks_listing ON clicks(listing_id)`;
    await client`CREATE INDEX IF NOT EXISTS idx_clicks_created ON clicks(created_at)`;

    if (process.env.SEED_DEMO_DATA === "true") {
      const countResult = await client`SELECT COUNT(*) as count FROM listings`;
      if (Number(countResult[0]?.count) === 0) {
        await seedDatabase();
      }
    }

    dbInitialized = true;
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}

async function seedDatabase(): Promise<void> {
  const client = getSql();
  if (!client) return;

  const seedData = getSeedData();

  for (let i = 0; i < seedData.length; i++) {
    const item = seedData[i];
    const result = await client`
      INSERT INTO listings (name, url, description, bid_usdc, resource_url, network, price_per_call)
      VALUES (${item.name}, ${item.url}, ${item.description}, ${item.bidUsdc}, ${item.resourceUrl}, ${item.network}, ${item.pricePerCall})
      RETURNING id
    `;
    const listingId = result[0]?.id;

    if (listingId) {
      await client`
        INSERT INTO activity (listing_id, name, url, rank, bid_amount)
        VALUES (${listingId}, ${item.name}, ${item.url}, ${i + 1}, ${item.bidUsdc})
      `;
    }
  }
}

function toISOString(value: string | Date): string {
  if (typeof value === "string") return value;
  return value.toISOString();
}

function dbRowToListing(row: DbListing): Listing {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description,
    bidUsdc: Number(row.bid_usdc),
    lastBidAt: toISOString(row.last_bid_at),
    clicks: row.clicks,
    resourceUrl: row.resource_url,
    network: row.network,
    asset: row.asset,
    pricePerCall: row.price_per_call,
    createdAt: toISOString(row.created_at),
  };
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    const listings = Array.from(store.listings.values())
      .sort((a, b) => Number(b.bid_usdc) - Number(a.bid_usdc) || new Date(toISOString(a.last_bid_at)).getTime() - new Date(toISOString(b.last_bid_at)).getTime());
    return listings.map((row, index) => ({
      ...dbRowToListing(row),
      rank: index + 1,
    }));
  }

  await initializeDatabase();
  const rows = await client`SELECT * FROM listings ORDER BY bid_usdc DESC, last_bid_at ASC` as DbListing[];

  return rows.map((row, index) => ({
    ...dbRowToListing(row),
    rank: index + 1,
  }));
}

export async function getListingByUrl(url: string): Promise<Listing | null> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    const listing = Array.from(store.listings.values()).find((l) => l.url === url);
    return listing ? dbRowToListing(listing) : null;
  }

  await initializeDatabase();
  const rows = await client`SELECT * FROM listings WHERE url = ${url}` as DbListing[];

  if (rows.length === 0) return null;
  return dbRowToListing(rows[0]);
}

export async function getListingById(id: number): Promise<Listing | null> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    const listing = store.listings.get(id);
    return listing ? dbRowToListing(listing) : null;
  }

  await initializeDatabase();
  const rows = await client`SELECT * FROM listings WHERE id = ${id}` as DbListing[];

  if (rows.length === 0) return null;
  return dbRowToListing(rows[0]);
}

export async function createOrUpdateListing(
  url: string,
  name: string,
  description: string,
  bidAmount: number,
  resourceUrl?: string,
  network?: string,
  pricePerCall?: string,
  payment?: { txHash: string; payer: string | null }
): Promise<{ listing: Listing; amountCharged: number; isNew: boolean }> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    const existing = Array.from(store.listings.values()).find((l) => l.url === url);

    if (existing) {
      const newTotal = Number(existing.bid_usdc) + bidAmount;
      existing.bid_usdc = newTotal;
      existing.last_bid_at = new Date().toISOString();
      if (name) existing.name = name;
      if (description) existing.description = description;
      if (resourceUrl) existing.resource_url = resourceUrl;
      if (network) existing.network = network;
      if (pricePerCall) existing.price_per_call = pricePerCall;

      const sortedListings = Array.from(store.listings.values()).sort((a, b) => Number(b.bid_usdc) - Number(a.bid_usdc));
      const rank = sortedListings.findIndex((l) => l.id === existing.id) + 1;

      store.activity.unshift({
        id: store.nextActivityId++,
        listing_id: existing.id,
        name: existing.name,
        url: existing.url,
        rank,
        bid_amount: bidAmount,
        created_at: new Date().toISOString(),
      });

      return { listing: dbRowToListing(existing), amountCharged: bidAmount, isNew: false };
    } else {
      const id = store.nextListingId++;
      const now = new Date().toISOString();
      const newListing: DbListing = {
        id,
        name: name || new URL(url).hostname,
        url,
        description: description || "",
        bid_usdc: bidAmount,
        last_bid_at: now,
        clicks: 0,
        resource_url: resourceUrl || url,
        network: network || "base",
        asset: "USDC",
        price_per_call: pricePerCall || "$0.001",
        created_at: now,
      };
      store.listings.set(id, newListing);

      const sortedListings = Array.from(store.listings.values()).sort((a, b) => Number(b.bid_usdc) - Number(a.bid_usdc));
      const rank = sortedListings.findIndex((l) => l.id === id) + 1;

      store.activity.unshift({
        id: store.nextActivityId++,
        listing_id: id,
        name: newListing.name,
        url: newListing.url,
        rank,
        bid_amount: bidAmount,
        created_at: now,
      });

      return { listing: dbRowToListing(newListing), amountCharged: bidAmount, isNew: true };
    }
  }

  await initializeDatabase();
  const existing = await getListingByUrl(url);

  if (existing) {
    const newTotal = existing.bidUsdc + bidAmount;

    await client`
      UPDATE listings 
      SET bid_usdc = ${newTotal}, 
          last_bid_at = NOW(),
          name = COALESCE(NULLIF(${name || ""}, ''), name),
          description = COALESCE(NULLIF(${description || ""}, ''), description),
          resource_url = COALESCE(NULLIF(${resourceUrl || ""}, ''), resource_url),
          network = COALESCE(NULLIF(${network || ""}, ''), network),
          price_per_call = COALESCE(NULLIF(${pricePerCall || ""}, ''), price_per_call)
      WHERE id = ${existing.id}
    `;

    const leaderboard = await getLeaderboard();
    const rank = leaderboard.findIndex((l) => l.id === existing.id) + 1;

    await client`
      INSERT INTO activity (listing_id, name, url, rank, bid_amount, tx_hash, payer)
      VALUES (${existing.id}, ${existing.name}, ${existing.url}, ${rank}, ${bidAmount}, ${payment?.txHash ?? null}, ${payment?.payer ?? null})
    `;

    const updated = await getListingById(existing.id);
    return { listing: updated!, amountCharged: bidAmount, isNew: false };
  } else {
    const displayName = name || new URL(url).hostname;
    const result = await client`
      INSERT INTO listings (name, url, description, bid_usdc, resource_url, network, price_per_call)
      VALUES (${displayName}, ${url}, ${description || ""}, ${bidAmount}, ${resourceUrl || url}, ${network || "base"}, ${pricePerCall || "$0.001"})
      RETURNING id
    ` as { id: number }[];

    const listingId = result[0]?.id;
    if (!listingId) throw new Error("Failed to create listing");

    const leaderboard = await getLeaderboard();
    const rank = leaderboard.findIndex((l) => l.id === listingId) + 1;

    await client`
      INSERT INTO activity (listing_id, name, url, rank, bid_amount, tx_hash, payer)
      VALUES (${listingId}, ${displayName}, ${url}, ${rank}, ${bidAmount}, ${payment?.txHash ?? null}, ${payment?.payer ?? null})
    `;

    const created = await getListingById(listingId);
    return { listing: created!, amountCharged: bidAmount, isNew: true };
  }
}

export async function recordClick(listingId: number): Promise<void> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    const listing = store.listings.get(listingId);
    if (listing) {
      listing.clicks++;
      store.clicks.push({ listingId, createdAt: new Date().toISOString() });
    }
    return;
  }

  await initializeDatabase();
  await client`INSERT INTO clicks (listing_id) VALUES (${listingId})`;
  await client`UPDATE listings SET clicks = clicks + 1 WHERE id = ${listingId}`;
}

export async function getRecentActivity(limit: number = 5): Promise<Activity[]> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    return store.activity.slice(0, limit).map((row) => ({
      id: row.id,
      listingId: row.listing_id,
      name: row.name,
      url: row.url,
      rank: row.rank,
      bidAmount: Number(row.bid_amount),
      createdAt: toISOString(row.created_at),
    }));
  }

  await initializeDatabase();
  const rows = await client`SELECT * FROM activity ORDER BY created_at DESC LIMIT ${limit}` as DbActivity[];

  return rows.map((row) => ({
    id: row.id,
    listingId: row.listing_id,
    name: row.name,
    url: row.url,
    rank: row.rank,
    bidAmount: Number(row.bid_amount),
    createdAt: toISOString(row.created_at),
  }));
}

export async function getTrending(limit: number = 5): Promise<TrendingItem[]> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const clickCounts = new Map<number, number>();

    store.clicks.forEach((click) => {
      if (new Date(click.createdAt).getTime() > oneHourAgo) {
        clickCounts.set(click.listingId, (clickCounts.get(click.listingId) || 0) + 1);
      }
    });

    return Array.from(store.listings.values())
      .map((listing) => ({
        id: listing.id,
        name: listing.name,
        url: listing.url,
        clicksPerHour: clickCounts.get(listing.id) || 0,
      }))
      .sort((a, b) => b.clicksPerHour - a.clicksPerHour)
      .slice(0, limit);
  }

  await initializeDatabase();
  const rows = await client`
    SELECT 
      l.id, l.name, l.url, 
      COUNT(c.id)::int as clicks_per_hour
    FROM listings l
    LEFT JOIN clicks c ON c.listing_id = l.id AND c.created_at > NOW() - INTERVAL '1 hour'
    GROUP BY l.id, l.name, l.url
    ORDER BY clicks_per_hour DESC
    LIMIT ${limit}
  ` as { id: number; name: string; url: string; clicks_per_hour: number }[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    clicksPerHour: row.clicks_per_hour,
  }));
}

export async function getTopBid(): Promise<number> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    const listings = Array.from(store.listings.values());
    if (listings.length === 0) return 0;
    return Math.max(...listings.map((l) => Number(l.bid_usdc)));
  }

  await initializeDatabase();
  const rows = await client`SELECT MAX(bid_usdc) as max_bid FROM listings` as { max_bid: string | null }[];
  return Number(rows[0]?.max_bid) || 0;
}

export async function getStats(): Promise<{ totalListings: number; totalClicks: number; totalBids: number }> {
  const client = getSql();

  if (!client) {
    const store = getInMemoryStore();
    const listings = Array.from(store.listings.values());
    return {
      totalListings: listings.length,
      totalClicks: listings.reduce((sum, l) => sum + l.clicks, 0),
      totalBids: listings.reduce((sum, l) => sum + Number(l.bid_usdc), 0),
    };
  }

  await initializeDatabase();
  const rows = await client`
    SELECT 
      COUNT(*)::int as total_listings,
      COALESCE(SUM(clicks), 0)::int as total_clicks,
      COALESCE(SUM(bid_usdc), 0) as total_bids
    FROM listings
  ` as { total_listings: number; total_clicks: number; total_bids: string }[];

  return {
    totalListings: rows[0]?.total_listings || 0,
    totalClicks: rows[0]?.total_clicks || 0,
    totalBids: Number(rows[0]?.total_bids) || 0,
  };
}
