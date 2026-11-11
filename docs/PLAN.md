# Reptile Management: Architecture & Implementation Plan

## 1. Goals and constraints

| Need | Decision |
|---|---|
| One owner account holds all reptile data | Authenticated owner; sign-ups disabled after the first account |
| QR code per animal (labelled with its name) opens that reptile's info | Public, read-only page keyed by an unguessable token. **No login.** |
| Mostly ball pythons; track health, weight, feeding, cleaning | Typed log tables plus charts and "due" reminders |
| Little or no hosting cost or upkeep | Static site on GitHub Pages plus a managed free-tier backend |
| Must be able to add and edit reptiles | Needs a real backend. GitHub Pages alone can't do it |

**Why GitHub Pages alone won't work:** Pages only serves static files. Adding a reptile means writing data somewhere. The workaround of committing JSON through the GitHub API from the browser needs a token in the client. It also has no real auth and would make your animal data public. So the frontend lives on Pages and the data lives in a small managed backend.

## 2. Architecture

```
 Phone / laptop browser (PWA)
        │ static assets
        ▼
 GitHub Pages  ── React/Vite SPA (built by GitHub Actions)
        │
        │ HTTPS (supabase-js)
        ▼
 Supabase (free tier)
   ├─ Postgres  (data, Row Level Security)
   ├─ Auth      (owner login, magic link or email+password)
   ├─ Storage   (animal / shed / health photos)
   └─ RPC       get_animal_public(token)  ← what a QR scan calls, no auth
```

**Recommendation: GitHub Pages + Supabase.** It is the least infrastructure to run and gives real SQL, auth, file storage and row-level security.

Alternative: Cloudflare Pages + Workers + D1. It has no inactivity pause and one vendor, but you'd hand-write the auth and API layer. I'd only switch if the Supabase pause behavior below annoys you.

**Supabase free-tier caveats**
- Projects pause after about 7 days of inactivity. Daily use keeps it awake. A weekly GitHub Actions cron ping covers vacations.
- The free tier has no downloadable backups, so we add our own scheduled export (see §8).

**GitHub Pages caveat:** Pages on a *private* repo needs a paid GitHub plan. On a free plan the repo must be public. That's fine as long as no secrets or data live in the repo. The Supabase anon key is designed to be public, and RLS is the real protection.

## 3. The QR code flow (no login)

**The QR points to the animal.** The printed label carries the snake's name and its code, so each label is unambiguous. Because the code follows the snake, the label sticks with the animal's enclosure *only as long as you keep them together*. If you move a snake, move its label too. The page also shows which enclosure it is currently assigned to, so a mismatch is easy to spot.

1. Each animal gets `public_token`, 128-bit random, URL-safe (about 22 chars).
2. QR encodes `https://<host>/#/a/<public_token>`. Hash routing avoids the Pages 404 problem for deep links.
3. The page calls the RPC `get_animal_public(token)`. It is `SECURITY DEFINER`, returns only a whitelisted projection of that one animal (plus its current enclosure's cleaning info), and is granted to `anon`.
4. All base tables have RLS so `anon` cannot `SELECT` them directly. The only door is the RPC. Without the token there is nothing to enumerate.

**What the scan page shows (read-only):** name, morph, sex, age, photo, current enclosure/location, current weight with a small weight sparkline, last feeding (date, prey, result), next feeding due, last and next cleaning, last shed, and any open health flag such as "on treatment until…". Cleaning comes from the animal's current enclosure.

**Deliberately not public:** purchase price, source, owner notes marked private, other animals, and account info. Each token exposes only its own animal.

**Threat model:** anyone who has the QR link sees that one enclosure's page. That matches your stated trust model (only people in the room). If a label leaks, "Regenerate QR" in the owner UI rotates that animal's token and the old one dies instantly. The RPC should be cheap and rate limited, and tokens get a unique index.

**QR permanence:** no custom domain, so the codes use `prestonsc.github.io/ReptileManagement`. Renaming the repo or your GitHub username would break every sticker, so settle the repo name before printing labels. (Moving to a custom domain later would mean reprinting; with 5 to 10 animals that is a small job.)

## 4. Data model (Postgres)

All rows carry `owner_id uuid references auth.users` for RLS, and `created_at`.

- **animals**: id, name, public_token (unique), species (default *Python regius*), morph/genes, sex, hatch_date, acquired_date, source, price, status (active, sold, deceased, breeder), notes, photo_path
- **enclosures**: id, label ("Rack A-3"), location/room, type (tub, rack, vivarium), dimensions, notes
- **placements**: animal_id, enclosure_id, start_at, end_at. History of moves. The current occupant is the row with `end_at is null`, enforced by a partial unique index per enclosure.
- **weights**: animal_id, measured_at, grams, notes
- **feedings**: animal_id, fed_at, prey_type (mouse, rat, ASF), prey_stage (pinky, fuzzy, hopper, adult…), prey_weight_g, frozen_thawed/live, outcome (ate, refused, regurgitated), notes
- **sheds**: animal_id, shed_at, complete (bool), notes
- **cleanings**: enclosure_id, cleaned_at, kind (spot, full, substrate change, disinfect), notes
- **health_events**: animal_id, occurred_at, kind (vet visit, mites, RI, retained shed, injury, medication…), description, treatment, resolved_at, vet, cost
- **husbandry_readings** (phase 4+): enclosure_id, at, temp_hot/cool, humidity
- **schedules**: animal_id or enclosure_id, task_type, interval_days. These drive the "due" calculations, e.g. feed every 7d for juveniles, 10 to 14d for adults, full clean every 30d.
- **photos**: id, animal_id, storage_path, caption, taken_at
- *Later:* **pairings**, **clutches**, **hatchlings** if you breed.

**Design notes**
- Typed tables for weights and feedings (not one generic events blob) so queries and charts are simple. Health is intentionally free-form.
- "Due" dates are *computed* from the last event plus the schedule, so nothing gets out of sync.
- Weights are stored in grams and prey in grams. Display units are a UI setting.

## 5. Frontend

**Stack:** Vite + React + TypeScript, Tailwind, TanStack Query, `supabase-js`, `vite-plugin-pwa`, `qrcode` (client-side generation), a small chart lib (e.g. Recharts or uPlot).

**Screens**
- **Public (no login):** `/#/e/:token`. Mobile-first, large type, fast, minimal JS path.
- **Owner:**
  - Dashboard: "needs attention today" (feed due, clean due, health flags), refusals streak, weight-loss alerts.
  - Animals list and detail: tabs for Overview, Weight (chart), Feeding, Sheds, Health, Photos.
  - Enclosures: list, assign and move animal.
  - Labels: **print QR labels** (one per animal, with the animal's name above the code).
  - Quick-add forms: log a weight or feeding in 2 taps from the animal page.
  - Settings: units, schedules, export, token rotation.

**QR label printing:** a print stylesheet that lays out a sheet of animal-name + QR cells. Use error-correction level Q or M and a quiet zone. Laminate or use label tape, since reptile rooms are humid.

**Offline:** the PWA caches the app shell. Cache the last-viewed scan page so a scan works with weak room Wi-Fi. Queue offline writes only for the quick-log forms.

## 6. Security

- **RLS on every table**: `owner_id = auth.uid()`. `anon` gets *no* table grants, only `EXECUTE` on the one RPC.
- Disable public sign-ups after creating your account (Supabase Auth setting). Optionally allowlist your email.
- Storage buckets are private. Public-page photos are served via signed URLs minted *inside* the RPC path (or a dedicated public thumbnail bucket with random filenames, if signed URLs prove too heavy).
- No secrets in the repo. The only client config is the Supabase URL and anon key via build-time env.
- A policy test suite (pgTAP or a script) asserts: anon can't read tables, anon with a valid token gets only whitelisted fields, and a bad token returns nothing. Rotating a token kills the old one.

## 7. Repo layout

```
/
├─ docs/PLAN.md
├─ web/                    # Vite app
│  ├─ src/{routes,components,lib,hooks}
│  └─ public/
├─ supabase/
│  ├─ migrations/          # SQL schema, RLS, RPC (source of truth)
│  ├─ seed.sql
│  └─ tests/               # policy tests
└─ .github/workflows/
   ├─ deploy.yml           # build web/ → GitHub Pages
   ├─ ci.yml               # typecheck, lint, tests
   └─ backup-keepalive.yml # weekly ping + export
```

## 8. Backup and ops

- In-app **Export all** to JSON/CSV.
- A weekly GitHub Action runs the export with a service key stored in *Actions secrets* and uploads it as a private artifact. It must never be committed, because the repo is public. Alternative: push it to a private bucket.
- The same workflow pings the project so it never auto-pauses.
- Schema changes only through `supabase/migrations`.

## 9. Implementation phases

| Phase | Deliverable | Done when |
|---|---|---|
| **0. Scaffold** | Repo, Vite app, Supabase project, GH Pages deploy via Actions, CI | A "hello" page loads on your Pages URL and talks to Supabase |
| **1. Core data** | Auth, animals + enclosures CRUD, placements | You can log in, add your snakes, assign them to enclosures |
| **2. QR** | Per-animal token generation, public RPC, public scan page, label print sheet, token rotation, policy tests | Scanning a printed code on your phone logged out shows the right snake |
| **3. Care logging** | Weights, feedings, sheds, cleanings, health events with charts and history | You can replace your current notes/spreadsheet |
| **4. Schedules and dashboard** | Due/overdue logic, in-app dashboard, in-app alerts (refusal streaks, weight drop). No email/push. | Opening the app tells you what to do today |
| **5. Photos, export, backup, PWA/offline** | Image upload, JSON/CSV export, weekly backup job, offline cache | Safe to rely on |
| **6. Nice-to-haves (not planned)** | Breeding/clutch tracking, genetics calculator, temp/humidity sensors | Only if wanted |

Phases 0 to 2 are the MVP and can be done in a few focused sessions. Phase 3 is where it becomes useful day to day.

## 10. Decisions made

- **QR is per animal**, labelled with the animal's name.
- **Scans are read-only until unlocked.** The public page has an "Unlock to edit" wall that uses the owner's account password (email is remembered on the device). Unlocking signs in and opens that animal's care log. A per-animal PIN was considered and rejected: 4 digits can be brute-forced through a public endpoint without extra lockout logic, and the account login reuses existing RLS.
- **No custom domain.** Use the default GitHub Pages URL; finalize the repo name before printing.
- **No reminders** beyond the in-app dashboard.
- **Scale: 5 to 10 animals.** Keep it simple: no bulk import, no pagination, one owner.

## 11. Remaining questions

1. Is a **public repo** OK? Required for free GitHub Pages. No data lives in it.
2. Do you want the repo name to stay `ReptileManagement` for the permanent QR URL?
