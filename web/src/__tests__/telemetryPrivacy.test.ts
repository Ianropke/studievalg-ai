import assert from "node:assert/strict";
import { allowTelemetry } from "../lib/telemetryPrivacy";

const site = "https://uddannelsesindsigt.com";
assert.equal(allowTelemetry(`${site}/?gpa=9.5&q=medicin`, `${site}/?gpa=9.5`), false);
assert.equal(allowTelemetry(`${site}/`, `${site}/`), false);
assert.equal(allowTelemetry(`${site}/sammenlign?a=10234&gpa=9.5`, `${site}/sammenlign?a=10234`), false);
assert.equal(allowTelemetry(`${site}/guides`, `${site}/?gpa=9.5`), false);
assert.equal(allowTelemetry(`${site}/`, `${site}/guides`), false);
assert.equal(allowTelemetry(`${site}/guides?gpa=9.5`, `${site}/guides`), false);
assert.equal(allowTelemetry(`${site}/guides`, `${site}/guides?q=medicin`), false);
assert.equal(allowTelemetry(`${site}/guides`, `${site}/guides`), true);
assert.equal(allowTelemetry("not a url", "not a url"), false);
console.log("Telemetry privacy: decision-support events fail closed");
