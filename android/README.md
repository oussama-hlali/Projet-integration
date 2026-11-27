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

Aucun écran métier avancé n’est encore implémenté dans cette partie.

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

Le splash Android reprend la direction visuelle du splash web Smart Campus : canvas clair `#f4f6fb`, gem teal, titre `Smart Campus`, `◆ 2026` et bouton `ENTER`. La vérification de session reste automatique ; `ENTER` permet d’aller directement au login.

## Règles pour la suite

- Garder le code simple et explicable.
- Ne pas ajouter Hilt/Koin.
- Ne pas mettre de secret dans le dépôt.
- Ne pas appeler `/users/me` pour un étudiant.
- Ne pas afficher de données seed comme des statistiques réelles.
