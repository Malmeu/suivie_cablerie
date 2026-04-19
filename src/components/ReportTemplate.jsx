import React from 'react';
import { useTracking } from '../context/TrackingContext';
import { CABLE_TYPES, FLOORS, STATUS, BLOCKS_PER_FLOOR } from '../data/cableTypes';

export default function ReportTemplate({ reportRef }) {
  const { getGlobalStats, getFloorStats, getCableTypeStats, trackingData } = useTracking();
  const globalStats = getGlobalStats();
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div style={{ 
      position: 'fixed', 
      left: 0, 
      top: 0, 
      width: '210mm',
      height: 'auto',
      opacity: 0, 
      pointerEvents: 'none', 
      zIndex: -1000,
      overflow: 'hidden'
    }}>
      <div 
        ref={reportRef}
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '20mm',
          background: '#ffffff',
          color: '#1e293b',
          fontFamily: 'Inter, sans-serif',
          lineHeight: '1.5'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #6366f1', paddingBottom: '10mm', marginBottom: '10mm' }}>
          <div>
            <h1 style={{ fontSize: '24pt', fontWeight: '800', margin: 0, color: '#6366f1' }}>CâbleTrack Pro</h1>
            <p style={{ fontSize: '10pt', color: '#64748b', margin: '2mm 0 0 0' }}>Système de Suivi de Câblerie Hospitalière</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '14pt', fontWeight: '700', margin: 0 }}>Rapport d'Avancement</h2>
            <p style={{ fontSize: '9pt', color: '#64748b', margin: '1mm 0 0 0' }}>Généré le {dateStr}</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div style={{ marginBottom: '10mm' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: '700', borderLeft: '4px solid #6366f1', paddingLeft: '4mm', marginBottom: '4mm' }}>Résumé Exécutif</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '4mm' }}>
            <div style={{ padding: '4mm', background: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '20pt', fontWeight: '800', color: '#6366f1' }}>{globalStats.percentage}%</div>
              <div style={{ fontSize: '8pt', color: '#64748b', textTransform: 'uppercase' }}>Avancement</div>
            </div>
            <div style={{ padding: '4mm', background: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '20pt', fontWeight: '800', color: '#10b981' }}>{globalStats.completed}</div>
              <div style={{ fontSize: '8pt', color: '#64748b', textTransform: 'uppercase' }}>Terminés</div>
            </div>
            <div style={{ padding: '4mm', background: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '20pt', fontWeight: '800', color: '#f59e0b' }}>{globalStats.inProgress}</div>
              <div style={{ fontSize: '8pt', color: '#64748b', textTransform: 'uppercase' }}>En Cours</div>
            </div>
            <div style={{ padding: '4mm', background: '#f8fafc', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '20pt', fontWeight: '800', color: '#ef4444' }}>{globalStats.issues}</div>
              <div style={{ fontSize: '8pt', color: '#64748b', textTransform: 'uppercase' }}>Problèmes</div>
            </div>
          </div>
        </div>

        {/* Breakdown by Cable Type */}
        <div style={{ marginBottom: '10mm' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: '700', borderLeft: '4px solid #6366f1', paddingLeft: '4mm', marginBottom: '4mm' }}>Progression par Type de Câblage</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ textAlign: 'left', padding: '3mm', borderBottom: '1px solid #e2e8f0' }}>Câblage</th>
                <th style={{ textAlign: 'center', padding: '3mm', borderBottom: '1px solid #e2e8f0' }}>Complétion</th>
                <th style={{ textAlign: 'center', padding: '3mm', borderBottom: '1px solid #e2e8f0' }}>Terminés</th>
                <th style={{ textAlign: 'center', padding: '3mm', borderBottom: '1px solid #e2e8f0' }}>Détails</th>
              </tr>
            </thead>
            <tbody>
              {CABLE_TYPES.map(cable => {
                const stats = getCableTypeStats(cable.id);
                return (
                  <tr key={cable.id}>
                    <td style={{ padding: '3mm', borderBottom: '1px solid #f1f5f9', fontWeight: '600' }}>{cable.name}</td>
                    <td style={{ padding: '3mm', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ width: '100%', height: '4mm', background: '#e2e8f0', borderRadius: '2mm', overflow: 'hidden' }}>
                        <div style={{ width: `${stats.percentage}%`, height: '100%', background: cable.color }} />
                      </div>
                    </td>
                    <td style={{ padding: '3mm', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>{stats.percentage}%</td>
                    <td style={{ padding: '3mm', borderBottom: '1px solid #f1f5f9', textAlign: 'center', color: '#64748b' }}>
                      {stats.completed}/{stats.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Breakdown by Floor */}
        <div style={{ marginBottom: '10mm' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: '700', borderLeft: '4px solid #6366f1', paddingLeft: '4mm', marginBottom: '4mm' }}>Détail par Étage</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6mm' }}>
            {FLOORS.map(floor => {
              const floorStats = getFloorStats(floor.id);
              return (
                <div key={floor.id} style={{ padding: '4mm', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2mm' }}>
                    <span style={{ fontWeight: '700' }}>{floor.fullName}</span>
                    <span style={{ fontWeight: '700', color: '#6366f1' }}>{floorStats.percentage}%</span>
                  </div>
                  <div style={{ fontSize: '8pt', color: '#64748b' }}>
                    {floorStats.completed} sur {floorStats.total} câblages terminés
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Issues section */}
        <div style={{ breakBefore: 'page', paddingTop: '10mm' }}>
          <h3 style={{ fontSize: '14pt', fontWeight: '700', borderLeft: '4px solid #ef4444', paddingLeft: '4mm', marginBottom: '4mm' }}>Observations & Problèmes Signalés</h3>
          {(() => {
            const items = [];
            FLOORS.forEach(floor => {
              for (let b = 1; b <= BLOCKS_PER_FLOOR; b++) {
                CABLE_TYPES.forEach(cable => {
                  const data = trackingData[floor.id]?.[b]?.[cable.id];
                  if (data?.status === 'issue' || (data?.notes && data.notes.length > 0)) {
                    items.push({ floor, block: b, cable, data });
                  }
                });
              }
            });

            if (items.length === 0) return <p style={{ fontSize: '9pt', color: '#64748b', fontStyle: 'italic' }}>Aucune observation ou problème signalé.</p>;

            return (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9pt' }}>
                <thead>
                  <tr style={{ background: '#fef2f2' }}>
                    <th style={{ textAlign: 'left', padding: '2mm', borderBottom: '1px solid #fee2e2' }}>Localisation</th>
                    <th style={{ textAlign: 'left', padding: '2mm', borderBottom: '1px solid #fee2e2' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '2mm', borderBottom: '1px solid #fee2e2' }}>Statut/Note</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '2mm', borderBottom: '1px solid #f1f5f9' }}>{item.floor.name} - Bloc {item.block}</td>
                      <td style={{ padding: '2mm', borderBottom: '1px solid #f1f5f9' }}>{item.cable.shortName}</td>
                      <td style={{ padding: '2mm', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: item.data.status === 'issue' ? '#ef4444' : '#64748b', fontWeight: item.data.status === 'issue' ? '700' : '400' }}>
                          [{STATUS[item.data.status.toUpperCase()]?.label || item.data.status}]
                        </span>
                        {item.data.notes && <div style={{ marginTop: '1mm', color: '#444' }}>"{item.data.notes}"</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '20mm', borderTop: '1px solid #e2e8f0', paddingTop: '5mm', textAlign: 'center', fontSize: '8pt', color: '#94a3b8' }}>
          Document confidentiel - Projet Câblerie Hospitalière - Page 1
        </div>
      </div>
    </div>
  );
}
