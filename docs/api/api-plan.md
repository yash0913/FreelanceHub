# FreelanceHub - API Plan

This document details the layout, naming conventions, and structural separation of the future FreelanceHub REST API.

---

## 1. REST API Routing Organization
All API endpoints will be prefixed with `/api/v1` to support potential versioning. Routes are organized around resources:

| HTTP Verb | Endpoint | Handler Action | Access Controller |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/auth/signup` | Register new user account | Guest |
| **POST** | `/api/v1/auth/login` | Authenticate user, return JWT | Guest |
| **GET** | `/api/v1/freelancers` | List/search freelancer profiles | Public/All |
| **GET** | `/api/v1/freelancers/:id` | Get details of a single freelancer | Public/All |
| **PUT** | `/api/v1/freelancers/profile` | Update own freelancer profile | Freelancer |
| **GET** | `/api/v1/jobs` | Search & browse jobs | Public/All |
| **POST** | `/api/v1/jobs` | Post a new job listing | Customer |
| **GET** | `/api/v1/jobs/:id` | View job details | Public/All |
| **POST** | `/api/v1/jobs/:id/proposals` | Submit proposal for a job | Freelancer |
| **GET** | `/api/v1/jobs/:id/proposals` | View proposals submitted to a job | Customer (Owner) |
| **PUT** | `/api/v1/proposals/:id` | Accept/Reject a proposal | Customer (Owner) |
| **POST** | `/api/v1/contracts` | Create contract (accept proposal) | Customer |
| **GET** | `/api/v1/contracts/:id` | View contract progress | Customer/Freelancer |
| **POST** | `/api/v1/contracts/:id/reviews` | Submit rating & review for contract | Customer/Freelancer |
| **POST** | `/api/v1/search/nl` | Search database via Natural Language | All Authenticated |
| **GET** | `/api/v1/admin/moderation` | List flags & disputed contracts | Admin |

---

## 2. Layers of Separation
Every API module follows a strict division of responsibility to keep controllers and routes lean:

```
[Request] -> [Express Router] -> [Auth Middleware] -> [Controller] -> [Service] -> [Prisma DB]
                                                                        |
[Response] <- [JSON Payload] <---------------------- [Controller] <-----+
```

### 1. Routes (e.g., `src/routes/jobRoutes.js`)
- Configures paths and HTTP verbs.
- Imports middlewares (e.g., `authenticateJWT`, `requireRole('CUSTOMER')`).
- Passes incoming request handling directly to Controller methods.
- **Rules:** No database queries, no validation computations, and no business logic are written here.

### 2. Controllers (e.g., `src/controllers/jobController.js`)
- Inspects headers, parameters, and bodies (`req.params`, `req.body`, `req.user`).
- Validates the presence of inputs.
- Calls appropriate functions in the Service layer.
- Catches errors and routes them to Express' global error handling middleware, or responds directly using standard JSON response schemas.
- **Rules:** No database queries or calculations are done here. The controller knows about HTTP requests and responses, but nothing about Prisma logic.

### 3. Services (e.g., `src/services/jobService.js`)
- Houses the core business algorithms (e.g., checking if the customer has sufficient funds, checking if the job is already closed).
- Connects to `prisma` Client to query/modify data in MySQL.
- Throws specific logical exceptions when validation fails.
- **Rules:** No references to Express `req` or `res` objects. This ensures that the services are modular and can be reused in cron scripts, tests, or command-line CLI helpers without HTTP context.
