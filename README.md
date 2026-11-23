# ICCS Universal Knowledge AI — Frontend Demo

## Run
Open the project folder in VS Code and launch `index.html` using Live Server (same localhost origin for all pages).

Demo Admin: `admin@iccs.demo` / `Admin@123`
Demo Employee: `employee@iccs.demo` / `User@123`

## Working demo features
- One login page, role-based navigation to Admin and Employee workspaces.
- Admin manages sample users, approved FAQs, knowledge articles, and support tickets.
- Admin imports TXT/MD or text-based PDF sources, or pastes text into the Knowledge Base. PDF.js is fetched from CDN when needed.
- User Knowledge Hub displays imported sources and popular/approved FAQs.
- User chatbot searches shared FAQ, article, and imported source text with source/page references; records search counts. This is **keyword retrieval**, not generative AI.
- Browser-local support tickets shared across demo logins on the same origin.

## Important limitations
- Browser-only prototype: data is in localStorage; no server or cross-device sync.
- Demo passwords are embedded in client-side JS and must never be used for real accounts.
- Admin user CRUD does not create real login accounts.
- Document imports are stored as extracted text only; large imports can exceed localStorage quota.
- Text-based PDF extraction needs network access to the PDF.js CDN; scanned pages, images, tables, OCR and semantic AI require additional services.
- AI model/token settings are illustrative only. No API keys or external AI calls.
- Do not upload confidential company data into this demo; use a secured production architecture for that.


## Knowledge Intelligence upgrade

New local prototype tools: extractive summaries (not generative AI), keyword evidence passages and matching-strength labels, source category/author/date filters, conversation folders, source-grounded practice prompts, reading paths, browser speech input where supported, and local source-change log. The response language selector does not translate answers.

Admin Analytics shows source counts, observed question searches, unanswered questions, topic counts, feedback, and outdated status/review-date checks from browser storage. No organization-wide synchronization or actual AI model billing is provided. Meeting summarization, workflow execution, and multilingual AI responses require secure services and are not claimed as implemented.

This is a same-origin, same-browser demo. Never upload confidential business material into an untrusted or shared browser.
