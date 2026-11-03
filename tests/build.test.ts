// @vitest-environment node
import { build } from 'vite';
import { expect, it } from 'vitest';

it('does not put system credentials into public chunks even if legacy build variables are set',async()=>{
  const marker='AUDIT_SYSTEM_SECRET_MUST_NEVER_SHIP';
  const previous=process.env.VITE_GEMINI_API_KEY;
  process.env.VITE_GEMINI_API_KEY=marker;
  try {
    const result=await build({logLevel:'silent',publicDir:false,build:{write:false}});
    const outputs=(Array.isArray(result)?result:[result]).flatMap(r=>'output' in r?r.output:[]);
    const chunks=outputs.filter(x=>x.type==='chunk');expect(chunks.length).toBeGreaterThan(0);
    expect(chunks.some(x=>x.code.includes(marker))).toBe(false);
  } finally {
    if(previous===undefined) delete process.env.VITE_GEMINI_API_KEY;else process.env.VITE_GEMINI_API_KEY=previous;
  }
},30000);
