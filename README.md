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

### 🛡️ Compliance & Security
-   **Zero PII Collection:** Eliminates privacy risks by rejecting Patient Personally Identifiable Information (PII).
-   **RA 10173 Adherence:** Built-in safeguards including automated data purging for inactive personnel accounts.
-   **Role-Based Access Control (RBAC):** Strict separation of duties between System Admins, Program Coordinators, and ABTC Staff.

### ⚡ Operational Capabilities
-   **Centralized Reporting:** Real-time submission of bite cases from remote ABTCs (Government & Private) to the Provincial Health Office.
-   **Automated Analytics:** Instant compilation of monthly and quarterly cohorts without manual tabulation.
-   **Vaccine Inventory Tracking:** Monitoring of human rabies vaccine (PVRV, PCECV) and RIG (HRIG, ERIG) usage.

### 🚀 Technical Architecture
-   **Frontend:** Built on **React** and **Vite** for rapid load times even on slower provincial internet connections.
-   **Backend:** Powered by a scalable **Node.js** runtime.
-   **Infrastructure:** Database, Authentication, and Edge Functions are secured via **Managed Database Infrastructure** (Supabase).

---

## Technical Stack

| Component | Technology Used |
| :--- | :--- |
| **Frontend Framework** | React 19, Tailwind CSS |
| **Build Tool** | Vite |
| **Backend & Auth** | Supabase (PostgreSQL) |
| **Hosting** | Hostinger (Production Environment) |

---

## System Requirements

To ensure optimal performance for health facilities:

### For End-Users (ABTC Staff)
* **Web Browser:** Google Chrome, Microsoft Edge, or Firefox (Latest Versions). *Internet Explorer is not supported.*
* **Network:** Stable internet connection (Required for real-time synchronization).
* **Device:** Desktop or Laptop is recommended for data entry; Tablets are supported for dashboard viewing.

### For Administrators
* **Database Access:** Requires authorized credentials for the Supabase project dashboard.
* **Environment:** Node.js (v18+) for local maintenance or development.

---

## Legal Documentation

Usage of this system is governed by the following legally binding documents:

* [**Privacy Policy**](PRIVACY.md): Details the strict non-collection of patient data and handling of personnel info.
* [**Terms of Use**](TERMS.md): Guidelines for authorized ABTCs, including acceptable use and prohibited acts.
* [**Software License**](LICENSE.md): The Institutional Grant outlining ownership, succession rights, and the "Free of Charge" provision.

---

## Author & Contact

**Justice Belleza**
*Lead Developer & System Architect*
**Email:** justice.belleza@icloud.com

&copy; 2026 Justice Belleza. All Rights Reserved.
