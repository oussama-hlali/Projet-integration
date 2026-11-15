# Smart Campus backend

Multi-module Spring Boot backend (Java 17, Maven).

## Modules

| Module | Port | Purpose |
| --- | --- | --- |
| gateway | 8080 | routing, CORS, rate limit, JWT validation |
| identity | 8081 | auth, users, JWKS |
| campus | 8082 | rooms, buildings, reservations, transport |
| engagement | 8083 | announcements, events, lost & found |
| cafeteria | 8084 | menus, orders |
| notifications | 8085 | notification feed + outbox |
| ai | 8086 | assistant + proposals (degradable) |
| common | - | shared DTOs and error handling |

## Prerequisites
- Java 17 (Temurin recommended)
- Maven 3.9+ (or use a wrapper if present)
- PostgreSQL (or Supabase) — only needed for non-dev runs

## Run one service locally
```bash
cd spring-backend
mvn -pl identity -am spring-boot:run -Dspring-boot.run.profiles=dev
```
The dev profile uses H2, so no database is required.

## Run everything
Start each service in its own terminal, identity first (others depend on its JWKS).

## Database
See `/supabase/init.sql` for the 6 schemas and roles.
Each service runs its own Flyway migrations in its schema.
