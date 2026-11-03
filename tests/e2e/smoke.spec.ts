import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const planUid='e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9';
const authUid='11111111-1111-4111-8111-111111111111';
const invitation=JSON.parse(readFileSync('tests/fixtures/invitation.json','utf8'));

async function backend(page:Page,signedIn:boolean){
  const errors:string[]=[];let privateReads=0;let saved:any;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
  await page.route('https://api.ipify.org/**',r=>r.fulfill({json:{ip:'192.0.2.1'}}));
  await page.route('https://audit.supabase.co/**',async route=>{
    const request=route.request();const pathname=new URL(request.url()).pathname;
    const cors={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'*'};
    if(request.method()==='OPTIONS'){await route.fulfill({status:204,headers:cors});return;}
    let body:unknown=[];
    if(pathname==='/auth/v1/user')body={id:authUid,email:'owner@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{}};
    else if(pathname.endsWith('/rpc/can_manage_plan'))body=signedIn;
    else if(pathname.endsWith('/user_data')){privateReads++;body=[{id:planUid,guests:[],budget_items:[],procedures:{NORTH:[],CENTRAL:[],SOUTH:[]},invitation,last_updated:'2026-11-03T00:00:00Z'}];}
    else if(pathname.endsWith('/rpc/save_plan')){saved=request.postDataJSON();body='2026-11-03T00:00:01Z';}
    else if(pathname.endsWith('/public_invitations'))body=[{invitation_json:invitation}];
    else if(pathname.endsWith('/rpc/get_public_wishes'))body=[];
    else if(pathname.endsWith('/rpc/submit_invitation_response'))body=true;
    await route.fulfill({status:200,headers:cors,json:body});
  });
  const now=Math.floor(Date.now()/1000);
  const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:authUid,aud:'authenticated',role:'authenticated',exp:now+3600,iat:now})).toString('base64url'),'audit-only-signature'].join('.');
  await page.addInitScript(({signedIn,token,now,authUid})=>{
    localStorage.setItem('wedplan_onboarding_done','1');
    if(signedIn)localStorage.setItem('sb-audit-auth-token',JSON.stringify({access_token:token,refresh_token:'audit-only-refresh',expires_in:3600,expires_at:now+3600,token_type:'bearer',user:{id:authUid,aud:'authenticated',role:'authenticated',email:'owner@example.test',app_metadata:{provider:'email'},user_metadata:{}}}));
  },{signedIn,token,now,authUid});
  return {errors,get privateReads(){return privateReads;},get saved(){return saved;}};
}

test('owner edits, saves, undoes and returns from the desktop editor',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});const state=await backend(page,true);
  await page.goto('/');await page.locator('aside').getByRole('button',{name:'Thiệp Cưới',exact:true}).click();
  const field=page.locator('[data-field="groomName"]').first();await expect(field).toHaveAttribute('contenteditable','true');
  await field.fill('Browser Edited Groom');await field.press('Tab');
  await expect(page.getByTitle('Hoàn tác (Ctrl+Z)')).toBeEnabled();
  await page.getByRole('button',{name:'Lưu Thiết Kế',exact:true}).click();
  await expect.poll(()=>state.saved?.plan_data?.invitation?.groomName).toBe('Browser Edited Groom');
  await page.screenshot({path:test.info().outputPath('desktop-editor.png'),animations:'disabled'});
  await page.getByTitle('Hoàn tác (Ctrl+Z)').click();await expect(field).toHaveText('Audit Groom');
  await page.getByRole('button',{name:'Quay lại',exact:true}).click();
  await expect(page.getByRole('button',{name:'Lưu Thiết Kế',exact:true})).toHaveCount(0);
  expect(state.errors).toEqual([]);
});

test('public mobile guest sees ordered sections and can submit RSVP without private reads',async({page})=>{
  await page.setViewportSize({width:390,height:844});const state=await backend(page,false);
  await page.goto(`/?view=invitation&uid=${planUid}`);
  await page.getByRole('button',{name:/MỞ THIỆP NGAY/}).click();
  await expect(page.locator('.iv-root')).toBeVisible();
  expect(await page.locator('.iv-root > [data-sec]').evaluateAll(nodes=>nodes.slice(0,3).map(n=>n.getAttribute('data-sec')))).toEqual(['calendar','hero','opening']);
  await expect(page.locator('[data-sec="family"]')).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath('mobile-invitation.png'),animations:'disabled'});
  await page.getByRole('button',{name:'Xác nhận tham dự',exact:true}).click();
  await page.getByRole('textbox',{name:'Họ tên',exact:true}).fill('Mobile Guest');
  await page.getByRole('button',{name:/Xác nhận \/ Confirm/}).click();await expect(page.getByText(/Cảm ơn bạn/)).toBeVisible();
  expect(state.privateReads).toBe(0);expect(state.errors).toEqual([]);
});
