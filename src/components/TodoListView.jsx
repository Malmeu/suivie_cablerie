import { useState, useEffect } from 'react';
import { supabase, logAction } from '../lib/supabase';
import { 
  Plus, Trash2, CheckCircle2, Circle, AlertCircle, 
  ClipboardList, Package, Calendar, MessageSquare, StickyNote,
  Building2, Cable, Monitor
} from 'lucide-react';
import { FLOORS } from '../data/cableTypes';

export default function TodoListView() {
  const [todos, setTodos] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newType, setNewType] = useState('task'); 
  const [isLoading, setIsLoading] = useState(true);

  // Note states
  const [selectedFloor, setSelectedFloor] = useState(0);
  const [newRemark, setNewRemark] = useState('');
  const [newRemarkCat, setNewRemarkCat] = useState('Général');

  useEffect(() => {
    fetchTodos();
    fetchRemarks();
    
    const todoChannel = supabase.channel('daily_todos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_todos' }, fetchTodos)
      .subscribe();

    const remarkChannel = supabase.channel('floor_remarks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'floor_remarks' }, fetchRemarks)
      .subscribe();

    return () => { 
      supabase.removeChannel(todoChannel); 
      supabase.removeChannel(remarkChannel); 
    };
  }, []);

  const fetchTodos = async () => {
    const { data } = await supabase.from('daily_todos').select('*').order('created_at', { ascending: false });
    if (data) setTodos(data);
    setIsLoading(false);
  };

  const fetchRemarks = async () => {
    const { data } = await supabase.from('floor_remarks').select('*').order('created_at', { ascending: false });
    if (data) setRemarks(data);
  };

  const addTodo = async (e) => {
    if (e) e.preventDefault();
    const taskText = newTask.trim();
    if (!taskText) return;

    const { error } = await supabase.from('daily_todos').insert({
      task: taskText, type: newType, is_completed: false
    });
    if (!error) {
      setNewTask('');
      logAction('Todo Ajouté', `${newType === 'task' ? 'Tâche' : 'Matériel'} : ${taskText}`);
    }
  };

  const addRemark = async () => {
    if (!newRemark.trim()) return;
    const { error } = await supabase.from('floor_remarks').insert({
      floor_id: selectedFloor,
      content: newRemark.trim(),
      category: newRemarkCat
    });
    if (!error) {
      setNewRemark('');
      logAction('Remarque Ajoutée', `Étage ${selectedFloor} : ${newRemark.trim()}`);
    }
  };

  const deleteRemark = async (id) => {
    await supabase.from('floor_remarks').delete().eq('id', id);
  };

  const toggleTodo = async (id, currentStatus) => {
    await supabase.from('daily_todos').update({ is_completed: !currentStatus }).eq('id', id);
  };

  const deleteTodo = async (id) => {
    await supabase.from('daily_todos').delete().eq('id', id);
  };

  const tasks = todos.filter(t => t.type === 'task');
  const materials = todos.filter(t => t.type === 'material');

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">
          <ClipboardList className="view-title-icon" />
          Todo List du Jour
        </h1>
        <p className="view-subtitle">Gérez vos priorités et le matériel manquant</p>
      </div>

      <div className="todo-grid">
        {/* Colonne Tâches & Matériel (en une seule grille pour gagner de la place) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form className="todo-form card" onSubmit={addTodo}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input 
                type="text" placeholder="Nouvelle tâche ou pièce de matériel..." 
                value={newTask} onChange={(e) => setNewTask(e.target.value)}
                className="todo-input" style={{ flex: 1, minWidth: '200px' }}
              />
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="toolbar-select" style={{ width: 'auto' }}>
                <option value="task">📝 Tâche</option>
                <option value="material">📦 Matériel</option>
              </select>
              <button type="submit" className="btn-primary" style={{ padding: '0 15px' }}><Plus size={18} /></button>
            </div>
          </form>

          <div className="todo-columns-wrapper" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {/* Tâches */}
            <div className="todo-column card">
              <div className="column-header"><Calendar size={18} /> <h3>Tâches</h3> <span className="badge">{tasks.length}</span></div>
              <div className="todo-list">
                {tasks.map(todo => (
                  <div key={todo.id} className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
                    <button className="todo-checkbox" onClick={() => toggleTodo(todo.id, todo.is_completed)}>{todo.is_completed ? <CheckCircle2 color="#10b981" /> : <Circle />}</button>
                    <span className="todo-content">{todo.task}</span>
                    <button className="todo-delete" onClick={() => deleteTodo(todo.id)}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            {/* Matériel */}
            <div className="todo-column card">
              <div className="column-header" style={{ color: '#ef4444' }}><Package size={18} /> <h3>Matériel Manquant</h3> <span className="badge badge-error">{materials.length}</span></div>
              <div className="todo-list">
                {materials.map(todo => (
                  <div key={todo.id} className={`todo-item material-item ${todo.is_completed ? 'completed' : ''}`}>
                    <button className="todo-checkbox" onClick={() => toggleTodo(todo.id, todo.is_completed)}>{todo.is_completed ? <CheckCircle2 color="#10b981" /> : <AlertCircle color="#ef4444" />}</button>
                    <span className="todo-content">{todo.task}</span>
                    <button className="todo-delete" onClick={() => deleteTodo(todo.id)}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* NOUVELLE SECTION : REMARQUES TECHNIQUES PAR ÉTAGE */}
        <div className="remarks-section card">
          <div className="column-header" style={{ color: 'var(--color-accent)' }}>
            <Building2 size={20} />
            <h2>Remarques Techniques par Étage</h2>
          </div>

          <div className="remarks-form">
            <div className="remark-inputs">
              <select value={selectedFloor} onChange={(e) => setSelectedFloor(parseInt(e.target.value))} className="toolbar-select">
                {FLOORS.map(f => <option key={f.id} value={f.id}>{f.fullName}</option>)}
              </select>
              <select value={newRemarkCat} onChange={(e) => setNewRemarkCat(e.target.value)} className="toolbar-select">
                <option value="Général">🌐 Général</option>
                <option value="Équipement">🎥 Équipement</option>
                <option value="Câble">🔌 Câble</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <textarea 
                placeholder="Notez une remarque technique importante..." 
                value={newRemark} onChange={(e) => setNewRemark(e.target.value)}
                className="todo-input" style={{ flex: 1, minHeight: '60px', borderRadius: '12px' }}
              />
              <button onClick={addRemark} className="btn-primary" style={{ padding: '0 20px' }}>
                <Plus size={18} />
              </button>
            </div>
          </div>

          <div className="remarks-list">
            {remarks.length === 0 && <p className="empty-msg">Aucune remarque enregistrée</p>}
            {remarks.map(remark => (
              <div key={remark.id} className="remark-item">
                <div className="remark-header">
                  <span className="remark-floor">{FLOORS.find(f => f.id === remark.floor_id)?.fullName}</span>
                  <span className="remark-cat">
                    {remark.category === 'Câble' && <Cable size={12} />}
                    {remark.category === 'Équipement' && <Monitor size={12} />}
                    {remark.category === 'Général' && <StickyNote size={12} />}
                    {remark.category}
                  </span>
                </div>
                <div className="remark-body">{remark.content}</div>
                <button className="remark-delete" onClick={() => deleteRemark(remark.id)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .todo-grid { display: flex; flex-direction: column; gap: 30px; margin-top: 20px; }
        .todo-columns-wrapper { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
        .todo-column { padding: 20px; min-height: 200px; }
        .column-header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; color: var(--color-text-primary); }
        .column-header h3, .column-header h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
        
        .remarks-section { padding: 25px; background: rgba(15, 23, 42, 0.4); border: 1px solid var(--color-border); }
        .remarks-form { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 1px solid var(--color-border); }
        .remark-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        
        .remarks-list { display: flex; flex-direction: column; gap: 12px; }
        .remark-item { background: rgba(30, 41, 59, 0.5); padding: 15px; border-radius: 12px; border-left: 4px solid var(--color-accent); position: relative; }
        .remark-header { display: flex; gap: 10px; margin-bottom: 8px; font-size: 0.75rem; }
        .remark-floor { color: var(--color-text-accent); font-weight: 700; text-transform: uppercase; }
        .remark-cat { display: flex; align-items: center; gap: 5px; color: var(--color-text-muted); background: rgba(255,255,255,0.05); padding: 2px 8px; border-radius: 4px; }
        .remark-body { font-size: 0.95rem; color: var(--color-text-primary); }
        .remark-delete { position: absolute; right: 10px; top: 10px; color: #475569; padding: 5px; opacity: 0.5; transition: 0.2s; }
        .remark-delete:hover { color: #f87171; opacity: 1; }
        
        .todo-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; margin-bottom: 8px; }
        .todo-content { flex: 1; font-size: 0.95rem; }
        .todo-checkbox { cursor: pointer; display: flex; }
        .completed .todo-content { text-decoration: line-through; opacity: 0.5; }
        .badge { background: var(--color-accent); color: white; padding: 2px 8px; border-radius: 99px; font-size: 0.75rem; }
        .badge-error { background: #ef4444; }
      `}</style>
    </div>
  );
}
