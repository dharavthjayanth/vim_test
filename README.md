# VCVSP MVP — Virtual Classroom Simulation Platform

**An AI-powered instructor readiness simulation system prototype.**

## 🚀 Deploy Now (One Click)

### Option 1: Vercel (Recommended)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/challakondabharath-wq/vcvsp-mvp)

### Option 2: Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/challakondabharath-wq/vcvsp-mvp)

---

## 📱 Live Demo
After deploying, you'll get a live URL to share with your product team.

## What This Shows
✅ **Complete instructor UX/flow** — Login → Setup → Classroom → Report  
✅ **Virtual classroom with 8-30 AI student agents** — unique personalities & behaviors  
✅ **Real-time behavior simulation** — phone use, sleeping, side-talking, questions  
✅ **Live scoring dashboard** — Audio, Video, Classroom Management (0-100)  
✅ **Response handling** — click avatars to respond to disruptions  
✅ **Event detection** — alert system for unresponded disruptions  
✅ **Post-session evaluation** — detailed report with coaching notes  
✅ **Certification badges** — readiness classification (Ready/Conditional/Developing/Needs Support)  

## 🎯 How to Use (Demo Flow)

1. **Login** → Click "Enter as Demo Instructor" (skip auth)
2. **Setup** → Select:
   - Topic: Choose from Technology, Business, Design, Science
   - Difficulty: Beginner / Intermediate / Advanced
   - Students: 8, 12, 15, 20, or 30
3. **Classroom Simulation** → 5-minute interactive session:
   - Watch student avatars misbehave randomly
   - Click avatars to respond (3 response types)
   - See scores update in real-time
   - Alerts fire for unresponded disruptions
4. **Report** → View:
   - Overall readiness score
   - Certification status
   - Skill radar chart
   - Response breakdown analysis
   - AI coaching recommendations

## 💻 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v3 (dark professional theme)
- **Charts:** Recharts (radar, bar, line charts)
- **Simulation:** Pure JavaScript FSM + probability models
- **Media:** Browser WebRTC (camera preview)
- **State:** React hooks + Context
- **Deployment:** Vercel or Render (static site)

## 📦 Run Locally

```bash
cd vcvsp-mvp
npm install
npm run dev
```

Then open **http://localhost:5173**

## 📋 File Structure

```
src/
├── pages/
│   ├── LoginPage.tsx       — Auth + demo shortcut
│   ├── SetupPage.tsx       — Configuration form
│   ├── ClassroomPage.tsx   — Main simulation (3-col layout)
│   └── ReportPage.tsx      — Evaluation results
├── components/
│   ├── StudentAvatar.tsx   — Avatar with behavior animations
│   ├── ScoreGauge.tsx      — SVG circular gauges + sparkline
│   ├── ActivityFeed.tsx    — Live event feed
│   └── AlertBanner.tsx     — Alert cards
├── simulation/
│   └── engine.ts           — Agent FSM, behavior logic, scoring
├── types.ts                — TypeScript interfaces
├── App.tsx                 — Router
└── index.css               — Tailwind + animations
```

## 🎓 What This MVP Demonstrates

This prototype shows developers **exactly what to build** for the production version:

1. **Architecture:** Component structure, state management, routing
2. **UX/UI:** Professional dark theme, responsive layouts, real-time updates
3. **Core Features:** Student agents, behavior simulation, evaluation scoring
4. **User Flow:** Complete journey from auth to post-session report
5. **Interactions:** Response handling, alert system, live dashboards

## 📖 Product Context

See the full **Product Requirements Document** for requirements and roadmap:
- Detailed feature specs
- Phase 0-5 implementation plan
- Security & scalability considerations
- Business model & competitive advantage

## 🔧 Next Steps for Production

The production build will add:
- ✅ Real backend (Node.js/Fastify)
- ✅ PostgreSQL database (sessions, evaluations, users)
- ✅ Real Gemini API integration (student Q generation, coaching)
- ✅ WebSocket for distributed real-time events
- ✅ Session recording to cloud storage (AWS S3)
- ✅ Manager/admin dashboards
- ✅ Multi-organization support
- ✅ LMS integrations
- ✅ Advanced analytics & certifications

This MVP is the **reference implementation** for the dev team.

---

## 📧 Contact

For questions about the product, see the PRD.  
For questions about this prototype code, reach out to the product team.

**VCVSP MVP v1.0** — 2025
