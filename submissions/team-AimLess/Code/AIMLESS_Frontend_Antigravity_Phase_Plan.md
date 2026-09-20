# AIMLESS — Frontend Implementation Plan for Antigravity

## 0. Purpose

This document is the implementation blueprint for the AIMLESS frontend.

The frontend must be built phase-by-phase in Antigravity. Do not ask Antigravity to invent the entire application at once. Each phase must be implemented, tested, and stabilized before moving to the next phase.

The frontend must remain compatible with the shared project architecture:

- Next.js
- TypeScript
- PostgreSQL-backed application data
- Socket.IO for real-time events
- Browser Geolocation API for GPS
- External map/routing service when the backend integration is ready
- No Express, Gin, or separate backend framework
- No Road User role in the MVP

The core emergency cooperation chain is:

Citizen / Guest → Emergency Incident → Ambulance → Hospital → Admin

The future road-user cooperative corridor is intentionally outside the MVP.

---

# 1. Product Definition

AIMLESS is a cooperative emergency response system for road accidents.

The MVP coordinates four actors:

1. Citizen
2. Ambulance Driver
3. Hospital
4. Admin

The system should make an emergency journey visible and coordinated:

1. A citizen or guest reports an accident.
2. The browser obtains the reporter's GPS location.
3. The emergency is created.
4. Nearby available ambulances are identified.
5. An ambulance driver receives the emergency.
6. The driver accepts the emergency.
7. The ambulance shares its live location.
8. The ambulance transports the patient.
9. The driver selects a nearby hospital.
10. The hospital receives the emergency notification.
11. The hospital dashboard enters an incoming-emergency state and plays an alarm/siren.
12. Hospital staff acknowledge and prepare the emergency department.
13. The ambulance arrives.
14. The hospital marks the patient as arrived.
15. The incident is closed.
16. Admin can monitor the overall system.

---

# 2. Design Direction

## 2.1 Visual identity

The entire normal UI should use a strict white-and-black visual language inspired by the supplied Mobbin design analysis.

Primary visual principles:

- White canvas
- Near-black typography
- Near-black primary actions
- Very light neutral surfaces
- Minimal borders
- Very limited shadows
- Rounded 24px cards
- Pill-shaped interactive controls
- Strong typography hierarchy
- Generous whitespace
- Subtle motion
- No unnecessary decorative colors

The uploaded Mobbin analysis specifies:

- Ink: `#141414`
- White canvas: `#FFFFFF`
- Soft canvas: `#F3F3F3`
- Field: `#F0F0F0`
- Hairline: `#E0E0E0`
- Muted text: `#707070`
- Faint text: `#ADADAD`
- Primary heading weight approximately 652
- Body weight approximately 456
- Light supporting text approximately 300
- 24px content-card radius
- 16px input radius
- Full pill controls

Use the design reference as the source for the visual language.

Do not introduce random gradients, colorful dashboard cards, glassmorphism, excessive shadows, or unrelated visual styles.

---

# 3. Typography

Preferred font:

- Saans, if legally/technically available.

Fallback:

- Inter
- system sans-serif

Suggested hierarchy:

```text
Display:
80px / 650

H1:
56px / 650

H2:
44px / 650

H3:
32px / 650

H4:
24px / 650

Title:
20px / 600

Body Large:
20px / 300

Body:
16px / 450

Body Small:
14px / 450

Label:
12px / 600
```

Responsive typography must scale down appropriately on mobile.

Do not use excessive uppercase text. Use sentence case for most UI.

---

# 4. Color Tokens

Create centralized design tokens.

```css
--ink: #141414;
--ink-soft: #262626;
--white: #ffffff;
--canvas-soft: #f3f3f3;
--field: #f0f0f0;
--hairline: #e0e0e0;
--hairline-soft: #f0f0f0;
--text-muted: #707070;
--text-faint: #adadad;
```

Normal product UI should remain monochrome.

## Emergency state exception

Emergency information must be visually unmistakable.

Do not turn the entire application into a colorful dashboard.

Use:

- strong black emergency panels
- high-contrast typography
- pulsing motion
- expanding alert panels
- iconography
- sound for hospital emergency alerts

If semantic colors are eventually needed for accessibility, keep them limited to state indicators and document their use rather than introducing them decoratively.

---

# 5. Geometry

Use:

```text
Input radius: 16px
Card radius: 24px
Modal radius: 24px
Button radius: 9999px
Status pill radius: 9999px
```

Primary buttons should be pill-shaped.

Cards should feel spacious rather than dense.

---

# 6. Motion System

Motion is important to the AIMLESS experience.

The interface should feel modern and responsive without becoming distracting.

Use motion to communicate state changes.

## Allowed motion

### Page entrance

- opacity 0 → 1
- translateY 12–20px → 0

### Cards

- subtle fade/slide when appearing
- staggered entrance for dashboard lists

### SOS

When SOS is activated:

1. Button responds immediately.
2. Button enters loading state.
3. GPS acquisition animation appears.
4. Location confirmation transitions into view.
5. Submission confirmation animates into view.

### GPS

Use a subtle scanning/pulse indicator while acquiring location.

### Incoming ambulance

Use:

- panel slide
- subtle pulse
- live ETA update
- marker animation

### Hospital emergency

When a hospital receives an emergency:

- emergency panel expands
- dashboard enters emergency mode
- visual pulse
- siren begins
- acknowledge button becomes prominent

After acknowledgement:

- alarm stops
- emergency panel settles
- normal dashboard motion resumes

## Motion constraints

Do not:

- animate every element continuously
- use excessive bouncing
- use flashy particle effects
- use large decorative transitions
- make critical information difficult to read

Motion should communicate meaning.

---

# 7. Application Structure

Use Next.js App Router.

Suggested structure:

```text
app/
├── page.tsx
├── login/
│   └── page.tsx
├── register/
│   └── page.tsx
├── emergency-report/
│   └── page.tsx
├── citizen/
│   ├── page.tsx
│   ├── incident/
│   │   └── [id]/
│   │       └── page.tsx
│   └── profile/
│       └── page.tsx
├── ambulance/
│   ├── page.tsx
│   ├── incident/
│   │   └── [id]/
│   │       └── page.tsx
│   └── profile/
│       └── page.tsx
├── hospital/
│   ├── page.tsx
│   ├── incident/
│   │   └── [id]/
│   │       └── page.tsx
│   └── profile/
│       └── page.tsx
└── admin/
    ├── page.tsx
    ├── incidents/
    ├── ambulances/
    ├── hospitals/
    └── users/
```

Suggested shared code:

```text
components/
├── ui/
├── auth/
├── emergency/
├── citizen/
├── ambulance/
├── hospital/
├── admin/
├── map/
└── layout/

lib/
├── api.ts
├── auth.ts
├── socket.ts
├── geolocation.ts
├── validation.ts
└── constants.ts

types/
├── auth.ts
├── incident.ts
├── ambulance.ts
├── hospital.ts
├── notification.ts
└── socket.ts
```

Do not duplicate components across role dashboards when a shared component can be used.

---

# 8. Shared Type Contracts

Create shared TypeScript types early.

## User roles

```ts
export type UserRole =
  | "CITIZEN"
  | "AMBULANCE"
  | "HOSPITAL"
  | "ADMIN";
```

There must NOT be:

```ts
"ROAD_USER"
```

in the MVP.

## Incident status

```ts
export type IncidentStatus =
  | "REPORTED"
  | "DISPATCHING"
  | "AMBULANCE_ASSIGNED"
  | "AMBULANCE_EN_ROUTE"
  | "PATIENT_PICKED_UP"
  | "HOSPITAL_NOTIFIED"
  | "HOSPITAL_PREPARING"
  | "EN_ROUTE_TO_HOSPITAL"
  | "ARRIVED"
  | "CLOSED";
```

The frontend must not invent alternative spellings.

---

# PHASE 1 — LANDING + AUTHENTICATION

## Goal

Build the public entry point and secure role-aware authentication foundation.

Do not build dashboards yet.

---

## 1.1 Landing page

Route:

```text
/
```

Purpose:

Introduce AIMLESS and provide immediate access to emergency reporting.

Required elements:

- AIMLESS logo/wordmark
- short explanation
- primary emergency action
- login action
- registration action
- subtle motion
- responsive layout

Primary action:

```text
REPORT EMERGENCY
```

This action must be visible without scrolling on desktop and mobile.

Secondary actions:

```text
LOG IN
CREATE ACCOUNT
```

The emergency button must not require authentication.

Suggested hero copy:

```text
Emergency response,
coordinated in real time.
```

Supporting copy:

```text
Report an accident, connect the nearest available ambulance,
and coordinate hospital preparation through one response system.
```

Do not make unsupported claims about guaranteed response times.

---

# 1.2 Login

Route:

```text
/login
```

Fields:

```text
Email
Password
```

Actions:

```text
LOG IN
```

Optional:

```text
Show password
```

Do not include a role selector.

The role comes from PostgreSQL after successful authentication.

Flow:

```text
Email + password
        ↓
POST /api/auth/login
        ↓
Server validates credentials
        ↓
Session established
        ↓
Frontend receives user + role
        ↓
Role-specific redirect
```

Redirect rules:

```text
CITIZEN    → /citizen
AMBULANCE  → /ambulance
HOSPITAL   → /hospital
ADMIN      → /admin
```

---

# 1.3 Citizen registration

Route:

```text
/register
```

Fields:

```text
Name
Email
Phone
Password
Confirm password
```

There is NO role selector.

Every public registration creates:

```text
role = CITIZEN
```

Frontend validation:

- required fields
- valid email
- phone format
- minimum password requirements
- password confirmation
- duplicate email error from backend
- loading state
- success state
- server error state

Registration contract:

```http
POST /api/auth/register
```

Example:

```json
{
  "name": "Example User",
  "email": "user@example.com",
  "phone": "9876543210",
  "password": "..."
}
```

The backend determines the role as `CITIZEN`.

---

# 1.4 Admin / Ambulance / Hospital credentials

Do NOT create public registration options for these roles.

The frontend should simply support logging into accounts that already exist.

Initial demo accounts should be seeded server-side into PostgreSQL.

Example account identities:

```text
admin@aimless.local
ambulance01@aimless.local
hospital01@aimless.local
```

Passwords must NOT be hard-coded in frontend source code.

Use server-side seed/environment configuration.

The frontend should never contain:

```text
if email === "admin@..."
```

or:

```text
if password === "..."
```

Authentication must always go through the server.

---

# 1.5 Authenticated session

Use secure server-managed session behavior.

Prefer an HTTP-only secure cookie.

Do not use localStorage as the primary authentication mechanism.

Frontend needs:

```text
GET /api/auth/me
```

to determine the current authenticated user.

Example response:

```json
{
  "user": {
    "id": "uuid",
    "name": "Example",
    "email": "user@example.com",
    "role": "CITIZEN"
  }
}
```

Logout:

```text
POST /api/auth/logout
```

After logout:

```text
→ clear authenticated state
→ redirect to /
```

---

# 1.6 Protected routes

Frontend route guards improve UX.

Examples:

```text
/citizen → CITIZEN
/ambulance → AMBULANCE
/hospital → HOSPITAL
/admin → ADMIN
```

Unauthorized users should be redirected appropriately.

However, frontend route protection is NOT the security boundary.

Every protected API endpoint must also verify authentication and role on the server.

---

# 1.7 Phase 1 acceptance criteria

Do not move to Phase 2 until:

- Landing page works
- Login works
- Citizen registration works
- No role selector exists on public registration
- Session survives page refresh
- Logout works
- Role-based redirects work
- Protected pages reject wrong roles
- Admin login works with seeded database account
- Ambulance login works with seeded account
- Hospital login works with seeded account
- No credentials are hard-coded in frontend code
- UI is responsive
- Motion is subtle and consistent
- No console errors

---

# PHASE 2 — GUEST EMERGENCY REPORT / SOS

## Goal

Allow someone without an account to report an accident immediately.

This is one of the most important MVP flows.

Route:

```text
/emergency-report
```

Entry point:

```text
/
```

Primary CTA:

```text
REPORT EMERGENCY
```

No login required.

---

## 2.1 Emergency report UX

Step 1:

```text
REPORT AN EMERGENCY
```

Step 2:

```text
Get my location
```

Browser requests geolocation permission.

Use:

```js
navigator.geolocation.getCurrentPosition(...)
```

Capture:

```text
latitude
longitude
accuracy
```

Do not fabricate coordinates.

---

## 2.2 Location state

States:

```text
IDLE
REQUESTING
LOCATED
DENIED
UNAVAILABLE
ERROR
```

UI example:

```text
LOCATING INCIDENT

Scanning GPS position...
```

Then:

```text
LOCATION ACQUIRED

Accuracy: 8m
```

If permission is denied:

```text
LOCATION ACCESS REQUIRED

We need your location to send the emergency
to the response system.

[ TRY AGAIN ]
```

Provide a fallback only if the backend contract supports manual location entry.

Do not silently substitute an invented location.

---

# 2.3 Accident information

Collect only information needed for rapid response.

Fields:

```text
Severity
Victim count
Description
```

Suggested severity values:

```text
LOW
MODERATE
HIGH
CRITICAL
```

The UI should make severity selection easy.

Do not use decorative color coding as the only indicator.

---

# 2.4 Submit emergency

Contract:

```http
POST /api/accidents
```

Example:

```json
{
  "latitude": 9.9312,
  "longitude": 76.2673,
  "locationAccuracy": 8,
  "severity": "CRITICAL",
  "victimCount": 2,
  "description": "Road accident near junction"
}
```

After submission:

```text
Emergency created
        ↓
Incident ID received
        ↓
Show confirmation
```

Example:

```text
EMERGENCY REPORTED

Incident #ER-1042

Your location has been sent
to the emergency response system.

Response units are being notified.
```

---

# 2.5 Reporter live location

The accident's initial location is the location captured at report time.

Do NOT continuously overwrite the accident location with a reporter who may move away.

If live reporter tracking is implemented later, treat it as a separate location stream.

---

# 2.6 Phase 2 acceptance criteria

- Guest can report without login
- GPS permission works
- GPS loading state works
- GPS denied state works
- Accident details validate
- Emergency is submitted
- Incident ID is shown
- Duplicate submissions are handled gracefully
- Mobile UX works
- No fake location data is used

---

# PHASE 3 — CITIZEN DASHBOARD

Route:

```text
/citizen
```

## Goal

Allow authenticated citizens to see active and past emergency reports.

Dashboard sections:

```text
Welcome
Active emergency
Response status
Ambulance information
Incident history
Profile
```

---

## 3.1 Active emergency

Example:

```text
ACTIVE EMERGENCY

Incident #ER-1042

Status
AMBULANCE EN ROUTE

Ambulance
A-01

ETA
04:32
```

Status must come from the backend.

---

## 3.2 Live ambulance tracking

Use Socket.IO for live updates.

Frontend listens for:

```text
ambulance:location_updated
ambulance:eta_updated
incident:updated
incident:status_changed
```

The map should update without full-page refresh.

---

## 3.3 Citizen states

Handle:

```text
NO ACTIVE INCIDENT
ACTIVE INCIDENT
AMBULANCE ASSIGNED
AMBULANCE EN ROUTE
PATIENT PICKED UP
HOSPITAL NOTIFIED
ARRIVED
CLOSED
```

---

# PHASE 4 — AMBULANCE DASHBOARD

Route:

```text
/ambulance
```

## Goal

Provide ambulance drivers with an operational response dashboard.

Dashboard:

```text
Current status
Available / Responding / Transporting / Offline

Incoming emergencies
Active incident
Live location
Route
ETA
Hospital selection
```

---

# 4.1 Ambulance availability

Status examples:

```text
AVAILABLE
RESPONDING
TRANSPORTING
OFFLINE
```

Driver can change status only when allowed by backend rules.

---

# 4.2 Incoming emergency

When backend identifies the ambulance as a nearby available unit, Socket.IO sends the emergency event.

Event:

```text
ambulance:assigned
```

or the final backend-approved equivalent.

UI:

```text
NEW EMERGENCY

Incident #ER-1042

Distance
1.8 km

Victims
2

Severity
CRITICAL

[ ACCEPT ]
[ DECLINE ]
```

Use an entrance animation and subtle pulse.

---

# 4.3 Accept emergency

After acceptance:

```text
AMBULANCE EN ROUTE
```

Show:

- accident location
- current ambulance location
- route
- ETA
- incident details

---

# 4.4 Live ambulance GPS

Use browser/device geolocation where available.

The frontend periodically sends location to:

```http
POST /api/ambulances/[id]/location
```

Payload:

```json
{
  "latitude": 9.9312,
  "longitude": 76.2673,
  "speed": 42,
  "heading": 125
}
```

Actual update frequency should be controlled by the backend/product decision.

Do not create unnecessary high-frequency network traffic.

---

# 4.5 Hospital selection

After patient pickup, show nearby hospitals.

Example:

```text
SELECT DESTINATION

Hospital A
4.2 km
Emergency status: Available
ETA: 09 min

[ SELECT ]

Hospital B
5.1 km
Emergency status: Available
ETA: 11 min

[ SELECT ]
```

The frontend displays backend-provided hospitals and ETA.

Do not independently invent hospital availability.

---

# PHASE 5 — HOSPITAL DASHBOARD

Route:

```text
/hospital
```

## Goal

Prepare the hospital before the ambulance arrives.

This is a critical cooperation point.

---

# 5.1 Incoming emergency

When hospital receives:

```text
hospital:alert
```

show:

```text
INCOMING EMERGENCY

Ambulance A-01

Patient count
2

Severity
CRITICAL

ETA
04:32
```

---

# 5.2 Siren / alarm

When a new incoming emergency is received:

1. Visual emergency state activates.
2. Emergency panel expands.
3. Siren/alarm begins.
4. Staff sees acknowledge action.

Example:

```text
INCOMING EMERGENCY

AMBULANCE A-01
ETA 04:32

[ ACKNOWLEDGE ]
```

After acknowledgement:

```text
[ ALARM SILENCED ]
```

Do not autoplay audio indefinitely.

Respect browser autoplay restrictions.

The UI must gracefully handle cases where the browser blocks audio until the user interacts with the page.

Provide a clear manual alarm control.

---

# 5.3 Hospital readiness workflow

States:

```text
ALERT_RECEIVED
ACKNOWLEDGED
PREPARING
READY
PATIENT_ARRIVED
CLOSED
```

UI actions:

```text
ACKNOWLEDGE
PREPARING
READY
PATIENT ARRIVED
```

Only show actions appropriate to the current state.

---

# 5.4 Emergency department preparation

The dashboard should communicate that the emergency department needs preparation.

Example:

```text
EMERGENCY DEPARTMENT

Incoming patient:
2

Severity:
CRITICAL

Status:
PREPARING

[ MARK READY ]
```

Do not claim that the system can physically clear hospital rooms automatically.

It is a coordination interface for hospital staff.

---

# 5.5 Live ambulance information

Hospital receives:

```text
ambulance:location_updated
ambulance:eta_updated
hospital:status_updated
```

The ambulance marker and ETA update in real time.

---

# PHASE 6 — ADMIN DASHBOARD

Route:

```text
/admin
```

## Goal

Provide system-wide operational visibility.

Dashboard sections:

```text
Active emergencies
Ambulances
Hospitals
Users
Recent events
```

---

# 6.1 Active incidents

Table/list:

```text
Incident
Severity
Location
Ambulance
Hospital
Status
ETA
Created
```

Example:

```text
ER-1042
CRITICAL
Ambulance A-01
Hospital A
EN ROUTE_TO_HOSPITAL
04:32
```

---

# 6.2 Ambulance monitoring

Show:

```text
Ambulance ID
Driver
Status
Current location
Current incident
Hospital
```

---

# 6.3 Hospital monitoring

Show:

```text
Hospital
Emergency status
Incoming emergencies
Current preparation state
```

---

# 6.4 User management

Admin can view users.

Role values:

```text
CITIZEN
AMBULANCE
HOSPITAL
ADMIN
```

Do not expose password hashes.

Admin may create/provision ambulance and hospital accounts if the backend supports the operation.

---

# PHASE 7 — REAL-TIME SOCKET.IO INTEGRATION

This phase connects all dashboards.

Create one shared Socket.IO client abstraction.

Suggested:

```text
lib/socket.ts
```

Authentication must be handled according to the backend's session/auth contract.

---

## Events

Candidate event contract:

```text
incident:created
incident:updated
incident:status_changed

ambulance:assigned
ambulance:location_updated
ambulance:status_changed
ambulance:eta_updated

hospital:alert
hospital:status_updated

notification:new
```

The final event names must be shared between frontend and backend before implementation.

Do not invent new event names in individual components.

---

# PHASE 8 — MAPS + LOCATION UI

Introduce map UI after the core dashboards work.

Requirements:

- accident marker
- ambulance marker
- hospital marker
- route
- ETA
- live movement

Map provider must be selected according to hackathon/API availability.

Keep map implementation behind a reusable component:

```text
components/map/MapContainer.tsx
```

Do not tightly couple dashboard components to one map provider.

---

# PHASE 9 — ERROR, LOADING, EMPTY AND OFFLINE STATES

Every major page must handle:

```text
Loading
Empty
Error
Unauthorized
Offline
No GPS
GPS denied
Socket disconnected
Socket reconnecting
Server unavailable
```

Example:

```text
RECONNECTING

Real-time connection interrupted.
Attempting to reconnect...
```

Do not leave users staring at blank screens.

---

# PHASE 10 — RESPONSIVE DESIGN

The application must work on:

```text
Mobile
Tablet
Desktop
```

Priority:

1. Citizen / emergency report — mobile first
2. Ambulance — mobile/tablet first
3. Hospital — desktop/tablet
4. Admin — desktop first

Emergency reporting should remain usable with one hand on a phone.

Buttons should have comfortable touch targets.

---

# PHASE 11 — FINAL MOTION + POLISH

After functionality is stable:

- refine page transitions
- refine dashboard card entrance
- refine GPS scanning animation
- refine ambulance marker animation
- refine emergency alert animation
- refine hospital alarm state
- refine modal transitions
- refine toast transitions
- add reduced-motion support
- remove unnecessary animations

Respect:

```css
prefers-reduced-motion
```

Users who request reduced motion should receive a calmer experience.

---

# PHASE 12 — SECURITY / FRONTEND SAFETY CHECK

Before final demo:

Verify:

- No passwords in frontend source
- No admin credentials in client-side code
- No fake authentication checks
- No role selector for public registration
- No trust in client-supplied role
- No sensitive information exposed unnecessarily
- Protected routes redirect correctly
- Server errors are handled
- API failures do not crash the UI
- Socket authentication is implemented by the backend contract
- No patient-sensitive information is unnecessarily exposed to the wrong role

---

# PHASE 13 — FINAL DEMO FLOW

The final frontend should support this demonstration:

## Step 1 — Guest

Open:

```text
/
```

Click:

```text
REPORT EMERGENCY
```

---

## Step 2 — GPS

Browser requests location.

Show:

```text
LOCATING INCIDENT
```

Then:

```text
LOCATION ACQUIRED
```

---

## Step 3 — Report

Select:

```text
Severity: CRITICAL
Victims: 2
```

Submit.

---

## Step 4 — Ambulance

Open ambulance dashboard.

Incoming emergency appears:

```text
NEW EMERGENCY
```

Driver accepts.

---

## Step 5 — Live response

Ambulance dashboard displays:

```text
ACCIDENT LOCATION
CURRENT LOCATION
ROUTE
ETA
```

Live position updates.

---

## Step 6 — Hospital

Driver selects hospital.

Hospital dashboard immediately receives:

```text
INCOMING EMERGENCY
```

Siren plays.

Hospital acknowledges.

Hospital sets:

```text
PREPARING
```

Then:

```text
READY
```

---

## Step 7 — Arrival

Ambulance marks arrival.

Hospital receives update.

Hospital marks:

```text
PATIENT ARRIVED
```

---

## Step 8 — Admin

Admin dashboard shows the entire incident lifecycle.

```text
REPORTED
→ AMBULANCE_ASSIGNED
→ AMBULANCE_EN_ROUTE
→ PATIENT_PICKED_UP
→ HOSPITAL_NOTIFIED
→ HOSPITAL_PREPARING
→ EN_ROUTE_TO_HOSPITAL
→ ARRIVED
→ CLOSED
```

---

# 14. Future Scope — DO NOT BUILD IN MVP

The following is intentionally future scope:

## Road User Cooperative Corridor

Potential future role:

```text
ROAD_USER
```

Potential functionality:

- detect road users near ambulance route
- send contextual ambulance alerts
- ask road users to safely yield
- create a cooperative emergency corridor
- expire alerts when ambulance passes

This should NOT be implemented in the current MVP.

Do not create the ROAD_USER role now.

Do not create road-user authentication now.

Do not create road-user dashboard now.

The architecture may remain extensible enough to add it later.

---

# 15. Antigravity Operating Rules

Antigravity must follow these rules throughout the project.

## Rule 1 — Build phase-by-phase

Never generate the entire product in one uncontrolled pass.

Implement one phase, test it, then proceed.

## Rule 2 — Do not invent backend APIs

If an API contract is not defined, leave a typed service abstraction or clearly mark the integration point.

Do not silently invent endpoint names or payload shapes.

## Rule 3 — Do not invent roles

Allowed MVP roles:

```text
CITIZEN
AMBULANCE
HOSPITAL
ADMIN
```

## Rule 4 — Never hard-code credentials in frontend

Demo credentials belong in server-side database seed/configuration.

## Rule 5 — Backend is the authority

The frontend can hide/show UI based on role, but the server must enforce permissions.

## Rule 6 — Keep types centralized

Do not create five different versions of `IncidentStatus`.

## Rule 7 — Keep Socket.IO centralized

Do not create independent socket connections in every component.

## Rule 8 — Reuse components

Build reusable:

```text
Button
Input
Card
Modal
Badge
StatusIndicator
EmergencyBanner
IncidentCard
AmbulanceCard
HospitalCard
MapContainer
LoadingState
ErrorState
EmptyState
```

## Rule 9 — Mobile emergency UX matters

The emergency report flow must be extremely fast and readable on a phone.

## Rule 10 — Motion must communicate state

Do not add animation merely because animation is possible.

## Rule 11 — Accessibility

Maintain:

- keyboard navigation
- visible focus
- readable contrast
- labels
- screen-reader-friendly controls
- reduced-motion support
- clear error messages

## Rule 12 — Preserve working code

When implementing a new phase, do not unnecessarily rewrite working previous phases.

---

# 16. Definition of Done

The frontend is ready for the hackathon demo when:

- Authentication works against PostgreSQL-backed accounts.
- Citizen registration creates CITIZEN accounts.
- Admin/Ambulance/Hospital roles cannot be selected during public registration.
- Admin/Ambulance/Hospital demo accounts are provisioned server-side.
- Guest emergency reporting works.
- GPS acquisition works.
- Citizen dashboard works.
- Ambulance dashboard works.
- Hospital dashboard works.
- Admin dashboard works.
- Hospital emergency alarm/siren works with acknowledgement.
- Socket.IO real-time updates work.
- Ambulance live location works.
- Hospital receives incoming emergency information.
- Hospital readiness states work.
- Incident lifecycle is visible.
- UI is responsive.
- UI uses the monochrome visual system.
- Motion is polished but restrained.
- Reduced-motion behavior exists.
- No frontend credentials are exposed.
- No Road User role exists in MVP.
- The complete demo flow can be performed reliably.

---

# 17. Final Instruction to Antigravity

Build AIMLESS as a polished emergency-response web application, not as a generic dashboard template.

Prioritize:

1. Emergency usability
2. Clear information hierarchy
3. Reliable state transitions
4. Real-time behavior
5. Mobile usability
6. Strong monochrome visual identity
7. Subtle high-quality motion
8. Clean component architecture
9. Exact frontend/backend contracts
10. Demo reliability

Do not add features outside this plan without explicit approval.

When a backend dependency is not implemented yet, create a clean typed integration boundary rather than replacing it with fake production behavior.

The final product should feel like one coordinated emergency-response system, not four unrelated dashboards.
