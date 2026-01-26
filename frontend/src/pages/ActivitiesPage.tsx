import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useActivities, ActivityStatus } from "../hooks/useActivities";
import { useAuthStore } from "../stores/authStore";
import { isPM } from "../lib/rbac";
import { ActivityModal } from "../components/activities/ActivityModal";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { LoadingState } from "../components/ui/loading-state";
import { EmptyState } from "../components/ui/empty-state";
import {
  SerialNumberCell,
  TitleCell,
  StatusCell,
  DateCell,
  CurrencyCell,
  ProgressCell,
  MutedTextCell,
} from "../components/grid/cell-renderers";
import {
  Plus,
  Filter,
  Lock,
  Activity as ActivityIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export function ActivitiesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/activities" });
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "" as ActivityStatus | "",
    lead: "",
    page: 1,
    limit: 50,
  });

  // Local state for search input (prevents focus loss during typing)
  const [searchValue, setSearchValue] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced search - update filters after 500ms of no typing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (searchValue !== filters.lead) {
        setFilters((prev) => ({ ...prev, lead: searchValue, page: 1 }));
      }
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, filters.lead]);

  // Sync search input with filters when cleared externally
  useEffect(() => {
    if (filters.lead === "" && searchValue !== "") {
      setSearchValue("");
    }
  }, [filters.lead]);

  // Auto-open modal when activityId is in URL
  useEffect(() => {
    if (search.activityId && !selectedActivityId) {
      setSelectedActivityId(search.activityId);
    }
  }, [search.activityId, selectedActivityId]);

  const { data, isLoading } = useActivities({
    ...filters,
    status: filters.status || undefined,
  });
  const canEdit = user && isPM(user.role);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setSearchValue("");
    setFilters({ status: "", lead: "", page: 1, limit: 50 });
  };

  const hasActiveFilters = filters.status || filters.lead || searchValue;

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        field: "sn",
        headerName: "S/N",
        width: 110,
        pinned: "left",
        cellRenderer: SerialNumberCell,
      },
      {
        field: "title",
        headerName: "Activity",
        width: 320,
        pinned: "left",
        cellRenderer: TitleCell,
      },
      {
        field: "investmentObjective.title",
        headerName: "Objective",
        width: 220,
        cellRenderer: MutedTextCell,
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: StatusCell,
      },
      {
        field: "lead",
        headerName: "Lead",
        width: 160,
        cellRenderer: MutedTextCell,
      },
      {
        field: "startDate",
        headerName: "Start",
        width: 120,
        cellRenderer: DateCell,
      },
      {
        field: "endDate",
        headerName: "End",
        width: 120,
        cellRenderer: DateCell,
      },
      {
        field: "estimatedSpendUsdTotal",
        headerName: "Estimated",
        width: 130,
        cellRenderer: CurrencyCell,
      },
      {
        field: "progressPercent",
        headerName: "Progress",
        width: 140,
        cellRenderer: ProgressCell,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
    }),
    []
  );

  const onGridReady = useCallback(() => {
    // AG Grid is ready
  }, []);

  const onRowClicked = useCallback((event: any) => {
    setSelectedActivityId(event.data.id);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState size="lg" message="Loading activities..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="h2 text-foreground">Activity Master Grid</h1>
            <p className="text-lead mt-1">
              Comprehensive oversight of all investment activities
            </p>
          </div>
          {canEdit && (
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Plus className="h-4 w-4" />
              Create Activity
            </Button>
          )}
        </div>

        {/* Filters Card */}
        <div className="bg-card border border-border/40 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full sm:w-44"
              >
                <option value="">All Status</option>
                <option value="Planned">Planned</option>
                <option value="InProgress">In Progress</option>
                <option value="OnHold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </Select>

              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Search by lead..."
                className="w-full sm:w-56"
              />

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-destructive hover:text-destructive/80 font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            {data && (
              <div className="text-sm text-muted-foreground font-mono">
                <span className="font-semibold text-foreground">
                  {data.pagination.total}
                </span>{" "}
                {data.pagination.total === 1 ? "activity" : "activities"}
              </div>
            )}
          </div>
        </div>

        {/* Grid Section */}
        {data && data.activities.length === 0 ? (
          <EmptyState
            variant={hasActiveFilters ? "no-results" : "no-data"}
            icon={ActivityIcon}
            title={hasActiveFilters ? "No activities found" : "No activities yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your filters"
                : "Get started by creating your first activity"
            }
            action={
              !hasActiveFilters && canEdit
                ? {
                    label: "Create Activity",
                    onClick: () => setIsCreateModalOpen(true),
                  }
                : undefined
            }
          />
        ) : (
          <>
            {/* Desktop Grid View */}
            <div
              className="hidden lg:block ag-theme-alpine ag-theme-custom rounded-lg overflow-hidden border border-border/40"
              style={{ height: "calc(100vh - 340px)", width: "100%" }}
            >
              <AgGridReact
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowData={data?.activities || []}
                onGridReady={onGridReady}
                onRowClicked={onRowClicked}
                pagination={true}
                paginationPageSize={50}
                domLayout="normal"
                rowHeight={48}
                headerHeight={44}
                rowClass="cursor-pointer hover:bg-muted/50 transition-colors"
                animateRows={true}
                suppressMovableColumns={true}
                suppressCellFocus={true}
              />
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {data?.activities.map((activity: any) => {
                const statusColors: Record<string, string> = {
                  Planned:
                    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50",
                  InProgress:
                    "bg-accent/10 text-accent border-accent/30 dark:bg-accent/20 dark:text-accent dark:border-accent/40",
                  OnHold:
                    "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50",
                  Completed:
                    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
                  Cancelled:
                    "bg-destructive/10 text-destructive border-destructive/30 dark:bg-destructive/20 dark:text-destructive dark:border-destructive/40",
                };
                const statusColor =
                  statusColors[activity.status] ||
                  "bg-slate-100 text-slate-700 border-slate-200";

                const percent = activity.progressPercent || 0;
                const getBarColour = (p: number) => {
                  if (p >= 100) return "bg-accent";
                  if (p >= 75) return "bg-primary";
                  if (p >= 50) return "bg-blue-500";
                  if (p >= 25) return "bg-amber-500";
                  return "bg-slate-400";
                };

                return (
                  <div
                    key={activity.id}
                    onClick={() => setSelectedActivityId(activity.id)}
                    className="bg-card border border-border/40 rounded-lg p-4 cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {activity.lockedBy && (
                          <Lock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        )}
                        <span className="text-xs font-mono text-primary/70">
                          ACT-{activity.sn.toString().padStart(4, "0")}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${statusColor}`}
                      >
                        {activity.status === "InProgress"
                          ? "In Progress"
                          : activity.status}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-foreground mb-1 line-clamp-2">
                      {activity.title}
                    </h3>

                    <div className="text-xs text-muted-foreground mb-3 line-clamp-1">
                      {activity.investmentObjective?.title || "—"}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {activity.lead && (
                        <div>
                          <div className="text-caption mb-0.5">Lead</div>
                          <div className="text-sm text-foreground truncate">
                            {activity.lead}
                          </div>
                        </div>
                      )}
                      {activity.estimatedSpendUsdTotal && (
                        <div>
                          <div className="text-caption mb-0.5">Estimated</div>
                          <div className="text-sm text-foreground font-mono font-medium">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }).format(activity.estimatedSpendUsdTotal)}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getBarColour(percent)}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground font-mono w-10 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-card border border-border/40 rounded-lg p-4">
                <div className="text-sm text-muted-foreground">
                  Page{" "}
                  <span className="font-mono font-medium text-foreground">
                    {data.pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-mono font-medium text-foreground">
                    {data.pagination.totalPages}
                  </span>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    onClick={() =>
                      handleFilterChange("page", String(filters.page - 1))
                    }
                    disabled={data.pagination.page === 1}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    onClick={() =>
                      handleFilterChange("page", String(filters.page + 1))
                    }
                    disabled={data.pagination.page === data.pagination.totalPages}
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {selectedActivityId && (
        <ActivityModal
          activityId={selectedActivityId}
          isOpen={!!selectedActivityId}
          onClose={() => {
            setSelectedActivityId(null);
            // Clear activityId from URL if present
            if (search.activityId) {
              navigate({ to: "/activities", search: { activityId: undefined } });
            }
          }}
        />
      )}

      {canEdit && (
        <ActivityModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
