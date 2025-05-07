"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabaseBrowserClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";

const schema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  contact_email: z.string().email("Invalid email address"),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function CreateOrganizationPage() {
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

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Start a transaction by creating the organization
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          description: data.description || null,
          contact_email: data.contact_email,
          contact_phone: data.contact_phone || null,
          address: data.address || null,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create user_organization relationship with owner role
      const { error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: user.id,
          organization_id: org.id,
          role: 'owner',
          status: 'active'
        });

      if (userOrgError) throw userOrgError;

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      console.error('Error creating organization:', err);
      setError(err instanceof Error ? err.message : 'Failed to create organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-sky-100">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-10">
        <div className="mb-8">
          <span className="text-xs font-semibold text-purple-700 tracking-widest uppercase">Aero Safety</span>
          <h1 className="text-4xl font-bold text-gray-900 mt-2 mb-1">Create Your Organization</h1>
          <p className="text-gray-500 text-base">Set up your flight school's organization</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organization Name
            </label>
            <Input
              type="text"
              placeholder="Enter your organization name"
              {...register("name")}
              className={`h-12 ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              placeholder="Describe your organization"
              {...register("description")}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email
            </label>
            <Input
              type="email"
              placeholder="contact@yourschool.com"
              {...register("contact_email")}
              className={`h-12 ${errors.contact_email ? "border-red-500" : ""}`}
            />
            {errors.contact_email && <p className="text-red-500 text-xs mt-1">{errors.contact_email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone
            </label>
            <Input
              type="tel"
              placeholder="Enter contact phone number"
              {...register("contact_phone")}
              className={`h-12 ${errors.contact_phone ? "border-red-500" : ""}`}
            />
            {errors.contact_phone && <p className="text-red-500 text-xs mt-1">{errors.contact_phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <Textarea
              placeholder="Enter organization address"
              {...register("address")}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
          </div>

          {error && (
            <Alert variant="destructive">
              <p>{error}</p>
            </Alert>
          )}

          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
            {loading ? "Creating Organization..." : "Create Organization"}
          </Button>
        </form>
      </div>
    </div>
  );
} 