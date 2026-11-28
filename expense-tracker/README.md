# Daily Spend — Expense Tracker

A lightweight, mobile-friendly monthly expense tracker.

## Features
- Record each expense with a description, amount in INR, and date.
- Monthly spending dashboard with total spent, remaining budget, and average daily spend.
- ₹5,000 monthly budget with 75%, 90%, and 100% warning thresholds.
- Day-wise summary with individual entries and daily totals.
- Switch between day-wise summary and the complete expense list.
- Delete an entry if it was recorded incorrectly.
- Month navigation to review previous and future months.

## Use
Open `index.html` in a browser, or publish this folder using GitHub Pages. No build step is required.

## Current data storage
The currently published app stores entries in the browser's `localStorage` on the device and browser where they were entered. It does not yet sync between devices.

## Preparing private cloud storage (Supabase)
The SQL schema for cloud storage is in [supabase-setup.sql](./supabase-setup.sql).

To activate cloud sync:
1. Create a free Supabase project at https://supabase.com/dashboard.
2. In the project, open **SQL Editor**, create a query, paste the contents of `supabase-setup.sql`, and run it.
3. Open **Project Settings → API** and copy the **Project URL** and **publishable key** (or legacy anon public key).
4. Provide those two public client values so the app can be connected.

The SQL enables Row Level Security and limits each signed-in user to their own expense rows. Never put a Supabase service-role key in this browser app or commit it to GitHub. The publishable/anon key is designed for browser use when Row Level Security is correctly enabled.

Cloud sync is not active until the app is connected to your Supabase project and the sign-in flow is configured.
