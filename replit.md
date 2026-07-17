# FRESHBOWL

**FRESHBOWL: Total Health Tracking and Modular Whole-Food Meal Prep**

A full-featured React PWA for planning, tracking, and optimizing fresh whole-food meals for dogs. All data lives in the browser via `localStorage` under the `freshbowl_v2` key plus related `fb_*` keys.

## Artifacts

- `artifacts/freshbowl` — the main React + Vite web app (PWA).
- `artifacts/api-server` — API server (not used by this app; data is local-only).
- `artifacts/mockup-sandbox` — canvas / component preview server.

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui components
- next-themes for dark/light mode
- Recharts for nutrition charts
- `localStorage` for persistence

## Key Modules

- `src/lib/foods.ts` — FOODS nutrient database, AAFCO targets, supplement constants, and compliance math.
- `src/lib/rotation.ts` — 4-week rotating meal plan template and helpers.
- `src/lib/feedlog.ts` — feeding log, swaps, supplement checks, and daily notes.
- `src/lib/care.ts` — health checks, weight log, medications, grooming, vaccinations, vet info, walks, and shared dog-walker access.
- `src/lib/storage.ts` — dog/profile types and CRUD.
- `src/lib/nutrition.ts` — MER/RER calculation and `generateRotation()`.

## Pages

- **Home** — AM/PM meal cards, Mark Fed, swap sheets, supplement checklists, daily summary.
- **Feeding Schedule** — 4-week rotation viewer and month-based feeding calendar with day-detail modals and add-in items.
- **Nutrition** — AAFCO compliance bars from logged meals, macronutrient donut chart, daily averages, period selector.
- **Health Tools** — calculators, GPS walk tracker, and dog-walker limited-access login.
- **Guide** — whole-food feeding education, AAFCO tables, protein/organ/veg guides, transition steps, toxic foods.
- **Dog Profile** — dog details, favorites, saved calculator results, daily health checks, weight log, medications, grooming, vaccinations, vet info, and dog-walker sharing.

## Visual Style

"Canine Nutritionist Notebook": warm amber palette, Fraunces serif + Outfit sans-serif fonts, dark mode based on a deep brown palette. Page titles are shown at the top of every view.

## User Preferences

- Dark mode follows the user toggle in the header.
- The app is intentionally offline-first and local-only.
