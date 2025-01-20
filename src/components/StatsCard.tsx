import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  style?: string
}

export function StatsCard({ title, value, description, style }: StatsCardProps) {
  // const style = "text-red-500"
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-1">
        <div className="text-2xl font-bold">{value}</div>

      </CardContent>
      <CardFooter  className={style ? style : "text-sm font-medium" }>
        {description && description} {style && <p className="text-black text-sm font-medium">from prev</p>}
      </CardFooter>
    </Card>
  );
}