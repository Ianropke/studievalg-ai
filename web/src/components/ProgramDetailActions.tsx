"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  getBrowserStorageAdapter,
  readSavedPrograms,
  removeProgram,
  saveProgram,
} from "@/lib/savedPrograms";

interface ProgramDetailActionsProps {
  kotNr: string;
  slug: string;
  title: string;
  isArchived?: boolean;
}

export function ProgramDetailActions({
  kotNr,
  slug,
  title,
  isArchived = false,
}: ProgramDetailActionsProps) {
  const [saved, setSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const syncSaved = () => {
      const result = readSavedPrograms(getBrowserStorageAdapter());
      if (result.ok) {
        setSaved(result.kotIds.includes(kotNr));
      }
    };
    const frame = requestAnimationFrame(syncSaved);
    window.addEventListener("storage", syncSaved);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("storage", syncSaved);
    };
  }, [kotNr]);

  const handleToggleSaved = () => {
    const storage = getBrowserStorageAdapter();
    const result = saved ? removeProgram(storage, kotNr) : saveProgram(storage, kotNr);
    if (result.ok) {
      const nextSaved = result.kotIds.includes(kotNr);
      setSaved(nextSaved);
      setStatusMessage(nextSaved ? "Gemt i Min liste på denne enhed." : "Fjernet fra Min liste.");
    } else {
      setStatusMessage(
        result.reason === "limit_reached"
          ? "Min liste kan højst indeholde 100 uddannelser."
          : "Kunne ikke gemme ændringen på denne enhed. Kontrollér browserens lagringsindstillinger.",
      );
    }
  };

  const compareParams = new URLSearchParams({ a: slug });

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {!isArchived && (
          <button
            type="button"
            onClick={handleToggleSaved}
            aria-pressed={saved}
            aria-label={`${saved ? "Fjern" : "Gem"} ${title}, KOT ${kotNr} ${saved ? "fra" : "i"} Min liste`}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 ${
              saved
                ? "border-[#2563EB]/30 bg-[#EFF6FF] text-[#1D4ED8]"
                : "border-[#D8DBE4] bg-white text-[#12172B] hover:border-[#12172B]"
            }`}
          >
            <span>{saved ? "★ Gemt i Min liste" : "☆ Gem i Min liste"}</span>
          </button>
        )}
        <Link
          href={`/sammenlign#valg?${compareParams.toString()}`}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D8DBE4] bg-white px-4 py-2 text-xs font-bold text-[#12172B] transition hover:border-[#12172B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
        >
          <span>Sammenlign denne uddannelse →</span>
        </Link>
      </div>
      {statusMessage && (
        <p role="status" className="text-xs text-[#1D4ED8]">
          {statusMessage}
        </p>
      )}
    </div>
  );
}
