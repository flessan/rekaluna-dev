/* ui.js — navigation, command palette, settings, resources, toasts */
function showToast(msg, type=''){
  const stack = document.getElementById('toastStack');
  const t = document.createElement('div');
  t.className = 'toast'+(type? ' toast--'+type:'');
  t.innerHTML = (type==='success'?'<i class="fa-solid fa-check"></i>': type==='error'?'<i class="fa-solid fa-triangle-exclamation"></i>':'<i class="fa-solid fa-circle-info"></i>') + '<span>'+msg+'</span>';
  stack.appendChild(t);
  setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateY(6px)'; t.style.transition='all .3s'; },2600);
  setTimeout(()=> t.remove(),3000);
}

// Resources data
const resources = [
  {id:'epson', name:'Epson Drivers', cat:'driver', desc:'Official Epson support — drivers for EcoTank, WorkForce, L-series.', icon:'fa-print', color:'#003399', url:'https://support.epson.net/setupnavi/?LG2=EN'},
  {id:'canon', name:'Canon Drivers', cat:'driver', desc:'Canon support — PIXMA, MAXIFY, imageCLASS drivers & manuals.', icon:'fa-print', color:'#cc0000', url:'https://www.usa.canon.com/support'},
  {id:'brother', name:'Brother Drivers', cat:'driver', desc:'Brother support — MFC, DCP, HL series drivers.', icon:'fa-print', color:'#0066cc', url:'https://support.brother.com/'},
  {id:'hp', name:'HP Drivers', cat:'driver', desc:'HP support — LaserJet, OfficeJet, DeskJet drivers.', icon:'fa-print', color:'#0096d6', url:'https://support.hp.com/us-en/drivers'},
  {id:'lightshot', name:'Lightshot', cat:'app', desc:'Lightweight screenshot tool — quick grabs for print jobs.', icon:'fa-camera', color:'#5a00d1', url:'https://app.prntscr.com/en/index.html'},
  {id:'acrobat', name:'Adobe Acrobat Reader', cat:'app', desc:'View, print & comment on PDF files reliably.', icon:'fa-file-pdf', color:'#fa0f00', url:'https://get.adobe.com/reader/'},
  {id:'sumatra', name:'SumatraPDF', cat:'app', desc:'Minimal PDF viewer — fast, open-source, portable.', icon:'fa-file-pdf', color:'#333', url:'https://www.sumatrapdfreader.org/free-pdf-reader'},
  {id:'7zip', name:'7-Zip', cat:'tool', desc:'File archiver — handle ZIP/RAR for customer files.', icon:'fa-file-zipper', color:'#000', url:'https://www.7-zip.org/'},
  {id:'everything', name:'Everything Search', cat:'tool', desc:'Instant file search for Windows — find customer files in seconds.', icon:'fa-magnifying-glass', color:'#ff6600', url:'https://www.voidtools.com/'},
  {id:'notepad', name:'Notepad++', cat:'tool', desc:'Text editor — quick edits for labels and invoices.', icon:'fa-file-lines', color:'#7ed321', url:'https://notepad-plus-plus.org/'},
];

function renderResources(filter='all', query=''){
  const grid = document.getElementById('resourceGrid');
  let list = resources;
  if(filter!=='all') list = list.filter(r=>r.cat===filter);
  if(query){
    const q=query.toLowerCase();
    list = list.filter(r=> r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
  }
  if(!list.length){
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:24px;color:var(--muted);border:1px dashed var(--border);border-radius:12px">No resources found for “${query}”</div>`;
    return;
  }
  grid.innerHTML = list.map(r=>`
    <article class="resource-card">
      <div class="resource-card__head">
        <div class="resource-card__icon" style="color:${r.color}"><i class="fa-solid ${r.icon}"></i></div>
        <div>
          <h3 class="resource-card__title">${r.name}</h3>
          <span class="resource-card__cat">${r.cat}</span>
        </div>
      </div>
      <p class="resource-card__desc">${r.desc}</p>
      <div class="resource-card__actions">
        <a href="${r.url}" target="_blank" rel="noopener" class="btn btn--primary" style="flex:1"><i class="fa-solid fa-arrow-up-right-from-square"></i> Official site</a>
        <button class="icon-btn" aria-label="Copy link" data-copy="${r.url}"><i class="fa-regular fa-copy"></i></button>
      </div>
    </article>
  `).join('');
}

function initUI(state){
  // navigation
  const navItems = document.querySelectorAll('[data-nav]');
  const pages = document.querySelectorAll('.page');
  function navigate(id){
    navItems.forEach(a=>a.classList.toggle('is-active', a.dataset.nav===id));
    pages.forEach(p=>p.classList.toggle('is-active', p.id==='page-'+id));
    // update sidebar active
    document.querySelectorAll('.sidebar .nav-item').forEach(a=>{
      a.classList.toggle('is-active', a.dataset.nav===id);
      if(a.dataset.nav===id) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo({top:0,behavior:'smooth'});
    // close mobile sheet if open
    closeMobileSheet();
  }
  navItems.forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      navigate(a.dataset.nav);
    });
  });
  // action cards
  document.querySelectorAll('.action-card').forEach(card=>{
    const go = ()=> navigate(card.dataset.nav);
    card.addEventListener('click', go);
    card.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' ') {e.preventDefault(); go();} });
  });

  // resources filter/search
  const cats = document.querySelectorAll('.resource-cats .chip');
  let currentFilter='all';
  cats.forEach(c=>{
    c.addEventListener('click', ()=>{
      cats.forEach(x=>x.classList.remove('is-active'));
      c.classList.add('is-active');
      currentFilter=c.dataset.filter;
      renderResources(currentFilter, document.getElementById('resourceSearch').value);
    });
  });
  document.getElementById('resourceSearch').addEventListener('input', e=>{
    renderResources(currentFilter, e.target.value);
  });
  renderResources();

  // copy link delegation
  document.getElementById('resourceGrid').addEventListener('click', async e=>{
    const btn = e.target.closest('[data-copy]');
    if(!btn) return;
    await navigator.clipboard.writeText(btn.dataset.copy);
    showToast('Link copied','success');
  });

  // favorites
  renderFavorites(state);

  // command palette
  initCommandPalette(navigate);
  // mobile search sheet
  initMobileSheet(navigate);
  // settings
  initSettings(state);
  // clock
  initClock();
  // support copy
  const copySupportBtn = document.getElementById('copySupportBtn');
  if(copySupportBtn) copySupportBtn.addEventListener('click', async ()=>{
    await navigator.clipboard.writeText('Support Rekaluna — https://rekaluna.example — Thank you!');
    showToast('Support message copied','success');
  });

  // favorites manage
  document.getElementById('manageFavBtn').addEventListener('click', ()=>{
    showToast('Favorites are pinned tools: Quick Print, Price Desk, Resources');
  });
  document.getElementById('clearRecentBtn').addEventListener('click', ()=>{
    state.recents=[]; saveState(state); if(typeof renderRecents==='function') renderRecents(); showToast('Recents cleared');
  });

  // topbar search triggers
  document.getElementById('searchTrigger').addEventListener('click', openCommandPalette);
}

function renderFavorites(state){
  const favGrid = document.getElementById('favGrid');
  const map = {
    quickprint:{icon:'fa-print',label:'Quick Print',nav:'quickprint'},
    pricedesk:{icon:'fa-calculator',label:'Price Desk',nav:'pricedesk'},
    resources:{icon:'fa-download',label:'Resources',nav:'resources'},
    support:{icon:'fa-heart',label:'Support',nav:'support'},
    workspace:{icon:'fa-house',label:'Workspace',nav:'workspace'},
  };
  const favs = state.favorites || ['quickprint','pricedesk','resources'];
  favGrid.innerHTML = favs.map(k=>{
    const m=map[k]; if(!m) return '';
    return `<button class="fav-btn" data-nav="${m.nav}"><i class="fa-solid ${m.icon}"></i><span>${m.label}</span></button>`;
  }).join('');
  favGrid.querySelectorAll('[data-nav]').forEach(b=>{
    b.addEventListener('click', e=>{
      e.preventDefault();
      document.querySelector(`.sidebar [data-nav="${b.dataset.nav}"]`)?.click();
    });
  });
}

function initClock(){
  function tick(){
    const now=new Date();
    const clock=document.getElementById('liveClock');
    const date=document.getElementById('liveDate');
    if(clock) clock.textContent = now.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
    if(date) date.textContent = now.toLocaleDateString('id-ID',{weekday:'short',day:'2-digit',month:'short'});
    const greet=document.getElementById('workspace-title');
    if(greet){
      const h=now.getHours();
      let g='Good morning';
      if(h>=11 && h<15) g='Good afternoon';
      else if(h>=15 && h<18) g='Good evening';
      else if(h>=18) g='Good evening';
      greet.childNodes[0].textContent = g+' ';
    }
  }
  tick(); setInterval(tick,60000);
}

// Command palette
let cmdCommands = [];
function initCommandPalette(navigate){
  cmdCommands = [
    {id:'workspace', title:'Workspace', desc:'Go to dashboard', icon:'fa-house', action:()=>navigate('workspace'), kbd:'1'},
    {id:'quickprint', title:'Quick Print', desc:'Paste & print image', icon:'fa-print', action:()=>navigate('quickprint'), kbd:'2'},
    {id:'pricedesk', title:'Price Desk', desc:'Calculate printing prices', icon:'fa-calculator', action:()=>navigate('pricedesk'), kbd:'3'},
    {id:'resources', title:'Resources', desc:'Drivers & apps', icon:'fa-download', action:()=>navigate('resources'), kbd:'4'},
    {id:'support', title:'Support', desc:'Donate via QRIS', icon:'fa-heart', action:()=>navigate('support')},
    {id:'about', title:'About', desc:'Project info & license', icon:'fa-circle-info', action:()=>navigate('about')},
    {id:'print', title:'Print image', desc:'Open print dialog', icon:'fa-print', action:()=>{ navigate('quickprint'); setTimeout(()=>window.print(),300);} },
    {id:'settings', title:'Settings', desc:'Configure defaults', icon:'fa-gear', action:()=> openSettings() },
    {id:'clearTx', title:'Clear transaction', desc:'Price Desk', icon:'fa-trash', action:()=> document.getElementById('pdClearBtn').click() },
  ];
  const palette=document.getElementById('commandPalette');
  const input=document.getElementById('cmdInput');
  const list=document.getElementById('cmdList');
  const backdrop=document.getElementById('cmdBackdrop');

  function render(q=''){
    const filtered = q ? cmdCommands.filter(c=> (c.title+c.desc).toLowerCase().includes(q.toLowerCase())) : cmdCommands;
    list.innerHTML = filtered.map((c,i)=>`
      <li class="cmd-item ${i===0?'is-active':''}" role="option" data-cmd="${c.id}" tabindex="-1">
        <i class="fa-solid ${c.icon}"></i>
        <div style="flex:1;min-width:0"><div class="cmd-item__title">${c.title}</div><div class="cmd-item__desc">${c.desc}</div></div>
        ${c.kbd?'<span class="cmd-item__kbd">'+c.kbd+'</span>':''}
      </li>
    `).join('') || `<li style="padding:12px;text-align:center;color:var(--muted)">No commands found</li>`;
    // keyboard nav handled separately
  }
  window.openCommandPalette = ()=>{
    palette.classList.add('is-open');
    palette.setAttribute('aria-hidden','false');
    input.value=''; render('');
    setTimeout(()=>input.focus(),30);
  };
  function close(){ palette.classList.remove('is-open'); palette.setAttribute('aria-hidden','true'); }
  window.closeCommandPalette = close;
  backdrop.addEventListener('click', close);
  input.addEventListener('input', e=> render(e.target.value));
  input.addEventListener('keydown', e=>{
    const items=[...list.querySelectorAll('.cmd-item[data-cmd]')];
    let idx = items.findIndex(x=>x.classList.contains('is-active'));
    if(e.key==='ArrowDown'){ e.preventDefault(); idx=Math.min(items.length-1, idx+1); items.forEach(x=>x.classList.remove('is-active')); items[idx]?.classList.add('is-active'); }
    if(e.key==='ArrowUp'){ e.preventDefault(); idx=Math.max(0, idx-1); items.forEach(x=>x.classList.remove('is-active')); items[idx]?.classList.add('is-active'); }
    if(e.key==='Enter'){ e.preventDefault(); const active=list.querySelector('.cmd-item.is-active'); const id=active?.dataset.cmd; const cmd=cmdCommands.find(c=>c.id===id); if(cmd){close(); cmd.action();} }
    if(e.key==='Escape'){ e.preventDefault(); close(); }
  });
  list.addEventListener('click', e=>{
    const item=e.target.closest('[data-cmd]'); if(!item) return;
    const cmd=cmdCommands.find(c=>c.id===item.dataset.cmd); if(cmd){close(); cmd.action();}
  });
  // global shortcut
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); if(palette.classList.contains('is-open')) close(); else openCommandPalette(); }
    if(e.key==='Escape' && palette.classList.contains('is-open')) close();
  });
}

function initMobileSheet(navigate){
  // Reuse command palette commands for sheet
  const sheet=document.getElementById('mobileSearchSheet');
  const input=document.getElementById('mobileSearchInput');
  const list=document.getElementById('sheetList');
  const backdrop=document.getElementById('sheetBackdrop');
  const closeBtn=document.getElementById('sheetCloseBtn');

  function render(q=''){
    const cmds = [
      {id:'workspace', title:'Workspace', desc:'Dashboard', icon:'fa-house'},
      {id:'quickprint', title:'Quick Print', desc:'Paste & print', icon:'fa-print'},
      {id:'pricedesk', title:'Price Desk', desc:'Calculator', icon:'fa-calculator'},
      {id:'resources', title:'Resources', desc:'Drivers & apps', icon:'fa-download'},
      {id:'support', title:'Support', desc:'Donate', icon:'fa-heart'},
      {id:'about', title:'About', desc:'Info', icon:'fa-circle-info'},
    ];
    const filtered = q ? cmds.filter(c=> (c.title+c.desc).toLowerCase().includes(q.toLowerCase())) : cmds;
    list.innerHTML = filtered.map(c=>`
      <li class="cmd-item" data-nav="${c.id}"><i class="fa-solid ${c.icon}"></i><div style="flex:1"><div class="cmd-item__title">${c.title}</div><div class="cmd-item__desc">${c.desc}</div></div></li>
    `).join('');
  }
  function open(){ sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden','false'); render(''); input.value=''; setTimeout(()=>input.focus(),80); }
  window.closeMobileSheet = ()=>{ sheet.classList.remove('is-open'); sheet.setAttribute('aria-hidden','true'); };
  // The topbar search on mobile should open sheet; desktop opens palette
  const searchTrigger=document.getElementById('searchTrigger');
  searchTrigger.addEventListener('click', e=>{
    if(window.innerWidth<=720){ e.preventDefault(); e.stopImmediatePropagation(); open(); }
  });
  backdrop.addEventListener('click', closeMobileSheet);
  closeBtn.addEventListener('click', closeMobileSheet);
  input.addEventListener('input', e=> render(e.target.value));
  list.addEventListener('click', e=>{
    const item=e.target.closest('[data-nav]'); if(!item) return;
    closeMobileSheet();
    navigate(item.dataset.nav);
  });
  input.addEventListener('keydown', e=>{ if(e.key==='Escape') closeMobileSheet(); });
}

function initSettings(state){
  const modal=document.getElementById('settingsModal');
  const openBtn=document.getElementById('settingsBtn');
  const closeBtn=document.getElementById('settingsCloseBtn');
  const backdrop=document.getElementById('settingsBackdrop');
  window.openSettings = ()=>{
    document.getElementById('settingPaper').value = state.settings.paper;
    document.getElementById('settingOrient').value = state.settings.orientation;
    document.querySelectorAll('[data-theme]').forEach(b=>b.classList.toggle('is-active', b.dataset.theme===state.settings.theme));
    document.getElementById('settingSound').checked = !!state.settings.sound;
    document.getElementById('settingKeepTransaction').checked = !!state.settings.keepTransaction;
    modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false');
  };
  function close(){ modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true'); }
  window.closeSettings = close;
  openBtn.addEventListener('click', openSettings);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && modal.classList.contains('is-open')) close(); });

  document.querySelectorAll('[data-theme]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-theme]').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
    });
  });

  document.getElementById('saveSettingsBtn').addEventListener('click', ()=>{
    const paper=document.getElementById('settingPaper').value;
    const orient=document.getElementById('settingOrient').value;
    const theme=document.querySelector('[data-theme].is-active')?.dataset.theme || 'light';
    state.settings.paper=paper;
    state.settings.orientation=orient;
    state.settings.theme=theme;
    state.settings.sound=document.getElementById('settingSound').checked;
    state.settings.keepTransaction=document.getElementById('settingKeepTransaction').checked;
    // apply theme
    document.body.classList.toggle('theme-dark', theme==='dark');
    saveState(state);
    // update UI
    if(window.updateStats) updateStats();
    // also update quickPrint defaults
    if(state.quickPrint){ state.quickPrint.paper=paper; state.quickPrint.orientation=orient; saveState(state); }
    close();
    showToast('Settings saved','success');
  });
  document.getElementById('resetSettingsBtn').addEventListener('click', ()=>{
    state.settings = structuredClone(defaultState.settings);
    saveState(state);
    document.body.classList.remove('theme-dark');
    showToast('Settings reset');
    close();
    location.reload();
  });
  document.getElementById('clearStorageBtn').addEventListener('click', ()=>{
    if(confirm('Clear all local data? This cannot be undone.')){
      clearAll();
      showToast('Local data cleared — reloading');
      setTimeout(()=>location.reload(),600);
    }
  });
  // apply theme on load
  if(state.settings.theme==='dark') document.body.classList.add('theme-dark');
}
