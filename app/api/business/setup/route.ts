import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const name = String(body.businessName || "Mening biznesim").trim().slice(0, 120);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "biznes";

  const { data: existing } = await supabase.from("business_members").select("business_id").eq("user_id", userData.user.id).limit(1);
  if (existing?.[0]?.business_id) return NextResponse.json({ business_id: existing[0].business_id });

  const { data: business, error } = await supabase.from("businesses").insert({
    name,
    slug: slug + "-" + userData.user.id.slice(0, 6),
    owner_id: userData.user.id
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from("business_members").insert({
    business_id: business.id,
    user_id: userData.user.id,
    role: "owner"
  });
  await supabase.from("bot_settings").insert({ business_id: business.id });
  await supabase.from("subscriptions").insert({ business_id: business.id, plan: "free", status: "active" });

  return NextResponse.json({ business_id: business.id });
}
