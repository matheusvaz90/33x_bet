import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {},
        create: {
          id: data.user.id,
          email: data.user.email!,
          name:
            (data.user.user_metadata?.name as string | undefined) ??
            data.user.user_metadata?.full_name ??
            data.user.email!.split("@")[0],
          isAdmin: false,
        },
      });
      return NextResponse.redirect(`${origin}/ranking`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
