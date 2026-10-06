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

## 🛠 Installation & Set Up
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
