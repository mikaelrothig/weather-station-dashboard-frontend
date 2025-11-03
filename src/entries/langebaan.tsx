import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import App from '../App.tsx'
import {Analytics} from "@vercel/analytics/react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <App spotName="Langebaan" spotSubHeading="Western Cape, South Africa" showMacwind={false} />
      <Analytics/>
  </StrictMode>,
)