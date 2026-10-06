"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function Settings() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function connect(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    const res = await fetch("/api/telegram/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    setStatus(data.ok ? "@" + (data.bot.username || "bot") + " muvaffaqiyatli ulandi." : data.error || "Xatolik yuz berdi.");
    if (data.ok) setToken("");
    setLoading(false);
  }

  return (
    <main className="dashboard">
      <div className="dashhead">
        <div><div className="brand">Biznes<span>chi</span></div><h1>Sozlamalar</h1></div>
        <Link className="btn secondary" href="/dashboard">Dashboard</Link>
      </div>
      <div className="panel">
        <h2>Telegram bot</h2>
        <p>BotFather bergan tokenni kiriting. Token serverda saqlanadi va webhook Supabase Edge Function orqali ishlaydi.</p>
        <form onSubmit={connect}>
          <label>Bot token
            <input className="wideinput" type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="123456:ABC..." required />
          </label>
          <button className="btn primary" disabled={loading}>{loading ? "Ulanmoqda..." : "Botni ulash"}</button>
        </form>
        {status && <p className="muted">{status}</p>}
      </div>
      <div className="panel">
        <h2>Tarif</h2>
        <p><b>Free</b> — 50 mijoz, 100 buyurtma/oy.</p>
        <Link className="btn primary" href="/subscription">Tariflarni ko‘rish</Link>
      </div>
    </main>
  );
}
