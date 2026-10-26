# Volunteer Hub — Riverside Food Pantry

A web app for a community food pantry. Volunteers create an account, sign up for upcoming events, see where each event is on a map, and submit service hours for coordinator approval. A live counter on the home page shows the total number of volunteers across all past events.

## Features

- **Sign up / log in.** Every field is validated: name (letters only), email format, password (8+ characters, at least one number).
- **Home page.** A personal welcome, a live volunteer counter that updates automatically, upcoming event cards, and a map of Jacksonville with a numbered pin for each event.
- **Volunteers.** Search by name and filter by skill.
- **Log hours.** Checks format (real date, numeric hours) and meaning (no future dates, 0.5–12 hours, quarter-hour steps, must be signed up for the event). Entries are sent for approval rather than counted right away.
- **Reports.** Group by event, month, or skill. Switch between hours and headcount. Export to CSV or print to PDF.
- **Help & Q&A.** A searchable FAQ.
- **Accessibility.** Labeled form fields, keyboard focus outlines, 44px touch targets, screen-reader announcements for errors and the live counter, and motion turned off when the OS requests reduced motion.

## Run it

No build step is needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

### Publish with GitHub Pages

1. Push this folder to a GitHub repository.
2. Go to **Settings → Pages**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, and save.
3. The site appears at `https://<your-username>.github.io/<repo-name>/`.

## Project structure

```
index.html        Page markup (all screens)
css/styles.css    Styles, including the small-screen layout
js/app.js         App logic, validation, and sample data
assets/           Images
```

## Notes and limitations

- **Sample data.** Events, volunteers, and report numbers are made up. The live counter is simulated with a timer. A production version would read real check-in records from a database.
- **No real accounts.** Log-in is a front-end demo with no server or password storage. Your name, event sign-ups, and submissions are kept in your browser's `localStorage`.
- **The map** is a simplified hand-drawn SVG of Jacksonville, not to scale.

## Libraries and resources

- No JavaScript libraries. Plain HTML, CSS, and JavaScript.
- Fonts: [IBM Plex Sans and IBM Plex Mono](https://fonts.google.com/) via Google Fonts (SIL Open Font License).
- Photo: `assets/volunteers.webp`. **TODO: add the photo's source, photographer, and license here.**
