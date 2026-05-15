import { useEffect, useState } from 'react';

export interface CouncilMember {
  id: string;
  name: string;
  position: string;
  profile_photo_url?: string;
  email?: string;
  bio?: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  image?: string;
  lead_id?: string;
  lead?: CouncilMember;
  joining_form?: string;
  events?: string[];
  instagram?: string;
  created_at?: string;
  updated_at?: string;
}

export const useCommunityDetails = (communityId: string) => {
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch community with lead details (joined from council_members)
        const response = await fetch(`/api/communities/${communityId}?include=lead`);

        if (!response.ok) {
          throw new Error(`Failed to fetch community: ${response.statusText}`);
        }

        const data = await response.json();
        setCommunity(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load community details';
        console.error('Error fetching community:', err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    if (communityId) {
      fetchCommunity();
    }
  }, [communityId]);

  return { community, loading, error };
};