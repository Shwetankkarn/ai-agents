<div align="center">

<img src="https://media.giphy.com/media/qgQUggAC3Pfv687qPC/giphy.gif" alt="AI coding animation" width="180" />

# ✦ AI Agents

### One chat. Five specialists. Infinite directions.

<img src="https://readme-typing-svg.demolab.com?font=Space+Mono&size=18&duration=2800&pause=900&color=6D4AFF&center=true&vCenter=true&width=720&lines=Ask+anything%2C+the+router+finds+the+right+agent.;Weather+%C2%B7+News+%C2%B7+GitHub+%C2%B7+Blockchain+%C2%B7+Web;Persistent+memory+with+secure+Clerk+authentication." alt="AI Agents animated tagline" />

<br />

[![Live App](https://img.shields.io/badge/Live%20App-Open%20now-6D4AFF?style=for-the-badge&logo=vercel&logoColor=white)](https://frontend-omega-ruby-s9i8nou6sn.vercel.app)
[![API Health](https://img.shields.io/badge/API-Healthy-20C997?style=for-the-badge&logo=fastapi&logoColor=white)](https://ai-agents-pied.vercel.app/api)
[![GitHub](https://img.shields.io/badge/GitHub-Source-181717?style=for-the-badge&logo=github)](https://github.com/Shwetankkarn/ai-agents)

<br />

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827)
![Node](https://img.shields.io/badge/Node.js-20%2B-5FA04E?style=flat-square&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Memory-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?style=flat-square)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel)

</div>

> A production-ready multi-agent AI assistant that routes every request to the most relevant specialist, remembers the conversation, and returns a useful answer in one focused chat experience.

## ✨ Agent Desk

| Specialist | Best for | Signal |
| --- | --- | --- |
| 🌤️ **Weather** | Current conditions and forecasts | City + date aware |
| 🗞️ **News** | Recent headlines and topic research | Multi-topic search |
| 🐙 **GitHub** | Profiles and public repositories | Live GitHub data |
| ⛓️ **Blockchain** | Crypto and blockchain questions | Market-aware routing |
| 🌐 **Web** | General web search and research | Tavily-powered context |

The experience includes Clerk auth, multiple conversations, MongoDB message history, generated titles, rolling summaries, Markdown answers, code copying, online/offline status, and safe conversation deletion.

## 🎬 The Experience

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&size=16&duration=2200&pause=700&color=20C997&center=true&vCenter=true&width=650&lines=route(question)+%E2%86%92+specialist;specialist+%E2%86%92+live+data;live+data+%E2%86%92+memory+%E2%86%92+answer" alt="AI request flow animation" />

</div>

Try it live: **[Launch AI Agents](https://frontend-omega-ruby-s9i8nou6sn.vercel.app)**

## Architecture

```mermaid
flowchart LR
    Browser[React + Vite frontend] -->|Clerk token + HTTPS| API[Express API on Vercel]
    API --> Auth[Clerk authentication]
    API --> DB[(MongoDB Atlas)]
    API --> Router[Gemini request router]
    Router --> Weather[Weather API]
    Router --> News[News API]
    Router --> GitHub[GitHub API]
    Router --> Web[Tavily web search]
    Router --> Crypto[Blockchain service]
    API --> Memory[Conversation memory + summaries]
    Memory --> DB
```

### Repository layout

```text
.
├── AI-agents/                 # Express API and agent services
│   ├── agents/                # Weather, news, GitHub, web, blockchain agents
│   ├── api/[...path].js       # Vercel catch-all serverless entrypoint
│   ├── config/db.js           # Cached MongoDB connection
│   ├── models/Conversation.js # Conversation schema
│   ├── router/router.js       # Gemini-powered agent selection
│   ├── services/              # External APIs and conversation memory
│   └── index.js               # Express app and local server entrypoint
├── frontend/                  # React + Vite client
│   └── src/                   # Chat UI, auth flow, and API calls
└── README.md
```

## Request Flow

1. Clerk authenticates the user in the browser.
2. The frontend sends a bearer token and message to `POST /api/chat`.
3. The API verifies the user and loads their MongoDB conversation.
4. Gemini classifies the request and extracts the agent query.
5. The selected specialist calls its external service.
6. The answer and agent metadata are saved to the conversation.
7. The frontend renders the response as Markdown and updates the sidebar.

## API Reference

The production API base URL is `https://ai-agents-pied.vercel.app/api`.

| Method | Route | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api` | No | Health check |
| `GET` | `/api/conversations` | Clerk | List the current user's conversations |
| `POST` | `/api/conversations` | Clerk | Create a conversation |
| `GET` | `/api/conversation/:id` | Clerk | Load one conversation |
| `DELETE` | `/api/conversation/:id` | Clerk | Delete one conversation |
| `POST` | `/api/chat` | Clerk | Route, answer, and save a user message |

Protected requests require:

```http
Authorization: Bearer <clerk-session-token>
Content-Type: application/json
```

Example chat body:

```json
{
  "conversationId": "mongodb-conversation-id",
  "message": "What is the weather in Delhi tomorrow?"
}
```

## Local Development

### Prerequisites

- Node.js 20+
- MongoDB Atlas or a reachable MongoDB instance
- Clerk application
- API keys for the enabled agents

### Install

```bash
cd AI-agents
npm install

cd ../frontend
npm install
```

### Environment files

Create `AI-agents/.env`:

```env
GEMINI_API_KEY=your_gemini_key
WEATHER_API_KEY=your_weatherapi_key
NEWS_API_KEY=your_newsapi_key
TAVILY_API_KEY=your_tavily_key
MONGODB_URI=your_mongodb_connection_string
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_JWT_KEY=your_clerk_jwt_key
CORS_ORIGIN=http://localhost:5173
PORT=3000
```

Create `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
# Leave unset locally when using the Vite proxy.
# Set this for a separately hosted frontend:
# VITE_API_URL=https://ai-agents-pied.vercel.app/api
```

Never commit `.env`, `.env.local`, API keys, database credentials, or Clerk secrets.

### Run the application

Start the backend:

```bash
cd AI-agents
npm start
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Open http://localhost:5173.

### Verify locally

```bash
curl http://localhost:3000/api
npm run lint --prefix frontend
npm run build --prefix frontend
```

The protected conversation routes return `401` without a valid Clerk session. That is expected.

## Deployment

The production setup uses two Vercel projects:

- `ai-agents`: Express serverless API from `AI-agents/`
- `frontend`: Vite static frontend from `frontend/`

Set these frontend Production variables in Vercel:

```text
VITE_API_URL=https://ai-agents-pied.vercel.app/api
VITE_CLERK_PUBLISHABLE_KEY=<clerk-publishable-key>
```

Set these backend Production variables in Vercel:

```text
GEMINI_API_KEY
WEATHER_API_KEY
NEWS_API_KEY
TAVILY_API_KEY
MONGODB_URI
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_JWT_KEY
CORS_ORIGIN=https://frontend-omega-ruby-s9i8nou6sn.vercel.app
```

Deploy from each project directory:

```bash
cd AI-agents
npx vercel --prod

cd ../frontend
npx vercel --prod
```

After deployment, verify:

```bash
curl https://ai-agents-pied.vercel.app/api
```

## Security and Reliability

- Authentication is enforced server-side through Clerk; user IDs are scoped on every conversation query.
- CORS is restricted to the public frontend origin.
- Secrets are stored in Vercel environment variables and ignored locally.
- MongoDB connections are cached and reused across serverless invocations.
- The local Express listener is enabled only outside Vercel; Vercel uses the serverless export.
- External-service failures are converted into user-friendly API messages.

## Current Status

- Frontend and backend deployed publicly on Vercel.
- MongoDB, Clerk, Gemini, Weather, News, Tavily, GitHub, and blockchain flows connected.
- GitHub `master` branch is the source of truth.
- Production health endpoint verified with HTTP `200`.
- CORS preflight verified with HTTP `204`.

## License

This project is currently private-use software. Add a license before distributing it publicly.
