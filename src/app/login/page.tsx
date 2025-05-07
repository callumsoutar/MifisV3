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
  remember: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
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
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex overflow-hidden">
        {/* Left: Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center">
          <div className="mb-8">
            <span className="text-xs font-semibold text-purple-700 tracking-widest uppercase">Aero Safety</span>
            <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-1">Holla, Welcome Back</h1>
            <p className="text-gray-500 text-base">Hey, welcome back to your special place</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <Input
                type="email"
                placeholder="Email"
                {...register("email")}
                className={`h-12 ${errors.email ? "border-red-500" : ""}`}
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
                className={`h-12 ${errors.password ? "border-red-500" : ""}`}
                autoComplete="current-password"
                required
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("remember")}
                  className="accent-purple-600 w-4 h-4 rounded border-gray-300 focus:ring-2 focus:ring-purple-500"
                />
                <span className="text-gray-700">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-purple-700 hover:underline">Forgot Password?</Link>
            </div>
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="text-center text-sm text-gray-700 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-purple-700 font-semibold hover:underline">Sign Up</Link>
          </div>
        </div>
        {/* Right: Illustration */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-400 to-blue-400 items-center justify-center">
          {/* Replace this div with your SVG/illustration */}
          <div className="flex flex-col items-center">
            <div className="w-72 h-72 bg-white/30 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-6xl">🔒</span>
            </div>
            <p className="mt-8 text-white text-lg font-medium text-center max-w-xs">Secure access to your Aero Safety dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
} 