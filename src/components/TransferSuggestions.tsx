import { Card } from "@/components/ui/card";
import { TransferSuggestion } from "@/components/TransferSuggestion";

export function TransferSuggestions() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Recommended Transfers</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TransferSuggestion
          playerName="Marcus Rashford"
          team="Manchester United"
          position="MID"
          price="£8.5m"
          prediction={8.2}
        />
        <TransferSuggestion
          playerName="Ollie Watkins"
          team="Aston Villa"
          position="FWD"
          price="£7.8m"
          prediction={7.5}
        />
        <TransferSuggestion
          playerName="Gabriel Martinelli"
          team="Arsenal"
          position="MID"
          price="£7.9m"
          prediction={7.1}
        />
      </div>
    </div>
  );
}