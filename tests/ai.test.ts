import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGeminiHandler } from '../supabase/functions/gemini/handler';

const mocks=vi.hoisted(()=>({key:'', constructClient:vi.fn<(options:unknown)=>void>(), generate:vi.fn(), invoke:vi.fn()}));
vi.mock('../store/useStore',()=>({useStore:{getState:()=>({settings:{geminiApiKey:mocks.key}})}}));
vi.mock('../lib/supabase',()=>({supabase:{functions:{invoke:mocks.invoke}}}));
vi.mock('@google/genai',()=>({GoogleGenAI:class {
  constructor(options:unknown){mocks.constructClient(options);}
  models={generateContent:mocks.generate};
}}));
import { generateAIContent, generateWeddingSticker, validateGeminiKey } from '../services/aiService';

beforeEach(()=>{mocks.key='';mocks.generate.mockResolvedValue({text:'Personal answer'});mocks.invoke.mockResolvedValue({data:{text:'Server answer'},error:null});});
describe('personal key selection and private server fallback',()=>{
  it('uses the configured personal key for ordinary AI calls',async()=>{
    mocks.key='personal-audit-key';
    expect(await generateAIContent(null,'System','Question')).toBe('Personal answer');
    expect(mocks.constructClient).toHaveBeenCalledWith({apiKey:'personal-audit-key'});
    expect(mocks.invoke).not.toHaveBeenCalled();
  });
  it('uses an authenticated server invocation when no personal key exists',async()=>{
    expect(await generateAIContent(null,'System','Question',true)).toBe('Server answer');
    expect(mocks.invoke).toHaveBeenCalledWith('gemini',{body:{kind:'text',systemPrompt:'System',userMessage:'Question',isJson:true}});
    expect(mocks.constructClient).not.toHaveBeenCalled();
  });
  it('does not report key validation success for an empty key or server failure',async()=>{
    await expect(validateGeminiKey('')).rejects.toThrow();
    mocks.invoke.mockResolvedValue({data:null,error:new Error('network')});
    await expect(generateAIContent(null,'System','Question')).rejects.toThrow();
  });
  it('routes sticker creation through the server without a browser system key',async()=>{
    mocks.invoke.mockResolvedValue({data:{image:'data:image/png;base64,AAAA'},error:null});
    expect(await generateWeddingSticker(null,'Couple','Smile',{})).toContain('data:image/png');
  });
});

describe('Edge handler authorization and bounded generation',()=>{
  const body={kind:'text',systemPrompt:'System',userMessage:'Question',isJson:false};
  const request=(value:unknown=body,token='token',origin='https://wedding.example')=>new Request('https://edge.example/gemini',{
    method:'POST',headers:{...(token?{Authorization:`Bearer ${token}`}:{ }),Origin:origin},body:JSON.stringify(value),
  });
  function fixture(){const deps={authorize:vi.fn().mockResolvedValue(true),consumeQuota:vi.fn().mockResolvedValue(true),generate:vi.fn().mockResolvedValue({text:'Safe answer'}),origins:['https://wedding.example']};return {deps,handle:createGeminiHandler(deps)};}
  it('rejects missing/unauthorized tokens before generation',async()=>{
    const {deps,handle}=fixture();expect((await handle(request(body,''))).status).toBe(401);
    deps.authorize.mockResolvedValue(false);expect((await handle(request())).status).toBe(403);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it('enforces origin, schema, quota and content-length limits',async()=>{
    const {deps,handle}=fixture();expect((await handle(request(body,'token','https://other.example'))).status).toBe(403);
    expect((await handle(request({kind:'arbitrary-model'}))).status).toBe(400);
    const huge=request();huge.headers.set('content-length',String(8*1024*1024));expect((await handle(huge)).status).toBe(413);
    deps.consumeQuota.mockResolvedValue(false);expect((await handle(request())).status).toBe(429);
    expect(deps.generate).not.toHaveBeenCalled();
  });
  it('does not reflect secret-bearing upstream exceptions',async()=>{
    const {deps,handle}=fixture();deps.generate.mockRejectedValue(new Error('private-key-in-provider-url'));
    const result=await handle(request());expect(result.status).toBe(502);expect(await result.text()).not.toContain('private-key');
  });
  it('returns the provider result for an authorized valid request',async()=>{
    const {handle}=fixture();const result=await handle(request());expect(result.status).toBe(200);expect(await result.json()).toEqual({text:'Safe answer'});
  });
});
