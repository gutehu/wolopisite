"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { TrendingUp, Activity, Zap, User, RotateCcw } from "lucide-react";
import type { ViewState } from "@/lib/svf-dashboard";
import {
  getAthleteDisplayName,
  velocityResultsToChartData,
  COLOR_VELOCITY,
  COLOR_AMPLITUDE,
  COLOR_POWER,
} from "@/lib/svf-dashboard";

const chartClass = "h-[320px] w-full";

type Props = {
  view: ViewState;
  selectedVelocityIndex: Record<string, number>;
  setSelectedVelocityIndex: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  showHeader?: boolean;
  onReset?: () => void;
};

export function SvfDashboardView({ view, selectedVelocityIndex, setSelectedVelocityIndex, showHeader = true, onReset }: Props) {
  return (
    <div className="space-y-10">
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card/80 px-4 py-3">
          <span className="text-sm text-muted-foreground">{view.fileName}</span>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <RotateCcw size={16} /> Nouveau fichier
            </button>
          )}
        </div>
      )}

      {view.mode === "dashboards_by_athlete" && (
        <>
          <section className="rounded-2xl border border-border bg-card/80 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
              <User size={20} />
              Athlètes
            </h2>
            <ul className="flex flex-wrap gap-3">
              {Object.entries(view.data).map(([aid, a]) => (
                <li key={aid} className="rounded-lg border border-border bg-background/60 px-4 py-2 text-sm font-medium text-foreground">
                  {getAthleteDisplayName(aid, a, view.athletes)}
                </li>
              ))}
            </ul>
          </section>

          {Object.entries(view.data).map(([athleteId, athlete]) => {
            const velSessions = athlete.velocity ?? [];
            const selectedIdx = selectedVelocityIndex[athleteId] ?? 0;
            const selectedSession = velSessions[selectedIdx];
            const chartData = selectedSession ? velocityResultsToChartData(selectedSession.results) : [];
            const athleteName = getAthleteDisplayName(athleteId, athlete, view.athletes);

            return (
              <div key={athleteId} className="space-y-8 rounded-2xl border border-border bg-card/80 p-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  <User size={22} />
                  {athleteName}
                </h2>

                {velSessions.length > 0 && (
                  <section>
                    <div className="mb-4 flex items-center gap-2" style={{ color: COLOR_VELOCITY }}>
                      <TrendingUp size={20} />
                      <h3 className="text-lg font-semibold">Vélocité</h3>
                    </div>
                    <label className="mb-4 block text-sm text-muted-foreground">Session (displayName)</label>
                    <select
                      value={selectedIdx}
                      onChange={(e) => setSelectedVelocityIndex((prev) => ({ ...prev, [athleteId]: Number(e.target.value) }))}
                      className="mb-6 w-full max-w-md rounded-lg border border-border bg-background px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {velSessions.map((s, i) => (
                        <option key={i} value={i}>
                          {s.displayName}
                        </option>
                      ))}
                    </select>
                    {chartData.length > 0 && (
                      <div className="grid gap-8 md:grid-cols-1">
                        <div>
                          <p className="mb-2 text-sm font-medium" style={{ color: COLOR_VELOCITY }}>
                            Vitesse moyenne (m/s)
                          </p>
                          <div className={chartClass}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="rep" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" unit=" m/s" />
                                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(value: number) => [`${Number(value).toFixed(2)} m/s`, "Vitesse moyenne"]} />
                                <Legend />
                                <Line type="monotone" dataKey="meanVelocityMs" name="Vitesse moyenne (m/s)" stroke={COLOR_VELOCITY} strokeWidth={2} dot={{ fill: COLOR_VELOCITY, r: 4 }} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-medium" style={{ color: COLOR_AMPLITUDE }}>
                            Amplitude (cm)
                          </p>
                          <div className={chartClass}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="rep" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" unit=" cm" />
                                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(value: number) => [`${Number(value).toFixed(1)} cm`, "Amplitude"]} />
                                <Legend />
                                <Bar dataKey="amplitudeCm" name="Amplitude (cm)" fill={COLOR_AMPLITUDE} radius={[4, 4, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div>
                          <p className="mb-2 text-sm font-medium" style={{ color: COLOR_POWER }}>
                            Puissance (W)
                          </p>
                          <div className={chartClass}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="rep" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" unit=" W" />
                                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(value: number) => [`${Number(value).toFixed(0)} W`, "Puissance"]} />
                                <Legend />
                                <Line type="monotone" dataKey="peakPowerW" name="Puissance (W)" stroke={COLOR_POWER} strokeWidth={2} dot={{ fill: COLOR_POWER, r: 4 }} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {(athlete.mobility?.length ?? 0) > 0 && (
                  <section>
                    <div className="mb-4 flex items-center gap-2 text-teal-500">
                      <Activity size={20} />
                      <h3 className="text-lg font-semibold">Mobilité</h3>
                    </div>
                    <ul className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                      {(athlete.mobility ?? []).map((s, i) => {
                        const res = (s as { results?: Record<string, unknown>[] | Record<string, unknown> }).results;
                        const first = Array.isArray(res) ? res[0] : res && typeof res === "object" ? res : null;
                        const achievedMaxAngle = first && typeof (first as Record<string, unknown>).achievedMaxAngle === "number" ? (first as Record<string, unknown>).achievedMaxAngle : null;
                        const posturalScore = first && typeof (first as Record<string, unknown>).posturalScore === "number" ? (first as Record<string, unknown>).posturalScore : null;
                        const timeInZoneSeconds = first && typeof (first as Record<string, unknown>).timeInZoneSeconds === "number" ? (first as Record<string, unknown>).timeInZoneSeconds : null;
                        return (
                          <li key={i} className="rounded border border-border/60 bg-card/40 p-3 text-sm">
                            <div className="font-medium text-foreground">{s.displayName}</div>
                            {(achievedMaxAngle != null || posturalScore != null || timeInZoneSeconds != null) && (
                              <div className="mt-1 flex flex-wrap gap-4 text-muted-foreground">
                                {achievedMaxAngle != null && <span>achievedMaxAngle: {String(achievedMaxAngle)}</span>}
                                {posturalScore != null && <span>posturalScore: {String(posturalScore)}</span>}
                                {timeInZoneSeconds != null && <span>timeInZoneSeconds: {String(timeInZoneSeconds)}</span>}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {athlete.mobility && athlete.mobility.length > 1 && (() => {
                      const sorted = [...athlete.mobility].reverse();
                      const evolutionData = sorted.map((s, i) => {
                        const res = (s as { results?: Record<string, unknown>[] | Record<string, unknown> }).results;
                        const first = Array.isArray(res) ? res[0] : res && typeof res === "object" ? res : null;
                        const val =
                          first && typeof (first as Record<string, unknown>).achievedMaxAngle === "number"
                            ? (first as Record<string, unknown>).achievedMaxAngle
                            : first && typeof (first as Record<string, unknown>).posturalScore === "number"
                              ? (first as Record<string, unknown>).posturalScore
                              : null;
                        return { session: s.displayName, index: i + 1, value: typeof val === "number" ? val : 0 };
                      });
                      if (evolutionData.every((d) => d.value === 0)) return null;
                      return (
                        <div className="mt-4">
                          <p className="mb-2 text-sm text-muted-foreground">Évolution (sessions par date croissante)</p>
                          <div className={chartClass}>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={evolutionData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                                <XAxis dataKey="index" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} stroke="var(--border)" />
                                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                                <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(value: number, _name: string, props: { payload?: { session?: string } }) => [value, (props.payload as { session?: string })?.session ?? "Valeur"]} />
                                <Line type="monotone" dataKey="value" name="Mobilité" stroke={COLOR_AMPLITUDE} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })()}
                  </section>
                )}

                {(athlete.jump?.length ?? 0) > 0 && (
                  <section>
                    <div className="mb-4 flex items-center gap-2 text-teal-500">
                      <Zap size={20} />
                      <h3 className="text-lg font-semibold">Sauts</h3>
                    </div>
                    <ul className="space-y-3 rounded-lg border border-border bg-background/50 p-4">
                      {(athlete.jump ?? []).map((s, i) => {
                        const res = (s as { results?: Record<string, unknown>[] | Record<string, unknown> }).results;
                        const first = Array.isArray(res) ? res[0] : res && typeof res === "object" ? res : null;
                        const flightTimeSec = first && typeof (first as Record<string, unknown>).flightTimeSec === "number" ? (first as Record<string, unknown>).flightTimeSec : null;
                        const typeVal = first && (first as Record<string, unknown>).type != null ? (first as Record<string, unknown>).type : null;
                        return (
                          <li key={i} className="rounded border border-border/60 bg-card/40 p-3 text-sm">
                            <div className="font-medium text-foreground">{s.displayName}</div>
                            {(flightTimeSec != null || typeVal != null) && (
                              <div className="mt-1 flex flex-wrap gap-4 text-muted-foreground">
                                {flightTimeSec != null && <span>flightTimeSec: {String(flightTimeSec)}</span>}
                                {typeVal != null && <span>type: {String(typeVal)}</span>}
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                )}
              </div>
            );
          })}
        </>
      )}

      {view.mode === "legacy" && (
        <>
          <section className="rounded-2xl border border-border bg-card/80 p-6">
            <div className="mb-4 flex items-center gap-2 text-secondary">
              <TrendingUp size={20} />
              <h2 className="text-lg font-semibold">Vélocité (m/s)</h2>
            </div>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={view.velocityData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="rep" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" unit=" m/s" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(value: number) => [`${Number(value).toFixed(2)} m/s`, "Vélocité"]} />
                  <Legend />
                  <Line type="monotone" dataKey="velocity" name="Vélocité" stroke={COLOR_VELOCITY} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="rounded-2xl border border-border bg-card/80 p-6">
            <div className="mb-4 flex items-center gap-2 text-secondary">
              <Activity size={20} />
              <h2 className="text-lg font-semibold">Amplitude (cm)</h2>
            </div>
            <div className={chartClass}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.amplitudeData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="rep" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} stroke="var(--border)" unit=" cm" />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px" }} formatter={(value: number) => [`${Number(value).toFixed(1)} cm`, "Amplitude"]} />
                  <Legend />
                  <Bar dataKey="amplitude" name="Amplitude" fill={COLOR_AMPLITUDE} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
