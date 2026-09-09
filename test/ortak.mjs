/* ================= Başsız test yükleyicisi =================
   Tarayıcı olmadan game.js'i çalıştırmak için asgari bir DOM taklidi.
   Amaç gerçek bir tarayıcıyı taklit etmek değil; yükleme hatalarını, kural
   katmanındaki mantık hatalarını ve döngü kararlılığını yakalamak.
   Şartname §20 — "Başsız test koşumu". */
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

function ctxStub(){
  return new Proxy({}, {
    get(t, k){
      if(k==='measureText') return () => ({width:8});
      if(k==='canvas') return {width:420, height:240};
      if(k==='createLinearGradient' || k==='createRadialGradient')
        return () => ({addColorStop(){}});
      if(k==='getImageData') return () => ({data:new Uint8ClampedArray(4)});
      if(typeof k === 'string' && !(k in t)) return () => {};
      return t[k];
    },
    set(t,k,v){ t[k]=v; return true; }
  });
}

function elStub(id){
  const cocuklar=[];
  const el={
    id, tagName:'DIV', hidden:false, disabled:false, value:'',
    textContent:'', innerHTML:'', className:'', title:'',
    style:{}, dataset:{}, children:cocuklar, parentNode:null,
    clientWidth:420, clientHeight:640, offsetWidth:420, offsetHeight:240,
    firstChild:null, content:{cloneNode(){ return elStub('klon'); }},
    classList:{
      _s:new Set(),
      add(...c){ c.forEach(x=>this._s.add(x)); },
      remove(...c){ c.forEach(x=>this._s.delete(x)); },
      toggle(c,f){ const v = f===undefined ? !this._s.has(c) : !!f;
                   v ? this._s.add(c) : this._s.delete(c); return v; },
      contains(c){ return this._s.has(c); }
    },
    addEventListener(){}, removeEventListener(){},
    setAttribute(){}, getAttribute(){ return null; }, removeAttribute(){},
    setPointerCapture(){}, releasePointerCapture(){}, focus(){}, blur(){},
    appendChild(c){ cocuklar.push(c); c.parentNode=el; el.firstChild=cocuklar[0]; return c; },
    removeChild(c){ const i=cocuklar.indexOf(c); if(i>=0) cocuklar.splice(i,1);
                    el.firstChild=cocuklar[0]||null; return c; },
    remove(){ if(el.parentNode) el.parentNode.removeChild(el); },
    querySelector(){ return null; },
    querySelectorAll(){ return []; },
    closest(){ return null; },
    contains(){ return false; },
    getBoundingClientRect(){ return {left:0, top:0, right:420, bottom:240, width:420, height:240}; },
    getContext(){ return ctxStub(); },
    toDataURL(){ return 'data:,'; }
  };
  return el;
}

export function oyunuYukle(opts={}){
  const kok = opts.kok || process.cwd();
  const kaynak = fs.readFileSync(path.join(kok,'game.js'),'utf8');

  const elemanlar = new Map();
  const belge = {
    hidden:false,
    getElementById(id){
      if(!elemanlar.has(id)) elemanlar.set(id, elStub(id));
      return elemanlar.get(id);
    },
    createElement(tag){ const e=elStub('yeni-'+tag); e.tagName=tag.toUpperCase(); return e; },
    querySelector(){ return null; },
    querySelectorAll(){ return []; },
    addEventListener(){}, removeEventListener(){},
    body: elStub('body'),
    fonts:{ ready: Promise.resolve() }
  };

  const depo = new Map();
  const yerelDepo = {
    getItem(k){ return depo.has(k) ? depo.get(k) : null; },
    setItem(k,v){ depo.set(k, String(v)); },
    removeItem(k){ depo.delete(k); },
    clear(){ depo.clear(); }
  };

  // Zamanlayıcılar testte otomatik çalışmaz: testler adımı kendisi atar.
  const sandbox = {
    console, Math, Date, JSON, Set, Map, Array, Object, String, Number,
    Boolean, Error, isNaN, parseInt, parseFloat, Promise, Uint8ClampedArray,
    document: belge,
    localStorage: yerelDepo,
    devicePixelRatio: 1,
    requestAnimationFrame(){ return 1; },
    cancelAnimationFrame(){},
    /* Zamanlayıcılar otomatik çalışmaz ama KAYBOLMAZ: kuyruğa girer ve
       test kendi ilerletir. Eskiden hepsi yutuluyordu; bu, gecikmeli
       çalışan yenilgi/zafer ekranlarını testten gizliyordu. */
    setTimeout(fn, ms){ sandbox.__kuyruk.push({fn, ms: ms || 0}); return sandbox.__kuyruk.length; },
    clearTimeout(){},
    setInterval(){ return 1; }, clearInterval(){},
    matchMedia(){ return {matches:false, addEventListener(){}}; },
    getComputedStyle(){ return {paddingLeft:'8px', paddingRight:'8px',
                                paddingTop:'8px', paddingBottom:'8px'}; },
    performance:{ now(){ return Date.now(); } },
    navigator:{ userAgent:'node' },
    location:{ reload(){ sandbox.__yenilendi=true; } },
    addEventListener(){}, removeEventListener(){}, dispatchEvent(){ return true; },
    __yenilendi:false,
    __kuyruk:[],
    /* Bekleyen zamanlayıcıları çalıştır (varsayılan: hepsi). */
    __zamanIlerlet(){
      const isler = sandbox.__kuyruk.splice(0, sandbox.__kuyruk.length);
      isler.sort((a, b) => a.ms - b.ms).forEach(i => { try{ i.fn(); }catch(e){} });
      return isler.length;
    }
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(kaynak, sandbox, {filename:'game.js'});
  return sandbox;
}

/* --- Küçük test koşucusu: bağımlılık yok, çıkış kodu CI'a uygun --- */
export function kosu(){
  let gecen=0, kalan=[];
  const t=(ad, fn)=>{
    try{ fn(); gecen++; console.log('  ✓ '+ad); }
    catch(e){ kalan.push(ad+' → '+e.message); console.log('  ✗ '+ad+'\n      '+e.message); }
  };
  const bitir=()=>{
    console.log('\n  '+gecen+' geçti, '+kalan.length+' kaldı');
    if(kalan.length){ process.exitCode=1; }
  };
  return {t, bitir};
}

export function esit(a,b,mesaj){
  if(a!==b) throw new Error((mesaj||'eşit değil')+': '+JSON.stringify(a)+' ≠ '+JSON.stringify(b));
}
export function dogru(k,mesaj){ if(!k) throw new Error(mesaj||'doğru değil'); }
export function yakin(a,b,tol,mesaj){
  if(Math.abs(a-b)>tol) throw new Error((mesaj||'yakın değil')+': '+a+' ≉ '+b);
}
