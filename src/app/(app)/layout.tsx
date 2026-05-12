import Link from "next/link";
import { requireSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-4 flex-wrap">
          <Link href="/ranking" className="font-bold text-lg whitespace-nowrap">
            ⚽ Bolão 2026
          </Link>
          <nav className="flex items-center gap-3 text-sm flex-wrap">
            <Link href="/ranking" className="text-zinc-300 hover:text-emerald-400">
              Ranking
            </Link>
            <Link href="/jogos" className="text-zinc-300 hover:text-emerald-400">
              Jogos
            </Link>
            <Link href="/palpites" className="text-zinc-300 hover:text-emerald-400">
              Meus palpites
            </Link>
            {session.isAdmin && (
              <Link href="/admin" className="text-amber-400 hover:text-amber-300">
                Admin
              </Link>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-zinc-400 hidden sm:inline">{session.name}</span>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-3 py-1"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
