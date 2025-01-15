import { BarChart } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeagueSelectorProps {
  selectedLeague: string;
  updateSelectedLeague: (value: string) => void;
}

export function LeagueSelector({ selectedLeague, updateSelectedLeague }: LeagueSelectorProps) {
  return (
    <div className="w-full max-w-xs">
      <div className="flex items-center pb-2">
        <BarChart className="h-4 w-4" />
        <label className="text-sm font-medium">League Select</label>
      </div>
      <Select value={selectedLeague} onValueChange={updateSelectedLeague}>
        <SelectTrigger>
          <SelectValue placeholder="Select a league" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Overall">Overall</SelectItem>
          <SelectItem value="Second Chance">Second Chance</SelectItem>
          <SelectItem value="Gameweek 1">Gameweek 1</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}