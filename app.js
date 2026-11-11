(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var el=function(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n};
var stage=$('#stage'),side=$('#side'),thumbs=$('#thumbs');

/* ---------- Signing in with Deluxe Main ---------- */
/* Deluxe Docs uses the Deluxe account. "Sign in with Deluxe Main" goes to
   Deluxe Main and comes back with a one-use code (#deluxe_code=...), which is
   traded for this browser's key. The key can read the account's Deluxe Drive
   file list (kept in Deluxe Main) and its files (kept in Deluxe Drive), and
   change nothing. */
var CFG=window.DELUXE_CONFIG||{};
var MAIN=String(CFG.mainUrl||'https://deluxe-main.vercel.app').replace(/\/+$/,'');
var DRIVE=String(CFG.driveUrl||'https://deluxe-drive.deluxelordd.workers.dev').replace(/\/+$/,'');
var driveOrigin='';try{driveOrigin=new URL(DRIVE).origin}catch(e){}
var SESSION_KEY='deluxe.session.v1';
var auth=null,memStore={},memAuth=null;
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){if(v===undefined)return memStore[k]||null;if(v===null)delete memStore[k];else memStore[k]=v}}
function loadAuth(){
  var a=memAuth;
  try{a=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(e){}
  return a&&a.token&&a.exp>Date.now()&&a.main===MAIN?a:null;
}
function saveAuth(a){
  memAuth=a;
  try{if(a)localStorage.setItem(SESSION_KEY,JSON.stringify(a));else localStorage.removeItem(SESSION_KEY)}catch(e){}
}
var GUEST_KEY='deluxe.guest';
function isGuest(){try{return localStorage.getItem(GUEST_KEY)==='1'}catch(e){return false}}
function setGuest(on){try{if(on)localStorage.setItem(GUEST_KEY,'1');else localStorage.removeItem(GUEST_KEY)}catch(e){}}
function signIn(){
  setGuest(false);
  var back=location.href.replace(/#.*$/,'');
  location.href=MAIN+'/connect?'+new URLSearchParams({return:back,app:'docs'});
}
async function finishSignIn(code){
  var r;
  try{r=await fetch(MAIN+'/api/connect/exchange',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:code}),credentials:'omit'})}
  catch(e){throw new Error('Deluxe Main could not be reached. Check your connection and try again.')}
  var j={};try{j=await r.json()}catch(e){}
  if(!r.ok)throw new Error(j.error||('Deluxe Main answered '+r.status+'. Sign in again.'));
  var a={token:j.token,exp:Date.now()+(+j.expiresIn||86400)*1000,user:j.user||{},app:j.app,main:MAIN,name:(j.user&&j.user.name)||''};
  saveAuth(a);setGuest(false);
  return a;
}
async function disconnect(){
  var a=auth;auth=null;saveAuth(null);setGuest(false);driveNodes=null;dFolder=null;
  if(a){try{await fetch(MAIN+'/api/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+a.token},credentials:'omit'})}catch(e){}}
  showGate();
}
// The key ran out or was ended on Deluxe Main.
function expired(){
  auth=null;saveAuth(null);driveNodes=null;
  showGate();
  gateError('You were signed out. Sign in with Deluxe Main again.');
}
function gateError(t){var g=$('#gerr');g.textContent=t;g.hidden=false}
function showGate(){
  $('#app').hidden=true;$('#gate').hidden=false;
  $('#gerr').hidden=true;
  setTimeout(function(){var i=$('#connectBtn');if(i)i.focus()},0);
}
function renderAcct(){
  var a=$('#acct');a.replaceChildren();
  if(!auth){
    var s=el('button','link','Sign in');s.type='button';s.onclick=signIn;
    var k=el('button','link','Use a code');k.type='button';k.onclick=function(){codeWindow('enter')};
    a.append(el('span','av','G'),el('span','nm','Guest'),s,k);return;
  }
  var nm=auth.name||'Deluxe account';
  a.append(el('span','av',nm.trim().charAt(0).toUpperCase()||'D'),el('span','nm',nm));
  var c=el('button','link','Code');c.type='button';c.title='Sign in on another device with a 60-second code';c.onclick=function(){codeWindow('show')};
  var b=el('button','link','Sign out');b.type='button';b.onclick=disconnect;a.append(c,b);
}
$('#guestBtn').onclick=function(){setGuest(true);enterApp()};
// 60-second codes, with Deluxe Main's window (deluxe.js). It keeps the key in
// the same place as this page, so signing in with a code just reloads.
function codeWindow(mode){if(window.Deluxe&&Deluxe.codeDialog)Deluxe.codeDialog(mode);else gateError('Deluxe Main could not be reached. Check your connection.')}
$('#codeBtn').onclick=function(){codeWindow('enter')};
if(window.Deluxe&&Deluxe.onChange)Deluxe.onChange(function(u){if(u&&!auth){setGuest(false);location.reload()}});
$('#gateForm').onsubmit=function(e){
  e.preventDefault();
  var btn=$('#connectBtn');btn.disabled=true;btn.textContent='Opening Deluxe Main...';
  // A file sent from Deluxe Drive waits until this browser is signed in.
  if(qp.get('url')){ss('dd_pending',qp.get('url'));if(qp.get('name'))ss('dd_pending_name',qp.get('name'))}
  signIn();
};

/* ---------- icons ---------- */
var IC={plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',up:'<path d="M6 15l6-6 6 6"/>',down:'<path d="M6 9l6 6 6-6"/>',
  side:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M9 5v14"/>',search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.2-4.2"/>',
  cursor:'<path d="M6 4l12 7-5.5 1.6L10 18z"/>',hl:'<path d="M9 14l6-7 3 3-7 6H9z"/><path d="M4 20h16"/>',pen:'<path d="M4 20l1-4L16 5l3 3L8 19z"/>',
  note:'<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>',undo:'<path d="M9 7H4v5"/><path d="M4 12a8 8 0 1 1 3 6"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',
  folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',file:'<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/>'};
function icons(root){(root||document).querySelectorAll('svg[data-ic]').forEach(function(s){s.innerHTML=IC[s.getAttribute('data-ic')]||''})}
function icon(n){var s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('data-ic',n);s.innerHTML=IC[n];return s}
icons();

/* ---------- state ---------- */
var docs=[],cur=null,idc=0,tool='select',ci=0,COLORS=['#FFD84D','#62D98F','#FF7A7A','#5AA9FF'];
var state={urls:[],ios:[],drawId:0,gen:0};

var KINDS={pdf:'pdf',docx:'docx',dotx:'docx',docm:'docx',xlsx:'sheet',xlsm:'sheet',xltx:'sheet',xls:'sheet',csv:'sheet',tsv:'sheet',ods:'sheet',
  pptx:'pptx',ppsx:'pptx',potx:'pptx',png:'image',jpg:'image',jpeg:'image',gif:'image',webp:'image',svg:'image',bmp:'image',avif:'image',
  mp4:'video',webm:'video',mov:'video',m4v:'video',mp3:'audio',wav:'audio',m4a:'audio',ogg:'audio',flac:'audio',
  txt:'text',md:'text',json:'text',xml:'text',html:'text',htm:'text',css:'text',js:'text',ts:'text',py:'text',log:'text',yml:'text',yaml:'text',ini:'text',sql:'text',sh:'text',
  odt:'odf',ott:'odf',odp:'odf',otp:'odf',rtf:'rtf',zip:'zip',jar:'zip',epub:'zip',
  jfif:'image',apng:'image',ico:'image',ogv:'video',weba:'audio',aac:'audio',opus:'audio',
  tex:'text',conf:'text',cfg:'text',toml:'text',env:'text',jsx:'text',tsx:'text',java:'text',c:'text',h:'text',cpp:'text',cs:'text',go:'text',rs:'text',rb:'text',php:'text',swift:'text',kt:'text',vue:'text',scss:'text',sass:'text',less:'text',bat:'text',ps1:'text',gitignore:'text'};
var LABEL={pdf:'PDF',docx:'Word',sheet:'Sheet',pptx:'Slides',image:'Image',video:'Video',audio:'Audio',text:'Text',odf:'OpenDocument',rtf:'RTF',zip:'Archive',other:'File'};
var MIME={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',gif:'image/gif',webp:'image/webp',svg:'image/svg+xml',bmp:'image/bmp'};
function ext(n){var m=/\.([a-z0-9]+)$/i.exec(n||'');return m?m[1].toLowerCase():''}
function fmtSize(b){if(b<1024)return b+' B';if(b<1048576)return (b/1024).toFixed(1)+' KB';return (b/1048576).toFixed(1)+' MB'}
function toast(t){var n=el('div','toast',t);document.body.append(n);setTimeout(function(){n.remove()},1800)}
function str(bytes){return String.fromCharCode.apply(null,bytes)}

/* Read the file itself so links with no extension, or the wrong one, still open */
async function sniff(file){
  var b=new Uint8Array(await file.slice(0,12).arrayBuffer()),s=str(b);
  if(s.indexOf('%PDF')===0)return 'pdf';
  if(b[0]===0x89&&s.slice(1,4)==='PNG')return 'image';
  if(b[0]===0xFF&&b[1]===0xD8)return 'image';
  if(s.indexOf('GIF8')===0)return 'image';
  if(s.indexOf('RIFF')===0&&s.slice(8,12)==='WEBP')return 'image';
  if(b[0]===0x50&&b[1]===0x4B&&window.JSZip){
    try{var z=await JSZip.loadAsync(file),ct=z.file('[Content_Types].xml'),t=ct?await ct.async('string'):'';
      if(/wordprocessingml/.test(t))return 'docx';if(/spreadsheetml/.test(t))return 'sheet';if(/presentationml/.test(t))return 'pptx';
      var mt=z.file('mimetype');
      if(mt){var m=(await mt.async('string')).trim();
        if(/opendocument\.spreadsheet/.test(m))return 'sheet';
        if(/opendocument\.(text|presentation)/.test(m))return 'odf'}
      return 'zip'}catch(e){}
  }
  if(s.indexOf('{\\rtf')===0)return 'rtf';
  if(b[0]===0xD0&&b[1]===0xCF)return 'other';
  return null;
}
async function detect(file,name){
  var k=KINDS[ext(name)];if(k)return k;
  var s=await sniff(file);if(s)return s;
  var t=file.type||'';
  if(t==='application/pdf')return 'pdf';
  if(t.indexOf('image/')===0)return 'image';if(t.indexOf('video/')===0)return 'video';if(t.indexOf('audio/')===0)return 'audio';
  if(t.indexOf('text/')===0||t==='application/json')return 'text';
  if(await looksLikeText(file))return 'text';
  return 'other';
}
// An unknown extension that is really text (a config file, a log, source code) still opens.
async function looksLikeText(file){
  if(!file.size)return false;
  var b=new Uint8Array(await file.slice(0,8192).arrayBuffer());
  for(var i=0;i<b.length;i++)if(b[i]===0)return false;
  try{new TextDecoder('utf-8',{fatal:true}).decode(b);return true}catch(e){
    // a cut-off multi-byte character at the end of the sample is fine
    try{new TextDecoder('utf-8',{fatal:true}).decode(b.slice(0,b.length-3));return true}catch(x){return false}
  }
}

/* ---------- documents and tabs ---------- */
function cleanup(){
  state.urls.forEach(function(u){URL.revokeObjectURL(u)});state.urls=[];
  state.ios.forEach(function(o){o.disconnect()});state.ios=[];
  state.drawId++;
}
function objUrl(blob){var u=URL.createObjectURL(blob);state.urls.push(u);return u}
function addIO(cb,opts){var o=new IntersectionObserver(cb,opts);state.ios.push(o);return o}
function showMsg(title,body,warn,linkHref,actions){
  stage.replaceChildren();
  var m=el('div','msg'+(warn?' warn':''));
  m.append(el('h3',null,title),el('p',null,body));
  if(linkHref){var a=el('a',null,linkHref);a.href=linkHref;a.target='_blank';a.rel='noopener noreferrer';m.append(a)}
  if(actions){var r=el('div','row');actions.forEach(function(x){var b=el('button','pill'+(x.primary?' primary':''),x.label);b.type='button';b.onclick=x.fn;r.append(b)});m.append(r)}
  stage.append(m);
}
function showEmpty(){showHome()}
// The start screen: the connected account's files.
function showHome(){
  cur=null;cleanup();side.hidden=true;state.gen++;
  $('#sname').textContent='';$('#chips').replaceChildren();
  togglePanel(null);
  renderTabs();syncChrome();
  homeEl.hidden=false;stage.replaceChildren(homeEl);stage.scrollTop=0;
  syncChrome();
  driveState();loadDrive(false);
}
function renderTabs(){
  var ts=$('#tabstrip');ts.replaceChildren();
  docs.forEach(function(d){
    var t=el('div','tab');t.setAttribute('role','tab');t.setAttribute('aria-selected',String(d===cur));t.tabIndex=0;t.title=d.name;
    t.append(el('span','tn',d.name));
    var x=el('button','xbtn');x.type='button';x.setAttribute('aria-label','Close '+d.name);x.append(icon('x'));
    x.onclick=function(e){e.stopPropagation();closeDoc(d)};
    t.append(x);
    t.onclick=function(){if(d!==cur)activate(d)};
    t.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();if(d!==cur)activate(d)}};
    ts.append(t);
  });
}
function closeDoc(d){
  var i=docs.indexOf(d);docs.splice(i,1);
  if(d===cur){if(docs.length)activate(docs[Math.min(i,docs.length-1)]);else{renderTabs();showEmpty()}}
  else renderTabs();
}
function syncChrome(){
  $('#driveBtn').setAttribute('aria-pressed',String(!cur&&!homeEl.hidden&&homeEl.parentNode===stage));
  var isPdf=!!cur&&cur.kind==='pdf';
  $$('.pdfonly').forEach(function(n){n.hidden=!isPdf});
  $('#zOut').parentNode.hidden=!cur||cur.kind==='audio'||cur.kind==='other';
  stage.classList.toggle('annot',isPdf&&tool!=='select');
  if(!isPdf)side.hidden=true;
  $('#sideBtn').setAttribute('aria-pressed',String(!side.hidden));
  if(cur)$('#pct').textContent=Math.round(cur.zoom*100)+'%';
  $('#undo').disabled=!(cur&&cur.acts&&cur.acts.length);
}
function setStatus(d){
  $('#sname').textContent=d.name;
  var c=$('#chips');c.replaceChildren();
  c.append(el('span','chip kind',LABEL[d.kind]||'File'));
  if(d.size!=null)c.append(el('span','chip',fmtSize(d.size)));
  (d.extras||[]).forEach(function(x){c.append(el('span','chip',x))});
  if(d.sample)c.append(el('span','chip sample','Sample'));
}
async function addDoc(file,name,sample){
  name=name||file.name;
  var kind=await detect(file,name);
  var d={id:++idc,name:name,kind:kind,file:file,size:file.size,sample:!!sample,zoom:1,ann:{},acts:[],extras:[],page:1,pdf:null,find:null,tc:{}};
  docs.push(d);activate(d);
}
async function activate(d){
  cleanup();cur=d;state.gen++;var my=state.gen;
  renderTabs();setStatus(d);syncChrome();
  stage.style.setProperty('--z',d.zoom);
  $('#findIn').value=d.find?d.find.q:'';updateFindCnt();
  stage.replaceChildren(el('div','spin','Opening '+d.name+'...'));
  try{await R[d.kind](d)}
  catch(err){
    if(my!==state.gen)return;
    showMsg('This file could not be opened',(err&&err.message)?err.message:'The file may be damaged or password protected.',true);
  }
  if(my===state.gen){setStatus(d);syncChrome()}
}
function redraw(){if(cur&&cur.redraw)cur.redraw()}
function applyZoom(z){
  if(!cur)return;cur.zoom=Math.max(.5,Math.min(3,Math.round(z*100)/100));
  $('#pct').textContent=Math.round(cur.zoom*100)+'%';stage.style.setProperty('--z',cur.zoom);redraw();
}
$('#zIn').onclick=function(){if(cur)applyZoom(cur.zoom+.25)};
$('#zOut').onclick=function(){if(cur)applyZoom(cur.zoom-.25)};
$('#zFit').onclick=function(){applyZoom(1)};

/* ---------- Word output sanitiser ---------- */
function clean(html){
  var d=new DOMParser().parseFromString(html,'text/html');
  d.querySelectorAll('script,style,iframe,object,embed,link,meta,form').forEach(function(n){n.remove()});
  d.querySelectorAll('*').forEach(function(n){
    Array.prototype.slice.call(n.attributes).forEach(function(a){
      var k=a.name.toLowerCase();
      if(k.indexOf('on')===0||((k==='href'||k==='src')&&/^\s*javascript:/i.test(a.value)))n.removeAttribute(a.name);
    });
  });
  d.querySelectorAll('a[href]').forEach(function(a){a.target='_blank';a.rel='noopener noreferrer'});
  return d.body.innerHTML;
}

/* ---------- PDF: pages, thumbnails, find, annotate ---------- */
function paintOv(h,n,d){
  var c=h._ov,ctx=c.getContext('2d'),W=h._W,H=h._H,dpr=h._dpr;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  (d.ann[n]||[]).forEach(function(o){
    if(o.t==='hl'){ctx.globalAlpha=.4;ctx.fillStyle=o.c;ctx.fillRect(o.x*W,o.y*H,o.w*W,o.h*H);ctx.globalAlpha=1}
    else if(o.t==='pen'&&o.pts.length){ctx.strokeStyle=o.c;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
      o.pts.forEach(function(p,i){if(i)ctx.lineTo(p[0]*W,p[1]*H);else ctx.moveTo(p[0]*W,p[1]*H)});
      if(o.pts.length===1)ctx.lineTo(o.pts[0][0]*W+.1,o.pts[0][1]*H);ctx.stroke()}
  });
  if(d.find){d.find.matches.forEach(function(m,i){if(m.p!==n)return;ctx.globalAlpha=i===d.find.i?.6:.35;ctx.fillStyle=i===d.find.i?'#FF9F1A':'#FFE24D';ctx.fillRect(m.x*W,m.y*H,m.w*W,m.h*H);ctx.globalAlpha=1})}
}
function buildNote(h,o,n,d,focus){
  var s=el('div','sticky');s.style.left=(o.x*100)+'%';s.style.top=(o.y*100)+'%';
  var ta=document.createElement('textarea');ta.value=o.txt;ta.setAttribute('aria-label','Note');ta.oninput=function(){o.txt=ta.value};
  var x=el('button','xbtn');x.type='button';x.setAttribute('aria-label','Delete note');x.append(icon('x'));
  x.onclick=function(){removeObj(d,n,o)};
  s.append(ta,x);h.append(s);o._el=s;if(focus)setTimeout(function(){ta.focus()},0);
}
function removeObj(d,n,o){
  var a=d.ann[n]||[],i=a.indexOf(o);if(i>-1)a.splice(i,1);
  if(o._el){o._el.remove();o._el=null}
  d.acts=d.acts.filter(function(x){return x.o!==o});
  var h=d.holders&&d.holders[n-1];if(h)paintOv(h,n,d);
  syncChrome();
}
function attachDraw(h,n,d){
  h.addEventListener('pointerdown',function(e){
    if(tool==='select'||e.button>0||e.target.closest('.sticky'))return;
    var r=h.getBoundingClientRect();
    var pt=function(ev){return [Math.min(1,Math.max(0,(ev.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(ev.clientY-r.top)/r.height))]};
    var p0=pt(e);
    if(tool==='note'){
      var no={t:'note',x:p0[0],y:p0[1],txt:'',c:COLORS[ci]};(d.ann[n]=d.ann[n]||[]).push(no);d.acts.push({p:n,o:no});buildNote(h,no,n,d,true);syncChrome();e.preventDefault();return;
    }
    var obj=tool==='hl'?{t:'hl',x:p0[0],y:p0[1],w:0,h:0,c:COLORS[ci]}:{t:'pen',pts:[p0],c:COLORS[ci]};
    (d.ann[n]=d.ann[n]||[]).push(obj);
    try{h.setPointerCapture(e.pointerId)}catch(x){}
    var mv=function(ev){var p=pt(ev);if(obj.t==='hl'){obj.w=p[0]-obj.x;obj.h=p[1]-obj.y}else obj.pts.push(p);paintOv(h,n,d)};
    var up=function(){
      h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);
      if(obj.t==='hl'&&(Math.abs(obj.w)<.006||Math.abs(obj.h)<.004)){var a=d.ann[n],i=a.indexOf(obj);if(i>-1)a.splice(i,1);paintOv(h,n,d)}
      else{d.acts.push({p:n,o:obj});syncChrome()}
    };
    h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
    e.preventDefault();
  });
}
function pageRect(d,n){var h=d.holders&&d.holders[n-1];return h}
function scrollToPage(d,n,frac){
  var h=pageRect(d,n);if(!h)return;
  var top=h.getBoundingClientRect().top-stage.getBoundingClientRect().top+stage.scrollTop;
  stage.scrollTo({top:top-12+(frac?frac*h.offsetHeight-stage.clientHeight/3:0)});
}
function setPage(d,n){
  d.page=n;$('#pageIn').value=n;
  $$('#thumbs .th').forEach(function(t,i){t.classList.toggle('cur',i===n-1)});
}
stage.addEventListener('scroll',function(){
  if(!cur||cur.kind!=='pdf'||!cur.holders)return;
  var top=stage.getBoundingClientRect().top+stage.clientHeight/3,pg=1;
  for(var i=0;i<cur.holders.length;i++){if(cur.holders[i].getBoundingClientRect().bottom>top){pg=i+1;break}pg=i+1}
  if(pg!==cur.page)setPage(cur,pg);
},{passive:true});

var R={};
R.pdf=async function(d){
  var lib=window.pdfjsLib;if(!lib)throw new Error('The PDF reader did not load.');
  lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  if(!d.pdf){d.pdf=await lib.getDocument({data:await d.file.arrayBuffer()}).promise;d.extras=[d.pdf.numPages+(d.pdf.numPages===1?' page':' pages')]}
  var pdf=d.pdf;$('#pageTot').textContent='/ '+pdf.numPages;
  if(window.innerWidth>760)side.hidden=false;
  syncChrome();
  var draw=async function(){
    var my=++state.drawId;
    state.ios.forEach(function(o){o.disconnect()});state.ios=[];
    stage.replaceChildren();thumbs.replaceChildren();d.holders=[];
    var pages=el('div','pages');stage.append(pages);
    var w=Math.max(240,stage.clientWidth-34),dpr=Math.min(window.devicePixelRatio||1,2);
    var io=addIO(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);e.target._r()}})},{root:stage,rootMargin:'900px 0px'});
    var tio=addIO(function(es){es.forEach(function(e){if(e.isIntersecting){tio.unobserve(e.target);e.target._r()}})},{root:side,rootMargin:'400px 0px'});
    for(var n=1;n<=pdf.numPages;n++){
      var page=await pdf.getPage(n);
      if(my!==state.drawId)return;
      var v1=page.getViewport({scale:1}),s=w/v1.width*d.zoom,vp=page.getViewport({scale:s});
      var h=el('div','pg');h.style.width=vp.width+'px';h.style.height=vp.height+'px';
      var ov=el('canvas','ov');ov.width=Math.floor(vp.width*dpr);ov.height=Math.floor(vp.height*dpr);
      h._ov=ov;h._W=vp.width;h._H=vp.height;h._dpr=dpr;h.append(ov);
      (function(page,s,h,n){
        h._r=async function(){
          if(my!==state.drawId)return;
          var v=page.getViewport({scale:s*dpr}),c=document.createElement('canvas');c.className='base';c.width=Math.floor(v.width);c.height=Math.floor(v.height);
          await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
          if(my===state.drawId)h.insertBefore(c,h.firstChild);
        };
        (d.ann[n]||[]).forEach(function(o){if(o.t==='note')buildNote(h,o,n,d,false)});
        attachDraw(h,n,d);paintOv(h,n,d);
      })(page,s,h,n);
      pages.append(h);io.observe(h);d.holders.push(h);
      var th=el('button','th');th.type='button';th.setAttribute('aria-label','Page '+n);
      var tw=112,tph=Math.round(tw*v1.height/v1.width),box=el('div','tp');box.style.width=tw+'px';box.style.height=tph+'px';
      th.append(box,el('span',null,String(n)));
      (function(page,box,tw,n){
        th._r=async function(){
          if(my!==state.drawId)return;
          var v=page.getViewport({scale:tw/page.getViewport({scale:1}).width*(window.devicePixelRatio>1?2:1)}),c=document.createElement('canvas');c.width=Math.floor(v.width);c.height=Math.floor(v.height);c.style.width='100%';c.style.height='100%';
          await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;box.append(c);
        };
        th.onclick=function(){scrollToPage(d,n)};
      })(page,box,tw,n);
      thumbs.append(th);tio.observe(th);
    }
    setPage(d,Math.min(d.page,pdf.numPages));
    if(d.page>1)scrollToPage(d,d.page);
  };
  d.redraw=draw;await draw();
};

/* find in PDF */
function updateFindCnt(){
  var f=cur&&cur.find,c=$('#findCnt');
  c.textContent=f?(f.matches.length?(f.i+1)+' of '+f.matches.length:'No matches'):'';
}
async function runFind(q){
  var d=cur;if(!d||d.kind!=='pdf'||!d.pdf)return;
  q=q.trim();if(!q){d.find=null;updateFindCnt();d.holders.forEach(function(h,i){paintOv(h,i+1,d)});return}
  $('#findCnt').textContent='Searching...';
  var lq=q.toLowerCase(),matches=[],lib=window.pdfjsLib;
  for(var p=1;p<=d.pdf.numPages&&matches.length<2000;p++){
    var page=await d.pdf.getPage(p),v1=page.getViewport({scale:1});
    if(!d.tc[p])d.tc[p]=(await page.getTextContent()).items;
    d.tc[p].forEach(function(it){
      if(!it.str)return;var ls=it.str.toLowerCase(),i=ls.indexOf(lq);
      while(i>-1){
        var tx=lib.Util.transform(v1.transform,it.transform),hh=it.height||Math.abs(it.transform[3])||10,frac=i/ls.length,wf=lq.length/ls.length;
        matches.push({p:p,x:(tx[4]+it.width*frac)/v1.width,y:(tx[5]-hh)/v1.height,w:it.width*wf/v1.width,h:hh*1.15/v1.height});
        i=ls.indexOf(lq,i+lq.length);
      }
    });
  }
  if(d!==cur)return;
  d.find={q:q,matches:matches,i:0};updateFindCnt();
  d.holders.forEach(function(h,i){paintOv(h,i+1,d)});
  if(matches.length)gotoMatch(0);
}
function gotoMatch(i){
  var d=cur,f=d&&d.find;if(!f||!f.matches.length)return;
  f.i=(i+f.matches.length)%f.matches.length;var m=f.matches[f.i];
  updateFindCnt();d.holders.forEach(function(h,k){paintOv(h,k+1,d)});
  scrollToPage(d,m.p,m.y);
}
$('#findIn').addEventListener('keydown',function(e){
  if(e.key!=='Enter')return;e.preventDefault();
  var q=this.value.trim();
  if(cur&&cur.find&&cur.find.q===q)gotoMatch(cur.find.i+(e.shiftKey?-1:1));else runFind(q);
});
$('#fNext').onclick=function(){if(cur&&cur.find)gotoMatch(cur.find.i+1);else runFind($('#findIn').value)};
$('#fPrev').onclick=function(){if(cur&&cur.find)gotoMatch(cur.find.i-1);else runFind($('#findIn').value)};

/* page nav, sidebar, annotate toolbar */
$('#pNext').onclick=function(){if(cur&&cur.pdf)scrollToPage(cur,Math.min(cur.pdf.numPages,cur.page+1))};
$('#pPrev').onclick=function(){if(cur&&cur.pdf)scrollToPage(cur,Math.max(1,cur.page-1))};
$('#pageIn').addEventListener('keydown',function(e){
  if(e.key!=='Enter'||!cur||!cur.pdf)return;
  var n=parseInt(this.value,10);if(n>=1&&n<=cur.pdf.numPages)scrollToPage(cur,n);else this.value=cur.page;
});
$('#sideBtn').onclick=function(){side.hidden=!side.hidden;$('#sideBtn').setAttribute('aria-pressed',String(!side.hidden));redraw()};
$$('[data-tool]').forEach(function(b){b.onclick=function(){
  tool=b.getAttribute('data-tool');
  $$('[data-tool]').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});syncChrome();
}});
COLORS.forEach(function(c,i){var b=el('button','sw');b.type='button';b.style.background=c;b.setAttribute('aria-label','Colour '+(i+1));b.setAttribute('aria-pressed',String(i===0));
  b.onclick=function(){ci=i;$$('#swatches .sw').forEach(function(x,j){x.setAttribute('aria-pressed',String(j===i))})};$('#swatches').append(b)});
$('#undo').onclick=function(){
  if(!cur||!cur.acts.length)return;var a=cur.acts[cur.acts.length-1];removeObj(cur,a.p,a.o);
};

/* ---------- other formats ---------- */
R.docx=async function(d){
  if(!window.mammoth)throw new Error('The Word reader did not load.');
  var r=await mammoth.convertToHtml({arrayBuffer:await d.file.arrayBuffer()});
  var n=el('div','doc');n.innerHTML=clean(r.value);stage.replaceChildren(n);
  if(!n.textContent.trim()&&!n.querySelector('img'))n.append(el('p',null,'This document has no readable content.'));
};
R.sheet=async function(d){
  if(!window.XLSX)throw new Error('The spreadsheet reader did not load.');
  var wb=XLSX.read(await d.file.arrayBuffer(),{type:'array'}),names=wb.SheetNames;
  if(!names.length)throw new Error('This workbook has no sheets.');
  d.extras=[names.length+(names.length===1?' sheet':' sheets')];setStatus(d);
  stage.replaceChildren();
  var bar=el('div','sheetbar'),tabs=el('div','tabs2');tabs.setAttribute('role','tablist');
  var q=document.createElement('input');q.type='search';q.id='sheetFilter';q.placeholder='Filter rows';q.setAttribute('aria-label','Filter rows');
  bar.append(tabs,q);var body=el('div');stage.append(bar,body);
  var MAXR=2000,MAXC=80,rows=[];
  function col(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
  function paint(){
    body.replaceChildren();var f=q.value.trim().toLowerCase();
    var cols=Math.min(MAXC,rows.reduce(function(m,r){return Math.max(m,r.length)},0)),shown=0,total=0;
    var wrap=el('div','tablewrap'),t=el('table','grid'),th=el('thead'),hr=el('tr');
    hr.append(el('th',null,''));for(var c=0;c<cols;c++)hr.append(el('th',null,col(c)));th.append(hr);
    var tb=el('tbody');
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      if(f&&!r.some(function(v){return String(v).toLowerCase().indexOf(f)>-1}))continue;
      total++;if(shown>=MAXR)continue;shown++;
      var tr=el('tr');tr.append(el('th',null,String(i+1)));
      for(var c2=0;c2<cols;c2++)tr.append(el('td',null,r[c2]==null?'':String(r[c2])));
      tb.append(tr);
    }
    t.append(th,tb);wrap.append(t);body.append(wrap);
    body.append(el('div','note',total>MAXR?'Showing the first '+MAXR+' of '+total+' rows.':(f?total+' matching rows.':rows.length+' rows, '+cols+' columns.')));
  }
  function pick(i){
    Array.prototype.forEach.call(tabs.children,function(b,j){b.setAttribute('aria-selected',j===i?'true':'false')});
    rows=XLSX.utils.sheet_to_json(wb.Sheets[names[i]],{header:1,raw:false,defval:''});paint();
  }
  names.forEach(function(n,i){var b=el('button','stab',n);b.type='button';b.setAttribute('role','tab');b.onclick=function(){pick(i)};tabs.append(b)});
  q.oninput=paint;pick(0);
};
R.pptx=async function(d){
  if(!window.JSZip)throw new Error('The slide reader did not load.');
  var zip=await JSZip.loadAsync(d.file),dp=new DOMParser();
  var rd=async function(p){var f=zip.file(p);return f?dp.parseFromString(await f.async('string'),'application/xml'):null};
  var resolve=function(base,t){
    if(t.charAt(0)==='/')return t.slice(1);
    var parts=base.split('/').slice(0,-1);
    t.split('/').forEach(function(s){if(s==='..')parts.pop();else if(s&&s!=='.')parts.push(s)});
    return parts.join('/');
  };
  var relsOf=async function(p){
    var i=p.lastIndexOf('/'),doc=await rd(p.slice(0,i+1)+'_rels/'+p.slice(i+1)+'.rels'),m={};
    if(doc)Array.prototype.forEach.call(doc.getElementsByTagName('Relationship'),function(r){m[r.getAttribute('Id')]={t:resolve(p,r.getAttribute('Target')),type:r.getAttribute('Type')||''}});
    return m;
  };
  var pres=await rd('ppt/presentation.xml');if(!pres)throw new Error('This file has no presentation data.');
  var sz=pres.getElementsByTagName('p:sldSz')[0];
  var CX=+(sz&&sz.getAttribute('cx'))||9144000,CY=+(sz&&sz.getAttribute('cy'))||5143500;
  var prel=await relsOf('ppt/presentation.xml');
  var paths=Array.prototype.map.call(pres.getElementsByTagName('p:sldId'),function(n){return prel[n.getAttribute('r:id')]}).filter(Boolean).map(function(r){return r.t});
  d.extras=[paths.length+(paths.length===1?' slide':' slides')];setStatus(d);
  var xf=function(n){
    var x=n.getElementsByTagName('a:xfrm')[0];if(!x)return null;
    var o=x.getElementsByTagName('a:off')[0],e=x.getElementsByTagName('a:ext')[0];if(!o||!e)return null;
    return {x:+o.getAttribute('x'),y:+o.getAttribute('y'),w:+e.getAttribute('cx'),h:+e.getAttribute('cy')};
  };
  var phKey=function(sp){
    var ph=sp.getElementsByTagName('p:ph')[0];if(!ph)return null;
    var t=ph.getAttribute('type')||'body';if(t==='ctrTitle')t='title';if(t==='subTitle')t='body';
    return {idx:ph.getAttribute('idx'),type:t};
  };
  var phMap=function(doc){
    var m={};if(!doc)return m;
    Array.prototype.forEach.call(doc.getElementsByTagName('p:sp'),function(sp){
      var k=phKey(sp),f=xf(sp);if(!k||!f)return;
      if(k.idx)m['i'+k.idx]=f;if(!m['t'+k.type])m['t'+k.type]=f;
    });
    return m;
  };
  var masterCache={};
  async function parse(path){
    var doc=await rd(path),rels=await relsOf(path),out={bg:'ffffff',shapes:[]};if(!doc)return out;
    var lay=null,mas=null;
    Object.keys(rels).forEach(function(k){if(/slideLayout$/.test(rels[k].type))lay=rels[k].t});
    var layMap=phMap(lay?await rd(lay):null),masMap={};
    if(lay){
      var lr=await relsOf(lay);
      Object.keys(lr).forEach(function(k){if(/slideMaster$/.test(lr[k].type))mas=lr[k].t});
      if(mas){if(!masterCache[mas])masterCache[mas]=phMap(await rd(mas));masMap=masterCache[mas]}
    }
    var bg=doc.getElementsByTagName('p:bg')[0];
    if(bg){var bc=bg.getElementsByTagName('a:srgbClr')[0];if(bc)out.bg=bc.getAttribute('val')}
    var nodes=Array.prototype.slice.call(doc.getElementsByTagName('*')).filter(function(n){return n.tagName==='p:sp'||n.tagName==='p:pic'});
    for(var i=0;i<nodes.length;i++){
      var n=nodes[i],isPic=n.tagName==='p:pic',pos=xf(n),key=isPic?null:phKey(n);
      if(key&&(key.type==='sldNum'||key.type==='ftr'||key.type==='dt'))continue;
      if(!pos&&key)pos=(key.idx&&(layMap['i'+key.idx]||masMap['i'+key.idx]))||layMap['t'+key.type]||masMap['t'+key.type]||null;
      if(!pos)pos={x:CX*.06,y:CY*.06+out.shapes.length*CY*.12,w:CX*.88,h:CY*.1};
      var sh={x:pos.x,y:pos.y,w:pos.w,h:pos.h,fill:null,paras:[],img:null};
      if(isPic){
        var bl=n.getElementsByTagName('a:blip')[0],rid=bl&&bl.getAttribute('r:embed'),rp=rid&&rels[rid]&&rels[rid].t,zf=rp&&zip.file(rp);
        if(zf)sh.img=objUrl(new Blob([await zf.async('arraybuffer')],{type:MIME[ext(rp)]||'application/octet-stream'}));else continue;
      }else{
        var spPr=n.getElementsByTagName('p:spPr')[0];
        var sf=spPr&&Array.prototype.find.call(spPr.children,function(c){return c.tagName==='a:solidFill'});
        var sc=sf&&sf.getElementsByTagName('a:srgbClr')[0];if(sc)sh.fill=sc.getAttribute('val');
        var isTitle=key&&key.type==='title';
        Array.prototype.forEach.call(n.getElementsByTagName('a:p'),function(p){
          var pp=p.getElementsByTagName('a:pPr')[0],runs=[];
          Array.prototype.forEach.call(p.children,function(c){
            if(c.tagName!=='a:r'&&c.tagName!=='a:fld')return;
            var rp2=c.getElementsByTagName('a:rPr')[0],t=c.getElementsByTagName('a:t')[0],col=rp2&&rp2.getElementsByTagName('a:srgbClr')[0];
            runs.push({t:t?t.textContent:'',sz:(rp2&&+rp2.getAttribute('sz'))||(isTitle?4000:1800),b:(!!rp2&&rp2.getAttribute('b')==='1')||!!isTitle,i:!!rp2&&rp2.getAttribute('i')==='1',c:col?col.getAttribute('val'):null});
          });
          sh.paras.push({al:pp&&pp.getAttribute('algn'),runs:runs});
        });
        if(!sh.paras.some(function(p){return p.runs.some(function(r){return r.t.trim()})})&&!sh.fill)continue;
      }
      out.shapes.push(sh);
    }
    return out;
  }
  var slides=[];
  for(var i=0;i<paths.length;i++){try{slides.push(await parse(paths[i]))}catch(e){slides.push({bg:'ffffff',shapes:[]})}}
  var draw=function(){
    stage.replaceChildren();var pages=el('div','pages');stage.append(pages);
    var W=Math.min(stage.clientWidth-34,1100)*d.zoom;if(W<240)W=240;
    var u=W/CX,H=CY*u,AL={ctr:'center',r:'right',l:'left',just:'justify'};
    slides.forEach(function(s,i){
      pages.append(el('div','cap','Slide '+(i+1)));
      var sl=el('div','slide');sl.style.width=W+'px';sl.style.height=H+'px';sl.style.background='#'+s.bg;
      s.shapes.forEach(function(sh){
        var b=el('div','sh');b.style.left=sh.x*u+'px';b.style.top=sh.y*u+'px';b.style.width=sh.w*u+'px';b.style.height=sh.h*u+'px';
        if(sh.fill)b.style.background='#'+sh.fill;
        if(sh.img){var im=document.createElement('img');im.src=sh.img;im.alt='';b.append(im)}
        sh.paras.forEach(function(p){
          var pe=el('div');if(p.al&&AL[p.al])pe.style.textAlign=AL[p.al];
          p.runs.forEach(function(r){
            var sp=el('span',null,r.t);sp.style.fontSize=(r.sz/100*12700*u)+'px';
            if(r.b)sp.style.fontWeight='700';if(r.i)sp.style.fontStyle='italic';if(r.c)sp.style.color='#'+r.c;pe.append(sp);
          });
          if(!p.runs.length)pe.innerHTML='&nbsp;';b.append(pe);
        });
        sl.append(b);
      });
      pages.append(sl);
    });
  };
  d.redraw=draw;draw();
};
R.image=async function(d){
  var wrap=el('div','media'),im=document.createElement('img');
  im.alt=d.name;im.src=objUrl(d.file.type?d.file:new Blob([d.file],{type:MIME[ext(d.name)]||'image/png'}));
  wrap.append(im);stage.replaceChildren(wrap);
};
R.video=async function(d){var w=el('div','media'),v=document.createElement('video');v.controls=true;v.src=objUrl(d.file);w.append(v);stage.replaceChildren(w)};
R.audio=async function(d){var w=el('div','media'),a=document.createElement('audio');a.controls=true;a.src=objUrl(d.file);w.append(a);stage.replaceChildren(w)};
R.text=async function(d){
  var t=await d.file.text(),cut=false;
  if(ext(d.name)==='json'){try{t=JSON.stringify(JSON.parse(t),null,2)}catch(e){}}
  if(t.length>400000){t=t.slice(0,400000);cut=true}
  stage.replaceChildren(el('pre','code',t));
  var nl=t.split('\n').length;d.extras=[nl+(nl===1?' line':' lines')];setStatus(d);
  if(cut)stage.append(el('div','note','Showing the first 400,000 characters.'));
};
/* ---------- OpenDocument text and slides, RTF, archives ---------- */
R.odf=async function(d){
  if(!window.JSZip)throw new Error('The document reader did not load.');
  var zip=await JSZip.loadAsync(d.file),cf=zip.file('content.xml');
  if(!cf)throw new Error('This OpenDocument file has no content.');
  var xml=new DOMParser().parseFromString(await cf.async('string'),'application/xml');
  var isDeck=/presentation/.test(((await (zip.file('mimetype')||{async:async function(){return ''}}).async('string'))||'')),
      names={},imgs={};
  async function imageUrl(href){
    if(!href)return null;
    if(imgs[href])return imgs[href];
    var f=zip.file(href);if(!f)return null;
    var ext2=(/\.([a-z0-9]+)$/i.exec(href)||[])[1]||'png';
    imgs[href]=objUrl(new Blob([await f.async('arraybuffer')],{type:MIME[ext2.toLowerCase()]||'application/octet-stream'}));
    return imgs[href];
  }
  async function inline(node,into){
    for(var c=node.firstChild;c;c=c.nextSibling){
      if(c.nodeType===3){into.append(document.createTextNode(c.nodeValue));continue}
      if(c.nodeType!==1)continue;
      var n=c.tagName;
      if(n==='text:line-break')into.append(document.createElement('br'));
      else if(n==='text:tab')into.append(document.createTextNode('\t'));
      else if(n==='text:s')into.append(document.createTextNode(' '.repeat(+c.getAttribute('text:c')||1)));
      else if(n==='text:a'){var a=el('a');var h=c.getAttribute('xlink:href')||'';if(/^https?:|^mailto:/i.test(h)){a.href=h;a.target='_blank';a.rel='noopener noreferrer'}await inline(c,a);into.append(a)}
      else if(n==='draw:frame'){
        var im=c.getElementsByTagName('draw:image')[0];
        if(im){var u=await imageUrl(im.getAttribute('xlink:href'));if(u){var i=document.createElement('img');i.src=u;i.alt='';into.append(i)}}
      }
      else await inline(c,into);
    }
  }
  async function block(node,into){
    for(var c=node.firstChild;c;c=c.nextSibling){
      if(c.nodeType!==1)continue;
      var n=c.tagName;
      if(n==='text:h'){var lv=Math.min(4,Math.max(1,+c.getAttribute('text:outline-level')||1)),h=el('h'+lv);await inline(c,h);into.append(h)}
      else if(n==='text:p'){var p=el('p');await inline(c,p);into.append(p)}
      else if(n==='text:list'){var ul=el('ul');await block(c,ul);into.append(ul)}
      else if(n==='text:list-item'){var li=el('li');await block(c,li);into.append(li)}
      else if(n==='table:table'){
        var tb=el('table'),bd=el('tbody');
        for(var r=c.firstChild;r;r=r.nextSibling){
          if(r.nodeType!==1)continue;
          var rows=r.tagName==='table:table-row'?[r]:(r.tagName==='table:table-row-group'||r.tagName==='table:table-header-rows'?Array.prototype.filter.call(r.children,function(x){return x.tagName==='table:table-row'}):[]);
          for(var k=0;k<rows.length;k++){
            var tr=el('tr');
            for(var q=rows[k].firstChild;q;q=q.nextSibling){
              if(q.nodeType!==1||q.tagName!=='table:table-cell')continue;
              var td=el('td');await block(q,td);
              var cs=+q.getAttribute('table:number-columns-spanned');if(cs>1)td.colSpan=cs;
              tr.append(td);
            }
            bd.append(tr);
          }
        }
        tb.append(bd);into.append(tb);
      }
      else if(n==='text:section'||n==='office:text'||n==='office:body')await block(c,into);
    }
  }
  if(isDeck){
    var pages=xml.getElementsByTagName('draw:page');
    d.extras=[pages.length+(pages.length===1?' slide':' slides')];setStatus(d);
    var wrap=el('div','pages');
    for(var i=0;i<pages.length;i++){
      wrap.append(el('div','cap','Slide '+(i+1)));
      var card=el('div','slidecard');
      var frames=pages[i].getElementsByTagName('draw:frame');
      for(var j=0;j<frames.length;j++){
        var fr=frames[j],tbx=fr.getElementsByTagName('draw:text-box')[0],im=fr.getElementsByTagName('draw:image')[0];
        if(tbx){var box=el('div','sl-text');await block(tbx,box);if(box.textContent.trim())card.append(box)}
        else if(im){var u=await imageUrl(im.getAttribute('xlink:href'));if(u){var g=document.createElement('img');g.src=u;g.alt='';card.append(g)}}
      }
      if(!card.firstChild)card.append(el('div','sl-text','(empty slide)'));
      wrap.append(card);
    }
    stage.replaceChildren(wrap);
  }else{
    var doc=el('div','doc'),body=xml.getElementsByTagName('office:text')[0];
    if(body)await block(body,doc);
    if(!doc.textContent.trim()&&!doc.querySelector('img'))doc.append(el('p',null,'This document has no readable content.'));
    stage.replaceChildren(doc);
  }
};

function rtfToText(src){
  var out='',i=0,depth=0,skip=[],uc=1,n=src.length;
  var cp=[0x20AC,0,0x201A,0x192,0x201E,0x2026,0x2020,0x2021,0x2C6,0x2030,0x160,0x2039,0x152,0,0x17D,0,0,0x2018,0x2019,0x201C,0x201D,0x2022,0x2013,0x2014,0x2DC,0x2122,0x161,0x203A,0x153,0,0x17E,0x178];
  while(i<n){
    var ch=src[i];
    if(ch==='{'){depth++;i++;continue}
    if(ch==='}'){if(skip.length&&skip[skip.length-1]===depth)skip.pop();depth--;i++;continue}
    if(ch==='\\'){
      var nx=src[i+1];
      if(nx==='\\'||nx==='{'||nx==='}'){if(!skip.length)out+=nx;i+=2;continue}
      if(nx==='\''){var h=parseInt(src.substr(i+2,2),16);if(!skip.length&&!isNaN(h))out+=String.fromCharCode(h>=0x80&&h<0xA0&&cp[h-0x80]?cp[h-0x80]:h);i+=4;continue}
      if(nx==='*'){skip.push(depth);i+=2;continue}
      var m=/^\\([a-zA-Z]+)(-?\d+)? ?/.exec(src.slice(i,i+40));
      if(!m){i+=2;continue}
      var w=m[1],v=m[2];i+=m[0].length;
      if(w==='par'||w==='line'||w==='sect'||w==='page'){if(!skip.length)out+='\n'}
      else if(w==='tab'){if(!skip.length)out+='\t'}
      else if(w==='emdash'){if(!skip.length)out+='\u2014'}
      else if(w==='endash'){if(!skip.length)out+='\u2013'}
      else if(w==='bullet'){if(!skip.length)out+='\u2022'}
      else if(w==='uc'){uc=+v||0}
      else if(w==='u'){var c=+v;if(c<0)c+=65536;if(!skip.length)out+=String.fromCharCode(c);i+=uc}
      else if(/^(fonttbl|colortbl|stylesheet|info|pict|header|footer|footnote)$/.test(w))skip.push(depth);
      continue;
    }
    if(ch==='\r'||ch==='\n'){i++;continue}
    if(!skip.length)out+=ch;
    i++;
  }
  return out.replace(/\n{3,}/g,'\n\n').trim();
}
R.rtf=async function(d){
  var txt=rtfToText(await d.file.text());
  stage.replaceChildren(el('pre','code',txt||'This document has no readable text.'));
  d.extras=['text only'];setStatus(d);
};
R.zip=async function(d){
  if(!window.JSZip)throw new Error('The archive reader did not load.');
  var zip=await JSZip.loadAsync(d.file),rows=[];
  zip.forEach(function(path,entry){if(!entry.dir)rows.push([path,entry._data&&entry._data.uncompressedSize!=null?entry._data.uncompressedSize:null])});
  d.extras=[rows.length+(rows.length===1?' file':' files')];setStatus(d);
  var wrap=el('div','tablewrap'),t=el('table','grid'),th=el('thead'),hr=el('tr');
  hr.append(el('th',null,'File'),el('th',null,'Size'));th.append(hr);
  var tb=el('tbody');
  rows.slice(0,3000).forEach(function(r){var tr=el('tr');tr.append(el('td',null,r[0]),el('td',null,r[1]==null?'':fmtSize(r[1])));tb.append(tr)});
  t.append(th,tb);wrap.append(t);stage.replaceChildren(wrap);
  stage.append(el('div','note',rows.length>3000?'Showing the first 3000 of '+rows.length+' files. The files inside cannot be opened from here.':'The files inside an archive cannot be opened from here.'));
};
R.other=async function(d){
  var e=ext(d.name);
  var legacy={doc:'Old .doc files are not supported. Save the file as .docx and open that.',ppt:'Old .ppt files are not supported. Save the file as .pptx and open that.',pages:'Apple Pages files cannot be read here. Export the document as PDF or Word first.',numbers:'Apple Numbers files cannot be read here. Export the sheet as Excel or CSV first.',key:'Apple Keynote files cannot be read here. Export the deck as PDF or PowerPoint first.',heic:'HEIC photos are not shown by this browser. Export the photo as JPEG first.',tif:'TIFF images are not shown by this browser. Export the image as PNG or JPEG first.',tiff:'TIFF images are not shown by this browser. Export the image as PNG or JPEG first.'};
  showMsg('This file type is not supported yet',legacy[e]||('Deluxe Docs opens PDF, Word, Excel, CSV, PowerPoint, OpenDocument, RTF, images, audio, video, archives and text files.'+(e?' .'+e+' is not one of them.':'')));
};

/* ---------- opening from files and links ---------- */
async function openFile(file,name,sample){await addDoc(file,name,sample)}
function nameFromUrl(url,resp,hint){
  if(hint)return hint;
  var cd=resp&&resp.headers&&resp.headers.get('content-disposition');
  if(cd){var m=/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);if(m){try{return decodeURIComponent(m[1])}catch(e){return m[1]}}}
  var p=url.pathname.split('/').filter(Boolean).pop();
  try{return decodeURIComponent(p||'file')}catch(e){return p||'file'}
}
async function openUrl(raw,hint){
  var url;
  try{url=new URL(raw,location.href)}catch(e){showMsg('That link is not valid','Check the address and try again.',true);return}
  var my=++state.gen;cleanup();cur=null;renderTabs();syncChrome();side.hidden=true;
  $('#sname').textContent=nameFromUrl(url,null,hint);$('#chips').replaceChildren();
  stage.replaceChildren(el('div','spin','Fetching from '+url.hostname+'...'));
  try{
    var opts={credentials:'omit'};
    if(auth&&driveOrigin&&url.origin===driveOrigin)opts.headers={Authorization:'Bearer '+auth.token};
    var r=await fetch(url.href,opts);
    if(r.status===401||r.status===403){
      if(my!==state.gen)return;
      if(r.status===401&&auth&&driveOrigin&&url.origin===driveOrigin){expired();return}
      showMsg('Deluxe Drive did not allow this file','This file is not shared with the connected account.',true);return;
    }
    if(!r.ok)throw new Error('HTTP '+r.status);
    var blob=await r.blob();
    if(my!==state.gen)return;
    var name=nameFromUrl(url,r,hint);
    await addDoc(new File([blob],name,{type:blob.type}),name);
  }catch(e){
    if(my!==state.gen)return;
    showMsg('The link could not be read here','The site may not allow other sites to read its files, or this page is running somewhere that blocks outside requests. Open the link yourself, then drop the downloaded file onto this page.',true,/^https?:$/.test(url.protocol)?url.href:null);
  }
}

/* ---------- panels, buttons, drop ---------- */
function togglePanel(which,force){
  var map={link:['#linkPanel','#linkBtn']};
  Object.keys(map).forEach(function(k){
    var p=$(map[k][0]),b=$(map[k][1]),open=(k===which)?(force!==undefined?force:p.hidden):false;
    p.hidden=!open;b.setAttribute('aria-expanded',String(open));
  });
  if(which==='link'&&!$('#linkPanel').hidden)$('#urlInput').focus();
}
$('#openBtn').onclick=$('#newTab').onclick=function(){$('#fileInput').click()};
$('#fileInput').onchange=function(e){var f=e.target.files[0];if(f)openFile(f);e.target.value=''};
$('#linkBtn').onclick=function(){togglePanel('link')};
$('#driveBtn').onclick=function(){showHome()};
$('#homeOpen').onclick=function(){$('#fileInput').click()};
$('#linkPanel').onsubmit=function(e){e.preventDefault();var v=$('#urlInput').value.trim();if(v)openUrl(v)};

/* ---------- the connected account's files ---------- */
var driveNodes=null,dFolder=null;
var homeEl=$('#home'),dListEl=$('#dList'),dCrumbsEl=$('#dCrumbs'),dSearchEl=$('#dSearch'),dStateEl=$('#driveState');
function driveState(){
  var s=dStateEl;s.replaceChildren();
  s.append(el('span','dot'+(auth?' ok':'')),el('span',null,auth?'Signed in as '+(auth.name||'your account'):'Not signed in'));
}
async function loadDrive(force){
  if(!auth){
    // A guest: no Deluxe Drive list, but anything on this device or at a link opens.
    var g=el('div','note');g.append('You are a guest. ');
    var b=el('button','link','Sign in with Deluxe Main');b.type='button';b.onclick=signIn;g.append(b,' to see your Deluxe Drive files.');
    dListEl.replaceChildren(g);return;
  }
  if(driveNodes&&!force){renderDrive();return}
  var list=dListEl;if(!driveNodes)list.replaceChildren(el('div','note','Loading your files...'));
  try{
    // The file list is kept in Deluxe Main; the files themselves in Deluxe Drive.
    var r=await fetch(MAIN+'/api/data/drive?prefix=node:',{headers:{Authorization:'Bearer '+auth.token},credentials:'omit'});
    if(r.status===401){expired();return}
    if(!r.ok)throw new Error('HTTP '+r.status);
    var j=await r.json();
    driveNodes=(j.items||[]).map(function(i){return i.value}).filter(function(n){return n&&n.id&&!n.trashed});
    renderDrive();
  }catch(e){
    list.replaceChildren(el('div','note','Your files could not be loaded. Check your connection and press Refresh.'));
  }
}
function fmtDate(ms){if(!ms)return '';try{return new Date(ms).toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})}catch(e){return ''}}
function renderDrive(){
  var list=dListEl,crumbs=dCrumbsEl;
  if(!driveNodes)return;
  var q=dSearchEl.value.trim().toLowerCase();
  var byId={};driveNodes.forEach(function(n){byId[n.id]=n});
  if(dFolder&&!byId[dFolder])dFolder=null;
  var items=q?driveNodes.filter(function(n){return n.type!=='folder'&&String(n.name||'').toLowerCase().indexOf(q)>-1})
            :driveNodes.filter(function(n){return (n.parentId||null)===dFolder});
  items.sort(function(a,b){if((a.type==='folder')!==(b.type==='folder'))return a.type==='folder'?-1:1;return String(a.name).localeCompare(String(b.name),undefined,{numeric:true})});
  crumbs.replaceChildren();crumbs.hidden=!!q;
  if(!q){
    var path=[],c=dFolder;while(c&&byId[c]&&path.length<50){path.unshift(byId[c]);c=byId[c].parentId||null}
    var mk=function(label,id,last){var b=el('button','crumb',label);b.type='button';if(last)b.setAttribute('aria-current','page');else b.onclick=function(){dFolder=id;renderDrive()};return b};
    crumbs.append(mk('My Drive',null,!path.length));
    path.forEach(function(n,i){crumbs.append(el('span','sepc','/'),mk(n.name,n.id,i===path.length-1))});
  }
  list.replaceChildren();
  if(!items.length){list.append(el('div','note',q?'No files match “'+q+'”.':(driveNodes.length?'This folder is empty.':'There are no files in this Deluxe Drive account yet.')));return}
  items.slice(0,500).forEach(function(n){
    var row=el('button','drow');row.type='button';
    var isF=n.type==='folder';
    row.append(icon(isF?'folder':'file'));
    var tx=el('span','dtx');tx.append(el('span','dn',n.name||'Untitled'));
    var meta=isF?'Folder':[fmtSize(+n.size||0),fmtDate(n.updatedAt)].filter(Boolean).join(' · ');
    if(q&&n.parentId&&byId[n.parentId])meta+=' · in '+byId[n.parentId].name;
    tx.append(el('span','dm',meta));row.append(tx);
    row.onclick=function(){if(isF){dFolder=n.id;dSearchEl.value='';renderDrive()}else openDriveFile(n)};
    list.append(row);
  });
  if(items.length>500)list.append(el('div','note','Showing the first 500. Search to find the rest.'));
}
function openDriveFile(n){
  openUrl(DRIVE+'/api/db/blobs/'+encodeURIComponent(n.id),n.name);
}
dSearchEl.addEventListener('input',renderDrive);
$('#dRefresh').onclick=function(){loadDrive(true)};

var depth=0,drop=$('#drop');
window.addEventListener('dragenter',function(e){if(!$('#app').hidden&&e.dataTransfer&&Array.prototype.indexOf.call(e.dataTransfer.types,'Files')>-1){depth++;drop.hidden=false}});
window.addEventListener('dragleave',function(){depth=Math.max(0,depth-1);if(!depth)drop.hidden=true});
window.addEventListener('dragover',function(e){e.preventDefault()});
window.addEventListener('drop',function(e){e.preventDefault();depth=0;drop.hidden=true;var f=e.dataTransfer&&e.dataTransfer.files[0];if(f&&!$('#app').hidden)openFile(f)});
var rt;window.addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(redraw,200)});

/* ---------- start ---------- */
var qp=new URLSearchParams(location.search);
async function enterApp(){
  $('#gate').hidden=true;$('#app').hidden=false;
  renderAcct();renderTabs();
  var pend=ss('dd_pending')||qp.get('url');ss('dd_pending',null);
  var pendName=ss('dd_pending_name')||qp.get('name')||null;ss('dd_pending_name',null);
  if(qp.get('url'))history.replaceState(null,'',location.pathname);
  qp=new URLSearchParams('');
  if(pend){await openUrl(pend,pendName);return}
  showHome();
}
async function boot(){
  $('#driveLink').href=CFG.drivePage||DRIVE;
  $('#mainLink').href=MAIN+'/';
  // Back from Deluxe Main with a one-use code after #. It is removed from the
  // address bar straight away.
  var hm=/(?:^#|&)deluxe_code=([0-9a-f]{48})/.exec(location.hash||'');
  if(hm){
    history.replaceState(null,'',location.pathname+location.search);
    try{auth=await finishSignIn(hm[1]);enterApp()}
    catch(e){showGate();gateError(e.message)}
    return;
  }
  if(/(?:^#|&)deluxe_guest=1/.test(location.hash||'')){setGuest(true);history.replaceState(null,'',location.pathname+location.search)}
  auth=loadAuth();
  if(!auth){
    // The guest choice is saved: a guest goes straight in.
    if(isGuest()){enterApp();return}
    if(qp.get('url')){ss('dd_pending',qp.get('url'));if(qp.get('name'))ss('dd_pending_name',qp.get('name'))}
    showGate();return;
  }
  enterApp();
  // Check the key is still good; a network hiccup is not a reason to sign out.
  try{
    var r=await fetch(MAIN+'/api/auth/me',{headers:{Authorization:'Bearer '+auth.token},credentials:'omit'});
    if(r.status===401)expired();
    else if(r.ok){var j=await r.json();if(j.user&&j.user.name&&j.user.name!==auth.name){auth.name=j.user.name;saveAuth(auth);renderAcct();driveState()}}
  }catch(e){}
}
boot();
})();
