// Development preview only: API interception lives in this process, never in app code.
const { chromium } = require('@playwright/test');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const planUid = 'e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9';
const authUid = '11111111-1111-4111-8111-111111111111';
const portFlag=process.argv.indexOf('--port');
const port=portFlag<0?3000:Number(process.argv[portFlag+1]);
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Preview port must be an integer from 1024 to 65535');
const url = `http://127.0.0.1:${port}`;
let revision = new Date().toISOString();
let plan = {
  guests: [
    {id:'demo-g1',name:'Gia đình Minh Anh',group:'Nhà Trai',probability:100,childrenCount:1,partySize:4,redEnvelope:2000000,phone:'0900000001',tableName:'Bàn 01',invitationStatus:'sent'},
    {id:'demo-g2',name:'Bạn Lan',group:'Bạn Bè',probability:80,childrenCount:0,partySize:2,redEnvelope:1000000,phone:'0900000002'},
    {id:'demo-g3',name:'Chị Mai',group:'Nhà Gái',probability:50,childrenCount:0,partySize:1,redEnvelope:500000},
  ],
  budgetItems: [
    {id:'demo-b1',category:'Tiệc cưới',itemName:'Nhà hàng tiệc cưới',estimatedCost:120000000,actualCost:110000000,assignee:'Chú rể',side:'BOTH',status:'Đang tiến hành'},
    {id:'demo-b2',category:'Ảnh cưới',itemName:'Chụp ảnh và quay phim',estimatedCost:20000000,actualCost:18000000,assignee:'Cô dâu',side:'BOTH',status:'Chưa làm'},
  ],
  invitation: {...JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/invitation.json'),'utf8')),groomName:'Minh',brideName:'Anh',groomShortName:'Minh',brideShortName:'Anh'},
};
const serverLog=fs.openSync(path.join(root,'.viepilot/local-preview-vite.log'),'a');
const vite = spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'--host','127.0.0.1','--port',String(port),'--strictPort'],{
  cwd:root,windowsHide:true,stdio:['ignore',serverLog,serverLog],env:{...process.env,VITE_SUPABASE_URL:'https://audit.supabase.co',VITE_SUPABASE_ANON_KEY:'preview-public-key',VITE_OWNER_UID:planUid},
});
let browser;
let serverExited=false;
vite.on('exit',()=>{serverExited=true;});
async function stop(){ if(browser) await browser.close().catch(()=>{});vite.kill();process.exit(0); }
process.on('SIGTERM',stop);process.on('SIGINT',stop);
(async()=>{
  let ready=false;
  for(let i=0;i<80;i++){try {const r=await fetch(url);if(r.ok){ready=true;break;}} catch{} await new Promise(r=>setTimeout(r,250));}
  if(!ready||serverExited)throw new Error(`Local preview server did not start; check that port ${port} is available`);
  browser=await chromium.launch({channel:'chrome',headless:false,args:['--start-maximized']});
  const context=await browser.newContext({viewport:null});
  const now=Math.floor(Date.now()/1000);
  const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:authUid,aud:'authenticated',role:'authenticated',exp:now+86400,iat:now})).toString('base64url'),'local-preview-only'].join('.');
  await context.addInitScript(({token,now,authUid})=>{
    document.addEventListener('DOMContentLoaded',()=>{document.title='WedPlan AI — Dữ liệu mẫu tại máy';});
    localStorage.setItem('wedplan_onboarding_done','1');
    if(!localStorage.getItem('sb-audit-auth-token'))localStorage.setItem('sb-audit-auth-token',JSON.stringify({access_token:token,refresh_token:'preview-only',expires_in:86400,expires_at:now+86400,token_type:'bearer',user:{id:authUid,email:'preview@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}}}));
  },{token,now,authUid});
  await context.route('https://api.ipify.org/**',r=>r.fulfill({json:{ip:'192.0.2.1'}}));
  await context.route('https://audit.supabase.co/**',async route=>{
    const request=route.request();const pathname=new URL(request.url()).pathname;
    const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
    if(request.method()==='OPTIONS')return route.fulfill({status:204,headers});
    let body=[];
    if(pathname==='/auth/v1/user')body={id:authUid,email:'preview@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
    else if(pathname.endsWith('/rpc/can_manage_plan'))body=true;
    else if(pathname.endsWith('/user_data'))body=[{id:planUid,guests:plan.guests,budget_items:plan.budgetItems,procedures:plan.procedures,invitation:plan.invitation,milestone_tasks:plan.milestoneTasks,last_updated:revision}];
    else if(pathname.endsWith('/rpc/save_plan')){
      const data=request.postDataJSON();
      if(data.expected_updated_at!==revision)return route.fulfill({status:409,headers,json:{code:'40001',message:'Preview revision conflict'}});
      plan=data.plan_data;revision=new Date().toISOString();body=revision;
    }
    else if(pathname.endsWith('/public_invitations'))body=[{invitation_json:plan.invitation}];
    else if(pathname.endsWith('/rpc/submit_invitation_response'))body=true;
    else if(pathname.includes('/functions/v1/'))return route.fulfill({status:503,headers,json:{message:'Bản mẫu không kết nối dịch vụ AI thật.'}});
    await route.fulfill({status:200,headers,json:body});
  });
  const page=await context.newPage();await page.goto(url);
  fs.writeFileSync(path.join(root,'.viepilot/local-preview.local'),JSON.stringify({pid:process.pid,serverPid:vite.pid,url,mode:'isolated mocked data'},null,2));
  console.log('VISIBLE_PREVIEW_READY '+url);
  browser.on('disconnected',()=>{vite.kill();process.exit(0);});
})().catch(e=>{console.error(e.message);vite.kill();process.exit(1);});
