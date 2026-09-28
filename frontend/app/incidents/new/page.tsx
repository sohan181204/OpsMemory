"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  createIncident,
  type Severity,
} from "@/lib/api";

function severityDescription(severity: Severity) {
  switch (severity) {
    case "SEV-1":
      return "Critical impact";
    case "SEV-2":
      return "High impact";
    case "SEV-3":
      return "Medium impact";
    case "SEV-4":
      return "Low impact";
    default:
      return "";
  }
}

export default function NewIncidentPage() {
  const router = useRouter();

  const [service, setService] = useState("");
  const [environment, setEnvironment] = useState("production");
  const [severity, setSeverity] = useState<Severity>("SEV-2");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deploymentVersion, setDeploymentVersion] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!service.trim()) {
      setError("Service name is required.");
      return;
    }

    if (!title.trim()) {
      setError("Incident title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Incident description is required.");
      return;
    }

    try {
      setLoading(true);

      const incident = await createIncident({
        service: service.trim(),
        environment,
        severity,
        title: title.trim(),
        description: description.trim(),
        deployment_version:
          deploymentVersion.trim() || undefined,
      });

      router.push(`/incidents/${incident.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create incident.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">

        {/* Header */}
        <header className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-slate-500 transition hover:text-white"
          >
            ← Back to dashboard
          </Link>

          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  INCIDENT INTAKE
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-300">
                  Hindsight ready
                </span>
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                Create New Incident
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
                Capture the operational context OpsMemory needs to
                recall related experience and assist with investigation.
              </p>
            </div>

            <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.04] p-4 lg:w-72">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
                What happens next
              </p>

              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="font-mono text-xs text-violet-400">
                    01
                  </span>
                  <span>Recall related memory</span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span className="font-mono text-xs text-violet-400">
                    02
                  </span>
                  <span>Analyze with context</span>
                </div>

                <div className="flex items-center gap-3 text-slate-400">
                  <span className="font-mono text-xs text-violet-400">
                    03
                  </span>
                  <span>Resolve and learn</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Incident context */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                01 · Context
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Incident context
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Identify the affected service, runtime environment,
                severity, and deployment associated with the incident.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              {/* Service */}
              <div>
                <label
                  htmlFor="service"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Service
                  <span className="ml-1 text-red-400">*</span>
                </label>

                <input
                  id="service"
                  type="text"
                  value={service}
                  onChange={(event) =>
                    setService(event.target.value)
                  }
                  placeholder="payment-api"
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/10"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Name of the affected application or service.
                </p>
              </div>

              {/* Environment */}
              <div>
                <label
                  htmlFor="environment"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Environment
                </label>

                <select
                  id="environment"
                  value={environment}
                  onChange={(event) =>
                    setEnvironment(event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/40 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/10"
                >
                  <option value="production">
                    production
                  </option>
                  <option value="staging">
                    staging
                  </option>
                  <option value="development">
                    development
                  </option>
                </select>

                <p className="mt-2 text-xs text-slate-600">
                  Where the incident is currently occurring.
                </p>
              </div>

              {/* Severity */}
              <div>
                <label
                  htmlFor="severity"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Severity
                </label>

                <select
                  id="severity"
                  value={severity}
                  onChange={(event) =>
                    setSeverity(event.target.value as Severity)
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/40 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/10"
                >
                  <option value="SEV-1">
                    SEV-1 — Critical
                  </option>

                  <option value="SEV-2">
                    SEV-2 — High
                  </option>

                  <option value="SEV-3">
                    SEV-3 — Medium
                  </option>

                  <option value="SEV-4">
                    SEV-4 — Low
                  </option>
                </select>

                <p className="mt-2 text-xs text-slate-600">
                  {severityDescription(severity)}
                </p>
              </div>

              {/* Deployment */}
              <div>
                <label
                  htmlFor="deployment"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Deployment version
                </label>

                <input
                  id="deployment"
                  type="text"
                  value={deploymentVersion}
                  onChange={(event) =>
                    setDeploymentVersion(event.target.value)
                  }
                  placeholder="v3.5.0"
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/10"
                />

                <p className="mt-2 text-xs text-slate-600">
                  Useful for correlating incidents with releases.
                </p>
              </div>
            </div>
          </section>

          {/* Incident description */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
            <div className="mb-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                02 · Observation
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Incident description
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Describe what operators are observing. Concrete
                symptoms give the reasoning step better context.
              </p>
            </div>

            <div className="space-y-5">

              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Incident title
                  <span className="ml-1 text-red-400">*</span>
                </label>

                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Payment API returning HTTP 500 errors"
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              {/* Description */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-slate-300"
                  >
                    Description
                    <span className="ml-1 text-red-400">*</span>
                  </label>

                  <span className="text-xs text-slate-600">
                    {description.length} characters
                  </span>
                </div>

                <textarea
                  id="description"
                  rows={8}
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Example: HTTP 500 rate increased sharply after the latest deployment. Customers are reporting failed payments."
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/10"
                />

                <p className="mt-2 text-xs leading-5 text-slate-600">
                  Include observable symptoms, timing, customer impact,
                  and anything known about the deployment.
                </p>
              </div>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-300">
                  !
                </div>

                <div>
                  <p className="text-sm font-medium text-red-200">
                    Unable to create incident
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-300/80">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-600">
              Required fields are marked with *
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating...
                  </>
                ) : (
                  "Create Incident"
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Bottom workflow */}
        <section className="mt-8 mb-12 rounded-3xl border border-violet-500/15 bg-violet-500/[0.03] p-6 md:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
                OpsMemory workflow
              </p>

              <h2 className="mt-2 text-lg font-semibold text-white">
                Your incident becomes part of a learning loop
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-violet-300">
                Recall
              </span>

              <span className="text-slate-700">
                →
              </span>

              <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-slate-400">
                Reason
              </span>

              <span className="text-slate-700">
                →
              </span>

              <span className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-slate-400">
                Resolve
              </span>

              <span className="text-slate-700">
                →
              </span>

              <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300">
                Learn
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}