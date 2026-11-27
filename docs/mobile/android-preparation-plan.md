# Smart Campus Mobile — Plan de préparation Android

Branche : `mobile/android-preparation`

Statut : **plan uniquement**. Aucun code Android n’est écrit tant que l’équipe ne donne pas le feu vert.

Niveau de code visé : **simple, débutant, facile à expliquer**. Pas de Hilt, pas de Koin, pas de `Mutex`, pas d’abstractions inutiles.

## Contributeurs

- Oussama Hlali — `waeldenz@gmail.com`
- Rayen Hamdi — `rayenxhamdi138@gmail.com`
- Youssef Saafi — `saafiy96@gmail.com`
- Ahmed Wardi — `wardiahmed21@gmail.com`

---

## 1. Objectif

Créer une application Android Kotlin + Jetpack Compose connectée au backend Spring Boot existant du projet Smart Campus 2026.

Il n’existe actuellement aucun module Android dans le dépôt. Le travail se fera dans un nouveau dossier `android/`, sans modifier Angular ni les services Spring Boot.

Architecture imposée : **MVVM strict**.

```text
View (Compose)
   ↓ observe l’état
ViewModel
   ↓ appelle
Repository
   ↓
Retrofit / DataStore
   ↓
DTO backend → modèle UI
```

Aucun Presenter. Aucune logique réseau dans un Composable ou une Activity.

---

## 2. Périmètre recommandé

### Fonctionnalités incluses

| Domaine | Contenu |
|---|---|
| Auth | Login, MFA setup, MFA verify, refresh, logout |
| Salles | Liste filtrable, détail, disponibilité |
| Réservations | Création, détail, annulation, review admin |
| Événements | Liste, détail, intérêt, inscription |
| Annonces | Liste, détail, CRUD admin |
| Notifications | Inbox, mark read, delete |
| Cafétéria | Menu du jour, items, commande, annulation |
| Profil | Informations, thème, langue, préférences |

### Fonctionnalités exclues

- Assistant IA / analytics admin.
- KPI avec données de seed présentées comme réelles.
- Push FCM complet.
- Google Maps SDK avec clé API.
- API externe type Facebook.

---

## 3. Stack

```text
Kotlin
Jetpack Compose + Material3
Navigation Compose
ViewModel
Coroutines
Retrofit + Moshi ou Gson
OkHttp
Preferences DataStore
CameraX + ZXing pour le QR
WorkManager pour les notifications locales
```

Injection de dépendances : un simple `AppContainer` manuel. Pas de Hilt ni Koin.

URLs :

```text
Debug   : http://10.0.2.2:8080/api/v1/
Release : https://smart-campus-gateway.onrender.com/api/v1/
```

Aucun secret, token ou clé API dans le dépôt.

---

## 4. Organisation du code

```text
android/app/src/main/java/com/smartcampus/mobile/
├── SmartCampusApp.kt
├── di/AppContainer.kt
├── core/
│   ├── network/
│   ├── datastore/
│   ├── model/
│   ├── ui/
│   └── navigation/
├── feature/
│   ├── auth/
│   ├── home/
│   ├── rooms/
│   ├── reservations/
│   ├── events/
│   ├── announcements/
│   ├── notifications/
│   ├── cafeteria/
│   └── profile/
└── scanner/QrScannerActivity.kt
```

Responsabilités :

| Fichier | Rôle |
|---|---|
| `XxxScreen.kt` | Affiche l’interface seulement |
| `XxxViewModel.kt` | Gère l’état et les actions utilisateur |
| `XxxRepository.kt` | Appelle Retrofit ou DataStore |
| `AppContainer.kt` | Crée les objets nécessaires |
| `NavGraph.kt` | Décrit les écrans et les paramètres |

---

## 5. État UI simplifié

Pour rester débutant, chaque écran aura une classe d’état simple :

```text
loading : Boolean
items   : List<...>
error   : String?
message : String?
navigateTo : String?
```

Le ViewModel met à jour ces valeurs. Le Composable les affiche. C’est suffisant pour respecter MVVM.

États obligatoires :

```text
Loading  → indicateur ou skeleton simple
Empty    → message + action
Error    → message + bouton Retry
Success  → liste ou contenu
```

---

## 6. Écrans et navigation

Routes prévues :

```text
splash
login
mfa_setup
mfa_verify
home
rooms
room_detail/{roomId}
reservation_new/{roomId}
reservation_edit/{id}
reservation_detail/{id}
reservations
admin_review
events
event_detail/{id}
announcements
announcement_detail/{id}
cafeteria
orders
notifications
profile
```

Passage de paramètres :

- `roomId`, `id`, `userId` passés par Navigation Compose.
- ViewModel de détail lit l’argument avec `SavedStateHandle`.

Intents :

- **Explicite** : ouverture de `QrScannerActivity` avec `EXTRA_RESERVATION_ID`.
- **Implicites** : `ACTION_VIEW` avec `geo:` pour Maps, `ACTION_SEND` pour partager.

---

## 7. Endpoints principaux

Base : `/api/v1/`

### Auth

```text
POST /auth/login
POST /auth/mfa/setup
POST /auth/mfa/verify
POST /auth/refresh
POST /auth/logout
```

### Salles et réservations

```text
GET  /rooms
GET  /rooms/{id}
GET  /rooms/{id}/availability
GET  /reservations
POST /reservations
POST /reservations/{id}/confirm
POST /reservations/{id}/cancel
POST /reservations/{id}/complete
```

### Événements

```text
GET  /events
GET  /events/{id}
GET  /events/for-you
PUT  /events/{id}/interest
POST /events/{id}/registrations
DELETE /events/{id}/registrations/me
```

### Annonces

```text
GET  /announcements
POST /announcements
PUT  /announcements/{id}
DELETE /announcements/{id}
```

### Cafétéria

```text
GET  /menus/today
GET  /menus/{id}/items
POST /orders
POST /orders/{id}/cancel
```

### Notifications

```text
GET   /notifications
PATCH /notifications/{id}
POST  /notifications/read-all
DELETE /notifications/{id}
```

Les listes du backend sont des tableaux JSON nus. Les dates sont des chaînes ISO.

Modèles à suivre : les DTO Java du backend. Les modèles TypeScript Angular contiennent des champs stale.

Points importants :

- `Announcement` utilise `body`, pas `content`.
- `Room` n’a pas de champ `facilities`.
- `Reservation` contient `roomName`.
- Une réservation refusée reste `CANCELLED`.
- Une commande annulée reste `CANCELLED` dans Supabase mais est masquée de la liste active.
- Ne pas appeler `/users/me` pour un étudiant : la config identity protège `/api/v1/users/**` par `ADMINISTRATOR`. Utiliser le `UserDto` renvoyé par login/refresh.

---

## 8. Auth et session

Flux :

```text
Splash
 ├─ pas de session_hint → Login
 └─ session_hint=true → refresh silencieux
                         ├─ OK → Home
                         └─ KO → Login

Login → challenge MFA → setup ou verify → SessionResponse
```

Règles :

- Access token : mémoire seulement.
- Refresh token : cookie HttpOnly `sc_refresh`, géré par un `CookieJar` simple.
- Header obligatoire sur refresh/logout : `X-CSRF-Protected: 1`.
- Refresh simple avec un booléen pour éviter les appels multiples.
- Si refresh échoue : nettoyer l’état et retourner au login.
- Ne pas vérifier le JWT dans l’app : le gateway le fait déjà.

Erreurs à afficher :

```text
400 → Données invalides
401 → Session expirée
403 → Action non autorisée
404 → Élément introuvable
409 → Conflit
429 → Trop de requêtes
5xx/0 → Service indisponible
```

---

## 9. DataStore

Clés :

```text
session_hint
user_id
user_role
user_name
user_email
theme_mode
language
notifications_enabled
last_selected_building
last_rooms_filter
last_bottom_tab
```

Ne jamais stocker :

```text
accessToken
refreshToken
mot de passe
secret TOTP permanant
données métier en cache
```

---

## 10. Menus

Menu bas :

```text
Accueil | Salles | Événements | Notifications | Profil
```

Menu haut :

```text
Rafraîchir
Filtrer
Partager
Ouvrir dans Maps
Paramètres
Déconnexion
```

Menu contextuel admin :

```text
Confirmer réservation
Annuler réservation
Modifier annonce
Supprimer annonce
```

Toutes les options visibles doivent fonctionner.

---

## 11. Listes et CRUD

- `LazyColumn` pour les listes principales.
- `LazyRow` pour les filtres.
- Cartes simples avec titre, date, statut et actions.
- Clic pour détail, bouton pour modifier/annuler.

CRUD couvert :

| Ressource | Actions |
|---|---|
| Réservation | create, list, confirm, cancel |
| Événement | create, update, delete, interest, registration |
| Annonce | create, update, delete |
| Commande | create, cancel |
| Notification | mark read, delete |

Confirmations de suppression : l’utilisateur tape `delete <item>`.

---

## 12. Bonus simples

| Bonus | Décision |
|---|---|
| Notifications locales | À faire en premier |
| QR scanner avec CameraX + ZXing | À faire ensuite |
| Géolocalisation avec intent `geo:` | Optionnel |
| Biométrie | Optionnel, seulement si le reste est stable |
| Push FCM | À éviter |
| API externe | À éviter |

Objectif réaliste : `+1,5`, puis `+2` si le temps le permet.

---

## 13. Tests

Tests unitaires simples :

- ViewModel login.
- ViewModel réservation.
- Mapping DTO → UI model.
- Gestion des erreurs.

Tests avec `MockWebServer` :

```text
login → MFA challenge
mfa verify → session
401 → refresh
409 → conflit réservation
liste vide
```

Commandes :

```text
./gradlew test
./gradlew assembleDebug
./gradlew lintDebug
```

---

## 14. GitHub

Branche unique de préparation : `mobile/android-preparation`.

PRs futures recommandées :

```text
1. scaffold + thème + navigation
2. auth + MFA + DataStore
3. salles + réservations
4. événements + annonces
5. notifications + cafétéria
6. bonus + tests + README
```

Règles :

- Ne jamais committer secrets ou `local.properties`.
- Ne jamais stage `angular-front/assets/`, les `.docx`, `main (2).pdf` ou les fichiers SQL de seed.
- Demander avant push/PR.
- Le merge est fait par le propriétaire du dépôt.

---

## 15. Pièges

1. Render peut répondre `429` avec `x-render-routing: hibernate-rate-limited` : ce n’est pas un problème CORS.
2. Ne pas utiliser les modèles Angular comme source de vérité.
3. Ne pas stocker de token dans DataStore.
4. Ne pas présenter de données seed comme des statistiques réelles.
5. Ne pas supprimer une réservation : changer son statut.
6. Ne pas copier jQuery/Cookiebot/GTM/DataDog du site Faivra.
7. Ne pas commencer le code Android sans accord explicite.

---

## 16. Prochaine étape

Quand l’équipe dit `start code` :

1. Créer le module `android/`.
2. Ajouter Gradle, thème, `AppContainer`, `NavGraph`.
3. Ajouter Retrofit client et DataStore.
4. Écrire le premier écran Splash/Login.
5. Avancer domaine par domaine dans l’ordre du plan.
