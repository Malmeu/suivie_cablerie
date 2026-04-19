import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CABLE_TYPES, FLOORS, BLOCKS_PER_FLOOR, STATUS } from '../data/cableTypes';

const TrackingContext = createContext(null);

/**
 * Initialise les données de suivi pour tous les étages/blocs/câbles
 */
const initializeTrackingData = () => {
  const data = {};
  FLOORS.forEach(floor => {
    data[floor.id] = {};
    for (let block = 1; block <= BLOCKS_PER_FLOOR; block++) {
      data[floor.id][block] = {};
      CABLE_TYPES.forEach(cable => {
        data[floor.id][block][cable.id] = {
          status: STATUS.NOT_STARTED.id,
          notes: '',
          lastUpdated: null,
          updatedBy: '',
        };
      });
    }
  });
  return data;
};

/**
 * Charge les données depuis le localStorage
 */
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem('cabletrack_data');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Erreur de chargement des données:', e);
  }
  return initializeTrackingData();
};

export function TrackingProvider({ children }) {
  const [trackingData, setTrackingData] = useState(loadFromStorage);
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());

  // Sauvegarde automatique dans le localStorage
  useEffect(() => {
    localStorage.setItem('cabletrack_data', JSON.stringify(trackingData));
  }, [trackingData]);

  /**
   * Met à jour le statut d'un câblage pour un bloc donné
   */
  const updateCableStatus = useCallback((floorId, blockNum, cableId, status, notes = '', updatedBy = '') => {
    setTrackingData(prev => {
      const newData = { ...prev };
      newData[floorId] = { ...newData[floorId] };
      newData[floorId][blockNum] = { ...newData[floorId][blockNum] };
      newData[floorId][blockNum][cableId] = {
        status,
        notes,
        lastUpdated: new Date().toISOString(),
        updatedBy,
      };
      return newData;
    });
    setLastUpdate(new Date().toISOString());
  }, []);

  /**
   * Met à jour tous les câblages d'un bloc en une fois
   */
  const updateBlockStatus = useCallback((floorId, blockNum, statusId) => {
    setTrackingData(prev => {
      const newData = { ...prev };
      newData[floorId] = { ...newData[floorId] };
      newData[floorId][blockNum] = { ...newData[floorId][blockNum] };
      CABLE_TYPES.forEach(cable => {
        newData[floorId][blockNum][cable.id] = {
          ...newData[floorId][blockNum][cable.id],
          status: statusId,
          lastUpdated: new Date().toISOString(),
        };
      });
      return newData;
    });
    setLastUpdate(new Date().toISOString());
  }, []);

  /**
   * Calcule les statistiques pour un bloc donné
   */
  const getBlockStats = useCallback((floorId, blockNum) => {
    const blockData = trackingData[floorId]?.[blockNum];
    if (!blockData) return { total: 0, completed: 0, inProgress: 0, notStarted: 0, issues: 0, percentage: 0 };

    const stats = { total: CABLE_TYPES.length, completed: 0, inProgress: 0, notStarted: 0, issues: 0 };
    CABLE_TYPES.forEach(cable => {
      const status = blockData[cable.id]?.status;
      if (status === STATUS.COMPLETED.id) stats.completed++;
      else if (status === STATUS.IN_PROGRESS.id) stats.inProgress++;
      else if (status === STATUS.ISSUE.id) stats.issues++;
      else stats.notStarted++;
    });
    stats.percentage = Math.round((stats.completed / stats.total) * 100);
    return stats;
  }, [trackingData]);

  /**
   * Calcule les statistiques pour un étage entier
   */
  const getFloorStats = useCallback((floorId) => {
    const total = BLOCKS_PER_FLOOR * CABLE_TYPES.length;
    let completed = 0, inProgress = 0, notStarted = 0, issues = 0;

    for (let block = 1; block <= BLOCKS_PER_FLOOR; block++) {
      const blockStats = getBlockStats(floorId, block);
      completed += blockStats.completed;
      inProgress += blockStats.inProgress;
      notStarted += blockStats.notStarted;
      issues += blockStats.issues;
    }

    return {
      total,
      completed,
      inProgress,
      notStarted,
      issues,
      percentage: Math.round((completed / total) * 100),
    };
  }, [getBlockStats]);

  /**
   * Calcule les statistiques globales
   */
  const getGlobalStats = useCallback(() => {
    const total = FLOORS.length * BLOCKS_PER_FLOOR * CABLE_TYPES.length;
    let completed = 0, inProgress = 0, notStarted = 0, issues = 0;

    FLOORS.forEach(floor => {
      const floorStats = getFloorStats(floor.id);
      completed += floorStats.completed;
      inProgress += floorStats.inProgress;
      notStarted += floorStats.notStarted;
      issues += floorStats.issues;
    });

    return {
      total,
      completed,
      inProgress,
      notStarted,
      issues,
      percentage: Math.round((completed / total) * 100),
    };
  }, [getFloorStats]);

  /**
   * Statistiques par type de câble (global)
   */
  const getCableTypeStats = useCallback((cableId) => {
    const total = FLOORS.length * BLOCKS_PER_FLOOR;
    let completed = 0, inProgress = 0, notStarted = 0, issues = 0;

    FLOORS.forEach(floor => {
      for (let block = 1; block <= BLOCKS_PER_FLOOR; block++) {
        const status = trackingData[floor.id]?.[block]?.[cableId]?.status;
        if (status === STATUS.COMPLETED.id) completed++;
        else if (status === STATUS.IN_PROGRESS.id) inProgress++;
        else if (status === STATUS.ISSUE.id) issues++;
        else notStarted++;
      }
    });

    return { total, completed, inProgress, notStarted, issues, percentage: Math.round((completed / total) * 100) };
  }, [trackingData]);

  /**
   * Réinitialise toutes les données
   */
  const resetAllData = useCallback(() => {
    const freshData = initializeTrackingData();
    setTrackingData(freshData);
    setLastUpdate(new Date().toISOString());
  }, []);

  const value = {
    trackingData,
    lastUpdate,
    updateCableStatus,
    updateBlockStatus,
    getBlockStats,
    getFloorStats,
    getGlobalStats,
    getCableTypeStats,
    resetAllData,
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking doit être utilisé à l\'intérieur d\'un TrackingProvider');
  }
  return context;
}
