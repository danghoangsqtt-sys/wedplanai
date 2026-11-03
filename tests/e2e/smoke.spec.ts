import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const planUid='e8a57bf1-58c2-45ae-b1ab-65c1e6921ad9';
const authUid='11111111-1111-4111-8111-111111111111';
const invitation=JSON.parse(readFileSync('tests/fixtures/invitation.json','utf8'));

async function backend(page:Page,signedIn:boolean,initialBudget:any[]=[]){
  const errors:string[]=[];let privateReads=0;let saved:any;
  let cloud={guests:[],budgetItems:initialBudget,procedures:{NORTH:[],CENTRAL:[],SOUTH:[]},invitation} as any;
  let revision='2026-11-03T00:00:00Z';
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
    else if(pathname.endsWith('/user_data')){privateReads++;body=[{id:planUid,guests:cloud.guests,budget_items:cloud.budgetItems,procedures:cloud.procedures,invitation:cloud.invitation,milestone_tasks:cloud.milestoneTasks,last_updated:revision}];}
    else if(pathname.endsWith('/rpc/save_plan')){saved=request.postDataJSON();cloud=structuredClone(saved.plan_data);revision=new Date().toISOString();body=revision;}
    else if(pathname.endsWith('/public_invitations'))body=[{invitation_json:invitation}];
    else if(pathname.endsWith('/rpc/get_public_wishes'))body=[];
    else if(pathname.endsWith('/rpc/submit_invitation_response'))body=true;
    await route.fulfill({status:200,headers:cors,json:body});
  });
  const now=Math.floor(Date.now()/1000);
  const token=[Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url'),Buffer.from(JSON.stringify({sub:authUid,aud:'authenticated',role:'authenticated',exp:now+3600,iat:now})).toString('base64url'),'audit-only-signature'].join('.');
  await page.addInitScript(({signedIn,token,now,authUid})=>{
    localStorage.setItem('wedplan_onboarding_done','1');
    if(signedIn)sessionStorage.setItem('wedplan_personal_pin_v1','1');
    if(signedIn)localStorage.setItem('sb-audit-auth-token',JSON.stringify({access_token:token,refresh_token:'audit-only-refresh',expires_in:3600,expires_at:now+3600,token_type:'bearer',user:{id:authUid,aud:'authenticated',role:'authenticated',email:'owner@example.test',app_metadata:{provider:'email'},user_metadata:{}}}));
  },{signedIn,token,now,authUid});
  return {errors,get privateReads(){return privateReads;},get saved(){return saved;}};
}

test('personal PIN opens local use, retains edits after reload and locks again',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});const state=await backend(page,false);
  await page.goto('/');await expect(page.getByLabel('Mã PIN')).toBeVisible();
  await expect(page.getByLabel('Email',{exact:true})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath('personal-pin.png'),animations:'disabled'});
  await page.getByLabel('Mã PIN').fill('123456');await page.getByRole('button',{name:'Mở kế hoạch',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('Mã PIN chưa đúng');
  await page.getByLabel('Mã PIN').fill('201020');await page.getByRole('button',{name:'Mở kế hoạch',exact:true}).click();
  await expect(page.getByText('Lưu trên thiết bị',{exact:true})).toBeVisible();
  const task=page.getByRole('checkbox',{name:'Chọn & chốt ngày cưới'});await task.click();
  await page.reload();await expect(page.getByRole('checkbox',{name:'Chọn & chốt ngày cưới'})).toHaveAttribute('aria-checked','true');
  await page.locator('aside').getByRole('button',{name:'Thiệp Cưới',exact:true}).click();
  const field=page.locator('[data-field="groomName"]').first();await field.fill('Personal Groom');await field.press('Tab');
  await page.getByRole('button',{name:'Lưu Thiết Kế',exact:true}).click();await expect(page.getByText('Đã lưu thiết kế thiệp trên thiết bị này.',{exact:true})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('personal-local-editor.png'),animations:'disabled'});
  await page.locator('aside').getByRole('button',{name:'Khóa ứng dụng',exact:true}).click();await expect(page.getByLabel('Mã PIN')).toBeVisible();
  expect(state.privateReads).toBe(0);expect(state.saved).toBeUndefined();expect(state.errors).toEqual([]);
});

test('PIN budget records deposit, relative dates, partial payment and dashboard after reload',async({page})=>{
  const state=await backend(page,false);await page.setViewportSize({width:1440,height:1080});
  await page.addInitScript(invitation=>{
    if(!localStorage.getItem('wedplan-storage-v14'))localStorage.setItem('wedplan-storage-v14',JSON.stringify({version:1,state:{budgetItems:[],guests:[],invitation:{...invitation,date:'2026-12-20'},milestoneTasks:{},hasUnsyncedChanges:false,cloudRevision:null}}));
  },invitation);
  await page.goto('/');await page.getByLabel('Mã PIN').fill('201020');await page.getByRole('button',{name:'Mở kế hoạch',exact:true}).click();
  await page.locator('aside').getByRole('button',{name:'Ngân Sách',exact:true}).click();
  await page.getByRole('button',{name:'Thêm khoản chi',exact:true}).click();
  await page.getByRole('textbox',{name:'Tên khoản chi',exact:true}).fill('Nhà hàng thanh toán');
  await page.getByRole('spinbutton',{name:'Dự toán (VNĐ)',exact:true}).fill('120000000');
  await page.getByRole('spinbutton',{name:'Giá đã chốt (VNĐ)',exact:true}).fill('110000000');
  await page.getByRole('textbox',{name:'Nhà cung cấp',exact:true}).fill('Nhà hàng mẫu');
  await page.getByRole('button',{name:'Lưu khoản chi',exact:true}).click();
  await page.getByRole('button',{name:'Ghi nhận cọc',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Số tiền mới thực trả (VNĐ)',exact:true}).fill('30000000');
  await page.getByRole('button',{name:'Xác nhận đã trả',exact:true}).click();
  await page.getByRole('button',{name:'Chi tiết thanh toán',exact:true}).click();
  for(const stage of [{label:'Cọc giữ sảnh',amount:'30000000',side:'before',days:'30'},{label:'Trước tiệc',amount:'20000000',side:'before',days:'7'},{label:'Quyết toán sau tiệc',amount:'60000000',side:'after',days:'3'}]){
    await page.getByRole('button',{name:'＋ Thêm đợt',exact:true}).click();
    await page.getByRole('textbox',{name:'Tên đợt',exact:true}).fill(stage.label);
    await page.getByRole('spinbutton',{name:'Số tiền phải trả của đợt (VNĐ)',exact:true}).fill(stage.amount);
    await page.getByRole('combobox',{name:'Mốc hẹn',exact:true}).selectOption(stage.side);
    await page.getByRole('spinbutton',{name:'Số ngày',exact:true}).fill(stage.days);
    await page.getByRole('button',{name:'Lưu đợt thanh toán',exact:true}).click();
  }
  await page.getByRole('row').filter({hasText:'Trước tiệc'}).getByRole('button',{name:'Ghi nhận trả',exact:true}).click();
  await page.getByRole('button',{name:'Xác nhận đã trả',exact:true}).click();
  await page.getByRole('button',{name:'Đóng thanh toán · nhà hàng thanh toán',exact:true}).click();
  await page.locator('aside').getByRole('button',{name:'Tổng Quan',exact:true}).click();
  await expect(page.getByRole('button',{name:'Tổng đã trả: 50.000.000 ₫',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Sau đám cưới: 60.000.000 ₫',exact:true})).toBeVisible();
  await page.screenshot({path:test.info().outputPath('budget-dashboard-desktop.png'),animations:'disabled'});
  await page.reload();await expect(page.getByRole('button',{name:'Còn phải trả: 60.000.000 ₫',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sau đám cưới: 60.000.000 ₫',exact:true}).click();
  await expect(page.getByRole('button',{name:'Trả sau cưới',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('article',{name:'Khoản chi: Nhà hàng thanh toán',exact:true})).toContainText('30.000.000 ₫');
  await page.screenshot({path:test.info().outputPath('budget-list-desktop.png'),animations:'disabled'});
  await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Chi tiết thanh toán',exact:true}).click();
  await page.getByRole('button',{name:'Ghi nhận thanh toán',exact:true}).click();
  await page.getByRole('spinbutton',{name:'Số tiền mới thực trả (VNĐ)',exact:true}).fill('10000000');
  await page.screenshot({path:test.info().outputPath('budget-payment-mobile.png'),animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(state.saved).toBeUndefined();expect(state.privateReads).toBe(0);expect(state.errors).toEqual([]);
});

test('authorized cloud round-trip preserves financial transactions and allocations',async({page})=>{
  const item={id:'cloud-budget',itemName:'Nhà hàng cloud',category:'Tiệc',side:'BOTH',assignee:'',status:'Chưa làm',estimatedCost:120000000,actualCost:0,agreedCost:110000000,payments:[],paymentSchedule:[{id:'final',label:'Quyết toán',amount:110000000,offsetDays:3}]};
  const state=await backend(page,true,[item]);await page.goto('/');
  await expect(page.getByRole('button',{name:'Còn phải trả: 110.000.000 ₫',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Ghi nhận thanh toán →',exact:true}).click();
  await page.getByRole('combobox',{name:'Loại khoản trả',exact:true}).selectOption('deposit');
  await page.getByRole('spinbutton',{name:'Số tiền mới thực trả (VNĐ)',exact:true}).fill('30000000');
  await page.getByRole('button',{name:'Xác nhận đã trả',exact:true}).click();
  await expect.poll(()=>state.saved?.plan_data?.budgetItems?.[0]?.payments?.[0]?.amount).toBe(30000000);
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('wedplan-storage-v14')!).state.hasUnsyncedChanges)).toBe(false);
  await page.evaluate(()=>localStorage.removeItem('wedplan-storage-v14'));await page.reload();
  await expect(page.getByRole('button',{name:'Tổng đã trả: 30.000.000 ₫',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Sau đám cưới: 80.000.000 ₫',exact:true})).toBeVisible();
  expect(state.saved.plan_data.budgetItems[0].payments[0].allocations).toEqual([{scheduleId:'final',amount:30000000}]);expect(state.errors).toEqual([]);
});

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

test('dashboard ticks survive reload and guest details persist through a clean cloud reload',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});const state=await backend(page,true);
  await page.goto('/');const checkbox=page.getByRole('checkbox',{name:'Chọn & chốt ngày cưới'});
  await checkbox.click();await expect(checkbox).toHaveAttribute('aria-checked','true');
  // Reload before the autosave debounce: the persisted pending edit must survive.
  await page.reload();await expect(page.getByRole('checkbox',{name:'Chọn & chốt ngày cưới'})).toHaveAttribute('aria-checked','true');
  await expect.poll(()=>state.saved?.plan_data?.milestoneTasks?.m12?.[0]?.done).toBe(true);
  await page.locator('aside').getByRole('button',{name:'Khách Mời',exact:true}).click();
  await page.getByRole('button',{name:'Thêm khách mời',exact:true}).click();
  await page.getByRole('textbox',{name:'Tên khách / đại diện'}).pressSequentially('Browser Family');
  await page.getByRole('textbox',{name:'Số điện thoại'}).fill('0901234567');
  await page.getByRole('spinbutton',{name:'Tổng số người',exact:true}).fill('4');
  await page.getByRole('spinbutton',{name:'Trong đó trẻ em'}).fill('1');
  await page.getByRole('combobox',{name:'Phản hồi tham dự',exact:true}).selectOption('100');
  await page.getByRole('combobox',{name:'Tình trạng gửi thiệp',exact:true}).selectOption('sent');
  await page.getByRole('textbox',{name:'Bàn dự kiến'}).fill('Bàn 02');
  await page.getByRole('textbox',{name:'Ghi chú',exact:true}).fill('Ăn chay');
  await page.getByRole('button',{name:'Lưu khách mời',exact:true}).click();
  await expect(page.getByRole('article',{name:'Khách: Browser Family'})).toBeVisible();
  await expect.poll(()=>state.saved?.plan_data?.guests?.[0]?.tableName).toBe('Bàn 02');
  // Remove only the plan cache, preserving Auth: this read must come from cloud.
  await page.evaluate(()=>localStorage.removeItem('wedplan-storage-v14'));await page.reload();
  await expect(page.getByRole('checkbox',{name:'Chọn & chốt ngày cưới'})).toHaveAttribute('aria-checked','true');
  await page.locator('aside').getByRole('button',{name:'Khách Mời',exact:true}).click();
  const card=page.getByRole('article',{name:'Khách: Browser Family'});await expect(card).toContainText('4 người (gồm 1 trẻ em)');await expect(card).toContainText('Bàn 02');await expect(card).toContainText('0901234567');
  await page.screenshot({path:test.info().outputPath('guest-desktop.png'),animations:'disabled'});
  await page.setViewportSize({width:390,height:844});
  await expect(page.getByText('Tính năng khác',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Thêm',exact:true}).click();
  await expect(page.getByText('Tính năng khác',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Đóng tính năng khác'}).click();
  await expect(page.getByText('Tính năng khác',{exact:true})).toHaveCount(0);
  await page.screenshot({path:test.info().outputPath('guest-mobile.png'),animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Sửa Browser Family'}).click();await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({path:test.info().outputPath('guest-mobile-form.png'),animations:'disabled'});
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
