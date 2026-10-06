import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function getInPayToken(){
  const merchantId=process.env.INPAY_MERCHANT_ID, merchantToken=process.env.INPAY_MERCHANT_TOKEN;
  if(!merchantId||!merchantToken) throw new Error("InPay credentials missing");
  const r=await fetch(`https://inpay.uz/api/v1/authorization/?merchant_id=${encodeURIComponent(merchantId)}&merchant_token=${encodeURIComponent(merchantToken)}`,{cache:"no-store"});
  const d=await r.json(); if(!r.ok||!d.token) throw new Error("InPay authorization failed"); return {merchantId,token:d.token};
}
export async function POST(request:Request){
  const body=await request.json().catch(()=>({}));
  const orderId=String(body.order_id||""); const callbackStatus=String(body.status||""); const callbackAmount=Number(body.amount||0);
  const transactionId=body.transaction_id?Number(body.transaction_id):null;
  if(!orderId||!["success","failed","cancelled","pending"].includes(callbackStatus)) return NextResponse.json({error:"Invalid webhook"},{status:400});
  const supabase=createAdminClient();
  const {data:payment,error:findError}=await supabase.from("payments").select("id,business_id,subscription_plan,amount,status").eq("provider_order_id",orderId).maybeSingle();
  if(findError)return NextResponse.json({error:findError.message},{status:500});
  if(!payment)return NextResponse.json({error:"Payment not found"},{status:404});
  if(payment.status==="success")return NextResponse.json({ok:true});
  if(callbackStatus==="success"&&Math.round(Number(payment.amount))!==Math.round(callbackAmount))return NextResponse.json({error:"Amount mismatch"},{status:400});
  let verifiedStatus=callbackStatus, verifiedTransaction=transactionId;
  try{
    const {merchantId,token}=await getInPayToken();
    const vr=await fetch(`https://inpay.uz/api/v1/transactions/?merchant_id=${encodeURIComponent(merchantId)}&token=${encodeURIComponent(token)}&order_id=${encodeURIComponent(orderId)}`,{cache:"no-store"});
    if(vr.ok){const vd=await vr.json();const tx=Array.isArray(vd)?vd[0]:(vd.data?.[0]||vd.results?.[0]||vd);if(tx?.status)verifiedStatus=String(tx.status);if(tx?.transaction_id)verifiedTransaction=Number(tx.transaction_id);}
  }catch{ /* callback remains the fallback; amount/order are still checked */ }
  const now=new Date();
  await supabase.from("payments").update({status:verifiedStatus,provider_transaction_id:verifiedTransaction,paid_at:verifiedStatus==="success"?now.toISOString():null}).eq("id",payment.id);
  if(verifiedStatus==="success"){
    const periodEnd=new Date(now);periodEnd.setMonth(periodEnd.getMonth()+1);
    const {error}=await supabase.from("subscriptions").upsert({business_id:payment.business_id,plan:payment.subscription_plan,status:"active",current_period_end:periodEnd.toISOString(),updated_at:now.toISOString()});
    if(error)return NextResponse.json({error:error.message},{status:500});
  }
  return NextResponse.json({ok:true});
}
