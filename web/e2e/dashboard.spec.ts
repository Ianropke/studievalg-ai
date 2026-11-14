/**
 * Playwright E2E Integration Test Suite
 * End-to-End User Journeys: Search, explicit AI opt-in, and navigation
 */

import { test, expect } from '@playwright/test';

test.describe('AI-Studievalgsplatform Dashboard E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('E2E-01: Enkel forside med søgeforslag og forklaringer nederst', async ({ page }) => {
    await expect(page).toHaveTitle(/Uddannelsesindsigt/i);
    await expect(page.locator('h1')).toContainText('Hvilken uddannelse');
    await expect(page.getByTestId('program-card').first()).toContainText('Administrationsøkonom, Horsens');
    await page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' }).fill('13255');
    await expect(page.getByTestId('program-card')).toHaveCount(0);
    await page.getByRole('button', { name: 'Nulstil og vis alle uddannelser' }).click();
    await expect(page.locator('main')).not.toContainText(/ikke verificeret|Ikke fundet i 2026-kilden|model-\/provenansstatus/);
    await expect(page.getByRole('heading', { name: 'Hvad er du nysgerrig på?' })).toBeVisible();
    await expect(page.locator('#om-tallene details').first()).not.toHaveAttribute('open', '');
    await page.getByRole('button', { name: 'Software ↗' }).click();
    await expect(page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' })).toHaveValue('software');
    await expect(page.getByTestId('program-card').first()).toContainText(/software|datalogi|computer/i);
    await page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)').fill('9,5');
    await expect(page).toHaveURL(/gpa=9\.5/);
    const searchUrl = page.url();
    await page.getByRole('button', { name: 'Om optagelsestal fra 2026' }).click();
    await expect(page).toHaveURL(searchUrl);
    await expect(page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' })).toHaveValue('software');
    await expect(page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)')).toHaveValue('9,5');
    await page.getByText('Sådan læser du tallene', { exact: true }).click();
    await expect(page.locator('#om-tallene')).toContainText('ikke et fast krav eller en garanti');
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
    await expect(page.getByRole('heading', { name: /Op til 1,0 over dit snit/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Andre optagelsesformer/ })).toBeVisible();
    const nearSection = page.getByRole('region', { name: /Op til 1,0 over dit snit/ });
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
    await page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)').fill('9,5');
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
    await page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)').fill('9,5');
    await page.getByRole('button', { name: /Min liste \(1\)/ }).click();
    await expect(page.locator('#saved-programs')).toContainText(firstTitle.split(',')[0]);
    await first.getByRole('checkbox', { name: /^Sammenlign / }).check();
    await second.getByRole('checkbox', { name: /^Sammenlign / }).check();
    await page.getByRole('link', { name: 'Sammenlign (2)' }).click();
    await expect(page).toHaveURL(/\/sammenlign#valg\?a=/);
    expect(new URL(page.url()).search).toBe('');
    await expect(page.getByLabel('Dit gymnasiale gennemsnit til sammenligning')).toHaveValue('9,5');
    await expect(page.locator('main')).toContainText(firstTitle.split(',')[0]);
    await expect(page.locator('main')).toContainText(secondTitle.split(',')[0]);
  });

  test('kortets delingsmenu viser en forklaring hvis udklipsholder ikke er tilgængelig', async ({ page }) => {
    await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }));
    await page.reload();
    const card = page.getByTestId('program-card').first();
    await card.locator('summary').click();
    await card.getByRole('button', { name: /^Kopiér link til/ }).click();
    await expect(page.getByRole('status')).toContainText('Linket kunne ikke kopieres');
  });

  test('adresselinje og tilbageknap gendanner snit, sortering og aktive filtre', async ({ page }) => {
    await page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)').fill('8,2');
    await expect(page).toHaveURL(/gpa=8\.2/);
    expect(new URL(page.url()).search).toBe('');
    expect(new URL(page.url()).hash).toContain('#valg?');
    await page.getByLabel('Vælg universitet eller uddannelsessted').selectOption('au');
    await expect(page).toHaveURL(/u=au/);
    await expect(page.getByLabel('Aktive filtre')).toContainText('Uddannelsessted: AU');
    await page.getByLabel('Sortér resultater').selectOption('highest');
    await expect(page).toHaveURL(/sort=highest/);
    await page.goBack();
    await expect(page.getByLabel('Sortér resultater')).toHaveValue('closest');
    await expect(page.getByLabel('Vælg universitet eller uddannelsessted')).toHaveValue('au');
    await page.goBack();
    await expect(page.getByLabel('Vælg universitet eller uddannelsessted')).toHaveValue('all');
    await expect(page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)')).toHaveValue('8,2');
    await page.reload();
    await expect(page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)')).toHaveValue('8,2');
  });

  test('tilbage annullerer en endnu ikke gemt adresseændring', async ({ page }) => {
    const input = page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)');
    await input.fill('8,2');
    await expect(page).toHaveURL(/gpa=8\.2/);
    await input.fill('9,2');
    await expect(page).toHaveURL(/gpa=9\.2/);
    await input.fill('9,3');
    await page.goBack();
    await expect(input).toHaveValue('8,2');
    await page.waitForTimeout(600);
    await expect(page).toHaveURL(/gpa=8\.2/);
    await expect(input).toHaveValue('8,2');
  });

  test('hurtig navigation bevarer netop indtastet snit ved tilbage', async ({ page }) => {
    await page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)').fill('8,2');
    await page.getByTestId('program-title').first().getByRole('link').click();
    await expect(page).toHaveURL(/\/uddannelse\//);
    await page.goBack();
    await expect(page.getByLabel('Dit gymnasiale gennemsnit (kvote 1)')).toHaveValue('8,2');
    expect(new URL(page.url()).search).toBe('');
  });

  test('institutionsfilter følger kildeverificeret uddannelsessted frem for KOT-prefix', async ({ page }) => {
    await page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' }).fill('20410');
    await page.getByLabel('Vælg universitet eller uddannelsessted').selectOption('sdu');
    await expect(page.getByTestId('program-card').first()).toContainText('Syddansk Universitet');
    await page.getByLabel('Vælg universitet eller uddannelsessted').selectOption('au');
    await expect(page.getByTestId('program-card')).toHaveCount(0);
  });

  test('mobilfilter åbner som dialog og kan betjenes med tastatur', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    const trigger = page.getByRole('button', { name: /Uddannelsessted: Alle · Vælg filter/ });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: 'Filtrér efter uddannelsessted' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Vælg uddannelsessted på mobil').selectOption('sdu');
    await expect(dialog.getByRole('button', { name: /Vis \d+ uddannelser/ })).toBeVisible();
    await dialog.getByRole('button', { name: /Vis \d+ uddannelser/ }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.getByLabel('Aktive filtre')).toContainText('Uddannelsessted: SDU');
  });

  test('E2E-03: AI er fravalgt som standard og kan tilvælges eksplicit', async ({ page }) => {
    const firstThreeIds = () => page.locator('[data-testid="program-card"]').evaluateAll((cards) =>
      cards.slice(0, 3).map((card) => card.getAttribute('data-program-id'))
    );

    const initialIds = await firstThreeIds();
    await expect(page.getByTestId('include-ai-models')).not.toBeChecked();
    await expect(page.getByTestId('ai-toggle-status')).toContainText('alle 879 uddannelser');
    await expect(page.getByTestId('ai-model-indicator')).toHaveCount(0);
    await page.getByTestId('include-ai-models').check();
    await expect(page.getByTestId('ai-toggle-status')).toContainText('410 af 879 uddannelser dækket');
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

  test('nulstilling efter tomt AI-resultat fjerner også AI-sortering', async ({ page }) => {
    await page.getByTestId('include-ai-models').check();
    await page.getByLabel('Sortér resultater').selectOption('ai');
    await page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' }).fill('zzzxqingenuddannelse');
    await page.getByRole('button', { name: 'Nulstil og vis alle uddannelser' }).click();
    await expect(page.getByTestId('include-ai-models')).not.toBeChecked();
    await expect(page.getByLabel('Sortér resultater')).toHaveValue('alphabetical');
  });

  test('E2E-04b: AI-tilvalget kan betjenes med tastaturet', async ({ page }) => {
    const toggle = page.getByTestId('include-ai-models');
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Space');
    await expect(toggle).toBeChecked();
    await expect(page.getByTestId('ai-toggle-status')).toContainText('410 af 879 uddannelser dækket');
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
    await expect(page.locator('h1')).toContainText('AI-analyse');

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

    await expect(page.getByRole('heading', { name: 'AI-analyse til dit uddannelsesvalg' })).toBeVisible();
    await expect(page.getByText('Hvad betyder det for dig?').first()).toBeVisible();
    await expect(page.getByText('Begrænsning:', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Nye forskningskort ovenfor indgår ikke skjult i rangeringen.')).toBeVisible();
    const researchSection = page.locator('section[aria-labelledby="latest-research-heading"]');
    await expect(researchSection.getByRole('link', { name: /Danmarks Statistik/ })).toHaveAttribute('href', /^https:\/\//);
  });

  test('E2E-11: AI Insights er læsbar på en smal mobilskærm', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/analyse');

    await expect(page.getByRole('heading', { name: 'AI-analyse til dit uddannelsesvalg' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Find uddannelser →' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hvad viser undersøgelser af AI på arbejdspladsen?' })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });

});
