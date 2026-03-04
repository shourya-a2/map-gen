import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'wayarena-custom-maps';
const MAX_MAPS = 20;

/**
 * Custom hook for managing custom maps with localStorage persistence
 * @returns {Object} - { maps, addMap, deleteMap, updateMap, isAtLimit, warning }
 */
export const useMapStore = () => {
  const [maps, setMaps] = useState([]);
  const [warning, setWarning] = useState(null);

  // Load maps from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setMaps(parsed);
        }
      }
    } catch (error) {
      console.error('Failed to load maps from localStorage:', error);
    }
  }, []);

  // Persist maps to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
    } catch (error) {
      console.error('Failed to save maps to localStorage:', error);
    }
  }, [maps]);

  // Add a new map
  const addMap = useCallback((newMap) => {
    if (maps.length >= MAX_MAPS) {
      setWarning(`You've reached the maximum of ${MAX_MAPS} maps! Delete some to create more.`);
      setTimeout(() => setWarning(null), 4000);
      return false;
    }

    const mapWithDefaults = {
      id: newMap.id || crypto.randomUUID(),
      prompt: newMap.prompt || 'Untitled Map',
      thumbnailUrl: newMap.thumbnailUrl,
      createdAt: newMap.createdAt || Date.now(),
      rarity: newMap.rarity || 'common',
    };

    setMaps((prev) => [mapWithDefaults, ...prev]);
    return true;
  }, [maps.length]);

  // Delete a map by ID
  const deleteMap = useCallback((mapId) => {
    setMaps((prev) => prev.filter((map) => map.id !== mapId));
  }, []);

  // Update a map by ID
  const updateMap = useCallback((mapId, updates) => {
    setMaps((prev) =>
      prev.map((map) =>
        map.id === mapId ? { ...map, ...updates } : map
      )
    );
  }, []);

  // Clear warning
  const clearWarning = useCallback(() => {
    setWarning(null);
  }, []);

  return {
    maps,
    addMap,
    deleteMap,
    updateMap,
    isAtLimit: maps.length >= MAX_MAPS,
    warning,
    clearWarning,
    maxMaps: MAX_MAPS,
  };
};

export default useMapStore;
