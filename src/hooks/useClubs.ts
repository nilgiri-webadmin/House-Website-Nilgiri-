
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Club {
  id: string;
  name: string;
  description: string;
  members: number;
  meeting_schedule: string;
  location?: string;
  image: string;
  category?: string;
  vision?: string;
}

export function useClubs(limit?: number) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchClubs() {
      try {
        setLoading(true);
        let query = supabase.from("clubs").select("*");
        
        if (limit) {
          query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setClubs(data || []);
      } catch (err) {
        const error = err as Error;
        console.error("Error fetching clubs:", error);
        setError(error);
        toast.error("Failed to load clubs");
      } finally {
        setLoading(false);
      }
    }

    fetchClubs();
  }, [limit]);

  return { clubs, loading, error };
}
