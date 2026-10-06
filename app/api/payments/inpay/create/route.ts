import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const prices: Record<string, number> = { pro: 49000, business: 99000 };

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.from("business_members").select("business_id").eq("user_id", userData.user.id).limit(1).maybeSingle();
  if (!member) return NextResponse.json({ error: "Biznes topilmadi." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const plan = String(body.plan || "");
  const amount = prices[plan];
  if (!amount) return NextResponse.json({ error: "Noto‘g‘ri tarif." }, { status: 400 });

  const merchantId = process.env.INPAY_MERCHANT_ID;
  const merchantToken = process.env.INPAY_MERCHANT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!merchantId || !merchantToken || !appUrl) return NextResponse.json({ error: "InPay hali production sozlanmagan." }, { status: 503 });

  const auth = await fetch("https://inpay.uz/api/v1/authorization/?merchant_id=" + encodeURIComponent(merchantId) + "&merchant_token=" + encodeURIComponent(merchantToken), { headers: { Accept: "application/json" } });
  const authData = await auth.json();
  if (!authData.success) return NextResponse.json({ error: "InPay authorization xatosi." }, { status: 502 });

  const description = "Bizneschi " + plan + " subscription";
  const callbackUrl = appUrl + "/api/payments/inpay/webhook";
  const returnUrl = appUrl + "/subscription?payment=return";

  const payment = await fetch("https://inpay.uz/api/v1/create/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + authData.bearer_token },
    body: JSON.stringify({ merchant_id: merchantId, token: merchantToken, amount, description, callback_url: callbackUrl, return_url: returnUrl })
  });
  const data = await payment.json();
  if (!data.success) return NextResponse.json({ error: data.message || "InPay invoice yaratmadi." }, { status: 502 });

  const { error } = await supabase.from("payments").insert({
    business_id: member.business_id,
    subscription_plan: plan,
    amount,
    provider: "inpay",
    provider_order_id: data.order_id,
    status: "pending",
    pay_url: data.pay_url,
    description
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ pay_url: data.pay_url, order_id: data.order_id });
}
