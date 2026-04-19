import { useState } from 'react';
import { useTracking } from '../context/TrackingContext';
import { CABLE_TYPES, FLOORS, STATUS } from '../data/cableTypes';
import {
  ArrowLeft, CheckCircle2, MessageSquare, X,
  Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock,
  ChevronRight
} from 'lucide-react';

const iconMap = { Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock };

export default function BlockView({ floorId, blockNum, onBack }) {
  const { trackingData, updateCableStatus, updateBlockStatus, getBlockStats } = useTracking();
  const [noteModal, setNoteModal] = useState(null); // { cableId, currentNote }
  const [noteText, setNoteText] = useState('');

  const floor = FLOORS.find(f => f.id === floorId);
  const blockStats = getBlockStats(floorId, blockNum);

  const handleStatusChange = (cableId, statusId) => {
    const current = trackingData[floorId]?.[blockNum]?.[cableId];
    updateCableStatus(floorId, blockNum, cableId, statusId, current?.notes || '');
  };

  const handleMarkAllDone = () => {
    updateBlockStatus(floorId, blockNum, STATUS.COMPLETED.id);
  };

  const handleResetAll = () => {
    updateBlockStatus(floorId, blockNum, STATUS.NOT_STARTED.id);
  };

  const openNoteModal = (cableId) => {
    const currentNote = trackingData[floorId]?.[blockNum]?.[cableId]?.notes || '';
    setNoteText(currentNote);
    setNoteModal({ cableId, currentNote });
  };

  const saveNote = () => {
    if (noteModal) {
      const current = trackingData[floorId]?.[blockNum]?.[noteModal.cableId];
      updateCableStatus(floorId, blockNum, noteModal.cableId, current?.status || STATUS.NOT_STARTED.id, noteText);
      setNoteModal(null);
      setNoteText('');
    }
  };

  const formatDate = (isoDate) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="block-view" id="block-view">
      {/* Header */}
      <div className="block-header">
        <div>
          <button className="floor-back-btn" onClick={onBack} id="block-back">
            <ArrowLeft size={16} />
            {floor?.fullName}
          </button>
          <h1 className="block-title" style={{ marginTop: 8 }}>
            Bloc {blockNum}
          </h1>
          <p className="block-subtitle">
            {floor?.fullName} · {blockStats.completed}/{blockStats.total} terminés · {blockStats.percentage}%
          </p>
        </div>

        <div className="block-actions">
          <button
            className="block-action-btn block-action-btn--all-done"
            onClick={handleMarkAllDone}
            id="mark-all-done"
          >
            <CheckCircle2 size={14} />
            Tout terminé
          </button>
          <button
            className="block-action-btn"
            onClick={handleResetAll}
            id="reset-all"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Barre de progression du bloc */}
      <div className="global-progress" style={{ marginBottom: 24 }}>
        <div className="global-progress-header">
          <div className="global-progress-title">Avancement Bloc {blockNum}</div>
          <div className="global-progress-percent">{blockStats.percentage}%</div>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{ width: `${blockStats.percentage}%` }}
          />
        </div>
      </div>

      {/* Liste des câblages */}
      <div className="cable-list" id="cable-list">
        {CABLE_TYPES.map(cable => {
          const Icon = iconMap[cable.icon];
          const cableData = trackingData[floorId]?.[blockNum]?.[cable.id] || {};
          const currentStatus = cableData.status || STATUS.NOT_STARTED.id;
          const hasNote = cableData.notes && cableData.notes.length > 0;

          return (
            <div key={cable.id} className="cable-item" id={`cable-${cable.id}`}>
              {/* Icône du câble */}
              <div
                className="cable-item-icon"
                style={{ background: `${cable.color}20`, color: cable.color }}
              >
                {Icon && <Icon size={24} />}
              </div>

              {/* Infos */}
              <div className="cable-item-info">
                <div className="cable-item-name">{cable.name}</div>
                <div className="cable-item-meta">
                  {cableData.lastUpdated
                    ? `Mis à jour: ${formatDate(cableData.lastUpdated)}`
                    : 'Pas encore modifié'
                  }
                  {hasNote && (
                    <span style={{ marginLeft: 8, color: 'var(--color-accent-light)' }}>
                      📝 Note
                    </span>
                  )}
                </div>
              </div>

              {/* Boutons de statut */}
              <div className="cable-item-status">
                {Object.values(STATUS).map(status => (
                  <button
                    key={status.id}
                    className={`status-btn status-btn--${status.id} ${currentStatus === status.id ? 'active' : ''}`}
                    onClick={() => handleStatusChange(cable.id, status.id)}
                    id={`status-${cable.id}-${status.id}`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              {/* Notes */}
              <div className="cable-item-notes">
                <button
                  className={`note-btn ${hasNote ? 'has-note' : ''}`}
                  onClick={() => openNoteModal(cable.id)}
                  title="Ajouter une note"
                  id={`note-btn-${cable.id}`}
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Notes */}
      {noteModal && (
        <div className="modal-overlay" onClick={() => setNoteModal(null)} id="note-modal">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                📝 Note - {CABLE_TYPES.find(c => c.id === noteModal.cableId)?.name}
              </h3>
              <button className="modal-close" onClick={() => setNoteModal(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <textarea
                className="modal-textarea"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Saisir une note, observation ou remarque..."
                autoFocus
                id="note-textarea"
              />
            </div>
            <div className="modal-footer">
              <button
                className="modal-btn modal-btn--secondary"
                onClick={() => setNoteModal(null)}
              >
                Annuler
              </button>
              <button
                className="modal-btn modal-btn--primary"
                onClick={saveNote}
                id="save-note"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
