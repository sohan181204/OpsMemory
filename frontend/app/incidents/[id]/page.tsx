import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getIncidentDetails,
  type IncidentDetails,
  type Incident,
} from "@/lib/api";

import IncidentActions from "@/components/IncidentActions";

export const dynamic = "force-dynamic";

function severityClass(severity: Incident["severity"]) {
  switch (severity) {
    case "SEV-1":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    case "SEV-2":
      return "border-orange-500/30 bg-orange-500/10 text-orange-300";

    case "SEV-3":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

    default:
      return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }
}

function statusClass(status: Incident["status"]) {
  switch (status) {
    case "RESOLVED":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

    case "INVESTIGATING":
      return "border-yellow-500/30 bg-yellow-500/10 text-yellow-300";

    default:
      return "border-red-500/30 bg-red-500/10 text-red-300";
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function cleanAiText(value: string) {
  return value
    .replace(/\*\*/g, "")
    .replace(/^#+\s*/gm, "")
    .trim();
}

function recommendationItems(value: string) {
  const cleaned = cleanAiText(value);

  const items = cleaned
    .split(/\r?\n(?=\s*\d+\.\s+)/)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 1 ? items : [cleaned];
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-black/20 p-6">
      <p className="font-medium text-slate-300">{title}</p>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default async function IncidentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let data: IncidentDetails;

  try {
    data = await getIncidentDetails(id);
  } catch {
    notFound();
  }

  const {
    incident,
    analysis,
    postmortem,
    memories: rawMemories,
    resolution,
  } = data;

  /*
   * Defensive frontend deduplication.
   *
   * The backend already keeps one memory per historical source incident.
   * This additional layer prevents duplicate text from appearing in the UI
   * if the API ever returns repeated memories.
   *
   * When duplicates exist, keep the version with the highest relevance score.
   */
  const memoryMap = new Map<
    string,
    (typeof rawMemories)[number]
  >();

  for (const memory of rawMemories) {
    const key = memory.text
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();

    const existing = memoryMap.get(key);

    if (
      !existing ||
      (memory.score ?? Number.NEGATIVE_INFINITY) >
        (existing.score ?? Number.NEGATIVE_INFINITY)
    ) {
      memoryMap.set(key, memory);
    }
  }

  const memories = Array.from(memoryMap.values()).slice(0, 5);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-400 transition hover:text-white"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${severityClass(
                    incident.severity,
                  )}`}
                >
                  {incident.severity}
                </span>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass(
                    incident.status,
                  )}`}
                >
                  {incident.status}
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Hindsight Connected
                </span>
              </div>

              <h1 className="max-w-4xl text-3xl font-bold tracking-tight text-white md:text-4xl">
                {incident.title}
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                {incident.description}
              </p>
            </div>
          </div>
        </div>

        {/* Incident metadata */}
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Service
            </p>

            <p className="mt-2 font-semibold text-white">
              {incident.service}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Environment
            </p>

            <p className="mt-2 font-semibold text-white">
              {incident.environment}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Deployment
            </p>

            <p className="mt-2 font-semibold text-white">
              {incident.deployment_version || "Not specified"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-500">
              Created
            </p>

            <p className="mt-2 font-semibold text-white">
              {formatDate(incident.created_at)}
            </p>
          </div>
        </section>

        {/* Incident actions */}
        <section className="mt-8">
          <IncidentActions
            incidentId={incident.id}
            status={incident.status}
            analysisExists={Boolean(analysis)}
            postmortemExists={Boolean(postmortem)}
          />
        </section>

        {/* AI Analysis */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">
                AI
              </div>

              <h2 className="text-xl font-semibold text-white">
                Incident Analysis
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              Analysis generated using the current incident and recalled
              operational memory.
            </p>
          </div>

          {!analysis ? (
            <EmptyState
              title="No analysis yet"
              description="Run Analyze Incident to let OpsMemory recall related incidents and generate an evidence-aware recommendation."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {/* Summary */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Summary
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {cleanAiText(analysis.summary)}
                </p>
              </div>

              {/* Probable cause */}
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Probable cause
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {cleanAiText(analysis.probable_cause)}
                </p>
              </div>

              {/* Recommended action */}
              <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.03] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Recommended action
                </p>

                <div className="mt-3 space-y-3">
                  {recommendationItems(
                    analysis.recommended_action,
                  ).map((item, index) => {
                    const text = item.replace(/^\d+\.\s+/, "");

                    return (
                      <div
                        key={`${index}-${text}`}
                        className="flex gap-3 rounded-xl border border-white/5 bg-black/20 p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 font-mono text-xs font-semibold text-emerald-300">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <p className="text-sm leading-6 text-slate-300">
                          {text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Hindsight Memories */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.07] via-white/[0.02] to-black/20">
          <div className="border-b border-white/10 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 text-sm font-bold text-violet-300">
                    H
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                      HINDSIGHT MEMORY
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-white">
                      Historical Operational Experience
                    </h2>
                  </div>
                </div>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                  OpsMemory recalled these historical experiences from
                  long-term memory and provided them to the AI as context
                  during incident analysis.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                {memories.length} unique memories recalled
              </div>
            </div>

            {analysis && memories.length > 0 && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-violet-400/15 bg-black/20 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                  🧠
                </div>

                <div>
                  <p className="text-sm font-medium text-violet-200">
                    Memory influenced this analysis
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Historical incident knowledge was available to the
                    reasoning step.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-6">
            {memories.length === 0 ? (
              <EmptyState
                title="No related memory found"
                description="Hindsight did not return a closely related historical experience for this incident."
              />
            ) : (
              <div className="space-y-4">
                {memories.map((memory, index) => (
                  <div
                    key={`${memory.text}-${index}`}
                    className="group rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-violet-400/20 hover:bg-violet-500/[0.03]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-400/20 bg-violet-500/10 text-xs font-bold text-violet-300">
                          {String(index + 1).padStart(2, "0")}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
                            Recalled memory
                          </p>

                          <p className="mt-0.5 text-xs text-slate-600">
                            Historical operational experience
                          </p>
                        </div>
                      </div>

                      {memory.score != null && (
                        <div className="min-w-[150px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] uppercase tracking-wider text-slate-600">
                              Recall relevance
                            </span>

                            <span className="font-mono text-xs text-violet-300">
                              {memory.score.toFixed(3)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.025] p-4">
                      <p className="text-sm leading-7 text-slate-300">
                        {memory.text}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-violet-400/15 bg-violet-500/[0.07] px-2.5 py-1 text-[11px] font-medium text-violet-300">
                        Long-term memory
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-slate-500">
                        Used as historical evidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Resolution */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-white">
              Resolution
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Human-confirmed outcome of the incident.
            </p>
          </div>

          {resolution ? (
            <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
              <p className="text-sm leading-6 text-slate-300">
                {resolution}
              </p>
            </div>
          ) : (
            <EmptyState
              title="Incident not resolved"
              description="Once the incident is resolved, its confirmed outcome can be used to create a postmortem."
            />
          )}
        </section>

        {/* Postmortem */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                LEARN
              </div>

              <h2 className="text-xl font-semibold text-white">
                Postmortem
              </h2>
            </div>

            <p className="mt-2 text-sm text-slate-500">
              The confirmed lesson becomes long-term operational memory.
            </p>
          </div>

          {!postmortem ? (
            <EmptyState
              title="No postmortem yet"
              description="Resolve the incident first, then use Save & Learn to retain what the team learned."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Probable cause
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {cleanAiText(postmortem.probable_cause)}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Resolution
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {cleanAiText(postmortem.resolution)}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Lesson
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {cleanAiText(postmortem.lesson)}
                </p>
              </div>
            </div>
          )}

          {postmortem?.memory_retained && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 font-semibold">
                ✓
              </span>

              <div>
                <p className="font-medium text-emerald-200">
                  Memory retained successfully
                </p>

                <p className="mt-0.5 text-xs text-emerald-300/70">
                  This postmortem is now available as long-term Hindsight
                  memory for future incidents.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Memory Loop */}
        <section className="mt-8 mb-12 rounded-2xl border border-white/10 bg-black/20 p-6">
          <h2 className="text-lg font-semibold text-white">
            Memory Loop
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            OpsMemory continuously turns incident experience into reusable
            operational knowledge.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.03] p-4">
              <p className="text-xs text-violet-400">01</p>

              <p className="mt-2 font-semibold text-white">
                Recall
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Find related incidents.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-xs text-slate-500">02</p>

              <p className="mt-2 font-semibold text-white">
                Reason
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Analyze with historical context.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-xs text-slate-500">03</p>

              <p className="mt-2 font-semibold text-white">
                Resolve
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Confirm what actually worked.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] p-4">
              <p className="text-xs text-emerald-400">04</p>

              <p className="mt-2 font-semibold text-white">
                Learn
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Retain the lesson for future incidents.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}