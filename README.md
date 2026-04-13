# 🏗️ ENJAZ WEB v1.0.0

> **Enterprise Laboratory Information Management System (LIMS)**  
> Radiation Protection Authority — منظومة إنجاز ويب

[![.NET 8](https://img.shields.io/badge/.NET-8.0-purple)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-red)](https://redis.io/)

---

## 📋 Overview

ENJAZ is a comprehensive web-based LIMS designed for managing radiation measurement certificates, sample reception, and quality control workflows. Built with enterprise-grade security, scalability, and Arabic-first RTL interface.

### Key Features

| Feature | Description |
|---------|-------------|
| 📦 **Sample Reception** | Track incoming samples with full metadata |
| 📜 **Certificate Issuance** | Generate PDF certificates with isotope measurements |
| 📊 **Reports & Analytics** | Visual dashboards with charts and export capabilities |
| 👥 **User Management** | Role-based access control (RBAC) with audit trails |
| 🔔 **Real-time Alerts** | SignalR-powered notification system |
| 📝 **Referral Letters** | Batch generate referral letters with QR codes |

---

## 🏛️ Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────►│   Backend    │────►│  PostgreSQL   │
│  React + TS  │     │  .NET 8 API  │     │     16        │
│  Vite + RTL  │     │  Serilog     │     └──────────────┘
└──────────────┘     │  Hangfire    │     ┌──────────────┐
                     │  SignalR     │────►│   Redis 7    │
                     └──────────────┘     │  Cache+Rate  │
                                          └──────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite |
| **Backend** | ASP.NET Core 8 (Web API) |
| **Database** | PostgreSQL 16 (primary) |
| **Cache** | Redis 7 (distributed cache + rate limiting) |
| **Background** | Hangfire (job scheduling) |
| **PDF** | QuestPDF (certificate generation) |
| **Logging** | Serilog (structured JSON logs) |
| **Real-time** | SignalR (WebSocket alerts) |

---

## 🚀 Quick Start

### Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 1. Start Infrastructure

```bash
docker compose up db redis -d
```

### 2. Start Backend

```bash
cd backend
dotnet restore
dotnet run
# → http://localhost:5144
# → Health: http://localhost:5144/health
# → Hangfire: http://localhost:5144/hangfire (dev only)
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Default Admin

| Field | Value |
|-------|-------|
| **Username** | `admin` |
| **Password** | Auto-generated on first startup (check backend logs) |

---

## 📁 Project Structure

```
enjaz-web/
├── backend/                  # ASP.NET Core 8 API
│   ├── Controllers/          # API endpoints
│   ├── Data/                 # EF Core context + migrations
│   ├── Middleware/            # Exception, audit, security, rate limiting
│   ├── Models/               # Domain entities + DTOs
│   ├── Services/             # Business logic
│   ├── Hubs/                 # SignalR hubs
│   └── BackgroundServices/   # Hosted services
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── store/            # Zustand state stores
│   │   └── services/         # API client
│   └── public/               # Static assets
├── docker-compose.yml        # Infrastructure services
└── secrets/                  # Docker secrets (gitignored)
```

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT (30min access + refresh tokens) |
| **RBAC** | Admin / User roles with granular permissions |
| **Rate Limiting** | Redis-backed (100 req/min API, 10 req/min auth) |
| **Idempotency** | X-Idempotency-Key header for mutation safety |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, CSP, etc. |
| **Audit Trail** | All mutations logged with user, IP, timestamp |
| **Password** | bcrypt hashing with configurable work factor |

---

## 📊 Health & Monitoring

```bash
# Health check
curl http://localhost:5144/health

# Structured logs
tail -f backend/logs/enjaz-*.log
```

### Health Check Components

| Component | Endpoint |
|-----------|----------|
| PostgreSQL | `/health` (tag: ready) |
| Redis | `/health` (tag: ready) |

---

## 🔧 Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `ConnectionStrings:DefaultConnection` | PostgreSQL connection | localhost:5432 |
| `ConnectionStrings:Redis` | Redis connection | localhost:6379 |
| `Jwt:Key` | JWT signing key | (required) |
| `Jwt:Issuer` | JWT issuer | EnjazApi |
| `Jwt:Audience` | JWT audience | EnjazWeb |

---

## 📝 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Authenticate user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/samples` | List sample receptions |
| POST | `/api/samples` | Create sample reception |
| GET | `/api/certificates` | List certificates |
| POST | `/api/certificates` | Issue certificate |
| GET | `/api/reports/summary` | Report dashboard data |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/health` | System health check |

---

## 📌 Versioning

This project follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
1.0.0 — Initial production release (Core-A + Core-B)
```

---

## 📄 License

Proprietary — Radiation Protection Authority © 2026
