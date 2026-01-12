# Admin Dashboard Implementation Plan

## 1. Overview
The goal is to create a secure, private dashboard accessible only to administrators at `yourdomain.com/admin`. This dashboard will allow you to:
- View all successful transactions.
- Manually create "Standard/Premium" projects without payment (for testing or VIPs).
- View application activity logs.
- Manage users (optional).

## 2. Access Strategy & Security
**How to access:**
You will access this via `https://your-domain.com/admin`.
It will **not** be visible to regular users. If a regular user tries to visit that URL, they will be redirected to the homepage or a 403 Access Denied page.

**Authentication Mechanism:**
Instead of a separate "admin login" page with a hardcoded password (which is insecure), we will use the existing Supabase authentication but add a **Role-Based Access Control (RBAC)** system.

1.  **Database:** We add a `role` column to your `user_profiles` table.
2.  **Middleware:** Next.js Middleware will intercept requests to `/admin`. It checks:
    *   Is the user logged in?
    *   Does the user's profile have `role: 'admin'`?
3.  **If authorized:** They see the dashboard.
4.  **If not:** They are kicked out.

## 3. Implementation Steps

### Step 1: Database Updates (Supabase)
Run these SQL commands in your Supabase SQL Editor to prepare the system:

```sql
-- 1. Add role column to profiles
ALTER TABLE user_profiles 
ADD COLUMN role text DEFAULT 'user';

-- 2. Make YOURSELF the admin (replace with your actual email)
UPDATE user_profiles 
SET role = 'admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
);

-- 3. Create an Activity Log table (optional, for checking logs)
CREATE TABLE admin_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  details jsonb,
  created_at timestamptz DEFAULT now()
);
```

### Step 2: Secure the Route (Middleware)
Create or update `middleware.js` in your root directory to protect the `/admin` route.

```javascript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  // Protect Admin Routes
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/', req.url)) // Kick non-admins out
    }
  }

  return res
}
```

### Step 3: Build the Dashboard Layout
Create `src/app/admin/layout.js`:
- A separate sidebar/layout distinct from the user dashboard.
- Links to: "Transactions", "Create Project", "Logs".

### Step 4: Develop Features

#### A. View Transactions
*   **Page:** `src/app/admin/transactions/page.js`
*   **Logic:** Fetch data from `payment_transactions` table where `status = 'paid'`.
*   **Display:** A table showing User Email, Amount, Date, and Payment Reference.

#### B. Bypass Project Creation (Free Standard Project)
*   **Page:** `src/app/admin/create/page.js`
*   **Logic:** A form similar to the user's "New Project" form, but simplified.
*   **Action:** When you click "Create", it calls a server action that:
    1.  Validates the inputs.
    2.  Inserts directly into `standard_projects` table.
    3.  Sets `payment_status` to `'admin_bypass'` or `'paid'`.
    4.  Logs this action in `admin_logs` so you know who created it.

#### C. System Logs
*   **Page:** `src/app/admin/logs/page.js`
*   **Logic:** Fetch from `admin_logs` (created in Step 1) or view Vercel Runtime logs if integrated.

## 4. Summary of Workflows

1.  **To Access:** You go to `domain.com/admin`.
2.  **To Login:** You log in with your normal email/password. Because your DB row says `admin`, the door opens.
3.  **To Grant Access:** If you hire a co-admin, you just go to Supabase and change their `role` to `'admin'`. No shared passwords needed.

## 5. Directory Structure
```
src/
└── app/
    └── admin/           <-- Protected Route
        ├── layout.js    <-- Admin Sidebar
        ├── page.js      <-- Dashboard Overview (Stats)
        ├── transactions/
        │   └── page.js  <-- Table of payments
        ├── logs/
        │   └── page.js  <-- Activity history
        └── create-project/
            └── page.js  <-- The "Bypass" form
```
