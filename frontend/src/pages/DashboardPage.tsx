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
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
          {/* Annual Spend Chart */}
          <div className="xl:col-span-2">
            <SectionHeader title="Annual Spend" />
            <div className="bg-card border border-border/40 rounded-lg p-6 h-[380px]">
              {spendLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : !spendData || spendData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">No data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spendData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="year" fontSize={12} />
                    <YAxis
                      fontSize={12}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend iconSize={10} />
                    <Bar
                      dataKey="estimated"
                      name="Estimated"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="actual"
                      name="Actual"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Variance Alerts */}
          <div className="xl:col-span-1">
            <SectionHeader
              title="Budget Alerts"
              action={
                alerts && alerts.length > 0 ? (
                  <Link
                    to="/activities"
                    search={{ activityId: undefined }}
                    className="text-xs text-primary hover:underline"
                  >
                    View all
                  </Link>
                ) : null
              }
            />
            <div className="bg-card border border-border/40 rounded-lg h-[380px]">
              {alertsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-4 border-warning/30 border-t-warning rounded-full animate-spin" />
                </div>
              ) : !alerts || alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground px-4">
                  <CheckCircle className="w-10 h-10 mb-2 text-green-500/40" />
                  <p className="text-sm font-medium">On Track</p>
                  <p className="text-xs mt-1">No overruns</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30 overflow-y-auto h-full">
                  {alerts.map((alert) => (
                    <div
                      key={alert.activityId}
                      className="p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {alert.activityTitle}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {alert.activitySn}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-red-600">
                            {formatCurrency(alert.variance)}
                          </p>
                          <p className="text-xs text-red-600/80">
                            {formatPercent(alert.variancePercent)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
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
