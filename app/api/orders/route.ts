import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase=createClient();
  const {data:u}=await supabase.auth.getUser();
  if(!u.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data:m}=await supabase.from("business_members").select("business_id").eq("user_id",u.user.id).limit(1).maybeSingle();
  if(!m) return NextResponse.json({error:"Biznes topilmadi"},{status:404});
  const b=await request.json();
  const total=Number(b.total);
  if(!Number.isFinite(total)||total<0) return NextResponse.json({error:"Summa noto‘g‘ri"},{status:400});
  const {data,error}=await supabase.from("biz_orders").insert({business_id:m.business_id,customer_id:b.customer_id||null,total,status:b.status||"new",note:b.note||null}).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({data});
}
