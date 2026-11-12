import { Section } from "@/components/shared/bits";
import { PageHeader } from "@/components/shared/ornaments";

export default function About() {
  return (
    <>
      <PageHeader eyebrow="About, privacy and credits" title="The Fine Print" />
      <div className="mx-auto grid max-w-3xl gap-5 text-sm leading-relaxed text-muted-foreground">
        <Section title="What this is">
          <p>
            FPL Insight Hub is an independent analytics front end for Fantasy Premier League. It reads the same public data feed the official site
            uses and adds squad tracking, league analysis and a few statistical models that run entirely in your browser.
          </p>
        </Section>
        <Section title="Privacy">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Signing in means typing an FPL manager ID. No password, email or FPL login is ever requested.</li>
            <li>The ID is kept in your browser's local storage so the app remembers you. Sign out to remove it.</li>
            <li>Only data that FPL already publishes for every manager is read. Nothing is written back to your FPL account.</li>
            <li>There are no analytics, ads or tracking cookies.</li>
          </ul>
        </Section>
        <Section title="Terms">
          <p>
            Provided as is, for personal use. Forecasts, price predictions and captain rankings are statistical estimates, not advice; transfer
            decisions are yours. The service may be unavailable when the FPL API is updating between gameweeks.
          </p>
        </Section>
        <Section title="Credits">
          <p>
            Data: the public Fantasy Premier League API. This project is not affiliated with or endorsed by the Premier League or Fantasy Premier
            League; team and player names belong to their owners. Built with React, TypeScript, three.js, Recharts, TanStack Query and Tailwind CSS.
          </p>
        </Section>
      </div>
    </>
  );
}
