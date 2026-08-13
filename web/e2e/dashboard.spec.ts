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
    await expect(page.locator('text=Seneste Optagelsesdata')).toBeVisible();
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

  test('E2E-04: Søgning opdaterer resultater uden manuel genindlæsning', async ({ page }) => {
    const searchInput = page.getByRole('textbox', { name: 'Søg efter uddannelse eller erhverv' });
    await searchInput.fill('læge');

    await expect(page.locator('[data-testid="program-title"]').first()).toContainText('Medicin');
    await expect(page.getByText(/matchede uddannelser/)).toBeVisible();
  });

  test('E2E-05: Navigering til AI Insights og PEFF Evidens undersider', async ({ page }) => {
    const navigation = page.getByRole('navigation', { name: 'Hovednavigation' });
    await navigation.getByRole('link', { name: 'AI Insights' }).click();
    await expect(page).toHaveURL(/.*analyse/);
    await expect(page.locator('h1')).toContainText('AI Insights');

    await navigation.getByRole('link', { name: 'Evidens' }).click();
    await expect(page).toHaveURL(/.*evidens/);
    await expect(page.locator('h1')).toContainText('Bag om dine scorer');
  });

});
