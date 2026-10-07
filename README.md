<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/MikaelRothig/weather-station-dashboard-frontend/main/src/assets/brand/wordmark-on-dark.svg" />
    <img alt="Kite Beach Forecast" src="https://raw.githubusercontent.com/MikaelRothig/weather-station-dashboard-frontend/main/src/assets/brand/wordmark-on-light.svg" width="360" />
  </picture>
</div>
<h1 align="center">
    Weather Station Dashboard Frontend
</h1>
<p align="center">
    Frontend for a kitesurf forecast webapp that aggregates data from multiple sources.
</p>

<img alt="Kite Beach Forecast on desktop and phone" src="https://raw.githubusercontent.com/MikaelRothig/weather-station-dashboard-frontend/main/src/assets/images/showcase.png"/>

## Installation & Set Up
*This project relies on the <a href="https://github.com/mikaelrothig/weather-station-dashboard-backend">Weather Station Dashboard Backend</a> to recieve weather data. Please make sure to follow it's installation and setup steps.*

1. Install dependencies

   ```sh
   npm install
   ```
   
2. Create an `.env.local` file in the base directory and paste the following;

   ```
   VITE_API_BASE_URL=http://localhost:4000
   ```
   
3. Start the local development server

   ```sh
   npm run dev
   ```

## Adding a spot

1. Add the spot to `src/config/spots.ts`. Its page (`/<spot>`) is generated from that list at build time, with its own title and link preview, from the `spot.html` template.
2. Add it to the backend's `src/config/spots.ts` too.
3. If it falls outside the home page map, run `npm run outlines` to redraw the coastline around every spot.

## Mock data

In development, add `?data=showcase`, `demo`, `storm`, `calm`, `glassy` or `worst` to any URL to replace the API with generated data, including the home page summary. A switcher at the bottom of the page changes scenario. None of this is included in production builds.
