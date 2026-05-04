# TempoFocus

A local-first time tracking dashboard for a 6 AM-11 PM day.

## Run

```bash
npm start
```

Open `http://localhost:4173/`.

For local UI testing:

```bash
npm run dev
```

Email login accepts any valid email unless `APP_LOGIN_EMAIL` is configured.

To restrict login to one email ID, set this environment variable first:

```bash
export APP_LOGIN_EMAIL=you@example.com
npm start
```

You can also create a local `.env` from `.env.example`; `.env` is ignored by git.

## Notes

- Activity data stays in browser `localStorage`.
- Email login uses the local Node server. Configure `APP_LOGIN_EMAIL` to allow only one email ID.
- Hourly reminders use browser notifications while the app is open or installed as a PWA.
- Background mobile push still needs a hosted HTTPS app plus push notification setup.
