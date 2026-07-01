import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Activity, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { PasswordRequirementsPopup, PasswordMatchPopup } from "@/components/common/PasswordPopups";
import ThemeToggle from '../../components/common/ThemeToggle';
import CometCardDemo from '../../components/CometCardDemo';
import GridBackground from "@/components/ui/GridBackground";
import DotBackgroundDemo from "@/components/ui/DotBackgroundDemo";
import { toast } from "sonner";
const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string()
    .min(10, 'Phone number must be exactly 10 digits')
    .max(10, 'Phone number must be exactly 10 digits')
    .refine(val => /^\d{10}$/.test(val), {
      message: 'Phone number must be exactly 10 digits'
    }),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine(val => /[a-zA-Z]/.test(val),
      { message: 'Password must contain at least one letter' })
    .refine((val) => /\d/.test(val),
      { message: 'Password must contain at least one number' })
    .refine(val => /[!@#$%^&*]/.test(val),
      { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string().min(8, 'Confirm password is required'),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: "You must agree to the terms to register."
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const passwordValue = form.watch("password") || '';
  const confirmPasswordValue = form.watch("confirmPassword") || '';

  const passwordRegister = form.register("password");
  const confirmPasswordRegister = form.register("confirmPassword");
  const phoneRegister = form.register("phoneNumber");

  const onSubmit = async (values) => {
    setIsLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      const finalValues = { ...values };
      if (finalValues.phoneNumber) {
        finalValues.phoneNumber = `+91${finalValues.phoneNumber}`;
      }

      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalValues),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      form.setError('root', { message: err.message });
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-[#faf9f6] dark:bg-zinc-950 selection:bg-kfintech-primary/30 relative overflow-hidden transition-colors duration-500">
      {/*<GridBackground/>*/}
      <DotBackgroundDemo/>
      {/* Background Glows for Glassmorphism */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-kfintech-primary/10 rounded-full blur-[120px] pointer-events-none z-0 hidden dark:block" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none z-0 hidden dark:block" />

      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-20">
        <Link to="/" className="flex items-center text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to home
        </Link>
      </div>
      <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
          <ThemeToggle />
      </div>

      <div className="w-full max-w-5xl relative z-10 mt-10 mb-10 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-24">
        {/* Registration Form */}
        <div className="w-full max-w-sm">
          <Card className="rounded-2xl border border-black/5 dark:border-white/5 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
            <CardHeader className="space-y-1 text-center pb-6 pt-8">
            <div className="flex justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 dark:bg-white text-zinc-50 dark:text-zinc-900 shadow-inner">
                <Activity className="h-6 w-6 stroke-[2]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Create an account</CardTitle>
            <CardDescription className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter your details to get started
            </CardDescription>
          </CardHeader>

          <CardContent className="pb-8">
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              {form.formState.errors.root && (
                <div className="mb-2 p-3 rounded-md bg-red-50 text-red-600 text-sm font-medium text-center border border-red-100">
                  {form.formState.errors.root.message}
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="name" className="text-zinc-700 dark:text-zinc-300 font-medium">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Jane Doe"
                  className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all"
                  {...form.register("name")}
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-zinc-700 dark:text-zinc-300 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phoneNumber" className="text-zinc-700 dark:text-zinc-300 font-medium">Phone Number</Label>
                <div className="flex gap-2">
                  <div className="flex items-center justify-center px-3 border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900 text-xs text-zinc-500 dark:text-zinc-400 font-medium cursor-not-allowed select-none transition-colors whitespace-nowrap">
                    🇮🇳 +91
                  </div>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    maxLength={10}
                    placeholder="0000000000"
                    className="flex-1 bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-all"
                    {...phoneRegister}
                    onChange={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                      phoneRegister.onChange(e);
                    }}
                  />
                </div>
                {form.formState.errors.phoneNumber && (
                  <p className="text-xs text-red-600">{form.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="grid gap-2 relative">
                <Label htmlFor="password" className="text-zinc-700 dark:text-zinc-300 font-medium">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 transition-all pr-10"
                    onFocus={() => setIsPasswordFocused(true)}
                    onCopy={(e) => e.preventDefault()}
                    {...passwordRegister}
                    onBlur={(e) => {
                      passwordRegister.onBlur(e);
                      setIsPasswordFocused(false);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-9 px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-transparent"
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowPassword(v => !v);
                    }}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <PasswordRequirementsPopup
                  passwordValue={passwordValue}
                  isVisible={isPasswordFocused}
                />

                {form.formState.errors.password && !isPasswordFocused && (
                  <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="grid gap-2 relative">
                <Label htmlFor="confirmPassword" className="text-zinc-700 dark:text-zinc-300 font-medium">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-kfintech-primary text-zinc-900 dark:text-zinc-50 transition-all pr-10"
                    onFocus={() => setIsConfirmPasswordFocused(true)}
                    onCopy={(e) => e.preventDefault()}
                    {...confirmPasswordRegister}
                    onBlur={(e) => {
                      confirmPasswordRegister.onBlur(e);
                      setIsConfirmPasswordFocused(false);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-9 px-3 py-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-transparent"
                    type="button"
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      setShowConfirmPassword(v => !v);
                    }}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>

                <PasswordMatchPopup
                  passwordValue={passwordValue}
                  confirmPasswordValue={confirmPasswordValue}
                  isVisible={isConfirmPasswordFocused}
                />

                {form.formState.errors.confirmPassword && !isConfirmPasswordFocused && (
                  <p className="text-xs text-red-600">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    className="border-zinc-300 dark:border-zinc-700 data-[state=checked]:bg-zinc-900 dark:data-[state=checked]:bg-white data-[state=checked]:text-zinc-50 dark:data-[state=checked]:text-zinc-900 mt-1"
                    checked={form.watch("agreeTerms")}
                    onCheckedChange={(checked) => {
                      form.setValue("agreeTerms", checked, { shouldValidate: true })
                    }}
                  />
                  <label
                    htmlFor="terms"
                    className="text-xs text-zinc-500 dark:text-zinc-400 leading-tight"
                  >
                    I agree to the{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">Terms of Service</a>
                    {' '}and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100">Privacy Policy</a>.
                  </label>
                </div>
                {form.formState.errors.agreeTerms && (
                  <p className="text-xs text-red-600 mt-1">{form.formState.errors.agreeTerms.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading || !form.watch("agreeTerms")} className="w-full mt-2 bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-zinc-50 dark:text-zinc-900 rounded-lg shadow-lg hover:shadow-xl transition-all">
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-zinc-900 dark:text-zinc-100 hover:underline underline-offset-4">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* VIP Comet Card (Right Side) */}
        <div className="hidden md:flex w-full max-w-sm items-center justify-center">
            <CometCardDemo />
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;