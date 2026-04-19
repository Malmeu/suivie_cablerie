import { useTracking } from '../context/TrackingContext';
import { CABLE_TYPES, FLOORS, BLOCKS_PER_FLOOR, STATUS } from '../data/cableTypes';
import { useState } from 'react';
import {
  Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock,
  ChevronDown, ChevronRight, Cable
} from 'lucide-react';

const iconMap = { Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock };

export default function CablesView() {
  const { trackingData, getCableTypeStats } = useTracking();
  const [expandedCable, setExpandedCable] = useState(null);

  const toggleExpand = (cableId) => {
    setExpandedCable(expandedCable === cableId ? null : cableId);
  };

  return (
    <div className="dashboard" id="cables-view">
      <div className="dashboard-header">
        <h1 className="dashboard-title">🔌 Vue par Câblage</h1>
        <p className="dashboard-subtitle">Détail de chaque type de câblage sur tous les étages</p>
      </div>

      <div className="cable-list">
        {CABLE_TYPES.map(cable => {
          const Icon = iconMap[cable.icon];
          const stats = getCableTypeStats(cable.id);
          const isExpanded = expandedCable === cable.id;

          return (
            <div key={cable.id} style={{ marginBottom: 8 }}>
              {/* Carte résumé */}
              <div
                className="cable-item"
                style={{
                  cursor: 'pointer',
                  borderColor: isExpanded ? cable.color + '40' : undefined,
                }}
                onClick={() => toggleExpand(cable.id)}
                id={`cables-expand-${cable.id}`}
              >
                <div
                  className="cable-item-icon"
                  style={{ background: `${cable.color}20`, color: cable.color }}
                >
                  {Icon && <Icon size={24} />}
                </div>

                <div className="cable-item-info">
                  <div className="cable-item-name">{cable.name}</div>
                  <div className="cable-item-meta">
                    {stats.completed} terminés · {stats.inProgress} en cours · {stats.issues} problèmes
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div className="cable-stat-bar">
                      <div
                        className="cable-stat-bar-fill"
                        style={{ width: `${stats.percentage}%`, background: cable.gradient }}
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: cable.color }}>
                    {stats.percentage}%
                  </span>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>

              {/* Détail par étage (expandable) */}
              {isExpanded && (
                <div
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderTop: 'none',
                    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                    padding: 16,
                    animation: 'fadeInUp 0.3s ease',
                  }}
                >
                  {FLOORS.map(floor => {
                    let floorCompleted = 0;
                    return (
                      <div key={floor.id} style={{ marginBottom: 12 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: 'var(--color-text-secondary)',
                        }}>
                          <span>{floor.fullName}</span>
                          <span style={{ color: cable.color }}>
                            {(() => {
                              for (let b = 1; b <= BLOCKS_PER_FLOOR; b++) {
                                if (trackingData[floor.id]?.[b]?.[cable.id]?.status === 'completed') floorCompleted++;
                              }
                              return `${floorCompleted}/${BLOCKS_PER_FLOOR}`;
                            })()}
                          </span>
                        </div>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(11, 1fr)',
                          gap: 4,
                        }}>
                          {Array.from({ length: BLOCKS_PER_FLOOR }, (_, i) => {
                            const blockNum = i + 1;
                            const status = trackingData[floor.id]?.[blockNum]?.[cable.id]?.status || 'not_started';
                            const statusObj = Object.values(STATUS).find(s => s.id === status);

                            return (
                              <div
                                key={blockNum}
                                style={{
                                  aspectRatio: '1',
                                  borderRadius: 6,
                                  background: statusObj?.bgColor || 'rgba(100,116,139,0.15)',
                                  border: `1px solid ${statusObj?.color || '#64748b'}30`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  color: statusObj?.color || '#64748b',
                                  minHeight: 36,
                                }}
                                title={`B${blockNum} - ${statusObj?.label}`}
                              >
                                B{blockNum}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
