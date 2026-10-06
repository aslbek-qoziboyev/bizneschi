"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const supabase = createClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { business_name: businessName } },
          });

    if (result.error) {
      setMessage(result.error.message);
      setLoading(false);
      return;
    }

    if (mode === "register") {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await fetch("/api/business/setup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessName }) });
        window.location.href = "/dashboard";
      } else {
        setMessage("Emailingizni tasdiqlang. Keyin login qiling.");
        setLoading(false);
      }
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="auth">
      <div className="authbox">
        <div className="brand">Biznes<span>chi</span></div>
        <h1>{mode === "login" ? "Xush kelibsiz" : "Biznes akkaunt yarating"}</h1>
        <p className="muted">
          {mode === "login" ? "Hisobingizga kiring." : "Biznesingizni boshqarishni boshlang."}
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Biznes nomi
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Masalan: Xiva Market" required />
            </label>
          )}
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="siz@biznes.uz" required />
          </label>
          <label>
            Parol
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Kamida 6 belgi" minLength={6} required />
          </label>
          {message && <p className="muted">{message}</p>}
          <button className="btn primary full" disabled={loading}>
            {loading ? "Kutilmoqda..." : mode === "login" ? "Kirish" : "Akkaunt yaratish"}
          </button>
        </form>

        <button className="switch" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }}>
          {mode === "login" ? "Yangi akkaunt yaratish" : "Menda akkaunt bor"}
        </button>
        <Link className="back" href="/">← Bosh sahifa</Link>
      </div>
    </main>
  );
}
