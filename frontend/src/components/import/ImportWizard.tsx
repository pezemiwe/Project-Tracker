import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  useImportPreview,
  useImportActivities,
  useDownloadTemplate,
} from "../../hooks/useImport";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";

type Step = "upload" | "preview" | "complete";

const STEPS: { key: Step; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "complete", label: "Complete" },
];

export function ImportWizard() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("upload");

  const previewMutation = useImportPreview();
  const importMutation = useImportActivities();
  const downloadTemplate = useDownloadTemplate();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const uploadedFile = acceptedFiles[0];
        setFile(uploadedFile);

        try {
          await previewMutation.mutateAsync(uploadedFile);
          setStep("preview");
        } catch (error) {
          console.error("Preview failed:", error);
        }
      }
    },
    [previewMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleImport = async () => {
    if (!file) return;

    try {
      await importMutation.mutateAsync(file);
      setStep("complete");
    } catch (error) {
      console.error("Import failed:", error);
    }
  };

  const handleReset = () => {
    setFile(null);
    setStep("upload");
    previewMutation.reset();
    importMutation.reset();
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadTemplate.mutateAsync();
    } catch (error) {
      console.error("Template download failed:", error);
    }
  };

  const getStepStatus = (stepKey: Step) => {
    const stepOrder = STEPS.map((s) => s.key);
    const currentIndex = stepOrder.indexOf(step);
    const stepIndex = stepOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) return "complete";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, idx) => {
          const status = getStepStatus(s.key);
          return (
            <div key={s.key} className="flex items-center">
              <div
                className={cn(
                  "flex items-center",
                  status === "current" && "text-accent",
                  status === "complete" && "text-accent",
                  status === "pending" && "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 text-sm font-medium",
                    status === "current" && "border-accent bg-accent/10",
                    status === "complete" && "border-accent bg-accent text-white",
                    status === "pending" && "border-muted-foreground/40"
                  )}
                >
                  {status === "complete" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    idx + 1
                  )}
                </div>
                <span className="ml-2 text-sm font-medium">{s.label}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "w-12 lg:w-20 h-0.5 mx-3",
                    status === "complete" ? "bg-accent" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Upload Step */}
      {step === "upload" && (
        <div className="space-y-6">
          {/* Template Download */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1">
                  Need a template?
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Download our Excel template with sample data and proper formatting
                </p>
                <Button
                  onClick={handleDownloadTemplate}
                  disabled={downloadTemplate.isPending}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {downloadTemplate.isPending ? "Downloading..." : "Download Template"}
                </Button>
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all",
              isDragActive
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50 hover:bg-muted/30"
            )}
          >
            <input {...getInputProps()} />
            <div className="p-3 bg-muted rounded-full w-fit mx-auto mb-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
            </div>
            {isDragActive ? (
              <p className="text-lg font-medium text-accent">
                Drop the file here...
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-foreground mb-1">
                  Drag and drop your Excel file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (.xlsx only)
                </p>
              </>
            )}
          </div>

          {previewMutation.isPending && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 text-accent animate-spin mr-3" />
              <span className="text-muted-foreground">Validating file...</span>
            </div>
          )}

          {previewMutation.isError && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Upload failed</p>
                <p className="text-sm text-destructive/80">
                  Please check your file format and try again
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Step */}
      {step === "preview" && previewMutation.data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-card border border-border/40 rounded-lg p-4">
              <div className="text-caption mb-1">Total Rows</div>
              <div className="text-2xl font-bold font-mono text-foreground">
                {previewMutation.data.successCount + previewMutation.data.errorCount}
              </div>
            </div>
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <div className="text-caption text-accent mb-1">Valid</div>
              <div className="text-2xl font-bold font-mono text-accent">
                {previewMutation.data.successCount}
              </div>
            </div>
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <div className="text-caption text-destructive mb-1">Errors</div>
              <div className="text-2xl font-bold font-mono text-destructive">
                {previewMutation.data.errorCount}
              </div>
            </div>
          </div>

          {/* Errors */}
          {previewMutation.data.errors.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <h3 className="font-medium text-destructive">
                  Validation Errors
                </h3>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {previewMutation.data.errors.map((error, idx) => (
                  <div
                    key={idx}
                    className="text-sm bg-card rounded p-2 border border-border/40"
                  >
                    <span className="font-mono text-destructive">
                      Row {error.row}:
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {error.field} - {error.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview Table */}
          {previewMutation.data.preview && previewMutation.data.preview.length > 0 && (
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
                <h3 className="font-medium text-foreground">
                  Preview (first 10 rows)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 bg-muted/20">
                      <th className="px-4 py-2 text-left text-caption font-medium">
                        Objective ID
                      </th>
                      <th className="px-4 py-2 text-left text-caption font-medium">
                        Title
                      </th>
                      <th className="px-4 py-2 text-left text-caption font-medium">
                        Status
                      </th>
                      <th className="px-4 py-2 text-right text-caption font-medium">
                        Estimated Spend
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {previewMutation.data.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="px-4 py-2 font-mono text-muted-foreground">
                          {row.objectiveId}
                        </td>
                        <td className="px-4 py-2 text-foreground">
                          {row.title}
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">
                          {row.status || "Planned"}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          ${row.estimatedSpendUsd?.toLocaleString() || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button onClick={handleReset} variant="outline">
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={
                previewMutation.data.errorCount > 0 || importMutation.isPending
              }
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${previewMutation.data.successCount} Activities`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Complete Step */}
      {step === "complete" && importMutation.data && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-accent" />
          </div>
          <h2 className="h3 text-foreground mb-2">Import Complete</h2>
          <p className="text-muted-foreground mb-8">
            Successfully imported{" "}
            <span className="font-mono font-medium text-foreground">
              {importMutation.data.successCount}
            </span>{" "}
            activities
          </p>
          <Button
            onClick={handleReset}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            Import Another File
          </Button>
        </div>
      )}
    </div>
  );
}
