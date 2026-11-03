import { createClient } from 'npm:@supabase/supabase-js@2.108.1';
import { createGeminiHandler, type AIRequest } from './handler.ts';

const required=(name:string) => { const value=Deno.env.get(name); if (!value) throw new Error(`Missing server configuration: ${name}`); return value; };
const projectUrl=required('SUPABASE_URL');
const publishableKey=required('SUPABASE_ANON_KEY');
const apiKey=required('GEMINI_API_KEY');
const planUid=required('OWNER_PLAN_UID');
const origins=required('ALLOWED_ORIGINS').split(',').map(s=>s.trim()).filter(Boolean);
const client=(token:string) => createClient(projectUrl,publishableKey,{
  global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false},
});
async function generate(body:AIRequest) {
  const model=body.kind==='text' ? (Deno.env.get('GEMINI_TEXT_MODEL')||'gemini-2.5-flash') : (Deno.env.get('GEMINI_IMAGE_MODEL')||'gemini-2.5-flash-image');
  const parts:any[]=[];
  if (body.kind==='sticker') {
    parts.push({text:`Create a cute wedding sticker on a white background. Appearance: ${body.promptDescription}. Pose: ${body.action}.`});
    for(const [person,url] of Object.entries(body.refImages)) {
      const match=url.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
      if(match) parts.push({text:`Reference for ${person}:`},{inlineData:{mimeType:match[1],data:match[2]}});
    }
  } else parts.push({text:body.userMessage});
  const payload:any={contents:[{role:'user',parts}]};
  if(body.kind==='text') {
    payload.systemInstruction={parts:[{text:body.systemPrompt}]};
    payload.generationConfig={responseMimeType:body.isJson?'application/json':'text/plain',maxOutputTokens:body.isJson?8192:4096};
  }
  const response=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
    method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},body:JSON.stringify(payload),signal:AbortSignal.timeout(60000),
  });
  if(!response.ok) throw new Error('Provider request failed');
  const result=await response.json(); const output=result.candidates?.[0]?.content?.parts||[];
  if(body.kind==='text') {
    const value=output.map((p:any)=>p.text||'').join(''); if(!value) throw new Error('Empty provider result'); return {text:value};
  }
  const image=output.find((p:any)=>p.inlineData)?.inlineData;
  if(!image) throw new Error('Empty image result');
  return {image:`data:${image.mimeType};base64,${image.data}`};
}
Deno.serve(createGeminiHandler({origins,generate,
  authorize:async token => {
    const caller=client(token); const {data,error}=await caller.auth.getUser(token);
    if(error||!data.user) return false;
    const permission=await caller.rpc('can_manage_plan',{plan_uid:planUid});
    return !permission.error&&permission.data===true;
  },
  consumeQuota:async token => {
    const result=await client(token).rpc('consume_ai_quota',{plan_uid:planUid});
    return !result.error&&result.data===true;
  },
}));
