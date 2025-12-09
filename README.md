# AI-Powered Daily Time Tracking & Analytics Dashboard

This repository contains a client-side Time Tracking web app that uses Firebase Authentication and Firestore to let users log activities (in minutes) per date and view a date-based analytics dashboard.

Live demo: (deploy to GitHub Pages; add link here)

Video walkthrough: (add YouTube or Drive link here)

## Features
- Email / Password and Google sign-in (Firebase Auth)
- Log multiple activities per date (name, optional category, minutes)
- Validate total minutes per day ≤ 1440
- Show remaining minutes for the selected date
- Add / edit / delete activities
- Date-based dashboard with Pie and Bar charts (Chart.js)
- "No data available" view when no records exist for a date

## Tech
- Frontend: HTML, Tailwind (CDN), vanilla JS
- Charts: Chart.js (CDN)
- Backend/Persistence: Firebase Authentication + Firestore

## Project structure
- `index.html` — main page
- `src/app.js` — application logic (auth, Firestore, UI)
- `src/firebase-config-example.js` — example config; copy to `src/firebase-config.js` and fill in your project keys
- `src/styles.css` — small styling helpers

## Setup (local)
1. Clone the repo
2. Create a Firebase project and enable Authentication (Email/Password and Google) and Firestore.
3. Copy `src/firebase-config-example.js` → `src/firebase-config.js` and fill the `firebaseConfig` object with your project values.
4. Open `index.html` in your browser (or use a simple HTTP server).

Example using Python http server:
```
python -m http.server 8000
# then open http://localhost:8000
```

## Firestore data shape
The app writes a single document per user per date at:
`users/{userId}/days/{YYYY-MM-DD}` with data:
```
{ activities: [ { name: string, category: string, minutes: number }, ... ] }
```

## Deploy to GitHub Pages
1. Initialize git, commit and push to a GitHub repo.
2. In the repo settings, enable GitHub Pages from the `main` branch (root) or use GitHub Actions.

## How AI was used
- Generated scaffolding and UI layout suggestions using an LLM.
- Chart color palette and UX copy were suggested by AI.
- Boilerplate Firebase logic and helper functions were iteratively improved with AI assistance.

## Next steps / improvements
- Use Firebase modular SDK and secure Firestore rules.
- Add offline support and export.
- Add timeline visualization and richer analytics (averages, streaks).

---
Replace the demo and video links with your hosted URLs once deployed.
