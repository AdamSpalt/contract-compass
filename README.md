# Contract Compass

Welcome to Contract Compass, a web application designed to help users manage and track their contracts efficiently. The application provides a clear and intuitive dashboard to view all contracts, with a special focus on upcoming expiration dates, ensuring you never miss an important deadline.

This project is built with a modern technology stack, making it fast, reliable, and easy to maintain.

![Contract Compass Dashboard](./.github/images/dashboard-screenshot.png)

## Table of Contents

- [Key Features](#key-features)
- [Use Cases](#use-cases)
- [Technical Architecture](#technical-architecture)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Database](#database)
- [Deployment & Automation](#deployment--automation)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Building for Production](#building-for-production)

## Key Features

- **Centralized Contract Dashboard**: View all your contracts in a single, organized list.
- **Sorted by Expiration**: Contracts are automatically sorted by their end date, allowing you to easily see which ones require attention soon.
- **Secure File Handling**: Upload and securely access contract documents.
- **Automated Email Reminders**: Automatically sends email notifications 30, 14, and 7 days before a contract's end date to ensure timely renewals.
- **Scalable Backend**: Built on Supabase for robust data management and authentication.
- **Modern Web Experience**: Fast and responsive user interface built with SvelteKit.

## Use Cases

As a Person managing multiple contracts (insurance policies/subscriptions), you can use Contract Compass to:

- **Monitor Contract Lifecycles**: Keep track of all active contracts and their end dates to plan for renewals or terminations.
- **Quickly Access Contract Information**: The main dashboard provides an at-a-glance view of your contract portfolio.
- **Prevent Missed Deadlines**: By sorting contracts by their expiration date, the application helps you prioritize and act on time-sensitive agreements.
- **Centralize Documentation**: Store and retrieve contract documents associated with each entry.

## Technical Architecture

Contract Compass is a full-stack application built using SvelteKit, with Supabase serving as the backend-as-a-service (BaaS) platform.

### Frontend

- **[SvelteKit](https://kit.svelte.dev/)**: The application is built with SvelteKit, a modern web framework that provides a rich developer experience with features like server-side rendering (SSR), routing, and build optimizations.
- **[Svelte](https://svelte.dev/)**: The UI is written in Svelte, a component-based framework that compiles to highly efficient vanilla JavaScript.
- **[TypeScript](https://www.typescriptlang.org/)**: The entire codebase is written in TypeScript for enhanced type safety and developer productivity.

### Backend

- **[Node.js](https://nodejs.org/)**: The server-side logic in SvelteKit runs on Node.js.
- **Server-Side Rendering (SSR)**: The initial page load is rendered on the server (`+page.server.ts`) for faster performance and better SEO. The server fetches all contracts from the database before sending the page to the client.
- **API Endpoints**: SvelteKit endpoints are used to handle specific server-side tasks, such as serving uploaded files. The endpoint at `src/routes/+server.ts` is responsible for securely streaming files from a private `uploads` directory.
- **Automated Reminders (Supabase Edge Function)**: A serverless Edge Function (`email-reminder`) contains the logic for the automated reminder system. It queries the database for contracts nearing their end date and dispatches emails.
- **Task Scheduling (pg_cron)**: A cron job scheduled with the `pg_cron` extension within the Supabase database triggers the `email-reminder` function once every day, making the process fully automated.
- **Email Delivery (Resend)**: The Resend service is integrated into the Edge Function to send formatted HTML email reminders with dynamic links back to the application.

### Database

- **Supabase**: Supabase is used as the backend data store. It's a powerful open-source Firebase alternative that provides a PostgreSQL database, authentication, and auto-generated APIs.
- **Data Model**: The primary data entity is `contracts`, which stores information about each contract. It includes an `end_date` for tracking expirations and boolean flags (`thirty_day_reminder_sent`, `fourteen_day_reminder_sent`, `seven_day_reminder_sent`) to prevent duplicate reminders.

## Deployment & Automation

- **Vercel**: The SvelteKit frontend is deployed on Vercel, which connects to the project's GitHub repository for continuous deployment.
- **Supabase CLI**: The Supabase CLI is used to deploy the Edge Function and manage database secrets.
- **GitHub Actions**: A GitHub Action workflow is set up to automatically deploy the `email-reminder` function to Supabase whenever changes are pushed to its directory, ensuring the backend logic is always up-to-date.

## Project Structure

The project follows the standard SvelteKit directory structure:

```
/
├── src/
│   ├── lib/
│   │   └── server/
│   │       └── supabase.ts  # Supabase client initialization
│   └── routes/
│       ├── +page.svelte     # Main dashboard UI component
│       ├── +page.server.ts  # Server-side data loading for the dashboard
│       └── +server.ts       # Endpoint for serving uploaded files (DEPRECATED/REPLACED)
├── supabase/
│   └── functions/
│       └── email-reminder/
│           └── index.ts     # Backend logic for sending email reminders
├── static/
│   └── ...                  # Static assets
└── uploads/
    └── ...                  # Private directory for uploaded contract files
```

## Getting Started

Follow these instructions to get a local copy of the project up and running.

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (or pnpm/yarn)

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repository-url>
    cd contract-compass
    ```
2.  Install the dependencies:
    ```bash
    npm install
    ```

### Environment Variables

The project requires two sets of environment variables.

#### Frontend Application (.env)

Create a `.env` file in the root of your project for the SvelteKit application:

```env
PUBLIC_SUPABASE_URL="your-supabase-project-url"
PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

You can find these keys in your Supabase project's API settings.

### Running the Application

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## Building for Production

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

---

_This README was generated with the assistance of Gemini Code Assist._
