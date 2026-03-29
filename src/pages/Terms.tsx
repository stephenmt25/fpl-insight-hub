export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: March 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Disclaimer</h2>
        <p>
          FPL Insight Hub is an unofficial tool and is not affiliated with, endorsed by,
          or connected to the Premier League, Fantasy Premier League, or any associated entities.
          All FPL data is owned by the Premier League.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Use of Service</h2>
        <p>
          This application is provided as-is for informational and entertainment purposes.
          ML predictions and analytics are not financial advice and should not be solely
          relied upon for FPL decisions.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Data Accuracy</h2>
        <p>
          While we strive to provide accurate and up-to-date information, we make no guarantees
          regarding the accuracy, completeness, or timeliness of the data displayed. FPL data
          is fetched from the official API and may be subject to delays.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Availability</h2>
        <p>
          We do not guarantee uninterrupted access to the service. The application depends
          on the availability of the FPL API and Supabase infrastructure.
        </p>
      </section>
    </div>
  );
}
