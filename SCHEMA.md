# 🗄️ Database Schema & Data Dictionary
**ABTC Reporting System – Abra Provincial Health Office**

This document outlines the table structures within the Supabase (PostgreSQL) database. It is intended for future IT Administrators and developers to understand how the system's data is organized.

---

## 1. `facilities`
Stores the official registry of all Animal Bite Treatment Centers (ABTC) in the province.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key. Auto-generated. |
| `name` | text | Name of the facility (Must be unique). |
| `type` | text | Facility type (e.g., RHU, Hospital, Clinic). |
| `municipality` | text | The municipality where the facility is located. |
| `barangays` | text[] | Array of barangays (Catchment Area) under this facility. |
| `ownership` | text | Government vs. Private ownership. |
| `status` | text | `Active` or `Archived` (Hidden from main dashboards). |
| `created_at` | timestamp | Timestamp of when the facility was added. |

---

## 2. `abtc_reports_v2` (Animal Bite and Rabies Report Form - Granular Data)
The core reporting table. Stores granular, location-based monthly demographic, animal, and post-exposure prophylaxis (PEP) data. **No Patient Identifiable Information (PII) is stored here.**

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key. Auto-generated. |
| `facility` | text | Foreign Key mapping to `facilities.name`. |
| `year` | integer | The reporting year (e.g., 2026). |
| `month` | text | The reporting month (e.g., "January"). |
| `location_name` | text | The specific Barangay or Municipality the row data represents. |
| `status` | text | Workflow state: `Draft`, `Pending`, `Approved`, or `Rejected`. |
| `rejection_reason`| text | Filled by Admin if `status` is Rejected. |
| `male` / `female` | integer | Patient Sex demographics. |
| `age_under_15` / `age_over_15` | integer | Patient Age demographics. |
| `cat1`...`cat3_non_elig` | integer | Breakdown of exposure categories and eligibility. |
| `comp_cat2_pri`...`comp_cat3_boost`| integer | PEP doses completed (CCEEV, ERIG, HRIG). |
| `type_dog` / `type_cat` / `type_others`| integer | Biting Animal Types. |
| `status_pet` / `status_stray` / `status_unk`| integer | Biting Animal Status (Used for High-Risk Alerts). |
| `rabies_cases` | integer | Confirmed PIDSR Human Rabies Cases (Deaths). |
| `created_at` | timestamp | Timestamp of report creation. |

---

## 3. `populations`
Stores the official population data used to calculate incidence proportions and formatting metrics.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key. Auto-generated. |
| `municipality` | text | The Abra municipality name. |
| `barangay_name` | text | The specific barangay (or "All" for municipality totals). |
| `population` | integer | The official population count. |
| `year` | integer | The census/projection year. |
| `created_at` | timestamp | Record creation timestamp. |

---

## 4. `settings`
Stores global system configurations managed by the System Admin, including AI Alert thresholds.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key (Typically only 1 row exists). |
| `logo_base64` | text | Base64 encoded string of the global PHO header logo. |
| `outbreak_threshold_percent` | numeric | Sensitivity % for triggering general Volume Anomaly alerts. |
| `trend_alert_percent` | numeric | Sensitivity % for triggering short-term Rising Trend alerts. |
| `high_risk_threshold_percent`| numeric | Sensitivity % for triggering CRITICAL Stray/Cat 3 alerts. |
| `updated_at` | timestamp | Timestamp of last setting adjustment. |

---

## 5. `profiles` (User Management & Preferences)
Links Supabase Authentication users to system roles, facility assignments, and custom export preferences.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key. Maps directly to `auth.users.id`. |
| `email` | text | The user's login email. |
| `full_name` | text | Display name for the dashboard UI. |
| `role` | text | Role-Based Access Control: `admin`, `SYSADMIN`, or `user`. |
| `facility` | text | The facility assigned to a `user` (Admins have this as `null`). |
| `facility_logo` | text | Base64 string of the user's specific facility/RHU logo. |
| `signatories` | jsonb | Array of objects (`label`, `name`, `title`) for PDF exports. |
| `created_at` | timestamp | User creation timestamp. |

---
*Note: All tables enforce PostgreSQL Row Level Security (RLS). Users can only `SELECT`, `INSERT`, or `UPDATE` rows where `facility` matches their assigned profile, except for Admins who have global read/write access.*