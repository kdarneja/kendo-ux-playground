#!/usr/bin/env node
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const route = process.argv[2] ?? '/stacked-windows';
const out = process.argv[3] ?? 'screenshot.png';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log(`screenshot saved: ${out}`);
