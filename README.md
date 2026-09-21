# Enterprise AI Agent Platform

A production-grade AI coding assistant I built from scratch — 5 Spring Boot microservices, real-time Gemini AI streaming, Kafka, PostgreSQL, Redis, and a React frontend. **Total cost: $0.**

---

## What I Built

I wanted to understand how enterprise AI platforms actually work at the infrastructure level — not just call an API and render text. So I designed and built a full system: JWT authentication, an event-driven audit trail, role-based analytics, GitHub CI/CD pipeline analysis via webhooks, and a streaming chat interface that feels like a real product.

Everything runs locally with Docker Compose. The only external dependency is a free Gemini API key.

---

## The 10-Step Plan

I broke the project into 10 discrete steps, each building on the last:

### Step 1 — Infrastructure Setup
Set up the entire project skeleton in one shot: 5 Spring Boot service directories, a root parent POM managing all versions centrally, Dockerfiles using multi-stage builds (compile with JDK, run with JRE as non-root), and a `docker-compose.yml` with PostgreSQL, Redis, and Kafka in KRaft mode (no Zookeeper). Added health checks and proper `depends_on` chains so services start in the right order.

**Why:** Starting with infrastructure means the system is always runnable, even before any features exist. It forces you to make real decisions about ports, networking, and secrets from day one.

### Step 2 — Auth Service
Built a complete authentication service with JWT access tokens (15-minute expiry) and UUID refresh tokens stored in PostgreSQL. Implemented bcrypt password hashing, Spring Security 6 filter chain with stateless sessions, role-based access (`ADMIN`, `DEVELOPER`, `VIEWER`), and a `/auth/me` endpoint for token introspection.

**Why:** Every other service needs to verify identities. Getting auth right first — and understanding why Spring Security 6 changed `403` vs `401` behavior — saved debugging time later.

### Step 3 — Agent Service
The core of the platform. Built a WebFlux reactive service that sends user prompts to the Gemini API and streams the response back using Server-Sent Events. Fixed a subtle WebFlux bug: `bodyToFlux(String.class)` on a `text/event-stream` response triggers Spring's SSE codec, which silently strips `data: ` prefixes before my filter ever sees them. Fixed with `bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<String>>() {})`. Also wired up session management (PostgreSQL), message history, and a GitHub webhook endpoint for CI/CD pipeline analysis.

**Why:** Streaming AI responses character-by-character creates a fundamentally different user experience than waiting for a complete response. The challenge was making reactive programming work correctly — no `block()` on reactor threads.

### Step 4 — Audit Service
A Kafka consumer service that listens for events published by the Agent Service and writes structured audit logs to PostgreSQL. Fixed a production bug where passing `null` `LocalDateTime` parameters to a JPQL `IS NULL` check caused PostgreSQL to throw "could not determine data type of parameter $3" — which triggered Spring's error forwarding, which cleared the security context, which caused a 403 on admin endpoints. Fixed by replacing the JPQL query with Java-level stream filtering.

**Why:** In enterprise systems, every action needs a paper trail. The Kafka + consumer pattern means audit logging never blocks the main request path.

### Step 5 — Analytics Service
Built a Redis-backed analytics aggregation service. The Agent Service publishes usage events (request count, token count) to Kafka; the Analytics Service consumes them and upserts daily summaries into PostgreSQL with Redis as a read-through cache. Exposed endpoints for per-user usage trends, pipeline run history, and admin-only team summaries.

**Why:** Understanding how the system is being used — which users are most active, which repos trigger the most pipeline analysis — is essential for operating any platform at scale.

### Step 6 — API Gateway
Configured Spring Cloud Gateway as the single entry point for all external traffic. All routes go through the gateway (`localhost:8080`), which verifies the JWT on every request before forwarding to the appropriate downstream service. The gateway decodes the token and injects `X-User-Id`, `X-User-Email`, and `X-User-Role` headers — downstream services trust these headers without needing to re-verify the JWT.

**Why:** Centralizing auth at the gateway means no service has to independently manage token verification. It's also the right place for rate limiting, CORS, and request logging.

### Step 7 — React Frontend
Built the chat UI in React with Vite and Tailwind. The biggest technical challenge was SSE streaming through the Vite dev proxy: the standard `EventSource` API only supports GET requests without custom headers, so I used `fetch` + `ReadableStream` instead. The Vite proxy buffered the SSE response by default; fixed with `selfHandleResponse: true` and manually piping `proxyRes` to `res`.

**Why:** The frontend is what makes the backend real. Getting streaming right — so text appears character by character instead of all at once — changes the whole feel of the product.

### Step 8 — GitHub Webhook Integration
The Agent Service exposes a `/agent/webhook/github` endpoint that GitHub calls on every push. It verifies the `X-Hub-Signature-256` HMAC signature, parses the push payload (added/modified/removed files), sends a structured diff summary to Gemini for analysis, and persists the result as a `PipelineResult`. The Analytics Service aggregates these runs by repository for the dashboard.

**Why:** CI/CD pipeline integration is what makes this an "enterprise" tool rather than a chat demo. Automatically analyzing every commit is a real use case.

### Step 9 — Dashboard & Analytics UI
Built the analytics dashboard in React using Recharts: a line chart for daily request volume, a second line chart for token usage, a bar chart for pipeline runs by repository, and an admin-only team summary table. All data is fetched from the Analytics Service and filtered by a configurable date range.

**Why:** Visibility into usage patterns is essential for operating the platform. The admin view gives a full picture of all team activity; the user view shows personal usage.

### Step 10 — E2E Testing & Production Hardening
Wrote a 29-test end-to-end shell script (`e2e-test.sh`) that registers users, logs in, hits every endpoint, and validates responses. Fixed macOS-specific bugs (`head -n -1` not supported, `grep` regex metacharacters). Hardened the reactive pipeline: replaced all `.block()` calls inside WebFlux with `flatMapMany` and `subscribeOn(Schedulers.boundedElastic())`. Added `onErrorResume` to Gemini streaming so errors appear as readable messages in the UI instead of silent failures.

**Why:** A platform that passes e2e tests is fundamentally different from one that "seems to work." The test script catches regressions and documents expected behavior in executable form.

---

## Architecture

```
                    ┌─────────────────────────────────────────┐
                    │           API Gateway :8080              │
                    │  (JWT verification · header injection)   │
                    └────┬──────────┬────────────┬────────────┘
                         │          │            │
              ┌──────────▼──┐  ┌────▼──────┐  ┌─▼────────────┐
              │ auth-service│  │agent-svc  │  │analytics-svc │
              │   :8081     │  │  :8082    │  │   :8084      │
              └──────────┬──┘  └────┬──────┘  └─────┬────────┘
                         │          │                │
                    ┌────▼──────────▼────────────────▼────┐
                    │              PostgreSQL              │
                    │  authdb · agentdb · auditdb          │
                    │  analyticsdb                         │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │         Kafka (KRaft mode)          │
                    │  agent-events · audit-events        │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │          audit-service :8083         │
                    │          (Kafka consumer)            │
                    └─────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI | Gemini API (free tier) — `gemini-2.5-flash-lite` |
| Backend | Spring Boot 3.2, Spring WebFlux, Spring Cloud Gateway |
| Auth | Spring Security 6, JJWT 0.12.5, BCrypt |
| Messaging | Apache Kafka (KRaft — no Zookeeper) |
| Persistence | PostgreSQL 15, Spring Data JPA, Hibernate |
| Cache | Redis 7 |
| Frontend | React 19, Vite, Tailwind CSS, Recharts |
| Infrastructure | Docker Compose, multi-stage Dockerfiles |
| Testing | Bash e2e test script (29 assertions) |

---

## Running It

**Prerequisites:** Docker, Java 17+, Maven, a free [Gemini API key](https://aistudio.google.com/)

```bash
# 1. Clone and configure
git clone https://github.com/yourusername/enterprise-ai-agent
cd enterprise-ai-agent
cp .env.example .env
# Edit .env — add GEMINI_API_KEY, set POSTGRES_PASSWORD and JWT_SECRET

# 2. Build and start everything
docker compose build
docker compose up -d

# Wait ~60 seconds for all services to become healthy
docker compose ps   # all 8 containers should show "healthy"

# 3. Start the frontend dev server
cd frontend
npm install
npm run dev         # http://localhost:5173

# 4. Run the e2e test suite
cd ..
bash e2e-test.sh    # 29/29 should pass
```

---

## Services & Ports

| Service | Port | Description |
|---|---|---|
| gateway-service | 8080 | Single entry point — all external traffic goes here |
| auth-service | 8081 | JWT auth, user registration, token refresh |
| agent-service | 8082 | Gemini AI chat, session management, GitHub webhooks |
| audit-service | 8083 | Kafka consumer, audit log persistence |
| analytics-service | 8084 | Usage metrics, pipeline analytics, Redis cache |
| PostgreSQL | 5432 | Primary database (4 schemas) |
| Redis | 6379 | Analytics cache |
| Kafka | 9092/9094 | Event bus (internal/external) |

---

## Key Technical Decisions

**Why WebFlux for the Agent Service?** Gemini streaming requires holding connections open for seconds while chunks arrive. WebFlux handles thousands of these concurrently on a small thread pool; traditional blocking servlets would exhaust threads immediately.

**Why Kafka instead of direct service calls?** Decoupling the audit trail from the request path means a slow audit write never delays the user's response. It also means audit and analytics services can be redeployed independently.

**Why KRaft mode for Kafka?** Zookeeper adds a third moving part for no gain at this scale. KRaft has been production-ready since Kafka 3.3 and simplifies the Docker setup considerably.

**Why JWT in memory only (no localStorage)?** Storing JWTs in localStorage exposes them to XSS attacks. Memory storage means the token is gone on page refresh — a deliberate security tradeoff for a platform that controls its own deployment environment.

---

## GitHub Webhook Setup

To enable automatic pipeline analysis on push:

1. In your GitHub repo: Settings → Webhooks → Add webhook
2. Payload URL: `https://your-public-url/agent/webhook/github`
3. Content type: `application/json`
4. Secret: the value of `GITHUB_WEBHOOK_SECRET` in your `.env`
5. Events: Just the push event

The agent will analyze every push and make results available via `/agent/pipeline/{repoName}/latest`.

---

## Project Structure

```
enterprise-ai-agent/
├── docker-compose.yml          # Full stack: 8 containers
├── pom.xml                     # Root parent POM
├── init-db.sql                 # Creates all 4 PostgreSQL databases
├── e2e-test.sh                 # 29 end-to-end tests
├── .env.example                # Template — copy to .env and fill in
├── gateway-service/            # Spring Cloud Gateway
├── auth-service/               # JWT auth + user management
├── agent-service/              # Gemini AI + webhooks
├── audit-service/              # Kafka consumer + audit logs
├── analytics-service/          # Usage metrics + Redis cache
└── frontend/                   # React + Vite + Tailwind
```

---

*Built entirely for free. Zero cloud costs. Zero compromises on the architecture.*
