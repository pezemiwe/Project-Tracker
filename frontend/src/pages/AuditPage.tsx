import React, { useState } from "react";
import { useAuditLogs, useExportAuditLogs } from "../hooks/useAudit";
import { useAuthStore } from "../stores/authStore";
import { Download, ChevronDown, ChevronRight, Calendar, Filter } from "lucide-react";

const OBJECT_TYPES = ["Activity", "Objective", "Actual", "Approval", "User"];
const ACTIONS = ["Create", "Update", "Delete", "SoftDelete", "Restore", "Reopen", "Approve", "Reject", "Import"];

export default function AuditPage() {
  const { user } = useAuthStore();
  const [filters, setFilters] = useState({
    objectType: "",
    action: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 50,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading } = useAuditLogs(filters);
  const exportMutation = useExportAuditLogs();

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  if (!user || (user.role !== "Admin" && user.role !== "Auditor")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-semibold text-2xl text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Audit logs are restricted to Admin and Auditor roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border/40 bg-muted/30">
        <div className="max-w-[1600px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-2xl text-foreground mb-1">Audit Trail</h1>
              <p className="text-muted-foreground text-sm">Complete record of system changes and user actions</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-background border border-border hover:bg-muted text-foreground rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group shadow-sm"
            >
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <span className="font-medium text-sm">{exportMutation.isPending ? "Exporting..." : "Export CSV"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-8 py-8">
        {/* Filters */}
        <div className="mb-8 p-5 bg-card border border-border/40 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-medium text-foreground">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Object Type
              </label>
              <select
                value={filters.objectType}
                onChange={(e) => handleFilterChange("objectType", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">All Types</option>
                {OBJECT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">All Actions</option>
                {ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                End Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground pointer-events-none" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Loading audit records...</p>
            </div>
          </div>
        ) : data?.logs.length === 0 ? (
          <div className="text-center py-20 border border-border/40 rounded-lg bg-card">
            <div className="text-muted-foreground mb-2 font-medium">No audit records found</div>
            <div className="text-sm text-muted-foreground">Try adjusting your filters</div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground font-mono">
              Showing <span className="text-foreground font-medium">{((data?.page || 1) - 1) * (data?.limit || 50) + 1}</span>–
              <span className="text-foreground font-medium">{Math.min((data?.page || 1) * (data?.limit || 50), data?.total || 0)}</span> of <span className="text-foreground font-medium">{data?.total || 0}</span> records
            </div>

            {/* Audit Log Table */}
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/30">
                      <th className="w-10"></th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Timestamp
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Actor
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Action
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        Object
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">
                        ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data?.logs.map((log) => {
                      const isExpanded = expandedRows.has(log.id);
                      const hasChanges = log.previousValues || log.newValues;
                      const { date, time } = formatTimestamp(log.timestamp);

                      return (
                        <React.Fragment key={log.id}>
                          <tr
                            className={`hover:bg-muted/30 transition-colors ${
                              hasChanges ? "cursor-pointer" : ""
                            }`}
                            onClick={() => hasChanges && toggleRow(log.id)}
                          >
                            <td className="px-4 py-3 text-center">
                              {hasChanges && (
                                <div className="text-muted-foreground inline-flex">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">{date}</span>
                                <span className="text-xs text-muted-foreground font-mono">{time}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="text-sm text-foreground">{log.actor?.fullName || "System"}</span>
                                <span className="text-xs text-muted-foreground">{log.actorRole || "—"}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${
                                  log.action === "Create"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50"
                                    : log.action === "Delete" || log.action === "SoftDelete"
                                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50"
                                    : log.action === "Update"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50"
                                    : log.action === "Approve"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50"
                                    : log.action === "Reject"
                                    ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50"
                                    : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                                }`}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-foreground">{log.objectType}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs font-mono text-muted-foreground truncate max-w-[150px]" title={log.objectId}>
                                {log.objectId}
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-muted/30 border-b border-border/40">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="ml-10 space-y-4">
                                  {log.comment && (
                                    <div>
                                      <div className="text-xs font-medium text-muted-foreground mb-1">
                                        Comment
                                      </div>
                                      <div className="text-sm text-foreground italic bg-background p-3 rounded-md border border-border/60">"{log.comment}"</div>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {log.previousValues && (
                                      <div>
                                        <div className="text-xs font-medium text-muted-foreground mb-1">
                                          Previous Values
                                        </div>
                                        <pre className="text-xs font-mono text-muted-foreground bg-background p-3 rounded-md border border-border/60 overflow-x-auto max-h-60 scrollbar-thin">
                                          {formatValue(log.previousValues)}
                                        </pre>
                                      </div>
                                    )}
                                    {log.newValues && (
                                      <div>
                                        <div className="text-xs font-medium text-muted-foreground mb-1">
                                          New Values
                                        </div>
                                        <pre className="text-xs font-mono text-muted-foreground bg-background p-3 rounded-md border border-border/60 overflow-x-auto max-h-60 scrollbar-thin">
                                          {formatValue(log.newValues)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                  {log.ipAddress && (
                                    <div>
                                      <div className="text-xs font-medium text-muted-foreground mb-1">
                                        IP Address
                                      </div>
                                      <div className="text-xs font-mono text-foreground">{log.ipAddress}</div>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {(data?.totalPages || 0) > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={filters.page === 1}
                  className="px-4 py-2 bg-background border border-input rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <div className="text-sm text-muted-foreground font-medium">
                  Page {data?.page} of {data?.totalPages}
                </div>
                <button
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, page: Math.min(data?.totalPages || 1, prev.page + 1) }))
                  }
                  disabled={filters.page === data?.totalPages}
                  className="px-4 py-2 bg-background border border-input rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
