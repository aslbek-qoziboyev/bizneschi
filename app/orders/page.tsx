import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Orders() {
  const supabase = createClient();
  const { data: membership } = await supabase.from("business_members").select("business_id").limit(1).maybeSingle();
  const id = membership?.business_id;
  const { data: orders } = id ? await supabase.from("biz_orders").select("id,order_number,total,status,payment_status,created_at").eq("business_id", id).order("created_at", { ascending: false }) : { data: [] };

  return <main className="dashboard">
    <div className="dashhead"><div><div className="brand">Biznes<span>chi</span></div><h1>Buyurtmalar</h1></div><Link className="btn secondary" href="/dashboard">Dashboard</Link></div>
    <div className="panel">
      {(orders ?? []).map(o => <div className="row" key={o.id}><span><b>#{o.order_number}</b> · {new Date(o.created_at).toLocaleDateString("uz-UZ")}</span><span>{Number(o.total).toLocaleString("uz-UZ")} so‘m · <span className="badge">{o.payment_status === "paid" ? "To‘langan" : o.payment_status === "pending" ? "Kutilmoqda" : o.status}</span></span></div>)}
      {(orders ?? []).length === 0 && <p className="muted">Hali buyurtmalar yo‘q.</p>}
    </div>
  </main>;
}
