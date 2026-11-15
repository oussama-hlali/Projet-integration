# Identity service (SCRUM-54)

Issues and validates RS256 JWTs, serves JWKS, owns the `identity` schema.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | `{ email, password }` → tokens or `{ mfaRequired, challengeId }` |
| POST | `/api/v1/auth/mfa/verify` | `{ challengeId, code }` |
| POST | `/api/v1/auth/refresh` | `{ refreshToken }` |
| POST | `/api/v1/auth/logout` | 204 |
| GET | `/api/v1/users/me` | current user (stub) |
| GET | `/api/v1/users` | admin list (stub) |
| GET | `/api/v1/auth/mfa/setup` | returns `otpauthUri` for ZXing QR |
| GET | `/.well-known/jwks.json` | public key |
| GET | `/actuator/health` | health probe |

## Demo users
- `ahmed.wardi@campus.tn` / `student123` (STUDENT)
- `sami.benali@campus.tn` / `admin123` (ADMINISTRATOR)

## Run locally
`mvn -pl identity -am spring-boot:run -Dspring-boot.run.profiles=dev`
(uses H2; no Supabase needed for the stub)
