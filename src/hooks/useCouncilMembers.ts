
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface CouncilMember {
  id: string;
  name: string;
  position: string;
  bio?: string;
  image?: string;
  email?: string;
  linkedin?: string;
  region?: string;
  team?: string;
  profile_photo_url?: string;
}

export function useCouncilMembers(team?: string, region?: string) {
  const queryKey = ["council", team, region];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api.getCouncil({ team, region });
      return res.council;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    onError: (err: Error) => {
      console.error("Error fetching council members:", err);
      toast.error("Failed to load council members");
    },
  });

  return { councilMembers: data || [], loading: isLoading, error: error as Error | null, refetch };
}
