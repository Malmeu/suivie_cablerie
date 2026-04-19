import { useState } from 'react';
import { useTracking } from '../context/TrackingContext';
import { CABLE_TYPES, FLOORS, BLOCKS_PER_FLOOR, STATUS } from '../data/cableTypes';
import {
  ArrowLeft, Building2, Layers,
  Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock
} from 'lucide-react';

const iconMap = { Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock };

export default function FloorView({ onNavigateBlock, onBack }) {
  const [selectedFloor, setSelectedFloor] = useState(0);
  const { getFloorStats, getBlockStats, trackingData } = useTracking();

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
      <div className="floor-visual" id="floor-visual">
        <div className="floor-visual-title">
          <Layers size={18} />
          Plan de l'étage - {currentFloor?.fullName}
        </div>

        <div className="floor-blocks-grid">
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
