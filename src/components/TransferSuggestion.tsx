import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TransferSuggestionProps {
  playerName: string;
  team: string;
  position: string;
  price: string;
  prediction: number;
  imageUrl?: string;
}

export function TransferSuggestion({
  playerName,
  team,
  position,
  price,
  prediction,
  imageUrl,
}: TransferSuggestionProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Transfer Suggestion</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={imageUrl} alt={playerName} />
          <AvatarFallback>{playerName[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-medium leading-none">{playerName}</p>
          <p className="text-sm text-muted-foreground">
            {team} • {position}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{price}</p>
          <p className="text-sm text-muted-foreground">Predicted: {prediction}</p>
        </div>
      </CardContent>
    </Card>
  );
}