---
name: FreshBowl local-only shared access
description: How dog-walker limited access works and why it is localStorage-only.
---

# FreshBowl dog-walker / shared access

FRESHBOWL has no backend. All data lives in the browser's `localStorage` under the `freshbowl_v2` key plus related `fb_*` keys. The "Dog Walker Access" feature in Profile → Share creates a limited PIN and permission list stored in `fb_shared_<dogId>`.

## Why this limitation exists

Without a backend, there is no real user account or cross-device sync. The walker feature is therefore a **same-device, local-only** simulation. It lets an owner create a PIN and a restricted view for a family member or dog walker, but it only works on the same device/browser where the owner data already exists.

## What the walker can and cannot do

Permissions are controlled by the owner per PIN:
- `canLogWalks` — start/stop the GPS walk tracker and save walks.
- `canLogFeeding` — mark AM/PM meals as fed on the current day.
- `canViewProfile` — view the current day's feeding schedule.

The walker cannot edit profile, medications, grooming, vaccinations, vet info, or the rotation plan.

## How to enter walker mode

Health Tools → Dog Walker Login → enter the PIN created in Profile → Share.

## Future note

If the project ever adds a real backend, replace this with per-user auth and invitation links; the UI surfaces (PIN input, permission toggles) can stay largely the same.
