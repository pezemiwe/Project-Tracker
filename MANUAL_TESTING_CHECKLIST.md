# Manual Testing Checklist

**Project:** Donor Investment Oversight Platform  
**Date Created:** 2026-01-21  
**Version:** 1.0  
**Estimated Time:** 4-6 hours for complete testing

---

## Pre-Testing Setup

### Environment Status (Repaired 2026-01-21)

- **Backend:** Fixed MinIO connection error (Invalid Endpoint). Running on port 3000.
- **Frontend:** Fixed routing configuration (TanStack Router) and removed invalid `react-router-dom` imports. Running on port 5174 (due to 5173 conflict).
- **Unit Tests:** 100% Passing (131/131).

### Environment Setup

**Option A: Using Docker (Recommended)**

- [ ] Backend running on `http://localhost:3000`
- [ ] Frontend running on `http://localhost:5174`
- [ ] PostgreSQL database running (via Docker)
- [ ] Redis running (via Docker)
- [ ] MinIO running (via Docker)
- [ ] ClamAV running (via Docker)

**Quick Start (Docker):**

```bash
# Terminal 1: Start infrastructure
docker-compose up -d

# Terminal 2: Start backend
cd backend
pnpm run dev

# Terminal 3: Start frontend
cd frontend
pnpm run dev
```

**Option B: Running Without Docker (Manual Setup)**

If you cannot use Docker, you must install and run the infrastructure services locally:

1.  **PostgreSQL:**
    *   Install PostgreSQL (v15+).
    *   Create a database named `donor_oversight`.
    *   Create a user `app_user` with password `SecurePassword123` (or update `.env`).
    *   Ensure it is running on port `5432`.

2.  **Redis:**
    *   Install Redis (v7+).
    *   Start the Redis server on port `6379`.
    *   (Optional) Set password to `RedisPassword123` or update `.env` to remove password.

3.  **MinIO (S3 Compatible Storage):**
    *   Install MinIO Server.
    *   Start server: `minio server ~/minio-data --console-address ":9001"` (creates data dir in home).
    *   Access console at `http://localhost:9001` (User: `minioadmin`, Pass: `minioadmin123`).
    *   Create a bucket named `attachments`.

4.  **ClamAV (Optional):**
    *   Install ClamAV.
    *   Start `clamd` daemon on port `3310`.
    *   *Note: If skipped, file uploads may fail virus scan checks.*

5.  **Configuration:**
    *   Update `backend/.env` to point to your local services (e.g., correct DB credentials, Redis URL).

6.  **Start Application:**
    ```bash
    # Terminal 1: Start backend
    cd backend
    pnpm install
    pnpm db:migrate
    pnpm db:seed
    pnpm run dev

    # Terminal 2: Start frontend
    cd frontend
    pnpm install
    pnpm run dev
    ```

### Test Accounts

**Default Credentials:**

- **Admin:** admin@donor-oversight.local / Admin123!@#
- **Project Manager:** pm@donor-oversight.local / PM123!@#
- **Finance:** finance@donor-oversight.local / Finance123!@#
- **Committee:** committee@donor-oversight.local / Committee123!@#
- **Auditor:** auditor@donor-oversight.local / Auditor123!@#
- **Viewer:** viewer@donor-oversight.local / Viewer123!@#

### SMTP Configuration (Optional but Recommended)

- [ ] Configure SMTP settings in Admin Settings page
- [ ] Test email connection
- [ ] Verify email notifications work

---

## 1. Authentication & Access Control

**Estimated Time:** 20 minutes

### Login Flow

- [ ] Open `http://localhost:5173`
- [ ] Login with admin credentials (admin@donor-oversight.local / Admin123!@#)
- [ ] Verify successful login and redirect to dashboard
- [ ] Check user name displays in header
- [ ] Verify admin menu items visible

### Role-Based Access

- [ ] **Admin:** Can access all pages
  - [ ] Dashboard
  - [ ] Objectives
  - [ ] Activities
  - [ ] Approvals
  - [ ] Actuals
  - [ ] Reports
  - [ ] Audit Logs
  - [ ] Admin Settings
- [ ] **Finance:** Login and verify access
  - [ ] Can view objectives and activities
  - [ ] Can approve/reject approvals
  - [ ] Cannot access Admin Settings
- [ ] **Committee Member:** Login and verify access
  - [ ] Can view objectives and activities
  - [ ] Can approve finance-approved items
  - [ ] Cannot access Admin Settings
- [ ] **Project Manager:** Login and verify access
  - [ ] Can create/edit activities
  - [ ] Can submit approvals
  - [ ] Cannot approve own submissions
- [ ] **Auditor:** Login and verify access
  - [ ] Can view all data (read-only)
  - [ ] Can access audit logs
  - [ ] Cannot create/edit/delete
- [ ] **Viewer:** Login and verify access
  - [ ] Can only view data
  - [ ] No edit/delete buttons visible

### Session Management

- [ ] Leave browser idle for 30 minutes
- [ ] Verify session timeout warning appears
- [ ] Verify automatic logout after timeout
- [ ] Login again and verify session restored

### Logout

- [ ] Click logout button
- [ ] Verify redirect to login page
- [ ] Verify cannot access protected pages
- [ ] Verify session cleared

**✅ Pass Criteria:** All roles have correct permissions, session timeout works, logout clears session

---

## 2. Objectives Management

**Estimated Time:** 15 minutes

### Create Objective

- [ ] Navigate to Objectives page
- [ ] Click "Create Objective" button
- [ ] Fill in form:
  - Title: "Education Infrastructure"
  - Description: "Improve school facilities"
  - State: Select "Lagos"
  - Estimated Spend: 5000000
- [ ] Click "Create"
- [ ] Verify objective appears in list
- [ ] Verify SN (serial number) assigned automatically

### Edit Objective

- [ ] Click on created objective
- [ ] Click "Edit" button
- [ ] Change title to "Education Infrastructure Development"
- [ ] Update estimated spend to 5500000
- [ ] Click "Save"
- [ ] Verify changes saved
- [ ] Check audit log shows update

### View Objective Details

- [ ] Click on objective
- [ ] Verify all details display correctly
- [ ] Verify activities list (empty initially)
- [ ] Verify financial summary shows correct totals

### Delete Objective

- [ ] Create a test objective
- [ ] Click "Delete" button
- [ ] Confirm deletion
- [ ] Verify objective removed from list
- [ ] Verify soft delete (check audit log)

**✅ Pass Criteria:** CRUD operations work, SN auto-assigned, audit trail created

---

## 3. Activities Management

**Estimated Time:** 30 minutes

### Create Activity

- [ ] Navigate to Activities page
- [ ] Click "Create Activity" button
- [ ] Fill in form:
  - Objective: Select "Education Infrastructure Development"
  - Title: "Build Primary School in Ikeja"
  - Description: "Construct 12-classroom block"
  - Start Date: 2024-01-01
  - End Date: 2024-12-31
  - Status: Planned
  - Lead: "John Doe"
  - Estimated Spend Total: 2500000
- [ ] Click "Save"
- [ ] Verify activity created
- [ ] Verify SN assigned

### Annual Estimates Validation

- [ ] Edit the created activity
- [ ] Add annual estimates:
  - 2024: 1500000
  - 2025: 1000000
- [ ] Verify sum (2500000) matches total
- [ ] Try invalid sum (2024: 1000000, 2025: 1000000)
- [ ] Verify error message: "Mismatch: $2,000,000.00 ≠ $2,500,000.00"
- [ ] Correct the values
- [ ] Verify green checkmark: "Matches estimated spend"
- [ ] Save activity

### Pessimistic Locking

- [ ] Open activity in browser tab 1
- [ ] Click "Edit" to acquire lock
- [ ] Open same activity in browser tab 2 (different browser or incognito)
- [ ] Verify tab 2 shows "Locked by [User]" message
- [ ] Verify tab 2 cannot edit
- [ ] In tab 1, save or cancel
- [ ] Verify tab 2 can now edit (refresh page)

### Lock Expiry

- [ ] Edit an activity (acquire lock)
- [ ] Leave page idle for 30 minutes
- [ ] Verify lock expires automatically
- [ ] Verify another user can now edit

### Activity Status Workflow

- [ ] Create activity with status "Planned"
- [ ] Edit and change to "In Progress"
- [ ] Update progress to 50%
- [ ] Verify status badge updates
- [ ] Change to "Completed"
- [ ] Set progress to 100%
- [ ] Verify status reflects in dashboard

### Delete Activity

- [ ] Create a test activity
- [ ] Click "Delete"
- [ ] Confirm deletion
- [ ] Verify soft delete (activity hidden but in audit log)

**✅ Pass Criteria:** CRUD works, annual estimates validation works, locking prevents concurrent edits, lock expires

---

## 4. Approval Workflow

**Estimated Time:** 45 minutes

### Scenario 1: Full Approval Flow (Above Threshold)

**Step 1: Submit Approval (as Project Manager)**

- [ ] Login as PM (pm@donor-oversight.local / PM123!@#)
- [ ] Edit an activity
- [ ] Change estimated spend from 2500000 to 3000000
- [ ] Verify approval widget shows "Approval Required"
- [ ] Add comment: "Need additional budget for materials"
- [ ] Click "Submit for Approval"
- [ ] Verify approval submitted
- [ ] Verify status shows "Pending Finance"
- [ ] Verify email sent to Finance users (if SMTP configured)

**Step 2: Finance Approval**

- [ ] Logout PM
- [ ] Login as Finance (finance@donor-oversight.local / Finance123!@#)
- [ ] Navigate to Approvals page
- [ ] Verify pending approval appears
- [ ] Click on approval
- [ ] Review details (old value: 2500000, new value: 3000000)
- [ ] Add comment: "Approved - budget available"
- [ ] Click "Finance Approve"
- [ ] Verify status changes to "Pending Committee"
- [ ] Verify email sent to Committee members

**Step 3: Committee Approval**

- [ ] Logout Finance
- [ ] Login as Committee (committee@donor-oversight.local / Committee123!@#)
- [ ] Navigate to Approvals page
- [ ] Verify pending approval appears
- [ ] Click on approval
- [ ] Review approval history (submitted → finance approved)
- [ ] Add comment: "Final approval granted"
- [ ] Click "Committee Approve"
- [ ] Verify status changes to "Approved"
- [ ] Verify activity updated with new value (3000000)
- [ ] Verify email sent to PM

**Step 4: Verify Changes Applied**

- [ ] Login as PM
- [ ] Open the activity
- [ ] Verify estimated spend is now 3000000
- [ ] Verify approval history visible
- [ ] Check audit log shows all approval steps

### Scenario 2: Rejection Flow

**Step 1: Submit Approval**

- [ ] Login as PM
- [ ] Edit activity, change estimated spend
- [ ] Submit for approval

**Step 2: Finance Rejection**

- [ ] Login as Finance
- [ ] Navigate to approval
- [ ] Click "Reject"
- [ ] Enter reason: "Insufficient justification provided"
- [ ] Click "Confirm Rejection"
- [ ] Verify status changes to "Rejected"
- [ ] Verify email sent to PM

**Step 3: Verify Rejection**

- [ ] Login as PM
- [ ] Check approvals page
- [ ] Verify rejection reason visible
- [ ] Verify activity NOT updated (old value retained)

### Scenario 3: Auto-Approval (Below Threshold)

- [ ] Login as PM
- [ ] Edit activity
- [ ] Change estimated spend by small amount (e.g., 2500000 → 2550000)
- [ ] Submit for approval
- [ ] Verify auto-approved (if change < $10,000 and < 20%)
- [ ] Verify activity updated immediately
- [ ] Verify approval shows "Finance Approved" automatically

### Threshold Testing

**Test USD Threshold ($10,000):**

- [ ] Change: $50,000 → $55,000 (Δ = $5,000) → Should auto-approve
- [ ] Change: $50,000 → $65,000 (Δ = $15,000) → Should require approval

**Test Percentage Threshold (20%):**

- [ ] Change: $100,000 → $115,000 (Δ = 15%) → Should auto-approve
- [ ] Change: $100,000 → $130,000 (Δ = 30%) → Should require approval

**✅ Pass Criteria:** Full approval flow works, rejections work, auto-approval works for small changes, emails sent

---

## 5. Actuals & File Attachments

**Estimated Time:** 25 minutes

### Record Actual Spend

- [ ] Navigate to Actuals page
- [ ] Click "Record Actual"
- [ ] Select activity
- [ ] Enter amount: 1200000
- [ ] Enter date: 2024-06-30
- [ ] Add description: "Q2 expenditure - construction materials"
- [ ] Click "Save"
- [ ] Verify actual recorded
- [ ] Verify activity shows actual spend

### Upload Attachments

**Test PDF Upload:**

- [ ] Click "Add Attachment" on actual
- [ ] Select a PDF file (invoice, receipt)
- [ ] Add description: "Invoice #12345"
- [ ] Upload file
- [ ] Verify upload progress
- [ ] Verify file appears in attachments list
- [ ] Verify virus scan status (if ClamAV running)

**Test Excel Upload:**

- [ ] Upload an Excel file
- [ ] Verify accepted

**Test Image Upload:**

- [ ] Upload a JPG/PNG image
- [ ] Verify accepted

**Test Invalid File:**

- [ ] Try uploading .exe or .bat file
- [ ] Verify rejection with error message

**Test File Size Limit:**

- [ ] Try uploading file > 10MB
- [ ] Verify rejection with size error

### Download Attachments

- [ ] Click download icon on attachment
- [ ] Verify file downloads correctly
- [ ] Verify filename preserved

### Delete Attachments

- [ ] Click delete icon
- [ ] Confirm deletion
- [ ] Verify attachment removed

### Variance Alerts

- [ ] Record actual spend that exceeds estimate by > 20%
- [ ] Verify variance alert appears
- [ ] Verify email sent to Finance (if SMTP configured)
- [ ] Check dashboard shows variance warning

**✅ Pass Criteria:** Actuals recorded, files upload/download, virus scanning works, variance alerts trigger

---

## 6. Excel Import/Export

**Estimated Time:** 30 minutes

### Download Template

- [ ] Navigate to Activities page
- [ ] Click "Import" button
- [ ] Click "Download Template"
- [ ] Verify Excel file downloads
- [ ] Open file and verify columns:
  - Objective Title
  - Activity Title
  - Description
  - Start Date
  - End Date
  - Status
  - Lead
  - Estimated Spend
  - Annual Estimates (JSON)

### Import Valid Data

**Step 1: Prepare Data**

- [ ] Fill in template with 3-5 activities
- [ ] Use existing objective titles
- [ ] Use valid dates (YYYY-MM-DD)
- [ ] Use valid status (Planned/InProgress/Completed/OnHold)
- [ ] Ensure annual estimates sum matches total

**Step 2: Import**

- [ ] Click "Import" button
- [ ] Upload filled template
- [ ] Verify validation step shows preview
- [ ] Review activities to be imported
- [ ] Click "Confirm Import"
- [ ] Verify success message
- [ ] Verify activities appear in list

### Import with Errors

**Test Missing Required Fields:**

- [ ] Create template with missing title
- [ ] Upload file
- [ ] Verify validation errors shown
- [ ] Verify row numbers indicated
- [ ] Verify specific error messages

**Test Invalid Dates:**

- [ ] Use invalid date format (DD/MM/YYYY instead of YYYY-MM-DD)
- [ ] Verify error message

**Test Invalid Objective:**

- [ ] Use non-existent objective title
- [ ] Verify error: "Objective not found"

**Test Annual Estimates Mismatch:**

- [ ] Set total: 100000
- [ ] Set annual estimates: {"2024": 50000, "2025": 40000}
- [ ] Verify error: "Annual estimates sum (90000) does not match total (100000)"

### Export Activities

**Export All:**

- [ ] Click "Export" button
- [ ] Select "All Activities"
- [ ] Choose format: Excel
- [ ] Download file
- [ ] Open and verify all activities exported
- [ ] Verify all columns present

**Export Filtered:**

- [ ] Filter activities by objective
- [ ] Click "Export"
- [ ] Select "Filtered Activities"
- [ ] Verify only filtered activities exported

**Export CSV:**

- [ ] Export as CSV format
- [ ] Verify CSV file downloads
- [ ] Open in Excel/text editor
- [ ] Verify data correct

### Export Financial Report

- [ ] Navigate to Reports page
- [ ] Click "Export Financial Report"
- [ ] Verify Excel file downloads
- [ ] Open file and verify:
  - Summary sheet with totals
  - Activity details sheet
  - Variance analysis
  - Charts/graphs

**✅ Pass Criteria:** Template downloads, import works, validation catches errors, export works in multiple formats

---

## 7. Reports & PDF Generation

**Estimated Time:** 20 minutes

### Financial Summary Report

- [ ] Navigate to Reports page
- [ ] Click "Generate Financial Report"
- [ ] Verify PDF generates
- [ ] Download PDF
- [ ] Open and verify contents:
  - [ ] Report header with date
  - [ ] Summary statistics (total activities, objectives)
  - [ ] Total estimated vs actual spend
  - [ ] Variance analysis
  - [ ] Activity breakdown table
  - [ ] Objective summaries

### Audit Trail Report

- [ ] Click "Generate Audit Report"
- [ ] Select date range (last 30 days)
- [ ] Select entity type: "Activity"
- [ ] Generate report
- [ ] Download PDF
- [ ] Verify contents:
  - [ ] Filtered audit logs
  - [ ] User names
  - [ ] Actions (CREATE, UPDATE, DELETE)
  - [ ] Timestamps
  - [ ] Change details

### Activity Status Report

- [ ] Click "Generate Activity Report"
- [ ] Generate report
- [ ] Download PDF
- [ ] Verify contents:
  - [ ] Activities grouped by status
  - [ ] Progress indicators
  - [ ] Timeline information
  - [ ] Lead assignments
  - [ ] Financial summary per activity

**✅ Pass Criteria:** All 3 report types generate, PDFs download, content is accurate and formatted

---

## 8. Admin Settings

**Estimated Time:** 20 minutes

### View Settings

- [ ] Login as Admin
- [ ] Navigate to Admin Settings
- [ ] Verify settings grouped by category:
  - [ ] Approval Thresholds
  - [ ] Email Configuration
  - [ ] Session Management

### Update Approval Thresholds

- [ ] Change "Approval Threshold (USD)" from 10000 to 15000
- [ ] Change "Approval Threshold (%)" from 20 to 25
- [ ] Click "Save"
- [ ] Verify success message
- [ ] Refresh page
- [ ] Verify values persisted

### Configure SMTP (if available)

**Step 1: Enter Settings**

- [ ] SMTP Host: smtp.gmail.com (or your SMTP server)
- [ ] SMTP Port: 587
- [ ] SMTP User: your-email@gmail.com
- [ ] SMTP Password: your-app-password
- [ ] From Address: noreply@donor-oversight.org
- [ ] Click "Save"

**Step 2: Test Connection**

- [ ] Click "Test Email Connection"
- [ ] Enter test email address
- [ ] Click "Send Test Email"
- [ ] Verify success message
- [ ] Check email inbox
- [ ] Verify test email received

### Update Session Settings

- [ ] Change "Session Timeout (minutes)" from 30 to 60
- [ ] Click "Save"
- [ ] Verify updated
- [ ] Test: Leave idle for 60 minutes
- [ ] Verify session timeout at new duration

### Settings Caching

- [ ] Update a setting
- [ ] Open browser dev tools → Network tab
- [ ] Refresh page
- [ ] Verify settings loaded from cache (fast load)
- [ ] Update setting again
- [ ] Verify cache invalidated
- [ ] Verify new value loads

**✅ Pass Criteria:** Settings update and persist, SMTP test works, session timeout configurable, caching works

---

## 9. Dashboard & Analytics

**Estimated Time:** 15 minutes

### Dashboard Overview

- [ ] Navigate to Dashboard
- [ ] Verify widgets display:
  - [ ] Total Objectives count
  - [ ] Total Activities count
  - [ ] Total Estimated Spend
  - [ ] Total Actual Spend
  - [ ] Variance percentage

### Charts & Visualizations

- [ ] Verify "Spend by Objective" chart displays
- [ ] Verify "Activities by Status" pie chart
- [ ] Verify "Monthly Spend Trend" line chart
- [ ] Hover over chart elements
- [ ] Verify tooltips show details

### Pending Approvals Widget

- [ ] Verify "Pending Approvals" widget shows count
- [ ] Click on widget
- [ ] Verify navigates to Approvals page
- [ ] Verify filtered to pending only

### Recent Activities Widget

- [ ] Verify "Recent Activities" shows last 5 activities
- [ ] Click on an activity
- [ ] Verify navigates to activity detail

### Variance Alerts

- [ ] Verify "Variance Alerts" widget
- [ ] Verify shows activities with > 20% variance
- [ ] Verify color-coded (red for over, green for under)

**✅ Pass Criteria:** All widgets display correct data, charts render, navigation works

---

## 10. Gantt View

**Estimated Time:** 15 minutes

### View Timeline

- [ ] Navigate to Activities page
- [ ] Click "Gantt View" tab
- [ ] Verify timeline displays
- [ ] Verify activities shown as bars
- [ ] Verify grouped by objective

### Year Filters

- [ ] Select year: 2024
- [ ] Verify only 2024 activities shown
- [ ] Select year: 2025
- [ ] Verify only 2025 activities shown
- [ ] Select "All Years"
- [ ] Verify all activities shown

### Timeline Interaction

- [ ] Hover over activity bar
- [ ] Verify tooltip shows:
  - [ ] Activity title
  - [ ] Start and end dates
  - [ ] Duration
  - [ ] Status
- [ ] Click on activity bar
- [ ] Verify navigates to activity detail

### Color Coding

- [ ] Verify activities color-coded by status:
  - [ ] Planned: Blue
  - [ ] In Progress: Yellow/Orange
  - [ ] Completed: Green
  - [ ] On Hold: Gray

**✅ Pass Criteria:** Gantt view displays, year filters work, tooltips show info, color coding correct

---

## 11. Audit Logs

**Estimated Time:** 15 minutes

### View Audit Trail

- [ ] Navigate to Audit Logs page
- [ ] Verify logs display in table
- [ ] Verify columns:
  - [ ] Timestamp
  - [ ] User
  - [ ] Action (CREATE, UPDATE, DELETE)
  - [ ] Entity Type
  - [ ] Entity ID
  - [ ] Changes

### Filter Logs

**By Date Range:**

- [ ] Select date range: Last 7 days
- [ ] Verify filtered results
- [ ] Select custom range
- [ ] Verify filtered correctly

**By Entity Type:**

- [ ] Filter by "Activity"
- [ ] Verify only activity logs shown
- [ ] Filter by "Approval"
- [ ] Verify only approval logs shown

**By User:**

- [ ] Filter by specific user
- [ ] Verify only that user's actions shown

**By Action:**

- [ ] Filter by "CREATE"
- [ ] Verify only create actions shown
- [ ] Filter by "UPDATE"
- [ ] Verify only update actions shown

### View Change Details

- [ ] Click on an UPDATE log entry
- [ ] Verify modal/panel shows:
  - [ ] Old values
  - [ ] New values
  - [ ] Field-by-field comparison
- [ ] Verify JSON changes readable

### Export Audit Logs

- [ ] Click "Export" button
- [ ] Select date range
- [ ] Download CSV
- [ ] Open file
- [ ] Verify all audit data exported

**✅ Pass Criteria:** Audit logs capture all actions, filters work, change details visible, export works

---

## 12. Search & Filtering

**Estimated Time:** 10 minutes

### Global Search

- [ ] Use search bar in header
- [ ] Search for activity title
- [ ] Verify results show matching activities
- [ ] Search for objective title
- [ ] Verify results show matching objectives
- [ ] Click on result
- [ ] Verify navigates to detail page

### Activity Filters

**By Objective:**

- [ ] Select objective from dropdown
- [ ] Verify filtered activities shown

**By Status:**

- [ ] Select "In Progress"
- [ ] Verify only in-progress activities shown

**By Date Range:**

- [ ] Select start date range
- [ ] Verify activities filtered by start date

**By Lead:**

- [ ] Enter lead name
- [ ] Verify filtered by lead

**Combined Filters:**

- [ ] Apply multiple filters simultaneously
- [ ] Verify AND logic applied

### Clear Filters

- [ ] Click "Clear Filters"
- [ ] Verify all filters reset
- [ ] Verify all activities shown

**✅ Pass Criteria:** Search works, filters work individually and combined, clear filters works

---

## 13. Performance & UX

**Estimated Time:** 15 minutes

### Page Load Times

- [ ] Measure dashboard load time (should be < 2 seconds)
- [ ] Measure activities page load (should be < 3 seconds)
- [ ] Measure reports generation (should be < 10 seconds)

### Pagination

- [ ] Navigate to Activities page
- [ ] Verify pagination controls
- [ ] Click "Next Page"
- [ ] Verify page 2 loads
- [ ] Change page size (10, 25, 50, 100)
- [ ] Verify correct number of items shown

### Lazy Loading

- [ ] Open browser dev tools → Network tab
- [ ] Navigate to different pages
- [ ] Verify only necessary code chunks loaded
- [ ] Verify lazy loading for routes

### Responsive Design

- [ ] Resize browser to mobile width (375px)
- [ ] Verify layout adapts
- [ ] Verify navigation menu collapses
- [ ] Test on tablet width (768px)
- [ ] Verify layout responsive

### Loading States

- [ ] Trigger data fetch (navigate to page)
- [ ] Verify loading spinner shows
- [ ] Verify skeleton screens (if implemented)
- [ ] Verify smooth transition when data loads

### Error Handling

- [ ] Stop backend server
- [ ] Try to load data
- [ ] Verify error message displays
- [ ] Verify user-friendly error text
- [ ] Restart backend
- [ ] Verify app recovers

**✅ Pass Criteria:** Fast load times, pagination works, responsive design, good error handling

---

## 14. Security Testing

**Estimated Time:** 20 minutes

### CSRF Protection

- [ ] Open browser dev tools → Network tab
- [ ] Submit a form (create activity)
- [ ] Verify CSRF token in request headers
- [ ] Try to submit without token (use curl/Postman)
- [ ] Verify request rejected

### XSS Prevention

- [ ] Try to create activity with title: `<script>alert('XSS')</script>`
- [ ] Verify script not executed
- [ ] Verify displayed as plain text

### SQL Injection Prevention

- [ ] Try to search with: `' OR '1'='1`
- [ ] Verify no error
- [ ] Verify no unauthorized data returned

### File Upload Security

- [ ] Try to upload malicious file (if ClamAV running)
- [ ] Verify virus scan catches it
- [ ] Verify file rejected
- [ ] Try to upload .exe file
- [ ] Verify rejected by file type validation

### Authorization Checks

- [ ] Login as Viewer
- [ ] Try to access admin URL directly: `/admin/settings`
- [ ] Verify redirected or access denied
- [ ] Try to call API endpoint directly (use browser console):
  ```javascript
  fetch('/api/activities', {method: 'POST', ...})
  ```
- [ ] Verify 403 Forbidden response

**✅ Pass Criteria:** CSRF protection works, XSS prevented, SQL injection prevented, file upload secure, authorization enforced

---

## 15. Email Notifications (if SMTP configured)

**Estimated Time:** 15 minutes

### Approval Submitted Email

- [ ] Submit approval as PM
- [ ] Check Finance user email
- [ ] Verify email received
- [ ] Verify subject: "New Approval Pending: [Activity Title]"
- [ ] Verify email contains:
  - [ ] Activity details
  - [ ] Old and new values
  - [ ] Submitter name
  - [ ] Link to approval
- [ ] Click link in email
- [ ] Verify navigates to approval page

### Finance Approved Email

- [ ] Approve as Finance
- [ ] Check Committee user email
- [ ] Verify email received
- [ ] Verify subject: "Finance Approved: [Activity Title]"
- [ ] Verify email contains approval details

### Final Approval Email

- [ ] Approve as Committee
- [ ] Check PM email
- [ ] Verify email received
- [ ] Verify subject: "Approval Approved: [Activity Title]"

### Rejection Email

- [ ] Reject an approval
- [ ] Check PM email
- [ ] Verify email received
- [ ] Verify subject: "Approval Rejected: [Activity Title]"
- [ ] Verify rejection reason included

### Variance Alert Email

- [ ] Record actual spend > 20% over estimate
- [ ] Check Finance user email
- [ ] Verify variance alert email received
- [ ] Verify variance details included

**✅ Pass Criteria:** All email types sent, correct recipients, links work, formatting good

---

## 16. Data Integrity

**Estimated Time:** 15 minutes

### Referential Integrity

- [ ] Create objective with activities
- [ ] Try to delete objective
- [ ] Verify prevented (or cascade delete warning)
- [ ] Delete activities first
- [ ] Then delete objective
- [ ] Verify successful

### Concurrent Edits

- [ ] User 1: Edit activity A
- [ ] User 2: Try to edit same activity A
- [ ] Verify User 2 sees lock message
- [ ] User 1: Save changes
- [ ] User 2: Refresh and edit
- [ ] Verify User 2 can now edit

### Data Validation

- [ ] Try to create activity with:
  - [ ] Negative estimated spend → Verify error
  - [ ] End date before start date → Verify error
  - [ ] Progress > 100% → Verify error
  - [ ] Empty required fields → Verify error

### Soft Delete Verification

- [ ] Delete an activity
- [ ] Check database (if access available)
- [ ] Verify `deletedAt` timestamp set
- [ ] Verify record still exists
- [ ] Verify not shown in UI

**✅ Pass Criteria:** Referential integrity maintained, concurrent edits handled, validation works, soft delete works

---

## Test Results Summary

### Test Completion Checklist

**Section 1: Authentication** [ ]  
**Section 2: Objectives** [ ]  
**Section 3: Activities** [ ]  
**Section 4: Approvals** [ ]  
**Section 5: Actuals & Files** [ ]  
**Section 6: Import/Export** [ ]  
**Section 7: Reports** [ ]  
**Section 8: Admin Settings** [ ]  
**Section 9: Dashboard** [ ]  
**Section 10: Gantt View** [ ]  
**Section 11: Audit Logs** [ ]  
**Section 12: Search** [ ]  
**Section 13: Performance** [ ]  
**Section 14: Security** [ ]  
**Section 15: Emails** [ ]  
**Section 16: Data Integrity** [ ]

---

## Issues Found

**Template for logging issues:**

| #   | Section | Issue Description | Severity     | Steps to Reproduce | Expected | Actual |
| --- | ------- | ----------------- | ------------ | ------------------ | -------- | ------ |
| 1   |         |                   | High/Med/Low |                    |          |        |
| 2   |         |                   |              |                    |          |        |

**Severity Levels:**

- **High:** Blocks core functionality, data loss, security issue
- **Medium:** Feature doesn't work as expected, workaround available
- **Low:** UI issue, minor bug, enhancement

---

## Sign-Off

**Tester Name:** ****\*\*\*\*****\_\_\_****\*\*\*\*****  
**Date Completed:** ****\*\*\*\*****\_\_\_****\*\*\*\*****  
**Overall Status:** [ ] Pass [ ] Pass with Issues [ ] Fail

**Notes:**

---

---

---

---

**Last Updated:** 2026-01-21 08:18:00
