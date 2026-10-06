import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request:Request){
  const body=await request.json().catch(()=>({}));
  const orderId=String(body.order_id||""); const callbackStatus=String(body.status||""); const callbackAmount=Number(body.amount||0);
  const transactionId=body.transaction_id?Number(body.transaction_id):null;
  if(!orderId||!["success","failed"].includes(callbackStatus)) return NextResponse.json({error:"Invalid webhook"},{status:400});
  const supabase=createAdminClient();
  const {data:payment,error:findError}=await supabase.from("payments").select("id,business_id,subscription_plan,amount,status").eq("provider_order_id",orderId).maybeSingle();
  if(findError)return NextResponse.json({error:findError.message},{status:500});
  if(!payment)return NextResponse.json({error:"Payment not found"},{status:404});
  if(payment.status==="success")return NextResponse.json({ok:true});
  if(callbackStatus==="success"&&Math.round(Number(payment.amount))!==Math.round(callbackAmount))return NextResponse.json({error:"Amount mismatch"},{status:400});

  let verifiedStatus=callbackStatus; let verifiedAmount=callbackAmount; let verifiedTransaction=transactionId;
  try{
    const vr=await fetch(`https://inpay.uz/api/v1/transactions/?order_id=${encodeURIComponent(orderId)}`,{headers:{Accept:"application/json"},cache:"no-store"});
    if(vr.ok){
      const tx=await vr.json();
      if(tx?.order_id===orderId&&tx?.status) verifiedStatus=String(tx.status);
      if(tx?.amount!==undefined) verifiedAmount=Number(tx.amount);
      if(tx?.transaction_id) verifiedTransaction=Number(tx.transaction_id);
    }
  }catch{}
  if(verifiedStatus==="success"&&Math.round(Number(payment.amount))!==Math.round(verifiedAmount))return NextResponse.json({error:"Verified amount mismatch"},{status:400});

  const now=new Date();
  const {error:updateError}=await supabase.from("payments").update({status:verifiedStatus,provider_transaction_id:verifiedTransaction,paid_at:verifiedStatus==="success"?now.toISOString():null}).eq("id",payment.id);
  if(updateError)return NextResponse.json({error:updateError.message},{status:500});
  if(verifiedStatus==="success"){
    const periodEnd=new Date(now);periodEnd.setMonth(periodEnd.getMonth()+1);
    const {error}=await supabase.from("subscriptions").upsert({business_id:payment.business_id,plan:payment.subscription_plan,status:"active",current_period_end:periodEnd.toISOString(),updated_at:now.toISOString()});
    if(error)return NextResponse.json({error:error.message},{status:500});
  }
  return NextResponse.json({ok:true});
}
