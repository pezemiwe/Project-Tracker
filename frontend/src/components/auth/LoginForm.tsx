import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { FormField } from '../ui/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useLogin } from '../../hooks/useAuth';
import { toast } from '../../hooks/useToast';
import { ShieldCheck, Lock, Mail } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const { mutate: login, isPending, error, isSuccess } = useLogin();

  useEffect(() => {
    if (error) {
      toast({
        variant: "error",
        title: "LOGIN FAILED",
        description: error.message || 'Invalid credentials. Please try again.',
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
    login(data);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-100/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent mb-2">
            Donor Investment Oversight
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            Donor-Funded Programs Monitoring Platform
          </p>
        </div>

        <Card className="border-0 shadow-2xl shadow-blue-100/50 backdrop-blur-sm bg-white/95 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex items-center gap-2 justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-2xl text-center text-slate-800">Secure Access</CardTitle>
            </div>
            <CardDescription className="text-center text-slate-600">
              Sign in to access the oversight dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                label="Email Address"
                htmlFor="email"
                error={errors.email?.message}
                required
              >
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    {...register('email')}
                    disabled={isPending}
                    error={errors.email?.message}
                    className="pl-11 h-12 bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </FormField>

              <FormField
                label="Password"
                htmlFor="password"
                error={errors.password?.message}
                required
              >
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your secure password"
                    {...register('password')}
                    disabled={isPending}
                    error={errors.password?.message}
                    className="pl-11 h-12 bg-slate-50/50 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
              </FormField>

              <Button 
                type="submit" 
                className="w-full h-12 font-semibold shadow-lg shadow-blue-200/50 transition-all duration-300" 
                disabled={isPending}
              >
                {isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Sign In to Dashboard'
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Protected by enterprise-grade security</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
