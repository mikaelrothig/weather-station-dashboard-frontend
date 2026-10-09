import { StrictMode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '../index.css'
import Home from '../pages/Home.tsx'
import { Analytics } from "@vercel/analytics/react";
import { installDevFixtures } from '../dev/fixtures.ts';
import { reopenLastSpotOnLaunch } from '../utils/launchUtils.ts';

// Dev only: ?data=demo|storm|calm|… swaps API responses for stress-test scenarios
if (import.meta.env.DEV) installDevFixtures();

reopenLastSpotOnLaunch();

// Synchronous first render, so the header is on screen at the first frame (the page transition in index.css needs it)
const root = createRoot(document.getElementById('root')!)
flushSync(() => root.render(
  <StrictMode>
      <Home />
      <Analytics/>
  </StrictMode>,
))
