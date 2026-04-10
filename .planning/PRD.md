# [PRD] Enjaz System 2026 - Enterprise Certificate Management

## 1. Project Overview
**Enjaz System 2026** is the modernization of the legacy WPF-based certificate issuance infrastructure into a high-performance, responsive web platform. The system serves as the central authority for tracking sample receptions and issuing formal radiation safety/compliance certificates.

### 1.1 Core Objectives
*   **Digital Transformation:** Replace paper-heavy legacy workflows with a real-time digital system.
*   **Data Integrity:** Ensure 100% accuracy between reception records and issued certificates.
*   **Enterprise Aesthetics:** Deliver a "Liquid Adaptive Glass" (Glassmorphism) UI that reflects modern enterprise standards.
*   **Performance:** Optimize for large datasets (pagination, sticky headers) and fast reporting.

---

## 2. Technical Architecture
| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS (Glassmorphism Utilities) |
| **Backend** | ASP.NET Core 8 Web API |
| **Database** | SQLite with Entity Framework Core |
| **Exports** | QuestPDF (PDF generation), ClosedXML (Excel generation) |

---

## 3. Functional Requirements

### 3.1 Dashboard (The Control Center)
*   **Real-time Metrics:** High-level counters for total samples, today's arrivals, and certificate distribution.
*   **Visualizations:** 
    *   Monthly trend charts for samples and certificates.
    *   Distribution charts (Environmental vs. Consumable).
*   **Quick Actions:** Direct access to:
    *   `Receive Sample` (opens Samples form).
    *   `Issue Certificate` (triggers search modal in Certificates page).

### 3.2 Sample Reception Management
*   **Form Capture:** Comprehensive input for Analysis Request #, Notification #, Declaration #, Supplier, Sender, and Origin.
*   **Grid Management:** Support for multi-reception records in a glass-panel list.
*   **Status Tracking:** Visual indicators for samples with/without issued certificates.

### 3.3 Certificate Issuance Module
*   **Reception Linking:** Force-links every certificate to a valid reception record to prevent data orphans.
*   **Pagination:** 30-row per page with server-side ready structure.
*   **Printing & PDF:**
    *   **Auto-PDF:** Instant generation and download trigger using `?pdf=true`.
    *   **Dynamic Data:** Support for 1 to 500 samples per certificate with clean table layout.
*   **Sticky Headers:** Maintain column labels during vertical scroll for better usability.

### 3.4 'My Dose' System (Proposed Integration)
*   **Purpose:** Track individual radiation dose records.
*   **Implementation:** MVC-integrated module for storing and querying dose history.
*   **UI:** Dedicated interface within the main dashboard layout.

---

## 4. UI/UX Standards (Rule 33 Compliance)
*   **Theme:** "Liquid Glass" – Translucent backgrounds, vibrant gradients, and high-quality iconography (Lucide-React).
*   **Typography:** Modern sans-serif (Inter/Outfit) with RTL support (Arabic).
*   **Responsiveness:** Fluid grid layouts that adapt from small tablets to large enterprise displays.
*   **Feedback:** Micro-animations for hover states and loading transitions.

---

## 5. Data & Reliability (MUST Rules)
*   **Timezone Consistency:** Fixed timestamp inheritance to prevent `00:00` offset errors in reports.
*   **Database:** Structured SQLite schema with normalization and strict foreign keys.
*   **Exports Cleanup:** Conditional logic to hide redundant charts (e.g., Top Senders) when generating reports for a specific entity.

---

## 6. Roadmap & Future Scope
1.  **Phase 1 (Complete):** Core Dashboard, Sample Reception, Certificate Issuance basics.
2.  **Phase 2 (In Progress):** PDF/Excel advanced formatting, Pagination refinement, Dashboard Quick Actions.
3.  **Phase 3 (Next):** Full User Authentication (RBAC), My Dose System integration, Server-side Global Search.

---
> **Document Control:** Version 1.2 | Last Updated: April 2026 | Priority: ENTERPRISE `[MUST]`
