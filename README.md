# Amanah - Family Savings Planner

Amanah (Arabic for "Trust") is a full-stack web application for managing family savings, goals, and investments for each child. It includes a gamified child-facing experience with a virtual pet system and achievement levels.

## Tech Stack

**Frontend**
- Next.js 16 (React 19) with TypeScript
- Tailwind CSS, Radix UI, Recharts

**Backend**
- Spring Boot 3.4.3 (Java 21)
- Spring Data JPA + Spring Security
- PostgreSQL on Supabase
- Stripe (monthly subscription payments)

**Infrastructure**
- Docker + Docker Compose

## Features

### Parent Side
- **Child Management** — Add, edit, and delete child profiles with photos and date of birth
- **Savings Goals** — Set goals by type (University, Car, Wedding, Business, General) with target amounts and deadlines
- **Contributions** — Record manual contributions or activate automated monthly payments via Stripe
- **Investment Portfolios** — Configure Conservative (4%), Balanced (7%), or Growth (10%) strategies
- **Fund Directives** — Store guardian info and future instructions for each child's funds
- **Dashboard Analytics** — Family-wide savings summary, progress tracking, and projections

### Child Side
- **Virtual Pet** — A pet (bunny, cat, dragon, fox, or dog) that evolves through 5 stages as savings grow: Egg → Egg (cracked) → Sprout → Lightning → Star
- **Personal Goals** — Children create their own savings goals with emoji categories (bicycle, gadget, trip, etc.)
- **Achievement Levels** — 8-level system tied to total savings: Starter → Saver → Explorer → Achiever → Champion → Legend → Master → Grand Master
- **Pet Store** — Spend earned coins on hats, outfits, and toys to customise the pet

## Getting Started

### Prerequisites

- Node.js 20+
- Java 21
- Maven
- A Supabase project with the required schema (see `schema.sql`)
- A Stripe account (test mode supported)

### Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8742
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

The backend reads its secrets from environment variables (no secrets are stored in `application.properties`):

```env
SUPABASE_DB_PASSWORD=
JWT_SECRET=                      # min 32 characters, used to sign JWT tokens
CORS_ORIGINS=http://localhost:4173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

### Run Locally

**Backend**

```bash
cd backend
mvn spring-boot:run
```

Or build and run the jar:

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
Backend: [http://localhost:8742](http://localhost:8742)

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
│       ├── filter/         # JWT auth filter
│       └── config/         # Security + CORS config
├── schema.sql              # Supabase database schema
├── docker-compose.yml
└── package.json
```

## API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT token |

### User
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/me` | Get current user profile |
| PUT | `/api/me` | Update user profile |

### Children
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/children` | List all children |
| POST | `/api/children` | Create a child |
| GET | `/api/children/{id}` | Child details with savings and goals |
| PUT | `/api/children/{id}` | Update child |
| DELETE | `/api/children/{id}` | Delete child and all related data |
| POST | `/api/children/{id}/goal` | Create or update savings goal |
| POST | `/api/children/{id}/contribute` | Add a manual contribution |
| POST | `/api/children/{id}/investment` | Configure investment portfolio |
| GET/POST | `/api/children/{id}/directive` | Get or set fund directive |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Family-wide savings summary |

### Personal Goals (child user)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/my-goals` | List personal goals for the logged-in child |
| POST | `/api/my-goals` | Create a personal goal |
| PUT | `/api/my-goals/{id}` | Update a personal goal |
| DELETE | `/api/my-goals/{id}` | Delete a personal goal |
| POST | `/api/my-goals/{id}/contribute` | Contribute to a personal goal |

### Stripe
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/stripe/setup-intent` | Create a Stripe SetupIntent (returns client secret) |
| POST | `/api/stripe/subscribe/{childId}` | Activate monthly payments for a child |
| DELETE | `/api/stripe/subscribe/{childId}` | Cancel monthly payments for a child |
| POST | `/api/stripe/webhook` | Stripe webhook handler |

## Authentication Flow

1. User registers or logs in via `/api/auth/signup` or `/api/auth/login`
2. Backend validates credentials, issues a signed JWT (HMAC256)
3. Frontend stores the token and sends it as `Authorization: Bearer <token>` on every request
4. `JwtAuthFilter` decodes the token, extracts the user UUID, and sets the Spring Security context
5. All endpoints require authentication except `/api/auth/**` and `/api/stripe/webhook`

## Currency

All monetary values use **Bahraini Dinar (BHD)**. BHD is a 3-decimal currency (1 BHD = 1000 fils), so amounts are stored and sent to Stripe multiplied by 1000.
