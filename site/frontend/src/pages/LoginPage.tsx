import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LogIn, AlertCircle, Eye, EyeOff, UserCheck, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'mr_saved_email';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberedEmail, setRememberedEmail] = useState<string | null>(null);
  const [useOtherAccount, setUseOtherAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setRememberedEmail(saved);
      setEmail(saved);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmail = (rememberedEmail && !useOtherAccount ? rememberedEmail : email).trim().toLowerCase();

    if (!finalEmail) {
      setError('Veuillez renseigner votre adresse email');
      return;
    }
    if (!password) {
      setError('Veuillez entrer votre code d\'accès / mot de passe');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login({ email: finalEmail, password });
      localStorage.setItem(STORAGE_KEY, finalEmail);
      navigate('/workspace');
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects. Vérifiez votre code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchAccount = () => {
    setUseOtherAccount(true);
    setEmail('');
    setPassword('');
    setError(null);
  };

  const handleUseRemembered = () => {
    if (rememberedEmail) {
      setUseOtherAccount(false);
      setEmail(rememberedEmail);
      setPassword('');
      setError(null);
    }
  };

  const isQuickLogin = Boolean(rememberedEmail && !useOtherAccount);

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-ivory-pure border border-oxford-border/20 p-8 rounded-2xl shadow-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-10 h-10 bg-oxford text-ivory rounded-xl mx-auto flex items-center justify-center font-serif font-bold text-lg shadow-2xs">
            MR
          </div>
          <h1 className="font-serif text-2xl font-bold text-oxford">
            Connexion au Chat
          </h1>
          <p className="text-xs text-oxford-muted font-reading">
            Accédez directement à vos consultations méthodologiques
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* MODE RECONNU : La personne s'est déjà connectée, elle entre juste son code */}
          {isQuickLogin ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-ochre-soft/50 border border-ochre/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-ochre text-ivory flex items-center justify-center font-bold text-xs shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-ochre block tracking-wider">
                      Compte mémorisé
                    </span>
                    <span className="font-semibold text-oxford text-xs truncate block">
                      {rememberedEmail}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSwitchAccount}
                  className="text-[11px] text-oxford-muted hover:text-ochre hover:underline shrink-0 ml-2"
                >
                  Changer
                </button>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-oxford mb-1">
                  Votre Code d'accès / Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Entrez votre mot de passe..."
                    className="w-full px-3.5 py-2.5 pr-10 border border-oxford-border/30 bg-ivory focus:bg-ivory-pure focus:outline-hidden focus:border-ochre rounded-xl text-oxford text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-oxford-muted hover:text-oxford p-1"
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* MODE STANDARD : Email + Mot de passe */
            <div className="space-y-4">
              {rememberedEmail && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={handleUseRemembered}
                    className="text-[11px] text-ochre hover:underline"
                  >
                    Revenir au compte {rememberedEmail}
                  </button>
                </div>
              )}

              <div>
                <label className="block font-semibold uppercase tracking-wider text-oxford mb-1">
                  Adresse email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="etudiant@universite.ci"
                  className="w-full px-3.5 py-2.5 border border-oxford-border/30 bg-ivory focus:bg-ivory-pure focus:outline-hidden focus:border-ochre rounded-xl text-oxford text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-oxford mb-1">
                  Code d'accès / Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 border border-oxford-border/30 bg-ivory focus:bg-ivory-pure focus:outline-hidden focus:border-ochre rounded-xl text-oxford text-sm transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-oxford-muted hover:text-oxford p-1"
                    title={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-ochre hover:bg-ochre-hover text-ivory font-semibold rounded-xl shadow-2xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-sm active:scale-[0.99]"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Connexion en cours...' : 'Se connecter'}</span>
            {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
          </button>
        </form>

        <p className="text-center text-xs text-oxford-muted pt-2 border-t border-oxford-border/10">
          Nouvel utilisateur ?{' '}
          <Link to="/register" className="text-ochre font-semibold hover:underline">
            Créer un compte rapidement
          </Link>
        </p>
      </div>
    </div>
  );
};
