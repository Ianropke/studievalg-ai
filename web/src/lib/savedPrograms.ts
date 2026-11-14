/**
 * Client-side persistence for "Min liste".
 *
 * The stored payload deliberately contains only versioned KOT identifiers. Do
 * not add names, GPA, searches, scoring, analytics, or other user data here.
 */
export const SAVED_PROGRAMS_STORAGE_KEY = "uddannelsesindsigt.saved-programs";
export const SAVED_PROGRAMS_STORAGE_VERSION = 1;
export const MAX_SAVED_PROGRAMS = 100;
export const MAX_SAVED_PROGRAMS_SERIALIZED_CHARS = 12_000;

const KOT_ID_PATTERN = /^\d{5}$/;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type SavedProgramsFailureReason =
  | "storage_unavailable"
  | "storage_read_failed"
  | "storage_write_failed"
  | "invalid_kot_id"
  | "invalid_json"
  | "invalid_schema"
  | "unsupported_version"
  | "oversized_data"
  | "limit_reached";

export type SavedProgramsFailure = {
  ok: false;
  reason: SavedProgramsFailureReason;
};

export type SavedProgramsReadResult =
  | { ok: true; kotIds: readonly string[] }
  | SavedProgramsFailure;

export type SavedProgramsMutationResult =
  | { ok: true; kotIds: readonly string[]; changed: boolean }
  | SavedProgramsFailure;

type StoredSavedPrograms = {
  version: typeof SAVED_PROGRAMS_STORAGE_VERSION;
  kotIds: string[];
};

function failure(reason: SavedProgramsFailureReason): SavedProgramsFailure {
  return { ok: false, reason };
}

function isStoredSavedPrograms(value: unknown): value is StoredSavedPrograms {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length !== 2 || !keys.includes("version") || !keys.includes("kotIds")) return false;
  if (record.version !== SAVED_PROGRAMS_STORAGE_VERSION || !Array.isArray(record.kotIds)) return false;
  if (record.kotIds.length > MAX_SAVED_PROGRAMS) return false;

  const kotIds = record.kotIds;
  return kotIds.every((kotId) => typeof kotId === "string" && KOT_ID_PATTERN.test(kotId))
    && new Set(kotIds).size === kotIds.length;
}

/** Returns a canonical KOT ID, or null for anything that is not a five-digit KOT ID. */
export function normalizeKotId(value: unknown): string | null {
  if (typeof value === "string" && KOT_ID_PATTERN.test(value)) return value;
  if (typeof value === "number" && Number.isSafeInteger(value) && value >= 10_000 && value <= 99_999) return String(value);
  return null;
}

/** Pure parser for stored payloads, useful in tests and for controlled migration handling. */
export function parseSavedPrograms(rawValue: string | null): SavedProgramsReadResult {
  if (rawValue === null) return { ok: true, kotIds: [] };
  if (rawValue.length > MAX_SAVED_PROGRAMS_SERIALIZED_CHARS) return failure("oversized_data");

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return failure("invalid_json");
  }

  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
    && "version" in parsed && (parsed as Record<string, unknown>).version !== SAVED_PROGRAMS_STORAGE_VERSION) {
    return failure("unsupported_version");
  }
  if (!isStoredSavedPrograms(parsed)) return failure("invalid_schema");

  return { ok: true, kotIds: parsed.kotIds };
}

function serializeSavedPrograms(kotIds: readonly string[]): string {
  return JSON.stringify({ version: SAVED_PROGRAMS_STORAGE_VERSION, kotIds: [...kotIds] } satisfies StoredSavedPrograms);
}

/**
 * Retrieves a browser adapter only when invoked in a browser. This has no
 * module-level window reference, so importing the helper is safe during SSR.
 */
export function getBrowserStorageAdapter(): StorageAdapter | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readSavedPrograms(storage: StorageAdapter | null | undefined): SavedProgramsReadResult {
  if (!storage) return failure("storage_unavailable");
  try {
    return parseSavedPrograms(storage.getItem(SAVED_PROGRAMS_STORAGE_KEY));
  } catch {
    return failure("storage_read_failed");
  }
}

export function saveProgram(storage: StorageAdapter | null | undefined, kotId: unknown): SavedProgramsMutationResult {
  const normalizedKotId = normalizeKotId(kotId);
  if (!normalizedKotId) return failure("invalid_kot_id");

  const current = readSavedPrograms(storage);
  if (!current.ok) return current;
  if (current.kotIds.includes(normalizedKotId)) return { ok: true, kotIds: current.kotIds, changed: false };
  if (current.kotIds.length >= MAX_SAVED_PROGRAMS) return failure("limit_reached");

  const kotIds = [...current.kotIds, normalizedKotId];
  try {
    storage!.setItem(SAVED_PROGRAMS_STORAGE_KEY, serializeSavedPrograms(kotIds));
    return { ok: true, kotIds, changed: true };
  } catch {
    return failure("storage_write_failed");
  }
}

export function removeProgram(storage: StorageAdapter | null | undefined, kotId: unknown): SavedProgramsMutationResult {
  const normalizedKotId = normalizeKotId(kotId);
  if (!normalizedKotId) return failure("invalid_kot_id");

  const current = readSavedPrograms(storage);
  if (!current.ok) return current;
  if (!current.kotIds.includes(normalizedKotId)) return { ok: true, kotIds: current.kotIds, changed: false };

  const kotIds = current.kotIds.filter((savedKotId) => savedKotId !== normalizedKotId);
  try {
    storage!.setItem(SAVED_PROGRAMS_STORAGE_KEY, serializeSavedPrograms(kotIds));
    return { ok: true, kotIds, changed: true };
  } catch {
    return failure("storage_write_failed");
  }
}
