import { useTracking } from '../context/TrackingContext';
import { CABLE_TYPES, FLOORS, BLOCKS_PER_FLOOR, STATUS } from '../data/cableTypes';
import {
  CheckCircle2, Clock, AlertTriangle, Pause,
  Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock,
  Building2, TrendingUp
} from 'lucide-react';

const iconMap = { Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock };

export default function Dashboard({ onNavigateFloor }) {
  const { getGlobalStats, getFloorStats, getBlockStats, getCableTypeStats } = useTracking();
  const globalStats = getGlobalStats();

  /**
   * Détermine le status global d'un bloc pour la couleur de la visualisation
   */
  const getBlockVisualStatus = (floorId, blockNum) => {
    const stats = getBlockStats(floorId, blockNum);
    if (stats.issues > 0) return 'issue';
    if (stats.completed === stats.total) return 'completed';
    if (stats.notStarted === stats.total) return 'not_started';
    return 'mixed';
  };

  return (
    <div className="dashboard" id="dashboard-view">
      {/* En-tête Dashboard */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">📊 Tableau de Bord</h1>
        <p className="dashboard-subtitle">Vue d'ensemble du chantier de câblerie</p>
      </div>

      {/* Statistiques Globales */}
      <div className="stats-row" id="global-stats">
        <div className="stat-card stat-card--completed">
          <div className="stat-card-icon"><CheckCircle2 size={22} /></div>
          <div className="stat-card-value">{globalStats.completed}</div>
          <div className="stat-card-label">Terminés</div>
        </div>
        <div className="stat-card stat-card--progress">
          <div className="stat-card-icon"><Clock size={22} /></div>
          <div className="stat-card-value">{globalStats.inProgress}</div>
          <div className="stat-card-label">En cours</div>
        </div>
        <div className="stat-card stat-card--pending">
          <div className="stat-card-icon"><Pause size={22} /></div>
          <div className="stat-card-value">{globalStats.notStarted}</div>
          <div className="stat-card-label">Non démarrés</div>
        </div>
        <div className="stat-card stat-card--issues">
          <div className="stat-card-icon"><AlertTriangle size={22} /></div>
          <div className="stat-card-value">{globalStats.issues}</div>
          <div className="stat-card-label">Problèmes</div>
        </div>
      </div>

      {/* Barre de Progression Globale */}
      <div className="global-progress" id="global-progress-bar">
        <div className="global-progress-header">
          <div className="global-progress-title">
            <TrendingUp size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            Avancement Global
          </div>
          <div className="global-progress-percent">{globalStats.percentage}%</div>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${globalStats.percentage}%` }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          <span>{globalStats.completed} / {globalStats.total} câblages</span>
          <span>{FLOORS.length} étages · {FLOORS.length * BLOCKS_PER_FLOOR} blocs</span>
        </div>
      </div>

      {/* Légende */}
      <div className="legend" id="status-legend">
        {Object.values(STATUS).map(s => (
          <div key={s.id} className="legend-item">
            <div className="legend-dot" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      {/* Visualisation Bâtiment */}
      <div className="building-section" id="building-visual">
        <h2 className="building-section-title">
          <Building2 size={20} />
          Vue du Bâtiment
        </h2>
        <div className="building-visual">
          {[...FLOORS].reverse().map(floor => {
            const floorStats = getFloorStats(floor.id);
            return (
              <div
                key={floor.id}
                className="building-floor"
                onClick={() => onNavigateFloor(floor.id)}
                id={`building-floor-${floor.id}`}
              >
                <div className="building-floor-label">
                  {floor.name}
                  <span>{floorStats.percentage}%</span>
                </div>
                <div className="building-floor-blocks">
                  {Array.from({ length: BLOCKS_PER_FLOOR }, (_, i) => {
                    const blockNum = i + 1;
                    const status = getBlockVisualStatus(floor.id, blockNum);
                    const blockStats = getBlockStats(floor.id, blockNum);
                    return (
                      <div
                        key={blockNum}
                        className={`building-block building-block--${status}`}
                        title={`Bloc ${blockNum} - ${blockStats.percentage}%`}
                        id={`building-block-${floor.id}-${blockNum}`}
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
      </div>

      {/* Statistiques par type de câble */}
      <div style={{ marginTop: 32 }}>
        <h2 className="building-section-title" style={{ marginBottom: 16 }}>
          🔌 Progression par Type de Câblage
        </h2>
        <div className="cable-stats-grid" id="cable-type-stats">
          {CABLE_TYPES.map(cable => {
            const stats = getCableTypeStats(cable.id);
            const Icon = iconMap[cable.icon];
            return (
              <div key={cable.id} className="cable-stat-card" id={`cable-stat-${cable.id}`}>
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
                      style={{ width: `${stats.percentage}%`, background: cable.gradient }}
                    />
                  </div>
                </div>
                <div className="cable-stat-footer">
                  <div className="cable-stat-percent" style={{ color: cable.color }}>
                    {stats.percentage}%
                  </div>
                  <div className="cable-stat-count">
                    {stats.completed}/{stats.total}
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
