# Amanah - Family Savings Planner

Amanah (Arabic for "Trust") is a full-stack web application for managing family savings, goals, and investments for each child.

## Tech Stack

**Frontend**
- Next.js 16 (React 19) with TypeScript
- Tailwind CSS, Radix UI, Recharts
- Supabase Auth (JWT)

**Backend**
- Spring Boot 3.4.3 (Java 21)
- Spring Data JPA + Spring Security
- PostgreSQL on Supabase

**Infrastructure**
- Docker + Docker Compose

## Features

- **Child Management** — Add, edit, and delete child profiles
- **Savings Goals** — Set goals by type (University, Car, Wedding, Business, General) with target amounts and dates
- **Contributions** — Track manual and automatic contributions per child
- **Investment Portfolios** — Configure Conservative (4%), Balanced (7%), or Growth (10%) strategies
- **Fund Directives** — Store guardian info and future instructions for each child's funds
- **Dashboard Analytics** — Family-wide savings summary, progress tracking, and projections

## Getting Started

### Prerequisites

- Node.js 20+
- Java 21
- Maven
- A Supabase project with the required schema

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Configure the backend in `backend/src/main/resources/application.properties` or via environment:

```env
SUPABASE_DB_PASSWORD=<password>
SUPABASE_JWT_SECRET=<jwt_secret>
CORS_ORIGINS=http://localhost:3000
```

### Run Locally

**Backend**

```bash
cd backend
mvn clean package -DskipTests
java -jar target/amanah-backend-0.0.1-SNAPSHOT.jar
```

**Frontend**

```bash
npm install
npm run dev
```

Frontend: [http://localhost:3000](http://localhost:3000)
Backend: [http://localhost:8080](http://localhost:8080)

### Run with Docker

```bash
docker-compose up
```

## Project Structure

```
Amanah/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Login / Register
│   └── dashboard/          # Dashboard + child detail pages
├── components/             # Reusable React components
├── lib/                    # Auth context, app context, utilities
├── hooks/                  # Custom React hooks
├── backend/                # Spring Boot application
│   └── src/main/java/com/amanah/
│       ├── controller/     # REST controllers
│       ├── service/        # Business logic
│       ├── repository/     # JPA repositories
│       ├── entity/         # JPA entities
│       └── security/       # JWT filter + security config
├── docker-compose.yml
└── package.json
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get user profile |
| PUT | `/api/me` | Update user profile |
| GET | `/api/children` | List all children |
| POST | `/api/children` | Create a child |
| GET | `/api/children/{id}` | Child details with savings and goals |
| PUT | `/api/children/{id}` | Update child |
| DELETE | `/api/children/{id}` | Delete child |
| POST | `/api/children/{id}/goal` | Create or update goal |
| POST | `/api/children/{id}/contribute` | Add a contribution |
| POST | `/api/children/{id}/investment` | Configure investment portfolio |
| GET/POST | `/api/children/{id}/directive` | Get or set fund directive |
| GET | `/api/dashboard` | Dashboard summary data |

## Authentication Flow

1. User signs in via Supabase Auth on the frontend
2. Supabase issues a JWT access token
3. Frontend sends the token as `Authorization: Bearer <token>`
4. Backend decodes the JWT, extracts the user UUID, and sets the security context
5. All endpoints require authentication except `/actuator/health`
