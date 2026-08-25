# FreelanceHub - Project Architecture

This document provides a detailed explanation of FreelanceHub's software architecture, including frontend-backend boundaries, server-side design, and the planned natural-language-to-SQL processing pipeline.

---

## 1. Overall System Architecture
FreelanceHub is built as a classic **Three-Tier Architecture**:

```
[Presentation Tier]          React SPA (Vite + HTML5)
        ↕
[Application Tier]           Node.js + Express REST API
        ↕
[Data Storage Tier]          MySQL Database (accessed via Prisma ORM)
```

By decoupling these three tiers, we ensure that changes to the user interface do not break backend logic, and changes to database implementation details do not impact presentation formatting.

---

## 2. Frontend / Backend Separation
The project maintains strict separation of concerns between `client/` and `server/`:

- **Decoupled Repositories:** The client and server are treated as distinct apps. The React app is compiled into static html, css, and JS files, while the Express app runs as a standalone daemon.
- **Stateless REST Communication:** Communication occurs exclusively over HTTP/HTTPS protocol using Axios. The backend does not maintain stateful sessions via cookie-sessions; it relies on stateless **JSON Web Tokens (JWT)** passed in the HTTP Authorization header (`Authorization: Bearer <token>`).
- **CORS Configuration:** Direct cross-origin Resource Sharing (CORS) is enabled on the Express server to selectively permit connections from the frontend dev environment.

---

## 3. Backend Layered Architecture
To prevent "spaghetti code" and monolithic files, the backend uses a modular, layered routing-controller-service-database design. When a request hits the Express server, it propagates through these layers:

1. **Routing Layer (`src/routes/`):**
   - Captures incoming HTTP requests based on URL paths and HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`).
   - Delegates requests to appropriate controllers.
   - Applies route-specific middleware (e.g., authentication, request validation).

2. **Middleware Layer (`src/middleware/`):**
   - Performs cross-cutting concerns like verifying JWT tokens, checking user roles (Customer vs. Freelancer vs. Admin), logging requests, and handling errors.

3. **Controller Layer (`src/controllers/`):**
   - Serves as the interface between Express HTTP wrappers and core business logic.
   - Unpacks incoming parameters, request bodies, query parameters, and authenticated user headers.
   - Calls the appropriate services and sends formatted JSON payloads back to the client with suitable HTTP status codes (e.g., `200 OK`, `201 Created`, `400 Bad Request`, `500 Internal Error`).

4. **Service Layer (`src/services/`):**
   - Contains raw business rules, data verification calculations, and workflow processing.
   - Does not have access to Express `req` or `res` objects, making these functions easily testable.
   - Interfaces directly with Prisma ORM to interact with the database.

5. **Prisma Client Database Layer (`prisma/` & `@prisma/client`):**
   - Automatically handles queries and connection pools to MySQL.

---

## 4. Why the Project is Modular
FreelanceHub is structured to grow. Rather than dumping all controllers into a single controller folder, files are separated by domain module:
- **Authentication (`auth/`)**
- **Users and Profiles (`users/`, `freelancers/`)**
- **Job Market (`jobs/`, `proposals/`, `projects/`)**
- **Moderation and Trust (`reviews/`, `admin/`)**
- **Natural Language Parsing (`nlp/`)**

This ensures developers can easily work on individual modules concurrently without causing massive merge conflicts.

---

## 5. Future Natural Language (NLP) to SQL Pipeline
In later steps, FreelanceHub will support search queries written in natural English. The pipeline to generate, execute, and display results safely is designed as follows:

```
+---------------------------+
| User enters search query  |  (e.g., "Find Web Devs with React skills rated > 4.5")
+---------------------------+
              |
              v
+---------------------------+
|      React Frontend       |  (Sends raw query string to REST endpoint)
+---------------------------+
              | (POST /api/search/nl)
              v
+---------------------------+
|  nlpRoutes & Controller   |  (Extracts text body and validates input parameters)
+---------------------------+
              |
              v
+---------------------------+
|    nlpService Parser      |  (Tokenizes keywords, identifies intents like "Find Web Devs",
+---------------------------+   filters like "React", and metrics like "rating > 4.5")
              |
              v
+---------------------------+
|  sqlGenerationService     |  (Builds dynamic parameterized Prisma database query structure
+---------------------------+   or generates raw SQL strings with secure parameter escaping)
              |
              v
+---------------------------+
|        Prisma ORM         |  (Executes secure parameter-mapped query on MySQL database)
+---------------------------+
              |
              v
+---------------------------+
|      MySQL Database       |  (Computes relational query and returns JSON matching record set)
+---------------------------+
              |
              v
+---------------------------+
|     Response Return       |  (Data flows back through Controller as JSON to React frontend)
+---------------------------+
```

### Critical Security Constraints
1. **No SQL Injection:** Under no circumstances will dynamic query strings containing raw user inputs be executed directly. All NLP queries will be mapped to structured query parameters (using Prisma filters or sanitized SQL parameters).
2. **Modularity:** The SQL Generation layer will be built as an isolated service. If we decide to swap out the NLP processor later, the database client and frontend UI will remain untouched.
