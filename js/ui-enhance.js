/* UI-only enhancements. Does not alter app logic or storage. */
(function(){
  const $=s=>document.querySelector(s);
  // Login: mark inputs invalid when error is visible
  const err=$("#loginError");
  if(err){
    const sync=()=>["#email","#password"].forEach(s=>{const i=$(s);if(i){i.setAttribute("aria-invalid",String(!err.hidden));if(!err.hidden)i.setAttribute("aria-describedby","loginError");}});
    new MutationObserver(sync).observe(err,{attributes:true,attributeFilter:["hidden"]});
  }
  const back=$("#backToAdmin");
  if(back&&typeof getCurrentUser==="function"){const u=getCurrentUser();if(u&&u.role==="admin")back.hidden=false;}
  const sidebar=$("#sidebar");
  if(!sidebar)return;
  // Shared dark theme (saved by employee portal) also applies in admin
  try{if(localStorage.getItem("iccs_theme")==="dark")document.body.classList.add("dark");}catch(e){}
  // aria-current on active nav item
  const items=()=>sidebar.querySelectorAll("[data-page]");
  const syncNav=()=>items().forEach(b=>{b.classList.contains("active")?b.setAttribute("aria-current","page"):b.removeAttribute("aria-current");});
  items().forEach(b=>new MutationObserver(syncNav).observe(b,{attributes:true,attributeFilter:["class"]}));
  syncNav();
  // Mobile drawer: scrim, aria-expanded, Escape
  const menu=$("#menuBtn"),scrim=document.createElement("div");
  scrim.className="scrim";document.body.append(scrim);
  const syncDrawer=()=>{const o=sidebar.classList.contains("open");document.body.classList.toggle("nav-open",o);if(menu){menu.setAttribute("aria-expanded",String(o));menu.setAttribute("aria-controls","sidebar");}};
  new MutationObserver(syncDrawer).observe(sidebar,{attributes:true,attributeFilter:["class"]});
  scrim.addEventListener("click",()=>sidebar.classList.remove("open"));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&sidebar.classList.contains("open")){sidebar.classList.remove("open");menu&&menu.focus();}});
  syncDrawer();
  // Toast announced to screen readers
  const toast=$("#toast");if(toast){toast.setAttribute("role","status");toast.setAttribute("aria-live","polite");}
  // Chat: accessible label + copy-answer button
  const input=$("#chatInput");if(input&&!input.getAttribute("aria-label"))input.setAttribute("aria-label","Ask a question");
  const box=$("#chatMessages");
  if(box){
    const addCopy=()=>box.querySelectorAll(".message.assistant:not([data-copy])").forEach(m=>{
      m.setAttribute("data-copy","1");
      if(m.textContent.startsWith("Welcome to ICCS"))return;
      const b=document.createElement("button");b.type="button";b.className="copy-btn";b.textContent="Copy answer";
      b.addEventListener("click",async()=>{
        const c=m.cloneNode(true);c.querySelectorAll("button").forEach(x=>x.remove());
        try{await navigator.clipboard.writeText(c.innerText.trim());b.textContent="Copied ✓";}catch(e){b.textContent="Copy failed";}
        setTimeout(()=>b.textContent="Copy answer",1500);
      });
      m.append(b);
    });
    new MutationObserver(addCopy).observe(box,{childList:true});
    addCopy();
  }
})();
