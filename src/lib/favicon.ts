/**
 * Resolve a site's real favicon server-side. Google's S2 service only knows
 * sites it has crawled and assumes /favicon.ico, so brand-new x402 resources
 * (which often only ship a framework-generated /icon.svg) get a generic globe.
 */

const UA = "Mozilla/5.0 (compatible; x402-leaderboard-bot/1.0)";
const TIMEOUT_MS = 6000;
const MAX_HTML = 256 * 1024;

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal, redirect: "follow", headers: { "user-agent": UA, ...(init.headers || {}) } });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function isImage(url: string): Promise<boolean> {
  const res = await fetchWithTimeout(url, { method: "GET" });
  if (!res || !res.ok) return false;
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  // Some hosts serve icons with octet-stream; accept anything that isn't clearly HTML/text.
  return ct.startsWith("image/") || (!ct.includes("text/html") && !ct.includes("application/json"));
}

function extractIconHrefs(html: string): string[] {
  const links = html.match(/<link\b[^>]*>/gi) || [];
  const scored: { href: string; score: number }[] = [];
  for (const tag of links) {
    const rel = (tag.match(/\brel\s*=\s*["']([^"']+)["']/i)?.[1] || "").toLowerCase();
    if (!/\bicon\b/.test(rel)) continue;
    const href = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    const sizes = tag.match(/\bsizes\s*=\s*["']([^"']+)["']/i)?.[1] || "";
    const type = (tag.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1] || "").toLowerCase();
    let score = 0;
    if (rel.includes("apple-touch-icon")) score += 30; // usually the nicest raster
    if (type.includes("svg") || href.endsWith(".svg")) score += 25;
    if (type.includes("png") || href.endsWith(".png")) score += 20;
    const px = parseInt(sizes, 10);
    if (!Number.isNaN(px)) score += Math.min(px, 256) / 16;
    if (rel === "icon" || rel === "shortcut icon") score += 5;
    scored.push({ href, score });
  }
  return scored.sort((a, b) => b.score - a.score).map((s) => s.href);
}

export async function resolveFavicon(siteUrl: string): Promise<string | null> {
  let origin: URL;
  try {
    origin = new URL(siteUrl);
  } catch {
    return null;
  }

  const page = await fetchWithTimeout(origin.toString(), { headers: { accept: "text/html" } });
  if (page && page.ok) {
    const finalUrl = new URL(page.url || origin.toString());
    const html = (await page.text()).slice(0, MAX_HTML);
    for (const href of extractIconHrefs(html)) {
      try {
        const abs = new URL(href, finalUrl).toString();
        if (abs.startsWith("data:")) {
          if (/^data:image\//i.test(abs)) return abs;
          continue;
        }
        if (await isImage(abs)) return abs;
      } catch {
        /* skip bad href */
      }
    }
    const ico = new URL("/favicon.ico", finalUrl).toString();
    if (await isImage(ico)) return ico;
  } else {
    const ico = new URL("/favicon.ico", origin).toString();
    if (await isImage(ico)) return ico;
  }

  const ddg = `https://icons.duckduckgo.com/ip3/${origin.hostname}.ico`;
  const res = await fetchWithTimeout(ddg);
  if (res && res.ok) return ddg;

  return null;
}
