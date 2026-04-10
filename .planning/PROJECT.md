# Enjaz System 2026

## Overview
Modernization of the legacy WPF application into a scalable Web application tailored to issue and manage certificates (Enjaz 2026 Certificate Issuance Module).

## Architecture Context
- **Backend:** ASP.NET Core 8 Web API
- **Database:** SQLite (`enjaz.db`) with Entity Framework Core
- **Frontend:** React 18 (TypeScript) via Vite
- **Design System:** Minimalist / Liquid Adaptive Glass (Glassmorphism)

## Global Constraints
- Must maintain strict data integrity for certificates and legacy counters.
- UI must adhere strictly to the "Glassmorphism" enterprise specs.
- Timestamps must correctly persist in timezone-aware modes to avoid 00:00 output offsets.
