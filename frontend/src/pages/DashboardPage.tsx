import { Link } from "@tanstack/react-router";
import { Button } from "../components/ui/button";
import {
  useDashboardKPIs,
  useSpendByYear,
  useVarianceAlerts,
} from "../hooks/useDashboard";
import GanttView from "../components/dashboard/GanttView";
import { ActivityFeed } from "../components/dashboard/ActivityFeed";
import { KPICard, KPICardSkeleton } from "../components/dashboard/KPICard";
import { SectionHeader } from "../components/dashboard/SectionHeader";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Plus,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: spendData, isLoading: spendLoading } = useSpendByYear();
  const { data: alerts, isLoading: alertsLoading } = useVarianceAlerts(5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const varianceIsPositive = (kpis?.variance || 0) > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="h2 text-foreground">Portfolio Dashboard</h1>
            <p className="text-lead mt-1">
              Track investments, budgets, and activity progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/objectives">
              <Button variant="outline" className="gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">New Objective</span>
                <span className="sm:hidden">Objective</span>
              </Button>
            </Link>
            <Link to="/activities" search={{ activityId: undefined }}>
              <Button className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Activity</span>
                <span className="sm:hidden">Activity</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Grid */}
        <section className="mb-8">
          <SectionHeader title="Key Metrics" />
          {kpisLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <KPICardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPICard
                icon={DollarSign}
                label="Budget"
                value={formatCurrency(kpis?.totalEstimated || 0)}
                description="Total Estimated"
                variant="default"
              />
              <KPICard
                icon={DollarSign}
                label="Spent"
                value={formatCurrency(kpis?.totalActual || 0)}
                description="Total Actual"
                variant="success"
              />
              <KPICard
                icon={varianceIsPositive ? TrendingUp : TrendingDown}
                label="Variance"
                value={formatCurrency(kpis?.variance || 0)}
                description={`${formatPercent(kpis?.variancePercent || 0)} of budget`}
                variant={varianceIsPositive ? "danger" : "success"}
              />
              <KPICard
                icon={AlertTriangle}
                label="Alert"
                value={kpis?.overBudgetCount || 0}
                description="Over Budget"
                variant="danger"
              />
              <KPICard
                icon={Activity}
                label="Active"
                value={kpis?.activeActivities || 0}
                description="In Progress"
                variant="warning"
              />
              <KPICard
                icon={CheckCircle}
                label="Done"
                value={kpis?.completedActivities || 0}
                description="Completed"
                variant="success"
              />
              <KPICard
                icon={Clock}
                label="Pending"
                value={kpis?.pendingApprovals || 0}
                description="Awaiting Approval"
                variant="warning"
              />
              <KPICard
                icon={BarChart3}
                label="Planned"
                value={kpis?.plannedActivities || 0}
                description="Not Started"
                variant="default"
              />
            </div>
          )}
        </section>

        {/* Two Column Layout: Chart + Alerts */}
        <section className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-8">
          {/* Annual Spend Chart - Takes 3 columns */}
          <div className="xl:col-span-3">
            <SectionHeader title="Annual Spend Analysis" />
            <div className="bg-card border border-border/40 rounded-lg p-6 h-[400px]">
              {spendLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : !spendData || spendData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
                  <p>No spend data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="hsl(var(--border))"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="year"
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: "12px" }}
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                        boxShadow: "0 4px 12px -2px rgb(0 0 0 / 0.12)",
                        padding: "12px 16px",
                      }}
                      cursor={{ fill: "hsl(var(--muted))", opacity: 0.3 }}
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: "16px" }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Bar
                      dataKey="estimated"
                      name="Estimated"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                    <Bar
                      dataKey="actual"
                      name="Actual"
                      fill="hsl(var(--accent))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={48}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Variance Alerts - Takes 2 columns */}
          <div className="xl:col-span-2">
            <SectionHeader
              title="Variance Alerts"
              action={
                alerts && alerts.length > 0 ? (
                  <Link
                    to="/activities"
                    search={{ activityId: undefined }}
                    className="text-sm text-primary hover:text-primary/80 inline-flex items-center gap-1 transition-colors"
                  >
                    View all
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                ) : null
              }
            />
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden h-[400px] flex flex-col">
              {alertsLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <div className="w-10 h-10 border-4 border-warning/30 border-t-warning rounded-full animate-spin" />
                </div>
              ) : !alerts || alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mb-3 text-accent/40" />
                  <p className="font-medium">All activities on track</p>
                  <p className="text-sm mt-1">No budget overruns detected</p>
                </div>
              ) : (
                <div className="overflow-y-auto flex-1">
                  <table className="w-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-border/40 bg-muted/50">
                        <th className="text-left px-4 py-3 text-caption font-medium">
                          Activity
                        </th>
                        <th className="text-right px-4 py-3 text-caption font-medium">
                          Variance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {alerts.map((alert) => (
                        <tr
                          key={alert.activityId}
                          className="hover:bg-muted/30 transition-colors cursor-pointer"
                        >
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-foreground truncate max-w-[200px]">
                              {alert.activityTitle}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {alert.activitySn}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-mono font-medium text-destructive">
                              {formatCurrency(alert.variance)}
                            </div>
                            <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                              {formatPercent(alert.variancePercent)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Timeline & Activity Feed */}
        <section className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <div className="xl:col-span-3">
            <SectionHeader
              title="Activity Timeline"
              description="Visual overview of project activities and their progress"
            />
            <GanttView />
          </div>
          <div className="xl:col-span-2">
            <SectionHeader
              title="Recent Activity"
              description="Timeline of changes across the portfolio"
            />
            <div className="bg-card border border-border/40 rounded-lg p-6 h-[500px] overflow-y-auto scrollbar-thin">
              <ActivityFeed />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
