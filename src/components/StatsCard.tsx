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
        <CardTitle className="text-sm font-medium"></CardTitle>
      </CardHeader>
      <CardContent className="flex justify-between pb-1">
        <div className="text-2xl ">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
      <CardFooter  className={style ? style : "text-sm font-medium justify-end" }>
        {description && description} {style && <p className="text-black text-sm font-medium">from prev</p>}
      </CardFooter>
    </Card>
  );
}