let pages=[];
let current=0;
let opened=false;
let changing=false;

let scale=1;
let translateX=0;
let translateY=0;
let startX=0;
let startY=0;
let dragStartX=0;
let dragStartY=0;
let dragging=false;
let pinchStartDistance=0;
let pinchStartScale=1;
let lastTap=0;

const $=id=>document.getElementById(id);
const landing=$("landing");
const reader=$("reader");
const image=$("pageImage");
const book=$("book");
const contents=$("contents");
const scrim=$("scrim");
const thumbGrid=$("thumbGrid");

async function boot(){
  const response=await fetch("pages.json",{cache:"no-store"});
  if(!response.ok)throw new Error(`pages.json failed: ${response.status}`);
  pages=await response.json();

  buildContents();

  if(location.hash==="#cover"||!location.hash){
    showLanding();
  }else{
    const hash=location.hash.replace("#page-","");
    const requested=pages.findIndex(p=>String(p.number).toLowerCase()===hash.toLowerCase());
    if(requested>=0)openReader(requested,false);
    else showLanding();
  }

  preload(0);
}

function buildContents(){
  thumbGrid.innerHTML=pages.map((p,i)=>`
    <button class="thumb ${p.portrait?"portrait":""}" data-index="${i}" type="button">
      <img src="${p.src}" loading="lazy" alt="">
      <span class="thumb-copy">
        <strong>${p.number==="cover"?"Cover":p.number}</strong>
        <span>${escapeHTML(p.title)}</span>
      </span>
    </button>
  `).join("");

  thumbGrid.addEventListener("click",event=>{
    const button=event.target.closest("[data-index]");
    if(!button)return;
    closeContents();
    openReader(Number(button.dataset.index),false);
  });
}

function showLanding(){
  opened=false;
  resetZoom();
  landing.hidden=false;
  reader.hidden=true;
  document.body.classList.remove("reading","fullscreen");
  history.replaceState(null,"","#cover");
}

function openReader(index=1,animate=true){
  opened=true;
  landing.hidden=true;
  reader.hidden=false;
  document.body.classList.add("reading");
  render(index,animate);
}

function render(index,animate=true,direction="next"){
  index=Math.max(0,Math.min(pages.length-1,index));
  if(changing)return;

  resetZoom();

  const page=pages[index];
  current=index;

  if(animate){
    changing=true;
    image.classList.remove("turn-next","turn-prev");
    void image.offsetWidth;
    image.classList.add(direction==="prev"?"turn-prev":"turn-next");
    window.setTimeout(()=>{
      image.classList.remove("turn-next","turn-prev");
      changing=false;
    },360);
  }

  image.src=page.src;
  image.alt=`NÜ-LINE Edition I — ${page.title}`;
  $("pageNumber").textContent=page.number==="cover"?"Cover":`Page ${page.number}`;
  $("pageTitle").textContent=page.title;
  $("progressBar").style.width=`${((index+1)/pages.length)*100}%`;

  $("prevBtn").disabled=index===0;
  $("prevSmall").disabled=index===0;
  $("nextBtn").disabled=index===pages.length-1;
  $("nextSmall").disabled=index===pages.length-1;

  document.querySelectorAll(".thumb").forEach((thumb,i)=>{
    thumb.classList.toggle("active",i===index);
  });

  history.replaceState(null,"",page.number==="cover"?"#cover":`#page-${page.number}`);
  preload(index);
}

function next(){
  if(scale>1)return;
  if(current<pages.length-1)render(current+1,true,"next");
}

function prev(){
  if(scale>1)return;
  if(current>0)render(current-1,true,"prev");
}

function preload(index){
  [index+1,index-1,index+2].filter(i=>pages[i]).forEach(i=>{
    const preloadImage=new Image();
    preloadImage.src=pages[i].src;
  });
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

function escapeHTML(value){
  return String(value).replace(/[&<>"']/g,char=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[char]));
}

function clamp(value,min,max){
  return Math.min(max,Math.max(min,value));
}

function applyTransform(){
  image.style.transform=`translate3d(${translateX}px,${translateY}px,0) scale(${scale})`;
  book.classList.toggle("zoomed",scale>1);
}

function setZoom(nextScale,focusX=book.clientWidth/2,focusY=book.clientHeight/2){
  const oldScale=scale;
  scale=clamp(nextScale,1,4);

  if(scale===1){
    translateX=0;
    translateY=0;
  }else{
    const ratio=scale/oldScale;
    const cx=focusX-book.clientWidth/2;
    const cy=focusY-book.clientHeight/2;
    translateX=(translateX-cx)*ratio+cx;
    translateY=(translateY-cy)*ratio+cy;
  }

  applyTransform();
}

function resetZoom(){
  scale=1;
  translateX=0;
  translateY=0;
  applyTransform();
}

function distance(touches){
  const dx=touches[0].clientX-touches[1].clientX;
  const dy=touches[0].clientY-touches[1].clientY;
  return Math.hypot(dx,dy);
}

$("openBook").onclick=()=>openReader(1,false);
$("prevBtn").onclick=$("prevSmall").onclick=prev;
$("nextBtn").onclick=$("nextSmall").onclick=next;
$("contentsBtn").onclick=openContents;
$("closeContents").onclick=closeContents;
$("zoomInBtn").onclick=()=>setZoom(scale+.5);
$("zoomOutBtn").onclick=()=>setZoom(scale-.5);
scrim.onclick=closeContents;

$("fullscreenBtn").onclick=async()=>{
  try{
    if(!document.fullscreenElement){
      await document.documentElement.requestFullscreen?.();
      document.body.classList.add("fullscreen");
      $("fullscreenBtn").textContent="Exit full screen";
    }else{
      await document.exitFullscreen?.();
    }
  }catch{
    document.body.classList.toggle("fullscreen");
  }
};

document.addEventListener("fullscreenchange",()=>{
  const active=Boolean(document.fullscreenElement);
  document.body.classList.toggle("fullscreen",active);
  $("fullscreenBtn").textContent=active?"Exit full screen":"Full screen";
});

document.addEventListener("keydown",event=>{
  if(event.key==="ArrowRight"||event.key==="PageDown"||event.key===" "){
    if(opened&&scale===1){event.preventDefault();next();}
  }
  if(event.key==="ArrowLeft"||event.key==="PageUp"){
    if(opened&&scale===1){event.preventDefault();prev();}
  }
  if(event.key==="Escape")closeContents();
  if((event.key==="c"||event.key==="C")&&opened)openContents();
  if((event.key==="+"||event.key==="=")&&opened)setZoom(scale+.5);
  if(event.key==="-"&&opened)setZoom(scale-.5);
  if(event.key==="0"&&opened)resetZoom();
});

book.addEventListener("dblclick",event=>{
  const rect=book.getBoundingClientRect();
  if(scale>1)resetZoom();
  else setZoom(2,event.clientX-rect.left,event.clientY-rect.top);
});

book.addEventListener("pointerdown",event=>{
  if(event.pointerType==="touch")return;

  startX=event.clientX;
  startY=event.clientY;

  if(scale>1){
    dragging=true;
    dragStartX=translateX;
    dragStartY=translateY;
    book.classList.add("dragging");
    book.setPointerCapture?.(event.pointerId);
  }
});

book.addEventListener("pointermove",event=>{
  if(!dragging)return;
  translateX=dragStartX+(event.clientX-startX);
  translateY=dragStartY+(event.clientY-startY);
  applyTransform();
});

book.addEventListener("pointerup",event=>{
  if(dragging){
    dragging=false;
    book.classList.remove("dragging");
    return;
  }

  if(scale===1){
    const dx=event.clientX-startX;
    if(Math.abs(dx)>60)dx<0?next():prev();
  }
});

book.addEventListener("touchstart",event=>{
  if(event.touches.length===2){
    pinchStartDistance=distance(event.touches);
    pinchStartScale=scale;
    return;
  }

  if(event.touches.length===1){
    const touch=event.touches[0];
    startX=touch.clientX;
    startY=touch.clientY;
    dragStartX=translateX;
    dragStartY=translateY;

    const now=Date.now();
    if(now-lastTap<280){
      const rect=book.getBoundingClientRect();
      if(scale>1)resetZoom();
      else setZoom(2,touch.clientX-rect.left,touch.clientY-rect.top);
      lastTap=0;
    }else{
      lastTap=now;
    }
  }
},{passive:false});

book.addEventListener("touchmove",event=>{
  if(event.touches.length===2){
    event.preventDefault();
    const newScale=pinchStartScale*(distance(event.touches)/pinchStartDistance);
    setZoom(newScale);
    return;
  }

  if(event.touches.length===1&&scale>1){
    event.preventDefault();
    const touch=event.touches[0];
    translateX=dragStartX+(touch.clientX-startX);
    translateY=dragStartY+(touch.clientY-startY);
    applyTransform();
  }
},{passive:false});

book.addEventListener("touchend",event=>{
  if(event.changedTouches.length!==1||scale>1)return;

  const touch=event.changedTouches[0];
  const dx=touch.clientX-startX;
  const dy=touch.clientY-startY;

  if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.25){
    dx<0?next():prev();
  }
},{passive:true});

window.addEventListener("hashchange",()=>{
  if(location.hash==="#cover"){
    showLanding();
    return;
  }

  const hash=location.hash.replace("#page-","");
  const index=pages.findIndex(page=>String(page.number).toLowerCase()===hash.toLowerCase());

  if(index>=0)openReader(index,false);
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("service-worker.js?v=3.0.0");
  });
}

boot().catch(error=>{
  console.error(error);
  document.body.innerHTML="<p style='padding:40px;color:white'>The digital book could not load. Please refresh the page.</p>";
});
