import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {Analytics} from "@vercel/analytics/vue";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics/>
  </StrictMode>,
)
