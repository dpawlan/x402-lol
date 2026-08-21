"use client";

import Image from "next/image";
import { Activity } from "@/lib/types";
import { formatTimeAgo, getFaviconUrl, extractDomain } from "@/lib/utils";

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm dark:bg-stone-800">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
        Latest activity
      </h3>
      <ul className="space-y-2">
        {activities.map((activity) => (
          <li
            key={activity.id}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <Image
                src={getFaviconUrl(activity.url)}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded"
                unoptimized
              />
              <a
                href={activity.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-stone-700 hover:text-coral dark:text-stone-300"
              >
                {extractDomain(activity.url)}
              </a>
              <span className="text-stone-400">
                at #{activity.rank} · ${activity.bidAmount}
              </span>
            </div>
            <span className="text-stone-400 dark:text-stone-500">
              {formatTimeAgo(activity.createdAt)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
