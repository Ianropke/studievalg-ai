/**
 * Playwright E2E Integration Test Suite
 * End-to-End User Journeys: Slider Interactions, Search, and Navigation
 */

import { test, expect } from '@playwright/test';

test.describe('AI-Studievalgsplatform Dashboard E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('E2E-01: Forside indlæser korrekt med Nordisk Myndigheds-UI og top navigation', async ({ page }) => {
    await expect(page).toHaveTitle(/Uddannelsesindsigt/i);
    await expect(page.locator('h1')).toContainText('Hvilken uddannelse');
    await expect(page.locator('text=Optagelsesdata 26. juli 2026')).toBeVisible();
  });

  test('E2E-02: Søgning på "læge" placerer Medicin som #1 match', async ({ page }) => {
    const searchInput = page.locator('input[type="text"]');
    await searchInput.fill('læge');

    // Vent på deferred value opdatering
    await page.waitForTimeout(300);

    const firstCardTitle = page.locator('article h3').first();
    await expect(firstCardTitle).toContainText('Medicin');
  });

  test('E2E-03: Vægtsliderne ændrer rangeringen live og viser alle tre dimensioner', async ({ page }) => {
    const firstCard = page.locator('[data-testid="program-card"]').first();
    const firstThreeIds = () => page.locator('[data-testid="program-card"]').evaluateAll((cards) =>
      cards.slice(0, 3).map((card) => card.getAttribute('data-program-id'))
    );

    const initialIds = await firstThreeIds();
    await page.locator('#ai-weight-slider').fill('0');
    await page.locator('#job-weight-slider').fill('0');
    await page.locator('#salary-weight-slider').fill('100');

    await expect(page.getByTestId('weight-summary')).toContainText('AI 0% · Job 0% · Løn 100%');
    await expect.poll(firstThreeIds).not.toEqual(initialIds);

    // Verificer at progress barer for AI-robusthed, Jobmuligheder og Lønpotentiale eksisterer på kort 1
    await expect(firstCard.getByTestId('metric-ai')).toBeVisible();
    await expect(firstCard.getByTestId('metric-job')).toBeVisible();
    await expect(firstCard.getByTestId('metric-salary')).toBeVisible();
    await expect(firstCard.locator('text=Trekant-profil')).toBeVisible();
  });

  test('E2E-04: Prioritering og minimumskrav kan skelnes tydeligt i interfacet', async ({ page }) => {
    await expect(page.getByTestId('preference-help')).toContainText('Sliderne bestemmer');
    await page.locator('#preference-mode').selectOption('requirements');
    await expect(page.getByTestId('preference-help')).toContainText('minimumsniveauer');
    await expect(page.getByTestId('weight-summary')).toContainText('Minimumskrav');
    await expect(page.locator('#requirement-match-mode')).toBeVisible();

    await page.locator('#requirement-match-mode').selectOption('any');
    await expect(page.getByTestId('weight-summary')).toContainText('mindst ét aktivt krav');
    await expect(page.locator('#ai-weight-slider')).toHaveAttribute('aria-label', /minimum/);
  });

  test('E2E-05: Søgning opdaterer resultater uden manuel genindlæsning', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' });
    await searchInput.fill('læge');

    await expect(page.locator('[data-testid="program-title"]').first()).toContainText('Medicin');
    await expect(page.getByText(/matchede uddannelser/)).toBeVisible();
  });

  test('E2E-06: Navigering til AI Insights og PEFF Evidens undersider', async ({ page }) => {
    const navigation = page.getByRole('navigation', { name: 'Hovednavigation' });
    await navigation.getByRole('link', { name: 'AI Insights' }).click();
    await expect(page).toHaveURL(/.*analyse/);
    await expect(page.locator('h1')).toContainText('AI Insights');

    await navigation.getByRole('link', { name: 'Evidens' }).click();
    await expect(page).toHaveURL(/.*evidens/);
    await expect(page.locator('h1')).toContainText('Bag om dine scorer');
  });

  test('E2E-07: Et delt match gendanner snit, vægte, kravlogik, uddannelsessted og søgning', async ({ page }) => {
    await page.goto('/?gpa=8.2&wAi=90&wJob=40&wSal=20&mode=requirements&match=any&u=au&q=medicin');

    await expect(page.locator('#gpa-slider')).toHaveValue('8.2');
    await expect(page.locator('#ai-weight-slider')).toHaveValue('90');
    await expect(page.locator('#job-weight-slider')).toHaveValue('40');
    await expect(page.locator('#salary-weight-slider')).toHaveValue('20');
    await expect(page.locator('#preference-mode')).toHaveValue('requirements');
    await expect(page.locator('#requirement-match-mode')).toHaveValue('any');
    await expect(page.locator('#university-select')).toHaveValue('au');
    await expect(page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' })).toHaveValue('medicin');
  });

  test('E2E-08: Guidehub og beslutningsguide kan åbnes fra hovednavigationen', async ({ page }) => {
    const navigation = page.getByRole('navigation', { name: 'Hovednavigation' });
    await navigation.getByRole('link', { name: 'Guides' }).click();
    await expect(page).toHaveURL(/.*guides$/);
    await expect(page.locator('h1')).toContainText('Guides til at vælge uddannelse');

    await page.getByRole('link', { name: /Læs guiden/ }).first().click();
    await expect(page).toHaveURL(/.*guides\/hvad-kan-jeg-laese-med-mit-snit/);
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

});
