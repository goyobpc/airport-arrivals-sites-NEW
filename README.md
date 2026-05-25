# Airport International Arrival Board Sites

Six separate pages that pull from airport-jfk.com and airport-ewr.com, then filter by terminal and remove domestic U.S. origins.

## Pages
- `/jfk-terminal-1`
- `/jfk-terminal-4`
- `/jfk-terminal-7`
- `/jfk-terminal-8`
- `/ewr-terminal-b`
- `/ewr-terminal-c`

## Run locally
```bash
npm install
npm start
```
Open: `http://localhost:3000/jfk-terminal-1`

## Hosting
Host as a small Node app on Render, Railway, Fly.io, or a VPS. A plain static host will not work because the browser cannot reliably scrape the flight pages directly due to CORS and blocking.

## Notes
The app fetches the full day by combining the source site's time periods: `tp=0`, current/default, `tp=6`, `tp=12`, and `tp=18`, then de-duplicates.
