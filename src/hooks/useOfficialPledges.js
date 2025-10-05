/**
 * Hook to fetch a specific official's pledges from DB
 */
import { useState, useEffect } from 'react';
import { useElectionData } from '../contexts/ElectionDataContext';
import { transformPledgeToPromise } from '../data/promises';

export function useOfficialPledges(official) {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dataSource } = useElectionData();

  useEffect(() => {
    async function fetchPledges() {
      if (!official || !dataSource) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        console.log('[useOfficialPledges] Fetching pledges for:', official.name);
        console.log('[useOfficialPledges] Official ID:', official.id);

        // Extract hubo_id from official.id (format: "rep-12345" -> "12345")
        const huboId = official.id.replace('rep-', '');
        console.log('[useOfficialPledges] Hubo ID:', huboId);

        // Fetch pledges from DB
        const dbPledges = await dataSource.getPledgesByCandidate(huboId);
        console.log('[useOfficialPledges] DB Pledges Count:', dbPledges.length);

        // Transform to promise format
        const transformedPledges = dbPledges.map(pledge => {
          const transformed = transformPledgeToPromise(pledge, {
            hubo_id: huboId,
            name: official.name,
            sgg_name: official.district,
            party_name: official.party
          });
          return transformed;
        }).filter(Boolean); // Remove null values

        console.log('[useOfficialPledges] Transformed Pledges Count:', transformedPledges.length);
        console.log('[useOfficialPledges] Sample Transformed Pledge:', transformedPledges[0]);

        setPledges(transformedPledges);
      } catch (err) {
        console.error('[useOfficialPledges] Failed to fetch pledges:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPledges();
  }, [official, dataSource]);

  return { pledges, loading, error };
}
