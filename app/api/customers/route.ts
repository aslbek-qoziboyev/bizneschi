import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase=createClient();
  const {data:u}=await supabase.auth.getUser();
  if(!u.user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data:m}=await supabase.from("business_members").select("business_id").eq("user_id",u.user.id).limit(1).maybeSingle();
  if(!m) return NextResponse.json({error:"Biznes topilmadi"},{status:404});
  const b=await request.json();
  const name=String(b.name||"").trim();
  if(!name) return NextResponse.json({error:"Mijoz nomi kerak"},{status:400});
  const {data,error}=await supabase.from("biz_customers").insert({business_id:m.business_id,name,phone:b.phone||null,email:b.email||null,notes:b.notes||null}).select().single();
  if(error) return NextResponse.json({error:error.message},{status:400});
  return NextResponse.json({data});
}
