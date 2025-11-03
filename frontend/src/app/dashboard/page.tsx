"use client";

import Navbar from "@/components/ui/nav-bar";
import ProtectedRoute from "@/components/auth/protected-route";
import ActiveRoomsPanel from "@/components/dashboard/active-rooms-panel";
import PastRoomsPanel from "@/components/dashboard/past-rooms-panel";
import { useDashboardData } from "@/hooks/use-dashboard-data";

export default function DashboardPage() {
  const { activeRooms, pastRooms, isLoading, error } = useDashboardData();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#d4eaf8]">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-[#20222E] mb-2">Dashboard</h1>
            <p className="text-lg text-gray-600">Manage your active and past practice rooms</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-semibold">Error loading rooms</p>
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <p className="text-lg text-gray-600">Loading rooms...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ActiveRoomsPanel rooms={activeRooms} />
              </div>

              <div>
                <PastRoomsPanel rooms={pastRooms} />
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
