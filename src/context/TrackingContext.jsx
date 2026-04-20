import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CABLE_TYPES, FLOORS, BLOCKS_PER_FLOOR, STATUS } from '../data/cableTypes';
import { supabase, logAction } from '../lib/supabase';

const TrackingContext = createContext(null);

/**
 * Initialise une structure de données vide (structure locale par défaut)
 */
const getInitialEmptyData = () => {
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

export function TrackingProvider({ children }) {
  const [trackingData, setTrackingData] = useState(getInitialEmptyData());
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date().toISOString());

  /**
   * Charge les données de Supabase au démarrage
   */
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cabling_tracking')
        .select('*');

      if (error) throw error;

      if (data && data.length > 0) {
        const newData = getInitialEmptyData();
        data.forEach(item => {
          if (newData[item.floor_id] && newData[item.floor_id][item.block_num]) {
            newData[item.floor_id][item.block_num][item.cable_id] = {
              status: item.status,
              notes: item.notes || '',
              lastUpdated: item.last_updated,
              updatedBy: item.updated_by || '',
            };
          }
        });
        setTrackingData(newData);
      }
    } catch (err) {
      console.error('Erreur lors du chargement Supabase:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();

    // S'abonner aux changements en temps réel
    const subscription = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'cabling_tracking' }, 
        (payload) => {
          const item = payload.new || payload.old;
          if (item) {
            setTrackingData(prev => {
              const next = { ...prev };
              next[item.floor_id] = { ...next[item.floor_id] };
              next[item.floor_id][item.block_num] = { ...next[item.floor_id][item.block_num] };
              next[item.floor_id][item.block_num][item.cable_id] = {
                status: item.status,
                notes: item.notes || '',
                lastUpdated: item.last_updated,
                updatedBy: item.updated_by || '',
              };
              return next;
            });
            setLastUpdate(new Date().toISOString());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [fetchAllData]);

  /**
   * Met à jour un statut dans Supabase (UPSERT)
   */
  const updateCableStatus = useCallback(async (floorId, blockNum, cableId, status, notes = '', updatedBy = '') => {
    const now = new Date().toISOString();
    
    // Optimistic update
    setTrackingData(prev => {
      const newData = { ...prev };
      newData[floorId] = { ...newData[floorId] };
      newData[floorId][blockNum] = { ...newData[floorId][blockNum] };
      newData[floorId][blockNum][cableId] = { status, notes, lastUpdated: now, updatedBy };
      return newData;
    });

    try {
      const { error } = await supabase
        .from('cabling_tracking')
        .upsert({
          floor_id: floorId,
          block_num: blockNum,
          cable_id: cableId,
          status,
          notes,
          last_updated: now,
          updated_by: updatedBy
        }, { onConflict: 'floor_id,block_num,cable_id' });

      if (error) throw error;
      logAction('Mise à jour câble', `Bloc ${blockNum} (${floorId}) - Câble ${cableId} : ${status}`);
    } catch (err) {
      console.error('Erreur de synchro Supabase:', err.message);
      // En cas d'erreur, on pourrait recharger les données pour être à jour
      fetchAllData();
    }
  }, [fetchAllData]);

  /**
   * Met à jour tout un bloc dans Supabase
   */
  const updateBlockStatus = useCallback(async (floorId, blockNum, statusId) => {
    const now = new Date().toISOString();
    
    // Pour les mises à jour en bloc, on prépare les objets pour upsert
    const upsertData = CABLE_TYPES.map(cable => ({
      floor_id: floorId,
      block_num: blockNum,
      cable_id: cable.id,
      status: statusId,
      last_updated: now
    }));

    // Update local
    setTrackingData(prev => {
      const newData = { ...prev };
      newData[floorId] = { ...newData[floorId] };
      newData[floorId][blockNum] = { ...newData[floorId][blockNum] };
      CABLE_TYPES.forEach(cable => {
        newData[floorId][blockNum][cable.id] = {
          ...newData[floorId][blockNum][cable.id],
          status: statusId,
          lastUpdated: now,
        };
      });
      return newData;
    });

    try {
      const { error } = await supabase
        .from('cabling_tracking')
        .upsert(upsertData, { onConflict: 'floor_id,block_num,cable_id' });

      if (error) throw error;
      logAction('Mise à jour BLOC', `Bloc ${blockNum} (${floorId}) : Tous les câbles mis à ${statusId}`);
    } catch (err) {
      console.error('Erreur de synchro bloc Supabase:', err.message);
      fetchAllData();
    }
  }, [fetchAllData]);

  /**
   * Fonctions utilitaires de calcul (inchangées car elles utilisent trackingData)
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
    stats.percentage = Math.round((stats.completed / (stats.total || 1)) * 100);
    return stats;
  }, [trackingData]);

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
      total, completed, inProgress, notStarted, issues,
      percentage: Math.round((completed / (total || 1)) * 100),
    };
  }, [getBlockStats]);

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
      total, completed, inProgress, notStarted, issues,
      percentage: Math.round((completed / (total || 1)) * 100),
    };
  }, [getFloorStats]);

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

    return { total, completed, inProgress, notStarted, issues, percentage: Math.round((completed / (total || 1)) * 100) };
  }, [trackingData]);

  const resetAllData = useCallback(async () => {
    if (confirm('Voulez-vous vraiment effacer TOUTES les données sur Supabase ?')) {
      try {
        const { error } = await supabase
          .from('cabling_tracking')
          .delete()
          .not('id', 'is', null); // Delete all
        
        if (error) throw error;
        setTrackingData(getInitialEmptyData());
        logAction('RÉINITIALISATION', 'Toutes les données du chantier ont été effacées');
      } catch (err) {
        console.error('Erreur lors de la réinitialisation:', err.message);
      }
    }
  }, []);

  const value = {
    trackingData,
    loading,
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
