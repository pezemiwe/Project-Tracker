import React, { useState, useMemo } from "react";
import { useGanttData } from "../../hooks/useDashboard";
import { ChevronDown, ChevronRight, Calendar, Filter } from "lucide-react";

const STATUS_COLORS = {
  Planning: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-600 dark:text-blue-400", bar: "#3b82f6" },
  "In Progress": { bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-600 dark:text-amber-400", bar: "#f59e0b" },
  Completed: { bg: "bg-green-500/20", border: "border-green-500/40", text: "text-green-600 dark:text-green-400", bar: "#10b981" },
  "On Hold": { bg: "bg-slate-500/20", border: "border-slate-500/40", text: "text-slate-600 dark:text-slate-400", bar: "#64748b" },
} as const;

interface GanttViewProps {
  compact?: boolean;
}

export default function GanttView({ compact = false }: GanttViewProps) {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    startYear: currentYear - 1,
    endYear: currentYear + 2,
  });
  const [collapsedObjectives, setCollapsedObjectives] = useState<Set<string>>(new Set());

  const { data: activities, isLoading } = useGanttData(filters);

  // Group activities by objective
  const groupedActivities = useMemo(() => {
    if (!activities) return [];

    const groups = activities.reduce((acc, activity) => {
      const objective = activity.objectiveTitle || "Unassigned";
      if (!acc[objective]) {
        acc[objective] = [];
      }
      acc[objective].push(activity);
      return acc;
    }, {} as Record<string, typeof activities>);

    return Object.entries(groups).map(([objective, acts]) => ({
      objective,
      activities: acts.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    }));
  }, [activities]);

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const start = new Date(filters.startYear, 0, 1);
    const end = new Date(filters.endYear, 11, 31);
    return { start, end, totalDays: Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) };
  }, [filters]);

  // Generate year markers
  const yearMarkers = useMemo(() => {
    const markers = [];
    for (let year = filters.startYear; year <= filters.endYear; year++) {
      markers.push(year);
    }
    return markers;
  }, [filters]);

  const toggleObjective = (objective: string) => {
    setCollapsedObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(objective)) {
        next.delete(objective);
      } else {
        next.add(objective);
      }
      return next;
    });
  };

  const calculateBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timelineStart = timelineRange.start;

    const daysFromStart = Math.max(0, Math.ceil((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24)));
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const leftPercent = (daysFromStart / timelineRange.totalDays) * 100;
    const widthPercent = (duration / timelineRange.totalDays) * 100;

    return {
      left: `${Math.max(0, Math.min(100, leftPercent))}%`,
      width: `${Math.max(0.5, Math.min(100 - leftPercent, widthPercent))}%`,
    };
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
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
      {/* Year Filters */}
      <div className="p-6 bg-card border border-border/40 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-lg text-foreground">Timeline Range</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              <Calendar className="w-3 h-3 inline mr-1" />
              Start Year
            </label>
            <select
              value={filters.startYear}
              onChange={(e) => setFilters((prev) => ({ ...prev, startYear: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
              <Calendar className="w-3 h-3 inline mr-1" />
              End Year
            </label>
            <select
              value={filters.endYear}
              onChange={(e) => setFilters((prev) => ({ ...prev, endYear: parseInt(e.target.value) }))}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            >
              {availableYears.filter((y) => y >= filters.startYear).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
        {/* Timeline Header */}
        <div className="sticky top-0 z-10 border-b border-border/40 bg-muted/30">
          <div className="flex">
            <div className="w-80 flex-shrink-0 px-6 py-4 border-r border-border/40">
              <div className="text-xs font-medium text-primary uppercase tracking-wide">Activity</div>
            </div>
            <div className="flex-1 relative">
              <div className="flex h-full">
                {yearMarkers.map((year, idx) => (
                  <div
                    key={year}
                    className="flex-1 px-4 py-4 text-center border-r border-border/30 last:border-r-0"
                  >
                    <div className="text-sm font-medium text-foreground">{year}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activities Grouped by Objective */}
        <div className="divide-y divide-border/30">
          {groupedActivities.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-muted-foreground mb-2">No activities in timeline</div>
              <div className="text-sm text-muted-foreground/70">Adjust your year range</div>
            </div>
          ) : (
            groupedActivities.map((group, groupIdx) => {
              const isCollapsed = collapsedObjectives.has(group.objective);

              return (
                <div key={group.objective} className="bg-muted/20">
                  {/* Objective Header */}
                  <div
                    className="flex items-center px-6 py-4 cursor-pointer hover:bg-muted/40 transition-colors border-l-4 border-primary/50"
                    onClick={() => toggleObjective(group.objective)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div className="font-semibold text-base text-foreground">{group.objective}</div>
                      <div className="text-xs text-muted-foreground">({group.activities.length} activities)</div>
                    </div>
                  </div>

                  {/* Activities */}
                  {!isCollapsed && (
                    <div className="divide-y divide-border/20">
                      {group.activities.map((activity, actIdx) => {
                        const position = calculateBarPosition(activity.startDate, activity.endDate);
                        const statusColor = STATUS_COLORS[activity.status as keyof typeof STATUS_COLORS] || STATUS_COLORS["On Hold"];

                        return (
                          <div key={activity.id} className="flex hover:bg-muted/40 transition-colors group">
                            {/* Activity Info */}
                            <div className="w-80 flex-shrink-0 px-6 py-4 border-r border-border/40">
                              <div className="space-y-1">
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-mono text-primary/70">{activity.sn}</span>
                                  <span className="text-sm text-foreground flex-1">{activity.title}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColor.bg} ${statusColor.text} border ${statusColor.border}`}
                                  >
                                    {activity.status}
                                  </span>
                                  <span className="text-xs text-muted-foreground">{activity.progress}%</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDate(activity.startDate)} → {formatDate(activity.endDate)}
                                </div>
                              </div>
                            </div>

                            {/* Timeline Bar */}
                            <div className="flex-1 relative px-4 py-4">
                              <div className="relative h-12">
                                {/* Year Grid Lines */}
                                <div className="absolute inset-0 flex">
                                  {yearMarkers.map((year, idx) => (
                                    <div
                                      key={year}
                                      className="flex-1 border-r border-border/20 last:border-r-0"
                                    />
                                  ))}
                                </div>

                                {/* Activity Bar */}
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 h-8 rounded overflow-hidden shadow-lg transition-all duration-300 group-hover:h-9"
                                  style={{
                                    left: position.left,
                                    width: position.width,
                                    backgroundColor: statusColor.bar + "40",
                                    borderLeft: `3px solid ${statusColor.bar}`,
                                    borderRight: `3px solid ${statusColor.bar}`,
                                  }}
                                >
                                  {/* Progress Fill */}
                                  <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                      width: `${activity.progress}%`,
                                      backgroundColor: statusColor.bar,
                                      opacity: 0.6,
                                    }}
                                  />

                                  {/* Tooltip on Hover */}
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs font-medium text-white drop-shadow-lg">
                                      {activity.progress}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 py-4">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded border ${colors.border}`} style={{ backgroundColor: colors.bar }} />
            <span className="text-xs text-muted-foreground">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
