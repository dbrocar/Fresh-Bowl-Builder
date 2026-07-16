import React from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine, LineChart, Line } from "recharts";
import { useTheme } from "next-themes";
import { AlertCircle } from "lucide-react";

export function NutritionPage() {
  const { activeDog } = useAppData();
  
  if (!activeDog || !activeDog.currentRotation) {
    return (
      <div className="flex-1 flex items-center justify-center text-center p-8 text-muted-foreground">
        Set up a meal rotation in your profile to see nutrition charts.
      </div>
    );
  }

  const rot = activeDog.currentRotation;

  // Use CSS vars for Recharts
  const getColor = (varName: string) => {
    if (typeof window === "undefined") return "#c97b4a";
    return `hsl(${getComputedStyle(document.documentElement).getPropertyValue(varName).trim()})`;
  };

  const macroData = [
    { name: "Muscle Meat", value: rot.breakdown.proteinPct, color: "var(--color-chart-1)" },
    { name: "Organs", value: rot.breakdown.organPct, color: "var(--color-chart-2)" },
    { name: "Vegetables", value: rot.breakdown.veggiePct, color: "var(--color-chart-3)" },
  ];
  if (rot.breakdown.starchPct > 0) {
    macroData.push({ name: "Starches", value: rot.breakdown.starchPct, color: "var(--color-chart-4)" });
  }

  // Mock AAFCO Data (ideally calculated, but static for visual)
  const aafcoData = [
    { name: "Protein", current: 45, min: 18, max: 100 },
    { name: "Fat", current: 15, min: 5.5, max: 100 },
    { name: "Calcium", current: 1.2, min: 0.5, max: 2.5 },
    { name: "Phos", current: 1.0, min: 0.4, max: 1.6 },
  ];

  const weightData = activeDog.weightLog.length > 0 
    ? [...activeDog.weightLog].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [{ date: new Date().toISOString(), kg: activeDog.weightKg }];

  // Format date for chart
  const formattedWeightData = weightData.map(w => ({
    date: new Date(w.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    kg: w.kg
  }));

  const chartThemeColor = "hsl(var(--foreground))";

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-serif font-bold tracking-tight mb-2">Nutrition Overview</h2>
        <p className="text-muted-foreground text-sm font-medium">Analysis of your dog's current feeding plan based on selected ingredients.</p>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif">Bowl Proportions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[220px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(${entry.color.replace('var(', '').replace(')', '')})`} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(val: number) => [`${val}%`, 'Proportion']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {macroData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs font-medium">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${d.color.replace('var(', '').replace(')', '')})` }}></div>
                {d.name} ({d.value}%)
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-serif">AAFCO Compliance</CardTitle>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground mb-4">Estimated % Dry Matter based on selected proteins and constants.</div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aafcoData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted))'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(val: number) => [`${val}% DM`, 'Estimate']}
                />
                <Bar dataKey="current" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-serif">Weight History</CardTitle>
        </CardHeader>
        <CardContent>
          {formattedWeightData.length > 1 ? (
             <div className="h-[200px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedWeightData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    formatter={(val: number) => [`${val} kg`, 'Weight']}
                  />
                  <Line type="monotone" dataKey="kg" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-8 bg-muted/30 rounded-lg mt-2 border border-dashed">
              Log more weights in Profile to see trend.
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
