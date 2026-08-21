"use client";

import Image from "next/image";
import { TrendingItem } from "@/lib/types";
import { getFaviconUrl, extractDomain, formatNumber } from "@/lib/utils";

interface TrendingListProps {
  items: TrendingItem[];
}

export function TrendingList({ items }: TrendingListProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900">
        <span className="text-lg">🔥</span>
        Trending right now
      </h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <Image
                src={getFaviconUrl(item.url)}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded"
                unoptimized
              />
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-stone-700 hover:text-coral"
              >
                {extractDomain(item.url)}
              </a>
            </div>
            <span className="text-stone-400">
              {formatNumber(item.clicksPerHour)} clicks/h
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
