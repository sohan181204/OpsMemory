import Link from "next/link";
import { getIncidents, type Incident } from "@/lib/api";

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
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "INVESTIGATING":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
    default:
      return "border-red-500/20 bg-red-500/10 text-red-300";
  }
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function StatCard({
  label,
  value,
  description,
  className,
  valueClassName,
}: {
  label: string;
  value: number;
  description: string;
  className: string;
  valueClassName: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>

          <p className={`mt-3 text-3xl font-bold ${valueClassName}`}>
            {value}
          </p>
        </div>

        <div className="h-2 w-2 rounded-full bg-current opacity-70" />
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  let incidents: Incident[] = [];
  let error = "";

  try {
    incidents = await getIncidents();
  } catch {
    error = "Unable to connect to the OpsMemory backend.";
  }

  const total = incidents.length;

  const open = incidents.filter(
    (incident) => incident.status === "OPEN",
  ).length;

  const investigating = incidents.filter(
    (incident) => incident.status === "INVESTIGATING",
  ).length;

  const resolved = incidents.filter(
    (incident) => incident.status === "RESOLVED",
  ).length;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* Hero */}
        <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.02] to-violet-500/[0.05] p-6 md:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  OPERATIONAL
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  Hindsight Connected
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                OpsMemory
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Memory-powered incident response for DevOps teams.
              </p>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Recall previous incidents, reason with operational context,
                confirm what worked, and retain the lesson for the next
                incident.
              </p>
            </div>

            <Link
              href="/incidents/new"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500 hover:shadow-blue-500/10"
            >
              + New Incident
            </Link>
          </div>
        </header>

        {/* Stats */}
        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total incidents"
            value={total}
            description="Incidents currently stored in OpsMemory."
            className="border-white/10 bg-white/[0.03]"
            valueClassName="text-white"
          />

          <StatCard
            label="Open"
            value={open}
            description="Incidents awaiting investigation."
            className="border-red-500/15 bg-red-500/[0.04] text-red-400"
            valueClassName="text-red-300"
          />

          <StatCard
            label="Investigating"
            value={investigating}
            description="Incidents actively being analyzed."
            className="border-yellow-500/15 bg-yellow-500/[0.04] text-yellow-400"
            valueClassName="text-yellow-300"
          />

          <StatCard
            label="Resolved"
            value={resolved}
            description="Incidents with confirmed outcomes."
            className="border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-400"
            valueClassName="text-emerald-300"
          />
        </section>

        {/* Recent incidents */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Operational history
              </p>

              <h2 className="mt-2 text-2xl font-semibold text-white">
                Recent incidents
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Previous incident experience available to the agent.
              </p>
            </div>

            <div className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
              {incidents.length} recent incidents
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">
              {error}
            </div>
          ) : incidents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-300">
                H
              </div>

              <p className="mt-4 font-medium text-slate-300">
                No incidents yet
              </p>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first incident to begin building reusable
                operational memory.
              </p>

              <Link
                href="/incidents/new"
                className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Create incident
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <Link
                  key={incident.id}
                  href={`/incidents/${incident.id}`}
                  className="group block rounded-2xl border border-white/10 bg-black/20 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-violet-400/20 hover:bg-violet-500/[0.025]"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

                    {/* Main incident info */}
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${severityClass(
                            incident.severity,
                          )}`}
                        >
                          {incident.severity}
                        </span>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                            incident.status,
                          )}`}
                        >
                          {incident.status}
                        </span>
                      </div>

                      <h3 className="max-w-3xl text-base font-semibold text-white transition group-hover:text-violet-100 md:text-lg">
                        {incident.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        {incident.service}
                        <span className="mx-2 text-slate-700">·</span>
                        {incident.environment}
                      </p>
                    </div>

                    {/* Incident metadata */}
                    <div className="flex flex-col gap-3 xl:min-w-[240px] xl:items-end">
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        {incident.deployment_version ? (
                          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-xs text-slate-300">
                            {incident.deployment_version}
                          </span>
                        ) : (
                          <span className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-500">
                            No deployment version
                          </span>
                        )}

                        <span className="rounded-lg border border-violet-500/15 bg-violet-500/[0.06] px-3 py-1.5 text-xs text-violet-300">
                          Hindsight
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-600 xl:justify-end">
                        <span>{formatDate(incident.created_at)}</span>
                        <span className="text-slate-700">→</span>
                        <span className="text-slate-400 transition group-hover:text-white">
                          View incident
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Memory engine */}
        <section className="mt-6 mb-12 rounded-3xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.06] via-white/[0.02] to-black/20 p-6 md:p-7">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
              How OpsMemory learns
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              Recall → Reason → Resolve → Learn
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Each incident creates an opportunity to turn operational
              experience into reusable context for future incidents.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            {/* Recall */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-violet-400">
                  01
                </span>

                <span className="text-xs text-violet-400">
                  MEMORY
                </span>
              </div>

              <h3 className="mt-4 font-semibold text-white">
                Recall
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Find related incidents and operational experience from
                long-term memory.
              </p>
            </div>

            {/* Reason */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500">
                  02
                </span>

                <span className="text-xs text-slate-600">
                  AI
                </span>
              </div>

              <h3 className="mt-4 font-semibold text-white">
                Reason
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Combine the current incident with recalled context to
                produce an evidence-aware recommendation.
              </p>
            </div>

            {/* Resolve */}
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-500">
                  03
                </span>

                <span className="text-xs text-slate-600">
                  HUMAN
                </span>
              </div>

              <h3 className="mt-4 font-semibold text-white">
                Resolve
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                The team confirms what actually fixed the incident and
                records the outcome.
              </p>
            </div>

            {/* Learn */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-400">
                  04
                </span>

                <span className="text-xs text-emerald-400">
                  HINDSIGHT
                </span>
              </div>

              <h3 className="mt-4 font-semibold text-white">
                Learn
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                The confirmed postmortem becomes long-term memory for
                future incidents.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}