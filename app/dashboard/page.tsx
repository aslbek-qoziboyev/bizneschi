import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) return null;

  const { data: memberships } = await supabase
    .from("business_members")
    .select("business_id, businesses(id,name)")
    .eq("user_id", user.id)
    .limit(1);

  const business = memberships?.[0]?.businesses as { id: string; name: string } | undefined;
  if (!business) {
    return (
      <main className="dashboard">
        <div className="panel">
          <h1>Biznes akkauntingiz tayyorlanmoqda</h1>
          <p>Login sahifasidan biznes nomi bilan qayta ro‘yxatdan o‘ting yoki support bilan bog‘laning.</p>
        </div>
      </main>
    );
  }

  const [customers, orders, recentOrders, subscription] = await Promise.all([
    supabase.from("biz_customers").select("id", { count: "exact", head: true }).eq("business_id", business.id),
    supabase.from("biz_orders").select("id,total", { count: "exact" }).eq("business_id", business.id),
    supabase.from("biz_orders").select("id,order_number,total,status,created_at,biz_customers(name)").eq("business_id", business.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("subscriptions").select("plan,status").eq("business_id", business.id).maybeSingle()
  ]);

  const revenue = (orders.data ?? []).reduce((sum, order) => sum + Number(order.total || 0), 0);

  return (
    <main className="dashboard">
      <div className="dashhead">
        <div><div className="brand">Biznes<span>chi</span></div><h1>{business.name}</h1></div>
        <Link className="btn secondary" href="/settings">Sozlamalar</Link>
      </div>

      <nav className="panel">
        <Link href="/customers">Mijozlar</Link> · <Link href="/orders">Buyurtmalar</Link> · <Link href="/settings">Telegram</Link> · <Link href="/subscription">Subscription</Link>
      </nav>

      <div className="grid">
        <div className="metric"><small>Mijozlar</small><strong>{customers.count ?? 0}</strong></div>
        <div className="metric"><small>Buyurtmalar</small><strong>{orders.count ?? 0}</strong></div>
        <div className="metric"><small>Jami savdo</small><strong>{revenue.toLocaleString("uz-UZ")} so‘m</strong></div>
      </div>

      <div className="panel">
        <h2>So‘nggi buyurtmalar</h2>
        {(recentOrders.data ?? []).length === 0 && <p className="muted">Hali buyurtmalar yo‘q.</p>}
        {(recentOrders.data ?? []).map((order) => (
          <div className="row" key={order.id}>
            <span><b>#{order.order_number}</b> · {order.biz_customers?.[0]?.name ?? "Noma’lum mijoz"}</span>
            <span>{Number(order.total).toLocaleString("uz-UZ")} so‘m · <span className="badge">{order.status}</span></span>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Telegram bot</h2>
        <p>Holat: <span className="badge">Sozlamalarda ulash mumkin</span></p>
        <p>Tarif: <b>{subscription.data?.plan ?? "free"}</b></p>
      </div>
    </main>
  );
}
