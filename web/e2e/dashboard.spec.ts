/**
 * Playwright E2E Integration Test Suite
 * End-to-End User Journeys: Search, explicit AI opt-in, and navigation
 */

import { test, expect } from '@playwright/test';

test.describe('AI-Studievalgsplatform Dashboard E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-01: Forside indlæser korrekt med Nordisk Myndigheds-UI og top navigation', async ({ page }) => {
    await expect(page).toHaveTitle(/Uddannelsesindsigt/i);
    await expect(page.locator('h1')).toContainText('Hvilken uddannelse');
    await expect(page.getByText(/KOT-optaget 2026 \(delvis dækning\)/).first()).toBeVisible();
  });

  test('E2E-02: Søgning på "læge" placerer Medicin som #1 match', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' });
    await searchInput.fill('læge');

    // Vent på deferred value opdatering
    await page.waitForTimeout(300);

    const firstCardTitle = page.locator('article h3').first();
    await expect(firstCardTitle).toHaveText(/^Medicin,/);
  });

  test('snit kan indtastes med komma, sorteres og viser særskilte grupper', async ({ page }) => {
    const gpa = page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)');
    await expect(gpa).toHaveValue('');
    await expect(page.getByLabel('Sortér resultater')).toHaveValue('alphabetical');
    await expect(page.getByText(/Indtast dit snit for at sammenligne kvotienter/)).toBeVisible();
    await gpa.fill('9,5');
    await expect(page.getByLabel('Sortér resultater')).toHaveValue('closest');
    await expect(page.getByRole('heading', { name: /Lige uden for rækkevidde/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Uden numerisk kvotient/ })).toBeVisible();
    const nearSection = page.getByRole('region', { name: /Lige uden for rækkevidde/ });
    await expect(nearSection.getByTestId('program-card')).toHaveCount(3);
    await nearSection.getByRole('button', { name: /Vis flere/ }).click();
    await expect(nearSection.getByTestId('program-card')).toHaveCount(13);
    await expect(page.getByText(/Dit snit 9,5 · kvotient/).first()).toBeVisible();
    await page.getByLabel('Sortér resultater').selectOption('highest');
    await expect(page.getByText(/Højeste kvotient først/)).toBeVisible();
    const values = await page.locator('[data-testid="program-card"]').evaluateAll((cards) => cards.slice(0, 5).map((card) => card.querySelector('.font-mono-data.text-xl')?.textContent));
    const numericValues = values.map((value) => Number(value?.replace(',', '.')));
    expect(numericValues.every((value) => Number.isFinite(value))).toBe(true);
    expect(numericValues).toEqual([...numericValues].sort((a, b) => b - a));
    await page.getByLabel('Sortér resultater').selectOption('closest');
    await gpa.fill('13');
    await expect(page.getByText(/Skriv et snit mellem 2,0 og 12,0/)).toBeVisible();
    await expect(page.getByLabel('Sortér resultater')).toHaveValue('alphabetical');
  });

  test('Min liste gemmes lokalt og valgte uddannelser overføres til sammenligning', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('uddannelsesindsigt.saved-programs'));
    await page.reload();
    const cards = page.getByTestId('program-card');
    const first = cards.nth(0);
    const second = cards.nth(1);
    const firstId = await first.getAttribute('data-program-id');
    const firstTitle = await first.getByTestId('program-title').innerText();
    const secondTitle = await second.getByTestId('program-title').innerText();
    await first.getByRole('button', { name: /^Gem .* Min liste/ }).click();
    await expect(first.getByRole('button', { name: /^Fjern .* Min liste/ })).toHaveAttribute('aria-pressed', 'true');
    const stored = await page.evaluate(() => localStorage.getItem('uddannelsesindsigt.saved-programs'));
    expect(JSON.parse(stored!)).toEqual({ version: 1, kotIds: [firstId] });
    await page.reload();
    await page.getByRole('button', { name: /Min liste \(1\)/ }).click();
    await expect(page.locator('#saved-programs')).toContainText(firstTitle.split(',')[0]);
    await first.getByRole('checkbox', { name: /^Sammenlign / }).check();
    await second.getByRole('checkbox', { name: /^Sammenlign / }).check();
    await page.getByRole('link', { name: 'Sammenlign (2)' }).click();
    await expect(page).toHaveURL(/\/sammenlign\?a=/);
    await expect(page.locator('main')).toContainText(firstTitle.split(',')[0]);
    await expect(page.locator('main')).toContainText(secondTitle.split(',')[0]);
  });

  test('E2E-03: AI er fravalgt som standard og kan tilvælges eksplicit', async ({ page }) => {
    const firstThreeIds = () => page.locator('[data-testid="program-card"]').evaluateAll((cards) =>
      cards.slice(0, 3).map((card) => card.getAttribute('data-program-id'))
    );

    const initialIds = await firstThreeIds();
    await expect(page.getByTestId('include-ai-models')).not.toBeChecked();
    await expect(page.getByTestId('ai-toggle-status')).toContainText('alle 1.413 uddannelser');
    await expect(page.getByTestId('ai-model-indicator')).toHaveCount(0);
    await page.getByTestId('include-ai-models').check();
    await expect(page.getByTestId('ai-toggle-status')).toContainText('569 af 1.413 uddannelser dækket');
    await expect.poll(firstThreeIds).not.toEqual(initialIds);
    await expect(page.locator('[data-testid="program-card"]').first().getByTestId('ai-model-indicator')).toBeVisible();
  });

  test('E2E-04: Job- og lønkontroller er fjernet fra beslutningsoplevelsen', async ({ page }) => {
    await expect(page.locator('#job-weight-slider')).toHaveCount(0);
    await expect(page.locator('#salary-weight-slider')).toHaveCount(0);
    await expect(page.locator('#preference-mode')).toHaveCount(0);
    await expect(page.getByText('Jobmuligheder', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Lønpotentiale', { exact: true })).toHaveCount(0);
  });

  test('E2E-04b: AI-tilvalget kan betjenes med tastaturet', async ({ page }) => {
    const toggle = page.getByTestId('include-ai-models');
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Space');
    await expect(toggle).toBeChecked();
    await expect(page.getByTestId('ai-toggle-status')).toContainText('569 af 1.413 uddannelser dækket');
  });

  test('E2E-05: Søgning opdaterer resultater uden manuel genindlæsning', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' });
    await searchInput.fill('læge');

    await expect(page.locator('[data-testid="program-title"]').first()).toContainText('Medicin');
    await expect(page.getByText(/uddannelser i visningen/).last()).toBeVisible();
  });

  test('E2E-06: Navigering til AI Insights og Evidens undersider', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Hovednavigation' }).getByRole('link', { name: 'AI-analyse' }).click();
    await expect(page).toHaveURL(/.*analyse/);
    await expect(page.locator('h1')).toContainText('AI Insights');

    await page.getByRole('navigation', { name: 'Hovednavigation' }).getByRole('link', { name: 'Kilder og metode' }).click();
    await expect(page).toHaveURL(/.*evidens/);
    await expect(page.locator('h1')).toContainText('Bag om dine scorer');
  });

  test('E2E-07: Et delt link gendanner snit, AI-tilvalg, uddannelsessted og søgning', async ({ page }) => {
    await page.goto('/?gpa=8.2&ai=1&u=au&q=medicin&sort=ai');

    await expect(page.locator('#gpa-slider')).toHaveValue('8.2');
    await expect(page.getByTestId('include-ai-models')).toBeChecked();
    await expect(page.locator('#university-select')).toHaveValue('au');
    await expect(page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' })).toHaveValue('medicin');
    await expect(page.getByLabel('Sortér resultater')).toHaveValue('ai');
  });

  test('E2E-08: Guidehub og beslutningsguide kan åbnes fra hovednavigationen', async ({ page }) => {
    const navigation = page.getByRole('navigation', { name: 'Hovednavigation' });
    await navigation.getByRole('link', { name: 'Guides' }).click();
    await expect(page).toHaveURL(/.*guides$/);
    await expect(page.locator('h1')).toContainText('Guides til at vælge uddannelse');

    await page.locator('a[href="/guides/hvad-kan-jeg-laese-med-mit-snit"]').click();
    await expect(page).toHaveURL(/.*guides\/hvad-kan-jeg-laese-med-mit-snit/, { timeout: 15_000 });
    await expect(page.locator('h1')).toContainText('Hvad kan jeg læse med mit snit');
  });

  test('E2E-09: Alle tidligere domæner viderestiller permanent med sti og søgning bevaret', async ({ request }) => {
    const legacyHosts = [
      'www.uddannelsesindsigt.com',
      'uddannelsesindsigt.dk',
      'www.uddannelsesindsigt.dk',
    ];

    for (const host of legacyHosts) {
      const response = await request.get(
        'http://127.0.0.1:3000/guides/ai-og-uddannelsesvalg?fra=test',
        {
          headers: { Host: host },
          maxRedirects: 0,
        },
      );

      expect(response.status()).toBe(308);
      expect(response.headers().location).toBe(
        'https://uddannelsesindsigt.com/guides/ai-og-uddannelsesvalg?fra=test',
      );
    }
  });

  test('E2E-10: AI Insights viser nyere forskning som kontekst og ikke som skjult rangering', async ({ page }) => {
    await page.goto('/analyse');

    await expect(page.getByRole('heading', { name: 'AI Insights til dit uddannelsesvalg' })).toBeVisible();
    await expect(page.getByText('Hvad betyder det for dig?').first()).toBeVisible();
    await expect(page.getByText('Begrænsning:', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Nye forskningskort ovenfor indgår ikke skjult i rangeringen.')).toBeVisible();
    const researchSection = page.locator('section[aria-labelledby="latest-research-heading"]');
    await expect(researchSection.getByRole('link', { name: /Danmarks Statistik/ })).toHaveAttribute('href', /^https:\/\//);
  });

  test('E2E-11: AI Insights er læsbar på en smal mobilskærm', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/analyse');

    await expect(page.getByRole('heading', { name: 'AI Insights til dit uddannelsesvalg' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find uddannelser →' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hvad viser undersøgelser af AI på arbejdspladsen?' })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

});
