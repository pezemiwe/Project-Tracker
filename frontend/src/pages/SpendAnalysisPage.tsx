import {
  useSpendAnalysis,
} from "../hooks/useDashboard";
import { SectionHeader } from "../components/dashboard/SectionHeader";
import { LoadingState } from "../components/ui/loading-state";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#1a365d", "#059669", "#d97706", "#2563eb", "#7c3aed", "#db2777"];

export function SpendAnalysisPage() {
  const { data: analysis, isLoading, isError } = useSpendAnalysis();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState message="Analyzing spend data..." />
      </div>
    );
  }

  if (isError || !analysis) {
    return (
      <div className="p-8 text-center text-destructive">
        Failed to load spend analysis.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-8">
          <h1 className="h2 text-foreground">Spend Analysis</h1>
          <p className="text-lead mt-1">
            Detailed breakdown of portfolio expenditure and budgets
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Spend by Region */}
          <div className="space-y-4">
            <SectionHeader
              title="Spend by Geopolitical Zone"
            />
            <div className="bg-card border border-border/40 rounded-lg p-6 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.byRegion}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="estimated" name="Budget" fill="#1a365d" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Spend by Activity Status */}
          <div className="space-y-4">
            <SectionHeader
              title="Budget Allocation by Status"
            />
            <div className="bg-card border border-border/40 rounded-lg p-6 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analysis.byStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                  />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                  <Tooltip
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="estimated" name="Budget" fill="#1a365d" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="actual" name="Actual" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Spend by Category */}
          <div className="xl:col-span-1 space-y-4">
            <SectionHeader
              title="Actual Spend by Category"
            />
            <div className="bg-card border border-border/40 rounded-lg p-6 h-[400px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analysis.byCategory}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {analysis.byCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Summary Table */}
          <div className="xl:col-span-2 space-y-4">
            <SectionHeader
              title="Regional Financial Summary"
            />
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border/40">
                  <tr>
                    <th className="px-6 py-4">Region</th>
                    <th className="px-6 py-4 text-right">Budget</th>
                    <th className="px-6 py-4 text-right">Actual</th>
                    <th className="px-6 py-4 text-right">Variance</th>
                    <th className="px-6 py-4 text-right">% Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {analysis.byRegion.map((region) => {
                    const variance = region.actual - region.estimated;
                    const percentSpent = region.estimated > 0 ? (region.actual / region.estimated) * 100 : 0;
                    return (
                      <tr key={region.name} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{region.name}</td>
                        <td className="px-6 py-4 text-right font-mono">{formatCurrency(region.estimated)}</td>
                        <td className="px-6 py-4 text-right font-mono">{formatCurrency(region.actual)}</td>
                        <td className={cn(
                          "px-6 py-4 text-right font-mono font-medium",
                          variance > 0 ? "text-destructive" : "text-emerald-600"
                        )}>
                          {formatCurrency(variance)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {percentSpent.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
