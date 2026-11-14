/** Decision-support pages can place personal choices in URLs. Fail closed. */
export function allowTelemetry(eventUrl: string, currentUrl: string): boolean {
  try {
    const event = new URL(eventUrl, currentUrl);
    const current = new URL(currentUrl);
    const isDecisionPage = (pathname: string) => pathname === "/" || pathname === "/sammenlign" || pathname === "/sammenlign/";
    const privateKeys = ["gpa", "q", "u", "ai", "sort", "a", "b", "c", "wAi"];
    const containsChoices = (url: URL) => url.hash.startsWith("#valg?") || privateKeys.some((key) => url.searchParams.has(key));
    return !isDecisionPage(event.pathname) && !isDecisionPage(current.pathname) && !containsChoices(event) && !containsChoices(current);
  } catch {
    return false;
  }
}
