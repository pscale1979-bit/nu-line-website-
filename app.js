let pages=[];
let current=0;
let opened=false;
let touchStartX=0;
let touchStartY=0;
let changing=false;

const $=id=>document.getElementById(id);
const landing=$("landing"),reader=$("reader"),image=$("pageImage");
const contents=$("contents"),scrim=$("scrim"),thumbGrid=$("thumbGrid");

async function boot(){
  pages=await fetch("pages.json",{cache:"no-store"}).then(r=>r.json());
  buildContents();
  const hash=location.hash.replace("#page-","");
  const requested=pages.findIndex(p=>String(p.number).toLowerCase()===hash.toLowerCase());
  if(requested>=0){openReader(requested,false)}
  else render(0,false);
  preload(0);
}

function buildContents(){
  thumbGrid.innerHTML=pages.map((p,i)=>`
    <button class="thumb ${p.portrait?"portrait":""}" data-index="${i}" type="button">
      <img src="${p.src}" loading="lazy" alt="">
      <span class="thumb-copy"><strong>${p.number}</strong><span>${escapeHTML(p.title)}</span></span>
    </button>`).join("");
  thumbGrid.addEventListener("click",e=>{
    const button=e.target.closest("[data-index]");
    if(!button)return;
    closeContents();
    openReader(Number(button.dataset.index),false);
  });
}

function openReader(index=0,animate=true){
  opened=true;
  landing.hidden=true;
  reader.hidden=false;
  document.body.classList.add("reading");
  render(index,animate);
}

function render(index,animate=true,direction="next"){
  index=Math.max(0,Math.min(pages.length-1,index));
  if(changing)return;
  const p=pages[index];
  current=index;
  if(animate){
    changing=true;
    image.classList.remove("turn-next","turn-prev");
    void image.offsetWidth;
    image.classList.add(direction==="prev"?"turn-prev":"turn-next");
    setTimeout(()=>{image.classList.remove("turn-next","turn-prev");changing=false},500);
  }
  image.src=p.src;
  image.alt=`NÜ-LINE Edition I — ${p.title}`;
  $("pageNumber").textContent=p.number==="cover"?"Cover":`Page ${p.number}`;
  $("pageTitle").textContent=p.title;
  $("progressBar").style.width=`${((index+1)/pages.length)*100}%`;
  $("prevBtn").disabled=index===0;
  $("prevSmall").disabled=index===0;
  $("nextBtn").disabled=index===pages.length-1;
  $("nextSmall").disabled=index===pages.length-1;
  document.querySelectorAll(".thumb").forEach((t,i)=>t.classList.toggle("active",i===index));
  history.replaceState(null,"",p.number==="cover"?"#cover":`#page-${p.number}`);
  preload(index);
}

function next(){if(current<pages.length-1)render(current+1,true,"next")}
function prev(){if(current>0)render(current-1,true,"prev")}
function preload(index){
  [index+1,index-1,index+2].filter(i=>pages[i]).forEach(i=>{const x=new Image();x.src=pages[i].src});
}
function openContents(){
  contents.classList.add("open");
  contents.setAttribute("aria-hidden","false");
  scrim.hidden=false;
}
function closeContents(){
  contents.classList.remove("open");
  contents.setAttribute("aria-hidden","true");
  scrim.hidden=true;
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}

$("openBook").onclick=()=>openReader(1,false);
$("prevBtn").onclick=$("prevSmall").onclick=prev;
$("nextBtn").onclick=$("nextSmall").onclick=next;
$("contentsBtn").onclick=openContents;
$("closeContents").onclick=closeContents;
scrim.onclick=closeContents;

document.addEventListener("keydown",e=>{
  if(e.key==="ArrowRight"||e.key==="PageDown"||e.key===" "){if(opened){e.preventDefault();next()}}
  if(e.key==="ArrowLeft"||e.key==="PageUp"){if(opened){e.preventDefault();prev()}}
  if(e.key==="Escape")closeContents();
  if((e.key==="c"||e.key==="C")&&opened)openContents();
});

$("book").addEventListener("touchstart",e=>{
  const t=e.changedTouches[0];touchStartX=t.screenX;touchStartY=t.screenY;
},{passive:true});
$("book").addEventListener("touchend",e=>{
  const t=e.changedTouches[0];
  const dx=t.screenX-touchStartX,dy=t.screenY-touchStartY;
  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3){dx<0?next():prev()}
},{passive:true});

window.addEventListener("hashchange",()=>{
  const h=location.hash.replace("#page-","");
  if(location.hash==="#cover"){if(opened)render(0,false);return}
  const i=pages.findIndex(p=>String(p.number).toLowerCase()===h.toLowerCase());
  if(i>=0)openReader(i,false);
});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
boot().catch(err=>{console.error(err);document.body.innerHTML="<p style='padding:40px;color:white'>The digital book could not load. Please refresh the page.</p>"});
