import { useState } from "react";
import { ImportWizard } from "../components/import/ImportWizard";
import { ExportPanel } from "../components/export/ExportPanel";
import { Upload, Download } from "lucide-react";
import { cn } from "../lib/utils";

export function ImportExportPage() {
  const [activeTab, setActiveTab] = useState<"import" | "export">("import");

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="h2 text-foreground">Data Management</h1>
          <p className="text-lead mt-1">
            Import and export investment activity data
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-card border border-border/40 rounded-lg mb-6">
          <div className="flex border-b border-border/40">
            <button
              onClick={() => setActiveTab("import")}
              className={cn(
                "flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                activeTab === "import"
                  ? "text-accent border-b-2 border-accent bg-accent/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setActiveTab("export")}
              className={cn(
                "flex-1 sm:flex-none px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                activeTab === "export"
                  ? "text-accent border-b-2 border-accent bg-accent/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "import" ? <ImportWizard /> : <ExportPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}
