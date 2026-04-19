import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Plus, Trash2, CheckCircle2, Circle, AlertCircle, 
  ClipboardList, Package, Calendar
} from 'lucide-react';

export default function TodoListView() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newType, setNewType] = useState('task'); // 'task' or 'material'
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
    
    // Abonnement Realtime
    const channel = supabase
      .channel('daily_todos_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_todos' }, () => {
        fetchTodos();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchTodos = async () => {
    const { data } = await supabase
      .from('daily_todos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTodos(data);
    setIsLoading(false);
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    console.log('Tentative d\'ajout:', { task: newTask, type: newType });

    const { error } = await supabase.from('daily_todos').insert({
      task: newTask,
      type: newType,
      is_completed: false
    });

    if (error) {
      console.error('Erreur Supabase lors de l\'ajout:', error);
      alert('Erreur : La table n\'existe peut-être pas ou Supabase est déconnecté. Vérifiez que vous avez bien lancé le script SQL.');
    } else {
      setNewTask('');
      fetchTodos(); // Forcer le rafraîchissement au cas où le realtime tarde
    }
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

      {/* Formulaire d'ajout */}
      <form className="todo-form card" onSubmit={addTodo}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Ex: Passer les câbles bloc 4 ou Manque 10 connecteurs RJ45..." 
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="todo-input"
            style={{ flex: 1, minWidth: '250px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              value={newType} 
              onChange={(e) => setNewType(e.target.value)}
              className="todo-select"
            >
              <option value="task">📝 Tâche</option>
              <option value="material">📦 Matériel</option>
            </select>
            <button type="submit" className="btn-primary" style={{ padding: '0 20px' }}>
              <Plus size={18} /> Ajouter
            </button>
          </div>
        </div>
      </form>

      <div className="todo-grid">
        {/* Colonne Tâches */}
        <div className="todo-column">
          <div className="column-header">
            <Calendar size={20} />
            <h2>Tâches à accomplir</h2>
            <span className="badge">{tasks.length}</span>
          </div>
          
          <div className="todo-list">
            {tasks.length === 0 && <p className="empty-msg">Aucune tâche prévue</p>}
            {tasks.map(todo => (
              <div key={todo.id} className={`todo-item ${todo.is_completed ? 'completed' : ''}`}>
                <button 
                  className="todo-checkbox" 
                  onClick={() => toggleTodo(todo.id, todo.is_completed)}
                >
                  {todo.is_completed ? <CheckCircle2 color="var(--color-completed)" /> : <Circle />}
                </button>
                <div className="todo-content">
                  {todo.task}
                </div>
                <button className="todo-delete" onClick={() => deleteTodo(todo.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne Matériel */}
        <div className="todo-column">
          <div className="column-header" style={{ color: 'var(--color-issue)' }}>
            <Package size={20} />
            <h2>Matériel Manquant</h2>
            <span className="badge badge-error">{materials.length}</span>
          </div>

          <div className="todo-list">
            {materials.length === 0 && <p className="empty-msg">Tout le matériel est là</p>}
            {materials.map(todo => (
              <div key={todo.id} className={`todo-item material-item ${todo.is_completed ? 'completed' : ''}`}>
                <button 
                  className="todo-checkbox" 
                  onClick={() => toggleTodo(todo.id, todo.is_completed)}
                >
                  {todo.is_completed ? <CheckCircle2 color="var(--color-completed)" /> : <AlertCircle color="var(--color-issue)" />}
                </button>
                <div className="todo-content">
                  {todo.task}
                </div>
                <button className="todo-delete" onClick={() => deleteTodo(todo.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
