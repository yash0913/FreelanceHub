# FreelanceHub Backend Server Scaffold

This contains the Node.js + Express backend scaffolding for the FreelanceHub application.

---

## 1. Directory Structure and Modules Purpose

```
src/
├── config/       # Global configuration files (database pool setup, auth rules, env parsers)
├── controllers/  # Receives HTTP requests, calls services, sends JSON responses
├── middleware/   # Request interception (JWT verification, role guards, validation, errors)
├── routes/       # API endpoints URL maps (defines HTTP verbs and maps to controllers)
├── services/     # Core domain business logic (decoupled from Express parameters)
└── utils/        # Generic, reusable server functions (loggers, token formatters)
```

---

## 2. Decoupling Business Layers
To ensure maximum scalability, routes, controllers, and services are strictly decoupled:

- **Express Router:** Binds incoming requests to a specific path and forwards to the controller.
- **Controller:** Translates HTTP payloads (`req.body`, `req.params`) into parameters, invokes a Service method, and uses the return value to create a response object (`res.status().json()`).
- **Service:** Houses code calculations, logical checks, database access patterns, and throws standard JavaScript exceptions when operations fail. Decoupling services from HTTP libraries allows them to be used in shell scripts, tests, or migration CLI routines.

---

## 3. Understanding MySQL vs Prisma

- **MySQL** is the actual **relational database management system**. It resides in a distinct process, listens on a server socket, and holds table schemas, indexes, and row entries.
- **Prisma** is an **Object-Relational Mapper (ORM)** and database client library. The Express backend uses Prisma to formulate queries in JavaScript, which are automatically translated by Prisma into performance-tuned SQL strings.
- **IMPORTANT:** Prisma is not a database. You must run a MySQL instance for Prisma to query.
