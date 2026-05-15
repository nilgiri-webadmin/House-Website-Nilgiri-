
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  image?: string;
  image_url?: string;
  is_past: boolean;
  club_id?: string;
  category?: string;
  register_link?: string;
}

export function useEvents(limit?: number, isPast?: boolean, category?: string) {
  const queryKey = ['events', limit, isPast, category];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await api.getEvents({ limit, isPast, category });
      return response.events;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    onError: (err: Error) => {
      console.error("Error fetching events:", err);
      toast.error("Failed to load events");
    },
  });

  return {
    events: data || [],
    loading: isLoading,
    error: error as Error | null,
    refetch,
  };
}
