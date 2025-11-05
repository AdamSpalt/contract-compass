# Contract Compass

Welcome to Contract Compass, a web application designed to help users manage and track their contracts efficiently. The application provides a clear and intuitive dashboard to view all contracts, with a special focus on upcoming expiration dates, ensuring you never miss an important deadline.

This project is built with a modern technology stack, making it fast, reliable, and easy to maintain.

## Table of Contents

- [Key Features](#key-features)
- [AI-Powered PDF Import](#ai-powered-pdf-import)
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
- **AI-Powered PDF Import (Temporarily Disabled)**: A feature to automatically extract data from PDF contracts using Google Document AI. This feature is currently under review.
- **Scalable Backend**: Built on Supabase for robust data management and authentication.

## AI-Powered PDF Import

**Note: This feature is temporarily disabled.** The initial implementation used Google Cloud's pre-trained Form Parser. While powerful, the results were not consistently accurate enough across different contract layouts to provide a reliable user experience. The generic nature of the AI's response required significant custom mapping and data transformation logic. Due to these limitations, the feature has been paused pending further review and potential use of a custom-trained model.

The feature was designed to allow users to upload a contract in PDF format, have the system parse it using AI, and automatically pre-fill the "Add New Contract" form.

### How It Works

1.  The user clicks "Import from PDF" on the dashboard and is taken to the `/contracts/import` page.
2.  The user selects a PDF and clicks "Upload and Process".
3.  The backend API (`/api/process-contract`) sends the file to the configured Google Document AI processor.
4.  The API receives the extracted key-value pairs (e.g., "Polisa numer", "Całkowita składka").
5.  The API maps these keys to the application's data model (e.g., `contract_number`, `contract_value`) and handles data parsing (e.g., extracting dates from a string).
6.  The processed data is stored in the browser's `sessionStorage`.
7.  The user is redirected to the `/contracts/new` page, where a script reads the data from `sessionStorage` and pre-fills the form fields.

## Use Cases

As a Person managing multiple contracts (insurance policies/subscriptions), you can use Contract Compass to:

- **Monitor Contract Lifecycles**: Keep track of all active contracts and their end dates to plan for renewals or terminations.
- **Quickly Access Contract Information**: The main dashboard provides an at-a-glance view of your contract portfolio.
- **Prevent Missed Deadlines**: By sorting contracts by their expiration date, the application helps you prioritize and act on time-sensitive agreements.
- **Centralize Documentation**: Store and retrieve contract documents associated with each entry.

## Technical Architecture

Contract Compass is a full-stack application built using SvelteKit. It uses Supabase for its primary database and authentication, and Google Cloud Document AI for intelligent document processing.

### Frontend

- **[SvelteKit](https://kit.svelte.dev/)**: The application is built with SvelteKit, a modern web framework that provides a rich developer experience with features like server-side rendering (SSR), routing, and build optimizations.
- **[Svelte](https://svelte.dev/)**: The UI is written in Svelte, a component-based framework that compiles to highly efficient vanilla JavaScript.
- **[TypeScript](https://www.typescriptlang.org/)**: The entire codebase is written in TypeScript for enhanced type safety and developer productivity.

### Backend

- **[Node.js](https://nodejs.org/)**: The server-side logic in SvelteKit runs on Node.js.
- **Server-Side Rendering (SSR)**: The initial page load is rendered on the server (`+page.server.ts`) for faster performance and better SEO. The server fetches all contracts from the database before sending the page to the client.
- **API Endpoints**: SvelteKit endpoints are used to handle specific server-side tasks.
  - The endpoint at `/api/process-contract` handles the PDF upload and communication with the Google Document AI API.
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

*   Node.js (v18 or higher recommended)
*   npm (or pnpm/yarn)
*   A Supabase account (for database and authentication).
*   A Google Cloud Platform account with the Document AI API enabled 

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repository-url>
    cd contract-compass
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the root of your project and add the variables as described below.

### Environment Variables
3.  Set up your environment variables by creating a `.env` file in the root of the project.

The project requires environment variables for both Supabase and Google Cloud.

```env
PUBLIC_SUPABASE_URL="your-supabase-project-url"
PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

```AI Import SetupS
GOOGLE_PROJECT_ID="your-gcp-project-id"
GOOGLE_LOCATION="eu"
GOOGLE_PROCESSOR_ID="your-processor-id"
```
To create a production version of your app:
```bash
npm run build