import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { name, email, password } = body;

  const normName = String(name ?? "").trim();
  const normEmail = String(email ?? "").toLowerCase().trim();
  const normPass = String(password ?? "");

  if (!normName || normName.length < 2 || !normEmail || normPass.length < 6) {
    return NextResponse.json(
      { error: "Dados inválidos (nome mín. 2 caracteres, senha mín. 6)" },
      { status: 400 },
    );
  }

  // 1. Criar usuário no Supabase Auth (sem confirmação de email)
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.createUser({
    email: normEmail,
    password: normPass,
    email_confirm: true,
    user_metadata: { name: normName },
  });

  if (error || !data.user) {
    const isAlreadyExists =
      error?.message?.toLowerCase().includes("already") ||
      error?.message?.toLowerCase().includes("duplicate") ||
      (error as { status?: number } | null)?.status === 422;
    const msg = isAlreadyExists ? "Email já cadastrado" : error?.message || "Erro no cadastro";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 2. Espelhar na tabela User do Prisma — best-effort
  // Se o banco estiver indisponível, getSession() recria o registro na próxima requisição
  try {
    const count = await prisma.user.count();
    const adminEmail = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const isAdmin = count === 0 || (adminEmail !== "" && normEmail === adminEmail);
    await prisma.user.upsert({
      where: { id: data.user.id },
      create: { id: data.user.id, email: normEmail, name: normName, isAdmin },
      update: { email: normEmail, name: normName },
    });
  } catch (dbErr) {
    console.error("[register] prisma mirror failed (getSession irá sincronizar):", dbErr);
  }

  // 3. Login automático após cadastro
  const supabase = await createSupabaseServer();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normEmail,
    password: normPass,
  });

  if (signInError) {
    console.error("[register] auto-login failed:", signInError);
    return NextResponse.json(
      { error: "Conta criada! Mas o login automático falhou — entre manualmente." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
