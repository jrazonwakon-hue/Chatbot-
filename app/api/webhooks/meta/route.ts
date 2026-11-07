import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { POST as answerQuestion } from "@/app/api/answer/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a:string,b:string){const left=Buffer.from(a);const right=Buffer.from(b);return left.length===right.length&&timingSafeEqual(left,right);}
export async function GET(request:Request){
 const url=new URL(request.url);const mode=url.searchParams.get("hub.mode");const token=url.searchParams.get("hub.verify_token");const challenge=url.searchParams.get("hub.challenge");
 if(mode==="subscribe"&&token&&challenge&&process.env.META_WEBHOOK_VERIFY_TOKEN&&safeEqual(token,process.env.META_WEBHOOK_VERIFY_TOKEN))return new Response(challenge,{status:200});
 return new Response("Forbidden",{status:403});
}
async function sendText(platform:"whatsapp"|"messenger"|"instagram",recipient:string,message:string,phoneNumberId?:string){
 const version=process.env.META_GRAPH_API_VERSION||"v26.0";
 const token=platform==="whatsapp"?process.env.WHATSAPP_ACCESS_TOKEN:process.env.META_PAGE_ACCESS_TOKEN;
 const sender=platform==="whatsapp"?phoneNumberId:platform==="messenger"?process.env.META_PAGE_ID:process.env.META_INSTAGRAM_ID||process.env.META_PAGE_ID;
 if(!token||!sender)throw new Error("Identifiants Meta manquants pour ce canal.");
 const endpoint=platform==="whatsapp"?`https://graph.facebook.com/${version}/${sender}/messages`:`https://graph.facebook.com/${version}/${sender}/messages`;
 const body=platform==="whatsapp"?{messaging_product:"whatsapp",to:recipient,type:"text",text:{body:message}}:{recipient:{id:recipient},messaging_type:"RESPONSE",message:{text:message}};
 const response=await fetch(endpoint,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify(body),cache:"no-store"});
 if(!response.ok)throw new Error(`Meta API error ${response.status}`);
}
export async function POST(request:Request){
 const raw=await request.text();const signature=request.headers.get("x-hub-signature-256")||"";const secret=process.env.META_APP_SECRET;
 if(!secret)return NextResponse.json({error:"Webhook Meta non configuré."},{status:503});
 const expected="sha256="+createHmac("sha256",secret).update(raw).digest("hex");
 if(!signature||!safeEqual(signature,expected))return NextResponse.json({error:"Signature invalide."},{status:401});
 let payload:any;try{payload=JSON.parse(raw);}catch{return NextResponse.json({error:"JSON invalide."},{status:400});}
 try{
  if(payload.object==="whatsapp_business_account"){
   for(const entry of payload.entry||[])for(const change of entry.changes||[]){
    if(change.field!=="messages")continue;
    const value=change.value||{};const phoneId=value.metadata?.phone_number_id;
    for(const msg of value.messages||[]){
     if(msg.type!=="text"||!msg.from||!msg.text?.body)continue;
     const answer=await answerQuestion(new Request("https://sante-plus.local/api/answer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:msg.text.body})}));
     const result=await answer.json();await sendText("whatsapp",msg.from,result.answer||"Merci. Pour une question médicale qui dépasse mes connaissances, contactez un professionnel de santé.",phoneId);
    }
   }
  }else if(payload.object==="page"||payload.object==="instagram"){
   const platform=payload.object==="instagram"?"instagram":"messenger";
   for(const entry of payload.entry||[])for(const event of entry.messaging||[]){
    const text=event.message?.text;const sender=event.sender?.id;
    if(!text||!sender||event.message?.is_echo)continue;
    const answer=await answerQuestion(new Request("https://sante-plus.local/api/answer",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question:text})}));
    const result=await answer.json();await sendText(platform,sender,result.answer||"Je vous invite à contacter un professionnel de santé.");
   }
  }
  return NextResponse.json({received:true});
 }catch(error){
  console.error("Meta webhook processing failed:",error instanceof Error?error.message:"unknown error");
  return NextResponse.json({received:true,processing:"deferred"});
 }
}
