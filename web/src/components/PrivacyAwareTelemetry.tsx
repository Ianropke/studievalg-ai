"use client";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { allowTelemetry } from "@/lib/telemetryPrivacy";

/** No analytics or performance event leaves either decision-support page. */
function filterEvent<T extends { url: string }>(event: T): T | null {
  return allowTelemetry(event.url, window.location.href) ? event : null;
}

export function PrivacyAwareTelemetry() {
  return <><Analytics beforeSend={filterEvent} /><SpeedInsights beforeSend={filterEvent} /></>;
}
