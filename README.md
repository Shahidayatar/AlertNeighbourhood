# alertNeighbourhood

Citizen alert prototype: React + TypeScript frontend, Node + Express backend, Azure OpenAI analysis, Leaflet map.

Quick start

1. Copy `.env.example` to `.env` and fill Azure OpenAI values (or leave blank to use mock analysis).
2. From the project root run:

```bash
# install root deps (optional)
cd alertNeighbourhood
npm install

# install server and client deps
cd server && npm install
cd ../client && npm install
```

Run server:

```bash
cd alertNeighbourhood/server
npm run dev
```

Run client:

```bash
cd alertNeighbourhood/client
npm run dev
```

Open http://localhost:5173 (client) and the server API runs on http://localhost:4000 by default.

Notes
- This is a prototype. Alerts are stored in-memory and will reset when server restarts.
- Azure OpenAI integration will be used when `server/.env` contains valid `AZURE_OPENAI_*` values; otherwise a local heuristic mock is used.

How AI analysis and logging work
- When an alert is submitted the backend calls `analyzeAlert(...)`.
- If `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_KEY` are set, the server attempts an Azure OpenAI request. If that call returns a parsable JSON with { risk, reason } the result will be used and the analysis `source` is recorded as `azure`.
- If Azure credentials are missing, if the Azure call returns no parsable JSON, or if the Azure call throws an error, the server falls back to a small heuristic analyzer (keywords) which returns a `risk` and `reason` and marks the `source` as `mock` (or `error` for cases where Azure failed but we still return the heuristic).
- The backend logs info about which source was used, e.g. "Alert analysis result { id, source: 'azure', risk: 'High' }". Logs are written to stdout via a small `logger` helper (`server/src/utils/logger.ts`).
# alertNeighbourhood

A small full‑stack prototype for a citizen‑centered alert platform.

Tech stack
- Frontend: React + TypeScript (Vite), Leaflet for maps
- Backend: Node.js + Express + TypeScript
- AI: Azure OpenAI (optional) with a local heuristic fallback

Overview
--------
Users can submit alerts with title, description, optional image and coordinates. Each alert is analyzed by an AI service to estimate risk level (High / Medium / Low) and a reason. Alerts are stored temporarily on the server and displayed on a Leaflet map color‑coded by risk. The frontend polls for alerts every 5 seconds and shows them on the map and in a list. Clicking an alert in the list centers the map on it.

Project layout
--------------
```
alertNeighbourhood/
├── client/           # Vite + React frontend (src/...) 
└── server/           # Express + TypeScript backend
		├── src/
		│   ├── routes/alerts.ts
		│   └── services/azureOpenAI.ts
		└── uploads/      # uploaded images (served statically)
```

Quick start (local)
-------------------
1. Clone or place this project folder on your machine.
2. Install dependencies (per-package recommended):

```bash
# Server
cd alertNeighbourhood/server
npm install

# Client
cd ../client
npm install
```

3. Configure environment for the server (optional)

```text
# Create server/.env
AZURE_OPENAI_ENDPOINT=            # e.g. https://your-resource.cognitiveservices.azure.com
AZURE_OPENAI_KEY=                 # your key
AZURE_OPENAI_DEPLOYMENT_NAME=     # e.g. gpt-4o-mini (your deployment name)
PORT=4000
```

If you don't set Azure variables, the server will use a simple heuristic to classify alerts.

4. Run the backend and frontend in separate terminals

```bash
# Terminal 1: server
cd alertNeighbourhood/server
npm run dev

# Terminal 2: client
cd alertNeighbourhood/client
npm run dev
```

Open http://localhost:5173 in your browser.

API (backend)
-------------
- GET /api/alerts
	- returns: array of alerts

- POST /api/alerts (multipart/form-data)
	- fields: title, description, lat, lng, image (file optional)
	- response: created alert object

- POST /api/alerts/:id/resolve
	- marks alert as resolved

Alert object schema (example)
```
{
	id: string,
	title: string,
	description: string,
	lat: number,
	lng: number,
	image?: string,            // served at /uploads/<filename>
	risk: 'High'|'Medium'|'Low'|'Unknown',
	reason: string,
	analysisSource: 'azure'|'mock'|'error',
	resolved: boolean,
	createdAt: string
}
```

AI integration and behavior
---------------------------
- When an alert is received, the server calls `analyzeAlert(input)` in `server/src/services/azureOpenAI.ts`.
- If `AZURE_OPENAI_ENDPOINT` and `AZURE_OPENAI_KEY` are configured, the server attempts a REST call to the Azure OpenAI deployment. If Azure returns a parsable JSON object with `risk` and `reason`, that result is used and recorded with `analysisSource: 'azure'`.
- If Azure credentials are missing, Azure returns no content, parsing fails, or the Azure call throws an error, the server falls back to a local heuristic classifier (keywords) and records `analysisSource: 'mock'` (or 'error' when Azure failed but we used the heuristic).

This design keeps the app resilient: AI failures do not block alerts.

Logging
-------
- The server has a small logger (`server/src/utils/logger.ts`) that logs `info`/`warn`/`error` to stdout with timestamps.
- Example logs you may see:
	- `info: Azure credentials not found, using mock analysis` — server used the heuristic
	- `info: Alert analysis result { id, source: 'azure', risk: 'High' }` — prediction returned from Azure
	- `error: Azure OpenAI call failed, falling back to mock: <error message>` — Azure call failed and heuristic used

Troubleshooting
---------------
- Frontend shows `ERR_CONNECTION_REFUSED` when fetching `/api/alerts`:
	- Ensure server is running (`npm run dev` in `server/`) and listening on port 4000.
	- Confirm with `curl http://localhost:4000/api/alerts`.

- Vite dev server fails to start or `npm run dev` prints `bash: d: command not found`:
	- This can be a Git Bash/Windows path quoting issue. Try running the commands in Windows PowerShell or Command Prompt, or use `npx vite` from the `client/` directory.

- TypeScript compile errors about default imports:
	- The client tsconfig enables `esModuleInterop` and `allowSyntheticDefaultImports` to allow default import style (`import React from 'react'`). If your editor still flags errors, restart your editor/TS server.

Extending this prototype
------------------------
- Persist alerts to a JSON file or a small DB so they survive server restarts.
- Replace polling with WebSockets (socket.io) for real-time updates.
- Add basic username-only login and attribute alerts to users.
- Improve AI prompt and response parsing for higher reliability.

Quick API examples
------------------
- List alerts

```bash
curl http://localhost:4000/api/alerts
```

- Create alert (no image)

```bash
curl -X POST http://localhost:4000/api/alerts \\
	-F "title=Noise and shouting" \\
	-F "description=Large drunk crowd shouting near station" \\
	-F "lat=47.3769" -F "lng=8.5417"
```

- Create alert (with image)

```bash
curl -X POST http://localhost:4000/api/alerts \\
	-F "title=Broken glass" \\
	-F "description=Glass on the pavement" \\
	-F "lat=47.38" -F "lng=8.54" \\
	-F "image=@/path/to/photo.jpg"
```

Contact / next steps
--------------------
If you want, I can:
- Show `analysisSource` in the frontend popups/list (e.g., "Predicted by Azure"),
- Add persistence so alerts survive server restarts, or
- Add WebSocket push updates instead of polling.

Tell me which of the above you'd like next and I'll implement it.

