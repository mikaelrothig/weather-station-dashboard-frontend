import { StrictMode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import Spot from '../pages/Spot.tsx'
import { Analytics } from "@vercel/analytics/react";
import { installDevFixtures } from '../dev/fixtures.ts';
import { getCurrentSpot } from '../utils/spotUtils.ts';
import { rememberSpot } from '../utils/launchUtils.ts';

// Dev only: ?data=demo|storm|calm|… swaps API responses for stress-test scenarios
if (import.meta.env.DEV) installDevFixtures();

// Every spot page is the same bundle (vite.config.ts writes one HTML file per spot); the URL says which spot.
// Only spot URLs are served this page, so a spot is always found.
const spot = getCurrentSpot()!;
rememberSpot(spot);

// Synchronous first render, so the header is on screen at the first frame (the page transition in index.css needs it)
const root = createRoot(document.getElementById('root')!)
flushSync(() => root.render(
  <StrictMode>
      <Spot spot={spot} />
      <Analytics/>
  </StrictMode>,
))
