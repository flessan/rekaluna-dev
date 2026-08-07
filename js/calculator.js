/* calculator.js — Price Desk logic */
const moneyValues = [250,500,1000,2000,5000,10000,20000,50000,100000];
const fmtID = new Intl.NumberFormat('id-ID');
function formatRp(n){ return 'Rp ' + fmtID.format(n); }
function formatNum(n){ return fmtID.format(n); }

// state reference — will be set by app.js
let calcState = null;
let historyStack = []; // for undo

function initCalculator(state){
  calcState = state;
  historyStack = [];
  renderMoney();
  renderServices();
  renderTransaction();
  bindCalculatorEvents();
  updateStats();
}

function pushHistory(){
  historyStack.push(JSON.stringify(calcState.transaction));
  if(historyStack.length>30) historyStack.shift();
}
function undo(){
  if(!historyStack.length) { showToast('Nothing to undo','error'); return; }
  calcState.transaction = JSON.parse(historyStack.pop());
  saveState(calcState);
  renderTransaction();
  updateStats();
  showToast('Undone');
}

function renderMoney(){
  const grid = document.getElementById('moneyGrid');
  grid.innerHTML = moneyValues.map(v=>`
    <button class="money-btn" data-money="${v}">
      <span>Rp ${formatNum(v)}</span>
      <small>Tap to add</small>
    </button>
  `).join('');
}

function renderServices(){
  const grid = document.getElementById('serviceGrid');
  const s = calcState.services;
  grid.innerHTML = s.map(svc=>`
    <button class="service-btn" data-service="${svc.id}">
      <span class="service-btn__name"><i class="fa-solid ${svc.icon}" style="color:var(--muted);margin-right:6px"></i>${svc.name}</span>
      <span class="service-btn__price">${formatRp(svc.price)}</span>
      <span class="service-btn__hint">${svc.hint}</span>
    </button>
  `).join('');
}

function renderTransaction(){
  const list = document.getElementById('txList');
  const tx = calcState.transaction;
  const countEl = document.getElementById('txCount');
  const totalEl = document.getElementById('txTotal');
  const workspaceTotal = document.getElementById('workspaceTotal');
  const changeEl = document.getElementById('changeDisplay');
  const paidInput = document.getElementById('paidInput');

  if(!tx.length){
    list.innerHTML = `<li class="empty-state">No items yet. Tap a service or money button to start.</li>`;
    countEl.textContent = '0 items';
    totalEl.textContent = 'Rp 0';
    if(workspaceTotal) workspaceTotal.textContent = '0';
    changeEl.textContent = 'Rp 0';
    return;
  }
  list.innerHTML = tx.map(item=>`
    <li class="tx-item">
      <div class="tx-item__info">
        <div class="tx-item__name">${item.name}</div>
        <div class="tx-item__price">${formatRp(item.price)} × ${item.qty}</div>
      </div>
      <div class="tx-item__qty">
        <button data-dec="${item.id}" aria-label="Decrease"><i class="fa-solid fa-minus" style="font-size:10px"></i></button>
        <span>${item.qty}</span>
        <button data-inc="${item.id}" aria-label="Increase"><i class="fa-solid fa-plus" style="font-size:10px"></i></button>
      </div>
      <div class="tx-item__total">${formatRp(item.price*item.qty)}</div>
      <button class="tx-item__remove" data-remove="${item.id}" aria-label="Remove"><i class="fa-solid fa-xmark"></i></button>
    </li>
  `).join('');

  const total = tx.reduce((a,b)=>a + b.price*b.qty,0);
  const count = tx.reduce((a,b)=>a + b.qty,0);
  countEl.textContent = `${count} ${count===1?'item':'items'}`;
  totalEl.textContent = formatRp(total);
  if(workspaceTotal) workspaceTotal.textContent = formatNum(total);

  const paid = parseInt(paidInput.value||0,10);
  const change = Math.max(0, paid - total);
  changeEl.textContent = formatRp(change);
}

function addItem(name, price){
  pushHistory();
  const id = 'tx_'+Date.now()+'_'+Math.random().toString(36).slice(2,5);
  // try to merge if same name+price exists
  const existing = calcState.transaction.find(t=>t.name===name && t.price===price);
  if(existing){
    existing.qty += 1;
  } else {
    calcState.transaction.push({ id, name, price, qty:1 });
  }
  saveState(calcState);
  renderTransaction();
  if(calcState.settings.sound) playTick();
  showToast(`Added ${name} — ${formatRp(price)}`);
}

function addMoney(value){
  // Add as generic item "Uang" or just increment total via custom entry "Quick add"
  // Spec: Clicking immediately adds value: Rp500, then Rp1.000 etc -> we treat as separate line items summed
  addItem(`Quick • ${formatRp(value)}`, value);
}

function bindCalculatorEvents(){
  const moneyGrid = document.getElementById('moneyGrid');
  moneyGrid.addEventListener('click', e=>{
    const btn = e.target.closest('[data-money]');
    if(!btn) return;
    addMoney(parseInt(btn.dataset.money,10));
    updateStats(false);
  });

  const svcGrid = document.getElementById('serviceGrid');
  svcGrid.addEventListener('click', e=>{
    const btn = e.target.closest('[data-service]');
    if(!btn) return;
    const svc = calcState.services.find(s=>s.id===btn.dataset.service);
    if(svc) addItem(svc.name, svc.price);
    updateStats(false);
  });

  const txList = document.getElementById('txList');
  txList.addEventListener('click', e=>{
    const inc = e.target.closest('[data-inc]');
    const dec = e.target.closest('[data-dec]');
    const rem = e.target.closest('[data-remove]');
    if(inc){ pushHistory(); const it=calcState.transaction.find(t=>t.id===inc.dataset.inc); if(it){it.qty++; saveState(calcState); renderTransaction();} }
    if(dec){ pushHistory(); const it=calcState.transaction.find(t=>t.id===dec.dataset.dec); if(it){it.qty=Math.max(1,it.qty-1); saveState(calcState); renderTransaction();} }
    if(rem){ pushHistory(); calcState.transaction = calcState.transaction.filter(t=>t.id!==rem.dataset.remove); saveState(calcState); renderTransaction(); }
  });

  document.getElementById('pdUndoBtn').addEventListener('click', undo);
  document.getElementById('pdClearBtn').addEventListener('click', ()=>{
    if(!calcState.transaction.length) return;
    pushHistory();
    calcState.transaction = [];
    saveState(calcState);
    renderTransaction();
    showToast('Transaction cleared');
  });

  document.getElementById('addCustomBtn').addEventListener('click', ()=>{
    const name = document.getElementById('customName').value.trim() || 'Custom';
    const price = parseInt(document.getElementById('customPrice').value,10);
    if(!price || price<=0){ showToast('Enter a valid price','error'); return; }
    addItem(name, price);
    document.getElementById('customName').value='';
    document.getElementById('customPrice').value='';
  });

  document.getElementById('paidInput').addEventListener('input', renderTransaction);
  document.getElementById('copyTotalBtn').addEventListener('click', async ()=>{
    const total = calcState.transaction.reduce((a,b)=>a+b.price*b.qty,0);
    if(!total){ showToast('Nothing to copy','error'); return; }
    await navigator.clipboard.writeText(String(total));
    showToast('Total copied: '+formatRp(total));
  });
  document.getElementById('saveTxBtn').addEventListener('click', ()=>{
    const tx = calcState.transaction;
    if(!tx.length){ showToast('No transaction to save','error'); return; }
    const total = tx.reduce((a,b)=>a+b.price*b.qty,0);
    const rec = { id: Date.now(), total, items: tx.map(t=>`${t.name} ×${t.qty}`).join(', '), at: new Date().toISOString() };
    calcState.recents.unshift(rec);
    calcState.recents = calcState.recents.slice(0,10);
    calcState.stats.totalCalculated = (calcState.stats.totalCalculated||0)+total;
    calcState.stats.txCount = (calcState.stats.txCount||0)+1;
    saveState(calcState);
    calcState.transaction = [];
    saveState(calcState);
    renderTransaction();
    renderRecents();
    updateStats();
    document.getElementById('paidInput').value='';
    showToast('Saved — total '+formatRp(total),'success');
  });

  // Edit services
  document.getElementById('editServicesBtn').addEventListener('click', openServiceModal);
}

function renderRecents(){
  const ul = document.getElementById('recentList');
  if(!calcState) return;
  const recents = calcState.recents;
  if(!recents.length){
    ul.innerHTML = `<li class="empty-state">No recent calculations yet. Use Price Desk to start.</li>`;
    return;
  }
  ul.innerHTML = recents.map(r=>{
    const d = new Date(r.at);
    const time = d.toLocaleString('id-ID',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'});
    return `<li>
      <span style="flex:1;min-width:0"><strong>${formatRp(r.total)}</strong> <span style="color:var(--muted);font-size:12px">• ${r.items.slice(0,60)}${r.items.length>60?'…':''}</span></span>
      <span style="font-size:11px;color:var(--muted);white-space:nowrap">${time}</span>
    </li>`;
  }).join('');
}

function updateStats(persist=true){
  const statTx = document.getElementById('statTransactions');
  const statTotal = document.getElementById('statTotal');
  const statPaper = document.getElementById('statPaper');
  if(statTx) statTx.textContent = calcState.stats.txCount||0;
  if(statTotal) statTotal.textContent = formatRp(calcState.stats.totalCalculated||0);
  if(statPaper) statPaper.textContent = `${calcState.settings.paper} • ${calcState.settings.orientation==='portrait'?'Portrait':'Landscape'}`;
  // workspace total already updated in renderTransaction
}

function openServiceModal(){
  const modal = document.getElementById('serviceModal');
  const body = document.getElementById('serviceModalBody');
  body.innerHTML = calcState.services.map(s=>`
    <div class="service-edit-row">
      <label>${s.name}</label>
      <input type="number" data-svc="${s.id}" value="${s.price}" min="0" step="100">
    </div>
  `).join('');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden','false');
  // close handlers
  document.getElementById('serviceCloseBtn').onclick = closeServiceModal;
  document.getElementById('serviceBackdrop').onclick = closeServiceModal;
  document.getElementById('serviceSaveBtn').onclick = ()=>{
    body.querySelectorAll('input[data-svc]').forEach(inp=>{
      const svc = calcState.services.find(s=>s.id===inp.dataset.svc);
      if(svc) svc.price = parseInt(inp.value,10)||0;
    });
    saveState(calcState);
    renderServices();
    closeServiceModal();
    showToast('Prices updated','success');
  };
  document.getElementById('serviceResetBtn').onclick = ()=>{
    calcState.services = structuredClone(defaultState.services);
    body.querySelectorAll('input[data-svc]').forEach(inp=>{
      const svc = calcState.services.find(s=>s.id===inp.dataset.svc);
      if(svc) inp.value = svc.price;
    });
  };
}
function closeServiceModal(){
  const modal = document.getElementById('serviceModal');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
}

function playTick(){
  try{
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value=880; o.connect(g); g.connect(ctx.destination);
    g.gain.value=.08; o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+.12);
    setTimeout(()=>ctx.close(),200);
  }catch{}
}
