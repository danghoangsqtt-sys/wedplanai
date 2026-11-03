// Review-artifact checks only. No application tests or real plan data are touched.
const { chromium } = require('@playwright/test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const root = __dirname;
const out = path.resolve(root, '../../../test-results/budget-brainstorm');
fs.mkdirSync(out,{recursive:true});
const M=1000000;
const url=pathToFileURL(path.join(root,'index.html')).href;
const checks=[];
async function reset(page){page.once('dialog',dialog=>dialog.accept());await page.getByRole('button',{name:'Đặt lại ví dụ',exact:true}).click();}
async function metric(page,key){const title=await page.locator(`[data-metric="${key}"]`).locator('..').getAttribute('title');return Number(title.replace(/\D/g,''));}
async function money(page,key,expected){assert.equal(await metric(page,key),expected*M,key);}
async function goBudget(page){await page.locator('[data-view="budget"]').click();}
async function goDashboard(page){await page.locator('[data-view="dashboard"]').click();}
async function pay(page,name,amount){
 await goBudget(page);const card=page.getByRole('article',{name:`Khoản chi: ${name}`,exact:true});
 await card.getByRole('button',{name:'Ghi nhận trả tiền',exact:true}).click();
 await page.getByLabel('Số tiền mới thực trả (VNĐ)',{exact:true}).fill(String(amount));
 await page.getByRole('button',{name:'Xác nhận đã trả',exact:true}).click();
}
async function addItem(page,name,amount){
 await page.getByRole('button',{name:'＋ Thêm khoản chi',exact:true}).click();
 await page.getByLabel('Tên khoản chi',{exact:true}).fill(name);
 await page.getByLabel('Nhà cung cấp',{exact:true}).fill('Nhà cung cấp mẫu');
 await page.getByLabel('Dự toán (VNĐ)',{exact:true}).fill(String(amount));
 await page.getByLabel('Giá đã chốt (VNĐ)',{exact:true}).fill(String(amount));
 await page.getByRole('button',{name:'Thêm khoản chi',exact:true}).click();
}
(async()=>{
 const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'chrome',headless:true});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',request=>{if(/^https?:/.test(request.url()))external.push(request.url());});
  await page.goto(url);await page.locator('[data-metric="remaining"]').waitFor();
  await money(page,'agreed',140);await money(page,'history',57);await money(page,'remaining',83);await money(page,'after',73);await money(page,'before',10);await money(page,'overdue',10);await money(page,'upcoming',73);
  await page.screenshot({path:path.join(out,'dashboard-desktop.png'),fullPage:true,animations:'disabled'});checks.push('Baseline: 140 agreed, 57 paid, 83 outstanding; 73 after, 10 overdue');
  await pay(page,'Nhà hàng tiệc cưới',20*M);await goDashboard(page);
  await money(page,'history',77);await money(page,'remaining',63);await money(page,'after',53);await money(page,'agreed',140);
  checks.push('Partial settlement updates dashboard and leaves agreed total unchanged');
  await goBudget(page);await page.getByLabel('Trạng thái công việc Chụp ảnh & quay phim',{exact:true}).selectOption('done');await money(page,'history',77);checks.push('Work completion does not create cash payments');
  await page.screenshot({path:path.join(out,'budget-desktop.png'),fullPage:true,animations:'disabled'});
  await page.getByRole('article',{name:'Khoản chi: Nhà hàng tiệc cưới',exact:true}).getByRole('button',{name:'Chi tiết',exact:true}).click();
  await page.getByRole('button',{name:'＋ Ghi nhận cọc',exact:true}).click();
  await page.getByLabel('Số tiền mới thực trả (VNĐ)',{exact:true}).fill(String(5*M));
  assert.match(await page.locator('#allocation-preview').textContent(),/Quyết toán sau tiệc/);
  await page.screenshot({path:path.join(out,'payment-allocation-desktop.png'),animations:'disabled'});
  await page.getByRole('button',{name:'Xác nhận đã trả',exact:true}).click();
  await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();await goDashboard(page);await money(page,'history',82);await money(page,'remaining',58);
  assert.match(await page.locator('[data-metric="history"]').locator('..').textContent(),/Trong đó đã cọc 42 triệu/);checks.push('Deposit belongs to paid total once, with allocation preview');
  await reset(page);await addItem(page,'Trang trí mẫu',10*M);
  await pay(page,'Trang trí mẫu',3*M);await goDashboard(page);await money(page,'remaining',90);assert.match(await page.locator('#notice').textContent(),/7\.000\.000/);
  await goBudget(page);await page.getByRole('article',{name:'Khoản chi: Trang trí mẫu',exact:true}).getByRole('button',{name:'Chi tiết',exact:true}).click();
  await page.getByRole('button',{name:'＋ Thêm đợt',exact:true}).click();await page.getByLabel('Tên đợt',{exact:true}).fill('Sau khi tháo dỡ');
  await page.getByLabel('Số tiền phải trả của đợt (VNĐ)',{exact:true}).fill(String(10*M));await page.getByRole('combobox',{name:'Mốc hẹn',exact:true}).selectOption('after');await page.getByLabel('Số ngày',{exact:true}).fill('7');
  await page.getByRole('button',{name:'Lưu đợt thanh toán',exact:true}).click();await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();await goDashboard(page);
  await money(page,'history',60);await money(page,'remaining',90);await money(page,'after',80);assert.equal(await page.locator('#notice').isHidden(),true);checks.push('Scheduling an already partly paid unscheduled balance moves classification without duplicating cash');
  await reset(page);page.once('dialog',dialog=>dialog.accept());await pay(page,'Nhà hàng tiệc cưới',70*M);await goDashboard(page);
  await money(page,'history',127);await money(page,'remaining',23);await money(page,'after',13);assert.match(await page.locator('#notice').textContent(),/10\.000\.000/);checks.push('Overpayment stays with its supplier; other supplier debts remain 23 million');
  await reset(page);await page.getByRole('combobox',{name:'Ngày xem giả lập',exact:true}).selectOption('3');await money(page,'overdue',10);await money(page,'upcoming',73);
  await page.getByRole('combobox',{name:'Ngày xem giả lập',exact:true}).selectOption('7');await money(page,'overdue',83);await money(page,'upcoming',0);checks.push('Due today is not overdue; time buckets change at T+3 and T+7');
  await reset(page);await page.getByLabel('Ngày cưới',{exact:true}).fill('2027-01-10');await page.getByLabel('Ngày cưới',{exact:true}).press('Tab');await goBudget(page);
  await page.getByRole('article',{name:'Khoản chi: Nhà hàng tiệc cưới',exact:true}).getByRole('button',{name:'Chi tiết',exact:true}).click();
  assert.match(await page.locator('#detail-content').textContent(),/13\/01\/2027/);assert.match(await page.locator('#detail-content').textContent(),/20\/11\/2026/);
  await page.getByRole('button',{name:'Đóng chi tiết',exact:true}).click();checks.push('Wedding shift moves pending due date while retaining historical actual payment date');
  await reset(page);await addItem(page,'Được tặng miễn phí',0);assert.equal(await page.getByRole('article',{name:'Khoản chi: Được tặng miễn phí',exact:true}).count(),1);await money(page,'agreed',140);checks.push('Zero agreed price is valid and remains visible');
  await reset(page);await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.screenshot({path:path.join(out,'dashboard-mobile.png'),fullPage:true,animations:'disabled'});await goBudget(page);
  await page.getByRole('article',{name:'Khoản chi: Nhà hàng tiệc cưới',exact:true}).getByRole('button',{name:'Chi tiết',exact:true}).click();await page.getByRole('button',{name:'＋ Ghi nhận cọc',exact:true}).click();
  await page.getByLabel('Số tiền mới thực trả (VNĐ)',{exact:true}).fill(String(20*M));await page.screenshot({path:path.join(out,'payment-mobile.png'),animations:'disabled'});
  await page.getByLabel('Số tiền mới thực trả (VNĐ)',{exact:true}).fill('-1');assert.equal(await page.locator('#payment-amount').evaluate(e=>e.checkValidity()),false);await page.keyboard.press('Escape');await page.keyboard.press('Escape');checks.push('Mobile layout has no page overflow; payment dialog and negative amount validation work');
  const longName='Trang trí và điều phối tiệc cưới ngoài trời – tên nhà cung cấp rất dài để kiểm tra cách xuống dòng';
  await addItem(page,longName,2e9);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);await goDashboard(page);
  assert.match(await page.locator('[data-metric="agreed"]').textContent(),/tỷ/);checks.push('Long labels and billion-VND values remain within mobile page width');
  const architecture=path.resolve(root,'../../architect/2026-11-03-budget-payments');
  for(const file of ['index.html','erd.html','data-flow.html','decisions.html','feature-map.html','architecture.html']){
   await page.goto(pathToFileURL(path.join(architecture,file)).href);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,file);
   if(file==='erd.html'){await page.setViewportSize({width:1360,height:1000});await page.screenshot({path:path.join(out,'data-model-desktop.png'),fullPage:true,animations:'disabled'});await page.setViewportSize({width:390,height:844});}
  }
  checks.push('All six architecture pages render without document overflow on mobile');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const result={date:'2026-11-03',kind:'prototype_only',checks_passed:checks.length,checks,javascript_errors:errors,external_requests:external,screenshots:fs.readdirSync(out).filter(f=>f.endsWith('.png'))};
  fs.writeFileSync(path.join(root,'verification.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
 } finally {await browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
