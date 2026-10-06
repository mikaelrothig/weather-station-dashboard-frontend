import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Spot from '../pages/Spot.tsx'
import { Analytics } from "@vercel/analytics/react";
import { reopenLastSpotOnLaunch } from '../utils/launchUtils.ts';

reopenLastSpotOnLaunch();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Spot 
        spotName="Blouberg" 
        spotSubHeading="Western Cape, South Africa" 
        showMacwind={true}
      />
      <Analytics/>
  </StrictMode>,
)
