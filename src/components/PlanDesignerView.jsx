import { useState, useEffect, useRef } from 'react';
import { supabase, logAction } from '../lib/supabase';
import { 
  Camera, Bell, Monitor, Lock, Square, Circle, Type, 
  Trash2, Move, RotateCcw, Palette, Plus, Save, X, Activity, 
  Wifi, Laptop, Tv, BellRing, MousePointer2, Layers, ChevronDown,
  ZoomIn, ZoomOut, Maximize, Hand, Pencil, ArrowLeft,
  Speaker, Flame, HardDrive, Phone, Radio, Power, Lightbulb, 
  Bed, ShieldCheck, Cpu, Mic, Search
} from 'lucide-react';
import { FLOORS } from '../data/cableTypes';

const ICON_LIBRARY = {
  'Sécurité': [
    { id: 'camera', icon: Camera, label: 'Caméra' },
    { id: 'lock', icon: Lock, label: 'Verrou' },
    { id: 'shield', icon: ShieldCheck, label: 'Alarme' },
    { id: 'flame', icon: Flame, label: 'Détecteur Incendie' },
  ],
  'Médical': [
    { id: 'call', icon: BellRing, label: 'Appel' },
    { id: 'bed', icon: Bed, label: 'Lit' },
    { id: 'activity', icon: Activity, label: 'Moniteur' },
  ],
  'Réseau': [
    { id: 'wifi', icon: Wifi, label: 'Wifi' },
    { id: 'server', icon: HardDrive, label: 'Serveur' },
    { id: 'cpu', icon: Cpu, label: 'Contrôleur' },
    { id: 'laptop', icon: Laptop, label: 'Poste' },
  ],
  'Audio/Elec': [
    { id: 'speaker', icon: Speaker, label: 'Haut-Parleur' },
    { id: 'phone', icon: Phone, label: 'Interphone' },
    { id: 'power', icon: Power, label: 'Prise' },
    { id: 'light', icon: Lightbulb, label: 'Luminaire' },
    { id: 'mic', icon: Mic, label: 'Micro' },
  ]
};

const TOOLS = [
  { id: 'select', label: 'Sélection', icon: MousePointer2 },
  { id: 'pan', label: 'Main', icon: Hand },
  { id: 'rect', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Cercle', icon: Circle },
  { id: 'line', label: 'Câble', icon: Pencil },
  { id: 'text', label: 'Texte', icon: Type },
];

export default function PlanDesignerView({ floorId: initialFloorId, onBack }) {
  const [floorId, setFloorId] = useState(initialFloorId);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeTool, setActiveTool] = useState('select');
  const [isAddingEquipment, setIsAddingEquipment] = useState(null);
  
  // Custom equipment builder
  const [showIconLibrary, setShowIconLibrary] = useState(false);
  const [customEquip, setCustomEquip] = useState({ iconId: 'camera', label: 'Nouveau', color: '#6366f1' });

  // Navigation State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  
  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [tempShape, setTempShape] = useState(null);
  const [dragId, setDragId] = useState(null);
  
  const planRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchAssets();
    const channel = supabase.channel('assets_realtime_link')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plan_assets' }, fetchAssets)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [floorId]);

  const fetchAssets = async () => {
    const { data } = await supabase.from('plan_assets').select('*').eq('floor_id', floorId);
    if (data) setAssets(data);
  };

  const getRelativeCoords = (e) => {
    const rect = planRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    };
  };

  const findIcon = (id) => {
    for (const group of Object.values(ICON_LIBRARY)) {
      const found = group.find(i => i.id === id);
      if (found) return found.icon;
    }
    return Activity;
  };

  // Calcule les coordonnées % exactes d'une ancre d'un asset
  const getAnchorCoords = (asset, position) => {
    // Largeur/hauteur de l'image sur l'écran (pour convertir px en %)
    const rect = planRef.current.getBoundingClientRect();
    const sizeXPct = (asset.width / rect.width) * 100 / 2;
    const sizeYPct = (asset.height / rect.height) * 100 / 2;

    switch(position) {
      case 'top': return { x: asset.x, y: asset.y - sizeYPct };
      case 'bottom': return { x: asset.x, y: asset.y + sizeYPct };
      case 'left': return { x: asset.x - sizeXPct, y: asset.y };
      case 'right': return { x: asset.x + sizeXPct, y: asset.y };
      default: return { x: asset.x, y: asset.y };
    }
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.icon-picker-modal')) return;
    
    if (activeTool === 'pan') {
      setIsPanning(true);
      return;
    }

    const coords = getRelativeCoords(e);

    // Dessin de câble avec SNAP
    if (activeTool === 'line') {
      setIsDrawing(true);
      
      // Est-ce qu'on a cliqué sur une ancre ?
      const anchorEl = e.target.closest('.anchor-point');
      if (anchorEl) {
        const assetId = anchorEl.dataset.assetId;
        const pos = anchorEl.dataset.pos;
        const asset = assets.find(a => a.id === assetId);
        const anchorCoords = getAnchorCoords(asset, pos);
        setStartPoint(anchorCoords);
      } else {
        setStartPoint(coords);
      }
      setSelectedAsset(null);
      return;
    }

    if (activeTool === 'select' && (isAddingEquipment || showIconLibrary)) {
      addEquipment(coords);
      return;
    }

    if (['rect', 'circle'].includes(activeTool)) {
      setIsDrawing(true);
      setStartPoint(coords);
      setSelectedAsset(null);
    }
  };

  const addEquipment = async (coords) => {
    const newAsset = {
      floor_id: floorId,
      x: Math.round(coords.x * 10) / 10,
      y: Math.round(coords.y * 10) / 10,
      type: 'equipment',
      sub_type: customEquip.iconId,
      color: customEquip.color,
      label: customEquip.label,
      width: 32, height: 32
    };
    const { data } = await supabase.from('plan_assets').insert(newAsset).select().single();
    if (data) setAssets([...assets, data]);
    setShowIconLibrary(false);
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
      return;
    }

    if (isDrawing) {
      const current = getRelativeCoords(e);
      let endPoint = { ...current };

      // Snap to nearby anchors while drawing line
      if (activeTool === 'line') {
        const anchors = document.querySelectorAll('.anchor-point');
        anchors.forEach(el => {
          const rect = el.getBoundingClientRect();
          const dist = Math.hypot(e.clientX - (rect.left + rect.width/2), e.clientY - (rect.top + rect.height/2));
          if (dist < 20) {
            const assetId = el.dataset.assetId;
            const pos = el.dataset.pos;
            const asset = assets.find(a => a.id === assetId);
            endPoint = getAnchorCoords(asset, pos);
          }
        });
      }

      setTempShape({
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        w: Math.abs(endPoint.x - startPoint.x),
        h: Math.abs(endPoint.y - startPoint.y),
        x2: endPoint.x, y2: endPoint.y
      });
    }

    if (dragId) {
      const coords = getRelativeCoords(e);
      setAssets(assets.map(a => a.id === dragId ? { ...a, x: coords.x, y: coords.y } : a));
    }
  };

  const handleMouseUp = async (e) => {
    setIsPanning(false);

    if (isDrawing && tempShape) {
      let finalEnd = { x: tempShape.x2, y: tempShape.y2 };
      
      // Final snap check on MouseUp
      if (activeTool === 'line') {
        const anchorEl = e.target.closest('.anchor-point');
        if (anchorEl) {
          const assetId = anchorEl.dataset.assetId;
          const pos = anchorEl.dataset.pos;
          const asset = assets.find(a => a.id === assetId);
          finalEnd = getAnchorCoords(asset, pos);
        }
      }

      const newAsset = {
        floor_id: floorId,
        type: 'shape',
        sub_type: activeTool,
        x: activeTool === 'line' ? startPoint.x : tempShape.x,
        y: activeTool === 'line' ? startPoint.y : tempShape.y,
        width: activeTool === 'line' ? finalEnd.x : tempShape.w,
        height: activeTool === 'line' ? finalEnd.y : tempShape.h,
        color: activeTool === 'line' ? '#94a3b8' : '#6366f1'
      };
      const { data } = await supabase.from('plan_assets').insert(newAsset).select().single();
      if (data) setAssets([...assets, data]);
    }

    if (dragId) {
      const asset = assets.find(a => a.id === dragId);
      await supabase.from('plan_assets').update({ x: asset.x, y: asset.y }).eq('id', dragId);
      setDragId(null);
    }

    setIsDrawing(false);
    setTempShape(null);
  };

  const updateAsset = async (id, updates) => {
    const { error } = await supabase.from('plan_assets').update(updates).eq('id', id);
    if (!error) {
      setAssets(assets.map(a => a.id === id ? { ...a, ...updates } : a));
      if (selectedAsset?.id === id) setSelectedAsset({ ...selectedAsset, ...updates });
    }
  };

  const deleteAsset = async (id) => {
    if (!confirm('Effacer cet élément ?')) return;
    await supabase.from('plan_assets').delete().eq('id', id);
    setAssets(assets.filter(a => a.id !== id));
    setSelectedAsset(null);
  };

  return (
    <div className="designer-container">
      {/* TOOLBAR */}
      <div className="designer-toolbar card">
        <button className="btn-back" onClick={onBack} style={{ marginBottom: '15px', color: '#94a3b8', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Retour
        </button>

        <div className="toolbar-section">
          <h3>Étage Actuel</h3>
          <select value={floorId} onChange={(e) => setFloorId(parseInt(e.target.value))} className="toolbar-select">
            {FLOORS.map(f => <option key={f.id} value={f.id}>{f.fullName}</option>)}
          </select>
        </div>

        <div className="toolbar-section">
          <h3>Navigation</h3>
          <div className="tool-grid">
            <button className={`tool-btn ${activeTool === 'select' && !showIconLibrary ? 'active' : ''}`} onClick={() => {setActiveTool('select'); setShowIconLibrary(false);}}><MousePointer2 size={20}/></button>
            <button className={`tool-btn ${activeTool === 'pan' ? 'active' : ''}`} onClick={() => setActiveTool('pan')}><Hand size={20}/></button>
            <div className="zoom-mini">
              <button onClick={() => setZoom(z => Math.min(5, z + 0.5))}><ZoomIn size={14}/></button>
              <button onClick={() => setZoom(z => Math.max(0.2, z - 0.5))}><ZoomOut size={14}/></button>
            </div>
          </div>
        </div>

        <div className="toolbar-section">
          <h3>Dessiner</h3>
          <div className="tool-grid">
            {TOOLS.filter(t => ['rect', 'circle', 'line', 'text'].includes(t.id)).map(t => (
              <button key={t.id} className={`tool-btn ${activeTool === t.id ? 'active' : ''}`} onClick={() => {setActiveTool(t.id); setShowIconLibrary(false);}}><t.icon size={20}/></button>
            ))}
          </div>
        </div>

        <div className="toolbar-section">
          <h3>Ajouter Équipement</h3>
          <div className="custom-equip-preview" onClick={() => setShowIconLibrary(true)} style={{ color: customEquip.color }}>
            {(() => { const Icon = findIcon(customEquip.iconId); return <Icon size={24} /> })()}
            <span>Bibliothèque</span>
            <Plus size={14} className="plus-badge" />
          </div>
        </div>

        {selectedAsset && (
          <div className="inspector card">
            <h3>Inspecteur</h3>
            <div className="inspector-field">
              <label>Nom / Label</label>
              <input type="text" value={selectedAsset.label || ''} onChange={(e) => updateAsset(selectedAsset.id, { label: e.target.value })} />
            </div>
            
            <div className="inspector-field">
              <label>Taille ({Math.round(selectedAsset.width)}px)</label>
              <input type="range" min="9" max="250" value={selectedAsset.width} onChange={(e) => {
                const s = parseInt(e.target.value);
                updateAsset(selectedAsset.id, { width: s, height: s });
              }} />
            </div>

            <div className="inspector-field">
              <label>Couleur</label>
              <input type="color" value={selectedAsset.color || '#6366f1'} onChange={(e) => updateAsset(selectedAsset.id, { color: e.target.value })} />
            </div>

            <button className="btn-delete" onClick={() => deleteAsset(selectedAsset.id)}>
              <Trash2 size={14} /> Supprimer
            </button>
          </div>
        )}
      </div>

      {/* VIEWPORT */}
      <div className="designer-viewport" ref={containerRef} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseDown={handleMouseDown} style={{ cursor: activeTool === 'pan' ? 'grab' : (activeTool === 'line' ? 'crosshair' : 'default') }}>
        <div className="plan-canvas" ref={planRef} style={{ transform: `scale(${zoom}) translate(${pan.x/zoom}px, ${pan.y/zoom}px)`, transformOrigin: '0 0' }}>
          <img src={`/plans/floor${floorId}.jpg`} draggable="false" style={{ opacity: 0.8 }} />
          
          <svg className="drawing-svg">
            {assets.filter(a => a.type === 'shape').map(asset => {
              const commonProps = {
                key: asset.id,
                fill: "none",
                stroke: asset.color,
                strokeWidth: "2",
                style: { pointerEvents: 'auto', cursor: 'pointer' },
                onClick: (e) => { e.stopPropagation(); setSelectedAsset(asset); }
              };
              if (asset.sub_type === 'rect') return <rect {...commonProps} x={`${asset.x}%`} y={`${asset.y}%`} width={`${asset.width}%`} height={`${asset.height}%`} />;
              if (asset.sub_type === 'circle') return <ellipse {...commonProps} cx={`${asset.x + asset.width/2}%`} cy={`${asset.y + asset.height/2}%`} rx={`${asset.width/2}%`} ry={`${asset.height/2}%`} />;
              if (asset.sub_type === 'line') return <line {...commonProps} x1={`${asset.x}%`} y1={`${asset.y}%`} x2={`${asset.width}%`} y2={`${asset.height}%`} />;
              return null;
            })}
            {tempShape && (
              <>
                {activeTool === 'rect' && <rect x={`${tempShape.x}%`} y={`${tempShape.y}%`} width={`${tempShape.w}%`} height={`${tempShape.h}%`} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2" />}
                {activeTool === 'circle' && <ellipse cx={`${tempShape.x + tempShape.w/2}%`} cy={`${tempShape.y + tempShape.h/2}%`} rx={`${tempShape.w/2}%`} ry={`${tempShape.h/2}%`} fill="rgba(99,102,241,0.2)" stroke="#6366f1" strokeWidth="2" />}
                {activeTool === 'line' && <line x1={`${startPoint.x}%`} y1={`${startPoint.y}%`} x2={`${tempShape.x2}%`} y2={`${tempShape.y2}%`} stroke="#6366f1" strokeWidth="2" strokeDasharray="4" />}
              </>
            )}
          </svg>

          {assets.filter(a => a.type === 'equipment').map(asset => {
            const ToolIcon = findIcon(asset.sub_type);
            const size = asset.width || 32;
            const isSelected = selectedAsset?.id === asset.id;
            return (
              <div 
                key={asset.id} className={`asset-node ${isSelected ? 'active' : ''}`} 
                style={{ left: `${asset.x}%`, top: `${asset.y}%`, color: asset.color, width: `${size}px`, height: `${size}px` }} 
                onMouseDown={(e) => { e.stopPropagation(); if (activeTool === 'select') { setDragId(asset.id); setSelectedAsset(asset); } }}
                onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset); }}
              >
                <ToolIcon size={size * 0.7} />
                
                {/* POINTS DE CONNEXION (Cliquables pour câblage) */}
                <div className="anchor-point top" data-asset-id={asset.id} data-pos="top" onMouseDown={(e) => e.stopPropagation()} />
                <div className="anchor-point right" data-asset-id={asset.id} data-pos="right" onMouseDown={(e) => e.stopPropagation()} />
                <div className="anchor-point bottom" data-asset-id={asset.id} data-pos="bottom" onMouseDown={(e) => e.stopPropagation()} />
                <div className="anchor-point left" data-asset-id={asset.id} data-pos="left" onMouseDown={(e) => e.stopPropagation()} />
              </div>
            );
          })}
        </div>

        {showIconLibrary && (
          <div className="icon-picker-modal card">
            <div className="modal-header">
              <h3>Choisir un Équipement</h3>
              <button onClick={() => setShowIconLibrary(false)}><X size={18}/></button>
            </div>
            <div className="modal-body">
              {Object.entries(ICON_LIBRARY).map(([cat, icons]) => (
                <div key={cat} className="icon-cat">
                  <h4>{cat}</h4>
                  <div className="icon-grid">
                    {icons.map(item => (
                      <button key={item.id} className={`icon-choice ${customEquip.iconId === item.id ? 'active' : ''}`} onClick={() => setCustomEquip({...customEquip, iconId: item.id, label: item.label})}>
                        <item.icon size={20} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .designer-container { display: flex; height: calc(100vh - 120px); background: #020617; overflow: hidden; }
        .designer-toolbar { width: 280px; padding: 20px; display: flex; flex-direction: column; gap: 20px; z-index: 100; border-right: 1px solid #1e293b; overflow-y: auto; }
        .toolbar-section h3 { font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; font-weight: 800; }
        .toolbar-select { width: 100%; padding: 10px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; color: white; }
        .tool-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .tool-btn { height: 45px; background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; color: #94a3b8; display: flex; align-items: center; justify-content: center; }
        .tool-btn.active { background: #6366f1; color: white; border-color: #6366f1; }
        
        .custom-equip-preview { background: #0f172a; border: 2px dashed #1e293b; border-radius: 12px; padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; position: relative; }
        .custom-equip-preview:hover { border-color: var(--color-accent); }
        .plus-badge { position: absolute; top: 8px; right: 8px; background: var(--color-accent); border-radius: 50%; color: white; }

        .icon-picker-modal { position: absolute; top: 20px; left: 20px; width: 380px; max-height: 80%; background: #111827; z-index: 200; border: 1px solid #334155; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .modal-header { padding: 15px; border-bottom: 1px solid #1e293b; display: flex; justify-content: space-between; align-items: center; }
        .modal-body { padding: 15px; overflow-y: auto; flex: 1; }
        .icon-cat h4 { font-size: 0.65rem; color: #475569; text-transform: uppercase; margin: 15px 0 8px; }
        .icon-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .icon-choice { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 10px; background: #1e293b; border-radius: 8px; color: #94a3b8; border: 1px solid transparent; }
        .icon-choice.active { border-color: #6366f1; color: white; background: rgba(99,102,241,0.2); }

        .asset-node { position: absolute; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.6); border: 2px solid; border-radius: 8px; cursor: grab; z-index: 10; pointer-events: auto; }
        .asset-node.active { border-width: 3px; box-shadow: 0 0 15px currentColor; }
        
        .anchor-point { position: absolute; width: 10px; height: 10px; background: white; border: 1.5px solid #1e293b; border-radius: 50%; opacity: 0; pointer-events: auto; z-index: 20; transition: opacity 0.2s; cursor: crosshair; }
        .asset-node:hover .anchor-point, .asset-node.active .anchor-point { opacity: 1; }
        .anchor-point:hover { transform: scale(1.4); background: #6366f1; border-color: white; }
        .anchor-point.top { top: -12px; left: 50%; transform: translateX(-50%); }
        .anchor-point.right { right: -12px; top: 50%; transform: translateY(-50%); }
        .anchor-point.bottom { bottom: -12px; left: 50%; transform: translateX(-50%); }
        .anchor-point.left { left: -12px; top: 50%; transform: translateY(-50%); }

        .designer-viewport { flex: 1; position: relative; overflow: hidden; background: #000; }
        .plan-canvas { position: absolute; top:0; left:0; }
        .drawing-svg { position: absolute; top:0; left:0; width:100%; height:100%; pointer-events: none; z-index: 5; }
        .inspector { padding: 15px; background: #0f172a; border-radius: 12px; display: flex; flex-direction: column; gap: 15px; border: 1px solid #1e293b; margin-top: auto; }
        .btn-delete { width: 100%; padding: 10px; background: rgba(239, 68, 68, 0.1); color: #ef4444; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.2); }
      `}</style>
    </div>
  );
}
