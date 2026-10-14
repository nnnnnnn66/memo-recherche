import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ParcoursPage } from './pages/ParcoursPage';
import { RessourcesPage } from './pages/RessourcesPage';

const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-ivory text-oxford-muted text-sm font-reading space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-ochre border-t-transparent animate-spin" />
        <span>Chargement de votre espace...</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Route de travail plein écran dédiée au chat méthodologique */}
      <Route
        path="/workspace"
        element={user ? <WorkspacePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/dashboard"
        element={user ? <WorkspacePage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/projects/:id"
        element={user ? <WorkspacePage /> : <Navigate to="/login" replace />}
      />

      {/* Pages publiques et institutionnelles avec Header et Footer */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col bg-ivory text-oxford selection:bg-ochre-soft selection:text-ochre">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/accueil" element={<HomePage />} />
                <Route path="/parcours" element={<ParcoursPage />} />
                <Route path="/ressources" element={<RessourcesPage />} />
                <Route
                  path="/login"
                  element={user ? <Navigate to="/workspace" replace /> : <LoginPage />}
                />
                <Route
                  path="/register"
                  element={user ? <Navigate to="/workspace" replace /> : <RegisterPage />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
};
