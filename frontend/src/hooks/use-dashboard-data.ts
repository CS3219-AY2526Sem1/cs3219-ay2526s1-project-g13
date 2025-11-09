import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { collaborationAPI, RoomDetails } from "@/lib/api-client";

interface UseDashboardDataReturn {
  activeRooms: RoomDetails[];
  pastRooms: RoomDetails[];
  isLoading: boolean;
  error: string | null;
}

export function useDashboardData(): UseDashboardDataReturn {
  const { user } = useAuthContext();
  const [activeRooms, setActiveRooms] = useState<RoomDetails[]>([]);
  const [pastRooms, setPastRooms] = useState<RoomDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!user?.username) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await collaborationAPI.getUserRooms(user.username);

        if (response.success && response.rooms) {
          const active = response.rooms.filter((room) => room.isActive);
          const past = response.rooms.filter((room) => !room.isActive);

          active.sort((a, b) => {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });

          past.sort((a, b) => {
            if (!a.closedAt) return 1;
            if (!b.closedAt) return -1;
            return new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime();
          });

          setActiveRooms(active);
          setPastRooms(past);
        } else {
          setError(response.error || "Failed to fetch rooms");
        }
      } catch (err) {
        console.error("Error fetching rooms:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch rooms");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, [user?.username]);

  return { activeRooms, pastRooms, isLoading, error };
}
