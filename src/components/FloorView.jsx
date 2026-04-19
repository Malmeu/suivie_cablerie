import { useState, useEffect } from 'react';
import { useTracking } from '../context/TrackingContext';
import { CABLE_TYPES, FLOORS, BLOCKS_PER_FLOOR, STATUS } from '../data/cableTypes';
import {
  ArrowLeft, Building2, Layers, Map as MapIcon, Grid,
  Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock
} from 'lucide-react';

const iconMap = { Monitor, Wifi, Laptop, Tv, Camera, Bell, Flame, Lock };

// Coordonnées calibrées pour les 11 blocs sur le plan (en %)
const BLOCK_COORDINATES = [{"x":40.8,"y":88.4},{"x":80.4,"y":79.8},{"x":81.8,"y":64.3},{"x":85.2,"y":38.7},{"x":78.7,"y":18.6},{"x":43.3,"y":21.5},{"x":25,"y":60.3},{"x":19.3,"y":75.5},{"x":13.4,"y":92.8},{"x":52.6,"y":56.7},{"x":34.9,"y":38.1}];

import { supabase } from '../lib/supabase';

export default function FloorView({ initialFloor, onNavigateBlock, onBack }) {
  const [selectedFloor, setSelectedFloor] = useState(initialFloor !== null ? initialFloor : 0);
  const [viewMode, setViewMode] = useState('plan'); // 'grid' ou 'plan'
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPathMode, setIsPathMode] = useState(false);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [activeCableForPath, setActiveCableForPath] = useState(CABLE_TYPES[0].id);
  const [activeBlockForPath, setActiveBlockForPath] = useState(1);
  const [paths, setPaths] = useState({}); // { "block-cable": [{x,y}, ...] }
  const [notes, setNotes] = useState([]); // Array of { id, text, x, y }
  const [coords, setCoords] = useState(BLOCK_COORDINATES);
  const { getFloorStats, getBlockStats, trackingData } = useTracking();

  // Synchroniser si la prop change
  useEffect(() => {
    if (initialFloor !== null) {
      setSelectedFloor(initialFloor);
    }
  }, [initialFloor]);

  // Si on change d'étage, on pourrait charger des coordonnées spécifiques (à implémenter si besoin)
  // Pour l'instant on utilise le même set pour l'exemple
  
  // Charger les chemins et les notes depuis Supabase
  useEffect(() => {
    const fetchData = async () => {
      // Chemins
      const { data: pathData } = await supabase
        .from('cable_paths')
        .select('*')
        .eq('floor_id', selectedFloor);
      
      if (pathData) {
        const pathMap = {};
        pathData.forEach(p => { pathMap[`${p.block_num}-${p.cable_id}`] = p.points; });
        setPaths(pathMap);
      }

      // Notes
      const { data: noteData } = await supabase
        .from('floor_notes')
        .select('*')
        .eq('floor_id', selectedFloor);
      
      if (noteData) setNotes(noteData);
    };
    fetchData();
  }, [selectedFloor]);

  const handleDrag = (e, index) => {
    if (!isEditMode) return;
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newCoords = [...coords];
    newCoords[index] = { 
      x: Math.max(0, Math.min(100, Math.round(x * 10) / 10)), 
      y: Math.max(0, Math.min(100, Math.round(y * 10) / 10)) 
    };
    setCoords(newCoords);
  };

  const handlePlanClick = async (e) => {
    if (!isPathMode) return;
    
    console.log('Clic sur le plan détecté en mode tracé');
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    console.log(`Coordonnées capturées : x=${x}, y=${y}`);

    const pathKey = `${activeBlockForPath}-${activeCableForPath}`;
    const newPoints = [...(paths[pathKey] || []), { 
      x: Math.round(x * 10) / 10, 
      y: Math.round(y * 10) / 10 
    }];
    
    setPaths(prev => ({ ...prev, [pathKey]: newPoints }));

    // Tentative de sauvegarde Supabase
    try {
      const { error } = await supabase.from('cable_paths').upsert({
        floor_id: selectedFloor,
        block_num: activeBlockForPath,
        cable_id: activeCableForPath,
        points: newPoints
      }, { onConflict: 'floor_id,block_num,cable_id' });
      
      if (error) console.warn('Supabase: Table cable_paths non trouvée ou erreur', error.message);
    } catch (err) {
      console.error('Erreur Supabase synchro:', err);
    }
  };

  const handleNoteClick = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const text = prompt("Entrez votre note pour cet endroit :");
    if (!text) return;

    const newNote = { floor_id: selectedFloor, x, y, text };
    const { data, error } = await supabase.from('floor_notes').insert(newNote).select().single();

    if (!error && data) {
      setNotes([...notes, data]);
    }
  };

  const deleteNote = async (noteId) => {
    if (!confirm("Supprimer cette note ?")) return;
    await supabase.from('floor_notes').delete().eq('id', noteId);
    setNotes(notes.filter(n => n.id !== noteId));
  };

  const clearCurrentPath = async () => {
    const pathKey = `${activeBlockForPath}-${activeCableForPath}`;
    const newPaths = { ...paths };
    delete newPaths[pathKey];
    setPaths(newPaths);
    
    await supabase.from('cable_paths').delete().match({
      floor_id: selectedFloor,
      block_num: activeBlockForPath,
      cable_id: activeCableForPath
    });
  };

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

        {/* Bouton Mode Edition (uniquement en vue plan) */}
        {viewMode === 'plan' && (
          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 'var(--radius-lg)',
              background: isEditMode ? 'var(--color-issue)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: isEditMode ? 'none' : '1px solid var(--color-border)',
              marginLeft: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {isEditMode ? '✅ Terminer Placement' : '🔧 Placer les Blocs'}
          </button>
        )}

        {/* Bouton Mode Tracé */}
        {viewMode === 'plan' && (
          <button 
            onClick={() => { setIsPathMode(!isPathMode); setIsNoteMode(false); setIsEditMode(false); }}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 'var(--radius-lg)',
              background: isPathMode ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid var(--color-border)',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <MapIcon size={14} /> {isPathMode ? '✅ Finir Tracé' : '🖋️ Tracer Câbles'}
          </button>
        )}

        {/* Bouton Mode Note */}
        {viewMode === 'plan' && (
          <button 
            onClick={() => { setIsNoteMode(!isNoteMode); setIsPathMode(false); setIsEditMode(false); }}
            style={{ 
              padding: '8px 12px', 
              borderRadius: 'var(--radius-lg)',
              background: isNoteMode ? '#10b981' : 'rgba(255,255,255,0.1)',
              color: 'white',
              border: '1px solid var(--color-border)',
              marginLeft: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <span>📝</span> {isNoteMode ? '✅ Finir Notes' : '📝 Note'}
          </button>
        )}
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
      <div className="floor-visual" id="floor-visual" style={{ padding: viewMode === 'plan' ? '0' : '24px', overflow: 'visible' }}>
        <div style={{ padding: '24px 24px 0 24px', marginBottom: viewMode === 'plan' ? '4px' : '20px' }}>
          <div className="floor-visual-title">
            {viewMode === 'plan' ? <MapIcon size={18} /> : <Layers size={18} />}
            {viewMode === 'plan' ? 'Plan Interactif' : 'Grille des Blocs'} - {currentFloor?.fullName}
            {isEditMode && <span style={{ color: 'var(--color-issue)', marginLeft: '10px', fontSize: '0.9rem' }}>• MODE ÉDITION ACTIF : Glissez les cercles</span>}
            {isPathMode && <span style={{ color: 'var(--color-accent)', marginLeft: '10px', fontSize: '0.9rem' }}>• MODE TRACÉ : Cliquez sur le plan pour dessiner le câble</span>}
            {isNoteMode && <span style={{ color: '#10b981', marginLeft: '10px', fontSize: '0.9rem' }}>• MODE NOTE : Cliquez sur le plan pour poser une annotation</span>}
          </div>
        </div>

        {isPathMode && (
          <div style={{ 
            padding: '12px 24px', 
            background: 'rgba(99, 102, 241, 0.1)', 
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            gap: '15px',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <select 
              value={activeBlockForPath} 
              onChange={(e) => setActiveBlockForPath(parseInt(e.target.value))}
              style={{ padding: '6px', borderRadius: '4px', background: '#1e293b', color: 'white' }}
            >
              {[...Array(BLOCKS_PER_FLOOR)].map((_, i) => (
                <option key={i+1} value={i+1}>Bloc {i+1}</option>
              ))}
            </select>
            <select 
              value={activeCableForPath} 
              onChange={(e) => setActiveCableForPath(e.target.value)}
              style={{ padding: '6px', borderRadius: '4px', background: '#1e293b', color: 'white' }}
            >
              {CABLE_TYPES.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button 
              onClick={clearCurrentPath}
              style={{ padding: '6px 12px', background: 'var(--color-issue)', color: 'white', borderRadius: '4px', fontSize: '0.75rem' }}
            >
              Effacer ce tracé
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              Astuce : Cliquez sur le plan pour ajouter des points au câble sélectionné.
            </span>
          </div>
        )}

        {viewMode === 'grid' ? (
          /* ... (grid view code remains same) ... */
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
            minHeight: '700px', 
            background: '#0f172a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '40px 20px',
            overflowX: 'auto'
          }}>
            {isEditMode && (
              <div style={{ 
                background: 'rgba(0,0,0,0.8)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '20px', 
                fontSize: '0.8rem', 
                fontFamily: 'monospace',
                maxWidth: '800px',
                border: '1px solid var(--color-issue)'
              }}>
                <p style={{ marginBottom: '8px', color: 'var(--color-issue)' }}>Copiez ces coordonnées une fois fini :</p>
                <div style={{ wordBreak: 'break-all', userSelect: 'all' }}>
                  const BLOCK_COORDINATES = {JSON.stringify(coords)};
                </div>
              </div>
            )}

            <div 
              style={{ position: 'relative', width: 'fit-content', cursor: isPathMode ? 'crosshair' : (isEditMode ? 'move' : 'default') }}
              onClick={handlePlanClick}
            >
              <img 
                src={`/plans/${selectedFloor === 0 ? 'rdc' : 'floor' + selectedFloor}.jpg`} 
                alt={`Plan ${currentFloor?.name}`}
                style={{ display: 'block', maxWidth: 'none', width: 'auto', height: 'auto', maxHeight: '120vh', borderRadius: 'var(--radius-md)', opacity: (isEditMode || isPathMode) ? 0.3 : 0.8 }}
                onError={(e) => {
                  e.target.src = 'https://placehold.co/1200x800/1e293b/white?text=Plan+Non+Disponible+sur+le+serveur';
                }}
              />

              {/* SVG Overlay pour les câbles "Chenilles" */}
              <svg 
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  pointerEvents: 'none',
                  zIndex: 5
                }}
              >
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                {Object.entries(paths).map(([key, points]) => {
                  const [bNum, cId] = key.split('-');
                  const cableType = CABLE_TYPES.find(c => c.id === cId);
                  const status = trackingData[selectedFloor]?.[bNum]?.[cId]?.status || 'not_started';
                  
                  // On affiche si on a des points
                  const isCurrentlyDrawing = isPathMode && parseInt(bNum) === activeBlockForPath && cId === activeCableForPath;
                  
                  if (points.length === 0) return null;
                  // On enlève la condition status === 'not_started' pour que ça reste visible tout le temps

                  const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const isCompleted = status === 'completed';
                  const isIssue = status === 'issue';

                  return (
                    <g key={key}>
                      {/* La ligne */}
                      {points.length >= 2 && (
                        <path
                          d={pathStr}
                          fill="none"
                          stroke={cableType.color}
                          strokeWidth={isCurrentlyDrawing ? "0.8" : "0.5"} // Très fin
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter={isCurrentlyDrawing ? "url(#glow)" : "none"}
                          className={(status !== 'completed') ? "cable-path-anim" : ""}
                          style={{
                            opacity: isIssue ? 1 : (status === 'not_started' ? 0.4 : 0.8),
                            strokeDasharray: status === 'completed' ? "none" : "2, 3", // Petites chenilles électriques
                          }}
                        />
                      )}
                      
                      {/* Les points individuels pour aider au tracé */}
                      {isCurrentlyDrawing && points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r="0.5"
                          fill={cableType.color}
                          stroke="white"
                          strokeWidth="0.1"
                        />
                      ))}
                    </g>
                  );
                })}

                {/* SVG Overlay pour les câbles "Chenilles" */}
                {/* ... (SVG lines remains same) ... */}
              </svg>
              
              {/* Zone de clic invisible pour capturer proprement le tracé ou les notes */}
              {(isPathMode || isNoteMode) && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '100%', 
                    height: '100%', 
                    zIndex: 200, 
                    cursor: 'crosshair' 
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isPathMode) handlePlanClick(e);
                    if (isNoteMode) handleNoteClick(e);
                  }}
                />
              )}

              {/* Affichage des NOTES TEXTUELLES en HTML pour une précision et interaction parfaite */}
              {notes.map(note => (
                <div 
                  key={note.id} 
                  style={{
                    position: 'absolute',
                    left: `${note.x}%`,
                    top: `${note.y}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 250, // Au-dessus de la zone de clic
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    pointerEvents: isNoteMode ? 'auto' : 'none'
                  }}
                >
                  <div style={{
                    background: 'rgba(0,0,0,0.85)',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    borderLeft: '3px solid #10b981',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)'
                  }}>
                    {note.text}
                  </div>
                  
                  {isNoteMode && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                      style={{
                        background: 'var(--color-issue)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              
              {/* Overlay des BLOCS interactifs */}
              {Array.from({ length: BLOCKS_PER_FLOOR }, (_, i) => {
                const blockNum = i + 1;
                const coord = coords[i] || { x: 50, y: 50 };
                const blockStats = getBlockStats(selectedFloor, blockNum);
                const color = getBlockColor(blockStats.percentage);

                return (
                  <div
                    key={blockNum}
                    onMouseDown={(e) => isEditMode && e.preventDefault()}
                    onMouseMove={(e) => isEditMode && e.buttons === 1 && handleDrag(e, i)}
                    onClick={() => !isEditMode && !isPathMode && onNavigateBlock(selectedFloor, blockNum)}
                    style={{
                      position: 'absolute',
                      left: `${coord.x}%`,
                      top: `${coord.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: isEditMode ? '44px' : '40px',
                      height: isEditMode ? '44px' : '40px',
                      borderRadius: '50%',
                      background: isEditMode ? 'rgba(255,255,255,0.2)' : `${color}40`,
                      border: `2px solid ${isEditMode ? 'var(--color-issue)' : color}`,
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: isPathMode ? 'crosshair' : (isEditMode ? 'move' : 'pointer'),
                      boxShadow: isEditMode ? '0 0 20px rgba(239, 68, 68, 0.5)' : `0 0 15px ${color}40`,
                      transition: isEditMode ? 'none' : 'all 0.3s ease',
                      zIndex: (isEditMode || isPathMode) ? 100 : 10,
                      pointerEvents: isPathMode ? 'none' : 'auto' // Désactiver les clics sur les cercles en mode tracé
                    }}
                  >
                    <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {blockNum}
                    </span>
                    
                    {!isEditMode && (
                      <svg style={{ position: 'absolute', width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                        <circle cx="20" cy="20" r="18" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                        <circle
                          cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none"
                          strokeDasharray={`${(18 * 2 * Math.PI * blockStats.percentage) / 100} 1000`}
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
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
