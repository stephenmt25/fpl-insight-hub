import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Credits() {
  const credits = [
    {
      name: "Fantasy Premier League API",
      description: "All FPL data is sourced from the official Fantasy Premier League API.",
    },
    {
      name: "Supabase",
      description: "Backend-as-a-Service providing database, edge functions, and authentication.",
    },
    {
      name: "React & Vite",
      description: "Frontend framework and build tooling powering the application.",
    },
    {
      name: "shadcn/ui & Radix",
      description: "Accessible UI component library used throughout the interface.",
    },
    {
      name: "Recharts",
      description: "Data visualization library for all charts and graphs.",
    },
    {
      name: "TailwindCSS",
      description: "Utility-first CSS framework for styling.",
    },
    {
      name: "Lucide Icons",
      description: "Icon library used across the application.",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8">
      <h1 className="text-3xl font-bold">API Credits & Acknowledgements</h1>
      <p className="text-muted-foreground">
        FPL Insight Hub is built with the following technologies and data sources.
      </p>
      <div className="grid gap-4">
        {credits.map((credit) => (
          <Card key={credit.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{credit.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{credit.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
