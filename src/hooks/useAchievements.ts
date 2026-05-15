
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Achievement {
  id: string;
  student_name: string;
  title: string;
  description: string;
  date: string;
  category: string;
  image: string;
}

export function useAchievements(limit?: number, category?: string) {
  const queryKey = ["achievements", limit, category];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const res = await api.getAchievements({ limit, category });
        console.log('Achievements data:', res);
        return res.achievements;
      } catch (err) {
        console.error('Error in queryFn:', err);
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
  });

  if (error) {
    console.error("Error fetching achievements:", error);
    toast.error("Failed to load achievements");
  }

  return { achievements: data || [], loading: isLoading, error: error as Error | null, refetch };
}
