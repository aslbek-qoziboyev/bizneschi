import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const orderId = String(body.order_id || "");
  const status = String(body.status || "");
  const amount = Number(body.amount || 0);
  const transactionId = body.transaction_id ? Number(body.transaction_id) : null;

  if (!orderId || !["success", "failed"].includes(status)) return NextResponse.json({ error: "Invalid webhook" }, { status: 400 });

  const supabase = createClient();
  const { data: payment } = await supabase.from("payments").select("id,business_id,subscription_plan,amount,status").eq("provider_order_id", orderId).maybeSingle();
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

  if (payment.status === "success") return NextResponse.json({ ok: true });

  if (status === "success" && Math.round(Number(payment.amount)) !== Math.round(amount)) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase.from("payments").update({
    status,
    provider_transaction_id: transactionId,
    paid_at: status === "success" ? now.toISOString() : null
  }).eq("id", payment.id);

  if (status === "success") {
    await supabase.from("subscriptions").upsert({
      business_id: payment.business_id,
      plan: payment.subscription_plan,
      status: "active",
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString()
    });
  }

  return NextResponse.json({ ok: true });
}
