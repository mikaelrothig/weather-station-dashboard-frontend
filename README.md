<div align="center">
  <img alt="Logo" src="https://raw.githubusercontent.com/MikaelRothig/weather-station-dashboard-frontend/main/public/favicon.svg" width="100" />
</div>
<h1 align="center">
    Weather Station Dashboard Frontend
</h1>
<p align="center">
    Frontend for a dashboard that shows weather forecast data from multiple sources.
</p>

![demo](https://raw.githubusercontent.com/MikaelRothig/weather-station-dashboard-frontend/main/src/assets/images/demo.png)

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
