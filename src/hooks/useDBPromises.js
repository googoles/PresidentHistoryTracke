/**
 * Hook to fetch and transform promises data from DB
 */
import { useState, useEffect } from 'react';
import { useElectionData } from '../contexts/ElectionDataContext';
import { transformPledgesToPromises, groupPromisesByRegion } from '../data/promises';

export function useDBPromises() {
  const [promises, setPromises] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { dataSource } = useElectionData();

  useEffect(() => {
    async function fetchPromises() {
      try {
        setLoading(true);
        setError(null);

        // Get all pledges
        const allPledges = await dataSource.getAllPledges();

        // Get all winners to create candidate map
        const winners = await dataSource.getAllWinners();

        // Transform pledges to promises
        const transformedPromises = transformPledgesToPromises(allPledges, winners);

        // Group by region
        const groupedPromises = groupPromisesByRegion(transformedPromises);

        setPromises(groupedPromises);
      } catch (err) {
        console.error('Failed to fetch promises:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (dataSource) {
      fetchPromises();
    }
  }, [dataSource]);

  return { promises, loading, error };
}
