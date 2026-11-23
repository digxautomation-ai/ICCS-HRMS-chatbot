
const user = getCurrentUser();
const prefix = `iccs_${user?.id || "demo"}_`;

const knowledge = [];// Universal knowledge is managed through the Admin portal.

const storage = {
  read(key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem(prefix + key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    localStorage.setItem(prefix + key, JSON.stringify(value));
  }
};

let conversations = storage.read("conversations");
let activeChatId = null;

function makeId() {
  return crypto.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2500);
}

function navigate(pageId) {
  document.querySelectorAll(".page").forEach(page =>
    page.classList.toggle("active", page.id === pageId)
  );
  document.querySelectorAll(".nav-item").forEach(btn =>
    btn.classList.toggle("active", btn.dataset.page === pageId)
  );
  document.getElementById("sidebar").classList.remove("open");
  if (pageId === "history") renderHistory();
}

function createChat() {
  const chat = {
    id: makeId(),
    title: "New conversation",
    createdAt: new Date().toISOString(),
    messages: []
  };
  conversations.unshift(chat);
  activeChatId = chat.id;
  saveChats();
  renderChats();
  navigate("chat");
}

function saveChats() {
  storage.write("conversations", conversations);
}

function getActiveChat() {
  return conversations.find(chat => chat.id === activeChatId);
}


function findAnswer(question) {
  const result = KNOWLEDGE_ENGINE.answer(question);
  const events = ICCS_DATA.get("searchEvents", []);
  events.unshift({id:makeId(),question,matched:!!result.source,source:result.source,date:new Date().toISOString()});
  ICCS_DATA.set("searchEvents",events.slice(0,500));
  return result;
}

function sendMessage(question) {
  if (!question.trim()) return;
  if (!getActiveChat()) createChat();

  const chat = getActiveChat();
  if (chat.messages.length === 0) chat.title = question.slice(0, 45);

  chat.messages.push({ role: "user", text: question });
  const result = findAnswer(question);
  chat.messages.push({
    role: "assistant",
    text: result.text,
    source: result.source
  });

  saveChats();
  renderChats();
}

function renderChats() {
  const list = document.getElementById("conversationList");
  list.replaceChildren();

  conversations.forEach(chat => {
    const btn = document.createElement("button");
    btn.className = "conversation-btn";
    btn.textContent = chat.title;
    btn.addEventListener("click", () => {
      activeChatId = chat.id;
      renderChats();
      navigate("chat");
    });
    list.append(btn);
  });

  const messages = document.getElementById("chatMessages");
  messages.replaceChildren();

  const chat = getActiveChat();
  if (!chat || chat.messages.length === 0) {
    const welcome = document.createElement("div");
    welcome.className = "message assistant";
    welcome.textContent = "Welcome to ICCS Knowledge AI. Ask a question about any knowledge your administrator has added. Answers use local search and cite available sources.";
    messages.append(welcome);
    return;
  }

  chat.messages.forEach(message => {
    const bubble = document.createElement("div");
    bubble.className = `message ${message.role}`;
    bubble.textContent = message.text;

    if (message.source) {
      const source = document.createElement("small");
      source.textContent = `Source: ${message.source}`;
      bubble.append(source);
    }
    messages.append(bubble);
  });
  messages.scrollTop = messages.scrollHeight;
}

function renderKnowledge(query = "") {
  const grid=document.getElementById("articleGrid");grid.replaceChildren();
  const articles=ICCS_DATA.get("articles",[]).filter(a=>a.status==="Indexed");
  const sources=ICCS_DATA.get("sources",[]);
  const items=[...articles.map(a=>({title:a.title,category:a.category,answer:a.description,source:`Article ${a.id}`})),...sources.map(d=>({title:d.title,category:d.category,answer:d.text.slice(0,400)+(d.text.length>400?"…":""),source:d.name||d.title}))].filter(a=>`${a.title} ${a.category} ${a.answer}`.toLowerCase().includes(query.toLowerCase()));
  if(!items.length)grid.textContent="No matching knowledge found. Ask your administrator to add a source.";
  items.forEach(article=>{const card=document.createElement("article");card.className="article-card";const cat=document.createElement("span");cat.textContent=article.category;const title=document.createElement("h3");title.textContent=article.title;const desc=document.createElement("p");desc.textContent=article.answer;card.append(cat,title,desc);grid.append(card);});
  const faq=document.getElementById("suggestedQuestions");if(!faq)return;faq.replaceChildren();
  const events=ICCS_DATA.get("searchEvents",[]);const counts={};events.forEach(e=>counts[e.question]=(counts[e.question]||0)+1);
  const questions=ICCS_DATA.get("questions",[]).filter(q=>q.status==="Active").sort((a,b)=>(counts[b.question]||0)-(counts[a.question]||0));
  if(!questions.length)faq.textContent="No approved questions yet.";
  questions.slice(0,12).forEach(q=>{const btn=document.createElement("button");btn.className="conversation-btn";btn.textContent=q.question+(counts[q.question]?` · Asked ${counts[q.question]} times`:"");btn.addEventListener("click",()=>{navigate("chat");sendMessage(q.question);});faq.append(btn);});
}

function renderRecords(key, containerId, formatter) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  const records = storage.read(key);

  if (!records.length) {
    container.textContent = "No records yet.";
    return;
  }

  records.forEach(record => {
    const div = document.createElement("div");
    div.className = "record";
    div.textContent = formatter(record);
    container.append(div);
  });
}


function renderDashboardStats() {
  const cc=document.getElementById("userChatCount");
  if(cc)cc.textContent=conversations.length;
  const fc=document.getElementById("userFaqCount");
  if(fc)fc.textContent=ICCS_DATA.get("questions",[]).filter(q=>q.status==="Active").length;
}
  

function renderHistory() {
  const container = document.getElementById("historyList");
  container.replaceChildren();

  if (!conversations.length) {
    container.textContent = "No conversations yet.";
    return;
  }

  conversations.forEach(chat => {
    const btn = document.createElement("button");
    btn.className = "conversation-btn";
    btn.textContent = `${chat.title} — ${chat.messages.length} messages`;
    btn.addEventListener("click", () => {
      activeChatId = chat.id;
      renderChats();
      navigate("chat");
    });
    container.append(btn);
  });
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

document.querySelectorAll("[data-page]").forEach(btn =>
  btn.addEventListener("click", () => navigate(btn.dataset.page))
);

document.querySelectorAll("[data-go]").forEach(btn =>
  btn.addEventListener("click", () => navigate(btn.dataset.go))
);

document.querySelectorAll("[data-question]").forEach(btn =>
  btn.addEventListener("click", () => {
    navigate("chat");
    sendMessage(btn.dataset.question);
  })
);

document.getElementById("newChatBtn").addEventListener("click", createChat);

document.getElementById("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  const input = document.getElementById("chatInput");
  sendMessage(input.value);
  input.value = "";
});

document.getElementById("knowledgeSearch").addEventListener("input", event =>
  renderKnowledge(event.target.value)
);


  


document.getElementById("themeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("iccs_theme",
    document.body.classList.contains("dark") ? "dark" : "light");
});

document.getElementById("menuBtn").addEventListener("click", () =>
  document.getElementById("sidebar").classList.toggle("open")
);

document.getElementById("logoutBtn").addEventListener("click", logout);

document.getElementById("employeeName").textContent =
  user?.name?.split(" ")[0] || "Employee";
document.getElementById("avatar").textContent =
  user?.name?.charAt(0)?.toUpperCase() || "E";

document.getElementById("profileDetails").textContent =
  `Name: ${user?.name || "Demo Employee"} | Email: ${user?.email || ""} | Role: Employee`;


if (localStorage.getItem("iccs_theme") === "dark") {
  document.body.classList.add("dark");
}

renderKnowledge();
renderDashboardStats();
window.addEventListener("storage",event=>{if(event.key?.startsWith("iccs_shared_")){renderKnowledge(document.getElementById("knowledgeSearch").value);renderDashboardStats();}});

if (conversations.length) {
  activeChatId = conversations[0].id;
} else {
  createChat();
  navigate("chat");
}
renderChats();


// ===== Universal knowledge enhancements (browser-only prototypes) =====
const getAllKnowledge=()=>[
 ...ICCS_DATA.get("sources",[]).filter(s=>s.status==="Indexed").map(s=>({...s,kind:"source"})),
 ...ICCS_DATA.get("articles",[]).filter(s=>s.status==="Indexed").map(s=>({...s,text:s.description||"",name:s.title,kind:"article"}))
];
function selectedKnowledge(){
 const category=document.getElementById("filterCategory")?.value||"";
 const author=(document.getElementById("filterAuthor")?.value||"").toLowerCase();
 const date="";
 const source=document.getElementById("selectedSource")?.value||"";
 return getAllKnowledge().filter(s=>(!category||s.category===category)&&(!author||String(s.author||"").toLowerCase().includes(author))&&(!date||String(s.date||"")>=date)&&(!source||String(s.id)===source));
}
function refreshKnowledgeFilters(){
 const docs=getAllKnowledge();
 const category=document.getElementById("filterCategory"), source=document.getElementById("selectedSource");
 const update=(select,options)=>{const old=select.value;select.replaceChildren();options.forEach(([value,label])=>{const o=document.createElement("option");o.value=value;o.textContent=label;select.append(o);});select.value=old;if(select.selectedIndex<0)select.value="";};
 update(category,[["","All categories"],...[...new Set(docs.map(s=>s.category).filter(Boolean))].map(c=>[c,c])]);
 update(source,[["","All sources"],...docs.map(s=>[String(s.id),s.title])]);
 document.getElementById("userSourceCount").textContent=docs.length;
}
function showKnowledgeTool(title,lines){
 const box=document.getElementById("knowledgeToolResult");box.replaceChildren();
 const h=document.createElement("h3");h.textContent=title;box.append(h);
 if(!lines.length){box.append(document.createTextNode("No readable knowledge matches the selected filters."));return;}
 lines.forEach(line=>{const p=document.createElement("p");p.textContent=line;box.append(p);});
}
function getSentences(text){return String(text||"").replace(/\s+/g," ").match(/[^.!?]+[.!?]?/g)?.map(s=>s.trim()).filter(s=>s.length>35)||[];}
function summaryExtract(text){
 const sentences=getSentences(text);if(!sentences.length)return [String(text||"").slice(0,350)].filter(Boolean);
 const frequency={};KNOWLEDGE_ENGINE.tokenize(text).forEach(w=>frequency[w]=(frequency[w]||0)+1);
 return sentences.map((s,i)=>({s,i,score:[...new Set(KNOWLEDGE_ENGINE.tokenize(s))].reduce((n,w)=>n+(frequency[w]||0),0)/Math.sqrt(s.length)})).sort((a,b)=>b.score-a.score).slice(0,4).sort((a,b)=>a.i-b.i).map(v=>v.s);
}
document.getElementById("summarizeBtn").addEventListener("click",()=>{
 const docs=selectedKnowledge();showKnowledgeTool("Extractive summary (not AI-generated)",docs.slice(0,4).flatMap(d=>[`${d.title}:`,...summaryExtract(d.text)]));
});
document.getElementById("quizBtn").addEventListener("click",()=>{
 const docs=selectedKnowledge();const lines=[];
 docs.slice(0,5).forEach(d=>{const sentences=getSentences(d.text).filter(s=>s.split(" ").length>=7);if(sentences.length){const s=sentences[0];lines.push(`Q: According to ${d.title}, what does this passage explain?`);lines.push(`Study reference: ${s.slice(0,320)}`);}});
 showKnowledgeTool("Practice prompts with source passages (not AI-generated)",lines);
});
document.getElementById("learningBtn").addEventListener("click",()=>{
 const docs=selectedKnowledge();showKnowledgeTool("Suggested reading path",docs.map((d,i)=>`${i+1}. ${d.title} (${d.category||"General"}) — read the source, note key terms, then test your understanding.`));
});
["filterCategory","filterAuthor","selectedSource"].forEach(id=>document.getElementById(id).addEventListener("input",()=>renderFilteredKnowledge()));
function renderFilteredKnowledge(){
 const grid=document.getElementById("articleGrid");grid.replaceChildren();
 const query=document.getElementById("knowledgeSearch").value.toLowerCase();
 const docs=selectedKnowledge().filter(d=>`${d.title} ${d.category} ${d.text}`.toLowerCase().includes(query));
 if(!docs.length){grid.textContent="No matching knowledge.";return;}
 docs.forEach(d=>{const card=document.createElement("article");card.className="article-card";
 const h=document.createElement("h3");h.textContent=d.title;const meta=document.createElement("small");meta.textContent=`${d.category||"General"} · ${d.author||"Unknown author"} · ${d.date||"Undated"}`;
 const body=document.createElement("p");body.textContent=String(d.text||"").slice(0,400);card.append(h,meta,body);grid.append(card);});
}
document.getElementById("knowledgeSearch").addEventListener("input",renderFilteredKnowledge);
const oldKnowledgeRender=renderKnowledge;
renderKnowledge=function(query=""){oldKnowledgeRender(query);refreshKnowledgeFilters();renderFilteredKnowledge();};
renderKnowledge();
// Folder management is scoped to this demo user.
function folders(){return storage.read("chatFolders",[]);}
function refreshFolders(){const select=document.getElementById("chatFolderFilter");const previous=select.value;select.replaceChildren();
 [["","All folders"],["__none__","Unfiled"],...folders().map(f=>[f.id,f.name])].forEach(([v,t])=>{const o=document.createElement("option");o.value=v;o.textContent=t;select.append(o);});select.value=previous;}
document.getElementById("addFolderBtn").addEventListener("click",()=>{const name=prompt("Folder name:")?.trim();if(!name)return;const list=folders();list.push({id:makeId(),name:name.slice(0,70)});storage.write("chatFolders",list);refreshFolders();showToast("Folder created");});
document.getElementById("moveChatBtn").addEventListener("click",()=>{const chat=getActiveChat();if(!chat)return;const list=folders();const choices=list.map((f,i)=>`${i+1}. ${f.name}`).join("\n");const answer=prompt(`Move conversation to folder number (0 for Unfiled):\n0. Unfiled\n${choices}`);if(answer===null)return;const n=Number(answer);if(!Number.isInteger(n)||n<0||n>list.length){showToast("Invalid folder number");return;}chat.folderId=n?list[n-1].id:null;saveChats();renderChats();});
const previousRenderChats=renderChats;
renderChats=function(){previousRenderChats();const filter=document.getElementById("chatFolderFilter").value;if(!filter)return;const list=document.getElementById("conversationList");[...list.children].forEach((node,i)=>{node.hidden=filter==="__none__"?!!conversations[i]?.folderId:conversations[i]?.folderId!==filter;});};
document.getElementById("chatFolderFilter").addEventListener("change",renderChats);
refreshFolders();renderChats();
// Evidence indicators describe matching strength, NOT probability of correctness.
const oldFindAnswer=findAnswer;
findAnswer=function(question){return oldFindAnswer(question);};
const oldSendMessage=sendMessage;
sendMessage=function(question){
 oldSendMessage(question);
 const chat=getActiveChat();const reply=chat?.messages.at(-1);
 if(reply?.role==="assistant"){
   const result=KNOWLEDGE_ENGINE.answer(question);reply.strength=result.strength||"No supporting evidence";reply.evidence=result.evidence||null;reply.question=question;
   saveChats();renderChats();
 }
};
const baseRenderChats=renderChats;
renderChats=function(){baseRenderChats();const chat=getActiveChat();if(!chat)return;
 const bubbles=document.querySelectorAll("#chatMessages .message.assistant");let i=0;
 chat.messages.filter(m=>m.role==="assistant").forEach(m=>{
 const bubble=bubbles[i++];if(!bubble)return;
 const strength=document.createElement("small");strength.textContent=`Evidence strength: ${m.strength||"Not evaluated"} (keyword match, not confidence probability)`;bubble.append(strength);
 if(m.evidence){const details=document.createElement("details");const summary=document.createElement("summary");summary.textContent="View supporting passage";const passage=document.createElement("blockquote");passage.textContent=m.evidence.slice(0,1500);details.append(summary,passage);bubble.append(details);}
 const yes=document.createElement("button"),no=document.createElement("button");yes.type=no.type="button";yes.textContent="Helpful";no.textContent="Not helpful";
 const save=rating=>{ICCS_DATA.add("feedback",{rating,question:m.question||"",source:m.source||null,userId:user.id,date:new Date().toISOString()});showToast("Feedback saved locally");};
 yes.addEventListener("click",()=>save("Helpful"));no.addEventListener("click",()=>save("Not helpful"));bubble.append(yes,no);
 });
};
renderChats();
// Speech recognition works only in browsers supporting Web Speech API.
document.getElementById("voiceQueryBtn").addEventListener("click",()=>{
 const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Speech){showToast("Voice input is unavailable in this browser");return;}
 const recognition=new Speech();recognition.lang=document.getElementById("responseLanguage").value==="hi"?"hi-IN":"en-IN";
 recognition.onresult=e=>{document.getElementById("chatInput").value=e.results[0][0].transcript;};recognition.onerror=()=>showToast("Speech recognition failed");recognition.start();
});
document.getElementById("responseLanguage").addEventListener("change",()=>showToast("Answer translation requires an AI translation service; search answers remain in their source language."));
function renderKnowledgeAlerts(){const box=document.getElementById("knowledgeAlerts");box.replaceChildren();const events=ICCS_DATA.get("knowledgeChanges",[]);if(!events.length){box.textContent="No source changes observed in this browser.";return;}
 events.slice(0,10).forEach(e=>{const row=document.createElement("p");row.textContent=`${e.action}: ${e.title} · ${new Date(e.date).toLocaleString()}`;box.append(row);});}
renderKnowledgeAlerts();
window.addEventListener("storage",e=>{if(e.key==="iccs_shared_knowledgeChanges")renderKnowledgeAlerts();});
