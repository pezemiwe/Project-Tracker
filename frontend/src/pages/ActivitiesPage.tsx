import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useActivities, ActivityStatus } from "../hooks/useActivities";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "../contexts/ThemeContext";
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
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/activities" });
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    null,
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

  const handleFilterChange = (key: string, value: string | number) => {
    const isPageChange = key === "page";
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: isPageChange ? (value as number) : 1,
    }));
  };

  const clearFilters = () => {
    setSearchValue("");
    setFilters({ status: "", lead: "", page: 1, limit: 50 });
  };

  const hasActiveFilters = filters.status || filters.lead || searchValue;

  const columnDefs = useMemo<ColDef[]>(
    () => [
      {
        field: "sn",
        headerName: "S/N",
        width: 110,
        cellRenderer: SerialNumberCell,
      },
      {
        field: "title",
        headerName: "Activity",
        width: 320,
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
    [],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: false,
    }),
    [],
  );

  const onGridReady = useCallback(() => {
    // AG Grid is ready
  }, []);

  const onRowClicked = useCallback((event: any) => {
    setSelectedActivityId(event.data.id);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <LoadingState size="lg" message="Loading activities..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-[1600px] px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Activity Master Grid
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Comprehensive oversight of all investment activities
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto h-11 px-6 text-base font-medium bg-[#1a365d] hover:bg-[#2d4a7c] gap-2"
              >
                <Plus className="h-5 w-5" />
                Create Activity
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1600px] px-6 py-8">
        {/* Filters Card */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5 mb-6">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            <div className="flex items-center gap-2 text-base font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </div>
            <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-3">
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full sm:w-56 h-11 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
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
                className="w-full sm:w-56 h-11 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  type="button"
                  className="text-base text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 font-medium transition-colors h-11 px-4"
                >
                  Clear filters
                </button>
              )}
            </div>

            {data && (
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium text-center lg:text-left min-w-[140px]">
                <span className="font-bold text-gray-900 dark:text-white">
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
            title={
              hasActiveFilters ? "No activities found" : "No activities yet"
            }
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
              className={`hidden lg:block ${
                theme === "dark" ? "ag-theme-alpine-dark" : "ag-theme-alpine"
              } ag-theme-custom rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm`}
              style={{ height: "calc(100vh - 340px)", width: "100%" }}
            >
              <AgGridReact
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                rowData={data?.activities || []}
                onGridReady={onGridReady}
                onRowClicked={onRowClicked}
                pagination={false}
                domLayout="normal"
                rowHeight={52}
                headerHeight={48}
                rowClass="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                animateRows={true}
                suppressMovableColumns={true}
                suppressCellFocus={true}
              />
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {data?.activities.map((activity: any) => {
                const statusColors: Record<string, string> = {
                  Planned:
                    "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-400",
                  InProgress:
                    "bg-green-50 text-[#059669] border-[#059669] dark:bg-green-900/50 dark:text-green-400 dark:border-green-400",
                  OnHold:
                    "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-400",
                  Completed:
                    "bg-gray-50 text-gray-700 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500",
                  Cancelled:
                    "bg-red-50 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-400 dark:border-red-400",
                };
                const statusColor =
                  statusColors[activity.status] ||
                  "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";

                const percent = activity.progressPercent || 0;
                const getBarColour = (p: number) => {
                  if (p >= 100) return "bg-accent dark:bg-accent-dark";
                  if (p >= 75) return "bg-primary dark:bg-primary-dark";
                  if (p >= 50) return "bg-blue-500";
                  if (p >= 25) return "bg-amber-500";
                  return "bg-slate-400";
                };

                return (
                  <div
                    key={activity.id}
                    onClick={() => setSelectedActivityId(activity.id)}
                    className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-5 cursor-pointer hover:border-[#1a365d] dark:hover:border-blue-400 hover:shadow-lg transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-start justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        {activity.lockedBy && (
                          <Lock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className="text-sm font-bold text-[#1a365d] dark:text-blue-300">
                          ACT-{activity.sn.toString().padStart(4, "0")}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border-2 ${statusColor}`}
                      >
                        {activity.status === "InProgress"
                          ? "In Progress"
                          : activity.status}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-tight">
                      {activity.title}
                    </h3>

                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-1 font-medium">
                      {activity.investmentObjective?.title || "—"}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {activity.lead && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Lead
                          </div>
                          <div className="text-base text-gray-900 dark:text-white truncate font-medium">
                            {activity.lead}
                          </div>
                        </div>
                      )}
                      {activity.estimatedSpendUsdTotal && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Estimated
                          </div>
                          <div className="text-base text-gray-900 dark:text-white font-bold">
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
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getBarColour(percent)}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white w-12 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-5">
                <div className="text-base text-gray-600 dark:text-gray-400">
                  Page{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {data.pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {data.pagination.totalPages}
                  </span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    onClick={() => handleFilterChange("page", filters.page - 1)}
                    disabled={data.pagination.page === 1}
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 px-6 text-base gap-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => handleFilterChange("page", filters.page + 1)}
                    disabled={
                      data.pagination.page === data.pagination.totalPages
                    }
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 px-6 text-base gap-2"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
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
              navigate({
                to: "/activities",
                search: { activityId: undefined },
              });
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
