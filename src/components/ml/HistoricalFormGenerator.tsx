import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function HistoricalFormGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateHistoricalData = async () => {
    setIsGenerating(true);
    try {
      toast.info("Generating historical form data...", {
        description: "This may take a minute to process all players"
      });

      const { data, error } = await supabase.functions.invoke('generate-historical-form');

      if (error) throw error;

      toast.success("Historical data generated!", {
        description: `Generated ${data.recordsGenerated} records for ${data.playersProcessed} players (GW${data.gameweeks})`
      });

    } catch (error) {
      console.error('Error generating historical data:', error);
      toast.error("Failed to generate historical data", {
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Database className="h-4 w-4" />
          Historical Data Generator
        </CardTitle>
        <CardDescription className="text-xs">
          Generate placeholder form data for gameweeks 1-10 to enable trend analysis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={generateHistoricalData}
          disabled={isGenerating}
          size="sm"
          variant="secondary"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Generate Historical Data
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          This will create realistic placeholder data based on current player stats
        </p>
      </CardContent>
    </Card>
  );
}
