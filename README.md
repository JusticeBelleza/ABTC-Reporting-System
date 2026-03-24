# ABTC Reporting System

**The official Animal Bite Treatment Center reporting solution for the Abra Provincial Health Office.**

---

## Intellectual Property & License Grant

**Proprietary Software**
This software system is the independent intellectual property of **Justice Belleza**. It was designed, developed, and authored securely as a private initiative.

**Institutional Grant**
This system is provided under a specialized **Institutional License Grant** to the **Abra Provincial Health Office**. It serves as the dedicated modernization platform for the province's public health data aggregation.

> **Note:** While the software is deployed for government use, ownership of the source code remains with the Developer, while ownership of the accumulated statistical data resides with the Provincial Health Office.

---

## Executive Overview

The **ABTC Reporting System** is a secure, web-based tool engineered to streamline data collection and reporting for Animal Bite Treatment Centers (ABTCs) across the Province of Abra.

**Core Philosophy: "Privacy-First"**
To ensure strict compliance with **RA 10173 (Data Privacy Act of 2012)**, the system operates on a **Zero-Patient Data** architecture. It strictly prohibits the input of patient names, addresses, or medical histories, focusing solely on public health metrics and statistical aggregation.

---

## Key Features

### 🛡️ Compliance, Security & Auditing
-   **Zero PII Collection:** Eliminates privacy risks by rejecting Patient Personally Identifiable Information (PII).
-   **Strict RBAC (Role-Based Access Control):** Dedicated views and permissions for System Admins, Program Coordinators, and ABTC Staff.
-   **Comprehensive Audit Trail:** Real-time tracking of system actions, report submissions, approvals, and rejections via a dedicated System Audit Log.
-   **Smart Data Validation:** Built-in mathematical guardrails automatically cross-check demographic totals (e.g., Sex vs. Age, Total Animals vs. Washed) to prevent erroneous reporting.

### ⚡ Offline Resilience & Performance
-   **Real-Time Offline Detection:** Instantly alerts users when internet connectivity drops without interrupting their workflow.
-   **Local Draft Saving:** Utilizes IndexedDB to securely save unsubmitted Form 1 and Cohort reports locally on the user's device when offline.
-   **Background Auto-Sync:** Automatically pushes offline drafts to the cloud the moment internet connectivity is restored.
-   **Scalable PDF Exporting:** Offloads heavy PDF generation to Background Web Workers, ensuring the main UI never freezes during complex document rendering.

### 📊 Advanced Analytics & Reporting
-   **Provincial Compliance Matrix:** Dynamic leaderboards allowing admins to instantly track submission rates (Fully Compliant, Partially Compliant, Zero Submissions) across all municipalities.
-   **Interactive Data Visualization:** Sleek, dynamic charts (powered by Recharts) breaking down demographics, biting animals, exposure categories, and geographical case maps.
-   **Instant Chart Exporting:** One-click functionality to download analytics charts as high-resolution PNG images for presentations.
-   **Automated Cohort Tracking:** Instant compilation of Category II and Category III patient outcomes across monthly, quarterly, and annual periods.

---

## Technical Stack

| Component | Technology Used |
| :--- | :--- |
| **Frontend Framework** | React 19, Tailwind CSS |
| **Build Tool** | Vite |
| **Backend & Auth** | Supabase (PostgreSQL) |
| **Offline Storage** | IndexedDB (Browser Native) |
| **Data Visualization** | Recharts, HTML-to-Image |
| **Background Processing** | Web Workers (PDF Generation) |
| **Hosting** | Hostinger (Production Environment) |

---

## System Requirements

To ensure optimal performance for health facilities:

### For End-Users (ABTC Staff)
* **Web Browser:** Google Chrome, Microsoft Edge, or Firefox (Latest Versions). *Internet Explorer is not supported.*
* **Network:** Intermittent internet is supported (Offline Draft mode available), but a stable connection is required for final cloud submission.
* **Device:** Fully responsive design. Desktop/Laptop is recommended for dense data entry; Tablets and Mobile Phones are fully supported for dashboard viewing via the bottom navigation bar.

### For Administrators
* **Database Access:** Requires authorized credentials for the Supabase project dashboard.
* **Environment:** Node.js (v18+) for local maintenance or development.

---

## Legal Documentation

Usage of this system is governed by the following legally binding instruments:

* [**Privacy Policy**](PRIVACY.md): Establishes the strict non-collection of patient data and prescribes the handling of personnel information.
* [**Terms of Use**](TERMS.md): Sets forth the guidelines for authorized ABTCs, including acceptable use provisions and prohibited acts.
* [**Software License**](LICENSE.md): Defines the Institutional License Grant, outlining ownership, succession rights, and the free‑of‑charge provision. 

---

## Author & Contact

**Justice Belleza**
*Lead Developer & System Architect*
**Email:** justice.belleza@icloud.com

&copy; 2026 Justice Belleza. All Rights Reserved.