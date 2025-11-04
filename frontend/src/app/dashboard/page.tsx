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
      <div className="h-screen flex flex-col bg-[#d4eaf8] overflow-hidden">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-4 overflow-hidden">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              <p className="font-semibold">Error loading rooms</p>
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg text-gray-600">Loading rooms...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-0">
              <div className="h-full min-h-0">
                <ActiveRoomsPanel rooms={activeRooms} />
              </div>

              <div className="h-full min-h-0">
                <PastRoomsPanel rooms={pastRooms} />
              </div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
