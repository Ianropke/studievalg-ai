import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const KEY_ROUTES = [
  "/",
  "/analyse",
  "/evidens",
  "/guides",
  "/guides/ai-og-uddannelsesvalg",
  "/lister/top-10-mest-ai-robuste-uddannelser",
  "/sammenlign",
  "/uddannelse/10234-bioteknologi-frederiksberg-c-studiestart-sommerstart",
];

test.describe("Tilgængelighed, responsive flader og discovery", () => {
  for (const route of KEY_ROUTES) {
    test(`ingen alvorlige automatiske accessibility-fejl på ${route}`, async ({ page }) => {
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      const blocking = results.violations.filter(
        (violation) => violation.impact === "critical" || violation.impact === "serious",
      );
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  }

  test("forside og centrale undersider har ingen vandret mobil-overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["/", "/analyse", "/evidens", "/sammenlign"]) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `${route} har vandret overflow`).toBe(false);
    }
  });

  test("spring-link og delingsdialog kan betjenes med tastatur", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skipLink = page.getByRole("link", { name: "Spring til hovedindhold" });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();

    await page.getByRole("button", { name: "Del dit match" }).click();
    const dialog = page.getByRole("dialog", { name: "Del din søgning" });
    await expect(dialog).toBeVisible();
    await expect(page.getByRole("button", { name: "Luk deling" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
  });

  test("sammenligning holder AI-estimater fravalgt, indtil brugeren vælger dem", async ({ page }) => {
    await page.goto("/sammenlign");
    const toggle = page.getByTestId("compare-ai-toggle");
    await expect(toggle).not.toBeChecked();
    await expect(page.getByText("AI-model: fravalgt")).toBeVisible();
    await expect(page.getByText("O*NET 31.0-modelestimat", { exact: true })).toHaveCount(0);
    await toggle.check();
    await expect(page.getByText("O*NET 31.0-modelestimat", { exact: true })).toBeVisible();
  });

  test("SEO- og agent-discoveryflader er komplette og kanoniske", async ({ page, request }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Find uddannelse.*Uddannelsesindsigt/i);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /1\.413 danske/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://uddannelsesindsigt.com");

    const [robots, sitemap, llms, llmsFull] = await Promise.all([
      request.get("/robots.txt"),
      request.get("/sitemap.xml"),
      request.get("/llms.txt"),
      request.get("/llms-full.txt"),
    ]);
    for (const response of [robots, sitemap, llms, llmsFull]) {
      expect(response.ok()).toBe(true);
    }
    expect(await robots.text()).toContain("https://uddannelsesindsigt.com/sitemap.xml");
    expect(await llms.text()).toContain("O*NET 31.0");
    expect(await llmsFull.text()).toContain("PROVENANCE_REQUIRED");
    const sitemapBody = await sitemap.text();
    expect(sitemapBody).toContain("https://uddannelsesindsigt.com/evidens");
    expect((sitemapBody.match(/<url>/g) || []).length).toBeGreaterThan(1400);
  });

  test("repræsentative interne links svarer uden fejl", async ({ page, request }) => {
    await page.goto("/");
    const links = await page.locator('main a[href^="/"]').evaluateAll((anchors) =>
      [...new Set(anchors.map((anchor) => anchor.getAttribute("href")).filter(Boolean))].slice(0, 20),
    );
    expect(links.length).toBeGreaterThan(0);
    for (const href of links) {
      const response = await request.get(String(href));
      expect(response.status(), `${href} svarede ${response.status()}`).toBeLessThan(400);
    }
  });
});
