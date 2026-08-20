"use client";

import { useCallback, useEffect, useState } from "react";

type Monitor = {
  id: string;
  name: string;
  url: string;
  intervalSeconds: number;
  status: "UP" | "DOWN" | "UNKNOWN";
  lastCheckedAt: string | null;
  incidents: {
    id: string;
  }[];
};

export default function MonitorDashboard() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(300);
  const [loading, setLoading] = useState(false);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [runningAll, setRunningAll] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchMonitors = useCallback(async () => {
    try {
      const res = await fetch("/api/monitors", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) {
        setMonitors(data.monitors || []);
      }
    } catch {
      // silent fail for now
    }
  }, []);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  const addMonitor = async (e: React.FormEvent) => {
    e.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          url,
          intervalSeconds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add monitor");
        setLoading(false);
        return;
      }

      setName("");
      setUrl("");
      setIntervalSeconds(300);
      setMessage("Monitor added successfully");
      setLoading(false);
      fetchMonitors();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  const checkMonitor = async (monitorId: string) => {
    setMessage("");
    setError("");
    setCheckingId(monitorId);

    try {
      const res = await fetch("/api/monitors/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ monitorId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to check monitor");
        setCheckingId(null);
        return;
      }

      setMessage(
        data.isUp
          ? "Monitor is UP"
          : "Monitor is DOWN. Incident may have been created."
      );

      setCheckingId(null);
      fetchMonitors();
    } catch {
      setError("Something went wrong");
      setCheckingId(null);
    }
  };
  const runAllChecks = async () => {
  setMessage("");
  setError("");
  setRunningAll(true);

  try {
    const res = await fetch("/api/monitors/run-all", {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to run all checks");
      setRunningAll(false);
      return;
    }

    setMessage(
      `Checked ${data.checked} monitor(s). ${data.down} monitor(s) down.`
    );

    setRunningAll(false);
    fetchMonitors();
  } catch {
    setError("Something went wrong");
    setRunningAll(false);
  }
};

  const statusColor = (status: Monitor["status"]) => {
    if (status === "UP") {
      return "bg-green-900/40 text-green-300 border-green-800";
    }

    if (status === "DOWN") {
      return "bg-red-900/40 text-red-300 border-red-800";
    }

    return "bg-zinc-800 text-zinc-300 border-zinc-700";
  };

  return (
    <section className="space-y-10">
      <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
        <h2 className="text-xl font-semibold mb-4">Add Monitor</h2>

        {message && (
          <div className="bg-green-900/30 border border-green-800 text-green-300 text-sm rounded-lg p-3 mb-4">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg p-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={addMonitor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">
                Monitor Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Website"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white"
                required
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">
                Health URL
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/api/health"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white"
                required
              />
            </div>

            <div>
              <label className="text-sm text-zinc-400 mb-1 block">
                Check Interval Seconds
              </label>
              <input
                type="number"
                min={60}
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-white"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Adding..." : "Add Monitor"}
          </button>
        </form>
      </div>

      <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-semibold">Monitors</h2>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={runAllChecks}
              disabled={runningAll}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              {runningAll ? "Running..." : "Run All Checks"}
            </button>

            <button
              onClick={fetchMonitors}
              className="border border-zinc-700 px-4 py-2 rounded-lg text-sm hover:bg-zinc-800 transition"
            >
              Refresh
            </button>
          </div>
        </div>

        {monitors.length === 0 ? (
          <p className="text-zinc-400 text-sm">
            No monitors added yet. Add your first website monitor above.
          </p>
        ) : (
          <div className="space-y-4">
            {monitors.map((monitor) => (
              <div
                key={monitor.id}
                className="border border-zinc-800 rounded-xl p-5 bg-zinc-950"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">
                        {monitor.name}
                      </h3>

                      <span
                        className={`px-3 py-1 text-xs rounded-full border ${statusColor(
                          monitor.status
                        )}`}
                      >
                        {monitor.status}
                      </span>
                    </div>

                    <p className="text-zinc-400 text-sm mt-1">
                      {monitor.url}
                    </p>

                    <p className="text-zinc-500 text-xs mt-2">
                      Interval: {monitor.intervalSeconds}s
                    </p>

                    <p className="text-zinc-500 text-xs mt-1">
                      Last checked:{" "}
                      {monitor.lastCheckedAt
                        ? new Date(monitor.lastCheckedAt).toLocaleString()
                        : "Never"}
                    </p>

                    {monitor.incidents.length > 0 && (
                      <p className="text-red-400 text-xs mt-2">
                        {monitor.incidents.length} active incident(s)
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => checkMonitor(monitor.id)}
                    disabled={checkingId === monitor.id}
                    className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 disabled:opacity-50 transition"
                  >
                    {checkingId === monitor.id ? "Checking..." : "Check Now"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}