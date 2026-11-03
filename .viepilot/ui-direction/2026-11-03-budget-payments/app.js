/* Standalone review prototype. No app imports, network calls or persistent storage. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const M = 1000000;
  const sid = () => crypto.randomUUID ? crypto.randomUUID() : `sample-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const format = value => new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
  const unit = value => Math.abs(value)>=1e12?'nghìn tỷ':Math.abs(value)>=1e9?'tỷ':'triệu';
  const compact = value => new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(value / (Math.abs(value)>=1e12?1e12:Math.abs(value)>=1e9?1e9:M));
  const short = value => compact(value) + ' ' + unit(value);
  const shift = (date,days) => { const result=new Date(`${date}T12:00:00Z`);result.setUTCDate(result.getUTCDate()+days);return result.toISOString().slice(0,10); };
  const dateText = date => new Intl.DateTimeFormat('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(`${date}T12:00:00Z`));
  const marker = offset => offset===0?'T':offset<0?`T−${-offset}`:`T+${offset}`;
  const offsetText = offset => offset===0?'Đúng ngày cưới':offset<0?`Trước cưới ${-offset} ngày`:`Sau cưới ${offset} ngày`;
  const initial = () => ({weddingDate:'2026-12-20',asof:1,items:[
    {id:'restaurant',name:'Nhà hàng tiệc cưới',supplier:'Trống Đồng Palace',estimatedCost:120*M,agreedCost:110*M,workStatus:'done',icon:'♧',schedule:[
      {id:'r1',label:'Cọc giữ sảnh',offsetDays:-30,amount:30*M,settledDueDate:'2026-11-20'},
      {id:'r2',label:'Thanh toán trước tiệc',offsetDays:-7,amount:20*M,settledDueDate:'2026-12-13'},
      {id:'r3',label:'Quyết toán sau tiệc',offsetDays:3,amount:60*M}],payments:[
      {id:'p1',kind:'deposit',amount:30*M,paidAt:'2026-11-20',note:'Cọc giữ sảnh',allocations:[{scheduleId:'r1',amount:30*M}]},
      {id:'p2',kind:'payment',amount:20*M,paidAt:'2026-12-13',note:'Thanh toán đợt 2',allocations:[{scheduleId:'r2',amount:20*M}]}]},
    {id:'photo',name:'Chụp ảnh & quay phim',supplier:'Mây Wedding Studio',estimatedCost:18*M,agreedCost:18*M,workStatus:'in_progress',icon:'◉',schedule:[
      {id:'f1',label:'Cọc lịch chụp',offsetDays:-14,amount:5*M,settledDueDate:'2026-12-06'},
      {id:'f2',label:'Quyết toán khi giao ảnh',offsetDays:5,amount:13*M}],payments:[
      {id:'p3',kind:'deposit',amount:5*M,paidAt:'2026-12-06',note:'Cọc lịch chụp và quay',allocations:[{scheduleId:'f1',amount:5*M}]}]},
    {id:'dress',name:'Trang phục ngày cưới',supplier:'Lụa Bridal',estimatedCost:12*M,agreedCost:12*M,workStatus:'done',icon:'♢',schedule:[
      {id:'d1',label:'Cọc trang phục',offsetDays:-20,amount:2*M,settledDueDate:'2026-11-30'},
      {id:'d2',label:'Thanh toán khi nhận váy',offsetDays:0,amount:10*M}],payments:[
      {id:'p4',kind:'deposit',amount:2*M,paidAt:'2026-11-30',note:'Cọc thuê trang phục',allocations:[{scheduleId:'d1',amount:2*M}]}]}
  ]});
  let state=initial(),view='dashboard',filter='all',search='',detailId=null,transactionItemId=null,scheduleItemId=null;
  const history=[];let toastTimer;
  const today=()=>shift(state.weddingDate,state.asof);
  const itemById=id=>state.items.find(item=>item.id===id);
  const sum=(rows,fn)=>rows.reduce((total,row)=>total+fn(row),0);
  function itemStats(item) {
    const paid=sum(item.payments,p=>p.amount),deposits=sum(item.payments.filter(p=>p.kind==='deposit'),p=>p.amount);
    const schedule=item.schedule.map(stage=>{
      const allocated=sum(item.payments,p=>sum(p.allocations.filter(a=>a.scheduleId===stage.id),a=>a.amount));
      const remaining=Math.max(stage.amount-allocated,0);
      const due=remaining===0&&stage.settledDueDate?stage.settledDueDate:shift(state.weddingDate,stage.offsetDays);
      return {...stage,paid:allocated,remaining,due,overdue:remaining>0&&due<today(),upcoming:remaining>0&&due>=today()&&due<=shift(today(),7)};
    });
    const scheduled=sum(item.schedule,s=>s.amount);
    const paidUnscheduled=sum(item.payments,p=>sum(p.allocations.filter(a=>a.scheduleId===null),a=>a.amount));
    const unscheduled=Math.max(item.agreedCost-scheduled-paidUnscheduled,0);
    return {item,paid,deposits,remaining:Math.max(item.agreedCost-paid,0),overpaid:Math.max(paid-item.agreedCost,0),schedule,unscheduled,
      before:sum(schedule.filter(s=>s.offsetDays<=0),s=>s.remaining),after:sum(schedule.filter(s=>s.offsetDays>0),s=>s.remaining),
      overdue:sum(schedule.filter(s=>s.overdue),s=>s.remaining),upcoming:sum(schedule.filter(s=>s.upcoming),s=>s.remaining)};
  }
  function totalStats() {
    const rows=state.items.map(itemStats),total={rows};
    for(const key of ['paid','deposits','remaining','overpaid','before','after','overdue','upcoming','unscheduled'])total[key]=sum(rows,row=>row[key]);
    total.estimated=sum(state.items,i=>i.estimatedCost);total.agreed=sum(state.items,i=>i.agreedCost);
    return total;
  }
  function assertLedger() {
    for(const item of state.items){
      const stats=itemStats(item);
      if(stats.before+stats.after+stats.unscheduled!==stats.remaining)throw new Error('Các nhóm công nợ chưa khớp tổng còn phải trả.');
      for(const payment of item.payments)if(sum(payment.allocations,a=>a.amount)>payment.amount)throw new Error('Phân bổ vượt số thực trả.');
      if(sum(item.schedule,s=>s.amount)>item.agreedCost)throw new Error('Lịch phải trả vượt giá đã chốt.');
    }
  }
  function snapshot(){history.push(structuredClone(state));}
  function notify(message,undo=false){
    clearTimeout(toastTimer);$('toast').hidden=false;$('toast').replaceChildren(document.createTextNode(message));
    if(undo&&history.length){const button=document.createElement('button');button.textContent='Hoàn tác';button.addEventListener('click',()=>{state=history.pop();render();if(detailId)renderDetail();$('toast').hidden=true;});$('toast').append(button);}
    toastTimer=setTimeout(()=>{$('toast').hidden=true;},7000);
  }
  function setView(next,nextFilter='all'){
    view=next;filter=nextFilter;search='';$('search').value='';render();
    document.querySelector('main').scrollIntoView({behavior:'smooth',block:'start'});
  }
  const filters=[['all','Tất cả'],['remaining','Còn nợ'],['after','Trả sau cưới'],['before','Trước / ngày cưới'],['overdue','Quá hạn'],['upcoming','7 ngày tới'],['unscheduled','Chưa xếp lịch'],['history','Đã có thanh toán']];
  function matching(stats){
    const matchesSearch=(stats.item.name+' '+stats.item.supplier).normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d').toLowerCase().includes(search.normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/g,'d').toLowerCase());
    return matchesSearch&&(filter==='all'||filter==='history'?matchesSearch&&(filter!=='history'||stats.paid>0):stats[filter]>0);
  }
  function statusBadge(stage){return stage.remaining===0?'<span class="badge green">Đã trả đủ</span>':stage.overdue?'<span class="badge red">Quá hạn</span>':`<span class="badge ${stage.offsetDays>0?'rose':'gray'}">${stage.offsetDays>0?'Sau cưới':'Chưa trả đủ'}</span>`;}
  function nextStage(stats){return stats.schedule.filter(s=>s.remaining>0).sort((a,b)=>a.due.localeCompare(b.due))[0];}
  function render(){
    assertLedger();const totals=totalStats();
    $('dashboard-view').hidden=view!=='dashboard';$('budget-view').hidden=view!=='budget';
    document.querySelectorAll('[data-view]').forEach(button=>{button.classList.toggle('active',button.dataset.view===view);button.setAttribute('aria-pressed',String(button.dataset.view===view));});
    $('breadcrumb').textContent=view==='dashboard'?'Tổng quan':'Ngân sách & thanh toán';
    $('page-title').textContent=view==='dashboard'?'Nhìn rõ từng khoản cần trả.':'Mỗi khoản chi, một lịch trả rõ ràng.';
    $('page-subtitle').textContent=view==='dashboard'?'Từ tiền cọc đầu tiên đến lần quyết toán sau đám cưới.':'Ghi nhận tiền thực đã trả và chuẩn bị các đợt tiếp theo.';
    $('wedding-date').value=state.weddingDate;$('asof-offset').value=state.asof;$('asof-date').textContent=dateText(today());
    const cards=[
      ['Tổng dự toán',totals.estimated,`${state.items.length} khoản chi`,'all','◈',''],
      ['Tổng dự kiến thanh toán',totals.agreed,'Giá đã chốt của các khoản trong ví dụ','all','≋',''],
      ['Tổng đã trả',totals.paid,`Trong đó đã cọc ${short(totals.deposits)}`,'history','✓','good'],
      ['Còn phải trả',totals.remaining,'Không trừ tiền mừng dự kiến','remaining','↗','focus'],
      ['Trước / đúng ngày cưới',totals.before,'Còn phải trả ở mốc T−N và T','before','◷',''],
      ['Sau đám cưới',totals.after,'Còn phải trả ở các mốc T+N','after','♡','focus'],
      ['Đã quá hạn',totals.overdue,'Chưa trả, đã qua ngày hẹn','overdue','!','alert'],
      ['Trong 7 ngày tới',totals.upcoming,'Gồm cả các khoản đến hạn hôm nay','upcoming','▦','']
    ];
    $('metrics').innerHTML=cards.map(([label,value,note,key,icon,style])=>`<button class="metric ${style}" data-filter="${key}" title="${escape(format(value))}" aria-label="${escape(label)}: ${escape(format(value))}"><div class="metric-top"><span>${escape(label)}</span><span class="metric-icon" aria-hidden="true">${icon}</span></div><div class="metric-value" data-metric="${key==='all'?(label==='Tổng dự toán'?'estimated':'agreed'):key}">${compact(value)}<span>${unit(value)}</span></div><p class="metric-note">${escape(note)}</p></button>`).join('');
    $('hero-after').textContent=short(totals.after);
    const buckets=new Map();totals.rows.forEach(row=>row.schedule.forEach(stage=>{if(stage.remaining)buckets.set(stage.offsetDays,(buckets.get(stage.offsetDays)||0)+stage.remaining);}));
    const ordered=[...buckets].sort(([a],[b])=>a-b),max=Math.max(1,...ordered.map(([,value])=>value));
    $('timeline').innerHTML=ordered.length?ordered.map(([offset,value])=>`<div class="timeline-row"><span class="timeline-label">${marker(offset)}</span><div class="timeline-track"><div class="timeline-fill ${offset>0?'after':''}" style="width:${value/max*100}%"></div></div><span class="timeline-amount">${short(value)}</span></div>`).join(''):'<p class="empty">Các khoản đã được thanh toán đủ.</p>';
    $('reconciliation').textContent=`Trước/ngày cưới ${short(totals.before)} + sau cưới ${short(totals.after)} + chưa xếp lịch ${short(totals.unscheduled)} = ${short(totals.remaining)} còn phải trả.`;
    const priorities=totals.rows.flatMap(row=>row.schedule.filter(s=>s.remaining>0).map(stage=>({row,stage}))).sort((a,b)=>a.stage.due.localeCompare(b.stage.due));
    $('priority').innerHTML=priorities.length?priorities.map(({row,stage})=>`<div class="priority-row"><div><h3>${escape(row.item.name)}</h3><p>${escape(stage.label)} · ${marker(stage.offsetDays)} · ${dateText(stage.due)}</p><button class="row-link" data-pay="${escape(row.item.id)}" data-stage="${escape(stage.id)}">Ghi nhận thanh toán →</button></div><div class="priority-amount"><strong>${short(stage.remaining)}</strong>${statusBadge(stage)}</div></div>`).join(''):'<p class="empty">Không còn đợt thanh toán nào đang chờ.</p>';
    $('budget-summary').innerHTML=[['Đã chốt',totals.agreed],['Đã cọc',totals.deposits],['Đã trả',totals.paid],['Còn phải trả',totals.remaining]].map(([label,value])=>`<span class="summary-pill">${label}<b>${short(value)}</b></span>`).join('');
    $('filters').innerHTML=filters.map(([key,label])=>`<button aria-pressed="${filter===key}" class="${filter===key?'active':''}" data-list-filter="${key}">${label}</button>`).join('');
    const rows=totals.rows.filter(matching).sort((a,b)=>(b.overdue>0)-(a.overdue>0)||(nextStage(a)?.due||'9999').localeCompare(nextStage(b)?.due||'9999'));
    $('result-count').textContent=`${rows.length} khoản · còn ${short(sum(rows,row=>row.remaining))}`;
    $('budget-list').innerHTML=rows.length?rows.map(row=>{
      const item=row.item,next=nextStage(row);
      return `<article class="budget-item" aria-label="Khoản chi: ${escape(item.name)}"><div class="item-heading"><div class="item-title"><span class="supplier-icon" aria-hidden="true">${item.icon}</span><div><h2>${escape(item.name)}</h2><p>${escape(item.supplier)}</p></div></div><select class="work-status" data-work="${escape(item.id)}" aria-label="Trạng thái công việc ${escape(item.name)}"><option value="pending" ${item.workStatus==='pending'?'selected':''}>Chưa làm</option><option value="in_progress" ${item.workStatus==='in_progress'?'selected':''}>Đang thực hiện</option><option value="done" ${item.workStatus==='done'?'selected':''}>Đã xong dịch vụ</option></select></div><div class="item-amounts">${[['Dự toán',item.estimatedCost],['Giá đã chốt',item.agreedCost],['Đã cọc',row.deposits],['Tổng đã trả',row.paid],['Còn phải trả',row.remaining]].map(([label,value],index)=>`<div class="amount-cell ${index===4?'remaining':''}"><span>${label}</span><b>${short(value)}</b></div>`).join('')}</div><div class="item-bottom"><div class="next-stage">${next?`Đợt tiếp: <b>${escape(next.label)} · ${marker(next.offsetDays)} · ${dateText(next.due)}</b><br>Còn ${short(next.remaining)} ${next.overdue?'· <span class="badge red">Quá hạn</span>':''}`:row.unscheduled>0?`<b>${short(row.unscheduled)}</b> còn nợ chưa xếp lịch`:'<span class="badge green">Đã thanh toán đủ</span>'}</div><div class="item-actions"><button class="secondary" data-detail="${escape(item.id)}">Chi tiết</button><button class="primary" data-pay="${escape(item.id)}">Ghi nhận trả tiền</button></div></div>${row.overpaid>0?`<p class="item-note">Trả dư ${format(row.overpaid)} cho đơn vị này. Không bù vào nợ nhà cung cấp khác.</p>`:''}</article>`;
    }).join(''):'<div class="panel empty">Không có khoản chi phù hợp bộ lọc.</div>';
    $('notice').hidden=totals.unscheduled===0&&totals.overpaid===0;
    $('notice').textContent=[totals.unscheduled>0?`${format(totals.unscheduled)} còn nợ chưa có lịch. Chưa tự phân vào khoản trước hay sau cưới.`:'',totals.overpaid>0?`Có ${format(totals.overpaid)} trả dư. Kiểm tra riêng với nhà cung cấp.`:''].filter(Boolean).join(' ');
  }
  function renderDetail(){
    const item=itemById(detailId);if(!item)return;
    const stats=itemStats(item);
    $('detail-content').innerHTML=`<div class="dialog-heading"><div><p class="eyebrow">CHI TIẾT THANH TOÁN</p><h2 id="detail-title">${escape(item.name)}</h2><p class="subtitle">${escape(item.supplier)}</p></div><button class="icon-button" data-close="detail-dialog" aria-label="Đóng chi tiết">×</button></div><div class="detail-body"><div class="detail-stats">${[['Giá đã chốt',item.agreedCost],['Tổng đã trả',stats.paid],['Còn phải trả',stats.remaining]].map(([label,value])=>`<div class="detail-stat"><span>${label}</span><b>${short(value)}</b></div>`).join('')}</div><div class="subheading"><h3>Các đợt phải trả</h3><button data-add-schedule="${item.id}">＋ Thêm đợt</button></div><div class="table-scroll"><table><thead><tr><th>Đợt / mốc hẹn</th><th class="number">Phải trả</th><th class="number">Đã trả</th><th class="number">Còn lại</th><th></th></tr></thead><tbody>${stats.schedule.map(stage=>`<tr><td><strong>${escape(stage.label)}</strong><small>${offsetText(stage.offsetDays)} · ${dateText(stage.due)}</small></td><td class="number">${short(stage.amount)}</td><td class="number">${short(stage.paid)}</td><td class="number">${short(stage.remaining)}</td><td>${stage.remaining>0?`<button class="table-pay" data-pay="${item.id}" data-stage="${stage.id}">Ghi nhận trả</button>`:statusBadge(stage)}</td></tr>`).join('')||'<tr><td colspan="5">Chưa có đợt thanh toán nào.</td></tr>'}</tbody></table></div>${stats.unscheduled>0?`<p class="item-note">Còn ${format(stats.unscheduled)} chưa xếp lịch. Thêm đợt trước hoặc sau cưới để dashboard thể hiện đúng thời điểm cần chi.</p>`:''}<div class="subheading"><h3>Lịch sử thực trả · đã cọc ${short(stats.deposits)}</h3><button data-pay="${item.id}" data-kind="deposit">＋ Ghi nhận cọc</button></div><div class="history">${[...item.payments].reverse().map(payment=>`<div class="history-row"><div><b>${payment.kind==='deposit'?'Tiền cọc':'Thanh toán'} · ${dateText(payment.paidAt)}</b><p>${escape(payment.note||'Không có ghi chú')}</p><p>${payment.allocations.map(a=>a.scheduleId?escape(item.schedule.find(s=>s.id===a.scheduleId)?.label||'Đợt đã phân bổ'):'Phần chưa xếp lịch').join(' · ')}</p></div><span class="history-amount">${format(payment.amount)}</span></div>`).join('')||'<p class="empty">Chưa ghi nhận tiền thực trả. Đặt lịch không tự tạo giao dịch.</p>'}</div></div><div class="dialog-footer"><button class="secondary" data-close="detail-dialog">Đóng</button><button class="primary" data-pay="${item.id}">Ghi nhận thanh toán</button></div>`;
  }
  function openDetail(id){detailId=id;renderDetail();$('detail-dialog').showModal();}
  function allocate(item,amount,preferred){
    const stats=itemStats(item);let left=amount;const allocations=[];
    const stages=[...stats.schedule].sort((a,b)=>(b.id===preferred)-(a.id===preferred)||a.due.localeCompare(b.due));
    for(const stage of stages){const portion=Math.min(left,stage.remaining);if(portion>0){allocations.push({scheduleId:stage.id,amount:portion});left-=portion;}}
    const unplanned=Math.min(left,stats.unscheduled);if(unplanned>0){allocations.push({scheduleId:null,amount:unplanned});left-=unplanned;}
    return {allocations,overpaid:left};
  }
  function renderAllocation(){
    const item=itemById(transactionItemId);if(!item)return;
    const amount=Number($('payment-amount').value);$('amount-hint').textContent=Number.isSafeInteger(amount)&&amount>0?format(amount):'';
    if(!Number.isSafeInteger(amount)||amount<=0){$('allocation-preview').textContent='Nhập số tiền để xem trước phân bổ.';return;}
    const result=allocate(item,amount,$('payment-stage').value);
    $('allocation-preview').innerHTML=result.allocations.map(a=>`<p class="allocation-line"><span>${a.scheduleId?escape(item.schedule.find(s=>s.id===a.scheduleId).label):'Phần chưa xếp lịch'}</span><b>${format(a.amount)}</b></p>`).join('')+(result.overpaid>0?`<p class="allocation-line credit"><span>Trả dư cho nhà cung cấp</span><b>${format(result.overpaid)}</b></p><p class="form-tip">Khoản trả dư không làm giảm công nợ với các đơn vị khác.</p>`:'');
  }
  function openPayment(id,stageId='',kind='payment'){
    transactionItemId=id;const item=itemById(id),stats=itemStats(item);$('payment-form').reset();$('payment-error').hidden=true;
    $('payment-title').textContent=kind==='deposit'?'Ghi nhận tiền cọc':'Ghi nhận thanh toán';$('payment-kind').value=kind;
    $('payment-supplier').textContent=`${item.name} · ${item.supplier} · còn phải trả ${format(stats.remaining)}`;
    $('payment-date').value=today();$('payment-stage').innerHTML='<option value="">Đợt gần đến hạn nhất</option>'+stats.schedule.filter(s=>s.remaining>0).map(s=>`<option value="${s.id}">${escape(s.label)} · ${marker(s.offsetDays)} · còn ${short(s.remaining)}</option>`).join('');
    $('payment-stage').value=stageId;const selected=stats.schedule.find(s=>s.id===stageId);$('payment-amount').value=selected?.remaining||'';renderAllocation();$('payment-dialog').showModal();
    setTimeout(()=>$('payment-amount').focus(),0);
  }
  $('payment-form').addEventListener('submit',event=>{
    event.preventDefault();const item=itemById(transactionItemId),amount=Number($('payment-amount').value),date=$('payment-date').value;
    if(!Number.isSafeInteger(amount)||amount<=0||!/^\d{4}-\d{2}-\d{2}$/.test(date)){showError('payment-error','Vui lòng nhập số tiền nguyên dương và ngày thực trả hợp lệ.');return;}
    const result=allocate(item,amount,$('payment-stage').value);
    if(result.overpaid>0&&!confirm(`Lần trả này có ${format(result.overpaid)} trả dư cho ${item.supplier}. Vẫn ghi nhận?`))return;
    snapshot();item.payments.push({id:sid(),amount,paidAt:date,kind:$('payment-kind').value,note:$('payment-note').value.trim(),allocations:result.allocations});
    itemStats(item).schedule.forEach(s=>{if(s.remaining===0){const original=item.schedule.find(x=>x.id===s.id);if(!original.settledDueDate)original.settledDueDate=shift(state.weddingDate,s.offsetDays);}});
    $('payment-dialog').close();render();if($('detail-dialog').open)renderDetail();notify(`Đã ghi nhận ${format(amount)} trong dữ liệu mẫu.`,true);
  });
  function showError(id,message){$(id).textContent=message;$(id).hidden=false;}
  function renderScheduleHint(){const side=$('schedule-side').value,days=Number($('schedule-days').value);$('schedule-days').disabled=side==='on';const offset=side==='on'?0:side==='before'?-days:days;$('schedule-date-hint').textContent=Number.isInteger(offset)&&Math.abs(offset)<=3650?`${offsetText(offset)} · ${dateText(shift(state.weddingDate,offset))}`:'';}
  function openSchedule(id){
    scheduleItemId=id;$('schedule-form').reset();$('schedule-error').hidden=true;$('schedule-side').value='after';$('schedule-days').value=3;
    const item=itemById(id),room=item.agreedCost-sum(item.schedule,s=>s.amount);
    $('schedule-room').textContent=`${item.name} · còn ${format(room)} chưa xếp lịch.`;$('schedule-amount').max=room;$('schedule-amount').value=room||'';renderScheduleHint();$('schedule-dialog').showModal();
  }
  $('schedule-form').addEventListener('submit',event=>{
    event.preventDefault();const item=itemById(scheduleItemId),name=$('schedule-name').value.trim(),amount=Number($('schedule-amount').value),days=Number($('schedule-days').value),side=$('schedule-side').value;
    const offset=side==='on'?0:side==='before'?-days:days,room=item.agreedCost-sum(item.schedule,s=>s.amount);
    if(!name||!Number.isSafeInteger(amount)||amount<=0||amount>room||!Number.isInteger(offset)||Math.abs(offset)>3650||(side!=='on'&&days<1)){showError('schedule-error','Số tiền phải nằm trong phần chưa xếp lịch; mốc trước/sau cưới là số ngày nguyên dương.');return;}
    // Existing payments against the unplanned balance are allocated into the
    // new stage as it is scheduled. This moves categorization, never cash.
    snapshot();const stage={id:sid(),label:name,offsetDays:offset,amount};item.schedule.push(stage);let left=amount;
    for(const payment of item.payments){for(const allocation of [...payment.allocations]){if(allocation.scheduleId===null&&left>0){const moved=Math.min(left,allocation.amount);allocation.amount-=moved;payment.allocations.push({scheduleId:stage.id,amount:moved});left-=moved;}}payment.allocations=payment.allocations.filter(a=>a.amount>0);}
    const current=itemStats(item).schedule.find(s=>s.id===stage.id);if(current.remaining===0)stage.settledDueDate=shift(state.weddingDate,offset);
    $('schedule-dialog').close();render();renderDetail();notify('Đã thêm lịch hẹn. Tổng tiền thực trả không đổi.',true);
  });
  $('item-form').addEventListener('submit',event=>{
    event.preventDefault();const name=$('item-name').value.trim(),supplier=$('item-supplier').value.trim(),estimated=Number($('item-estimated').value),agreed=Number($('item-agreed').value);
    if(!name||!supplier||![estimated,agreed].every(v=>Number.isSafeInteger(v)&&v>=0)){showError('item-error','Vui lòng nhập tên, nhà cung cấp và số tiền nguyên không âm.');return;}
    snapshot();state.items.push({id:sid(),name,supplier,estimatedCost:estimated,agreedCost:agreed,workStatus:'pending',icon:'♧',schedule:[],payments:[]});$('item-dialog').close();setView('budget',agreed>0?'unscheduled':'all');notify('Đã thêm khoản chi mẫu. Tiếp theo: thêm đợt và ghi nhận cọc.',true);
  });
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.view)setView(button.dataset.view);
    if(button.dataset.filter)setView('budget',button.dataset.filter);
    if(button.dataset.listFilter){filter=button.dataset.listFilter;render();}
    if(button.dataset.detail)openDetail(button.dataset.detail);
    if(button.dataset.pay)openPayment(button.dataset.pay,button.dataset.stage,button.dataset.kind);
    if(button.dataset.addSchedule)openSchedule(button.dataset.addSchedule);
    if(button.dataset.close)$(button.dataset.close).close();
  });
  document.addEventListener('change',event=>{
    if(event.target.dataset.work){itemById(event.target.dataset.work).workStatus=event.target.value;notify('Đổi trạng thái công việc; số tiền đã trả không đổi.');}
  });
  $('search').addEventListener('input',event=>{search=event.target.value;render();});
  $('show-after').addEventListener('click',()=>setView('budget','after'));
  $('add-item').addEventListener('click',()=>{$('item-form').reset();$('item-error').hidden=true;$('item-dialog').showModal();});
  $('wedding-date').addEventListener('change',event=>{if(!event.target.value){event.target.value=state.weddingDate;return;}state.weddingDate=event.target.value;render();if($('detail-dialog').open)renderDetail();});
  $('asof-offset').addEventListener('change',event=>{state.asof=Number(event.target.value);render();});
  $('payment-amount').addEventListener('input',renderAllocation);$('payment-stage').addEventListener('change',renderAllocation);
  $('schedule-side').addEventListener('change',renderScheduleHint);$('schedule-days').addEventListener('input',renderScheduleHint);
  $('reset').addEventListener('click',()=>{if(!confirm('Đặt lại toàn bộ thao tác trong bản phác về dữ liệu mẫu ban đầu?'))return;state=initial();history.length=0;document.querySelectorAll('dialog[open]').forEach(d=>d.close());setView('dashboard');$('toast').hidden=true;});
  window.addEventListener('hashchange',()=>{if(location.hash==='#dashboard')setView('dashboard');});
  render();
})();
