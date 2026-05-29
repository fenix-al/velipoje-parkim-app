# Parkimi Velipojë — Sistemi i Menaxhimit të Parkimit

PWA me Next.js 15 për menaxhimin e parkimit të Bashkisë Velipojë. Mbështet 4 zona parkimi, ndërfaqe harpe për punonjës dhe dashboard statistikash për admin.

---

## Stack teknologjik

| Shtresë | Teknologjia |
|---------|-------------|
| Frontend | Next.js 15 App Router + TypeScript |
| Stilimi | Tailwind CSS + shadcn/ui |
| Harta | Leaflet (`CRS.Simple` + `ImageOverlay`) |
| Backend | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Grafiku | Recharts (vetëm në dashboard admin) |
| Testet | Vitest (unit) + Playwright (E2E) |

---

## Struktura e skedarëve

```
app/
  (auth)/login/             — Faqja e hyrjes
  (employee)/zones/         — Lista e zonave (punonjës)
  (employee)/zones/[code]/  — Harta e zonës (punonjës)
  (employee)/profile/       — Profili i punonjësit
  (admin)/admin/dashboard/  — Dashboard admin
  (admin)/admin/reports/    — Raporte
  (admin)/admin/history/    — Historiku
  (admin)/admin/zones/      — Menaxhimi i zonave
  (admin)/admin/map-editor/ — Editori i hartës
  (admin)/admin/users/      — Menaxhimi i përdoruesve
  (admin)/admin/settings/   — Cilësimet

components/
  map/        — ZoneMap, LeafletMap, SpotBottomSheet, MapLegend, OfflineBanner
  admin/      — OccupancyCards, HourlyChart, AvgDurationChart, ActivityTable, CSVExportButton
  auth/       — LoginForm
  shared/     — EmployeeNav, (AdminNav është te components/admin/)
  ui/         — shadcn/ui components

lib/
  supabase/   — client.ts, server.ts, types.ts
  actions/    — spots.ts (RPC), auth.ts, admin.ts
  db/         — queries.ts
  utils/      — coords.ts, time.ts, csv.ts, cn.ts

supabase/
  migrations/ — 001_schema, 002_rls, 003_rpc, 004_views
  seed.sql    — Zonat dhe vendet e parkimit
```

---

## Konfigurimi i projektit

### 1. Klono projektin

```bash
git clone <repo-url>
cd "app parkimi"
npm install
```

### 2. Supabase

Krijo një projekt të ri në [supabase.com](https://supabase.com) ose përdor Supabase CLI.

```bash
# Me Supabase CLI
supabase init
supabase link --project-ref <project-ref>
supabase db push
```

Ose ekzekuto manualisht SQL migracionet në SQL Editor:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_rpc_functions.sql`
4. `supabase/migrations/004_views.sql`
5. `supabase/seed.sql` (të dhëna fillestare)

### 3. Variablat e mjedisit

```bash
cp .env.local.example .env.local
```

Plotëso `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Krijo përdoruesin admin

Në Supabase Dashboard → Authentication → Users, krijo një përdorues të ri. Pastaj ekzekuto:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Emri Admin'
WHERE email = 'admin@bashkia.al';
```

### 5. Fotot e hartës

Vendos fotot reale të zonave të parkimit në `public/maps/`:
- `zona-1.jpg` (1200×800 px e rekomanduar)
- `zona-2.jpg`
- `zona-3.jpg`
- `zona-4.jpg`

Shiko `public/maps/README.md` për detaje mbi sistemin e koordinatave.

### 6. Ikojat PWA

Vendos ikojat në `public/icons/`:
- `icon-192.png`
- `icon-512.png`
- `apple-touch-icon.png`

### 7. Nis serverin

```bash
npm run dev
```

Hap [http://localhost:3000](http://localhost:3000).

---

## Bazën e të dhënave

### Tabelat

| Tabela | Përshkrim |
|--------|-----------|
| `profiles` | Profili i çdo përdoruesi auth |
| `zones` | 4 zonat e parkimit (Z1–Z4) |
| `parking_spots` | Vendet individuale me poligon JSONB |
| `parking_sessions` | Histori e çdo seance zënieje |
| `spot_events` | Log auditimi për çdo veprim |

### Format i poligonit

Koordinatat ruhen si `[[x,y],[x,y],...]` (piksel imazhi). Konvertohen automatikisht në formatin Leaflet `[y,x]` nga `lib/utils/coords.ts`.

### Funksionet RPC

| Funksioni | Përshkrim |
|-----------|-----------|
| `occupy_spot(uuid)` | Zë një vend të lirë |
| `release_spot(uuid)` | Liron një vend të zënë |
| `set_spot_out_of_service(uuid)` | Vendos jashtë shërbimit (supervisor/admin) |
| `restore_spot(uuid)` | Kthen në gjendje të lirë (supervisor/admin) |

Të gjitha RPC-të:
- Kontrollojnë `auth.uid()` dhe rolin
- Përdorin `now()` të serverit (kurrë timestamp klienti)
- Përdorin `SELECT ... FOR UPDATE` kundër race conditions
- Krijojnë event auditimi

### Pamjet (Views)

| Pamja | Përdorimi |
|-------|-----------|
| `v_current_occupancy_by_zone` | Kartat e dashboard-it live |
| `v_completed_sessions` | Statistikat historike |
| `v_active_sessions` | Seancat aktive |

---

## Rolet e përdoruesve

| Roli | Akses |
|------|-------|
| `employee` | `/zones`, `/zones/[code]`, `/profile` |
| `supervisor` | Si punonjës + mund të vendosë jashtë shërbimit |
| `admin` | Gjithçka + `/admin/*` |

Middleware kontrollon rolin nga server-side — admin routes janë të mbrojtura edhe nëse UI fshihet.

---

## Testet

```bash
# Unit tests (Vitest)
npm run test

# Me coverage
npm run test:coverage

# E2E (Playwright) — kërkon server aktiv
npm run test:e2e

# E2E me UI
npm run test:e2e:ui
```

Për E2E me autentifikimin real, vendos:
```env
TEST_EMAIL=employee@test.com
TEST_PASSWORD=test123
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=test123
```

---

## Realtime

Harta subscribet automatikisht ndaj ndryshimeve `parking_spots` për zonën aktuale:

```typescript
supabase.channel(`zone-${zoneId}-spots`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'parking_spots',
    filter: `zone_id=eq.${zoneId}`
  }, callback)
  .subscribe()
```

Kur një punonjës tjetër ndryshon një vend, harta përditësohet pa reload.

---

## PWA / Offline

- Manifest: `/public/manifest.json`
- Service Worker: `/public/sw.js`
- Imazhet e hartës cache-ohen pas vizitës së parë
- Veprimet (zënia/lirimi) kërkon lidhje interneti — shfaqet banner nëse offline

---

## Siguria

- **RLS** e aktivizuar në të gjitha tabelat
- Punonjësit nuk mund të ndryshojnë direkt `parking_spots` — vetëm nëpërmjet RPC
- Admin routes mbrohen **server-side** (middleware + layout check)
- Timestamp-at vijnë nga databaza (`now()`) — kurrë nga klienti

---

## Deployimi

```bash
npm run build
npm start
```

Ose deploy tek Vercel, Netlify, ose Railway. Vendos variablat e mjedisit në platformën e zgjedhur.
