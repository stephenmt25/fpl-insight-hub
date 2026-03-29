export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: March 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Data We Collect</h2>
        <p>
          FPL Insight Hub uses your Fantasy Premier League ID to fetch publicly available data
          from the official FPL API. We store your FPL ID locally in your browser for session
          persistence. No personal data is sent to or stored on our servers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Third-Party Services</h2>
        <p>
          This application uses Supabase for database hosting and serverless functions.
          All FPL data is sourced from the official Fantasy Premier League API provided by
          the Premier League.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Local Storage</h2>
        <p>
          We use browser local storage to persist your FPL ID and manager data between sessions.
          You can clear this data at any time by signing out or clearing your browser storage.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Analytics</h2>
        <p>
          ML-powered predictions (price changes, form trends, differential picks) are computed
          using aggregated, anonymized player statistics. No individual user data is used
          in these models.
        </p>
      </section>
    </div>
  );
}
