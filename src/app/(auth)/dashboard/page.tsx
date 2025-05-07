"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseBrowserClient";
import type { User } from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image_url: string | null;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalFlights: 0,
    safetyReports: 0,
    pendingActions: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      // TODO: Load actual dashboard data from Supabase
      setStats({
        totalFlights: 150,
        safetyReports: 12,
        pendingActions: 3
      });
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <section className="flex-1 p-10 bg-gradient-to-br from-white via-sky-50 to-purple-50">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="w-64 h-8 bg-gray-200 animate-pulse rounded"></div>
          <div className="w-full h-4 bg-gray-200 animate-pulse rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow p-6">
                <div className="w-32 h-4 bg-gray-200 animate-pulse rounded mb-4"></div>
                <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 p-10 bg-gradient-to-br from-white via-sky-50 to-purple-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Your Dashboard</h1>
        <p className="text-gray-600">Here's an overview of your flight school's safety metrics</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Total Flights</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.totalFlights}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Safety Reports</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.safetyReports}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-gray-600 font-medium mb-2">Pending Actions</h3>
            <p className="text-3xl font-bold text-indigo-600">{stats.pendingActions}</p>
          </div>
        </div>
      </div>
    </section>
  );
} 