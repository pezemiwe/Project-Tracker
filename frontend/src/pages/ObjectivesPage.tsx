import { useState } from "react";
import { useObjectives } from "../hooks/useObjectives";
import { useAuthStore } from "../stores/authStore";
import { isPM } from "../lib/rbac";
import { ObjectiveCard } from "../components/objectives/ObjectiveCard";
import { ObjectiveFormModal } from "../components/objectives/ObjectiveFormModal";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/select";
import { EmptyState } from "../components/ui/empty-state";
import { NIGERIAN_REGION_NAMES, NIGERIAN_STATES } from "../lib/constants";
import { Plus, Filter, Target } from "lucide-react";

export function ObjectivesPage() {
  const { user } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    region: "",
    state: "",
    page: 1,
    limit: 12,
  });

  const { data, isLoading } = useObjectives(filters);
  const canEdit = user && isPM(user.role);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ status: "", region: "", state: "", page: 1, limit: 12 });
  };

  const hasActiveFilters = filters.status || filters.region || filters.state;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Investment Objectives
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400">
                Monitor and oversee donor-funded investment programmes
              </p>
            </div>
            {canEdit && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full sm:w-auto h-11 px-6 text-base font-medium bg-[#1a365d] hover:bg-[#2d4a7c]"
              >
                <Plus className="mr-2 h-5 w-5" />
                New Objective
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">
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
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
                <option value="Cancelled">Cancelled</option>
              </Select>

              <Select
                value={filters.region}
                onChange={(e) => handleFilterChange("region", e.target.value)}
                className="w-full sm:w-56 h-11 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              >
                <option value="">All Regions</option>
                {NIGERIAN_REGION_NAMES.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </Select>

              <Select
                value={filters.state}
                onChange={(e) => handleFilterChange("state", e.target.value)}
                className="w-full sm:w-56 h-11 text-base bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              >
                <option value="">All States</option>
                {NIGERIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </Select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
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
                {data.pagination.total === 1 ? "objective" : "objectives"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 animate-pulse"
              />
            ))}
          </div>
        ) : data?.objectives.length === 0 ? (
          <EmptyState
            variant={hasActiveFilters ? "no-results" : "no-data"}
            icon={Target}
            title={
              hasActiveFilters ? "No objectives found" : "No objectives yet"
            }
            description={
              hasActiveFilters
                ? "Try adjusting your filters to see more results"
                : "Get started by creating your first investment objective"
            }
            action={
              !hasActiveFilters && canEdit
                ? {
                    label: "Create Objective",
                    onClick: () => setIsCreateModalOpen(true),
                  }
                : undefined
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.objectives.map((objective) => (
                <ObjectiveCard key={objective.id} objective={objective} />
              ))}
            </div>

            {/* Pagination */}
            {data && data.pagination.totalPages > 1 && (
              <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-gray-200 dark:border-gray-700 pt-8">
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
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                    }
                    disabled={data.pagination.page === 1}
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 px-6 text-base"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                    disabled={
                      data.pagination.page === data.pagination.totalPages
                    }
                    variant="outline"
                    className="flex-1 sm:flex-none h-11 px-6 text-base"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Modal */}
      {canEdit && (
        <ObjectiveFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}
