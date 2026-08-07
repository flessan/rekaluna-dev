/* print.js — Quick Print logic */
let qpState = null;
let currentImageSrc = null;
let currentRotation = 0;
let paperSizes = {
  'A4': {w:210,h:297,desc:'210 × 297 mm • Standard'},
  'F4': {w:215,h:330,desc:'215 × 330 mm • Folio'},
  'Letter': {w:216,h:279,desc:'216 × 279 mm • US Letter'},
  'Legal': {w:216,h:356,desc:'216 × 356 mm • US Legal'},
};

function initPrint(state){
  qpState = state.quickPrint || state;
  // ensure values
  qpState.paper = state.settings.paper || qpState.paper || 'A4';
  qpState.orientation = state.settings.orientation || qpState.orientation || 'portrait';
  qpState.fit = qpState.fit || 'contain';
  qpState.copies = qpState.copies || 1;
  qpState.margin = qpState.margin || '8';
  qpState.grayscale = !!qpState.grayscale;
  qpState.mirror = !!qpState.mirror;

  bindPrintEvents();
  applyPaper();
  updateControlsUI();

  // handle paste globally
  document.addEventListener('paste', handlePaste);
  document.addEventListener('keydown', e=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='p'){
      // let quick print page intercept
      const qpActive = document.getElementById('page-quickprint').classList.contains('is-active');
      if(qpActive && currentImageSrc){ e.preventDefault(); doPrint(); }
    }
  });
}

function bindPrintEvents(){
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const chooseBtn = document.getElementById('chooseFileBtn');

  chooseBtn.addEventListener('click', e=>{ e.stopPropagation(); fileInput.click(); });
  fileInput.addEventListener('change', e=>{
    const f = e.target.files[0];
    if(f) loadFile(f);
  });
  dropzone.addEventListener('click', e=>{
    if(e.target.closest('button') || e.target.closest('input')) return;
    if(!currentImageSrc) fileInput.click();
  });
  dropzone.addEventListener('dragover', e=>{ e.preventDefault(); dropzone.classList.add('is-dragover'); });
  dropzone.addEventListener('dragleave', ()=> dropzone.classList.remove('is-dragover'));
  dropzone.addEventListener('drop', e=>{
    e.preventDefault(); dropzone.classList.remove('is-dragover');
    const f = e.dataTransfer.files[0];
    if(f) loadFile(f);
  });

  document.getElementById('qpRotateBtn').addEventListener('click', ()=>{
    currentRotation = (currentRotation + 90) % 360;
    applyImageStyle();
    saveQP();
  });
  document.getElementById('qpRemoveBtn').addEventListener('click', clearImage);
  document.getElementById('qpClearBtn').addEventListener('click', clearImage);
  document.getElementById('qpPrintBtn').addEventListener('click', doPrint);
  document.getElementById('qpPrintBtn2').addEventListener('click', doPrint);

  // segmented controls
  document.querySelectorAll('[data-paper]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-paper]').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      qpState.paper = btn.dataset.paper;
      applyPaper(); saveQP(); updatePaperDesc();
    });
  });
  document.querySelectorAll('[data-orient]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-orient]').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      qpState.orientation = btn.dataset.orient;
      applyPaper(); saveQP();
    });
  });
  document.querySelectorAll('[data-fit]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('[data-fit]').forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      qpState.fit = btn.dataset.fit;
      applyImageStyle(); saveQP();
    });
  });

  document.getElementById('copiesInput').addEventListener('input', e=>{
    qpState.copies = Math.max(1, Math.min(99, parseInt(e.target.value,10)||1));
    saveQP();
  });
  document.querySelectorAll('[data-step]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const dir = parseInt(btn.dataset.dir,10);
      const input = document.getElementById('copiesInput');
      let v = parseInt(input.value,10)||1;
      v = Math.max(1, Math.min(99, v+dir));
      input.value=v; qpState.copies=v; saveQP();
    });
  });
  document.getElementById('marginInput').addEventListener('change', e=>{
    qpState.margin = e.target.value;
    applyPaper(); saveQP();
  });
  document.getElementById('grayscaleCheck').addEventListener('change', e=>{
    qpState.grayscale = e.target.checked;
    applyImageStyle(); saveQP();
  });
  document.getElementById('mirrorCheck').addEventListener('change', e=>{
    qpState.mirror = e.target.checked;
    applyImageStyle(); saveQP();
  });
}

function handlePaste(e){
  const items = e.clipboardData && e.clipboardData.items;
  if(!items) return;
  for(const it of items){
    if(it.type.startsWith('image/')){
      const f = it.getAsFile();
      if(f){ loadFile(f); showToast('Image pasted','success'); e.preventDefault(); break; }
    }
  }
}

function loadFile(file){
  if(!file.type.startsWith('image/')){ showToast('Only images supported','error'); return; }
  const reader = new FileReader();
  reader.onload = ev=>{
    currentImageSrc = ev.target.result;
    document.getElementById('previewImg').src = currentImageSrc;
    document.getElementById('qpFilename').textContent = file.name || 'Pasted image';
    document.getElementById('dropzoneIdle').hidden = true;
    document.getElementById('dropzonePreview').hidden = false;
    currentRotation = 0;
    applyImageStyle();
    applyPaper();
    saveQP();
  };
  reader.readAsDataURL(file);
}

function clearImage(){
  currentImageSrc=null;
  document.getElementById('previewImg').removeAttribute('src');
  document.getElementById('dropzoneIdle').hidden=false;
  document.getElementById('dropzonePreview').hidden=true;
  document.getElementById('qpFilename').textContent='';
  document.getElementById('fileInput').value='';
}

function applyPaper(){
  const paper = document.getElementById('paper');
  const size = paperSizes[qpState.paper];
  let w = size.w, h = size.h;
  if(qpState.orientation==='landscape'){ [w,h]=[h,w]; }
  // scale to fit preview: max width 420px
  // use CSS custom size: base on mm to px ratio ~ 2.2
  const scale = 1.9;
  paper.style.width = (w*scale)+'px';
  paper.style.height = (h*scale)+'px';
  const m = parseInt(qpState.margin,10);
  paper.style.padding = (m*scale)+'px';
  paper.style.boxSizing='border-box';
  updatePaperDesc();
}

function updatePaperDesc(){
  const size = paperSizes[qpState.paper];
  const el = document.getElementById('paperDesc');
  if(el) el.textContent = size.desc;
}

function applyImageStyle(){
  const img = document.getElementById('previewImg');
  if(!img) return;
  img.style.objectFit = qpState.fit==='cover' ? 'cover' : 'contain';
  let transforms = [];
  if(currentRotation) transforms.push(`rotate(${currentRotation}deg)`);
  if(qpState.mirror) transforms.push('scaleX(-1)');
  img.style.transform = transforms.join(' ') || 'none';
  img.style.filter = qpState.grayscale ? 'grayscale(1)' : 'none';
  // when rotated 90/270, need to handle container sizing? keep contain
}

function updateControlsUI(){
  // paper
  document.querySelectorAll('[data-paper]').forEach(b=>b.classList.toggle('is-active', b.dataset.paper===qpState.paper));
  document.querySelectorAll('[data-orient]').forEach(b=>b.classList.toggle('is-active', b.dataset.orient===qpState.orientation));
  document.querySelectorAll('[data-fit]').forEach(b=>b.classList.toggle('is-active', b.dataset.fit===qpState.fit));
  document.getElementById('copiesInput').value = qpState.copies;
  document.getElementById('marginInput').value = qpState.margin;
  document.getElementById('grayscaleCheck').checked = qpState.grayscale;
  document.getElementById('mirrorCheck').checked = qpState.mirror;
  updatePaperDesc();
  applyPaper();
  applyImageStyle();
}

function saveQP(){
  // persist quickPrint into main state
  if(!window._rkState) return;
  window._rkState.quickPrint = {...qpState};
  // also sync default paper/orient to settings for workspace stat
  // don't overwrite settings yet, only quickPrint
  saveState(window._rkState);
}

function doPrint(){
  if(!currentImageSrc){ showToast('No image to print — paste one first','error'); return; }
  // set copies hint via CSS? window.print doesn't support copies; show info
  if(qpState.copies>1){
    showToast(`Printing ${qpState.copies} copies — set copies in printer dialog if needed`);
  }
  // Ensure paper stage visible for print: browser will print #paper only via @media print
  window.print();
}
