"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Customer={id:string;name:string;phone:string|null;email:string|null;notes:string|null;created_at:string};

export default function Customers(){
  const [items,setItems]=useState<Customer[]>([]);
  const [form,setForm]=useState({name:"",phone:"",email:"",notes:""});
  const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState("");
  async function load(){const r=await fetch("/api/customers");const d=await r.json();if(r.ok)setItems(d.data||[]);else setMessage(d.error||"Yuklashda xato.");setLoading(false);}
  useEffect(()=>{load()},[]);
  async function save(e:React.FormEvent){e.preventDefault();setSaving(true);setMessage("");const r=await fetch("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const d=await r.json();if(!r.ok)setMessage(d.error||"Saqlanmadi.");else{setForm({name:"",phone:"",email:"",notes:""});await load();}setSaving(false);}
  async function remove(id:string){if(!confirm("Bu mijozni o‘chirishni xohlaysizmi?"))return;const r=await fetch("/api/customers?id="+encodeURIComponent(id),{method:"DELETE"});const d=await r.json();if(!r.ok)setMessage(d.error||"O‘chirilmadi.");else setItems(x=>x.filter(c=>c.id!==id));}
  return <main className="dashboard"><div className="dashhead"><div><div className="brand">Biznes<span>chi</span></div><h1>Mijozlar</h1></div><Link className="btn secondary" href="/dashboard">Dashboard</Link></div>
    <div className="panel"><h2>Yangi mijoz</h2><form onSubmit={save} className="formgrid"><input className="wideinput" placeholder="Ism / kompaniya *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><input className="wideinput" placeholder="Telefon" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><input className="wideinput" type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/><input className="wideinput" placeholder="Izoh" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/><button className="btn primary" disabled={saving}>{saving?"Saqlanmoqda...":"Mijoz qo‘shish"}</button></form>{message&&<p className="muted">{message}</p>}</div>
    <div className="panel"><h2>Mijozlar ro‘yxati</h2>{loading?<p>Yuklanmoqda...</p>:items.length===0?<p className="muted">Hali mijozlar yo‘q.</p>:items.map(c=><div className="row" key={c.id}><span><b>{c.name}</b><br/><small>{c.phone||c.email||"Kontakt ko‘rsatilmagan"}</small></span><span><small>{new Date(c.created_at).toLocaleDateString("uz-UZ")}</small> <button className="btn danger" onClick={()=>remove(c.id)}>O‘chirish</button></span></div>)}</div>
  </main>;
}