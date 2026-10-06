"use client";

import Link from "next/link";
import { useState } from "react";

const plans = [
  { id: "free", name: "Free", price: 0, features: ["50 mijoz", "100 buyurtma/oy", "Telegram bot"] },
  { id: "pro", name: "Pro", price: 49000, features: ["500 mijoz", "1 000 buyurtma/oy", "Telegram avtomatika", "Hisobotlar"] },
  { id: "business", name: "Business", price: 99000, features: ["Cheksiz mijoz", "Cheksiz buyurtma", "Kengaytirilgan bot", "Prioritet support"] }
];

export default function Subscription() {
  const [loading, setLoading] = useState("");
  const [message, setMessage] = useState("");

  async function pay(plan: string) {
    if (plan === "free") return;
    setLoading(plan);
    setMessage("");
    const res = await fetch("/api/payments/inpay/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error || "To‘lov yaratilmadi.");
    else window.location.href = data.pay_url;
    setLoading("");
  }

  return (
    <main className="dashboard">
      <div className="dashhead"><div><div className="brand">Biznes<span>chi</span></div><h1>Tariflar</h1></div><Link className="btn secondary" href="/dashboard">Dashboard</Link></div>
      {message && <div className="panel"><p className="muted">{message}</p></div>}
      <div className="grid">
        {plans.map((plan) => (
          <div className="panel" key={plan.id}>
            <h2>{plan.name}</h2>
            <h3>{plan.price === 0 ? "Bepul" : plan.price.toLocaleString("uz-UZ") + " so‘m / oy"}</h3>
            {plan.features.map((x) => <p key={x}>✓ {x}</p>)}
            {plan.id !== "free" && <button className="btn primary full" onClick={() => pay(plan.id)} disabled={!!loading}>{loading === plan.id ? "Invoice yaratilmoqda..." : "InPay orqali to‘lash"}</button>}
          </div>
        ))}
      </div>
    </main>
  );
}
