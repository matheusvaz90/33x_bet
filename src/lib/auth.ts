import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

export async function getSession(): Promise<SessionPayload | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Garante que o espelho na tabela User existe (caso o usuário tenha sido
  // criado direto no Supabase Auth fora do nosso fluxo de /register).
  let dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const count = await prisma.user.count();
    const isAdmin = count === 0 || (adminEmail !== "" && email === adminEmail);
    dbUser = await prisma.user.create({
      data: {
        id: user.id,
        email,
        name:
          (user.user_metadata?.name as string | undefined) ||
          email.split("@")[0] ||
          "Usuário",
        isAdmin,
      },
    });
  }

  return {
    sub: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    isAdmin: dbUser.isAdmin,
  };
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const s = await requireSession();
  if (!s.isAdmin) redirect("/ranking");
  return s;
}
