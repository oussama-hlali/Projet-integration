# Smart Campus Mobile — Android

Cette partie contient le socle Android Kotlin + Jetpack Compose du projet Smart Campus 2026.

## Contenu de la partie 1

```text
Gradle + wrapper
Manifest Android
Thème Material3 simple
AppContainer manuel
Retrofit + OkHttp + Gson
DTO conformes au backend Java
DataStore Preferences
Repositories simples
Navigation Compose
Splash → Login → MFA → Home
```

Aucun écran métier avancé n’est encore implémenté dans la partie 1.

## Contenu de la partie 2

```text
HomeViewModel (accueil strictement MVVM)
Liste des salles avec recherche
Détail salle + disponibilité
Liste des réservations actives
Détail réservation + annulation
Création de réservation avec créneaux simples
Navigation vers rooms / room_detail / reservation_new / reservations / reservation_detail
```

Les réservations annulées gardent le statut `CANCELLED` dans le backend mais sont masquées des listes actives. Le filtre de recherche des salles est mémorisé dans DataStore sous `last_rooms_filter`.

## Contenu de la partie 3

```text
Événements : liste filtrable par catégorie, détail
Intérêt événement : consultation et bascule
Inscriptions événement : inscription, désinscription, QR
Création / modification / suppression événement (admin)
Annonces : liste avec épinglées en premier, détail
Création / modification / suppression annonce (admin)
Navigation vers events / event_detail / event_form / announcements / announcement_detail / announcement_form
```

Les actions admin sont visibles seulement quand le rôle sauvegardé est `ADMINISTRATOR`. Les suppressions demandent à l’utilisateur de taper `delete <titre>` avant de confirmer, conformément au plan. Le formulaire d’événement utilise une date ISO ; le backend reste la source de vérité (`date`, `endDate`, `category`, `location`, `capacity`). Le corps d’une annonce utilise bien `body` et non `content`.

## Contenu de la partie 4

```text
Notifications : boîte de réception, compteur de non lues
Marquer une notification comme lue / tout marquer comme lu / supprimer
Cafétéria : menu du jour + plats
Commande d’un plat avec clé d’idempotence générée dans le ViewModel
Mes commandes : liste active, QR, annulation
Navigation vers notifications / cafeteria / orders
```

Les commandes annulées gardent le statut `CANCELLED` dans le backend mais sont masquées de la liste active. Le ViewModel génère une clé `UUID` pour l’en-tête `Idempotency-Key` ; aucun secret n’est stocké dans l’application.

Cette partie est répartie en quatre commits, un par contributeur : Oussama (repository), Rayen (notifications), Youssef (cafétéria), Ahmed (navigation et README).

## Contenu de la partie 5

```text
Objets perdus/trouvés : liste filtrable, publication, détail, réclamation
Photo de l’objet : appareil photo (FileProvider) ou galerie
Photo compressée en JPEG puis envoyée en base64 dans le post
Profil : nom, e-mail, rôle, thème, langue, notifications locales
Notification locale de confirmation après publication, sans FCM ni secret
Tests JVM légers sur les fonctions pures
Navigation vers lost_found / lost_found_form / lost_found_detail / profile
```

La photo est réduite à 1024 px maximum puis encodée en base64 dans le ViewModel. Le service `engagement` stocke `photo_data` (migration Flyway `V3`) et refuse une photo au-delà de 2 000 000 caractères. Aucun fichier n’est envoyé sur un serveur séparé : la photo voyage dans le post et survit au redémarrage de Render. Une annonce peut aussi être publiée sans photo.

Le thème (Système / Clair / Sombre) est appliqué immédiatement par `ThemeController` et mémorisé dans DataStore. La langue est enregistrée (`FR` / `EN`) mais les textes de l’application restent en français pour l’instant. L’autorisation `POST_NOTIFICATIONS` est demandée depuis l’écran Profil avant d’activer les notifications locales ; si elle est refusée, aucune notification n’est envoyée.

Les tests unitaires JVM couvrent uniquement les fonctions pures : réduction photo, validation du formulaire et masquage des commandes `CANCELLED`. Pas d’émulateur, pas de Hilt, pas de secret.

Cette partie est répartie en quatre commits, un par contributeur : Oussama (contrat backend + DTO/API/repository), Rayen (lost-found et photo), Youssef (profil et notifications locales), Ahmed (tests et README).

## Ouvrir le projet

1. Android Studio → **Open** → sélectionner le dossier `android/`.
2. Laisser Gradle synchroniser.
3. Choisir un émulateur ou un appareil.
4. Lancer `app`.

En ligne de commande :

```bash
cd android
./gradlew assembleDebug
```

La compilation locale n’a pas pu être vérifiée ici : le téléchargement de Gradle 8.9 a échoué et le SDK installé n’a pas le `compileSdk 35`. À valider dans Android Studio ou en CI avant le merge.

## URLs

- Debug : `http://10.0.2.2:8080/api/v1/`
- Release : `https://smart-campus-gateway.onrender.com/api/v1/`

Pour un appareil physique, remplacer `10.0.2.2` par l’IP LAN de la machine qui héberge le gateway.

Le trafic HTTP clair est autorisé seulement en debug via le placeholder `usesCleartextTraffic`.

## Comptes démo

```text
ahmed.wardi@campus.tn / student123  (rôle STUDENT)
sami.benali@campus.tn / admin123    (rôle ADMINISTRATOR)
```

Tout login demande ensuite un code TOTP.

Si le backend Render répond `429` avec `x-render-routing: hibernate-rate-limited`, ce n’est pas un bug Android : le service gratuit est en hibernation. Utiliser le gateway local pour la démo.

## Architecture

```text
Compose Screen → ViewModel → Repository → Retrofit / DataStore
```

Le token d’accès reste en mémoire dans `TokenHolder`. Le cookie de refresh est gardé par `SessionCookieJar`. Aucun token n’est écrit dans DataStore.

Le splash Android reprend le splash web PR #88 : canvas clair `#f4f6fb`, grain, ghost `CAMPUS`, plumbob à facettes avec halos et bob, titre `Smart` en dégradé / `Campus` en contour, `◆ 2026`, bouton `enter` et particules. Le curseur custom du web n’est pas repris car il n’a pas de sens sur mobile.

`SplashViewModel` garde l’état et fait la vérification de session. L’écran ne fait que rendre cet état. Comme sur le web, la session est restaurée en arrière-plan, `enter` part vers `home` ou `login` selon le résultat, et la main passe automatiquement après 8 secondes avec un fondu de 500 ms.

## Règles pour la suite

- Garder le code simple et explicable.
- Ne pas ajouter Hilt/Koin.
- Ne pas mettre de secret dans le dépôt.
- Ne pas appeler `/users/me` pour un étudiant.
- Ne pas afficher de données seed comme des statistiques réelles.
