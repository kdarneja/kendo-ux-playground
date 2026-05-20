#!/usr/bin/env node
// Three-stage capture using only the ZIP window (avoids click intercepts from HCP).
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function dump(name) {
  await page.waitForTimeout(700);
  const out = `/tmp/sw-${name}.png`;
  await page.screenshot({ path: out });
  console.log(`${name.padEnd(14)} -> ${out}`);
}

const zipAction = (label) =>
  page.locator(`.k-window:has(.k-window-title:text-is("Zip ID")) [aria-label="${label}"]`);

await page.goto(`${BASE}/stacked-windows`, { waitUntil: 'networkidle', timeout: 15000 });
await dump('initial');

// MINIMIZED → DEFAULT (half-height, bottom-docked).
await zipAction('restore').click();
await dump('zip-half');

// DEFAULT → FULLSCREEN (full coverage).
await zipAction('maximize').click();
await dump('zip-full');

// FULLSCREEN → DEFAULT (back to half).
await zipAction('restore').click();
await dump('zip-half-again');

// DEFAULT → MINIMIZED (back to chip).
await zipAction('minimize').click();
await dump('zip-chip-again');

await browser.close();
