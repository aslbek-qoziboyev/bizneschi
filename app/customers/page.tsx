import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Customers() {
  const supabase = createClient();
  const { data: memberships } = await supabase.from("business_members").select("business_id").limit(1);
  const businessId = memberships?.[0]?.business_id;
  const { data } = businessId ? await supabase.from("biz_customers").select("id,name,phone,email,created_at").eq("business_id", businessId).order("created_at", { ascending: false }) : { data: [] };

  return <main className="dashboard">
    <div className="dashhead"><div><div className="brand">Biznes<span>chi</span></div><h1>Mijozlar</h1></div><Link className="btn secondary" href="/dashboard">Dashboard</Link></div>
    <div className="panel">{(data ?? []).length === 0 ? <p className="muted">Hali mijozlar yo‘q. Telegram bot orqali birinchi xabar kelganda mijoz avtomatik yaratiladi.</p> : (data ?? []).map(c => <div className="row" key={c.id}><span><b>{c.name}</b><br/><small>{c.phone || c.email || "Telegram mijoz"}</small></span><span>{new Date(c.created_at).toLocaleDateString("uz-UZ")}</span></div>)}</div>
  </main>;
}
