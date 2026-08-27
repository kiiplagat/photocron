# Photochron

A photo app where photos are arranged by the date they were *taken*, not the
date they were posted. Follow other users, and control who sees each photo:
public, followers-only, or just you.

## 1. Open in VS Code

Unzip the project, then in VS Code: `File → Open Folder` and select the
`photochron` folder.

## 2. Install dependencies

Open a terminal in VS Code (`` Ctrl+` ``) and run:

```bash
npm install
```

## 3. Create your Supabase project

1. Go to https://supabase.com, sign in, and click **New project**.
2. Once it's created, go to **Project Settings → API**. You'll need:
   - Project URL
   - `anon` public key
3. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
4. Paste your Project URL and anon key into `.env.local`.

## 4. Set up the database

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the entire contents of `supabase/schema.sql` and click **Run**.
   This creates the `profiles`, `follows`, and `photos` tables, the storage
   bucket for images, and the row-level security policies that enforce the
   public / followers / only-you privacy rules directly in the database.

## 5. Run it locally

```bash
npm run dev
```

Open http://localhost:3000. Sign up, post a photo with a date, then create a
second test account to try following and the privacy settings.

## 6. Deploy the web app

1. Push this folder to a new GitHub repository.
2. Go to https://vercel.com → **Add New Project** → import the repo.
3. In the Vercel project's **Environment Variables**, add the same two
   values from your `.env.local`.
4. Click **Deploy**. Vercel will redeploy automatically on every push.

## 7. Turn it into a mobile app (optional next step)

The database and privacy rules already live in Supabase, so a React Native
(Expo) app can reuse them as-is:

```bash
npx create-expo-app photochron-mobile
cd photochron-mobile
npm install @supabase/supabase-js
```

Point it at the same `NEXT_PUBLIC_SUPABASE_URL` / anon key, rebuild the feed,
upload, and profile screens with React Native components, then deploy with:

```bash
npx eas build
npx eas submit
```

## How the privacy levels work

Every query for photos goes through Postgres row-level security — the rule
lives in the database (`supabase/schema.sql`), not just in the app's UI, so
it can't be bypassed by calling the API directly:

- **Public** — visible to anyone.
- **Followers** — visible only to accounts in the `follows` table that
  follow the photo's owner.
- **Only you** — visible only to the owner.

## Project structure

```
app/
  page.tsx                 Feed (photos from people you follow)
  login/page.tsx            Sign up / sign in
  upload/page.tsx           Post a photo, set its date + privacy
  explore/page.tsx          Search users and follow them
  profile/[username]/page.tsx   A user's timeline, grouped by month
components/
  Nav.tsx
  PhotoCard.tsx
lib/
  supabase/client.ts         Supabase client
  types.ts
supabase/
  schema.sql                 Tables + privacy policies — run this in Supabase
```
