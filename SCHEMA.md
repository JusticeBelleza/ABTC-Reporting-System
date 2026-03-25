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
| `type` | text | Facility type (e.g., RHU, Hospital, Private Clinic). |
| `municipality` | text | The municipality where the facility is located. |
| `barangays` | text[] | Array of barangays (Catchment Area) under this facility. |
| `ownership` | text | Government vs. Private ownership. |
| `created_at` | timestamp | Timestamp of when the facility was added. |

---

## 2. `abtc_reports` (Form 1)
Stores the monthly demographic and biting animal data (New Cases). **No Patient Identifiable Information (PII) is stored here.**

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key. Auto-generated. |
| `facility` | text | Foreign Key mapping to `facilities.name`. |
| `year` | integer | The reporting year (e.g., 2026). |
| `month` | text | The reporting month (e.g., "January"). |
| `status` | text | Workflow state: `Draft`, `Pending`, `Approved`, or `Rejected`. |
| `rejection_reason`| text | Filled by Admin if `status` is Rejected. |
| `data` | jsonb | JSON object containing all numerical case data (e.g., total males, total dog bites, Category II/III counts). |
| `created_at` | timestamp | Timestamp of report creation. |
| `updated_at` | timestamp | Timestamp of the last edit or status change. |

---

## 3. `abtc_cohort_reports`
Stores the follow-up data (Outcomes) for patients from previous quarters/months.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key. Auto-generated. |
| `facility` | text | Foreign Key mapping to `facilities.name`. |
| `year` | integer | The target year for the cohort data. |
| `month` | text | The target month (if reporting monthly). |
| `quarter` | text | The target quarter (if reporting quarterly). |
| `category` | text | Indicates if the row is for `Category II` or `Category III`. |
| `status` | text | Workflow state: `Draft`, `Pending`, `Approved`, or `Rejected`. |
| `data` | jsonb | JSON object containing outcome numbers (Completed Doses, Dropouts, Deaths). |
| `created_at` | timestamp | Timestamp of report creation. |

---

## 4. `profiles` (User Management & RBAC)
Links Supabase Authentication users to system roles and facility assignments.

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `id` | uuid | Primary Key. Maps directly to `auth.users.id`. |
| `email` | text | The user's login email. |
| `full_name` | text | Display name for the dashboard UI. |
| `role` | text | Role-Based Access Control: `admin` (PHO) or `user` (Facility Staff). |
| `facility` | text | The facility assigned to a `user` (Admins have this as `null`). |

---
*Note: All tables enforce PostgreSQL Row Level Security (RLS). Users can only `SELECT`, `INSERT`, or `UPDATE` rows where `facility` matches their assigned profile, except for Admins who have global read/write access.*