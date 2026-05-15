import { useEffect, useState } from 'react';

export interface Community {
  id: string;
  name: string;
  description: string;
  lead?: string;
  joining_form?: string;
  events?: string[];
  members?: number;
  image?: string;
  instagram?: string;
  category?: string;
  meetingSchedule?: string;
}

const CACHE_KEY = 'communities_cache';
const CACHE_TIME_KEY = 'communities_cache_time';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes client cache
const SERVER_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes server cache

export const useCommunities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invalidate cache and refetch
  const invalidateCache = () => {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_TIME_KEY);
    localStorage.removeItem(`${CACHE_KEY}_duration`);
    console.log('🔄 Cache invalidated');
  };

  const fetchCommunities = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check client-side cache first
      if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        const cacheTime = localStorage.getItem(CACHE_TIME_KEY);
        const now = Date.now();

        if (cached && cacheTime) {
          const age = now - parseInt(cacheTime);

          if (age < CACHE_DURATION) {
            console.log(`✅ Using cached communities (${Math.round(age / 1000)}s old)`);
            setCommunities(JSON.parse(cached));
            setLoading(false);
            return;
          }
        }
      }

      // Fetch from API
      console.log('🌐 Fetching communities from API...');
      const response = await fetch('/api/communities', {
        headers: {
          'Cache-Control': 'public, max-age=900', // Server-side caching
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch communities: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle both response formats (Vercel wraps in { communities }, Express returns array)
      const communitiesList = Array.isArray(data) ? data : (data.communities || []);

      // Update client cache
      const now = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(communitiesList));
      localStorage.setItem(CACHE_TIME_KEY, now.toString());

      console.log(`✅ Loaded ${communitiesList.length} communities from API`);
      setCommunities(communitiesList);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load communities';
      console.error('Error fetching communities:', err);

      // Try fallback to cache even if expired
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached && communities.length === 0) {
        console.log('⚠️ Using stale cache due to API error');
        setCommunities(JSON.parse(cached));
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const refetch = (forceRefresh = true) => {
    fetchCommunities(forceRefresh);
  };

  return { communities, loading, error, refetch, invalidateCache };
};
