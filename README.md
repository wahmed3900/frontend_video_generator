# AI Video Studio — Frontend

Next.js frontend for the AI Video Generator. Generates short-form videos from a topic: script, AI visuals, voiceover, marketing copy, and thumbnails.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **TypeScript**

## Project Structure

```
app/
  page.tsx            # Landing page
  layout.tsx          # Root layout + nav
  globals.css         # Tailwind imports
  dashboard/
    page.tsx          # Generate a new video
  history/
    page.tsx          # View past videos by email
  pricing/
    page.tsx          # Plan comparison + Stripe checkout
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in your backend URL:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=https://your-python-backend.run.app
```

### 3. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

```bash
npx vercel --prod
```

Set `NEXT_PUBLIC_API_URL` in **Vercel → Project → Settings → Environment Variables**.

## Backend

The Python backend lives at [github.com/wahmed3900/backendAIassist](https://github.com/wahmed3900/backendAIassist).

Key endpoints this frontend calls:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/generate-video` | Start a job |
| `GET`  | `/jobs/{id}` | Poll status |
| `GET`  | `/jobs/{id}/video` | Download final video |
| `GET`  | `/jobs/{id}/marketing` | Marketing copy |
| `GET`  | `/jobs/{id}/thumbnails` | Thumbnail list |
| `GET`  | `/videos?email=` | Past jobs for a user |
| `POST` | `/create-checkout-session` | Stripe checkout |
| `GET`  | `/subscription-status?email=` | Plan + usage |
