import Link from "next/link";
import { requireSession } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[color:var(--c-bg)]/80 border-b border-[color:var(--c-border)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-5 flex-wrap">
          <Link href="/ranking" className="flex items-center gap-2 group">
            <span className="text-2xl">🏆</span>
            <div className="flex flex-col leading-none">
              <span className="font-display text-2xl tracking-wider">BOLÃO</span>
              <span className="font-display text-[0.65rem] tracking-[0.3em] wc-gradient-text">
                COPA 2026
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 text-sm font-semibold uppercase tracking-wider">
            <NavLink href="/ranking">Ranking</NavLink>
            <NavLink href="/jogos">Jogos</NavLink>
            <NavLink href="/times">Seleções</NavLink>
            <NavLink href="/palpites">Palpites</NavLink>
            {session.isAdmin && (
              <NavLink href="/admin" highlight>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-sm">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-zinc-400 text-[0.7rem] uppercase tracking-widest">
                Logado
              </span>
              <span className="font-semibold">{session.name}</span>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="bg-zinc-900 hover:bg-zinc-800 border border-[color:var(--c-border)] rounded-lg px-3 py-1.5 text-xs uppercase tracking-wider font-semibold"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
        <div className="h-[2px] wc-gradient" />
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">{children}</main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-xs text-zinc-600">
        <span className="font-display tracking-[0.3em]">🇺🇸 USA · 🇨🇦 CANADA · 🇲🇽 MÉXICO</span>
        <div className="mt-1">Bolão Copa do Mundo 2026</div>
      </footer>
    </div>
  );
}

function NavLink({
  href,
  children,
  highlight,
}: {
  href: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "px-3 py-1.5 rounded-lg transition-colors " +
        (highlight
          ? "text-amber-300 hover:bg-amber-500/10"
          : "text-zinc-300 hover:text-white hover:bg-white/5")
      }
    >
      {children}
    </Link>
  );
}
