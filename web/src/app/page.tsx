export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-bold">
            🛠️ OpsPilot
          </div>

          <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-zinc-200 transition">
            Get Started
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Know when your website goes down.
          <span className="text-purple-400"> Fix it faster with AI.</span>
        </h1>

        <p className="text-zinc-400 text-lg mb-10">
          OpsPilot monitors your websites, detects downtime automatically,
          creates incidents, and helps your team fix issues faster with AI assistance.
        </p>

        <div className="flex items-center justify-center gap-4">
          <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition">
            Start Monitoring Free
          </button>

          <button className="border border-zinc-700 px-6 py-3 rounded-lg font-semibold hover:bg-zinc-900 transition">
            View Demo
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-2">Uptime Monitoring</h2>
          <p className="text-zinc-400 text-sm">
            Check your website health every few minutes and get alerted instantly.
          </p>
        </div>

        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-2">AI Incident Assistant</h2>
          <p className="text-zinc-400 text-sm">
            Get possible root causes and recommended fixes using AI.
          </p>
        </div>

        <div className="border border-zinc-800 rounded-xl p-6 bg-zinc-900/50">
          <h2 className="text-lg font-semibold mb-2">Team Incident Management</h2>
          <p className="text-zinc-400 text-sm">
            Track incidents, assign owners, and generate postmortems.
          </p>
        </div>
      </section>
    </main>
  );
}