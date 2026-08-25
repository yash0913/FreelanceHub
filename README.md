# FreelanceHub

FreelanceHub is a full-stack academic DBMS marketplace mini-project. It is designed to act as a production-style marketplace connecting customers with freelancers, complete with authentication, role-based authorization, profile management, natural-language search, and an NLP-to-SQL generation engine.

## Current Development Phase: STEP 0

This is **STEP 0** of the FreelanceHub project. 
The objective of this phase is strictly to establish a clean, scalable, and modular project architecture and directory structure. 
**No business logic, authentication, mock databases, or NLP processing are implemented in this step.**

---

## Technology Stack

### Frontend
- **Framework:** React.js (via Vite)
- **Language:** JavaScript (ES6+)
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS
- **API Client:** Axios
- **Icons:** Lucide React

### Backend
- **Framework:** Node.js & Express.js
- **Language:** JavaScript
- **API Style:** REST API

### Database & ORM
- **Database:** MySQL
- **Database Toolkit / ORM:** Prisma ORM

### Security & Authentication (Future Phase)
- **JWT:** JSON Web Tokens for authorization
- **Bcrypt:** Bcryptjs for secure password hashing

---

## System Architecture

### Application Architecture
```
React Frontend
       ↓ (HTTP REST Requests via Axios)
REST API Route Endpoint
       ↓
Node.js + Express Backend
       ↓ (Prisma Client API Calls)
Prisma ORM
       ↓ (SQL Queries via TCP/IP)
MySQL Database
```

### Future Natural Language Processing Architecture
When natural language querying is introduced in a future step, it will follow this modular pipeline:
```
User Natural Language Query
       ↓ (Submit Search Query)
React Frontend
       ↓ (POST /api/search/nl)
Backend API Controller
       ↓ (Route to NLP engine)
NLP / Intent Processing Service
       ↓ (Extract tables, filters, sort orders)
Structured Query Parameters (JSON)
       ↓ (Build dynamic SQL queries safely)
SQL Query Generation Service
       ↓ (Send raw SQL or parameterized queries)
Prisma / MySQL
       ↓ (Fetch raw dataset)
Database Results
       ↓ (Format response as JSON)
Backend Controller
       ↓ (Send JSON response)
React Frontend (Render dashboard/results table)
```

---

## Directory Structure

```
FreelanceHub/
├── client/                 # Vite React Frontend application
│   ├── public/             # Static assets (favicons, manifest.json, etc.)
│   └── src/                # React Source code
│       ├── assets/         # App-wide media assets and styling
│       ├── components/     # Reusable components (buttons, input fields, etc.)
│       ├── layouts/        # Frame layouts (AuthLayout, MainLayout, AdminLayout)
│       ├── pages/          # Domain-specific page templates
│       │   ├── auth/       # Login and signup pages
│       │   ├── customer/   # Customer views (post job, view contracts)
│       │   ├── freelancer/ # Freelancer views (browse jobs, write proposals)
│       │   └── admin/      # Admin moderation views
│       ├── routes/         # Router configuration and path definitions
│       ├── services/       # Service layer for REST API requests (Axios)
│       ├── context/        # React context (Auth context, Toast notification context)
│       ├── hooks/          # Reusable custom React hooks
│       ├── utils/          # Frontend helper utilities
│       ├── App.jsx         # App component (manages router paths)
│       └── main.jsx        # App mounting configuration
│
├── server/                 # Express Backend application
│   ├── prisma/             # Prisma schema database config and migrations
│   │   ├── schema.prisma   # Relational models definitions
│   │   └── seed.js         # Initial seed file
│   └── src/                # Express Source code
│       ├── config/         # App-wide configurations (cors, environment vars)
│       ├── controllers/    # Controller layer handling HTTP requests and responses
│       ├── middleware/     # Auth, logs, validation, error-handling middlewares
│       ├── routes/         # Express endpoint definitions
│       ├── services/       # Core business/domain logic
│       ├── utils/          # Server utilities (error formatting, logger)
│       ├── app.js          # Express app configurations
│       └── server.js       # App listener bootstrap file
│
├── docs/                   # Planning and architectural blueprints
│   ├── architecture/       # Project-wide architecture overview
│   ├── database/           # Relational schema plans & Prisma blueprints
│   └── api/                # API REST endpoint specification maps
│
├── .gitignore              # Files excluded from git control
├── README.md               # Monorepo root guide (this document)
└── package.json            # Workspace script manager
```

---

## Understanding MySQL vs Prisma

For full-stack developers, it is vital to distinguish between the database and the ORM tool:
- **MySQL** is the actual **relational database management system (RDBMS)**. It runs as an independent database server, stores raw tables and data on disk, and executes SQL commands.
- **Prisma** is a **Database Toolkit / ORM (Object-Relational Mapper)**. It is a Node.js library used by the backend code to write queries to MySQL without writing verbose SQL strings. Prisma translates Node.js method calls (`prisma.job.findMany()`) into optimized SQL statements, maps SQL tables into strongly-typed JavaScript objects, and manages migrations automatically. **Prisma is not a database.**

---

## Future Development Roadmap

- **STEP 0 (Current):** Setup scaffolding, configure Prisma client for MySQL, and compose structural guides.
- **STEP 1 (Database Design & Seed):** Build relational database schemas, execute Prisma migrations, and design mock database data using `seed.js`.
- **STEP 2 (Backend REST APIs):** Implement controllers, middleware, and services for auth, profiles, and basic marketplace functionality.
- **STEP 3 (Frontend Marketplace):** Develop UI screens, layouts, forms, and hooks in React to interact with backend services.
- **STEP 4 (NLP Query Integration):** Integrate NLP parser, build SQL generation utilities, and build natural language database search options.
