/**
 * Hook to fetch and transform officials data from DB
 */
import { useState, useEffect } from 'react';
import { useElectionData } from '../contexts/ElectionDataContext';
import { transformCandidateToOfficial } from '../data/officials';

export function useDBOfficials() {
  const [officials, setOfficials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dataSource } = useElectionData();

  useEffect(() => {
    async function fetchOfficials() {
      try {
        setLoading(true);
        setError(null);

        // Get all winners
        const winners = await dataSource.getAllWinners();

        // Transform each winner with their pledges and statistics
        const transformedOfficials = await Promise.all(
          winners.map(async (candidate) => {
            const pledges = await dataSource.getPledgesByCandidate(candidate.hubo_id);
            const statistics = await dataSource.getPledgeStatistics(candidate.hubo_id);
            return transformCandidateToOfficial(candidate, pledges, statistics);
          })
        );

        setOfficials(transformedOfficials);
      } catch (err) {
        console.error('Failed to fetch officials:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (dataSource) {
      fetchOfficials();
    }
  }, [dataSource]);

  return { officials, loading, error };
}
