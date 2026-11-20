import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Clear stale mock data on every load — the app uses Render services, not localStorage.
if (typeof localStorage !== 'undefined') {
  localStorage.clear();
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
