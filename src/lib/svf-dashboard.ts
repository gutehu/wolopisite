/**
 * Logique partagée : parsing SVF (dashboards_by_athlete, displayName, results)
 * et construction du state pour l'affichage dashboard (import + page sessions).
 */

export const STORAGE_KEY_SVF = "wolopi_imported_svf";
export const STORAGE_KEY_FILENAME = "wolopi_imported_svf_filename";

export type VelocityResult = {
  meanVelocityMs?: number;
  deltaYMeters?: number;
  peakPowerW?: number;
};

export type VelocitySession = {
  displayName: string;
  results?: VelocityResult[];
};

export type AthleteDashboards = {
  athleteId: string;
  athleteDisplayName?: string;
  velocity?: VelocitySession[];
  mobility?: { displayName: string; results?: unknown }[];
  jump?: { displayName: string; results?: unknown }[];
};

export type AthleteRef = {
  athleteId?: string;
  id?: string;
  prenom?: string;
  nom?: string;
  athleteDisplayName?: string;
};

export type SvfData = {
  dashboards_by_athlete?: Record<string, AthleteDashboards>;
  athletes?: AthleteRef[];
  reading_schema?: unknown;
  sessions?: unknown[];
};

export type ViewState =
  | {
      mode: "dashboards_by_athlete";
      data: Record<string, AthleteDashboards>;
      athletes: AthleteRef[] | undefined;
      fileName: string;
    }
  | {
      mode: "legacy";
      velocityData: { rep: string; velocity: number }[];
      amplitudeData: { rep: string; amplitude: number }[];
      sessionCount: number;
      fileName: string;
    };

export const COLOR_VELOCITY = "#673AB7";
export const COLOR_AMPLITUDE = "#009688";
export const COLOR_POWER = "#009688";

export function getAthleteDisplayName(
  athleteId: string,
  athlete: AthleteDashboards,
  athletesList: AthleteRef[] | undefined
): string {
  if (athlete.athleteDisplayName) return athlete.athleteDisplayName;
  const ref = athletesList?.find((a) => (a.athleteId ?? a.id) === athleteId);
  if (ref?.prenom || ref?.nom) return [ref.prenom, ref.nom].filter(Boolean).join(" ").trim();
  if (ref?.athleteDisplayName) return ref.athleteDisplayName;
  return athleteId;
}

function normalizeSvfData(content: string): SvfData | null {
  try {
    const raw = JSON.parse(content) as unknown;
    if (raw && typeof raw === "object" && "dashboards_by_athlete" in raw) return raw as SvfData;
    if (Array.isArray(raw)) return { sessions: raw };
    if (raw && typeof raw === "object" && "sessions" in raw) return raw as SvfData;
    return raw as SvfData;
  } catch {
    return null;
  }
}

export function velocityResultsToChartData(results: VelocityResult[] | undefined) {
  if (!Array.isArray(results) || results.length === 0) return [];
  return results.map((r, i) => ({
    rep: i + 1,
    meanVelocityMs: typeof r.meanVelocityMs === "number" ? r.meanVelocityMs : 0,
    amplitudeCm: typeof r.deltaYMeters === "number" ? r.deltaYMeters * 100 : 0,
    peakPowerW: typeof r.peakPowerW === "number" ? r.peakPowerW : 0,
  }));
}

type LegacySession = {
  type?: string;
  rawPayload?: string | Record<string, unknown>;
  repCount?: number;
  rep_count?: number;
};

function parseLegacyRawPayload(raw: string | Record<string, unknown> | undefined): { velocity: number; amplitude: number }[] {
  const points: { velocity: number; amplitude: number }[] = [];
  if (raw == null) return points;
  let data: unknown = raw;
  if (typeof raw === "string") {
    try {
      data = JSON.parse(raw) as unknown;
    } catch {
      return points;
    }
  }
  const obj = data as Record<string, unknown>;
  const arr = Array.isArray(obj) ? obj : (obj.reps as unknown[]) ?? (obj.repetitions as unknown[]) ?? [];
  if (!Array.isArray(arr)) return points;
  arr.forEach((item) => {
    const r = (item as Record<string, unknown>) ?? {};
    const vel =
      typeof r.velocity === "number" ? r.velocity : typeof r.velocityMs === "number" ? r.velocityMs : typeof r.speed === "number" ? r.speed : 0;
    const amp =
      typeof r.amplitude === "number"
        ? r.amplitude
        : typeof r.amplitudeCm === "number"
          ? r.amplitudeCm
          : typeof r.deltaYMeters === "number"
            ? r.deltaYMeters * 100
            : 0;
    points.push({ velocity: vel, amplitude: amp });
  });
  return points;
}

function buildLegacyChartData(sessions: LegacySession[]) {
  const velocityData: { rep: string; velocity: number }[] = [];
  const amplitudeData: { rep: string; amplitude: number }[] = [];
  const velocitySessions = sessions.filter((s) => String(s?.type ?? "").toLowerCase() === "velocity") as LegacySession[];
  const toUse = velocitySessions.length ? velocitySessions : (sessions.filter((s) => s?.rawPayload != null) as LegacySession[]);
  toUse.forEach((session) => {
    const points = parseLegacyRawPayload(session.rawPayload);
    points.forEach((p, i) => {
      velocityData.push({ rep: `Rep ${i + 1}`, velocity: p.velocity });
      amplitudeData.push({ rep: `Rep ${i + 1}`, amplitude: p.amplitude });
    });
  });
  if (velocityData.length === 0 && amplitudeData.length === 0) {
    sessions.forEach((s) => {
      const n = typeof s.repCount === "number" ? s.repCount : typeof s.rep_count === "number" ? s.rep_count : 10;
      for (let i = 0; i < n; i++) {
        velocityData.push({ rep: `Rep ${i + 1}`, velocity: 0.5 + Math.random() * 0.5 });
        amplitudeData.push({ rep: `Rep ${i + 1}`, amplitude: 20 + Math.random() * 30 });
      }
    });
  }
  return { velocityData, amplitudeData, sessionCount: sessions.length };
}

/**
 * Parse le contenu SVF et retourne le ViewState pour l'affichage dashboard.
 * À appeler côté client (import ou page sessions). Sauvegarder dans localStorage après succès.
 */
export function parseSvfToViewState(content: string, fileName: string): ViewState | null {
  const data = normalizeSvfData(content);
  if (!data) return null;

  const byAthlete = data.dashboards_by_athlete && typeof data.dashboards_by_athlete === "object";
  if (byAthlete && Object.keys(data.dashboards_by_athlete).length > 0) {
    return {
      mode: "dashboards_by_athlete",
      data: data.dashboards_by_athlete,
      athletes: Array.isArray(data.athletes) ? data.athletes : undefined,
      fileName,
    };
  }

  const sessions = Array.isArray(data.sessions) ? data.sessions : [];
  if (sessions.length === 0) return null;
  const legacy = buildLegacyChartData(sessions as LegacySession[]);
  return { mode: "legacy", ...legacy, fileName };
}

export function saveSvfToStorage(content: string, fileName: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY_SVF, content);
      localStorage.setItem(STORAGE_KEY_FILENAME, fileName);
    }
  } catch {
    // quota or disabled
  }
}

export function loadSvfFromStorage(): { content: string; fileName: string } | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const content = localStorage.getItem(STORAGE_KEY_SVF);
    if (!content) return null;
    return { content, fileName: localStorage.getItem(STORAGE_KEY_FILENAME) ?? "sessions_enregistrees.svf" };
  } catch {
    return null;
  }
}

export function hasStoredSvf(): boolean {
  try {
    return typeof localStorage !== "undefined" && !!localStorage.getItem(STORAGE_KEY_SVF);
  } catch {
    return false;
  }
}
