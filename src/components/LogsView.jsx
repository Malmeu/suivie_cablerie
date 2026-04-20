import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { History, Search, Clock, User, Info, Calendar } from 'lucide-react';

export default function LogsView() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();

    // Abonnement Realtime pour voir les modifs en direct
    const channel = supabase
      .channel('activity_logs_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setLogs(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (data) setLogs(data);
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (log.user_email && log.user_email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <h1 className="view-title">
          <History className="view-title-icon" />
          Historique d'Activité
        </h1>
        <p className="view-subtitle">Suivez toutes les modifications apportées au chantier</p>
      </div>

      <div className="search-bar card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px' }}>
        <Search size={18} color="var(--color-text-muted)" />
        <input 
          type="text" 
          placeholder="Rechercher une action, un bloc ou un utilisateur..." 
          style={{ background: 'none', border: 'none', color: 'white', flex: 1, outline: 'none' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="logs-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Chargement de l'histoire...</div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>Aucune activité enregistrée.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="log-card card">
              <div className="log-icon">
                <Clock size={16} color="var(--color-accent)" />
              </div>
              <div className="log-body">
                <div className="log-action">{log.action}</div>
                <div className="log-details">{log.details}</div>
                <div className="log-meta">
                  <span className="log-user"><User size={12} /> {log.user_email || 'Utilisateur Anonyme'}</span>
                  <span className="log-time"><Calendar size={12} /> {formatDate(log.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
