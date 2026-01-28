import { useState, useMemo } from "react";
import {
  useSettings,
  useUpdateSetting,
  useTestEmail,
} from "../hooks/useSettings";
import { useAuthStore } from "../stores/authStore";
import {
  Save,
  Mail,
  Shield,
  Settings as SettingsIcon,
  CheckCircle,
  Clock,
  DollarSign,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

const CATEGORIES = {
  approval: { label: "Approval Thresholds", icon: DollarSign, color: "blue" },
  notification: { label: "Email Notifications", icon: Mail, color: "amber" },
  security: { label: "Security Settings", icon: Shield, color: "red" },
  system: { label: "System Configuration", icon: SettingsIcon, color: "slate" },
};

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSetting();
  const testEmailMutation = useTestEmail();

  const [editedValues, setEditedValues] = useState<Record<string, any>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testEmail, setTestEmail] = useState("");
  const [testEmailResult, setTestEmailResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Group settings by category
  const groupedSettings = useMemo(() => {
    if (!settings) return {};

    return settings.reduce(
      (acc, setting) => {
        // Infer category from key
        let category = "system";
        if (setting.key.toLowerCase().includes("approval"))
          category = "approval";
        else if (
          setting.key.toLowerCase().includes("email") ||
          setting.key.toLowerCase().includes("smtp")
        )
          category = "notification";
        else if (
          setting.key.toLowerCase().includes("session") ||
          setting.key.toLowerCase().includes("login") ||
          setting.key.toLowerCase().includes("security")
        )
          category = "security";

        if (!acc[category]) acc[category] = [];
        acc[category].push(setting);
        return acc;
      },
      {} as Record<string, typeof settings>,
    );
  }, [settings]);

  const hasChanges = Object.keys(editedValues).length > 0;

  const handleChange = (key: string, value: any) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      for (const [key, value] of Object.entries(editedValues)) {
        await updateMutation.mutateAsync({ key, value });
      }
      setEditedValues({});
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) return;

    try {
      setTestEmailResult(null);
      await testEmailMutation.mutateAsync(testEmail);
      setTestEmailResult({
        success: true,
        message: "Test email sent successfully! Check your inbox.",
      });
    } catch (error: any) {
      setTestEmailResult({
        success: false,
        message: error.response?.data?.error || "Failed to send test email",
      });
    }
  };

  const getValue = (setting: any) => {
    if (editedValues[setting.key] !== undefined) {
      return editedValues[setting.key];
    }
    return setting.value;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isPasswordField = (key: string) => {
    return key.toLowerCase().includes("password");
  };

  const isEmailField = (key: string) => {
    return key.toLowerCase().includes("email") && !key.includes("Enabled");
  };

  const isNumberField = (key: string) => {
    return (
      key.toLowerCase().includes("threshold") ||
      key.toLowerCase().includes("port") ||
      key.toLowerCase().includes("timeout") ||
      key.toLowerCase().includes("attempts") ||
      key.toLowerCase().includes("minutes") ||
      key.toLowerCase().includes("hours")
    );
  };

  const isBooleanField = (key: string, value: any) => {
    return typeof value === "boolean" || key.toLowerCase().includes("enabled");
  };

  if (!user || user.role !== "Admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-3xl text-foreground mb-2 uppercase tracking-wider">
            ACCESS DENIED
          </h1>
          <p className="text-muted-foreground">
            System settings are restricted to Admin users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-card to-background">
        <div className="max-w-[1400px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-4xl text-foreground mb-1 tracking-wider uppercase">
                SYSTEM SETTINGS
              </h1>
              <p className="text-muted-foreground text-sm uppercase tracking-wide">
                Configure system-wide preferences and thresholds
              </p>
            </div>
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-warning-amber hover:bg-warning-amber-dark text-white rounded-lg transition-all duration-320 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg shadow-warning-amber/30"
              >
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="font-medium">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading settings...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Settings Categories */}
            {Object.entries(groupedSettings).map(
              ([category, categorySettings]) => {
                const categoryConfig =
                  CATEGORIES[category as keyof typeof CATEGORIES];
                if (!categoryConfig) return null;

                const Icon = categoryConfig.icon;

                return (
                  <div
                    key={category}
                    className="bg-card border border-border rounded-lg overflow-hidden"
                    style={{
                      animation: "fadeInUp 0.5s ease-out",
                    }}
                  >
                    {/* Category Header */}
                    <div className="px-6 py-4 border-b border-border bg-muted">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 bg-${categoryConfig.color}-500/10 rounded-lg`}
                        >
                          <Icon
                            className={`w-5 h-5 text-${categoryConfig.color}-400`}
                          />
                        </div>
                        <h2 className="font-display text-xl text-foreground uppercase tracking-wider">
                          {categoryConfig.label}
                        </h2>
                      </div>
                    </div>

                    {/* Settings Fields */}
                    <div className="p-6 space-y-6">
                      {categorySettings.map((setting) => {
                        const currentValue = getValue(setting);
                        const isPassword = isPasswordField(setting.key);
                        const isEmail = isEmailField(setting.key);
                        const isNumber = isNumberField(setting.key);
                        const isBoolean = isBooleanField(
                          setting.key,
                          setting.value,
                        );

                        return (
                          <div
                            key={setting.key}
                            className="group hover:bg-muted p-4 rounded-lg transition-all duration-320"
                          >
                            <div className="flex items-start justify-between gap-6">
                              {/* Setting Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <label className="text-sm font-medium text-foreground uppercase tracking-wider">
                                    {setting.key
                                      .replace(/([A-Z])/g, " $1")
                                      .replace(/^./, (str) =>
                                        str.toUpperCase(),
                                      )}
                                  </label>
                                  {editedValues[setting.key] !== undefined && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded border border-amber-500/20">
                                      <AlertCircle className="w-3 h-3" />
                                      Modified
                                    </span>
                                  )}
                                </div>
                                {setting.description && (
                                  <p className="text-xs text-muted-foreground mb-3">
                                    {setting.description}
                                  </p>
                                )}

                                {/* Input Field */}
                                <div className="flex items-center gap-2">
                                  {isBoolean ? (
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={currentValue === true}
                                        onChange={(e) =>
                                          handleChange(
                                            setting.key,
                                            e.target.checked,
                                          )
                                        }
                                        className="sr-only peer"
                                      />
                                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-amber-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                      <span className="ml-3 text-sm text-muted-foreground">
                                        {currentValue === true
                                          ? "Enabled"
                                          : "Disabled"}
                                      </span>
                                    </label>
                                  ) : (
                                    <div className="relative flex-1 max-w-md">
                                      <input
                                        type={
                                          isPassword &&
                                          !showPassword[setting.key]
                                            ? "password"
                                            : isNumber
                                              ? "number"
                                              : isEmail
                                                ? "email"
                                                : "text"
                                        }
                                        value={currentValue || ""}
                                        onChange={(e) => {
                                          const val = isNumber
                                            ? parseInt(e.target.value) || 0
                                            : e.target.value;
                                          handleChange(setting.key, val);
                                        }}
                                        className="w-full px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-command-blue/50 focus:border-command-blue/50 transition-all pr-10"
                                        placeholder={
                                          isPassword
                                            ? "••••••••"
                                            : isEmail
                                              ? "email@example.com"
                                              : ""
                                        }
                                      />
                                      {isPassword && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setShowPassword((prev) => ({
                                              ...prev,
                                              [setting.key]: !prev[setting.key],
                                            }))
                                          }
                                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                          {showPassword[setting.key] ? (
                                            <EyeOff className="w-4 h-4" />
                                          ) : (
                                            <Eye className="w-4 h-4" />
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Audit Info */}
                                {setting.updatedAt && (
                                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>
                                        Last updated:{" "}
                                        {formatTimestamp(setting.updatedAt)}
                                      </span>
                                    </div>
                                    {setting.updatedBy && (
                                      <div className="flex items-center gap-1">
                                        <span>
                                          by {setting.updatedBy.fullName}
                                        </span>
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

                    {/* Test Email Panel (only for notification category) */}
                    {category === "notification" && (
                      <div className="px-6 py-4 border-t border-border bg-muted">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-warning-amber mb-2 uppercase tracking-wider">
                              Test Email Configuration
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                placeholder="Enter email address to test"
                                className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-command-blue/50 focus:border-command-blue/50 transition-all"
                              />
                              <button
                                onClick={handleTestEmail}
                                disabled={
                                  !testEmail || testEmailMutation.isPending
                                }
                                className="flex items-center gap-2 px-6 py-2.5 bg-warning-amber/10 hover:bg-warning-amber/20 border border-warning-amber/30 text-warning-amber rounded-lg transition-all duration-320 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Mail className="w-4 h-4" />
                                <span className="font-medium">
                                  {testEmailMutation.isPending
                                    ? "Sending..."
                                    : "Send Test"}
                                </span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {testEmailResult && (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${
                              testEmailResult.success
                                ? "bg-green-500/10 border-green-500/30 text-green-400"
                                : "bg-red-500/10 border-red-500/30 text-red-400"
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              {testEmailResult.success ? (
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              ) : (
                                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              )}
                              <span className="text-sm">
                                {testEmailResult.message}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              },
            )}

            {/* Save Banner (sticky when there are changes) */}
            {hasChanges && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-card border border-warning-amber/50 rounded-lg shadow-2xl shadow-warning-amber/30 px-6 py-4 flex items-center gap-4 z-50">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <div>
                  <div className="text-sm font-medium text-foreground uppercase tracking-wider">
                    You have unsaved changes
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {Object.keys(editedValues).length} setting(s) modified
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-warning-amber hover:bg-warning-amber-dark text-white rounded-lg transition-all duration-320 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                >
                  <Save className="w-4 h-4" />
                  <span className="font-medium">
                    {updateMutation.isPending ? "Saving..." : "Save All"}
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
