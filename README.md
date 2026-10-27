# Volunteer Hub — Riverside Food Pantry

A volunteer-management web app for a community food pantry. Volunteers create an account, see a live count of everyone who has served at past events, sign up for upcoming events and find them on a map of Jacksonville, submit their service hours for coordinator approval, and view reports.

## Run it

No install or build step is needed.

- **Locally:** download the repository and open `index.html` in any modern browser (Chrome, Edge, Firefox or Safari).
- **GitHub Pages:** in the repository, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, and save. The site is published at `https://<your-username>.github.io/<repo-name>/`.

## Features

| Screen | What it does |
| --- | --- |
| Sign up / Log in | Creates an account or signs in. Name, email and password are validated, with an error message under each field. |
| Home | Personal welcome, a live counter of volunteers across all past events (updates automatically), upcoming event cards with sign-up, and a map of Jacksonville with numbered pins that match the cards. |
| Volunteers | Searchable, skill-filtered roster of volunteers. |
| Log hours | Hours are sent **for approval**, not saved directly. Checks include format (MM/DD/YYYY, numeric hours) and meaning (real calendar date, not in the future, 0.5–12 hours, and the volunteer must have signed up for that event). |
| Reports | Group by event, month or skill; switch between hours and volunteer count; auto-generated insight; export to CSV or print to PDF. |
| Help & Q&A | Searchable FAQ that matches questions written in plain words. |

Accessibility: semantic buttons and labeled inputs, visible keyboard focus, 44px touch targets, screen-reader announcements for errors and the live counter, and animations turned off when the device asks for reduced motion. The layout adapts to phone screens.

## Files

```
index.html               The whole app: HTML, CSS and JavaScript
assets/volunteers.webp   Photo used on the login screen and the Home counter
README.md                This file
```

## How data is stored

This is a front-end demo, so there is no server or database:

- Event, volunteer and report figures are sample data defined at the top of the `<script>` in `index.html`.
- Your display name, event sign-ups and hour submissions are kept in the browser's `localStorage`, so they survive a page refresh on the same device.
- Passwords are validated but **never stored**. A production version would send credentials to a server with hashed passwords.
- The live counter is **simulated** with a timer. In production it would update from real event check-ins.

## Libraries, fonts and credits

- No JavaScript libraries or frameworks; plain HTML, CSS and JavaScript.
- Fonts: [IBM Plex Sans and IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Sans) via Google Fonts (SIL Open Font License).
- Map: an original simplified drawing of Jacksonville (SVG), not to scale.
- Photo: `assets/volunteers.webp`. **TODO: add the photographer, source link and license here.** Replace it with a free-license photo (for example from Unsplash or Pexels) if you don't have the rights to it.
- Event locations are real Jacksonville places used for illustration. The events, people and numbers are fictional.
