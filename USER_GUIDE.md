# User Guide

Welcome to the **Donor Investment Oversight Platform**. This guide covers how to use the system to manage objectives, activities, and approvals.

## Getting Started

### Accessing the System

Navigate to the application URL. Login with your provided email and password.
_Note: If you are a new user, you may need to contact an administrator for an account._

### The Dashboard

Your home screen.

- **KPI Cards**: Summary of total Budget, Actual Spend, and Variance.
- **Charts**: Visual breakdown of spending by state or objective.
- **Recent Activities**: Quick access to items you recently worked on.

## User Roles & Permissions

| Role                | Capabilities                                                  |
| ------------------- | ------------------------------------------------------------- |
| **Admin**           | Full system access. Manage users, settings, and bulk imports. |
| **Project Manager** | Create/Edit Objectives and Activities. Input Estimates.       |
| **Finance**         | Review specific activities. First level of approval.          |
| **Committee**       | Final level of approval. View all reports.                    |
| **Auditor**         | View-only access to almost everything + Audit Logs.           |
| **Viewer**          | Restricted view-only access.                                  |

## Core Features

### 1. Managing Objectives (States/Regions)

Objectives represent high-level goals or geographic regions (e.g., "Lagos State Projects").

- Go to **Objectives**.
- Click **Add Objective** (PM/Admin only).
- Define the title and description.

### 2. Managing Activities (Projects)

Activities are specific projects under an Objective.

- Navigate to an Objective.
- Click **Add Activity**.
- Fill in details: Title, Description, Start/End Dates.
- **Financials**: Enter Annual Estimates for each year. Ideally, do this in the planning phase.

### 3. Approvals

When an Activity is ready or Estimates are updated:

1. **PM** submits the activity. Status -> `PENDING_REVIEW`.
2. **Finance** user gets a notification. They review the budget.
   - **Approve**: Moves to Committee.
   - **Reject**: Returns to PM for changes.
3. **Committee** user gets a notification.
   - **Approve**: Status -> `APPROVED`. Project can now incur actual spend.

### 4. Tracking Actuals

For Approved projects:

- Go to **Actuals** tab on an Activity.
- Add new Spend Record (Date, Amount, Description).
- Upload supporting documents (Receipts/Invoices). _Note: Files are scanned for viruses._

### 5. Reporting

- Go to **Reports** (or Export section).
- Download PDF summaries or Excel dumps of financial data.

## Advanced Features

### Excel Import / Export

(Admin Only)

- **Import**: Upload a structured Excel file to bulk-create activities or update financials.
- **Export**: Download the entire database state to Excel for offline analysis.

### Audit Log

(Admin/Auditor Only)

- View a history of WHO did WHAT and WHEN.
- Useful for tracing changes to budget numbers.

## Troubleshooting

- **"Activity is locked"**: Someone else is editing this activity. Wait for them to finish or ask Admin to unlock.
- **Login Failed**: Check credentials. After 5 failed attempts, wait 15 minutes.
- **Upload Failed**: File might be too large (>10MB) or flagged by virus scanner.
