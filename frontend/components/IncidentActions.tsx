"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  analyzeIncident,
  createPostmortem,
  resolveIncident,
} from "@/lib/api";

type IncidentActionsProps = {
  incidentId: string;
  status: string;
  analysisExists: boolean;
  postmortemExists: boolean;
};

function WorkflowStep({
  number,
  label,
  state,
}: {
  number: string;
  label: string;
  state: "complete" | "current" | "upcoming";
}) {
  const stateClasses = {
    complete:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    current:
      "border-violet-500/20 bg-violet-500/10 text-violet-300",
    upcoming:
      "border-white/10 bg-black/20 text-slate-600",
  };

  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg border font-mono text-[11px] font-semibold ${stateClasses[state]}`}
      >
        {state === "complete" ? "✓" : number}
      </span>

      <span
        className={`text-xs font-medium ${
          state === "upcoming"
            ? "text-slate-600"
            : "text-slate-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function IncidentActions({
  incidentId,
  status,
  analysisExists,
  postmortemExists,
}: IncidentActionsProps) {
  const router = useRouter();

  const [loadingAction, setLoadingAction] = useState<
    string | null
  >(null);

  const [error, setError] = useState("");

  const [resolution, setResolution] = useState("");
  const [showResolve, setShowResolve] = useState(false);

  const [showPostmortem, setShowPostmortem] =
    useState(false);

  const [probableCause, setProbableCause] = useState("");
  const [postmortemResolution, setPostmortemResolution] =
    useState("");
  const [lesson, setLesson] = useState("");

  const isResolved = status === "RESOLVED";
  const hasPostmortem = postmortemExists;

  async function handleAnalyze() {
    try {
      setError("");
      setLoadingAction("analyze");

      await analyzeIncident(incidentId);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze incident.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleResolve(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!resolution.trim()) {
      setError("Resolution is required.");
      return;
    }

    try {
      setLoadingAction("resolve");

      await resolveIncident(
        incidentId,
        resolution.trim(),
      );

      setResolution("");
      setShowResolve(false);

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resolve incident.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function handlePostmortem(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!probableCause.trim()) {
      setError("Probable cause is required.");
      return;
    }

    if (!postmortemResolution.trim()) {
      setError("Resolution is required.");
      return;
    }

    if (!lesson.trim()) {
      setError("Lesson is required.");
      return;
    }

    try {
      setLoadingAction("postmortem");

      await createPostmortem(
        incidentId,
        probableCause.trim(),
        postmortemResolution.trim(),
        lesson.trim(),
      );

      setShowPostmortem(false);
      setProbableCause("");
      setPostmortemResolution("");
      setLesson("");

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create postmortem.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  const workflowState = {
    recall: analysisExists
      ? ("complete" as const)
      : ("current" as const),

    reason: analysisExists
      ? ("complete" as const)
      : ("upcoming" as const),

    resolve: isResolved
      ? ("complete" as const)
      : ("current" as const),

    learn: hasPostmortem
      ? ("complete" as const)
      : ("upcoming" as const),
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-7">
      {/* Header */}
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10 text-sm font-bold text-violet-300">
              ⚡
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Incident controls
              </p>

              <h2 className="mt-1 text-xl font-semibold text-white">
                Manage incident lifecycle
              </h2>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Use historical memory to investigate, confirm the
            operational outcome, then teach OpsMemory what was
            learned.
          </p>
        </div>

        {/* Completed state */}
        {hasPostmortem && (
          <div className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/10 text-[10px]">
              ✓
            </span>
            Memory retained
          </div>
        )}
      </div>

      {/* Workflow */}
      <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <WorkflowStep
            number="01"
            label="Recall"
            state={workflowState.recall}
          />

          <span className="text-slate-700">→</span>

          <WorkflowStep
            number="02"
            label="Reason"
            state={workflowState.reason}
          />

          <span className="text-slate-700">→</span>

          <WorkflowStep
            number="03"
            label="Resolve"
            state={workflowState.resolve}
          />

          <span className="text-slate-700">→</span>

          <WorkflowStep
            number="04"
            label="Learn"
            state={workflowState.learn}
          />
        </div>
      </div>

      {/* Primary actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={loadingAction !== null}
          className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "analyze" ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              Analyzing...
            </>
          ) : analysisExists ? (
            "Re-analyze"
          ) : (
            "Analyze Incident"
          )}
        </button>

        {!isResolved && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowPostmortem(false);
              setShowResolve((value) => !value);
            }}
            disabled={loadingAction !== null}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showResolve
              ? "Close resolution"
              : "Resolve Incident"}
          </button>
        )}

        {isResolved && !hasPostmortem && (
          <button
            type="button"
            onClick={() => {
              setError("");
              setShowResolve(false);
              setShowPostmortem((value) => !value);
            }}
            disabled={loadingAction !== null}
            className="inline-flex items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {showPostmortem
              ? "Close learning"
              : "Save & Learn"}
          </button>
        )}

        {hasPostmortem && (
          <div className="inline-flex items-center rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-2.5 text-sm font-medium text-emerald-300">
            ✓ Incident learned
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.08] px-5 py-4"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-300">
              !
            </div>

            <div>
              <p className="text-sm font-medium text-red-200">
                Action failed
              </p>

              <p className="mt-1 text-sm leading-6 text-red-300/80">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Resolve form */}
      {showResolve && !isResolved && (
        <form
          onSubmit={handleResolve}
          className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              03 · Resolve
            </p>

            <h3 className="mt-2 text-lg font-semibold text-white">
              Confirm resolution
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Record what the team actually did to restore the
              service. This becomes part of the confirmed incident
              outcome.
            </p>
          </div>

          <div className="mt-5">
            <label
              htmlFor="resolution"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Resolution
            </label>

            <textarea
              id="resolution"
              value={resolution}
              onChange={(event) =>
                setResolution(event.target.value)
              }
              rows={5}
              placeholder="Example: Rolled back payment-api to the previous stable version after confirming the 5xx spike was associated with the latest deployment."
              className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40 focus:bg-black/40 focus:ring-2 focus:ring-violet-500/10"
            />
          </div>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setError("");
                setShowResolve(false);
              }}
              disabled={loadingAction !== null}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loadingAction !== null}
              className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loadingAction === "resolve" ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                  Resolving...
                </>
              ) : (
                "Confirm Resolution"
              )}
            </button>
          </div>
        </form>
      )}

      {/* Postmortem form */}
      {showPostmortem &&
        isResolved &&
        !hasPostmortem && (
          <form
            onSubmit={handlePostmortem}
            className="mt-6 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-5"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-400">
                04 · Learn
              </p>

              <h3 className="mt-2 text-lg font-semibold text-white">
                Teach OpsMemory
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Capture the confirmed cause, resolution, and lesson.
                This postmortem becomes long-term Hindsight memory
                for future incidents.
              </p>
            </div>

            <div className="mt-6 space-y-5">

              {/* Probable cause */}
              <div>
                <label
                  htmlFor="probable-cause"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Probable cause
                </label>

                <textarea
                  id="probable-cause"
                  value={probableCause}
                  onChange={(event) =>
                    setProbableCause(event.target.value)
                  }
                  rows={4}
                  placeholder="What most likely caused the incident?"
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/30 focus:bg-black/40 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              {/* Resolution */}
              <div>
                <label
                  htmlFor="postmortem-resolution"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Confirmed resolution
                </label>

                <textarea
                  id="postmortem-resolution"
                  value={postmortemResolution}
                  onChange={(event) =>
                    setPostmortemResolution(
                      event.target.value,
                    )
                  }
                  rows={4}
                  placeholder="What actually fixed the incident?"
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/30 focus:bg-black/40 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>

              {/* Lesson */}
              <div>
                <label
                  htmlFor="lesson"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Operational lesson
                </label>

                <textarea
                  id="lesson"
                  value={lesson}
                  onChange={(event) =>
                    setLesson(event.target.value)
                  }
                  rows={4}
                  placeholder="What should OpsMemory remember for the next similar incident?"
                  className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/30 focus:bg-black/40 focus:ring-2 focus:ring-emerald-500/10"
                />
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.025] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
                  H
                </div>

                <div>
                  <p className="text-sm font-medium text-emerald-200">
                    Hindsight retention
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Saving this postmortem stores the confirmed
                    operational learning in Hindsight for future
                    incident analysis.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setShowPostmortem(false);
                }}
                disabled={loadingAction !== null}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loadingAction !== null}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingAction === "postmortem" ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
                    Saving memory...
                  </>
                ) : (
                  "Save & Learn"
                )}
              </button>
            </div>
          </form>
        )}
    </section>
  );
}