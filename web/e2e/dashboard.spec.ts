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
    await expect(page).toHaveTitle(/Studievalg AI/i);
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

  test('E2E-03: Slider-justering opdaterer vægtet sortering og 3 progress bars', async ({ page }) => {
    const gpaSlider = page.locator('input#gpa-slider');
    await gpaSlider.fill('11.0');

    await page.waitForTimeout(300);

    // Verificer at progress barer for AI-robusthed, Jobmuligheder og Lønpotentiale eksisterer på kort 1
    const firstCard = page.locator('article').first();
    await expect(firstCard.locator('text=AI-robusthed')).toBeVisible();
    await expect(firstCard.locator('text=Jobmuligheder')).toBeVisible();
    await expect(firstCard.locator('text=Lønpotentiale')).toBeVisible();
    await expect(firstCard.locator('text=Trekant-profil')).toBeVisible();
  });

  test('E2E-04: Navigering til AI Insights og PEFF Evidens undersider', async ({ page }) => {
    await page.click('text=AI Insights');
    await expect(page).toHaveURL(/.*analyse/);
    await expect(page.locator('h1')).toContainText('AI Insights');

    await page.click('text=PEFF Evidens');
    await expect(page).toHaveURL(/.*evidens/);
    await expect(page.locator('h1')).toContainText('Systemets Kernemetrics');
  });

});
