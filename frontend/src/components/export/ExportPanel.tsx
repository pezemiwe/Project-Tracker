import { useState } from "react";
import {
  useExportActivities,
  useExportActuals,
  useExportFinancialReport,
  useExportPDFReport,
} from "../../hooks/useExport";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Input } from "../ui/input";
import { Download, FileSpreadsheet, DollarSign, Table, Loader2, FileText } from "lucide-react";

export function ExportPanel() {
  const [filters, setFilters] = useState({
    status: "",
    lead: "",
    startYear: "",
    endYear: "",
  });

  const exportActivities = useExportActivities();
  const exportActuals = useExportActuals();
  const exportFinancialReport = useExportFinancialReport();
  const exportPDFReport = useExportPDFReport();

  const handleExportActivities = async () => {
    try {
      await exportActivities.mutateAsync({
        status: filters.status || undefined,
        lead: filters.lead || undefined,
        startYear: filters.startYear ? parseInt(filters.startYear) : undefined,
        endYear: filters.endYear ? parseInt(filters.endYear) : undefined,
      });
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportActuals = async () => {
    try {
      await exportActuals.mutateAsync(undefined);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportFinancialReport = async () => {
    try {
      await exportFinancialReport.mutateAsync();
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const handleExportPDFReport = async () => {
    try {
      await exportPDFReport.mutateAsync(undefined);
    } catch (error) {
      console.error("PDF export failed:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Activities Export */}
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-accent/10 rounded-lg flex-shrink-0">
            <Table className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="h4 text-foreground mb-1">Export Activities</h2>
            <p className="text-sm text-muted-foreground">
              Download all activities with estimates, actuals, and annual
              breakdowns
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border/30">
          <div className="space-y-1.5">
            <Label htmlFor="status" className="text-caption">
              Status
            </Label>
            <Select
              id="status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Planned">Planned</option>
              <option value="InProgress">In Progress</option>
              <option value="OnHold">On Hold</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lead" className="text-caption">
              Lead
            </Label>
            <Input
              id="lead"
              type="text"
              placeholder="Filter by lead name..."
              value={filters.lead}
              onChange={(e) => setFilters({ ...filters, lead: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="startYear" className="text-caption">
              Start Year
            </Label>
            <Input
              id="startYear"
              type="number"
              placeholder="2024"
              value={filters.startYear}
              onChange={(e) =>
                setFilters({ ...filters, startYear: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="endYear" className="text-caption">
              End Year
            </Label>
            <Input
              id="endYear"
              type="number"
              placeholder="2025"
              value={filters.endYear}
              onChange={(e) =>
                setFilters({ ...filters, endYear: e.target.value })
              }
            />
          </div>
        </div>

        <Button
          onClick={handleExportActivities}
          disabled={exportActivities.isPending}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
        >
          {exportActivities.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Activities
            </>
          )}
        </Button>
      </div>

      {/* Actuals Export */}
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="h4 text-foreground mb-1">Export Actuals</h2>
            <p className="text-sm text-muted-foreground">
              Download all actual spend records with categories and attachments
            </p>
          </div>
        </div>

        <Button
          onClick={handleExportActuals}
          disabled={exportActuals.isPending}
          variant="outline"
          className="w-full gap-2"
        >
          {exportActuals.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export Actuals
            </>
          )}
        </Button>
      </div>

      {/* Financial Report Export */}
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-warning/10 rounded-lg flex-shrink-0">
            <DollarSign className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <h2 className="h4 text-foreground mb-1">Financial Summary Report</h2>
            <p className="text-sm text-muted-foreground">
              Generate a comprehensive financial report with variance analysis by
              objective and activity
            </p>
          </div>
        </div>

        <Button
          onClick={handleExportFinancialReport}
          disabled={exportFinancialReport.isPending}
          variant="outline"
          className="w-full gap-2"
        >
          {exportFinancialReport.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate Financial Report
            </>
          )}
        </Button>
      </div>

      {/* PDF Report Export */}
      <div className="bg-card border border-border/40 rounded-lg p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-accent/10 rounded-lg flex-shrink-0">
            <FileText className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <h2 className="h4 text-foreground mb-1">Portfolio PDF Report</h2>
            <p className="text-sm text-muted-foreground">
              Generate a formatted PDF document of all investment objectives and
              their corresponding activities
            </p>
          </div>
        </div>

        <Button
          onClick={handleExportPDFReport}
          disabled={exportPDFReport.isPending}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
        >
          {exportPDFReport.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating PDF...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate PDF Report
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
