import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Spot from '../pages/Spot.tsx'
import { Analytics } from "@vercel/analytics/react";
import CameraStreamComponent from '../components/CameraStreamComponent.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <Spot 
        spotName="Blouberg" 
        spotSubHeading="Western Cape, South Africa" 
        showMacwind={true} 
        extraComponent={
          <CameraStreamComponent 
            streamUrl="https://table-mountain.conjure.co.za/hls/media.m3u8" 
            title="Live Camera" 
          />
        } 
      />
      <Analytics/>
  </StrictMode>,
)