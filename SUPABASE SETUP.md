# Turn on sign-up and login (Supabase, free)

The tracker has a built-in email + password sign-up and login screen. It stays switched off until you add your own free Supabase project. Each person's data is private to their account and syncs across their devices.

## 1. Create the project
1. Go to supabase.com, sign in, and click **New project**.
2. Pick a name, set a database password (keep it safe; the app never uses it), and choose a nearby region (for India: Mumbai).

## 2. Create the data table
Open **SQL Editor → New query**, paste this, and click **Run**:

```sql
create table public.tracker_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  json text not null,
  updated_at timestamptz not null default now()
);

alter table public.tracker_data enable row level security;

create policy "users manage their own row" on public.tracker_data
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

The last statement is what keeps each person's data private: a signed-in user can only read and write their own row.

## 3. Copy two values
Open **Project Settings → API** (or **API Keys**) and copy:
- **Project URL** (looks like `https://abcd1234.supabase.co`)
- **anon public key** (or the **publishable key**). Never use the `service_role` or secret key in this app.

## 4. Set the login options
- **Authentication → Providers → Email**: keep it enabled. "Confirm email" on means new users must click a link in their inbox before they can sign in. Turn it off if you want instant sign-up.
- **Authentication → URL Configuration**: set **Site URL** to your Netlify address, for example `https://dailydiettrackreport.netlify.app`.

## 5. Add the values to the app
Open `index.html`, find this line near the top, and fill it in:

```js
window.APP_CONFIG=window.APP_CONFIG||{supabaseUrl:"",supabaseKey:"",allowGuest:false};
```

For example:

```js
window.APP_CONFIG=window.APP_CONFIG||{supabaseUrl:"https://abcd1234.supabase.co",supabaseKey:"YOUR_ANON_OR_PUBLISHABLE_KEY",allowGuest:false};
```

Set `allowGuest:true` if you also want a "Continue on this device only" button.

## 6. Redeploy
Upload the edited `index.html` to Netlify again (Deploys → drag and drop, or push to GitHub). Open the site: you should see the Welcome screen with Sign in / Create account.

## Notes
- The anon/publishable key is meant to be public; the row-level security policy protects the data.
- Free projects pause after about a week of no activity. Open the Supabase dashboard to resume.
- Supabase's built-in email sending has low hourly limits. For many users, add your own SMTP under Authentication → SMTP.
- The "Ask Claude" suggestions and the AI health summary only work inside claude.ai. On your own site the rule-based Health report still works.
