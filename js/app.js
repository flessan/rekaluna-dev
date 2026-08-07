/* app.js — bootstrap */
let _rkState = loadState();
window._rkState = _rkState;

document.addEventListener('DOMContentLoaded', ()=>{
  // expose for print.js
  window._rkState = _rkState;

  initUI(_rkState);
  initCalculator(_rkState);
  initPrint(_rkState);
  renderRecents();
  updateStats();

  // keep state ref in sync after saves
  const origSave = saveState;
  window.saveState = (s)=>{ _rkState=s; window._rkState=s; origSave(s); };

  // Accessibility: global ESC closes modals
  document.addEventListener('keydown', e=>{
    if(e.key==='Escape'){
      closeCommandPalette?.();
      if(document.getElementById('settingsModal').classList.contains('is-open')) closeSettings?.();
      if(document.getElementById('serviceModal').classList.contains('is-open')){
        document.getElementById('serviceModal').classList.remove('is-open');
      }
    }
  });

  // Service worker hint — not required
  console.log('%c Rekaluna — All Your Printing Needs. ','background:#9C1C26;color:#fff;padding:8px 10px;border-radius:8px');
});

// Ensure global helpers available after DOM
function refreshState(){
  _rkState = loadState();
  window._rkState=_rkState;
  return _rkState;
}
