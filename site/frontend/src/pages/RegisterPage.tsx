import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { UserPlus, AlertCircle, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'mr_saved_email';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Veuillez renseigner votre adresse email.');
      return;
    }

    if (password.length < 4) {
      setError('Le mot de passe / code doit contenir au moins 4 caractères.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne sont pas identiques. Veuillez vérifier la confirmation.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register({ email: cleanEmail, password });
      // Mémoriser l'email pour que la prochaine connexion soit ultra-rapide
      localStorage.setItem(STORAGE_KEY, cleanEmail);
      navigate('/workspace');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte en base de données.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-ivory-pure border border-oxford-border/20 p-8 rounded-2xl shadow-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-10 h-10 bg-oxford text-ivory rounded-xl mx-auto flex items-center justify-center font-serif font-bold text-lg shadow-2xs">
            MR
          </div>
          <h1 className="font-serif text-2xl font-bold text-oxford">
            Créer un compte
          </h1>
          <p className="text-xs text-oxford-muted font-reading">
            Renseignez votre email et votre mot de passe pour accéder au chat
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* 1. EMAIL */}
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

          {/* 2. MOT DE PASSE */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-oxford mb-1">
              Mot de passe / Code d'accès
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Au moins 4 caractères..."
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

          {/* 3. CONFIRMATION DU MOT DE PASSE */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-semibold uppercase tracking-wider text-oxford">
                Confirmer le mot de passe
              </label>
              {passwordsMatch && (
                <span className="text-[10px] text-green-700 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Correspondance validée</span>
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={4}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez votre mot de passe..."
                className={`w-full px-3.5 py-2.5 pr-10 border rounded-xl text-oxford text-sm transition-colors bg-ivory focus:bg-ivory-pure focus:outline-hidden ${
                  confirmPassword && !passwordsMatch
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-oxford-border/30 focus:border-ochre'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-2.5 text-oxford-muted hover:text-oxford p-1"
                title={showConfirmPassword ? 'Masquer' : 'Afficher'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <span className="text-[10px] text-red-600 mt-1 block">
                Les mots de passe ne correspondent pas
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-ochre hover:bg-ochre-hover text-ivory font-semibold rounded-xl shadow-2xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-sm active:scale-[0.99] mt-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{loading ? 'Création du compte en base...' : 'Créer mon compte et ouvrir le Chat'}</span>
            {!loading && <ArrowRight className="w-4 h-4 ml-1" />}
          </button>
        </form>

        <p className="text-center text-xs text-oxford-muted pt-2 border-t border-oxford-border/10">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-ochre font-semibold hover:underline">
            Se connecter directement
          </Link>
        </p>
      </div>
    </div>
  );
};
