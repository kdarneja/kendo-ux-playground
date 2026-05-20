#!/usr/bin/env node
import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/map-toolbars', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.screenshot({ path: '/tmp/mt-closed.png' });
console.log('closed -> /tmp/mt-closed.png');

// Click the 2nd toolbar item (the tool dropdown anchor).
await page.locator('.map-toolbar__anchor button').click();
await page.waitForTimeout(500);
await page.screenshot({ path: '/tmp/mt-open.png' });
console.log('open   -> /tmp/mt-open.png');

// Pick the rectangle select tool.
await page.locator('.map-tool-stack .k-button').nth(3).click();
await page.waitForTimeout(400);
await page.screenshot({ path: '/tmp/mt-picked.png' });
console.log('picked -> /tmp/mt-picked.png');

await browser.close();
