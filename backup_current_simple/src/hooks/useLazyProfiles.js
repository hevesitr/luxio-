import { useState, useEffect, useCallback } from 'react';
import Logger from '../services/Logger';

/**
 * useLazyProfiles Hook
 * 
 * Implements lazy loading for discovery feed profiles
 * Loads profiles in batches to improve performance
 * 
 * @param {Function} fetchProfiles - Function to fetch profiles
 * @param {number} batchSize - Number of profiles to load per batch (default: 10)
 * @returns {Object} - { profiles, loading, error, loadMore, hasMore, reset }
 */
const useLazyProfiles = (fetchProfiles, batchSize = 10) => {
  const [profiles, setProfiles] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Initial load
  useEffect(() => {
    loadInitialProfiles();
  }, []);

  const loadInitialProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await fetchProfiles();
      
      if (result.success && result.data) {
        setAllProfiles(result.data);
        
        // Load first batch
        const firstBatch = result.data.slice(0, batchSize);
        setProfiles(firstBatch);
        setCurrentBatch(1);
        setHasMore(result.data.length > batchSize);
        
        Logger.success('Lazy profiles loaded', {
          total: result.data.length,
          loaded: firstBatch.length,
        });
      } else {
        setError('Failed to load profiles');
        setHasMore(false);
      }
    } catch (err) {
      Logger.error('Lazy profiles load error', err);
      setError(err.message || 'Unknown error');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // Load more profiles
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;

    const startIndex = currentBatch * batchSize;
    const endIndex = startIndex + batchSize;
    const nextBatch = allProfiles.slice(startIndex, endIndex);

    if (nextBatch.length > 0) {
      setProfiles((prev) => [...prev, ...nextBatch]);
      setCurrentBatch((prev) => prev + 1);
      setHasMore(endIndex < allProfiles.length);
      
      Logger.debug('Loaded more profiles', {
        batch: currentBatch + 1,
        count: nextBatch.length,
        total: profiles.length + nextBatch.length,
      });
    } else {
      setHasMore(false);
    }
  }, [loading, hasMore, currentBatch, allProfiles, batchSize, profiles.length]);

  // Reset to initial state
  const reset = useCallback(() => {
    setProfiles([]);
    setAllProfiles([]);
    setCurrentBatch(0);
    setHasMore(true);
    setError(null);
    loadInitialProfiles();
  }, []);

  return {
    profiles,
    loading,
    error,
    loadMore,
    hasMore,
    reset,
  };
};

export default useLazyProfiles;
