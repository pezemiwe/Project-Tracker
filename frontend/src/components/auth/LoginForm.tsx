import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { FormField } from "../ui/form-field";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { useLogin } from "../../hooks/useAuth";
import { toast } from "../../hooks/useToast";
import { ShieldCheck, Lock, Mail, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.coerce.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@donor-oversight.local",
      password: "Admin123!@#",
      rememberMe: false,
    },
  });

  const { mutate: login, isPending, error, isSuccess } = useLogin();

  useEffect(() => {
    document.title = "Login | Donor Investment Oversight";
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        variant: "error",
        title: "LOGIN FAILED",
        description: error.message || "Invalid credentials. Please try again.",
      });
    }
  }, [error]);

  useEffect(() => {
    if (isSuccess) {
      toast({
        variant: "success",
        title: "LOGIN SUCCESSFUL",
        description: "Welcome back! Redirecting to dashboard...",
      });
    }
  }, [isSuccess]);

  const onSubmit = (data: LoginFormData) => {
    const { rememberMe: _rememberMe, ...credentials } = data;
    login(credentials);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1a365d]/[0.02] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#1a365d]/[0.015] rounded-full -translate-x-1/3 translate-y-1/3" />

        <div className="absolute top-20 left-10 w-2 h-2 bg-[#1a365d]/20 rounded-full" />
        <div className="absolute top-40 right-32 w-1.5 h-1.5 bg-[#1a365d]/15 rounded-full" />
        <div className="absolute bottom-32 left-20 w-2 h-2 bg-[#1a365d]/20 rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-[#1a365d]/15 rounded-full" />
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-[#1a365d]/20 rounded-full" />
        <div className="absolute top-2/3 left-1/4 w-1.5 h-1.5 bg-[#1a365d]/15 rounded-full" />

        <div className="absolute top-1/4 right-1/3 w-16 h-16 border border-[#1a365d]/10 rounded-full" />
        <div className="absolute bottom-1/4 left-1/4 w-20 h-20 border border-[#1a365d]/10 rounded-full" />
      </div>
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl font-bold text-[#1a365d] mb-2">
            Donor Investment Oversight
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            Donor-Funded Programs Monitoring Platform
          </p>
        </div>

        <Card className="border-0 shadow-2xl shadow-black/20 backdrop-blur-sm bg-white animate-in fade-in slide-in-from-bottom-4 duration-700 relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-32 h-32 border-4 border-[#059669]/20 rounded-full" />
          <div className="absolute -top-20 -right-20 w-40 h-40 border-2 border-[#1a365d]/10 rounded-full" />

          <CardHeader className="space-y-3 pb-6 relative z-10">
            <div className="flex items-center gap-2 justify-center">
              <ShieldCheck
                className="w-6 h-6 text-[#059669]"
                aria-hidden="true"
              />
              <CardTitle className="text-2xl text-center text-slate-800">
                Secure Access
              </CardTitle>
            </div>
            <CardDescription className="text-center text-slate-600">
              Sign in to access the oversight dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8 relative z-10">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <FormField
                label="Email Address"
                htmlFor="email"
                error={errors.email?.message}
                required
              >
                <div className="relative group">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1a365d] transition-colors"
                    aria-hidden="true"
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    placeholder="your.email@example.com"
                    {...register("email")}
                    disabled={isPending}
                    aria-invalid={!!errors.email}
                    className="pl-11 h-12 bg-slate-50/50 border-slate-200 focus:border-[#1a365d] focus:ring-[#1a365d]/20 transition-all font-medium text-slate-800"
                  />
                </div>
              </FormField>

              <FormField
                label="Password"
                htmlFor="password"
                error={errors.password?.message}
                required
              >
                <div className="relative group">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1a365d] transition-colors"
                    aria-hidden="true"
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your secure password"
                    {...register("password")}
                    disabled={isPending}
                    aria-invalid={!!errors.password}
                    className="pl-11 pr-11 h-12 bg-slate-50/50 border-slate-200 focus:border-[#1a365d] focus:ring-[#1a365d]/20 transition-all font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1a365d]/20 transition-all"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </FormField>

              <div className="flex items-center justify-between text-sm text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      {...register("rememberMe")}
                      className="peer h-4 w-4 rounded border-slate-300 text-[#059669] focus:ring-[#059669] focus:ring-offset-0 cursor-pointer"
                    />
                  </div>
                  <span className="group-hover:text-slate-800 transition-colors">
                    Remember me
                  </span>
                </label>
                <a
                  href="/forgot-password"
                  className="font-medium text-[#059669] hover:text-[#059669]/80 hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#059669]/20 rounded-sm"
                >
                  Forgot password?
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold shadow-lg shadow-[#1a365d]/30 hover:shadow-[#1a365d]/40 transition-all duration-300 bg-gradient-to-r from-[#1a365d] to-[#1a365d]/90 hover:from-[#1a365d]/90 hover:to-[#1a365d]"
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  "Sign In to Dashboard"
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck
                  className="w-4 h-4 text-[#059669]"
                  aria-hidden="true"
                />
                <span>Protected by enterprise-grade security</span>
              </div>
            </div>
            {/* <div className="text-center text-xs text-slate-500">
              Need help?{" "}
              <a
                href="#"
                className="text-[#059669] hover:text-[#059669]/80 hover:no-underline"
              >
                Contact your System Administrator
              </a>
            </div> */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
