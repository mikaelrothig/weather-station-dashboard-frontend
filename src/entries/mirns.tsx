import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Spot from '../pages/Spot.tsx'
import { Analytics } from "@vercel/analytics/react";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Spot 
        spotName="Mirns" 
        spotSubHeading="Friesland, Netherlands" 
        showMacwind={false} 
      />
      <Analytics/>
  </StrictMode>,
)