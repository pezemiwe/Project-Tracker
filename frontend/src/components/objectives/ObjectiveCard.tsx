import { useNavigate } from "@tanstack/react-router";
import { Objective } from "../../hooks/useObjectives";
import { MapPin, Calendar, Activity } from "lucide-react";

interface ObjectiveCardProps {
  objective: Objective;
}

const statusColors: Record<string, string> = {
  Active:
    "bg-green-50 text-[#059669] border-[#059669] dark:bg-green-900/50 dark:text-green-400 dark:border-green-400",
  Completed:
    "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-900/50 dark:text-blue-400 dark:border-blue-400",
  "On Hold":
    "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-400 dark:border-amber-400",
  Cancelled:
    "bg-red-50 text-red-700 border-red-300 dark:bg-red-900/50 dark:text-red-400 dark:border-red-400",
};

export function ObjectiveCard({ objective }: ObjectiveCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: "/objectives/$id", params: { id: objective.id } });
  };

  const statusColor =
    statusColors[objective.status] ||
    "bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600";

  const isActive = objective.status === "Active";
  const borderColor = isActive
    ? "border-[#059669] dark:border-green-400"
    : "border-gray-200 dark:border-gray-700";
  const hoverBorderColor = isActive
    ? "hover:border-[#047857] dark:hover:border-green-300"
    : "hover:border-[#1a365d] dark:hover:border-blue-400";
  const titleColor = isActive
    ? "text-[#059669] dark:text-green-400"
    : "text-gray-900 dark:text-white";
  const hoverTitleColor = isActive
    ? "group-hover:text-[#047857] dark:group-hover:text-green-300"
    : "group-hover:text-[#1a365d] dark:group-hover:text-blue-400";

  return (
    <button
      onClick={handleClick}
      className={`group relative bg-white dark:bg-gray-800 rounded-xl border-2 ${borderColor} ${hoverBorderColor} hover:shadow-lg transition-all duration-200 text-left overflow-hidden flex flex-col h-full`}
    >
      {/* Status Badge */}
      <div className="absolute top-5 right-5 z-10">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border-2 ${statusColor}`}
        >
          {objective.status}
        </span>
      </div>

      {/* Header */}
      <div className="p-6 pb-4 flex-1">
        <div className="pr-24">
          <div className="text-xs font-bold text-[#1a365d] dark:text-blue-300 mb-3 tracking-wide">
            OBJ-{objective.sn.toString().padStart(4, "0")}
          </div>
          <h3
            className={`font-bold text-xl ${titleColor} ${hoverTitleColor} transition-colors line-clamp-2 leading-tight`}
          >
            {objective.title}
          </h3>
        </div>

        {objective.shortDescription && (
          <p className="mt-3 text-base text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {objective.shortDescription}
          </p>
        )}
      </div>

      {/* Metadata */}
      <div className="px-6 pb-5 space-y-3">
        {objective.regions && objective.regions.length > 0 && (
          <div className="flex items-center gap-2.5 text-base">
            <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span
              className="text-gray-700 dark:text-gray-300 truncate font-medium"
              title={objective.states.join(", ")}
            >
              {objective.regions.join(", ")}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-base">
          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 font-semibold">
            {objective.overallStartYear} – {objective.overallEndYear}
          </span>
        </div>

        <div className="flex items-center gap-2.5 text-base">
          <Activity className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            {objective.activityCount || 0}{" "}
            {objective.activityCount === 1 ? "activity" : "activities"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-gray-100 bg-gray-50 px-6 py-4 mt-auto">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-600">
            Estimated Spend
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold text-gray-900">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(objective.computedEstimatedSpendUsd)}
            </span>
          </div>
        </div>
      </div>

      {/* Hover indicator */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-[#1a365d] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
    </button>
  );
}
