import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stone-200 bg-cream/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-stone-900">
            <span className="text-coral">≡</span> AgenticCommerce.lol
          </span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            Leaderboard
          </Link>
          <Link
            href="/rules"
            className="text-sm font-medium text-stone-600 hover:text-stone-900"
          >
            Rules
          </Link>
        </nav>
      </div>
    </header>
  );
}
