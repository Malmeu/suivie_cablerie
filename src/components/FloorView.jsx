import { useState, useEffect } from 'react';
import { useTracking } from '../context/TrackingContext';
import { CABLE_TYPES, FLOORS, BLOCKS_PER_FLOOR, STATUS } from '../data/cableTypes';
import {
  ArrowLeft, Building2, Layers, Map as MapIcon, Grid,
  Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock
} from 'lucide-react';

const iconMap = { Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock };

// Coordonnées approximatives pour les 11 blocs sur le plan (en %)
const BLOCK_COORDINATES = [
  { x: 15, y: 35 }, { x: 25, y: 20 }, { x: 45, y: 15 }, 
  { x: 75, y: 15 }, { x: 85, y: 35 }, { x: 85, y: 65 },
  { x: 75, y: 85 }, { x: 45, y: 85 }, { x: 25, y: 85 },
  { x: 15, y: 65 }, { x: 50, y: 50 }
];

export default function FloorView({ initialFloor, onNavigateBlock, onBack }) {
  const [selectedFloor, setSelectedFloor] = useState(initialFloor !== null ? initialFloor : 0);
  const [viewMode, setViewMode] = useState('plan'); // 'grid' ou 'plan'
  const { getFloorStats, getBlockStats, trackingData } = useTracking();

  // Synchroniser si la prop change
  useEffect(() => {
    if (initialFloor !== null) {
      setSelectedFloor(initialFloor);
    }
  }, [initialFloor]);

  const currentFloor = FLOORS.find(f => f.id === selectedFloor);
  const floorStats = getFloorStats(selectedFloor);

  /**
   * Détermine la couleur dominante d'un bloc
   */
  const getBlockColor = (percentage) => {
    if (percentage === 0) return 'var(--color-not-started)';
    if (percentage === 100) return 'var(--color-completed)';
    if (percentage >= 50) return 'var(--color-in-progress)';
    return '#f97316';
  };

  /**
   * Détermine le status principal du bloc
   */
  const getBlockMainStatus = (floorId, blockNum) => {
    const stats = getBlockStats(floorId, blockNum);
    if (stats.issues > 0) return 'issue';
    if (stats.completed === stats.total) return 'completed';
    if (stats.notStarted === stats.total) return 'not_started';
    return 'in_progress';
  };

  return (
    <div className="floor-view" id="floor-view">
      {/* Header */}
      <div className="floor-header">
        <button className="floor-back-btn" onClick={onBack} id="floor-back">
          <ArrowLeft size={16} />
          Dashboard
        </button>

        <div className="floor-title-group">
          <h1 className="floor-title">{currentFloor?.fullName}</h1>
          <p className="floor-subtitle">{BLOCKS_PER_FLOOR} blocs · {CABLE_TYPES.length} types de câblage</p>
        </div>

        <div
          className="floor-progress-badge"
          style={{
            background: `${getBlockColor(floorStats.percentage)}15`,
            border: `1px solid ${getBlockColor(floorStats.percentage)}30`,
            color: getBlockColor(floorStats.percentage),
          }}
          id="floor-progress"
        >
          {floorStats.percentage}%
        </div>

        {/* Toggle Vue Plan/Grille */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--color-bg-card)', 
          padding: '4px', 
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          marginLeft: '12px'
        }}>
          <button 
            onClick={() => setViewMode('plan')}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 'var(--radius-md)',
              background: viewMode === 'plan' ? 'var(--color-accent)' : 'transparent',
              color: viewMode === 'plan' ? 'white' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
          >
            <MapIcon size={14} /> Plan
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 'var(--radius-md)',
              background: viewMode === 'grid' ? 'var(--color-accent)' : 'transparent',
              color: viewMode === 'grid' ? 'white' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}
          >
            <Grid size={14} /> Grille
          </button>
        </div>
      </div>

      {/* Sélecteur d'étages */}
      <div className="floor-selector" id="floor-selector">
        {FLOORS.map(floor => {
          const stats = getFloorStats(floor.id);
          return (
            <button
              key={floor.id}
              className={`floor-tab ${selectedFloor === floor.id ? 'active' : ''}`}
              onClick={() => setSelectedFloor(floor.id)}
              id={`floor-tab-${floor.id}`}
            >
              {floor.name}
              <span className="floor-tab-percent">{stats.percentage}%</span>
            </button>
          );
        })}
      </div>

      {/* Légende */}
      <div className="legend">
        {Object.values(STATUS).map(s => (
          <div key={s.id} className="legend-item">
            <div className="legend-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      {/* Vue visuelle de l'étage */}
      <div className="floor-visual" id="floor-visual" style={{ padding: viewMode === 'plan' ? '0' : '24px', overflow: 'hidden' }}>
        <div style={{ padding: '24px 24px 0 24px', marginBottom: viewMode === 'plan' ? '0' : '20px' }}>
          <div className="floor-visual-title">
            {viewMode === 'plan' ? <MapIcon size={18} /> : <Layers size={18} />}
            {viewMode === 'plan' ? 'Plan Interactif' : 'Grille des Blocs'} - {currentFloor?.fullName}
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="floor-blocks-grid" style={{ padding: '0 24px 24px 24px' }}>
            {Array.from({ length: BLOCKS_PER_FLOOR }, (_, i) => {
              const blockNum = i + 1;
              const blockStats = getBlockStats(selectedFloor, blockNum);
              const mainStatus = getBlockMainStatus(selectedFloor, blockNum);

              return (
                <div
                  key={blockNum}
                  className={`floor-block-card floor-block-card--${mainStatus}`}
                  onClick={() => onNavigateBlock(selectedFloor, blockNum)}
                  id={`floor-block-${selectedFloor}-${blockNum}`}
                >
                  <div className="floor-block-number">
                    B{blockNum}
                  </div>
                  <div className="floor-block-name">Bloc {blockNum}</div>

                  <div className="floor-block-progress">
                    <div className="floor-block-bar">
                      <div
                        className="floor-block-bar-fill"
                        style={{
                          width: `${blockStats.percentage}%`,
                          background: getBlockColor(blockStats.percentage),
                        }}
                      />
                    </div>
                  </div>

                  <div
                    className="floor-block-percent"
                    style={{ color: getBlockColor(blockStats.percentage) }}
                  >
                    {blockStats.percentage}%
                  </div>

                  {/* Points de statut pour chaque câble */}
                  <div className="floor-block-status-dots">
                    {CABLE_TYPES.map(cable => {
                      const cableStatus = trackingData[selectedFloor]?.[blockNum]?.[cable.id]?.status || 'not_started';
                      return (
                        <div
                          key={cable.id}
                          className={`status-dot status-dot--${cableStatus}`}
                          title={`${cable.name}: ${STATUS[cableStatus.toUpperCase()]?.label || cableStatus}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* VUE PLAN */
          <div style={{ 
            position: 'relative', 
            width: '100%', 
            minHeight: '600px', 
            background: '#0f172a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '80vh' }}>
              <img 
                src={`/plans/${selectedFloor === 0 ? 'rdc' : 'floor' + selectedFloor}.jpg`} 
                alt={`Plan ${currentFloor?.name}`}
                style={{ maxWidth: '100%', height: 'auto', borderRadius: 'var(--radius-md)', opacity: 0.8 }}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/1200x800/1e293b/white?text=Plan+Non+Disponible+sur+le+serveur';
                }}
              />
              
              {/* Overlay des BLOCS interactifs */}
              {Array.from({ length: BLOCKS_PER_FLOOR }, (_, i) => {
                const blockNum = i + 1;
                const coord = BLOCK_COORDINATES[i] || { x: 50, y: 50 };
                const blockStats = getBlockStats(selectedFloor, blockNum);
                const mainStatus = getBlockMainStatus(selectedFloor, blockNum);
                const color = getBlockColor(blockStats.percentage);

                return (
                  <div
                    key={blockNum}
                    onClick={() => onNavigateBlock(selectedFloor, blockNum)}
                    style={{
                      position: 'absolute',
                      left: `${coord.x}%`,
                      top: `${coord.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: `${color}40`,
                      border: `2px solid ${color}`,
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: `0 0 15px ${color}40`,
                      transition: 'all 0.3s ease',
                      zIndex: 10
                    }}
                    title={`Bloc ${blockNum} - ${blockStats.percentage}%`}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.3)'; e.currentTarget.style.zIndex = 20; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'; e.currentTarget.style.zIndex = 10; }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {blockNum}
                    </span>
                    
                    {/* Ring indicateur de progression */}
                    <svg style={{ position: 'absolute', width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="2"
                        fill="none"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="18"
                        stroke={color}
                        strokeWidth="2"
                        fill="none"
                        strokeDasharray={`${(18 * 2 * Math.PI * blockStats.percentage) / 100} 1000`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Récapitulatif par type de câble pour cet étage */}
      <div style={{ marginTop: 24 }}>
        <h2 className="building-section-title" style={{ marginBottom: 16 }}>
          <Building2 size={18} />
          Récapitulatif câblage - {currentFloor?.fullName}
        </h2>
        <div className="cable-stats-grid">
          {CABLE_TYPES.map(cable => {
            const Icon = iconMap[cable.icon];
            // Compter les stats pour ce type de câble sur cet étage
            let completed = 0, inProgress = 0, notStarted = 0, issues = 0;
            for (let b = 1; b <= BLOCKS_PER_FLOOR; b++) {
              const status = trackingData[selectedFloor]?.[b]?.[cable.id]?.status;
              if (status === 'completed') completed++;
              else if (status === 'in_progress') inProgress++;
              else if (status === 'issue') issues++;
              else notStarted++;
            }
            const percent = Math.round((completed / BLOCKS_PER_FLOOR) * 100);

            return (
              <div key={cable.id} className="cable-stat-card">
                <div className="cable-stat-header">
                  <div
                    className="cable-stat-icon"
                    style={{ background: `${cable.color}20`, color: cable.color }}
                  >
                    {Icon && <Icon size={18} />}
                  </div>
                  <div className="cable-stat-name">{cable.shortName}</div>
                </div>
                <div className="cable-stat-progress">
                  <div className="cable-stat-bar">
                    <div
                      className="cable-stat-bar-fill"
                      style={{ width: `${percent}%`, background: cable.gradient }}
                    />
                  </div>
                </div>
                <div className="cable-stat-footer">
                  <div className="cable-stat-percent" style={{ color: cable.color }}>
                    {percent}%
                  </div>
                  <div className="cable-stat-count">
                    {completed}/{BLOCKS_PER_FLOOR}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
