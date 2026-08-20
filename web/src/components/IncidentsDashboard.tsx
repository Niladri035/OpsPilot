"use client";

import { useCallback, useEffect, useState } from "react";

type Incident = {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
  monitor: {
    name: string;
    url: string;
  } | null;
};

type AiAnalysis = {
  id: string;
  rootCause: string;
  reasoning: string;
  recommendation: string;
  model: string | null;
  createdAt: string;
};

type FilterType = "ALL" | "ACTIVE" | "RESOLVED";

export default function IncidentsDashboard() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [aiIncident, setAiIncident] = useState<Incident | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiError, setAiError] = useState("");

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch("/api/incidents", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) {
        setIncidents(data.incidents || []);
      } else {
        setError(data.error || "Failed to load incidents");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const resolveIncident = async (incidentId: string) => {
    setMessage("");
    setError("");
    setResolvingId(incidentId);

    try {
      const res = await fetch("/api/incidents/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ incidentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resolve incident");
        setResolvingId(null);
        return;
      }

      setMessage("Incident resolved successfully");
      setResolvingId(null);
      fetchIncidents();
    } catch {
      setError("Something went wrong");
      setResolvingId(null);
    }
  };

  const investigateIncident = async (incident: Incident) => {
    setAiIncident(incident);
    setAiAnalysis(null);
    setAiError("");
    setAiLoadingId(incident.id);

    try {
      const res = await fetch("/api/incidents/investigate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ incidentId: incident.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAiError(data.error || "Failed to investigate incident");
        setAiLoadingId(null);
        return;
      }

      setAiAnalysis(data.analysis);
      setAiLoadingId(null);
    } catch {
      setAiError("Something went wrong");
      setAiLoadingId(null);
    }
  };

  const closeAiModal = () => {
    setAiIncident(null);
    setAiAnalysis(null);
    setAiError("");
    setAiLoadingId(null);
  };

  const isActive = (status: string) => {
    return status !== "RESOLVED" && status !== "CLOSED";
  };

  const filteredIncidents = incidents.filter((incident) => {
    const active = isActive(incident.status);

    if (filter === "ACTIVE") {
      return active;
    }

    if (filter === "RESOLVED") {
      return !active;
    }

    return true;
  });

  const statusColor = (status: string) => {
    if (status === "RESOLVED" || status === "CLOSED") {
      return "bg-green-900/40 text-green-300 border-green-800";
    }

    if (status === "INVESTIGATING") {
      return "bg-yellow-900/40 text-yellow-300 border-yellow-800";
    }

    if (status === "IDENTIFIED") {
      return "bg-orange-900/40 text-orange-300 border-orange-800";
    }

    if (status === "MONITORING") {
      return "bg-blue-900/40 text-blue-300 border-blue-800";
    }

    return "bg-zinc-800 text-zinc-300 border-zinc-700";
  };

  const severityColor = (severity: string) => {
    if (severity === "SEV_1") {
      return "bg-red-900/50 text-red-300 border-red-800";
    }

    if (severity === "SEV_2") {
      return "bg-orange-900/50 text-orange-300 border-orange-800";
    }

    if (severity === "SEV_3") {
      return "bg-yellow-900/50 text-yellow-300 border-yellow-800";
    }

    return "bg-zinc-800 text-zinc-300 border-zinc-700";
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === "ALL"
                ? "bg-white text-black"
                : "border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            All
          </button>

          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === "ACTIVE"
                ? "bg-white text-black"
                : "border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            Active
          </button>

          <button
            onClick={() => setFilter("RESOLVED")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              filter === "RESOLVED"
                ? "bg-white text-black"
                : "border border-zinc-700 text-zinc-300 hover:bg-zinc-900"
            }`}
          >
            Resolved
          </button>
        </div>

        <button
          onClick={fetchIncidents}
          className="border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:bg-zinc-800 transition"
        >
          Refresh
        </button>
      </div>

      {message && (
        <div className="bg-green-900/30 border border-green-800 text-green-300 text-sm rounded-lg p-3">
          {message}
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-zinc-400 text-sm">Loading incidents...</p>
      ) : filteredIncidents.length === 0 ? (
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <p className="text-zinc-400 text-sm">
            No incidents found for this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold">
                      {incident.title}
                    </h3>

                    <span
                      className={`px-3 py-1 text-xs rounded-full border ${severityColor(
                        incident.severity
                      )}`}
                    >
                      {incident.severity}
                    </span>

                    <span
                      className={`px-3 py-1 text-xs rounded-full border ${statusColor(
                        incident.status
                      )}`}
                    >
                      {incident.status}
                    </span>
                  </div>

                  <p className="text-zinc-400 text-sm mt-2">
                    Created at:{" "}
                    {new Date(incident.createdAt).toLocaleString()}
                  </p>

                  {incident.monitor ? (
                    <p className="text-zinc-500 text-sm mt-1">
                      Monitor: {incident.monitor.name} —{" "}
                      {incident.monitor.url}
                    </p>
                  ) : (
                    <p className="text-zinc-500 text-sm mt-1">
                      Monitor: Unknown
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isActive(incident.status) && (
                    <button
                      onClick={() => resolveIncident(incident.id)}
                      disabled={resolvingId === incident.id}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      {resolvingId === incident.id
                        ? "Resolving..."
                        : "Resolve"}
                    </button>
                  )}

                  <button
                    onClick={() => investigateIncident(incident)}
                    disabled={aiLoadingId === incident.id}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    {aiLoadingId === incident.id
                      ? "Analyzing..."
                      : "AI Investigate"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {aiIncident && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-xl p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-purple-400">
                  🤖 AI Investigation
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  {aiIncident.title}
                </p>
              </div>

              <button
                onClick={closeAiModal}
                className="border border-zinc-700 px-3 py-2 rounded-lg text-sm hover:bg-zinc-800 transition"
              >
                Close
              </button>
            </div>

            {aiError && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">
                {aiError}
              </div>
            )}

            {aiLoadingId === aiIncident.id && (
              <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-950">
                <p className="text-zinc-400 text-sm">
                  AI is analyzing this incident...
                </p>
              </div>
            )}

            {aiAnalysis && (
              <div className="space-y-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase mb-2">
                    Possible Root Cause
                  </h3>
                  <p className="text-white">
                    {aiAnalysis.rootCause}
                  </p>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-zinc-400 uppercase mb-2">
                    Reasoning
                  </h3>
                  <p className="text-white">
                    {aiAnalysis.reasoning}
                  </p>
                </div>

                <div className="bg-purple-900/20 border border-purple-800 rounded-xl p-5">
                  <h3 className="text-sm font-bold text-purple-300 uppercase mb-2">
                    Recommended Fix
                  </h3>
                  <p className="text-white whitespace-pre-line">
                    {aiAnalysis.recommendation}
                  </p>
                </div>

                <p className="text-zinc-500 text-xs">
                  Analysis model: {aiAnalysis.model}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}