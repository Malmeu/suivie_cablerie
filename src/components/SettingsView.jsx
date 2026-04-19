import { useTracking } from '../context/TrackingContext';
import { FLOORS, BLOCKS_PER_FLOOR, CABLE_TYPES } from '../data/cableTypes';
import {
  Trash2, Download, Upload, AlertTriangle, Info
} from 'lucide-react';
import { useState } from 'react';

export default function SettingsView() {
  const { trackingData, resetAllData } = useTracking();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleExport = () => {
    const dataStr = JSON.stringify(trackingData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cabletrack_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        localStorage.setItem('cabletrack_data', JSON.stringify(imported));
        window.location.reload();
      } catch (err) {
        alert('Fichier invalide');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    resetAllData();
    setShowConfirm(false);
  };

  // Calculer quelques stats
  const totalCables = FLOORS.length * BLOCKS_PER_FLOOR * CABLE_TYPES.length;
  let modified = 0;
  FLOORS.forEach(f => {
    for (let b = 1; b <= BLOCKS_PER_FLOOR; b++) {
      CABLE_TYPES.forEach(c => {
        if (trackingData[f.id]?.[b]?.[c.id]?.lastUpdated) modified++;
      });
    }
  });

  return (
    <div className="dashboard" id="settings-view">
      <div className="dashboard-header">
        <h1 className="dashboard-title">⚙️ Réglages</h1>
        <p className="dashboard-subtitle">Gestion des données et paramètres</p>
      </div>

      {/* Infos */}
      <div className="global-progress" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <Info size={18} style={{ color: 'var(--color-accent-light)' }} />
          <span style={{ fontWeight: 600 }}>Informations du projet</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Étages:</span>{' '}
            <strong>{FLOORS.length}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Blocs/étage:</span>{' '}
            <strong>{BLOCKS_PER_FLOOR}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Types de câblage:</span>{' '}
            <strong>{CABLE_TYPES.length}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-muted)' }}>Total points suivi:</span>{' '}
            <strong>{totalCables}</strong>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Points mis à jour:</span>{' '}
            <strong style={{ color: 'var(--color-completed)' }}>{modified} / {totalCables}</strong>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="cable-list" style={{ gap: 10 }}>
        <button
          className="cable-item"
          style={{ cursor: 'pointer', textAlign: 'left' }}
          onClick={handleExport}
          id="export-data"
        >
          <div className="cable-item-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-completed)' }}>
            <Download size={22} />
          </div>
          <div className="cable-item-info">
            <div className="cable-item-name">Exporter les données</div>
            <div className="cable-item-meta">Télécharger un fichier JSON de sauvegarde</div>
          </div>
        </button>

        <label
          className="cable-item"
          style={{ cursor: 'pointer' }}
          id="import-data"
        >
          <div className="cable-item-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--color-accent-light)' }}>
            <Upload size={22} />
          </div>
          <div className="cable-item-info">
            <div className="cable-item-name">Importer des données</div>
            <div className="cable-item-meta">Charger un fichier JSON précédemment exporté</div>
          </div>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>

        <button
          className="cable-item"
          style={{ cursor: 'pointer', textAlign: 'left' }}
          onClick={() => setShowConfirm(true)}
          id="reset-data"
        >
          <div className="cable-item-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--color-issue)' }}>
            <Trash2 size={22} />
          </div>
          <div className="cable-item-info">
            <div className="cable-item-name" style={{ color: 'var(--color-issue)' }}>Réinitialiser tout</div>
            <div className="cable-item-meta">Effacer toutes les données de suivi</div>
          </div>
        </button>
      </div>

      {/* Modal confirmation */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-issue)' }}>
                <AlertTriangle size={18} style={{ display: 'inline', marginRight: 6 }} />
                Confirmer la réinitialisation
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                Êtes-vous sûr de vouloir effacer <strong>toutes les données de suivi</strong> ?
                Cette action est irréversible.
              </p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn--secondary" onClick={() => setShowConfirm(false)}>
                Annuler
              </button>
              <button
                className="modal-btn"
                style={{ background: 'var(--color-issue)', color: 'white' }}
                onClick={handleReset}
                id="confirm-reset"
              >
                Effacer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
