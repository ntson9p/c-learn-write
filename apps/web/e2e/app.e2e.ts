/**
 * End-to-end tests against the production build (`npm run e2e` builds first):
 * phone layout, offline start through the service worker, the grader used
 * from the app. Set E2E_SCREENSHOTS=<dir> to save screenshots.
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, devices, type Browser, type Page } from 'playwright';
import { preview, type PreviewServer } from 'vite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const appDir = join(__dirname, '..');
let server: PreviewServer;
let browser: Browser;
let base: string;

async function shot(page: Page, name: string): Promise<void> {
  const dir = process.env.E2E_SCREENSHOTS;
  if (!dir) return;
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true });
}

beforeAll(async () => {
  server = await preview({ root: appDir, configFile: join(appDir, 'vite.config.ts'), preview: { port: 4179, host: '127.0.0.1' } });
  base = server.resolvedUrls?.local[0] ?? 'http://127.0.0.1:4179/';
  browser = await chromium.launch();
});

afterAll(async () => {
  await browser?.close();
  await new Promise<void>((resolve) => server?.httpServer.close(() => resolve()));
});

describe('app (production build)', () => {
  it('fits a phone screen without horizontal scrolling', async () => {
    const context = await browser.newContext({ ...devices['Pixel 7'] });
    const page = await context.newPage();
    await page.goto(base);
    await page.getByRole('heading', { level: 1, name: 'Lộ trình học' }).waitFor();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole('navigation', { name: 'Điều hướng chính' }).isVisible()).resolves.toBe(true);
    await shot(page, 'home-phone');
    await page.goto(`${base}#/settings`);
    await page.getByRole('heading', { level: 1, name: 'Cài đặt' }).waitFor();
    await shot(page, 'settings-phone');
    await context.close();
  });

  it('starts offline after the first visit and grades answers offline', async () => {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
    const page = await context.newPage();
    await page.goto(base);
    await page.getByRole('heading', { level: 1, name: 'Lộ trình học' }).waitFor();
    // Wait until the service worker has installed and precached everything.
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise<void>((resolve) => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }));
      }
      return reg.active?.state;
    });

    await context.setOffline(true);
    await page.reload();
    await page.getByRole('heading', { level: 1, name: 'Lộ trình học' }).waitFor();

    // The grader chunk was never loaded online: it must come from the precache.
    await page.goto(`${base}#/grader`);
    await page.getByRole('heading', { level: 1, name: 'Chấm thử câu trả lời' }).waitFor();
    await page.getByLabel('Câu trả lời').fill('有四苹果。');
    await page.getByRole('button', { name: 'Chấm điểm' }).click();
    await expect(page.locator('.score-value').textContent()).resolves.toBe('80');
    await shot(page, 'grader-offline');
    await context.close();
  });

  it('serves the license notices', async () => {
    const res = await fetch(`${base}licenses.txt`);
    expect(res.ok).toBe(true);
    const text = await res.text();
    expect(text).toContain('preact@');
    expect(text).toContain('pinyin-pro@');
  });
});
