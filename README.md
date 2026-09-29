# Astra

**A thoughtful AI workbench for research, writing, learning, coding, and everyday problem-solving.** Astra combines a general-purpose assistant with specialist tools for live weather, recent news, public GitHub data, cryptocurrency prices, and web research.

The product is being built as an extensible multi-sector assistant. The current release is an early foundation: sector focus modes guide general Gemini responses, while only the listed specialist integrations retrieve external data. Healthcare, law, public services, finance, agriculture, and other sector modes provide general information and planning support; they do not connect to official case systems or replace qualified professionals.

## Product experience

- Clerk sign-in and account-scoped conversation history.
- Conversation titles, recent history, and rolling context summaries.
- General assistant mode plus focus areas for research, writing, coding, learning, business, data analysis, health information, law/public services, finance learning, science/climate, agriculture, and languages.
- Specialist routing for weather, current news, public GitHub profiles/repositories, crypto prices, and web search.
- Markdown responses, code copying, keyboard send shortcut, mobile navigation, reduced-motion support, and a responsive chat workspace.
- High-impact topic framing that asks users to verify consequential decisions with qualified or official sources.

## Architecture

```text
Browser (React + Vite + Clerk)
    └── HTTPS + Clerk session token
        └── Express API (Vercel or local Node.js)
            ├── Clerk authentication and account scoping
            ├── MongoDB conversation history and summaries
            ├── Gemini intent routing and answer generation
            └── Specialist services: WeatherAPI, NewsAPI, GitHub, Tavily, CoinGecko
```

```text
AI-agents/
  agents/       Specialist agents and general expert agent
  api/          Vercel function entry points
  config/       MongoDB connection
  models/       Mongoose conversation schema
  router/       Agent selection and route validation
  services/     Gemini, external data, and memory helpers
  index.js      Express app and local server
frontend/
  src/          React experience, styling, and app entry point
```

## Requirements

- Node.js 20 or later
- MongoDB database
- Clerk application keys
- Gemini API key
- Optional provider keys for WeatherAPI, NewsAPI, and Tavily

GitHub public profile/repository lookup and CoinGecko price lookup currently use public endpoints. Provider rate limits and terms still apply.

## Local setup

Install each application separately:

```bash
cd AI-agents
npm install

cd ../frontend
npm install
```

Create `AI-agents/.env`:

```env
GEMINI_API_KEY=
WEATHER_API_KEY=
NEWS_API_KEY=
TAVILY_API_KEY=
MONGODB_URI=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_KEY=
CORS_ORIGIN=http://localhost:5173
PORT=3000
```

Create `frontend/.env`:

```env
VITE_CLERK_PUBLISHABLE_KEY=
# Leave empty locally to use the Vite proxy.
# Set to https://your-api-domain.example/api for a separate frontend deployment.
VITE_API_URL=
```

Start the API and frontend in separate terminals:

```bash
cd AI-agents
npm run dev
```

```bash
cd frontend
npm run dev
```

Open the local Vite URL shown in the frontend terminal. Never commit `.env` files, API keys, database credentials, or authentication secrets.

## API routes

The API is mounted beneath `/api` on Vercel and proxied locally by Vite.

| Method | Route | Authentication | Purpose |
| --- | --- | --- | --- |
| GET | `/api` | No | Health response |
| GET | `/api/conversations` | Clerk | List the signed-in user's conversations |
| POST | `/api/conversations` | Clerk | Create a conversation |
| GET | `/api/conversation/:id` | Clerk | Load one owned conversation |
| DELETE | `/api/conversation/:id` | Clerk | Delete one owned conversation |
| POST | `/api/chat` | Clerk | Route a question, answer it, and save history |

Chat request body:

```json
{
  "conversationId": "your-conversation-id",
  "message": "Help me understand how solar panels work",
  "sector": "science"
}
```

`sector` is optional and defaults to `auto`. The API accepts focus modes such as `writing`, `coding`, `education`, `business`, `data`, `healthcare`, `law`, `finance`, `science`, `agriculture`, and `languages`. A focus guides the answer; it does not imply a certified professional service or an official sector integration.

## Deployment

The intended deployment uses separate Vercel projects for `AI-agents/` and `frontend/`.

Set the frontend production variables:

```text
VITE_API_URL=https://your-api-domain.example/api
VITE_CLERK_PUBLISHABLE_KEY=<Clerk publishable key>
```

Set the backend production variables listed in the local setup section and set `CORS_ORIGIN` to the exact frontend origin. Configure Clerk's allowed domains and redirect URLs for the deployed site.

## Product maturity and next platform work

A worldwide multi-sector assistant needs more than a chat interface. Before positioning Astra for government or regulated organizational use, the platform still needs verified sector-specific sources and integrations, organization/workspace controls, roles and permissions, audit trails, retention and deletion policies, accessibility and localization reviews, robust rate/cost controls, monitoring, security review, and documented quality evaluations. Those capabilities should be designed and shipped as explicit product work rather than implied by a sector label.
