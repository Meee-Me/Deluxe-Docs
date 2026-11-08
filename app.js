(function(){
'use strict';
var $=function(s){return document.querySelector(s)};
var $$=function(s){return Array.prototype.slice.call(document.querySelectorAll(s))};
var el=function(t,c,x){var n=document.createElement(t);if(c)n.className=c;if(x!=null)n.textContent=x;return n};
var stage=$('#stage'),side=$('#side'),thumbs=$('#thumbs');

/* ---------- Deluxe Drive connection: a link id ---------- */
/* Deluxe Drive makes a link id (12 letters and digits, good for 60 seconds and
   one use). It is pasted here, the drive finds the account it belongs to, and
   this browser gets a key that can only read that account's files. */
var CFG=window.DELUXE_CONFIG||{};
var DRIVE=String(CFG.driveUrl||'https://deluxe-drive.deluxelordd.workers.dev').replace(/\/+$/,'');
var driveOrigin='';try{driveOrigin=new URL(DRIVE).origin}catch(e){}
var LINK_KEY='dd.link';
var auth=null,memStore={},memLink=null;
function ss(k,v){try{if(v===undefined)return sessionStorage.getItem(k);if(v===null)sessionStorage.removeItem(k);else sessionStorage.setItem(k,v)}catch(e){if(v===undefined)return memStore[k]||null;if(v===null)delete memStore[k];else memStore[k]=v}}
function loadAuth(){
  var a=memLink;
  try{a=JSON.parse(localStorage.getItem(LINK_KEY)||'null')}catch(e){}
  return a&&a.token&&a.exp>Date.now()&&a.drive===DRIVE?a:null;
}
function saveAuth(a){
  memLink=a;
  try{if(a)localStorage.setItem(LINK_KEY,JSON.stringify(a));else localStorage.removeItem(LINK_KEY)}catch(e){}
}
function cleanLinkId(v){return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
async function connectWith(value){
  var id=cleanLinkId(value);
  if(id.length!==12)throw new Error('That code is not complete. A link ID has 12 letters and numbers, like ABCD-EFGH-JKLM.');
  var r;
  try{r=await fetch(DRIVE+'/api/link/redeem',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({linkId:id})})}
  catch(e){throw new Error('Deluxe Drive could not be reached. Check your connection and try again.')}
  var j={};try{j=await r.json()}catch(e){}
  if(!r.ok)throw new Error(j.error||('Deluxe Drive answered '+r.status+'. Try a new link ID.'));
  var a={token:j.token,exp:Date.now()+(+j.expiresIn||86400)*1000,name:(j.user&&j.user.name)||'',id:(j.user&&j.user.id)||'',drive:DRIVE};
  saveAuth(a);
  return a;
}
async function disconnect(){
  var a=auth;auth=null;saveAuth(null);driveNodes=null;dFolder=null;
  if(a){try{await fetch(DRIVE+'/api/link/session',{method:'DELETE',headers:{Authorization:'Bearer '+a.token}})}catch(e){}}
  showGate();
}
// The key ran out or was ended in Deluxe Drive.
function expired(){
  auth=null;saveAuth(null);driveNodes=null;
  showGate();
  gateError('You were disconnected from Deluxe Drive. Follow the steps above to connect again.');
}
function gateError(t){var g=$('#gerr');g.textContent=t;g.hidden=false}
function showGate(){
  $('#app').hidden=true;$('#gate').hidden=false;
  $('#gerr').hidden=true;
  setTimeout(function(){var i=$('#linkIn');if(i)i.focus()},0);
}
function renderAcct(){
  var a=$('#acct');a.replaceChildren();
  if(!auth)return;
  var nm=auth.name||'Deluxe Drive';
  a.append(el('span','av',nm.trim().charAt(0).toUpperCase()||'D'),el('span','nm',nm));
  var b=el('button','link','Disconnect');b.type='button';b.onclick=disconnect;a.append(b);
}
var connecting=false;
async function submitLink(){
  if(connecting)return;
  var input=$('#linkIn'),btn=$('#connectBtn');
  connecting=true;btn.disabled=true;btn.textContent='Connecting...';$('#gerr').hidden=true;
  try{
    auth=await connectWith(input.value);
    input.value='';
    enterApp();
  }catch(e){gateError(e.message)}
  finally{connecting=false;btn.disabled=false;btn.textContent='Connect'}
}
$('#gateForm').onsubmit=function(e){e.preventDefault();submitLink()};
$('#pasteBtn').onclick=async function(){
  var input=$('#linkIn');
  try{
    var text=await navigator.clipboard.readText();
    input.value=String(text||'').trim();
    if(cleanLinkId(input.value).length===12)submitLink();
    else gateError('What you copied is not a link ID. Copy the code from Deluxe Drive and try again.');
  }catch(e){
    input.focus();
    gateError('This browser did not let the page paste. Press and hold in the box above, then choose Paste.');
  }
};
// A whole link ID pasted in connects straight away.
$('#linkIn').addEventListener('input',function(){if(cleanLinkId(this.value).length===12)submitLink()});

/* ---------- icons ---------- */
var IC={plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',up:'<path d="M6 15l6-6 6 6"/>',down:'<path d="M6 9l6 6 6-6"/>',
  side:'<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M9 5v14"/>',search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.2-4.2"/>',
  cursor:'<path d="M6 4l12 7-5.5 1.6L10 18z"/>',hl:'<path d="M9 14l6-7 3 3-7 6H9z"/><path d="M4 20h16"/>',pen:'<path d="M4 20l1-4L16 5l3 3L8 19z"/>',
  note:'<path d="M5 4h14v11l-5 5H5z"/><path d="M14 20v-5h5"/>',undo:'<path d="M9 7H4v5"/><path d="M4 12a8 8 0 1 1 3 6"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',
  text:'<path d="M5 7V5h14v2M12 5v14M9 19h6"/>',sign:'<path d="M3 16c2.5-3 4.5-8 6.5-8 1.6 0-.6 8 1.4 8 1.7 0 2.6-3.5 4.6-3.5 1.4 0 1.6 2.5 4.5 2.5"/><path d="M3 20h18"/>',
  turn:'<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
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
    t.append(el('span','tn',(d.dirty?'\u25CF ':'')+d.name));
    var x=el('button','xbtn');x.type='button';x.setAttribute('aria-label','Close '+d.name);x.append(icon('x'));
    x.onclick=function(e){e.stopPropagation();closeDoc(d)};
    t.append(x);
    t.onclick=function(){if(d!==cur)activate(d)};
    t.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();if(d!==cur)activate(d)}};
    ts.append(t);
  });
}
function closeDoc(d){
  if(d.dirty&&!window.confirm('“'+d.name+'” has changes that are not saved. Close it anyway?'))return;
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
  var sg=$('#saveGrp');sg.hidden=!cur;
  if(cur){
    var sb=$('#saveBtn'),db=$('#dlBtn'),ed=canEdit(cur);
    sb.textContent=cur.saving==='drive'?'Saving...':(cur.driveId?'Save':'Save to Drive');
    sb.disabled=!!cur.saving||!auth||(!!cur.driveId&&(!cur.dirty||!ed));
    sb.title=cur.driveId?(cur.dirty?'Save your changes to Deluxe Drive':'Nothing to save yet'):'Keep this file in My Drive';
    db.textContent=cur.saving==='download'?'Preparing...':'Download';db.disabled=!!cur.saving;
  }
}
function setStatus(d){
  $('#sname').textContent=d.name;
  var c=$('#chips');c.replaceChildren();
  c.append(el('span','chip kind',LABEL[d.kind]||'File'));
  if(d.size!=null)c.append(el('span','chip',fmtSize(d.size)));
  (d.extras||[]).forEach(function(x){c.append(el('span','chip',x))});
  if(d.sample)c.append(el('span','chip sample','Sample'));
  if(d.dirty)c.append(el('span','chip warn','Not saved'));
  else if(!canEdit(d))c.append(el('span','chip','View only'));
}
async function addDoc(file,name,sample,driveId){
  name=name||file.name;
  var kind=await detect(file,name);
  var d={id:++idc,name:name,kind:kind,file:file,size:file.size,sample:!!sample,zoom:1,ann:{},acts:[],extras:[],page:1,pdf:null,find:null,tc:{},driveId:driveId||null,dirty:false};
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

/* ---------- PDF: pages, thumbnails, find, annotate, edit ---------- */
/* Everything added to a page is kept in that page's own space (the page as it
   is shown before any turning), as fractions of its width and height, so it
   stays put at any zoom and when the page is turned. Pages are listed in
   d.order: {n: page number in the file, rot: extra turn in degrees}. */
var INK='#1c1c1c',pendingSign=null;
function posOf(d,n){if(!d.order)return 0;for(var i=0;i<d.order.length;i++)if(d.order[i].n===n)return i+1;return 0}
function holderOf(d,n){var p=posOf(d,n);return p&&d.holders?d.holders[p-1]:null}
function markDirty(d){if(!d.dirty){d.dirty=true;renderTabs();if(d===cur)setStatus(d)}syncChrome()}
function clamp01(v){return Math.min(1,Math.max(0,v))}
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
function delButton(label,fn){
  var x=el('button','xbtn');x.type='button';x.setAttribute('aria-label',label);x.title=label;x.append(icon('x'));
  x.onclick=function(e){e.stopPropagation();fn()};
  return x;
}
function buildNote(h,o,n,d,focus){
  var s=el('div','sticky');s.style.left=(o.x*100)+'%';s.style.top=(o.y*100)+'%';
  var ta=document.createElement('textarea');ta.value=o.txt;ta.setAttribute('aria-label','Note');ta.oninput=function(){o.txt=ta.value;markDirty(d)};
  s.append(ta,delButton('Delete note',function(){removeObj(d,n,o)}));h.append(s);o._el=s;if(focus)setTimeout(function(){ta.focus()},0);
}
function buildText(h,o,n,d,focus){
  var s=el('div','ptext');s.style.left=(o.x*100)+'%';s.style.top=(o.y*100)+'%';s.style.fontSize=(o.size*h._H)+'px';s.style.color=o.c;
  var tx=el('div','ptx');tx.contentEditable='true';tx.spellcheck=false;tx.setAttribute('role','textbox');tx.setAttribute('aria-label','Text on the page');
  tx.textContent=o.txt;
  tx.oninput=function(){o.txt=tx.innerText.replace(/\n$/,'');markDirty(d)};
  tx.onblur=function(){if(!o.txt.trim())removeObj(d,n,o)};
  s.append(tx,delButton('Delete text',function(){removeObj(d,n,o)}));h.append(s);o._el=s;
  if(focus)setTimeout(function(){tx.focus()},0);
}
function buildImg(h,o,n,d){
  var s=el('div','pimg');s.tabIndex=0;s.style.left=(o.x*100)+'%';s.style.top=(o.y*100)+'%';s.style.width=(o.w*100)+'%';s.style.height=(o.h*100)+'%';
  var im=document.createElement('img');im.src=o.src;im.alt='Signature';im.draggable=false;
  s.append(im,delButton('Delete signature',function(){removeObj(d,n,o)}));h.append(s);o._el=s;
}
function placeObj(h,o,n,d,focus){
  if(o.t==='note')buildNote(h,o,n,d,focus);
  else if(o.t==='text')buildText(h,o,n,d,focus);
  else if(o.t==='img')buildImg(h,o,n,d);
}
function addObj(d,n,h,o,focus){
  (d.ann[n]=d.ann[n]||[]).push(o);d.acts.push({p:n,o:o});
  placeObj(h,o,n,d,focus);paintOv(h,n,d);markDirty(d);
}
function removeObj(d,n,o){
  var a=d.ann[n]||[],i=a.indexOf(o);if(i>-1)a.splice(i,1);
  if(o._el){o._el.remove();o._el=null}
  d.acts=d.acts.filter(function(x){return x.o!==o});
  var h=holderOf(d,n);if(h)paintOv(h,n,d);
  syncChrome();
}
// Where on the page (as fractions) a pointer is, undoing any turn of the page.
function localPt(h,ev){
  var r=h.getBoundingClientRect(),dx=ev.clientX-(r.left+r.width/2),dy=ev.clientY-(r.top+r.height/2),th=(h._rot||0)*Math.PI/180;
  var x=dx*Math.cos(th)+dy*Math.sin(th),y=-dx*Math.sin(th)+dy*Math.cos(th);
  return [clamp01(x/h._W+.5),clamp01(y/h._H+.5)];
}
function attachDraw(h,n,d){
  h.addEventListener('pointerdown',function(e){
    if(tool==='select'||e.button>0||e.target.closest('.sticky,.ptext,.pimg'))return;
    var p0=localPt(h,e);
    if(tool==='note'){addObj(d,n,h,{t:'note',x:p0[0],y:p0[1],txt:'',c:COLORS[ci]},true);e.preventDefault();return}
    if(tool==='text'){
      var size=0.022;
      addObj(d,n,h,{t:'text',x:p0[0],y:clamp01(p0[1]-size*.6),txt:'',size:size,c:INK},true);
      e.preventDefault();return;
    }
    if(tool==='sign'){
      if(!pendingSign){openSignPad();return}
      var w=0.3,hh=w*h._W*pendingSign.ratio/h._H;
      addObj(d,n,h,{t:'img',x:clamp01(p0[0]-w/2),y:clamp01(p0[1]-hh/2),w:w,h:hh,src:pendingSign.src});
      setTool('select');toast('Signature added. Tap Save to keep it.');
      e.preventDefault();return;
    }
    var obj=tool==='hl'?{t:'hl',x:p0[0],y:p0[1],w:0,h:0,c:COLORS[ci]}:{t:'pen',pts:[p0],c:COLORS[ci]};
    (d.ann[n]=d.ann[n]||[]).push(obj);
    try{h.setPointerCapture(e.pointerId)}catch(x){}
    var mv=function(ev){var p=localPt(h,ev);if(obj.t==='hl'){obj.w=p[0]-obj.x;obj.h=p[1]-obj.y}else obj.pts.push(p);paintOv(h,n,d)};
    var up=function(){
      h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);
      if(obj.t==='hl'){
        if(obj.w<0){obj.x+=obj.w;obj.w=-obj.w}
        if(obj.h<0){obj.y+=obj.h;obj.h=-obj.h}
      }
      if(obj.t==='hl'&&(obj.w<.006||obj.h<.004)){var a=d.ann[n],i=a.indexOf(obj);if(i>-1)a.splice(i,1);paintOv(h,n,d)}
      else{d.acts.push({p:n,o:obj});markDirty(d)}
    };
    h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);
    e.preventDefault();
  });
}
function scrollToPage(d,pos,frac){
  var h=d.holders&&d.holders[pos-1];if(!h)return;
  var box=h.parentNode;
  var top=box.getBoundingClientRect().top-stage.getBoundingClientRect().top+stage.scrollTop;
  stage.scrollTo({top:top-12+(frac?frac*box.offsetHeight-stage.clientHeight/3:0)});
}
function setPage(d,pos){
  d.page=pos;$('#pageIn').value=pos;
  $$('#thumbs .th').forEach(function(t,i){t.classList.toggle('cur',i===pos-1)});
}
stage.addEventListener('scroll',function(){
  if(!cur||cur.kind!=='pdf'||!cur.holders)return;
  var top=stage.getBoundingClientRect().top+stage.clientHeight/3,pg=1;
  for(var i=0;i<cur.holders.length;i++){if(cur.holders[i].parentNode.getBoundingClientRect().bottom>top){pg=i+1;break}pg=i+1}
  if(pg!==cur.page)setPage(cur,pg);
},{passive:true});

// Turning, moving and removing pages. Each change can be undone.
function pageOp(d,i,op){
  var prev=d.order.map(function(o){return {n:o.n,rot:o.rot}}),len=d.order.length,to=i+1;
  if(op==='rot')d.order[i].rot=((d.order[i].rot||0)+90)%360;
  else if(op==='up'&&i>0){var a=d.order[i];d.order[i]=d.order[i-1];d.order[i-1]=a;to=i}
  else if(op==='down'&&i<len-1){var b=d.order[i];d.order[i]=d.order[i+1];d.order[i+1]=b;to=i+2}
  else if(op==='del'){
    if(len<2){toast('A PDF needs at least one page.');return}
    d.order.splice(i,1);to=Math.min(i+1,len-1);
  }
  else return;
  d.acts.push({kind:'pages',prev:prev});d.page=to;
  d.extras=[d.order.length+(d.order.length===1?' page':' pages')];setStatus(d);
  markDirty(d);d.redraw();
}

var R={};
R.pdf=async function(d){
  var lib=window.pdfjsLib;if(!lib)throw new Error('The PDF reader did not load.');
  lib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  if(!d.pdf)d.pdf=await lib.getDocument({data:await d.file.arrayBuffer()}).promise;
  var pdf=d.pdf;
  if(!d.order){d.order=[];for(var k=1;k<=pdf.numPages;k++)d.order.push({n:k,rot:0})}
  d.extras=[d.order.length+(d.order.length===1?' page':' pages')];
  if(window.innerWidth>760)side.hidden=false;
  syncChrome();
  var draw=async function(){
    var my=++state.drawId;
    state.ios.forEach(function(o){o.disconnect()});state.ios=[];
    stage.replaceChildren();thumbs.replaceChildren();d.holders=[];
    $('#pageTot').textContent='/ '+d.order.length;
    var pages=el('div','pages');stage.append(pages);
    var w=Math.max(240,stage.clientWidth-34),dpr=Math.min(window.devicePixelRatio||1,2);
    var io=addIO(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);e.target._r()}})},{root:stage,rootMargin:'900px 0px'});
    var tio=addIO(function(es){es.forEach(function(e){if(e.isIntersecting){tio.unobserve(e.target);e.target._r()}})},{root:side,rootMargin:'400px 0px'});
    for(var i=0;i<d.order.length;i++){
      var o=d.order[i],page=await pdf.getPage(o.n);
      if(my!==state.drawId)return;
      var rot=o.rot||0,sideways=rot%180!==0;
      var v1=page.getViewport({scale:1}),s=w/(sideways?v1.height:v1.width)*d.zoom,vp=page.getViewport({scale:s});
      var W=vp.width,H=vp.height,BW=sideways?H:W,BH=sideways?W:H;
      var box=el('div','pgw');box.style.width=BW+'px';box.style.height=BH+'px';
      var h=el('div','pg');h.style.width=W+'px';h.style.height=H+'px';h.style.left=((BW-W)/2)+'px';h.style.top=((BH-H)/2)+'px';
      if(rot)h.style.transform='rotate('+rot+'deg)';
      var ov=el('canvas','ov');ov.width=Math.floor(W*dpr);ov.height=Math.floor(H*dpr);
      h._ov=ov;h._W=W;h._H=H;h._dpr=dpr;h._rot=rot;h._src=o.n;h.append(ov);
      (function(page,s,h,n){
        box._r=async function(){
          if(my!==state.drawId)return;
          var v=page.getViewport({scale:s*dpr}),c=document.createElement('canvas');c.className='base';c.width=Math.floor(v.width);c.height=Math.floor(v.height);
          await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
          if(my===state.drawId)h.insertBefore(c,h.firstChild);
        };
        (d.ann[n]||[]).forEach(function(a){placeObj(h,a,n,d,false)});
        attachDraw(h,n,d);paintOv(h,n,d);
      })(page,s,h,o.n);
      box.append(h);pages.append(box);io.observe(box);d.holders.push(h);

      // the page list on the side, with buttons to turn, move and remove a page
      var th=el('div','th'),pv=el('button','thp');pv.type='button';pv.setAttribute('aria-label','Go to page '+(i+1));
      var tw=112,tph=Math.round(tw*(sideways?v1.width/v1.height:v1.height/v1.width));
      var tbox=el('div','tp');tbox.style.width=tw+'px';tbox.style.height=tph+'px';
      pv.append(tbox,el('span',null,String(i+1)));
      var ctl=el('div','thc');
      [['rot','Turn page','turn'],['up','Move page up','up'],['down','Move page down','down'],['del','Delete page','trash']].forEach(function(b){
        var bt=el('button','tbtn');bt.type='button';bt.title=b[1];bt.setAttribute('aria-label',b[1]+' '+(i+1));bt.append(icon(b[2]));
        if((b[0]==='up'&&i===0)||(b[0]==='down'&&i===d.order.length-1)||(b[0]==='del'&&d.order.length<2))bt.disabled=true;
        (function(idx,op){bt.onclick=function(){pageOp(d,idx,op)}})(i,b[0]);
        ctl.append(bt);
      });
      th.append(pv,ctl);
      (function(page,tbox,bw,bh,pos,rot){
        th._r=async function(){
          if(my!==state.drawId)return;
          var side90=rot%180!==0,cw=side90?bh:bw,chh=side90?bw:bh;
          var v=page.getViewport({scale:cw/page.getViewport({scale:1}).width*(window.devicePixelRatio>1?2:1)});
          var c=document.createElement('canvas');c.width=Math.floor(v.width);c.height=Math.floor(v.height);
          await page.render({canvasContext:c.getContext('2d'),viewport:v}).promise;
          c.style.width=cw+'px';c.style.height=chh+'px';
          if(rot){c.style.position='absolute';c.style.left=((bw-cw)/2)+'px';c.style.top=((bh-chh)/2)+'px';c.style.transform='rotate('+rot+'deg)'}
          tbox.append(c);
        };
        pv.onclick=function(){scrollToPage(d,pos)};
      })(page,tbox,tw,tph,i+1,rot);
      thumbs.append(th);tio.observe(th);
    }
    setPage(d,Math.min(d.page,d.order.length));
    if(d.page>1)scrollToPage(d,d.page);
  };
  d.redraw=draw;await draw();
};

/* find in PDF */
function updateFindCnt(){
  var f=cur&&cur.find,c=$('#findCnt');
  c.textContent=f?(f.matches.length?(f.i+1)+' of '+f.matches.length:'No matches'):'';
}
function repaintAll(d){(d.holders||[]).forEach(function(h){paintOv(h,h._src,d)})}
async function runFind(q){
  var d=cur;if(!d||d.kind!=='pdf'||!d.pdf)return;
  q=q.trim();if(!q){d.find=null;updateFindCnt();repaintAll(d);return}
  $('#findCnt').textContent='Searching...';
  var lq=q.toLowerCase(),matches=[],lib=window.pdfjsLib;
  for(var k=0;k<d.order.length&&matches.length<2000;k++){
    var p=d.order[k].n,page=await d.pdf.getPage(p),v1=page.getViewport({scale:1});
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
  repaintAll(d);
  if(matches.length)gotoMatch(0);
}
function gotoMatch(i){
  var d=cur,f=d&&d.find;if(!f||!f.matches.length)return;
  f.i=(i+f.matches.length)%f.matches.length;var m=f.matches[f.i];
  updateFindCnt();repaintAll(d);
  var pos=posOf(d,m.p);if(pos)scrollToPage(d,pos,m.y);
}
$('#findIn').addEventListener('keydown',function(e){
  if(e.key!=='Enter')return;e.preventDefault();
  var q=this.value.trim();
  if(cur&&cur.find&&cur.find.q===q)gotoMatch(cur.find.i+(e.shiftKey?-1:1));else runFind(q);
});
$('#fNext').onclick=function(){if(cur&&cur.find)gotoMatch(cur.find.i+1);else runFind($('#findIn').value)};
$('#fPrev').onclick=function(){if(cur&&cur.find)gotoMatch(cur.find.i-1);else runFind($('#findIn').value)};

/* page nav, sidebar, editing tools */
$('#pNext').onclick=function(){if(cur&&cur.order)scrollToPage(cur,Math.min(cur.order.length,cur.page+1))};
$('#pPrev').onclick=function(){if(cur&&cur.order)scrollToPage(cur,Math.max(1,cur.page-1))};
$('#pageIn').addEventListener('keydown',function(e){
  if(e.key!=='Enter'||!cur||!cur.order)return;
  var n=parseInt(this.value,10);if(n>=1&&n<=cur.order.length)scrollToPage(cur,n);else this.value=cur.page;
});
$('#sideBtn').onclick=function(){side.hidden=!side.hidden;$('#sideBtn').setAttribute('aria-pressed',String(!side.hidden));redraw()};
var TOOL_HINT={hl:'Drag over the page to highlight.',pen:'Draw on the page with your finger or mouse.',note:'Tap the page to add a note.',text:'Tap the page where the text should go, then type.',sign:'Tap the page where the signature should go.'};
function setTool(t){
  tool=t;
  $$('[data-tool]').forEach(function(x){x.setAttribute('aria-pressed',String(x.getAttribute('data-tool')===t))});
  syncChrome();
}
$$('[data-tool]').forEach(function(b){b.onclick=function(){
  var t=b.getAttribute('data-tool');
  if(t==='sign'){openSignPad();return}
  setTool(t);
  if(TOOL_HINT[t])toast(TOOL_HINT[t]);
}});
COLORS.forEach(function(c,i){var b=el('button','sw');b.type='button';b.style.background=c;b.setAttribute('aria-label','Colour '+(i+1));b.setAttribute('aria-pressed',String(i===0));
  b.onclick=function(){ci=i;$$('#swatches .sw').forEach(function(x,j){x.setAttribute('aria-pressed',String(j===i))})};$('#swatches').append(b)});
$('#undo').onclick=function(){
  if(!cur||!cur.acts.length)return;var a=cur.acts[cur.acts.length-1];
  if(a.kind==='pages'){cur.acts.pop();cur.order=a.prev;cur.extras=[cur.order.length+(cur.order.length===1?' page':' pages')];setStatus(cur);cur.redraw();syncChrome();return}
  removeObj(cur,a.p,a.o);
};

/* the signature pad */
var pad=$('#signPad'),padCtx=pad.getContext('2d'),padInk=false;
function padReset(){
  var r=pad.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);
  pad.width=Math.max(1,Math.round(r.width*dpr));pad.height=Math.max(1,Math.round(r.height*dpr));
  padCtx.setTransform(dpr,0,0,dpr,0,0);padCtx.lineWidth=2.6;padCtx.lineCap='round';padCtx.lineJoin='round';padCtx.strokeStyle='#14213d';
  padInk=false;$('#signUse').disabled=true;
}
function openSignPad(){
  $('#signModal').hidden=false;padReset();
}
function closeSignPad(){$('#signModal').hidden=true}
pad.addEventListener('pointerdown',function(e){
  e.preventDefault();try{pad.setPointerCapture(e.pointerId)}catch(x){}
  var r=pad.getBoundingClientRect();padCtx.beginPath();padCtx.moveTo(e.clientX-r.left,e.clientY-r.top);
  padCtx.lineTo(e.clientX-r.left+.1,e.clientY-r.top);padCtx.stroke();
  var mv=function(ev){padCtx.lineTo(ev.clientX-r.left,ev.clientY-r.top);padCtx.stroke()};
  var up=function(){pad.removeEventListener('pointermove',mv);pad.removeEventListener('pointerup',up);pad.removeEventListener('pointercancel',up)};
  pad.addEventListener('pointermove',mv);pad.addEventListener('pointerup',up);pad.addEventListener('pointercancel',up);
  padInk=true;$('#signUse').disabled=false;
});
// The drawing, cut to the ink, as a transparent PNG.
function padImage(){
  var w=pad.width,h=pad.height,data=padCtx.getImageData(0,0,w,h).data,x0=w,y0=h,x1=-1,y1=-1;
  for(var y=0;y<h;y++)for(var x=0;x<w;x++)if(data[(y*w+x)*4+3]>8){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return null;
  var m=6;x0=Math.max(0,x0-m);y0=Math.max(0,y0-m);x1=Math.min(w-1,x1+m);y1=Math.min(h-1,y1+m);
  var c=document.createElement('canvas');c.width=x1-x0+1;c.height=y1-y0+1;
  c.getContext('2d').drawImage(pad,x0,y0,c.width,c.height,0,0,c.width,c.height);
  return {src:c.toDataURL('image/png'),ratio:c.height/c.width};
}
$('#signClear').onclick=padReset;
$('#signCancel').onclick=closeSignPad;
$('#signModal').addEventListener('click',function(e){if(e.target===this)closeSignPad()});
$('#signUse').onclick=function(){
  var img=padInk&&padImage();if(!img){toast('Draw your signature first.');return}
  pendingSign=img;closeSignPad();setTool('sign');toast(TOOL_HINT.sign);
};

/* ---------- other formats ---------- */
/* ---------- Word: edit in place ---------- */
function formatBar(d,ed){
  var bar=el('div','fmtbar');bar.setAttribute('role','toolbar');bar.setAttribute('aria-label','Text style');
  var cmd=function(label,title,fn){var b=el('button','fbtn',label);b.type='button';b.title=title;b.setAttribute('aria-label',title);
    b.addEventListener('mousedown',function(e){e.preventDefault()});
    b.onclick=function(){ed.focus();fn();d.html=ed.innerHTML;markDirty(d)};bar.append(b);return b};
  cmd('B','Bold',function(){document.execCommand('bold')}).style.fontWeight='700';
  cmd('I','Italic',function(){document.execCommand('italic')}).style.fontStyle='italic';
  cmd('U','Underline',function(){document.execCommand('underline')}).style.textDecoration='underline';
  bar.append(el('span','fsep'));
  cmd('Title','Make this line a heading',function(){document.execCommand('formatBlock',false,'H2')});
  cmd('Normal','Make this line normal text',function(){document.execCommand('formatBlock',false,'P')});
  bar.append(el('span','fsep'));
  cmd('• List','Bulleted list',function(){document.execCommand('insertUnorderedList')});
  cmd('1. List','Numbered list',function(){document.execCommand('insertOrderedList')});
  bar.append(el('span','fsep'));
  cmd('Undo','Undo',function(){document.execCommand('undo')});
  return bar;
}
R.docx=async function(d){
  if(d.html==null){
    if(!window.mammoth)throw new Error('The Word reader did not load.');
    var r=await mammoth.convertToHtml({arrayBuffer:await d.file.arrayBuffer()});
    d.html=clean(r.value);
    if(!d.html.replace(/<[^>]*>/g,'').trim()&&d.html.indexOf('<img')<0)d.html='<p></p>';
  }
  var n=el('div','doc editable');n.contentEditable='true';n.spellcheck=true;n.innerHTML=d.html;
  n.setAttribute('aria-label','Document text');
  n.addEventListener('input',function(){d.html=n.innerHTML;markDirty(d)});
  d.editor=n;
  var hint=el('div','edhint','Tap anywhere in the document to type. Saving keeps the text, headings, bold, lists, tables and pictures; fonts and page layout are simplified.');
  stage.replaceChildren(formatBar(d,n),hint,n);
};

/* ---------- Excel and CSV: edit cells ---------- */
R.sheet=async function(d){
  if(!window.XLSX)throw new Error('The spreadsheet reader did not load.');
  if(!d.wb)d.wb=XLSX.read(await d.file.arrayBuffer(),{type:'array'});
  var wb=d.wb,names=wb.SheetNames;
  if(!names.length)throw new Error('This workbook has no sheets.');
  d.extras=[names.length+(names.length===1?' sheet':' sheets')];setStatus(d);
  stage.replaceChildren();
  var bar=el('div','sheetbar'),tabs=el('div','tabs2');tabs.setAttribute('role','tablist');
  var q=document.createElement('input');q.type='search';q.id='sheetFilter';q.placeholder='Filter rows';q.setAttribute('aria-label','Filter rows');
  var addRow=el('button','pill','Add row');addRow.type='button';
  bar.append(tabs,addRow,q);
  var hint=el('div','edhint','Tap a cell to change it. Press Enter when done.');
  var body=el('div');stage.append(bar,hint,body);
  var MAXR=2000,MAXC=80,rows=[],ws=null,rng=null,si=d.sheetIdx||0;
  function col(i){var s='';i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
  function grow(r,c){
    var ref=ws['!ref']?XLSX.utils.decode_range(ws['!ref']):{s:{r:r,c:c},e:{r:r,c:c}};
    ref.s.r=Math.min(ref.s.r,r);ref.s.c=Math.min(ref.s.c,c);ref.e.r=Math.max(ref.e.r,r);ref.e.c=Math.max(ref.e.c,c);
    ws['!ref']=XLSX.utils.encode_range(ref);
  }
  function commit(td){
    var i=+td.getAttribute('data-r'),c=+td.getAttribute('data-c'),v=td.textContent;
    var old=rows[i]&&rows[i][c]!=null?String(rows[i][c]):'';
    if(v===old)return;
    while(rows[i].length<=c)rows[i].push('');
    rows[i][c]=v;
    var R0=rng.s.r+i,C0=rng.s.c+c,addr=XLSX.utils.encode_cell({r:R0,c:C0}),t=v.trim();
    if(t==='')delete ws[addr];
    else if(/^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i.test(t))ws[addr]={t:'n',v:Number(t)};
    else ws[addr]={t:'s',v:v};
    grow(R0,C0);markDirty(d);
  }
  function paint(){
    body.replaceChildren();var f=q.value.trim().toLowerCase();
    var cols=Math.max(1,Math.min(MAXC,rows.reduce(function(m,r){return Math.max(m,r.length)},0))),shown=0,total=0;
    var wrap=el('div','tablewrap'),t=el('table','grid'),th=el('thead'),hr=el('tr');
    hr.append(el('th',null,''));for(var c=0;c<cols;c++)hr.append(el('th',null,col(rng.s.c+c)));th.append(hr);
    var tb=el('tbody');
    for(var i=0;i<rows.length;i++){
      var r=rows[i];
      if(f&&!r.some(function(v){return String(v).toLowerCase().indexOf(f)>-1}))continue;
      total++;if(shown>=MAXR)continue;shown++;
      var tr=el('tr');tr.append(el('th',null,String(rng.s.r+i+1)));
      for(var c2=0;c2<cols;c2++){
        var td=el('td',null,r[c2]==null?'':String(r[c2]));
        td.contentEditable='true';td.spellcheck=false;td.setAttribute('data-r',i);td.setAttribute('data-c',c2);
        tr.append(td);
      }
      tb.append(tr);
    }
    t.append(th,tb);wrap.append(t);body.append(wrap);
    body.append(el('div','note',total>MAXR?'Showing the first '+MAXR+' of '+total+' rows.':(f?total+' matching rows.':rows.length+' rows, '+cols+' columns.')));
  }
  body.addEventListener('focusout',function(e){if(e.target.matches&&e.target.matches('td[contenteditable]'))commit(e.target)});
  body.addEventListener('keydown',function(e){
    var td=e.target;if(!td.matches||!td.matches('td[contenteditable]'))return;
    if(e.key==='Enter'){e.preventDefault();var tr=td.parentNode.nextElementSibling,idx=Array.prototype.indexOf.call(td.parentNode.children,td);td.blur();
      if(tr&&tr.children[idx])tr.children[idx].focus()}
    else if(e.key==='Escape'){var i=+td.getAttribute('data-r'),c=+td.getAttribute('data-c');td.textContent=rows[i]&&rows[i][c]!=null?String(rows[i][c]):'';td.blur()}
  });
  function pick(i){
    si=i;d.sheetIdx=i;
    Array.prototype.forEach.call(tabs.children,function(b,j){b.setAttribute('aria-selected',j===i?'true':'false')});
    ws=wb.Sheets[names[i]];
    if(!ws['!ref'])ws['!ref']='A1:A1';
    rng=XLSX.utils.decode_range(ws['!ref']);
    rows=XLSX.utils.sheet_to_json(ws,{header:1,raw:false,defval:'',blankrows:true});
    var want=rng.e.r-rng.s.r+1;while(rows.length<want)rows.push([]);
    paint();
  }
  addRow.onclick=function(){
    rows.push([]);var r=rng.s.r+rows.length-1;rng.e.r=Math.max(rng.e.r,r);ws['!ref']=XLSX.utils.encode_range(rng);
    q.value='';paint();var last=body.querySelector('tbody tr:last-child td');if(last)last.focus();
  };
  names.forEach(function(n,i){var b=el('button','stab',n);b.type='button';b.setAttribute('role','tab');b.onclick=function(){pick(i)};tabs.append(b)});
  q.oninput=paint;pick(Math.min(si,names.length-1));
};

/* ---------- saving ---------- */
var EDITABLE={pdf:1,docx:1,sheet:1,text:1};
function canEdit(d){return !!d&&!!EDITABLE[d.kind]&&!d.cut}
var MIME_OUT={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',xlsm:'application/vnd.ms-excel.sheet.macroEnabled.12',
  xls:'application/vnd.ms-excel',ods:'application/vnd.oasis.opendocument.spreadsheet',csv:'text/csv',tsv:'text/tab-separated-values'};
function loadScript(urls){
  return new Promise(function(res,rej){
    var i=0;
    (function next(){
      if(i>=urls.length){rej(new Error('A part of Deluxe Docs did not load. Check your connection and try again.'));return}
      var s=document.createElement('script');s.src=urls[i++];s.onload=function(){res()};s.onerror=function(){s.remove();next()};
      document.head.append(s);
    })();
  });
}
async function needPdfLib(){
  if(window.PDFLib)return;
  await loadScript(['https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js','https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js']);
  if(!window.PDFLib)throw new Error('The PDF saver did not load. Check your connection and try again.');
}
function rgbOf(hex){var n=parseInt(String(hex||'#000').slice(1),16);return PDFLib.rgb((n>>16&255)/255,(n>>8&255)/255,(n&255)/255)}
// The standard PDF font has Latin letters only; anything else becomes "?".
function pdfSafe(font,text){
  try{font.encodeText(text);return text}catch(e){}
  return Array.prototype.map.call(text,function(ch){try{font.encodeText(ch);return ch}catch(e){return '?'}}).join('');
}
function wrapText(font,size,text,maxW){
  var out=[];
  String(text||'').split('\n').forEach(function(par){
    var line='';
    par.split(/(\s+)/).forEach(function(word){
      var t=line+word;
      if(line&&font.widthOfTextAtSize(t.trimEnd(),size)>maxW){out.push(line.trimEnd());line=word.trimStart()}else line=t;
    });
    out.push(line.trimEnd());
  });
  return out;
}
async function exportPdf(d){
  await needPdfLib();
  var L=PDFLib,src;
  try{src=await L.PDFDocument.load(await d.file.arrayBuffer(),{ignoreEncryption:true})}
  catch(e){throw new Error('This PDF could not be changed. It may be locked with a password.')}
  var out=await L.PDFDocument.create(),font=await out.embedFont(L.StandardFonts.Helvetica);
  var copied=await out.copyPages(src,d.order.map(function(o){return o.n-1}));
  for(var i=0;i<copied.length;i++){
    var p=copied[i],o=d.order[i];out.addPage(p);
    var pj=await d.pdf.getPage(o.n),vp=pj.getViewport({scale:1}),R0=L.degrees(pj.rotate||0),VW=vp.width,VH=vp.height;
    var at=function(fx,fy){var q=vp.convertToPdfPoint(fx*VW,fy*VH);return {x:q[0],y:q[1]}};
    var list=d.ann[o.n]||[];
    for(var k=0;k<list.length;k++){
      var a=list[k];
      if(a.t==='hl'){
        var c1=at(a.x,a.y),c2=at(a.x+a.w,a.y+a.h);
        p.drawRectangle({x:Math.min(c1.x,c2.x),y:Math.min(c1.y,c2.y),width:Math.abs(c2.x-c1.x),height:Math.abs(c2.y-c1.y),color:rgbOf(a.c),opacity:.4});
      }else if(a.t==='pen'){
        var pts=a.pts.map(function(q){return at(q[0],q[1])});
        if(pts.length===1)p.drawCircle({x:pts[0].x,y:pts[0].y,size:.9,color:rgbOf(a.c)});
        for(var j=1;j<pts.length;j++)p.drawLine({start:pts[j-1],end:pts[j],thickness:1.8,color:rgbOf(a.c),lineCap:L.LineCapStyle.Round});
      }else if(a.t==='text'){
        var size=a.size*VH,lines=String(a.txt||'').split('\n');
        lines.forEach(function(ln,li){
          if(!ln)return;
          var b=at(a.x,a.y+a.size*(li*1.25+.92));
          p.drawText(pdfSafe(font,ln),{x:b.x,y:b.y,size:size,font:font,color:rgbOf(a.c),rotate:R0});
        });
      }else if(a.t==='note'&&String(a.txt||'').trim()){
        var fs=9,lh=11.5,bw=Math.min(170,VW*.45),wrapped=wrapText(font,fs,pdfSafe(font,a.txt),bw-12),bh=wrapped.length*lh+10;
        var o0=at(a.x,Math.min(1,a.y+bh/VH));
        p.drawRectangle({x:o0.x,y:o0.y,width:bw,height:bh,color:rgbOf('#FFE680'),rotate:R0,borderColor:rgbOf('#C9A800'),borderWidth:.5});
        wrapped.forEach(function(ln,li){
          var b=at(a.x+6/VW,a.y+(5+lh*li+fs)/VH);
          p.drawText(ln,{x:b.x,y:b.y,size:fs,font:font,color:rgbOf('#2A2410'),rotate:R0});
        });
      }else if(a.t==='img'){
        var png=await out.embedPng(a.src),b2=at(a.x,a.y+a.h);
        p.drawImage(png,{x:b2.x,y:b2.y,width:a.w*VW,height:a.h*VH,rotate:R0});
      }
    }
    if(o.rot)p.setRotation(L.degrees(((p.getRotation().angle||0)+o.rot)%360));
  }
  return new Blob([await out.save()],{type:'application/pdf'});
}

/* A small Word writer: the edited page becomes paragraphs, headings, lists,
   tables and pictures in a new .docx. */
function xmlEsc(s){return String(s).replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]}).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'')}
function htmlToDocx(root){
  var media=[],rels=[],nums=[],picId=0,body=[];
  function runs(node,f,out){
    for(var c=node.firstChild;c;c=c.nextSibling){
      if(c.nodeType===3){var t=c.nodeValue.replace(/\s+/g,' ');if(t)out.push(run(t,f));continue}
      if(c.nodeType!==1)continue;
      var tg=c.tagName,g=Object.assign({},f);
      if(tg==='BR'){out.push('<w:r><w:br/></w:r>');continue}
      if(tg==='IMG'){var im=image(c);if(im)out.push(im);continue}
      if(tg==='B'||tg==='STRONG')g.b=1;else if(tg==='I'||tg==='EM')g.i=1;else if(tg==='U'||tg==='INS')g.u=1;
      else if(tg==='S'||tg==='STRIKE'||tg==='DEL')g.s=1;else if(tg==='SUP')g.sup=1;else if(tg==='SUB')g.sub=1;else if(tg==='A')g.link=1;
      else if(tg==='CODE'||tg==='KBD')g.mono=1;
      if(c.style){if(/bold|[6-9]00/.test(c.style.fontWeight))g.b=1;if(c.style.fontStyle==='italic')g.i=1;if(/underline/.test(c.style.textDecoration))g.u=1}
      runs(c,g,out);
    }
  }
  function run(t,f){
    var p='';
    if(f.b)p+='<w:b/>';if(f.i)p+='<w:i/>';if(f.s)p+='<w:strike/>';
    if(f.mono)p+='<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>';
    if(f.link)p+='<w:color w:val="1A66F5"/>';
    if(f.u||f.link)p+='<w:u w:val="single"/>';
    if(f.sup)p+='<w:vertAlign w:val="superscript"/>';else if(f.sub)p+='<w:vertAlign w:val="subscript"/>';
    return '<w:r>'+(p?'<w:rPr>'+p+'</w:rPr>':'')+'<w:t xml:space="preserve">'+xmlEsc(t)+'</w:t></w:r>';
  }
  function image(img){
    var m=/^data:image\/(png|jpe?g|gif);base64,(.+)$/i.exec(img.getAttribute('src')||'');if(!m)return '';
    var ext=m[1].toLowerCase()==='jpg'?'jpeg':m[1].toLowerCase();
    picId++;var name='image'+picId+'.'+(ext==='jpeg'?'jpeg':ext),rid='rIdImg'+picId;
    media.push({name:name,data:m[2]});rels.push('<Relationship Id="'+rid+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/'+name+'"/>');
    var w=img.naturalWidth||img.width||300,h=img.naturalHeight||img.height||200,maxW=600;
    if(w>maxW){h=h*maxW/w;w=maxW}
    var cx=Math.round(w*9525),cy=Math.round(h*9525);
    return '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="'+picId+'" name="Picture '+picId+'"/>'+
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'+
      '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="'+picId+'" name="'+name+'"/><pic:cNvPicPr/></pic:nvPicPr>'+
      '<pic:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>'+
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic>'+
      '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  }
  function para(inner,ppr){return '<w:p>'+(ppr?'<w:pPr>'+ppr+'</w:pPr>':'')+inner+'</w:p>'}
  var BLOCK=/^(P|DIV|H[1-6]|UL|OL|LI|TABLE|THEAD|TBODY|TFOOT|TR|TD|TH|BLOCKQUOTE|PRE|HR|SECTION|ARTICLE|HEADER|FOOTER|FIGURE)$/;
  function hasBlock(n){for(var c=n.firstChild;c;c=c.nextSibling)if(c.nodeType===1&&BLOCK.test(c.tagName))return true;return false}
  function list(node,depth,out){
    var ordered=node.tagName==='OL',numId=ordered?(nums.push(nums.length+2),nums[nums.length-1]):1;
    for(var li=node.firstChild;li;li=li.nextSibling){
      if(li.nodeType!==1)continue;
      if(li.tagName!=='LI'){blocks(li,out,depth);continue}
      var inline=[],sub=[];
      for(var c=li.firstChild;c;c=c.nextSibling){
        if(c.nodeType===1&&(c.tagName==='UL'||c.tagName==='OL'))sub.push(c);
        else if(c.nodeType===1&&BLOCK.test(c.tagName)){var tmp=[];runs(c,{},tmp);inline.push(tmp.join(''))}
        else{var t2=[];var w=document.createElement('span');w.append(c.cloneNode(true));runs(w,{},t2);inline.push(t2.join(''))}
      }
      out.push(para(inline.join(''),'<w:numPr><w:ilvl w:val="'+Math.min(depth,2)+'"/><w:numId w:val="'+numId+'"/></w:numPr>'));
      sub.forEach(function(s){list(s,depth+1,out)});
    }
  }
  function table(node,out){
    var rows=[];
    (function collect(n){for(var c=n.firstChild;c;c=c.nextSibling){if(c.nodeType!==1)continue;if(c.tagName==='TR')rows.push(c);else if(/^(THEAD|TBODY|TFOOT)$/.test(c.tagName))collect(c)}})(node);
    if(!rows.length)return;
    var cols=rows.reduce(function(m,r){var k=0;Array.prototype.forEach.call(r.children,function(c){k+=+c.getAttribute('colspan')||1});return Math.max(m,k)},1);
    var grid='';for(var g=0;g<cols;g++)grid+='<w:gridCol w:w="'+Math.floor(9000/cols)+'"/>';
    var x='<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="0" w:type="auto"/><w:tblBorders>'+
      ['top','left','bottom','right','insideH','insideV'].map(function(s){return '<w:'+s+' w:val="single" w:sz="4" w:space="0" w:color="999999"/>'}).join('')+
      '</w:tblBorders></w:tblPr><w:tblGrid>'+grid+'</w:tblGrid>';
    rows.forEach(function(r){
      x+='<w:tr>';
      Array.prototype.forEach.call(r.children,function(c){
        if(c.tagName!=='TD'&&c.tagName!=='TH')return;
        var inner=[];blocks(c,inner,0);if(!inner.length||!/<w:p[ >]/.test(inner[inner.length-1]))inner.push('<w:p/>');
        var span=+c.getAttribute('colspan')||1;
        x+='<w:tc><w:tcPr><w:tcW w:w="'+Math.floor(9000/cols)*span+'" w:type="dxa"/>'+(span>1?'<w:gridSpan w:val="'+span+'"/>':'')+'</w:tcPr>'+inner.join('')+'</w:tc>';
      });
      x+='</w:tr>';
    });
    out.push(x+'</w:tbl>');out.push('<w:p/>');
  }
  function blocks(node,out,depth){
    var pending=[];
    var flush=function(){if(pending.length){var s=pending.join('');if(s)out.push(para(s));pending=[]}};
    for(var c=node.firstChild;c;c=c.nextSibling){
      if(c.nodeType===3){if(c.nodeValue.trim()){var tr=[];var w=document.createElement('span');w.append(c.cloneNode());runs(w,{},tr);pending.push(tr.join(''))}continue}
      if(c.nodeType!==1)continue;
      var tg=c.tagName;
      if(!BLOCK.test(tg)){var tr2=[];var w2=document.createElement('span');w2.append(c.cloneNode(true));runs(w2,{},tr2);pending.push(tr2.join(''));continue}
      flush();
      if(/^H[1-6]$/.test(tg)){var hr=[];runs(c,{},hr);out.push(para(hr.join(''),'<w:pStyle w:val="Heading'+tg[1]+'"/>'))}
      else if(tg==='UL'||tg==='OL')list(c,depth||0,out);
      else if(tg==='TABLE')table(c,out);
      else if(tg==='HR')out.push('<w:p/>');
      else if(tg==='PRE'){c.textContent.split('\n').forEach(function(ln){out.push(para(run(ln,{mono:1})))})}
      else if(tg==='BLOCKQUOTE'){var q=[];blocks(c,q,depth);q.forEach(function(x){out.push(x.replace('<w:p>','<w:p><w:pPr><w:ind w:left="567"/></w:pPr>'))})}
      else if(hasBlock(c))blocks(c,out,depth);
      else{var pr=[];runs(c,{},pr);out.push(para(pr.join('')))}
    }
    flush();
  }
  blocks(root,body,0);
  if(!body.length)body.push('<w:p/>');
  var NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"';
  var doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document '+NS+'><w:body>'+body.join('')+
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>';
  var hs=[32,28,24,22,20,20],styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'+
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>'+
    hs.map(function(sz,i){return '<w:style w:type="paragraph" w:styleId="Heading'+(i+1)+'"><w:name w:val="heading '+(i+1)+'"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="80"/><w:outlineLvl w:val="'+i+'"/></w:pPr><w:rPr><w:b/><w:sz w:val="'+sz+'"/><w:szCs w:val="'+sz+'"/></w:rPr></w:style>'}).join('')+
    '<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblCellMar><w:left w:w="108" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style></w:styles>';
  var lvl=function(fmt,text,i){return '<w:lvl w:ilvl="'+i+'"><w:start w:val="1"/><w:numFmt w:val="'+fmt+'"/><w:lvlText w:val="'+text+'"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="'+(720*(i+1))+'" w:hanging="360"/></w:pPr></w:lvl>'};
  var numbering='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'+
    '<w:abstractNum w:abstractNumId="0">'+lvl('bullet','•',0)+lvl('bullet','◦',1)+lvl('bullet','▪',2)+'</w:abstractNum>'+
    '<w:abstractNum w:abstractNumId="1">'+lvl('decimal','%1.',0)+lvl('lowerLetter','%2.',1)+lvl('lowerRoman','%3.',2)+'</w:abstractNum>'+
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>'+
    nums.map(function(id){return '<w:num w:numId="'+id+'"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>'}).join('')+
    '</w:numbering>';
  var zip=new JSZip();
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'+
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+
    '<Default Extension="png" ContentType="image/png"/><Default Extension="jpeg" ContentType="image/jpeg"/><Default Extension="gif" ContentType="image/gif"/>'+
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'+
    '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'+
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/></Types>');
  zip.file('_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
  zip.file('word/document.xml',doc);zip.file('word/styles.xml',styles);zip.file('word/numbering.xml',numbering);
  zip.file('word/_rels/document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+
    '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'+
    '<Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>'+rels.join('')+'</Relationships>');
  media.forEach(function(m){zip.file('word/media/'+m.name,m.data,{base64:true})});
  return zip.generateAsync({type:'blob',mimeType:MIME_OUT.docx});
}
function exportSheet(d){
  var e=ext(d.name),wb=d.wb;
  if(e==='csv'||e==='tsv'){
    var ws=wb.Sheets[wb.SheetNames[d.sheetIdx||0]];
    return new Blob([XLSX.utils.sheet_to_csv(ws,{FS:e==='tsv'?'\t':','})],{type:MIME_OUT[e]});
  }
  var bt={xlsx:'xlsx',xltx:'xlsx',xlsm:'xlsm',xls:'biff8',ods:'ods'}[e]||'xlsx';
  return new Blob([XLSX.write(wb,{bookType:bt,type:'array'})],{type:MIME_OUT[e]||MIME_OUT.xlsx});
}
async function exportDoc(d){
  if(d.kind==='pdf')return exportPdf(d);
  if(d.kind==='docx'){
    var root=d.editor;if(!root){root=document.createElement('div');root.innerHTML=d.html||''}
    return htmlToDocx(root);
  }
  if(d.kind==='sheet')return exportSheet(d);
  if(d.kind==='text')return new Blob([d.text||''],{type:(d.file.type&&d.file.type.indexOf('text/')===0?d.file.type:'text/plain')+(/charset/.test(d.file.type)?'':';charset=utf-8')});
  return d.file;
}
function wordName(name){return /\.docx$/i.test(name)?name:name.replace(/\.(dotx|docm)$/i,'')+'.docx'}
function downloadBlob(blob,name){
  var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(function(){URL.revokeObjectURL(u)},4000);
}
async function saveDoc(d,where){
  if(d.saving)return;
  d.saving=where;syncChrome();
  try{
    var editable=canEdit(d),blob=editable&&(d.dirty||where==='drive')?await exportDoc(d):d.file;
    var name=d.kind==='docx'&&blob!==d.file?wordName(d.name):d.name;
    if(where==='download'){downloadBlob(blob,name);toast('Downloaded “'+name+'”');return}
    if(!auth){expired();return}
    var headers={Authorization:'Bearer '+auth.token,'X-Deluxe-Mime':blob.type||'application/octet-stream'};
    var r;
    if(d.driveId)r=await fetch(DRIVE+'/api/docs/files/'+encodeURIComponent(d.driveId),{method:'PUT',headers:headers,body:blob});
    if(!d.driveId||r.status===404){
      headers['X-Deluxe-Name']=encodeURIComponent(name);
      r=await fetch(DRIVE+'/api/docs/files',{method:'POST',headers:headers,body:blob});
    }
    if(r.status===401){expired();return}
    var j={};try{j=await r.json()}catch(e){}
    if(!r.ok)throw new Error(j.error||'Saving failed ('+r.status+'). Try again.');
    var wasNew=!d.driveId;
    d.driveId=j.node.id;d.name=j.node.name;d.size=blob.size;d.dirty=false;
    d.file=new File([blob],d.name,{type:blob.type});
    driveNodes=null;
    if(d.kind==='pdf'){d.pdf=null;d.order=null;d.ann={};d.acts=[];d.tc={};d.find=null;if(d===cur)await activate(d)}
    toast(wasNew?'Saved to My Drive as “'+d.name+'”':'Saved to Deluxe Drive');
  }catch(e){
    toast(e.message||'Saving failed. Try again.');
  }finally{
    d.saving=false;renderTabs();if(d===cur){setStatus(d);syncChrome()}
  }
}
$('#saveBtn').onclick=function(){if(cur)saveDoc(cur,'drive')};
$('#dlBtn').onclick=function(){if(cur)saveDoc(cur,'download')};
window.addEventListener('beforeunload',function(e){if(docs.some(function(d){return d.dirty})){e.preventDefault();e.returnValue=''}});

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
  if(d.text==null){
    var raw=await d.file.text();
    if(ext(d.name)==='json'){try{raw=JSON.stringify(JSON.parse(raw),null,2)}catch(e){}}
    d.cut=raw.length>400000;d.text=d.cut?raw.slice(0,400000):raw;
  }
  var ta=document.createElement('textarea');ta.className='code edit';ta.value=d.text;ta.spellcheck=false;ta.wrap='off';ta.setAttribute('aria-label','File text');
  if(d.cut)ta.readOnly=true;
  else ta.addEventListener('input',function(){d.text=ta.value;markDirty(d)});
  stage.replaceChildren(ta);
  var nl=d.text.split('\n').length;d.extras=[nl+(nl===1?' line':' lines')];setStatus(d);
  if(d.cut)stage.append(el('div','note','This file is too long to change here. Showing the first 400,000 characters.'));
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
async function openUrl(raw,hint,driveId){
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
    await addDoc(new File([blob],name,{type:blob.type}),name,false,driveId);
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
  s.append(el('span','dot'+(auth?' ok':'')),el('span',null,auth?'Connected as '+(auth.name||'your account'):'Not connected'));
}
async function loadDrive(force){
  if(!auth)return;
  if(driveNodes&&!force){renderDrive();return}
  var list=dListEl;if(!driveNodes)list.replaceChildren(el('div','note','Loading your files...'));
  try{
    var r=await fetch(DRIVE+'/api/db/nodes',{headers:{Authorization:'Bearer '+auth.token}});
    if(r.status===401){expired();return}
    if(!r.ok)throw new Error('HTTP '+r.status);
    var j=await r.json();
    driveNodes=(j.nodes||[]).filter(function(n){return n&&!n.trashed});
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
  openUrl(DRIVE+'/api/db/blobs/'+encodeURIComponent(n.id),n.name,n.id);
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
  var pendId=ss('dd_pending_id')||qp.get('id')||null;ss('dd_pending_id',null);
  if(qp.get('url'))history.replaceState(null,'',location.pathname);
  qp=new URLSearchParams('');
  if(pend){await openUrl(pend,pendName,pendId);return}
  showHome();
}
async function boot(){
  $('#driveLink').href=DRIVE;
  // Deluxe Drive's "Open Deluxe Docs" button sends the link id along, so
  // nothing has to be copied or typed.
  // It comes after # so it is never sent to any server, and it is removed
  // from the address bar straight away.
  var hm=/(?:^#|&)link=([^&]+)/.exec(location.hash||'');
  var sent=hm?decodeURIComponent(hm[1]):qp.get('link');
  if(sent){
    var rest=new URLSearchParams(location.search);rest.delete('link');
    history.replaceState(null,'',location.pathname+(rest.toString()?'?'+rest.toString():''));
    if(qp.get('url')){ss('dd_pending',qp.get('url'));if(qp.get('name'))ss('dd_pending_name',qp.get('name'));if(qp.get('id'))ss('dd_pending_id',qp.get('id'))}
    qp=new URLSearchParams('');
    showGate();
    $('#linkIn').value=sent;
    await submitLink();
    return;
  }
  auth=loadAuth();
  if(!auth){
    // A file sent from Deluxe Drive waits until this browser is connected.
    if(qp.get('url')){ss('dd_pending',qp.get('url'));if(qp.get('name'))ss('dd_pending_name',qp.get('name'));if(qp.get('id'))ss('dd_pending_id',qp.get('id'))}
    showGate();return;
  }
  enterApp();
  // Check the key is still good; a network hiccup is not a reason to sign out.
  try{
    var r=await fetch(DRIVE+'/api/auth/me',{headers:{Authorization:'Bearer '+auth.token}});
    if(r.status===401)expired();
    else if(r.ok){var j=await r.json();if(j.user&&j.user.name&&j.user.name!==auth.name){auth.name=j.user.name;saveAuth(auth);renderAcct();driveState()}}
  }catch(e){}
}
boot();
})();
