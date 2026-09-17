# 🛒 NestJS Commerce API

A production-ready E-commerce RESTful API built with modern backend technologies.

## 🚀 Tech Stack
- **Framework:** NestJS (v11)
- **Database:** PostgreSQL with Prisma 8
- **Background Jobs:** Redis + BullMQ
- **Authentication:** JWT (JSON Web Token)
- **Logging & Monitoring:** Pino Logger & Terminus Health Checks

---

## ⚙️ How to run locally (Zero-Config)

We use **Docker Compose** to automatically spin up the required infrastructure (PostgreSQL & Redis). No need to install databases locally!

### Prerequisites
- [Node.js](https://nodejs.org/) (v24 or later)
- [Docker & Docker Compose](https://www.docker.com/)

### 1-Click Setup

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd nest-commerce-api
   ```

2. **Start the Infrastructure (Database & Redis):**
   ```bash
   docker compose up -d
   ```

3. **Run the Automated Setup Script:**
   This command will automatically create the `.env` file, install dependencies, migrate the database schema, and seed the mock data.
   ```bash
   npm run setup
   ```
   *(Note for Windows users: if `cp` is not recognized in the setup script, you can manually copy `.env.example` to `.env`, then run `npm install`, database push, and `npm run seed`)*.

4. **Start the Development Server:**
   ```bash
   npm run start:dev
   ```

---

## 📖 API Documentation
Once the server is running, you can interact with the APIs via the built-in Swagger UI:

👉 **[http://localhost:3000/docs](http://localhost:3000/docs)**

### Available Endpoints
- `POST /auth/register` - Create a new user account
- `POST /auth/login` - Login and get JWT token
- `GET /products` - Get a list of all products (with Categories)
- `POST /orders/checkout` - Checkout the cart (requires JWT)
- `GET /health` - System health check (DB & Redis)
