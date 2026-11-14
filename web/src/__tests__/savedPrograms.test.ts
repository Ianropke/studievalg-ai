import assert from "node:assert/strict";
import {
  MAX_SAVED_PROGRAMS,
  MAX_SAVED_PROGRAMS_SERIALIZED_CHARS,
  SAVED_PROGRAMS_STORAGE_KEY,
  SAVED_PROGRAMS_STORAGE_VERSION,
  getBrowserStorageAdapter,
  normalizeKotId,
  parseSavedPrograms,
  readSavedPrograms,
  removeProgram,
  saveProgram,
  type StorageAdapter,
} from "../lib/savedPrograms";

class MemoryStorage implements StorageAdapter {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

class ThrowingStorage implements StorageAdapter {
  getItem(): string | null {
    throw new Error("blocked");
  }

  setItem(): void {
    throw new Error("blocked");
  }

  removeItem(): void {
    throw new Error("blocked");
  }
}

assert.equal(normalizeKotId("10234"), "10234");
assert.equal(normalizeKotId(10234), "10234");
for (const invalid of ["1023", "102345", "1023a", -10234, 10234.5, null]) {
  assert.equal(normalizeKotId(invalid), null);
}

assert.deepEqual(parseSavedPrograms(null), { ok: true, kotIds: [] });
assert.deepEqual(
  parseSavedPrograms(JSON.stringify({ version: SAVED_PROGRAMS_STORAGE_VERSION, kotIds: ["10234", "10334"] })),
  { ok: true, kotIds: ["10234", "10334"] },
);
assert.deepEqual(parseSavedPrograms("{"), { ok: false, reason: "invalid_json" });
assert.deepEqual(parseSavedPrograms(JSON.stringify({ version: 2, kotIds: [] })), { ok: false, reason: "unsupported_version" });
assert.deepEqual(parseSavedPrograms(JSON.stringify({ version: 1, kotIds: ["10234"], name: "Medicin" })), { ok: false, reason: "invalid_schema" });
assert.deepEqual(parseSavedPrograms(JSON.stringify({ version: 1, kotIds: ["10234", "10234"] })), { ok: false, reason: "invalid_schema" });
assert.deepEqual(parseSavedPrograms("x".repeat(MAX_SAVED_PROGRAMS_SERIALIZED_CHARS + 1)), { ok: false, reason: "oversized_data" });

const storage = new MemoryStorage();
assert.deepEqual(readSavedPrograms(storage), { ok: true, kotIds: [] });
assert.deepEqual(saveProgram(storage, "10234"), { ok: true, kotIds: ["10234"], changed: true });
assert.deepEqual(saveProgram(storage, "10234"), { ok: true, kotIds: ["10234"], changed: false });
assert.deepEqual(saveProgram(storage, "not-kot"), { ok: false, reason: "invalid_kot_id" });
assert.deepEqual(removeProgram(storage, "10234"), { ok: true, kotIds: [], changed: true });
assert.deepEqual(removeProgram(storage, "10234"), { ok: true, kotIds: [], changed: false });

for (let index = 10_000; index < 10_000 + MAX_SAVED_PROGRAMS; index += 1) {
  assert.equal(saveProgram(storage, index).ok, true);
}
assert.deepEqual(saveProgram(storage, 20_000), { ok: false, reason: "limit_reached" });

assert.deepEqual(readSavedPrograms(null), { ok: false, reason: "storage_unavailable" });
assert.deepEqual(readSavedPrograms(new ThrowingStorage()), { ok: false, reason: "storage_read_failed" });
assert.deepEqual(saveProgram(new ThrowingStorage(), "10234"), { ok: false, reason: "storage_read_failed" });

const writeFailingStorage: StorageAdapter = {
  getItem: () => null,
  setItem: () => { throw new Error("quota exceeded"); },
  removeItem: () => undefined,
};
assert.deepEqual(saveProgram(writeFailingStorage, "10234"), { ok: false, reason: "storage_write_failed" });
assert.equal(getBrowserStorageAdapter(), null);
assert.equal(storage.getItem(SAVED_PROGRAMS_STORAGE_KEY)?.includes("10000"), true);

console.log("Saved programs: versioned KOT-only persistence and explicit failures verified");
