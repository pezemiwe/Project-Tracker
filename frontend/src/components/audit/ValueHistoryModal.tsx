import React from "react";
import { useValueHistory } from "../../hooks/useAudit";
import { X, ArrowRight, Clock } from "lucide-react";

interface ValueHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  objectType: string;
  objectId: string;
  field: string;
  fieldLabel: string;
}

export default function ValueHistoryModal({
  isOpen,
  onClose,
  objectType,
  objectId,
  field,
  fieldLabel,
}: ValueHistoryModalProps) {
  const { data: history, isLoading } = useValueHistory(
    objectType,
    objectId,
    field,
    isOpen
  );

  if (!isOpen) return null;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }
    if (typeof value === "number") {
      return value.toLocaleString();
    }
    return String(value);
  };

  const isComplexValue = (value: any): boolean => {
    return typeof value === "object" && value !== null;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1d29] border border-slate-800/50 rounded-lg shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-slate-800/50 bg-gradient-to-b from-[#1e2230] to-[#1a1d29] px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-2xl text-amber-100 mb-1">
                Change History
              </h2>
              <p className="text-sm text-slate-400">
                <span className="text-amber-400 font-medium">{fieldLabel}</span>
                <span className="mx-2">·</span>
                {objectType} {objectId.slice(0, 8)}...
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-100px)] p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-amber-600/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading change history...</p>
              </div>
            </div>
          ) : !history || history.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-400 mb-1">No change history</p>
              <p className="text-sm text-slate-500">
                This field has not been modified since creation
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map((change, index) => {
                const { date, time } = formatTimestamp(change.timestamp);
                const isPreviousComplex = isComplexValue(change.previousValue);
                const isNewComplex = isComplexValue(change.newValue);
                const showSideBySide = !isPreviousComplex && !isNewComplex;

                return (
                  <div key={index} className="relative">
                    {/* Timeline connector */}
                    {index !== history.length - 1 && (
                      <div className="absolute left-[15px] top-12 w-px h-[calc(100%+1.5rem)] bg-gradient-to-b from-amber-500/50 via-slate-700/50 to-slate-700/30" />
                    )}

                    <div className="flex gap-4">
                      {/* Timeline dot */}
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                        </div>
                      </div>

                      {/* Change content */}
                      <div className="flex-1 min-w-0">
                        {/* Meta info */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="text-sm font-medium text-slate-200">
                              {change.actor}
                            </div>
                            <div className="text-xs text-slate-500">
                              {change.actorRole || "System"} · {date} at {time}
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                              change.action === "Create"
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : change.action === "Delete"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            }`}
                          >
                            {change.action}
                          </span>
                        </div>

                        {/* Comment */}
                        {change.comment && (
                          <div className="mb-3 px-3 py-2 bg-slate-800/30 border border-slate-700/50 rounded text-sm text-slate-300 italic">
                            "{change.comment}"
                          </div>
                        )}

                        {/* Value comparison */}
                        {showSideBySide ? (
                          // Side-by-side for simple values
                          <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                            <div className="bg-[#1e2230] border border-slate-800/50 rounded-lg p-3">
                              <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                                Previous
                              </div>
                              <div className="text-sm text-slate-300 font-medium">
                                {formatValue(change.previousValue)}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <div className="bg-[#1e2230] border border-amber-600/20 rounded-lg p-3">
                              <div className="text-xs font-medium text-amber-400 uppercase tracking-wide mb-1.5">
                                New
                              </div>
                              <div className="text-sm text-amber-100 font-medium">
                                {formatValue(change.newValue)}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Stacked for complex values
                          <div className="space-y-3">
                            {change.previousValue !== null &&
                              change.previousValue !== undefined && (
                                <div>
                                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                                    Previous Value
                                  </div>
                                  <pre className="text-xs font-mono text-slate-400 bg-[#0d0f16] p-4 rounded-lg border border-slate-700/50 overflow-x-auto">
                                    {formatValue(change.previousValue)}
                                  </pre>
                                </div>
                              )}
                            {change.newValue !== null &&
                              change.newValue !== undefined && (
                                <div>
                                  <div className="text-xs font-medium text-amber-400 uppercase tracking-wide mb-2">
                                    New Value
                                  </div>
                                  <pre className="text-xs font-mono text-slate-400 bg-[#0d0f16] p-4 rounded-lg border border-amber-600/20 overflow-x-auto">
                                    {formatValue(change.newValue)}
                                  </pre>
                                </div>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800/50 bg-[#1e2230] px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {history?.length || 0} change{history?.length !== 1 ? "s" : ""} recorded
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 text-slate-200 rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
