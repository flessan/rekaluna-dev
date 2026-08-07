/* storage.js — localStorage helpers */
const STORAGE_KEY = 'rekaluna:v1';

const defaultState = {
  settings: {
    paper: 'A4',
    orientation: 'portrait',
    theme: 'light',
    sound: false,
    keepTransaction: true,
  },
  services: [
    { id: 'bw', name: 'Print Black & White', price: 500, icon: 'fa-print', hint: 'Per sheet' },
    { id: 'color', name: 'Print Color', price: 1000, icon: 'fa-palette', hint: 'Per sheet' },
    { id: 'copy_bw', name: 'Photocopy B/W', price: 250, icon: 'fa-copy', hint: 'Per sheet' },
    { id: 'copy_color', name: 'Photocopy Color', price: 500, icon: 'fa-copy', hint: 'Per sheet' },
    { id: 'scan', name: 'Scan', price: 500, icon: 'fa-expand', hint: 'Per sheet' },
    { id: 'laminating', name: 'Laminating', price: 3000, icon: 'fa-id-card', hint: 'Per sheet' },
  ],
  transaction: [], // {id, serviceId, name, price, qty}
  recents: [], // {id, total, items, at}
  stats: { totalCalculated: 0, txCount: 0 },
  favorites: ['quickprint','pricedesk','resources'],
  quickPrint: { paper: 'A4', orientation: 'portrait', fit: 'contain', copies: 1, margin: '8', grayscale:false, mirror:false }
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(defaultState);
    const parsed = JSON.parse(raw);
    // merge with defaults for new fields
    return {
      ...structuredClone(defaultState),
      ...parsed,
      settings: { ...defaultState.settings, ...(parsed.settings||{}) },
      services: parsed.services || defaultState.services,
      transaction: parsed.transaction || [],
      recents: parsed.recents || [],
      stats: { ...defaultState.stats, ...(parsed.stats||{}) },
      favorites: parsed.favorites || defaultState.favorites,
      quickPrint: { ...defaultState.quickPrint, ...(parsed.quickPrint||{}) }
    };
  }catch(e){
    console.warn('loadState fail', e);
    return structuredClone(defaultState);
  }
}
function saveState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function updateState(patch){
  const s = loadState();
  const next = { ...s, ...patch };
  saveState(next);
  return next;
}
function clearAll(){
  localStorage.removeItem(STORAGE_KEY);
}
