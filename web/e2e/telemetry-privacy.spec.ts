import { expect, test } from '@playwright/test';

test('beslutningssider blokerer statistik med valg i URL', async ({ page }) => {
  await page.addInitScript(() => {
    const target = window as unknown as { va?: (...args: unknown[]) => void; si?: (...args: unknown[]) => void; hooks: Record<string, (event: { type: string; url: string }) => unknown> };
    target.hooks = {};
    target.va = (name, callback) => { if (name === 'beforeSend') target.hooks.analytics = callback as typeof target.hooks.analytics; };
    target.si = (name, callback) => { if (name === 'beforeSend') target.hooks.speed = callback as typeof target.hooks.speed; };
  });
  await page.goto('/?gpa=9.5&q=medicin');
  await expect.poll(() => page.evaluate(() => Object.keys((window as unknown as { hooks: Record<string, unknown> }).hooks).sort())).toEqual(['analytics', 'speed']);
  const results = await page.evaluate(() => {
    const hooks = (window as unknown as { hooks: Record<string, (event: { type: string; url: string }) => unknown> }).hooks;
    return [hooks.analytics({ type: 'pageview', url: location.href }), hooks.speed({ type: 'vital', url: location.href })];
  });
  expect(results).toEqual([null, null]);
});

test('nye links gendanner valg uden at sende fragmentet i sideanmodningen', async ({ page }) => {
  const response = await page.goto('/#valg?gpa=8.2&q=medicin&ai=0&sort=closest');
  expect(new URL(response!.request().url()).search).toBe('');
  expect(response!.request().url()).not.toContain('gpa');
  await expect(page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)')).toHaveValue('8,2');
  await expect(page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' })).toHaveValue('medicin');
  await page.reload();
  await expect(page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)')).toHaveValue('8,2');
});
