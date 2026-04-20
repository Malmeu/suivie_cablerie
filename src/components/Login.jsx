import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Lock, Mail, ChevronRight } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Identifiants incorrects' : error.message);
      setLoading(false);
    } else {
      onLogin(data.user);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Activity size={32} color="var(--color-accent)" />
          </div>
          <h1>CâbleTrack Pro</h1>
          <p>Connectez-vous pour accéder au chantier</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label><Mail size={16} /> Email</label>
            <input 
              type="email" 
              placeholder="votre@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <label><Lock size={16} /> Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={loading} className="login-submit">
            {loading ? 'Connexion...' : 'Se connecter'}
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>

        <div className="login-footer">
          Système de gestion hospitalière sécurisé
        </div>
      </div>

    </div>
  );
}
