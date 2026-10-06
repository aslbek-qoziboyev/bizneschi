import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const token = String(body.token || "").trim();
  if (!token || token.length < 20) return NextResponse.json({ error: "Bot token noto‘g‘ri." }, { status: 400 });

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return NextResponse.json({ error: "Biznes akkaunti topilmadi." }, { status: 404 });

  const meResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const me = await meResponse.json();
  if (!me.ok) return NextResponse.json({ error: "Telegram token qabul qilinmadi." }, { status: 400 });

  const webhookSecret = randomUUID().replace(/[^A-Za-z0-9_-]/g, "");
  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const webhookUrl = `${projectUrl}/functions/v1/telegram-webhook/${membership.business_id}`;

  const webhookResponse = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: webhookUrl, secret_token: webhookSecret, allowed_updates: ["message"] })
  });
  const webhook = await webhookResponse.json();
  if (!webhook.ok) return NextResponse.json({ error: webhook.description || "Webhook ulanmadi." }, { status: 400 });

  const { error } = await supabase.from("telegram_bots").upsert({
    business_id: membership.business_id,
    bot_id: me.result.id,
    username: me.result.username || null,
    display_name: me.result.first_name || null,
    token,
    webhook_secret: webhookSecret,
    enabled: true
  }, { onConflict: "business_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    ok: true,
    bot: { username: me.result.username, name: me.result.first_name }
  });
}
