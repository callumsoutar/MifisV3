"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabaseBrowserClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
        },
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-400 via-sky-400 to-purple-500">
      <div className="w-full max-w-4xl flex rounded-3xl shadow-2xl overflow-hidden bg-white/90 backdrop-blur-md">
        {/* Left: Form */}
        <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
          <div className="mb-8">
            <span className="text-xs font-semibold text-purple-700 tracking-widest uppercase">Aero Safety</span>
            <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-1">Create your account</h1>
            <p className="text-gray-500 text-base">Sign up to get started with Aero Safety</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex gap-4">
              <div className="w-1/2">
                <Input
                  type="text"
                  placeholder="First Name"
                  {...register("first_name")}
                  className={`h-12 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${errors.first_name ? "border-red-500" : ""}`}
                  autoComplete="given-name"
                  required
                />
                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>}
              </div>
              <div className="w-1/2">
                <Input
                  type="text"
                  placeholder="Last Name"
                  {...register("last_name")}
                  className={`h-12 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${errors.last_name ? "border-red-500" : ""}`}
                  autoComplete="family-name"
                  required
                />
                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>}
              </div>
            </div>
            <div>
              <Input
                type="email"
                placeholder="Email"
                {...register("email")}
                className={`h-12 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${errors.email ? "border-red-500" : ""}`}
                autoComplete="email"
                required
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                {...register("password")}
                className={`h-12 rounded-lg border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 ${errors.password ? "border-red-500" : ""}`}
                autoComplete="new-password"
                required
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white shadow-md transition-colors duration-200" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </Button>
          </form>
          <div className="text-center text-sm text-gray-700 mt-8">
            Already have an account?{' '}
            <Link href="/login" className="text-purple-700 font-semibold hover:underline">Log in</Link>
          </div>
        </div>
        {/* Right: Illustration */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-500 via-indigo-400 to-sky-400 items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-72 h-72 bg-white/30 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-7xl">🛫</span>
            </div>
            <p className="mt-8 text-white text-lg font-medium text-center max-w-xs drop-shadow">Join Aero Safety and elevate your aviation safety management</p>
          </div>
        </div>
      </div>
    </div>
  );
} 