# ORBOS — iPad Edition
## Coding Agent Context Document | v1.5
**Mexican SEP Primary Curriculum • Finnish Pedagogy • Adaptive AI**
Target: March 27, 2025 | Pilot: 5–10 children | All decisions locked as of Feb 28, 2025

---

## 1. Purpose of This Document

Authoritative reference for all coding agents building Orbos. Read this before writing any code. Every implementation decision is traceable to this document.

> **Context:** A tablet-based adaptive learning OS for Mexican primary school children (ages 5–11). SEP curriculum. Finnish phenomenon-based pedagogy. Production-ready for daily family use by March 27, 2025. Pilot: 5–10 children.

---

## 2. Daily Learning Rhythm (Critical Design Anchor)

This rhythm is the north star for all architectural decisions. Build everything to serve it.

| Block | Type | Description |
|---|---|---|
| **Block 1 — ~2 hours** | AUTONOMOUS iPad SESSION | Orchestrator-driven. Zero adult supervision. Direct lessons, practice, mastery tracking. Child works alone through the full interaction sequence. This is the core product. |
| **Block 2 — Flexible timing** | FACILITATED PHENOMENON TIME | Teacher/guide-led. Happens outside the iPad session. Real-world exploration, discussion, physical activity. Guide facilitates; child engages. iPad used ONLY at the end for evidence capture (photo, audio explanation). |

> **CRITICAL:** The iPad app does NOT run phenomena. It only captures evidence at the end of a facilitated session. Do not build in-app phenomenon renderers.

---

## 3. Locked Architecture Decisions

These decisions are final. Do not deviate. Flag concerns — do not silently work around them.

| Decision | Chosen Approach |
|---|---|
| **Backend** | Single Node.js app (TypeScript). All 6 AI agents are modular TS classes in one repo. No microservices. Framework: NestJS. |
| **LLM Provider** | Both Claude + OpenAI via LLMClient abstraction class. Switch via config flag. Default: Claude. |
| **iPad Audio** | AVSpeechSynthesizer, locale es-MX. Works fully offline. No pre-recorded audio files. |
| **SEP Standards** | Parse from official PDFs → structured JSON → PostgreSQL + RAG. Day 1–2 priority. |
| **Pilot scale** | 5–10 children. Multi-profile identity module from day 1. No single-user shortcuts. |
| **Interaction renderer** | 10 pre-approved SwiftUI components only. Schema-validated by Safety Agent. |
| **Offline strategy** | Full day pre-fetch at session start. SQLite cache. Sync queue on reconnect. |
| **Phenomenon delivery** | NOT rendered in-app. Facilitated by teacher/guide outside the 2-hour session. iPad used for evidence capture only. |
| **Phenomenon approval** | Teacher/guide approves phenomenon topics in Curriculum Studio before delivery. Only human approval gate in the system. |
| **Mastery gate** | 80% mastery level required before Orchestrator advances to next standard. Phenomenon evidence counts toward mastery but requires at least one direct lesson attempt on the same standard. |

---

## 4. User Types

### 4.1 Learner (Primary User)

| Age | Capabilities |
|---|---|
| 5yo (Grade 1) | Audio-first. Limited reading. One element on screen. TTS reads everything. |
| 8yo (Grade 4) | Medium autonomy. Simple text readable. Clear scaffolding. |
| 11yo (Grade 6) | High autonomy. Minimal guidance needed. |
| **UI rule** | One task at a time. No menus during lessons. Positive feedback only. No dead ends. |

### 4.2 Teacher / Guide

| | |
|---|---|
| **Who** | Parent, home educator, or classroom teacher. The facilitating adult. |
| **Autonomous session** | No role — child works alone. |
| **Phenomenon time** | Facilitates the real-world exploration outside the iPad session. |
| **Approval role** | Approves phenomenon topics in Curriculum Studio before they are queued for the child. Single approval gate. |
| **Dashboard** | Views mastery progress, SEP coverage, phenomenon evidence portfolio in Parent Dashboard. |

### 4.3 System Admin

| | |
|---|---|
| **Who** | Builder / developer (initially). |
| **Tools** | Curriculum Studio: lesson approval, SEP standards browser, safety logs, phenomenon queue. |

---

## 5. Applications

### App 1 — iPad Learner App

| | |
|---|---|
| **Platform** | iPad (iOS 16+). Built with Expo (React Native + TypeScript). NX-managed. |
| **Audio** | `expo-speech`, locale es-MX. All instructions narrated. Fully offline. |
| **Local storage** | `expo-sqlite`. Stores: daily plan, lesson scripts, attempt queue, evidence files. |
| **Evidence capture** | `expo-camera` (photo) + `expo-av` (audio). Uploaded to R2 on sync. Used for phenomenon evidence capture only — not mid-lesson. |
| **Offline** | Full session in airplane mode. No feature requires internet mid-session. |
| **Phenomenon role** | Evidence capture screen only — opened by guide at end of facilitated session. NOT a lesson renderer. |
| **Testing** | Detox for E2E UI automation. |

**Core modules:** Identity Module → Session Engine → Interaction Renderer → Audio Engine (TTS) → Evidence Capture → Offline Cache → Telemetry

### App 2 — Parent Dashboard (Web)

| | |
|---|---|
| **Stack** | React/Next.js, Vercel. |
| **MVP screens** | Mastery map per child, SEP coverage graph, weekly summary, phenomenon evidence portfolio (view captured photos/audio). |
| **Data** | Read-only. 5-min polling. No WebSockets needed for MVP. |

### App 3 — Curriculum Studio (Internal)

| | |
|---|---|
| **Stack** | React/Next.js, auth-protected. |
| **MVP features** | 1) SEP standards browser, 2) Generated lesson approval queue, 3) Phenomenon approval queue, 4) Safety log viewer. |
| **Two approval queues** | Lessons: auto-generated, admin reviews. Phenomena: auto-generated proposals, teacher/guide selects and approves before queuing for child. |

### App 4 — Backend API + AI Engine

| | |
|---|---|
| **Framework** | Node.js + TypeScript. NestJS. Single app, modular agent classes. |
| **ORM** | Drizzle for PostgreSQL. |
| **Deploy** | Railway or Render (not Cloudflare Workers — incompatible with persistent DB connections and long-running agents). |
| **DB** | PostgreSQL + Redis (cache). |
| **Storage** | S3-compatible (default: Cloudflare R2) for evidence files. |
| **AI** | LLMClient class wrapping Anthropic + OpenAI Node SDKs. Prompt templates versioned in DB. |
| **RAG** | OpenAI embeddings API or `@xenova/transformers` for local embeddings. pgvector for similarity search. |
| **Monorepo** | NX workspace. All 4 apps live under `apps/`. NX manages `api/`, `parent/`, `studio/`, and `ipad/` (Expo). Single language (TypeScript) across the entire stack. |

---

## 6. Approved Interaction Components

> **HARD CONSTRAINT:** AI agents may ONLY generate lesson scripts using these components by exact name. Safety Agent rejects any unknown component name.

| Component | Description |
|---|---|
| `story_card` | Narrative + TTS narration. Tappable continue. Used to introduce concepts. |
| `tap_reveal` | Tap-to-reveal hidden answer or fact. TTS reads revealed content. |
| `drag_drop` | Drag items to target zones. Validates placement. TTS reads instructions. |
| `multiple_choice` | 2–4 options. TTS reads question. Correct/wrong feedback. |
| `ordering` | Arrange shuffled items into correct sequence. |
| `build_object` | Assemble components into a target structure. |
| `slider` | Adjust a numeric value along a labelled scale. |
| `match_connect` | Drag a line from left card to matching right card. Snap on release. Used for word-image pairs, term-definition, Spanish-number matching. |
| `audio_explain` | Child records spoken explanation. Saved as evidence linked to standard. Used in phenomenon evidence capture. |
| `confidence_check` | 3-level self-report (not sure / kind of / very sure). Before + after activity. |

---


## 7. Agent Architecture

All agents: TypeScript classes, single Node.js app, stateless. State lives in PostgreSQL, passed in per call. All LLM calls via LLMClient only.

### Agent 1 — Learning Orchestrator
- **Input:** `student_id`, `date`, `available_minutes`
- **Output:** Ordered daily plan: `[{standard_id, type: lesson|practice|phenomenon_evidence, estimated_minutes}]`
- **Logic:** Checks mastery graph. Picks next unmastered standards. Mixes subjects. Inserts breaks every 20–25 min. Schedules phenomenon evidence capture slot if an approved phenomenon exists.

### Agent 2 — Lesson Interaction Designer
- **Input:** `standard_id`, `student_age`, `allowed_components[]`
- **Output:** `interaction_script` JSON: `[{component, props, tts_text}]`
- **Constraints:** Min 2 interactions. No text > 80 words per block. Approved components only. Must pass Safety Agent.

### Agent 3 — Practice Generator
- **Input:** `standard_id`, `mastery_level`, `student_age`
- **Output:** `practice_script` JSON (same format as lesson script, lighter interactions)

### Agent 4 — Mastery Estimator
- **Input:** `attempts[]`: `[{correct, time_seconds, hint_used, source: 'lesson'|'phenomenon'}]`
- **Output:** `{mastery_level: 0.0–1.0, confidence: 0.0–1.0, recommendation: advance|practice|reteach}`
- **Mastery gate:** 80% mastery_level required to advance. Phenomenon attempts count toward score but full mastery requires at least one direct lesson attempt on the same standard.
- **Algorithm:** MVP: weighted score (correct=1.0, hint_used penalty=0.3, fast+correct bonus=0.1, phenomenon_source weight=0.8). Document clearly so it can be swapped for IRT/BKT later.

### Agent 5 — Phenomenon Designer
- **Input:** `student_id`, `unmastered_standards[]`, `student_interests[]`
- **Output:** `phenomenon_proposal`: `{title, description, duration_days: 3–5, linked_standards[], facilitation_guide, evidence_prompt, materials_needed[]}`
- **Key constraint:** Output has TWO parts: `facilitation_guide` (markdown, for the teacher/guide) and `evidence_prompt` (short text shown to child at capture time). The phenomenon itself is NOT an interaction script.
- **Approval flow:** Agent generates 3 proposals → teacher/guide approves 1 in Curriculum Studio → approved phenomenon queued → evidence capture screen activated in child's app after facilitated session.

### Agent 6 — Safety & Regeneration
- **Runs on:** Every lesson script, practice script, and phenomenon proposal before DB storage. No exceptions.
- **Checks:** Component names valid, text length limits, age-appropriate tone, no sensitive topics, output coherence.
- **On failure:** Auto-regen (max 3 attempts). If still failing: log + alert admin. Never deliver to child.

---

## 8. Data Schema

### Students
```
id              UUID PK
name            VARCHAR
age             INTEGER
grade_target    INTEGER (1–6)
interests       JSONB array
```

### Standards
```
id              VARCHAR PK  e.g. SEP-MAT-1-1.1
grade           INTEGER (1–6)
subject         VARCHAR
description     TEXT
prerequisites   JSONB array of standard IDs
embedding       VECTOR (for RAG)
```

### MasteryState
```
student_id                  FK → Students
standard_id                 FK → Standards
mastery_level               FLOAT (0.0–1.0)
confidence_score            FLOAT (0.0–1.0)
has_direct_lesson_attempt   BOOLEAN  required for full mastery gate
updated_at                  TIMESTAMP
```

### Attempts
```
id                      UUID PK
student_id              FK → Students
standard_id             FK → Standards
interaction_component   VARCHAR
correct                 BOOLEAN
time_spent_seconds      INTEGER
hint_used               BOOLEAN
source                  ENUM: lesson | phenomenon
created_at              TIMESTAMP
```

### LessonScripts
```
id                  UUID PK
standard_id         FK → Standards
student_age_target  INTEGER
script_json         JSONB
version             INTEGER
safety_approved     BOOLEAN
admin_approved      BOOLEAN
created_at          TIMESTAMP
```

### PhenomenonProposals
```
id                  UUID PK
student_id          FK → Students
linked_standards    JSONB array of standard IDs
title               VARCHAR
facilitation_guide  TEXT (markdown, for teacher/guide)
evidence_prompt     TEXT (shown to child at capture time)
materials_needed    JSONB array
status              ENUM: pending | approved | completed
approved_by         VARCHAR
approved_at         TIMESTAMP
```

### Evidence
```
id              UUID PK
student_id      FK → Students
standard_id     FK → Standards
phenomenon_id   FK → PhenomenonProposals
type            ENUM: photo | audio
storage_url     VARCHAR (S3 key)
captured_at     TIMESTAMP
```

---

## 9. Offline Strategy

> **Non-negotiable. Full autonomous session must work in airplane mode.**

| | |
|---|---|
| **Pre-fetch** | Session start: fetch daily plan + all lesson scripts. Cache to SQLite. |
| **Mid-session** | All reads from SQLite only. Zero network calls during active lesson. |
| **Attempts** | Written to SQLite queue immediately. Never dropped. |
| **Evidence** | Stored locally on device. Upload to S3 on next reconnect. |
| **Sync** | On reconnect: flush attempt queue → trigger mastery update → fetch next plan. |
| **Conflict rule** | Server wins for curriculum. Client wins for attempts and evidence (append-only). |

---

## 10. Safety Model

| | |
|---|---|
| **No open chat** | Zero free-text AI conversation accessible to child. |
| **No browsing** | No web access. No external links. |
| **Template-bounded** | Generation constrained to approved component JSON schemas. |
| **Length caps** | Max tokens enforced on all agent outputs per component type. |
| **Auto-regeneration** | Safety Agent flags → auto-regen → max 3 attempts → admin alert. |
| **Audit log** | Every safety check logged: pass/fail, flags, regen count. |
| **Phenomenon safety** | Facilitation guides also pass through Safety Agent before teacher/guide sees them. |

---

## 11. MVP Scope — March 27 Hard Line

### Must Have
- 6 interaction components: `story_card`, `multiple_choice`, `drag_drop`, `tap_reveal`, `ordering`, `confidence_check`
- Math + Spanish: fully interactive lessons with mastery tracking (Grades 1, 4, 6)
- Science: basic coverage — 1–2 units per grade
- 3 approved phenomenon proposals (AI-generated, teacher/guide approved, facilitation guide + evidence prompt)
- Phenomenon evidence capture screen in iPad app (audio_explain + photo)
- Identity module: 5–10 child profiles
- Offline session support (full day cached, sync on reconnect)
- Parent Dashboard: mastery map + SEP coverage + evidence portfolio (read-only)
- Safety Agent on all generated content including phenomenon proposals
- Curriculum Studio: lesson approval + phenomenon approval queue

### Not Required for March 27
- In-app phenomenon renderer (phenomena are facilitated externally)
- `draw_canvas` removed — replaced by `match_connect` (left/right card matching, fully Expo-compatible)
- Full 100% SEP standards depth
- Advanced mastery modeling (IRT, BKT)
- Real-time dashboard, push notifications, AI-generated graphics

---

## 12. Build Order for Agents

Follow this order. Each step unblocks the next. **Critical path items marked 🔴.**

1. 🔴 SEP PDF parsing → structured JSON + seed SQL (Day 1–2)
2. 🔴 PostgreSQL schema + Node.js API skeleton + Docker-compose (Day 3–4)
3. RAG index + LLMClient abstraction + interaction JSON schemas (Day 4–5)
4. Expo project setup + `expo-speech` TTS wrapper + `expo-sqlite` + navigation shell (Day 7)
5. 🔴 Safety Agent + Lesson Generator Agent (Day 8–9)
6. Mastery Estimator Agent with source field weighting (Day 10)
7. 🔴 First 3 iPad components: story_card, multiple_choice, drag_drop (Day 11–13)
8. Learning Orchestrator Agent (Day 14)
9. Remaining 3 components: tap_reveal, ordering, confidence_check (Day 15)
10. 🔴 Session Engine (Day 16)
11. 🔴 Offline cache + sync pipeline — test in airplane mode (Day 17)
12. Identity module — multi-profile (Day 18)
13. Attempt → mastery update pipeline (Day 19)
14. Parent Dashboard — mastery map + SEP coverage + evidence portfolio (Day 20)
15. Curriculum Studio — lesson + phenomenon approval queues (Day 21)
16. Phenomenon Designer Agent + facilitation guide output (Day 22)
17. iPad evidence capture screen (photo + audio_explain) (Day 23)
18. 3 phenomenon proposals generated, approved, queued (Day 24)
19. End-to-end test: 5-day simulated week, 3 profiles, offline, phenomenon evidence (Day 25)
20. Bug fix + polish + deploy (Day 26–27)

---

## 13. Standing Rules for All Coding Agents

- Read this document before writing any code
- Never call Claude or OpenAI SDK directly — always use `LLMClient` wrapper
- Never hardcode prompt strings — store as versioned templates in DB
- Never skip Safety Agent — runs on every generated output, no exceptions
- **Never build an in-app phenomenon renderer** — phenomena are facilitated externally
- Never build beyond MVP Done definitions — flag scope creep and stop
- Always scope DB queries by `student_id` — no cross-student data leaks
- Always test offline in airplane mode before marking any session-related task done
- Flag blockers as: `BLOCKER: [description] + what you need`. Never work around silently.

---

> **Success condition on March 27:** A 5yo, 8yo, and 11yo each complete a full 2-hour autonomous session with zero adult help, on a real iPad, offline if needed. Teacher/guide facilitates one phenomenon session in the same week. Evidence appears in the parent dashboard.

---

*v1.5 — Switched API framework from Hono to NestJS. Locked Drizzle as ORM. Added deployment target (Railway/Render). Orbos. Coding agent use only.*
