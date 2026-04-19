import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, Plus, Phone, Mail, Tag, Trash2, 
  ExternalLink, Search, User
} from 'lucide-react';

export default function SuppliersView() {
  const [suppliers, setSuppliers] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newSupplier, setNewSupplier] = useState({
    name: '', category: 'Câbles', contact_name: '', phone: '', email: ''
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('suppliers')
      .select('*')
      .order('name');
    if (data) setSuppliers(data);
  };

  const addSupplier = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('suppliers').insert(newSupplier);
    if (!error) {
      setNewSupplier({ name: '', category: 'Câbles', contact_name: '', phone: '', email: '' });
      setIsAdding(false);
      fetchSuppliers();
    }
  };

  const deleteSupplier = async (id) => {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    await supabase.from('suppliers').delete().eq('id', id);
    fetchSuppliers();
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="view-container">
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 className="view-title">
            <Users className="view-title-icon" />
            Fournisseurs
          </h1>
          <p className="view-subtitle">Gérez vos contacts et partenaires logistiques</p>
        </div>
        <button className="btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={18} /> Nouveau Fournisseur
        </button>
      </div>

      <div className="search-bar card" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px' }}>
        <Search size={18} color="var(--color-text-muted)" />
        <input 
          type="text" 
          placeholder="Rechercher un fournisseur ou une catégorie..." 
          style={{ background: 'none', border: 'none', color: 'white', flex: 1, outline: 'none' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isAdding && (
        <div className="modal-overlay">
          <div className="modal-card card">
            <h2>Ajouter un Fournisseur</h2>
            <form onSubmit={addSupplier} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <input 
                placeholder="Nom de l'entreprise" 
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}
                required
              />
              <select 
                value={newSupplier.category}
                onChange={(e) => setNewSupplier({...newSupplier, category: e.target.value})}
              >
                <option>Câbles</option>
                <option>Outillage</option>
                <option>Connecteurs</option>
                <option>Informatique</option>
                <option>Électricité</option>
                <option>Autre</option>
              </select>
              <input 
                placeholder="Nom du contact" 
                value={newSupplier.contact_name}
                onChange={(e) => setNewSupplier({...newSupplier, contact_name: e.target.value})}
              />
              <input 
                placeholder="Téléphone" 
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}
              />
              <input 
                placeholder="Email" 
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsAdding(false)} style={{ flex: 1 }}>Annuler</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="suppliers-grid">
        {filteredSuppliers.map(s => (
          <div key={s.id} className="supplier-card card">
            <div className="supplier-header">
              <div className="supplier-category">{s.category}</div>
              <button className="delete-btn" onClick={() => deleteSupplier(s.id)}><Trash2 size={14} /></button>
            </div>
            <h3 className="supplier-name">{s.name}</h3>
            
            <div className="supplier-info">
              {s.contact_name && (
                <div className="info-item">
                  <User size={14} /> <span>{s.contact_name}</span>
                </div>
              )}
              {s.phone && (
                <div className="info-item">
                  <Phone size={14} /> <a href={`tel:${s.phone}`}>{s.phone}</a>
                </div>
              )}
              {s.email && (
                <div className="info-item">
                  <Mail size={14} /> <a href={`mailto:${s.email}`}>{s.email}</a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
