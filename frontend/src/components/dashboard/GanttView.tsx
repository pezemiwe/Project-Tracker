import { useState, useMemo } from "react";
import { useGanttData } from "../../hooks/useDashboard";
import { Calendar, Filter, Clock } from "lucide-react";

const STATUS_COLORS = {
  Planning: {
    bg: "bg-[#1a365d]/10",
    border: "border-[#1a365d]/30",
    text: "text-[#1a365d]",
    bar: "#1a365d",
    dot: "bg-[#1a365d]",
  },
  "In Progress": {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600",
    bar: "#f59e0b",
    dot: "bg-amber-500",
  },
  Completed: {
    bg: "bg-[#059669]/10",
    border: "border-[#059669]/30",
    text: "text-[#059669]",
    bar: "#059669",
    dot: "bg-[#059669]",
  },
  "On Hold": {
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    text: "text-slate-600",
    bar: "#64748b",
    dot: "bg-slate-500",
  },
} as const;

// Helper function to map backend enum status to frontend display status
const normalizeStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    Planned: "Planning",
    InProgress: "In Progress",
    Completed: "Completed",
    OnHold: "On Hold",
    Cancelled: "On Hold",
  };
  return statusMap[status] || status;
};

export default function GanttView() {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    startYear: currentYear - 1,
    endYear: currentYear + 2,
  });

  const [activeTab, setActiveTab] = useState<string>("Planning");
  const [selectedObjective, setSelectedObjective] = useState<string>("all");

  const { data: activities, isLoading } = useGanttData(filters);

  // Get unique objectives for the filter dropdown
  const availableObjectives = useMemo(() => {
    if (!activities) return [];
    const uniqueObjectives = Array.from(
      new Set(activities.map((a) => a.objectiveTitle)),
    ).sort();
    return uniqueObjectives;
  }, [activities]);

  // Filter activities by selected objective
  const filteredActivities = useMemo(() => {
    if (!activities) return [];
    if (selectedObjective === "all") return activities;
    return activities.filter((a) => a.objectiveTitle === selectedObjective);
  }, [activities, selectedObjective]);

  const statusGroups = useMemo(() => {
    if (!filteredActivities) return [];

    const statusOrder = ["Planning", "In Progress", "Completed", "On Hold"];
    const groups = filteredActivities.reduce(
      (acc, activity) => {
        const normalizedStatus = normalizeStatus(activity.status || "OnHold");
        if (!acc[normalizedStatus]) {
          acc[normalizedStatus] = [];
        }
        acc[normalizedStatus].push(activity);
        return acc;
      },
      {} as Record<string, typeof filteredActivities>,
    );

    return statusOrder.map((status) => ({
      status,
      activities: (groups[status] || []).sort(
        (a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      ),
      count: (groups[status] || []).length,
    }));
  }, [filteredActivities]);

  const activeStatusGroup =
    statusGroups.find((g) => g.status === activeTab) || statusGroups[0];

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (days < 30) return `${days} days`;
    const months = Math.round(days / 30);
    return `${months} ${months === 1 ? "month" : "months"}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const availableYears = useMemo(() => {
    const years = [];
    for (let i = currentYear - 5; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }, [currentYear]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#1a365d]/5 via-white to-white dark:from-slate-800 dark:via-slate-900 dark:to-slate-900 border border-[#1a365d]/10 dark:border-slate-700 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-[#1a365d] dark:bg-slate-700 text-white shadow-md">
            <Filter className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-xl text-[#1a365d] dark:text-slate-200">
            Filters
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground dark:text-slate-400 mb-2 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
              Start Year
            </label>
            <select
              value={filters.startYear}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  startYear: parseInt(e.target.value),
                }))
              }
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-[#1a365d]/20 dark:border-slate-600 rounded-xl text-foreground dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#1a365d]/30 dark:focus:ring-slate-500 focus:border-[#1a365d] dark:focus:border-slate-500 transition-all hover:border-[#1a365d]/40 dark:hover:border-slate-500"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground dark:text-slate-400 mb-2 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 inline mr-1.5" />
              End Year
            </label>
            <select
              value={filters.endYear}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  endYear: parseInt(e.target.value),
                }))
              }
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-[#1a365d]/20 dark:border-slate-600 rounded-xl text-foreground dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#1a365d]/30 dark:focus:ring-slate-500 focus:border-[#1a365d] dark:focus:border-slate-500 transition-all hover:border-[#1a365d]/40 dark:hover:border-slate-500"
            >
              {availableYears
                .filter((y) => y >= filters.startYear)
                .map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground dark:text-slate-400 mb-2 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 inline mr-1.5" />
              Objective
            </label>
            <select
              value={selectedObjective}
              onChange={(e) => setSelectedObjective(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-[#1a365d]/20 dark:border-slate-600 rounded-xl text-foreground dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-[#1a365d]/30 dark:focus:ring-slate-500 focus:border-[#1a365d] dark:focus:border-slate-500 transition-all hover:border-[#1a365d]/40 dark:hover:border-slate-500"
            >
              <option value="all">All Objectives</option>
              {availableObjectives.map((objective) => (
                <option key={objective} value={objective}>
                  {objective}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-2 border-[#1a365d]/10 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <div className="flex gap-0 bg-slate-100 dark:bg-slate-800">
          {statusGroups.map((group, index) => {
            const statusColor =
              STATUS_COLORS[group.status as keyof typeof STATUS_COLORS] ||
              STATUS_COLORS["On Hold"];
            const isActive = activeTab === group.status;
            return (
              <button
                key={group.status}
                onClick={() => setActiveTab(group.status)}
                className={`relative flex-1 px-6 py-3 font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? `bg-white dark:bg-slate-700 shadow-md ${statusColor.text} dark:text-slate-200 z-10`
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
                style={{
                  clipPath:
                    index === 0
                      ? "polygon(0% 0%, 100% 0%, 92% 100%, 0% 100%)"
                      : index === statusGroups.length - 1
                        ? "polygon(8% 0%, 100% 0%, 100% 100%, 0% 100%)"
                        : "polygon(8% 0%, 100% 0%, 92% 100%, 0% 100%)",
                  marginLeft: index === 0 ? "0" : "-16px",
                }}
              >
                <span className="relative z-10">
                  {group.status}
                  <span
                    className={`ml-2 text-xs ${
                      isActive ? "opacity-100" : "opacity-60"
                    }`}
                  >
                    ({group.count})
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {!activities || activities.length === 0 ? (
          <div className="p-20 text-center">
            <div className="text-muted-foreground dark:text-slate-400 mb-2">
              No activities in timeline
            </div>
            <div className="text-sm text-muted-foreground/70 dark:text-slate-500">
              Adjust your year range
            </div>
          </div>
        ) : (
          <div className="p-6">
            {activeStatusGroup && activeStatusGroup.activities.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground dark:text-slate-400">
                No activities in {activeStatusGroup.status}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeStatusGroup?.activities.map((activity) => {
                  const statusColor =
                    STATUS_COLORS[
                      activity.status as keyof typeof STATUS_COLORS
                    ] || STATUS_COLORS["On Hold"];
                  return (
                    <div
                      key={activity.id}
                      className="bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-800 dark:to-slate-800/50 border-2 border-[#1a365d]/10 dark:border-slate-700 rounded-xl p-4 shadow-md hover:shadow-xl hover:border-[#1a365d]/30 dark:hover:border-slate-600 transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-xs font-bold font-mono text-white bg-[#1a365d] dark:bg-slate-700 px-2 py-1 rounded-lg shadow-sm">
                          {activity.sn}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${statusColor.bg} ${statusColor.text} border ${statusColor.border} dark:border-slate-600`}
                          >
                            {activity.progress}%
                          </div>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-[#1a365d] dark:text-slate-200 mb-2 line-clamp-2 min-h-[40px] group-hover:text-[#059669] dark:group-hover:text-emerald-400 transition-colors">
                        {activity.title}
                      </h4>

                      <p className="text-xs text-muted-foreground dark:text-slate-400 font-medium mb-3 line-clamp-1">
                        {activity.objectiveTitle || "Unassigned"}
                      </p>

                      <div className="mb-3">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${activity.progress}%`,
                              background: `linear-gradient(90deg, ${statusColor.bar}, ${statusColor.bar}cc)`,
                            }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="w-3 h-3 text-[#1a365d] dark:text-slate-400" />
                          <span className="text-muted-foreground dark:text-slate-400 font-medium">
                            Start:
                          </span>
                          <span className="font-semibold text-foreground dark:text-slate-300">
                            {formatDate(activity.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3 h-3 text-[#059669] dark:text-emerald-400" />
                          <span className="text-muted-foreground dark:text-slate-400 font-medium">
                            End:
                          </span>
                          <span className="font-semibold text-foreground dark:text-slate-300">
                            {formatDate(activity.endDate)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-[#1a365d]/10 dark:border-slate-700">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground dark:text-slate-400 font-medium">
                            Duration
                          </span>
                          <span className="font-bold text-[#1a365d] dark:text-slate-300">
                            {calculateDuration(
                              activity.startDate,
                              activity.endDate,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
