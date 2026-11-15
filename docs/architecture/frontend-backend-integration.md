# Frontend ⇄ backend integration guide

**Jira:** SCRUM-35 · PB-27 (Integration)
**Owner:** frontend + backend leads
**Status:** target contract for the Spring Boot services (v1)

This document is the hand-off between the Angular app and the six Spring Boot
services. Today every feature reads and writes through an in-memory /
`localStorage` service in `angular-front/src/app/core/services`. The app must
keep working while each service is replaced one at a time, so this guide lists,
per mock service, the REST resources that replace it, the JSON shapes involved
and the small set of cross-cutting conventions the whole app relies on.

---

## 1. Topology

One Supabase project, one schema per service, one database role per service.
The browser only ever talks to the gateway.

```
Angular (Vercel)
      │  HTTPS, JSON, Bearer JWT
      ▼
api-gateway  ──►  identity      schema: identity
             ──►  campus        schema: campus
             ──►  engagement    schema: engagement
             ──►  cafeteria     schema: cafeteria
             ──►  notifications schema: notifications  (owns the outbox)
             ──►  ai            schema: ai             (only place with model keys)
```

* Gateway base path: `https://<gateway-host>/api/v1`
* Each service also exposes `GET /actuator/health` and its own `/kpi/*`
  endpoints for the admin dashboard. There is **no** cross-service aggregator in
  v1: the admin page fans out to the per-service KPI endpoints.
* The gateway validates the access token locally against JWKS; downstream
  services receive the decoded claims, never the raw token.

### Auth flow (identity)

| Step | Call | Notes |
| --- | --- | --- |
| 1 | `POST /auth/login` | `{ email, password }` → tokens **or** `{ mfaRequired: true, challengeId }` |
| 2 | `POST /auth/mfa/verify` | `{ challengeId, code }` (TOTP, 6 digits) → tokens |
| 3 | `POST /auth/refresh` | `{ refreshToken }` → new pair; refresh tokens rotate, reuse revokes the family |
| 4 | `POST /auth/logout` | revokes the presented refresh token |

* Access token: RS256, 15 minutes, `sub`, `role`, `jti`.
* The Angular `AuthService` keeps the access token in memory and the refresh
  token in the same place the mock uses today; no token in `localStorage`.
* `otpAuthUri(user)` in the mock becomes `GET /auth/mfa/setup` returning the
  `otpauth://` URI; the QR image is rendered client-side with ZXing.

---

## 2. Conventions every endpoint follows

* `Content-Type: application/json; charset=utf-8`, camelCase field names — the
  mock DTOs already use camelCase, so no field renames are needed.
* Dates and times: ISO-8601 with offset (`2026-03-04T09:30:00+01:00`). The mock
  `Date` objects map 1:1.
* IDs: opaque strings (`u1`, `room-3`, `res-1024` today) — do not parse them.
* Errors: RFC 9457 `application/problem+json`
  ```json
  { "type": "https://smartcampus/errors/reservation-conflict",
    "title": "Slot already booked",
    "status": 409,
    "detail": "Room B204 is already booked for that slot.",
    "code": "RESERVATION_CONFLICT" }
  ```
  `detail` is user-facing French/English copy; the interceptor shows it as the
  toast body. `code` is the stable machine value.
* Lists: `?page=0&size=20` while a screen shows numbered pages, or
  `?cursor=<opaque>&limit=20` for notification-style feeds. Responses are
  `{ "items": [...], "page": { "number": 0, "size": 20, "totalElements": 42 } }`
  or `{ "items": [...], "nextCursor": "..." }` respectively.
  The frontend `createPager()` helper slices client-side lists today; when a
  service paginates, swap the source signal for the fetched page and keep the
  same `visible` / `total` contract.
* Idempotency: mutating `POST`s accept `Idempotency-Key` (used by the
  reservations form and cafeteria orders so a double submit cannot double-book).
* Every request carries `Authorization: Bearer <accessToken>`; the gateway
  rejects anything else with `401`.
* Role checks are enforced server-side (`ADMINISTRATOR`, `STUDENT`, `STAFF`).
  The frontend guards are UX only.

---

## 3. Mock service → REST mapping

### 3.1 `auth.service.ts` → identity

| Mock member | REST |
| --- | --- |
| `currentUser`, `isAuthenticated`, `isAdmin`, `homeRoute` | derived from the JWT claims + `GET /users/me` |
| `pendingUser`, `pendingUserId`, `cancelPending` | `challengeId` from `POST /auth/login`, cleared on cancel |
| `logout()` | `POST /auth/logout` |
| `otpAuthUri(user)` | `GET /auth/mfa/setup` |
| `getUsers()`, `findById()`, `findByEmail()` | `GET /users` (admin), `GET /users/{id}` |
| `setTotp()` | `POST /users/me/mfa/enable`, `DELETE /users/me/mfa` |
| `setCredentials()` | handled inside identity; never a public endpoint |
| `updateProfile()` | `PATCH /users/me` |
| `updatePreferences()` | `PATCH /users/me/preferences` |
| `updateRole()` | `PATCH /users/{id}/role` (admin) |
| `add()`, `remove()` | `POST /users` / `DELETE /users/{id}` (admin) |

Notable contracts:

```http
POST /auth/login
{ "email": "ahmed.wardi@campus.tn", "password": "student123" }

200 OK
{ "accessToken": "…", "refreshToken": "…", "expiresIn": 900,
  "user": { "id": "u1", "fullName": "Ahmed Wardi", "role": "STUDENT",
            "email": "ahmed.wardi@campus.tn", "totpEnabled": false } }

200 OK (2FA on)
{ "mfaRequired": true, "challengeId": "chl_9f2…" }
```

### 3.2 `room.service.ts`, `building.service.ts`, `reservation.service.ts` → campus

| Mock member | REST |
| --- | --- |
| `rooms()` | `GET /rooms?status=&buildingId=&q=` |
| `findById(id)` | `GET /rooms/{id}` |
| `add()`, `update()`, `remove()` | `POST /rooms`, `PUT /rooms/{id}`, `DELETE /rooms/{id}` (admin) |
| `buildings()`, `nameOf()` | `GET /buildings`, `GET /buildings/{id}` |
| `reservations()` | `GET /reservations?mine=true&status=&roomId=&q=` |
| `counts` | `GET /reservations/summary` or computed from the page |
| `hasConflict(input)` | server-side check inside `POST /reservations` |
| `create(input)` | `POST /reservations` |
| `cancel(id)` | `POST /reservations/{id}/cancel` |
| `approve(id)`, `complete(id)` | `POST /reservations/{id}/approve`, `…/complete` (admin) |
| `setStatus(id, status)` | `PATCH /reservations/{id}` `{ "status": "CONFIRMED" }` |
| `syncCompleted()` | not needed; the server derives "completed" from `endTime` |

`ReservationService.create()` currently returns a discriminated result:

```ts
{ ok: true, reservation } | { ok: false, reason: 'conflict' | 'unavailable' }
```

Keep that shape in the component: map `201` → `ok`, and map
`409 RESERVATION_CONFLICT` / `409 ROOM_UNAVAILABLE` to the same reasons. Any
other status is an error and is surfaced by the HTTP interceptor.

Transport lives in the same service area:

| `transport.service.ts` | REST |
| --- | --- |
| `routes()`, `routeViews()` | `GET /transport/routes` (stops and next departures included) |
| `nextDeparture(stop)` | `GET /transport/stops/{stopId}/departures?limit=3` |

### 3.3 `announcement.service.ts`, `campus-event.service.ts`, `event-interest.service.ts`, `registration.service.ts`, `lost-found.service.ts` → engagement

| Mock member | REST |
| --- | --- |
| `announcements`, `getAnnouncements()` | `GET /announcements?category=&pinned=` |
| `getAnnouncementById()` | `GET /announcements/{id}` |
| `findByTitle()` | `GET /announcements?title=` (server-side search) |
| `add/update/remove` | `POST`, `PUT`, `DELETE /announcements/{id}` (admin) |
| `events`, `getEvents()` | `GET /events?category=&from=&to=` |
| `getEventById()`, `findById()` | `GET /events/{id}` |
| `add/update/remove` | `POST`, `PUT`, `DELETE /events/{id}` (admin) |
| `interests`, `isInterested()` | `GET /events/{id}/interest`, `GET /me/event-interests` |
| `toggle(eventId)` | `PUT /events/{id}/interest` / `DELETE /events/{id}/interest` |
| `interestedEventIds()` | `GET /me/event-interests` |
| `registrations`, `findForEvent()` | `GET /events/{id}/registrations/me` |
| `countFor()` | `GET /events/{id}` → `registeredCount` |
| `register(eventId)` | `POST /events/{id}/registrations` → `{ id, eventId, userId, qrCode, createdAt }` |
| `unregister(eventId)` | `DELETE /events/{id}/registrations/me` |
| `canRegister()` | enforced by the server: `409 EVENT_FULL`, `409 ALREADY_REGISTERED` |
| `items()`, `findById()` | `GET /lost-found?status=&q=` |
| `create(input)` | `POST /lost-found` |
| `addComment()`, `comments` | `POST /lost-found/{id}/comments`, included in `GET /lost-found/{id}` |
| `toggleReaction()` | `PUT` / `DELETE /lost-found/{id}/reactions/me` |
| `setStatus()`, `claim()` | `PATCH /lost-found/{id}` `{ "status": "CLAIMED" }` |
| `remove()` | `DELETE /lost-found/{id}` (author or admin) |

Event registration responses include the QR payload string (`qrCode`); the
client renders it with `buildQrMatrix()` unchanged.

### 3.4 `cafeteria.service.ts` → cafeteria

| Mock member | REST |
| --- | --- |
| `menus()`, `todayMenu`, `menuFor(date)`, `findMenu()` | `GET /menus?week=2026-W10`, `GET /menus/{id}` |
| `orders()`, `ordersFor(userId)` | `GET /orders?mine=true&from=&to=` |
| `findOrder()`, `latestOrderFor()` | `GET /orders/{id}`, `GET /orders/latest` |
| `hasReserved(menuId, itemId)` | `GET /orders?menuId=…&itemId=…&mine=true` |
| `reserve(input)` | `POST /orders` → `{ id, reference, qrCode, status, itemId, menuId }` |
| `cancel(orderId)` | `POST /orders/{id}/cancel` |

`reserve()` returns `undefined` today when the dish is sold out; the REST
contract is `409 ITEM_SOLD_OUT` and the cafeteria page shows the same warning
toast.

### 3.5 `notification.service.ts` → notifications

| Mock member | REST |
| --- | --- |
| `notifications()` | `GET /notifications?cursor=&limit=20` |
| `unreadCount()` | `GET /notifications/unread-count` |
| `markAsRead(id)`, `markAsUnread(id)` | `PATCH /notifications/{id}` `{ "read": true \| false }` |
| `toggleRead(id)` | same as above with the new value |
| `markAllRead()` | `POST /notifications/read-all` |
| `remove(id)` | `DELETE /notifications/{id}` |
| (none) | `DELETE /notifications` → clear all |

Writes that must notify (reservation approved, announcement published, event
cancelled) are produced by the owning service into its outbox and delivered by
the notifications service. The frontend never creates notifications directly.

### 3.6 AI (additive, degradable)

| Call | REST |
| --- | --- |
| Assistant chat | `POST /ai/assistant/messages` `{ conversationId?, message }` → reply + proposals |
| Proposed action | returned as `{ proposalId, kind, payload, expiresAt }` |
| Confirm a proposal | the normal REST call (`POST /reservations`, …) with `X-AI-Proposal: <id>` |
| Health/degrade | `GET /ai/health`; when down the UI hides AI affordances, nothing else changes |

The AI service never writes to another schema. It only returns proposals, and
the user confirms by triggering the ordinary endpoint.

---

## 4. Frontend plumbing already in place

| Concern | Where | Behaviour |
| --- | --- | --- |
| HTTP client | `app.config.ts` | `provideHttpClient(withInterceptors([httpErrorInterceptor]))` |
| Error toasts | `core/interceptors/http-error.interceptor.ts` | one toast per failed call; `SKIP_ERROR_TOAST` opts out |
| Success feedback | `core/services/toast.service.ts` + `ToastHostComponent` | mounted once in `AppShell`; max 4 visible, auto-dismiss |
| Loading | `shared/components/loading-state.component.ts` | `spinner` or `skeleton` |
| Empty | `shared/components/empty-state.component.ts` | "nothing here yet" copy + optional action |
| Error | `shared/components/error-state.component.ts` | message + retry |
| Load more | `core/utils/pagination.ts` + `LoadMoreComponent` | `createPager(source, size)`; call `reset()` when filters change |
| Modal a11y | `shared/components/confirm-dialog.component.ts` | focus in/out, Escape, Tab trap |

Usage when calling a real endpoint:

```ts
this.reservationService.create(input).subscribe({
  next: (reservation) => this.toast.success('Reservation confirmed', reservation.room),
  error: () => this.formError.set(null), // toast already shown by the interceptor
});
```

Opt out of the global toast only when the page renders the failure inline:

```ts
this.http.get<Room[]>('/api/v1/rooms', {
  context: new HttpContext().set(SKIP_ERROR_TOAST, true),
});
```

---

## 5. Migration recipe (one service at a time)

1. Add the HTTP implementation next to the mock, behind the same public API
   (signals + methods) so components do not change.
2. Introduce an environment flag (`useMocks`) and choose the provider in
   `app.config.ts`.
3. Replace `localStorage` seeding with `provideAppInitializer` calls that load
   the first page from the gateway and show `LoadingStateComponent` while
   pending.
4. Convert synchronous returns (`Reservation`, `boolean`, `undefined`) to
   `Observable` **only at the service boundary**; keep components on signals
   with `toSignal` where the page already does that.
5. Map server error `code`s back to the mock's discriminated results so page
   copy (conflict / sold out / full) is unchanged.
6. Delete the mock and its `*.spec.ts` seed assertions in the same PR; replace
   them with HTTP tests (`HttpTestingController`) for the new implementation.

Definition of done for each swap:

- pages show loading, empty and error states;
- mutations raise one toast and clear the form;
- long lists use the shared pager;
- `ng test --watch=false` and `ng build` stay green;
- no component imports `localStorage` directly.

---

## 6. Open items

- Confirm the gateway host per environment (`dev`, `staging`, `prod`).
- Decide whether refresh tokens go in an `HttpOnly` cookie (recommended) or a
  response body; this changes the identity contract above.
- Confirm TOTP step/window and the recovery-code policy with the identity owner.
- Confirm whether transport belongs to campus or gets its own service later.
- Pagination: keep client-side paging for lists under ~200 items; switch to
  cursor paging when the notifications or lost-found service paginates.
