/** Decision-support pages can place personal choices in URLs. Fail closed. */
export function allowTelemetry(eventUrl: string, currentUrl: string): boolean {
  try {
    const event = new URL(eventUrl, currentUrl);
    const current = new URL(currentUrl);
    const isDecisionPage = (pathname: string) => pathname === "/" || pathname === "/sammenlign" || pathname === "/sammenlign/";
    return !isDecisionPage(event.pathname) && !isDecisionPage(current.pathname);
  } catch {
    return false;
  }
}
