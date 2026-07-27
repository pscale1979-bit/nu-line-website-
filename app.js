let pages=[];
let current=0;
let opened=false;
let touchStartX=0;
let touchStartY=0;
let changing=false;
const ASSET_VERSION="3.1.0";
const assetUrl=src=>`${src}${src.includes("?")?"&":"?"}v=${ASSET_VERSION}`;

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
      <img src="${assetUrl(p.src)}" loading="lazy" decoding="async" alt="">
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
  const nextSrc=assetUrl(p.src);
  if(animate){
    changing=true;
    image.classList.remove("turn-next","turn-prev");
  }
  image.src=nextSrc;
  image.alt=`NÜ-LINE Edition I — ${p.title}`;
  const finishRender=()=>{
    if(!animate){changing=false;return}
    void image.offsetWidth;
    image.classList.add(direction==="prev"?"turn-prev":"turn-next");
    setTimeout(()=>{image.classList.remove("turn-next","turn-prev");changing=false},260);
  };
  if(image.decode){image.decode().then(finishRender).catch(finishRender)}else{image.onload=finishRender;}
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
  [index+1,index-1,index+2].filter(i=>pages[i]).forEach(i=>{const x=new Image();x.src=assetUrl(pages[i].src)});
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

$("openBook").onclick=()=>openReader(0,false);
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
  if(location.hash==="#contact"){openContact();return}
  const h=location.hash.replace("#page-","");
  if(location.hash==="#cover"){if(opened)render(0,false);return}
  const i=pages.findIndex(p=>String(p.number).toLowerCase()===h.toLowerCase());
  if(i>=0)openReader(i,false);
});

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("service-worker.js"));
boot().catch(err=>{console.error(err);document.body.innerHTML="<p style='padding:40px;color:white'>The digital book could not load. Please refresh the page.</p>"});


// Version 3 — secure website enquiry connection
const contactPanel=$("contactPanel");
const enquiryForm=$("enquiryForm");
const formStatus=$("formStatus");
const enquirySuccess=$("enquirySuccess");
let websiteSupabase=null;

function initWebsiteSupabase(){
  const cfg=window.NULINE_WEBSITE_CONFIG||{};
  if(window.supabase&&cfg.supabaseUrl&&cfg.supabaseAnonKey){
    websiteSupabase=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  }
}
function openContact(){
  contactPanel.classList.add("open");
  contactPanel.setAttribute("aria-hidden","false");
  document.body.classList.add("contact-open");
  history.replaceState(null,"","#contact");
  setTimeout(()=>contactPanel.querySelector("input,select,textarea")?.focus(),250);
}
function closeContact(){
  contactPanel.classList.remove("open");
  contactPanel.setAttribute("aria-hidden","true");
  document.body.classList.remove("contact-open");
  if(location.hash==="#contact")history.replaceState(null,"",opened?(pages[current]?.number==="cover"?"#cover":`#page-${pages[current]?.number}`):"#cover");
}
function createReference(){
  const d=new Date();
  const stamp=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
  const code=Math.random().toString(36).slice(2,7).toUpperCase();
  return `WEB-${stamp}-${code}`;
}
function normaliseText(value){return String(value||"").trim()}

$("contactBtn").onclick=openContact;
$("beginProjectBtn").onclick=openContact;
$("closeContact").onclick=closeContact;
$("closeSuccess").onclick=()=>{closeContact();enquirySuccess.hidden=true;enquiryForm.hidden=false};
contactPanel.addEventListener("click",e=>{if(e.target===contactPanel)closeContact()});

enquiryForm.addEventListener("submit",async e=>{
  e.preventDefault();
  formStatus.textContent="";
  if(!enquiryForm.reportValidity())return;
  const fd=new FormData(enquiryForm);
  if(normaliseText(fd.get("website")))return;
  if(!websiteSupabase){
    formStatus.textContent="The secure enquiry connection is not configured yet. Please email paul@nu-lineglazing.co.uk.";
    return;
  }
  const submit=$("submitEnquiry");
  submit.disabled=true;
  submit.querySelector("span").textContent="Sending securely…";
  const reference=createReference();
  const payload={
    reference,
    status:"new",
    source:"website",
    name:normaliseText(fd.get("name")),
    company:normaliseText(fd.get("company")),
    email:normaliseText(fd.get("email")).toLowerCase(),
    phone:normaliseText(fd.get("phone")),
    project_location:normaliseText(fd.get("project_location")),
    project_type:normaliseText(fd.get("project_type")),
    budget:normaliseText(fd.get("budget")),
    timescale:normaliseText(fd.get("timescale")),
    systems:fd.getAll("systems"),
    project_details:normaliseText(fd.get("project_details")),
    consent:true,
    page_url:location.href.split("#")[0],
    user_agent:navigator.userAgent.slice(0,500)
  };
  try{
    const {error}=await websiteSupabase.from("website_enquiries").insert(payload);
    if(error)throw error;
    enquiryForm.reset();
    enquiryForm.hidden=true;
    enquirySuccess.hidden=false;
    $("enquiryReference").textContent=reference;
  }catch(err){
    console.error(err);
    formStatus.textContent="We could not send the enquiry. Please try again or email paul@nu-lineglazing.co.uk.";
  }finally{
    submit.disabled=false;
    submit.querySelector("span").textContent="Send project enquiry";
  }
});

initWebsiteSupabase();
if(location.hash==="#contact")setTimeout(openContact,200);
