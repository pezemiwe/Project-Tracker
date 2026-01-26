import { useParams, useNavigate } from '@tanstack/react-router';
import { useObjective, useObjectiveAggregates } from '../hooks/useObjectives';
import { useAuthStore } from '../stores/authStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, Edit, TrendingUp, TrendingDown } from 'lucide-react';

export function ObjectiveDetailPage() {
  const { id } = useParams({ from: '/objectives/$id' });
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: objective, isLoading: objectiveLoading } = useObjective(id);
  const { data: aggregates, isLoading: aggregatesLoading } = useObjectiveAggregates(id);

  const canEdit = user?.role === 'Admin' || user?.role === 'ProjectManager';

  if (objectiveLoading || aggregatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading objective...</p>
        </div>
      </div>
    );
  }

  if (!objective) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Objective not found</p>
          <Button
            onClick={() => navigate({ to: '/objectives' })}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Objectives
          </Button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalEstimated = objective.computedEstimatedSpendUsd || 0;
  const totalActual = 0; // TODO: Add actuals when Phase 5 is complete
  const variance = totalActual - totalEstimated;
  const variancePercent = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0;

  // Sort per-year estimates
  const perYearData = aggregates?.perYearEstimates || {};
  const years = Object.keys(perYearData).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <Button
              onClick={() => navigate({ to: '/objectives' })}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-slate-500">#{objective.sn}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    objective.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : objective.status === 'Completed'
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {objective.status}
                </span>
              </div>

              <h1 className="font-serif text-3xl font-bold text-slate-900 mb-3">
                {objective.title}
              </h1>

              {objective.shortDescription && (
                <p className="text-slate-600 mb-4 max-w-3xl">{objective.shortDescription}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
                {objective.regions && objective.regions.length > 0 && (
                  <div>
                    <span className="font-medium">Regions:</span> {objective.regions.join(', ')}
                  </div>
                )}
                {objective.states && objective.states.length > 0 && (
                  <div>
                    <span className="font-medium">States:</span> {objective.states.join(', ')}
                  </div>
                )}
                <div>
                  <span className="font-medium">Duration:</span> {objective.overallStartYear} –{' '}
                  {objective.overallEndYear}
                </div>
                <div>
                  <span className="font-medium">Activities:</span> {objective.activities?.length || 0}
                </div>
              </div>
            </div>

            {canEdit && (
              <Button className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
                <Edit className="h-4 w-4" />
                Edit Objective
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-1">Total Estimated</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${totalEstimated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-1">Total Actual</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              ${totalActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">Coming in Phase 5</div>
          </Card>

          <Card className="p-6">
            <div className="text-sm text-slate-600 mb-1">Variance</div>
            <div
              className={`text-2xl font-bold font-mono flex items-center gap-2 ${
                variance > 0 ? 'text-red-600' : variance < 0 ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {variance > 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : variance < 0 ? (
                <TrendingDown className="h-5 w-5" />
              ) : null}
              ${Math.abs(variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              <span className="text-sm">({Math.abs(variancePercent).toFixed(1)}%)</span>
            </div>
          </Card>
        </div>

        {/* Per-Year Breakdown */}
        {years.length > 0 && (
          <Card className="mb-8">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Per-Year Breakdown
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Estimated
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Actual
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Variance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {years.map((year) => {
                    const estimated = perYearData[year] || 0;
                    const actual = 0; // TODO: Add actuals when Phase 5 is complete
                    const yearVariance = actual - estimated;
                    const yearVariancePercent = estimated > 0 ? (yearVariance / estimated) * 100 : 0;

                    return (
                      <tr key={year} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                          {year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-slate-900">
                          ${estimated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono text-slate-600">
                          ${actual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td
                          className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${
                            yearVariance > 0
                              ? 'text-red-600'
                              : yearVariance < 0
                              ? 'text-emerald-600'
                              : 'text-slate-900'
                          }`}
                        >
                          ${Math.abs(yearVariance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          {yearVariance !== 0 && (
                            <span className="ml-2 text-xs">
                              ({Math.abs(yearVariancePercent).toFixed(1)}%)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50 border-t border-slate-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      Total
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-slate-900">
                      ${totalEstimated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold text-slate-900">
                      ${totalActual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-bold ${
                        variance > 0 ? 'text-red-600' : variance < 0 ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      ${Math.abs(variance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      {variance !== 0 && (
                        <span className="ml-2 text-xs">
                          ({Math.abs(variancePercent).toFixed(1)}%)
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}

        {/* Activities List */}
        {objective.activities && objective.activities.length > 0 && (
          <Card>
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-serif text-xl font-bold text-slate-900">Activities</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {objective.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-6 hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate({ to: '/activities', search: { activityId: activity.id } })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-slate-500">#{activity.sn}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity.status === 'Planned'
                              ? 'bg-slate-100 text-slate-800'
                              : activity.status === 'InProgress'
                              ? 'bg-blue-100 text-blue-800'
                              : activity.status === 'OnHold'
                              ? 'bg-amber-100 text-amber-800'
                              : activity.status === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {activity.status === 'InProgress'
                            ? 'In Progress'
                            : activity.status === 'OnHold'
                            ? 'On Hold'
                            : activity.status}
                        </span>
                      </div>

                      <h3 className="font-medium text-slate-900 mb-2">{activity.title}</h3>

                      <div className="flex items-center gap-6 text-sm text-slate-600">
                        {activity.lead && (
                          <div>
                            <span className="font-medium">Lead:</span> {activity.lead}
                          </div>
                        )}
                        {activity.startDate && activity.endDate && (
                          <div>
                            <span className="font-medium">Duration:</span>{' '}
                            {new Date(activity.startDate).toLocaleDateString()} –{' '}
                            {new Date(activity.endDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-slate-900">
                        ${(activity.estimatedSpendUsdTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-slate-500">Estimated</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {objective.longDescription && (
          <Card className="mt-8 p-6">
            <h2 className="font-serif text-xl font-bold text-slate-900 mb-4">
              Detailed Description
            </h2>
            <p className="text-slate-700 whitespace-pre-wrap">{objective.longDescription}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
