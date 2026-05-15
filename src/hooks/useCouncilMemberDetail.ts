import { useEffect, useState } from 'react';

export interface CouncilMemberDetail {
  id: string;
  name: string;
  position: string;
  profile_photo_url: string;
  bio?: string;
  email?: string;
}

export const useCouncilMemberDetail = (name?: string) => {
  const [member, setMember] = useState<CouncilMemberDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!name) {
      setMember(null);
      return;
    }

    const fetchMember = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch council member by name
        const response = await fetch(
          `/api/council?search=${encodeURIComponent(name)}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch council member: ${response.statusText}`);
        }

        const data = await response.json();
        const members = Array.isArray(data) ? data : (data.members || []);

        // Find exact match or first match
        const found = members.find(
          (m: CouncilMemberDetail) =>
            m.name.toLowerCase() === name.toLowerCase()
        ) || members[0];

        if (found) {
          setMember(found);
        } else {
          setError('Council member not found');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load council member';
        console.error('Error fetching council member:', err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [name]);

  return { member, loading, error };
};
