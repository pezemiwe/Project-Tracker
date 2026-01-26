# System Architecture

## Overview

The Donor Investment Oversight Platform is a modern web application designed for performance, security, and scalability. It follows a client-server architecture with a clear separation of concerns.

## Tech Stack

| Layer          | Technology                     | Purpose                             |
| -------------- | ------------------------------ | ----------------------------------- |
| **Frontend**   | React 18, TypeScript           | UI Library & Type Safety            |
| **Build Tool** | Vite                           | Fast development & optimized builds |
| **State Mgmt** | TanStack Query                 | Server state management & caching   |
| **Routing**    | React Router / TanStack Router | Client-side routing                 |
| **Styling**    | Tailwind CSS                   | Utility-first styling               |
| **UI Lib**     | Radix UI / shadcn/ui           | Accessible component primitives     |
| **Backend**    | Node.js 20, Fastify            | High-performance API server         |
| **Database**   | PostgreSQL 15+                 | Relational data storage             |
| **ORM**        | Prisma                         | Typesafe database access            |
| **Storage**    | MinIO                          | S3-compatible object storage        |
| **Cache**      | Redis                          | Session storage & job queues        |
| **Scanning**   | ClamAV                         | Virus scanning for uploads          |

## Frontend Architecture (`/frontend`)

### Directory Structure

```
src/
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks (logic reuse)
├── lib/          # Utilities and API setup
├── pages/        # Route components
├── stores/       # Global client state (Zustand)
└── types/        # TypeScript definitions
```

### State Management

- **Server State**: Managed by **TanStack Query**. Handles data fetching, caching, synchronization, and optimistic updates.
- **Client State**: Minimal global client state using **Zustand** (e.g., for sidebar toggle, theme preference). Local state uses `useState`/`useReducer`.
- **Form State**: Managed by **React Hook Form** with **Zod** for schema validation.

### Authentication Flow

1. User logs in via `/api/auth/login`.
2. Server issues a strict HTTP-only cookie containing the session ID.
3. Frontend does not access the token directly (XSS protection).
4. Protected routes check for 401 responses and redirect to login.

## Backend Architecture (`/backend`)

### Directory Structure

```
src/
├── routes/       # API endpoints definition
├── services/     # Business logic layer
├── middleware/   # Request processing (Auth, RBAC)
└── utils/        # Helper functions
```

### Design Patterns

- **Service Repository Pattern**: Routes handle HTTP concerns, Services handle business logic, Prisma handles data access.
- **Dependency Injection**: Services are instantiated and injected where needed (or imported directly as singletons in simpler setups).

### Validation

- **Input Validation**: **Zod** is used to validate all incoming request bodies and query parameters.
- **Business Rules**: Implemented within Service methods.

## Data Model

### Core Entities

- **User**: System users with Roles.
- **Objective**: High-level goals (States/Regions).
- **Activity**: Specific tasks/projects linked to Objectives.
- **AnnualEstimate**: Financial planning per year.
- **Actual**: Recorded spend.
- **AuditLog**: Immutable record of all changes.

### Security

- **RBAC**: Middleware enforces role permissions on every route.
- **Pessimistic Locking**: An activity is "locked" when a user starts editing it to prevent overwrites. Lock expires after timeout or on release.

## Infrastructure

### Docker Compose

Orchestrates the environment:

- `postgres`: Data persistence.
- `redis`: Session store.
- `minio`: File storage.
- `clamav`: Security scanning.
- `backend`: API server.

### Error Handling

- **Frontend**: Global `ErrorBoundary` catches crashes. API errors are displayed via Toasts or execution-specific error messages.
- **Backend**: Global error handler formats exceptions into standard JSON responses (500, 400, 401, 403).
