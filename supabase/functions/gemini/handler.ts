export type AIRequest =
  | { kind:'text'; systemPrompt:string; userMessage:string; isJson:boolean }
  | { kind:'sticker'; promptDescription:string; action:string; refImages:Record<string,string> };
interface Dependencies {
  authorize: (token:string) => Promise<boolean>;
  consumeQuota: (token:string) => Promise<boolean>;
  generate: (body:AIRequest) => Promise<{text?:string;image?:string}>;
  origins: string[];
}
const MAX_BODY = 7 * 1024 * 1024;
const text = (value:unknown, max:number) => typeof value==='string' && value.length>0 && value.length<=max;
function validate(body:any): body is AIRequest {
  if (body?.kind==='text') return text(body.systemPrompt,50000) && text(body.userMessage,20000) && typeof body.isJson==='boolean';
  if (body?.kind!=='sticker' || !text(body.promptDescription,3000) || !text(body.action,1000)) return false;
  if (!body.refImages || typeof body.refImages!=='object' || Array.isArray(body.refImages)) return false;
  return Object.entries(body.refImages).every(([k,v]) => ['groom','bride'].includes(k) &&
    typeof v==='string' && v.length<=3*1024*1024 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(v));
}
export function createGeminiHandler(deps:Dependencies) {
  return async (request:Request):Promise<Response> => {
    const origin=request.headers.get('origin');
    const allowed=!origin || deps.origins.includes(origin);
    const headers:Record<string,string>={ 'Content-Type':'application/json', 'Vary':'Origin' };
    if (origin && allowed) headers['Access-Control-Allow-Origin']=origin;
    headers['Access-Control-Allow-Headers']='authorization, apikey, x-client-info, content-type';
    headers['Access-Control-Allow-Methods']='POST, OPTIONS';
    const reply=(status:number,message:string) => new Response(JSON.stringify({error:message}),{status,headers});
    if (!allowed) return reply(403,'Origin not allowed');
    if (request.method==='OPTIONS') return new Response(null,{status:204,headers});
    if (request.method!=='POST') return reply(405,'POST required');
    const bearer=request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer) return reply(401,'Sign in required');
    try {
      if (!await deps.authorize(bearer)) return reply(403,'Plan access required');
      if (Number(request.headers.get('content-length')||0)>MAX_BODY) return reply(413,'Request too large');
      // Read incrementally so an omitted/faked Content-Length cannot bypass the cap.
      const reader=request.body?.getReader(); const chunks:Uint8Array[]=[]; let size=0;
      if (!reader) return reply(400,'Body required');
      while (true) {
        const {value,done}=await reader.read(); if (done) break;
        size+=value.byteLength;
        if (size>MAX_BODY) { await reader.cancel(); return reply(413,'Request too large'); }
        chunks.push(value);
      }
      const bytes=new Uint8Array(size); let offset=0;
      for (const chunk of chunks) { bytes.set(chunk,offset); offset+=chunk.length; }
      let body:unknown;
      try { body=JSON.parse(new TextDecoder().decode(bytes)); } catch { return reply(400,'Invalid JSON'); }
      if (!validate(body)) return reply(400,'Invalid request');
      if (!await deps.consumeQuota(bearer)) return reply(429,'AI usage limit reached; try again later');
      const result=await deps.generate(body);
      return new Response(JSON.stringify(result),{status:200,headers});
    } catch {
      // Never reflect upstream key URLs, headers or raw provider errors.
      return reply(502,'AI service unavailable');
    }
  };
}
