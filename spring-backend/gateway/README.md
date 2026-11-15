# Gateway (SCRUM-53)

Spring Cloud Gateway (reactive) in front of the 6 services.

## Routes

| Path prefix | Target service | Port |
| --- | --- | --- |
| `/api/v1/auth/**`, `/api/v1/users/**` | identity | 8081 |
| `/api/v1/rooms/**`, `/api/v1/buildings/**`, `/api/v1/reservations/**`, `/api/v1/transport/**` | campus | 8082 |
| `/api/v1/announcements/**`, `/api/v1/events/**`, `/api/v1/lost-found/**` | engagement | 8083 |
| `/api/v1/menus/**`, `/api/v1/orders/**` | cafeteria | 8084 |
| `/api/v1/notifications/**` | notifications | 8085 |
| `/api/v1/ai/**` | ai | 8086 |

## Cross-cutting concerns

- **CORS**: allowed origins `http://localhost:4200` and `https://*.vercel.app`.
- **Rate limit**: 100 requests / minute / client IP (in-memory Bucket4j, `RateLimitFilter`).
- **Auth**: JWT validated against identity's JWKS (`/.well-known/jwks.json`);
  `/api/v1/auth/**` and health endpoints are public.
- **Health**: `GET /actuator/health`.

Override downstream URLs with `IDENTITY_URL`, `CAMPUS_URL`, ... env vars.
