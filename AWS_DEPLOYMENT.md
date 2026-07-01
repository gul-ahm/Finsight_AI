# FinanceAI - AWS Amplify Deployment Guide

This guide provides step-by-step instructions to deploy the **FinanceAI** application to **AWS Amplify**. AWS Amplify is 100% free-tier friendly (includes 15 GB/month data transfer and 1,000 build minutes/month) and natively supports Next.js (App Router), making it the perfect free alternative to GCP Cloud Run.

---

## Prerequisites

Before starting, make sure you have:
1. An **AWS Account** (Free tier enabled).
2. Your project pushed to a **GitHub Repository**.
3. Your Supabase PostgreSQL database URL (already configured in your local `.env`).

---

## Step 1: Set Up your AWS Amplify App

1. Sign in to the [AWS Management Console](https://aws.amazon.com/).
2. In the search bar at the top, type **Amplify** and click on **AWS Amplify**.
3. In the Amplify dashboard, click **Create new app** (or **Host web app**).
4. Select **GitHub** as your repository source and click **Next**.
5. Authenticate with GitHub and select your repository:
   * **Repository**: `Ai-Finance` (or your repository name)
   * **Branch**: `main`
6. Click **Next**.

---

## Step 2: Configure Build Settings

Amplify will automatically detect that this is a **Next.js** application.

1. Under **App settings**, verify the build settings. Amplify automatically generates a configuration suitable for Next.js.
2. Click on the **Advanced settings** dropdown.
3. In **Environment variables**, add the following keys so they are available during build time:

| Variable Name | Value |
| :--- | :--- |
| `DATABASE_URL` | `postgresql://postgres:Saniya%402820@db.swhiszeosmfnclhqmpnn.supabase.co:5432/postgres` |
| `NEXTAUTH_SECRET` | `replace_this_with_a_random_long_string` |
| `NEXTAUTH_URL` | Your AWS Amplify URL (you will update this once the URL is generated, e.g., `https://main.dxxxxxxxxxx.amplifyapp.com`) |
| `TWELVE_DATA_API_KEY` | `7b806b51e3b84f8583cae9040b4e1ef3` |
| `NEWSAPI_API_KEY` | `c2d5aa36b3fc489589c2a5bc67b32a3a` |
| `TAVILY_API_KEY` | `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` |

4. Click **Next**.

---

## Step 3: Save and Deploy

1. Review your settings on the final page.
2. Click **Save and Deploy**.
3. AWS Amplify will provision a container, build the Next.js standalone application, and deploy it to a global CDN. This takes about 3–5 minutes.

---

## Step 4: Update NEXTAUTH_URL

Once deployment succeeds, Amplify will provide you with a live URL (e.g., `https://main.d123456789abcd.amplifyapp.com`).

1. Copy this URL.
2. In the AWS Amplify dashboard, navigate to **App settings** -> **Environment variables**.
3. Edit the `NEXTAUTH_URL` variable to point to your live URL:
   * Example: `https://main.d123456789abcd.amplifyapp.com`
4. Re-run a build (click **Redeploy version**) to ensure NextAuth updates the redirect callbacks.
5. Your portfolio project is now live on the internet!
