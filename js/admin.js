
const ADMIN_PREFIX = "iccs_shared_";

const db = {
  get(key, fallback = []) {
    try {
      return JSON.parse(localStorage.getItem(ADMIN_PREFIX + key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(ADMIN_PREFIX + key, JSON.stringify(value));
  }
};

const defaults = {
  users: [
    { id: 1, name: "Demo Administrator", email: "admin@iccs.demo", role: "Admin", status: "Active", permissions: "All modules" },
    { id: 2, name: "Demo Employee", email: "employee@iccs.demo", role: "Employee", status: "Active", permissions: "Employee portal" }
  ],
  questions: [
    { id: 1, module: "General", question: "How do I find a document?", answer: "Use the Knowledge Hub search.", status: "Active" },
    { id: 2, module: "General", question: "How do I raise a support ticket?", answer: "Open the Support Center page.", status: "Active" },
    { id: 3, module: "Training", question: "Where can I read company policies?", answer: "Open the Knowledge Hub.", status: "Active" }
  ],
  articles: [
    { id: 1, title: "Getting Started Guide", category: "General", keywords: "start, guide, help", description: "Sample guide for using the knowledge platform", status: "Indexed" },
    { id: 2, title: "Support Process", category: "Support", keywords: "ticket, support, help", description: "Sample guidance on raising support requests", status: "Indexed" }
  ]
};

for (const [key, value] of Object.entries(defaults)) {
  if (localStorage.getItem(ADMIN_PREFIX + key) === null) {
    db.set(key, value);
  }
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 2500);
}

function navigate(page) {
  document.querySelectorAll(".page").forEach(el =>
    el.classList.toggle("active", el.id === page)
  );
  document.querySelectorAll(".nav-link").forEach(el =>
    el.classList.toggle("active", el.dataset.page === page)
  );
  document.getElementById("sidebar").classList.remove("open");
  if(page==="tickets")renderAdminTickets();
}

function makeButton(label, handler) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = label;
  btn.addEventListener("click", handler);
  return btn;
}

function createCell(row, value) {
  const td = document.createElement("td");
  td.textContent = value;
  row.append(td);
  return td;
}

function renderUsers() {
  const tbody = document.getElementById("usersTable");
  tbody.replaceChildren();

  db.get("users").forEach(user => {
    const tr = document.createElement("tr");
    ["name", "email", "role", "status", "permissions"].forEach(key =>
      createCell(tr, user[key])
    );
    const actions = document.createElement("td");
    actions.append(
      makeButton("Edit", () => openEditor("users", user)),
      makeButton("Delete", () => deleteRecord("users", user.id))
    );
    tr.append(actions);
    tbody.append(tr);
  });
}

function renderRecords(key, containerId, fields, query = "") {
  const container = document.getElementById(containerId);
  container.replaceChildren();

  const records = db.get(key).filter(item =>
    fields.map(f => String(item[f] || "")).join(" ")
      .toLowerCase().includes(query.toLowerCase())
  );

  if (!records.length) {
    container.textContent = "No records found.";
    return;
  }

  records.forEach(record => {
    const div = document.createElement("div");
    div.className = "record";

    const title = document.createElement("strong");
    title.textContent = record.question || record.title;

    const details = document.createElement("small");
    details.textContent = fields.map(f => `${f}: ${record[f]}`).join(" | ");

    div.append(title, details);
    div.append(
      makeButton("Edit", () => openEditor(key, record)),
      makeButton("Delete", () => deleteRecord(key, record.id))
    );
    container.append(div);
  });
}

function renderQuestions() {
  const module = document.getElementById("moduleFilter").value;
  const search = document.getElementById("questionSearch").value;
  const all = db.get("questions");
  const filtered = all.filter(q =>
    (!module || q.module === module) &&
    `${q.question} ${q.answer}`.toLowerCase().includes(search.toLowerCase())
  );

  const container = document.getElementById("questionsList");
  container.replaceChildren();

  filtered.forEach(q => {
    const div = document.createElement("div");
    div.className = "record";
    const title = document.createElement("strong");
    title.textContent = q.question;
    const detail = document.createElement("small");
    detail.textContent = `${q.module} | ${q.status} | ${q.answer}`;
    div.append(title, detail,
      makeButton("Edit", () => openEditor("questions", q)),
      makeButton("Delete", () => deleteRecord("questions", q.id))
    );
    container.append(div);
  });

  if (!filtered.length) container.textContent = "No matching questions.";
}

const schemas = {
  users: [
    ["name", "Name"], ["email", "Email"], ["role", "Role", ["Admin", "Analyst", "Viewer", "Employee"]],
    ["status", "Status", ["Active", "Inactive"]], ["permissions", "Permissions"]
  ],
  questions: [
    ["module", "Module", ["General", "Operations", "Training", "Support"]],
    ["question", "Question"], ["answer", "Answer"],
    ["status", "Status", ["Active", "Inactive"]]
  ],
  articles: [
    ["title", "Title"], ["category", "Category"],
    ["keywords", "Keywords"], ["description", "Description"],
    ["status", "Index Status", ["Indexed", "Pending", "Draft"]]
  ]
};

let editorState = null;

function openEditor(key, record = null) {
  editorState = { key, id: record?.id ?? null };
  document.getElementById("dialogTitle").textContent =
    `${record ? "Edit" : "Add"} ${key.slice(0, -1)}`;

  const fields = document.getElementById("editorFields");
  fields.replaceChildren();

  schemas[key].forEach(([name, title, options]) => {
    const label = document.createElement("label");
    label.textContent = title;

    const input = options ? document.createElement("select") :
      document.createElement("input");

    input.name = name;
    input.required = true;

    if (options) {
      options.forEach(option => {
        const item = document.createElement("option");
        item.value = option;
        item.textContent = option;
        input.append(item);
      });
    }

    input.value = record?.[name] ?? "";
    label.append(input);
    fields.append(label);
  });

  document.getElementById("editorDialog").showModal();
}

function deleteRecord(key, id) {
  if (!confirm("Delete this demo record?")) return;
  db.set(key, db.get(key).filter(item => item.id !== id));
  refresh();
  toast("Record deleted.");
}

function refresh() {
  renderUsers();
  renderQuestions();
  renderRecords("articles", "adminArticles",
    ["title", "category", "keywords", "description", "status"],
    document.getElementById("articleSearch").value
  );

  document.getElementById("statUsers").textContent = db.get("users").length;
  document.getElementById("statArticles").textContent = db.get("articles").length;
  document.getElementById("statTickets").textContent = ICCS_DATA.get("tickets",[]).filter(t=>t.status==="Open").length;
  document.getElementById("statRequests").textContent = ICCS_DATA.get("searchEvents",[]).length;
  renderSources();
  renderAdminTickets();
}

document.getElementById("editorForm").addEventListener("submit", event => {
  event.preventDefault();
  if (!editorState) return;

  const { key, id } = editorState;
  const values = Object.fromEntries(new FormData(event.target));
  const records = db.get(key);

  if (id !== null) {
    const index = records.findIndex(item => item.id === id);
    if (index !== -1) records[index] = { ...records[index], ...values };
  } else {
    records.unshift({ id: Date.now(), ...values });
  }

  db.set(key, records);
  document.getElementById("editorDialog").close();
  refresh();
  toast("Demo record saved.");
});

document.getElementById("cancelDialog").addEventListener("click", () =>
  document.getElementById("editorDialog").close()
);

document.getElementById("addUserBtn").addEventListener("click", () => openEditor("users"));
document.getElementById("addQuestionBtn").addEventListener("click", () => openEditor("questions"));
document.getElementById("addArticleBtn").addEventListener("click", () => openEditor("articles"));

document.getElementById("moduleFilter").addEventListener("change", renderQuestions);
document.getElementById("questionSearch").addEventListener("input", renderQuestions);
document.getElementById("articleSearch").addEventListener("input", refresh);

document.querySelectorAll("[data-page]").forEach(btn =>
  btn.addEventListener("click", () => navigate(btn.dataset.page))
);
document.querySelectorAll("[data-go]").forEach(btn =>
  btn.addEventListener("click", () => navigate(btn.dataset.go))
);

document.getElementById("menuBtn").addEventListener("click", () =>
  document.getElementById("sidebar").classList.toggle("open")
);
document.getElementById("logoutBtn").addEventListener("click", logout);

const modelConfig = db.get("model", {
  modelProvider: "Demo",
  activeModel: "local-keyword-matcher",
  toolModel: "none",
  inputPrice: 0,
  outputPrice: 0
});

Object.entries(modelConfig).forEach(([key, value]) => {
  const el = document.getElementById(key);
  if (el) el.value = value;
});

document.getElementById("modelForm").addEventListener("submit", event => {
  event.preventDefault();
  // Demo model preferences only; no external AI model is connected.
  // Fields currently have IDs but no name attributes.
  const config = {};
  ["modelProvider", "activeModel", "toolModel", "inputPrice", "outputPrice"]
    .forEach(key => config[key] = document.getElementById(key).value);
  db.set("model", config);
  toast("Demo model configuration saved.");
});

document.getElementById("compactMode").addEventListener("change", event => {
  document.body.classList.toggle("compact", event.target.checked);
  db.set("compact", event.target.checked);
});

const compact = db.get("compact", false);
document.getElementById("compactMode").checked = compact;
document.body.classList.toggle("compact", compact);

refresh();

// Import and manage universal knowledge sources.
function renderSources(){const box=document.getElementById("sourceList");if(!box)return;box.replaceChildren();const sources=ICCS_DATA.get("sources",[]);if(!sources.length){box.textContent="No sources imported yet.";return;}sources.forEach(source=>{const row=document.createElement("div");row.className="record";const label=document.createElement("strong");label.textContent=`${source.title} · ${source.category} · ${source.pages||1} page(s)`;const detail=document.createElement("small");detail.textContent=`${source.name||"Pasted content"} · ${source.text.length.toLocaleString()} characters`;row.append(label,detail,makeButton("Delete",()=>{if(!confirm("Delete this knowledge source?"))return;ICCS_DATA.remove("sources",source.id);ICCS_DATA.add("knowledgeChanges",{action:"Deleted",title:source.title,date:new Date().toISOString()});renderSources();toast("Source removed");}));box.append(row);});}
const sourceForm=document.getElementById("sourceForm");if(sourceForm)sourceForm.addEventListener("submit",async event=>{event.preventDefault();const title=document.getElementById("sourceTitle").value.trim();const category=document.getElementById("sourceCategory").value.trim();const file=document.getElementById("sourceFile").files[0];const pasted=document.getElementById("sourceText").value.trim();try{let content=pasted;let pages=[{page:1,text:pasted}];if(file){const extracted=await KNOWLEDGE_ENGINE.readFile(file);content=extracted.text;pages=extracted.pages;}if(!content.trim())throw Error("No readable content was found.");const saved=ICCS_DATA.add("sources",{title,category,name:file?.name||"Pasted knowledge",author:document.getElementById("sourceAuthor")?.value.trim()||"",date:document.getElementById("sourceDate")?.value||new Date().toISOString().slice(0,10),updatedAt:new Date().toISOString(),text:content,pages:pages.length,sections:pages,status:"Indexed"});if(!saved)throw Error("Unable to save source");ICCS_DATA.add("knowledgeChanges",{action:"Imported",title,date:new Date().toISOString()});sourceForm.reset();renderSources();toast("Knowledge imported. Add or approve FAQs in Modules & Questions.");}catch(err){toast(err.message||"Import failed");}});
window.addEventListener("storage",event=>{if(event.key?.startsWith("iccs_shared_"))refresh();});

function renderAdminTickets(){
  const container=document.getElementById("adminTickets");
  if(!container)return;
  container.replaceChildren();
  const tickets=ICCS_DATA.get("tickets",[]);
  if(!tickets.length){container.textContent="No support tickets yet.";return;}
  tickets.forEach(ticket=>{
    const row=document.createElement("div");row.className="record";
    const title=document.createElement("strong");title.textContent=ticket.subject||"Support request";
    const detail=document.createElement("small");detail.textContent=`${ticket.employeeName||"Employee"} · ${ticket.category||"General"} · ${ticket.id}`;
    const select=document.createElement("select");
    ["Open","In Progress","Resolved","Closed"].forEach(status=>{const option=document.createElement("option");option.value=status;option.textContent=status;select.append(option);});
    select.value=ticket.status||"Open";
    select.addEventListener("change",()=>{if(ICCS_DATA.update("tickets",ticket.id,{status:select.value})){renderAdminTickets();refresh();toast("Ticket updated");}});
    row.append(title,detail,select);container.append(row);
  });
}
renderAdminTickets();


// Local-only knowledge analytics. Counts are observed events, not model usage.
function renderKnowledgeAnalytics(){
 const sources=ICCS_DATA.get("sources",[]), articles=ICCS_DATA.get("articles",[]);
 const events=ICCS_DATA.get("searchEvents",[]), feedback=ICCS_DATA.get("feedback",[]);
 const stale=[...sources,...articles].filter(s=>s.status==="Outdated" || (s.reviewDate && s.reviewDate < new Date().toISOString().slice(0,10)));
 const counts={}; events.forEach(e=>{const key=String(e.question||"").trim().toLowerCase();if(key)counts[key]=(counts[key]||0)+1;});
 const put=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=String(value);};
 put("metricSources",sources.length+articles.length);
 put("metricQuestions",events.length);
 put("metricUnanswered",events.filter(e=>!e.matched).length);
 put("metricOutdated",stale.length);
 put("metricFeedback",feedback.length);
 const fill=(id,items,format)=>{const el=document.getElementById(id);if(!el)return;el.replaceChildren();if(!items.length){el.textContent="No activity recorded yet.";return;}items.forEach(item=>{const row=document.createElement("p");row.className="insight-row";row.textContent=format(item);el.append(row);});};
 fill("metricTopics",Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8),([q,n])=>`${q} — ${n} search(es)`);
 fill("metricGaps",events.filter(e=>!e.matched).slice(0,8),e=>`${e.question} · ${new Date(e.date).toLocaleString()}`);
 fill("metricFeedbackList",feedback.slice(0,8),f=>`${f.rating} · ${f.question||"Question"} · ${f.comment||"No comment"}`);
}
const oldAdminRefresh=refresh;
refresh=function(){oldAdminRefresh();renderKnowledgeAnalytics();};
renderKnowledgeAnalytics();
