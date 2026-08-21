export interface Listing {
  id: number;
  name: string;
  url: string;
  description: string;
  bidUsdc: number;
  lastBidAt: string;
  clicks: number;
  resourceUrl: string;
  network: string;
  asset: string;
  pricePerCall: string;
  createdAt: string;
}

export interface Activity {
  id: number;
  listingId: number;
  name: string;
  url: string;
  rank: number;
  bidAmount: number;
  createdAt: string;
}

export interface TrendingItem {
  id: number;
  name: string;
  url: string;
  clicksPerHour: number;
}

export interface LeaderboardEntry extends Listing {
  rank: number;
}

export interface BidRequest {
  url: string;
  name?: string;
  description?: string;
  resourceUrl?: string;
  network?: string;
  pricePerCall?: string;
  bidAmount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DiscoveryDoc {
  name: string;
  description: string;
  version: string;
  endpoints: {
    leaderboard: string;
    bid: string;
    listing: string;
  };
  bidRequirements: {
    minBid: number;
    currency: string;
    network: string;
    paymentProtocol: string;
  };
}
