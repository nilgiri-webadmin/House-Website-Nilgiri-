
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Meetup {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  organizer: string;
  attendees?: number;
  is_past: boolean;
  has_attended?: boolean;
  image_url?: string;
  register_link?: string;
}

export function useMeetups(limit?: number, isPast?: boolean) {
  const queryKey = ['meetups', limit, isPast];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.getMeetups({ limit, isPast });
      return response.meetups;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    onError: (err: Error) => {
      console.error("Error fetching meetups:", err);
      toast.error("Failed to load meetups");
    },
  });

  return {
    meetups: data || [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
