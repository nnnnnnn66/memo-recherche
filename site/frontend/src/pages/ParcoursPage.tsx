import React, { useEffect, useState } from 'react';
import { api, type MethodologyStep } from '../api/client';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export const ParcoursPage: React.FC = () => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<MethodologyStep[]>([]);

  useEffect(() => {
    api.getSteps()
      .then((res) => setSteps(res.steps))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="max-w-2xl space-y-3">
        <span className="text-xs font-semibold text-ochre uppercase tracking-wider">
          Référentiel Méthodologique Universitaire
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-oxford">
          Le Parcours de Recherche en 12 Jalons
        </h1>
        <p className="font-reading text-oxford-muted text-base leading-relaxed">
          Chaque étape est adossée à un agent méthodologique dédié pour garantir la rigueur conceptuelle,
          la pertinence empirique et la clarté argumentative de votre mémoire de master ou de thèse.
        </p>
      </div>

      <div className="space-y-6">
        {steps.map((step) => (
          <article
            key={step.id}
            id={step.slug}
            className="bg-ivory-pure border border-oxford-border/20 hover:border-ochre/60 p-6 sm:p-8 rounded-2xl shadow-2xs transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-3">
                <span className="w-8 h-8 bg-oxford text-ivory rounded-xl flex items-center justify-center font-serif font-bold text-sm">
                  {step.position}
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-oxford">
                  {step.title}
                </h2>
              </div>
              <span className="text-xs font-mono text-ochre bg-ochre/10 border border-ochre/20 px-3 py-1 rounded-full self-start sm:self-auto">
                {step.slug}
              </span>
            </div>

            <p className="font-reading text-base text-oxford font-medium">
              {step.description}
            </p>

            <div className="bg-ivory border border-oxford-border/15 border-l-4 border-l-ochre p-4 rounded-xl">
              <h4 className="text-xs font-bold text-ochre uppercase tracking-wider mb-1 font-sans">
                Conseils méthodologiques & exigences du jury
              </h4>
              <p className="font-reading text-sm text-oxford-muted leading-relaxed">
                {step.guidance}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="bg-oxford text-ivory p-8 sm:p-12 rounded-2xl text-center space-y-4 shadow-lg">
        <h3 className="font-serif text-2xl font-bold">
          Prêt à structurer votre propre mémoire ?
        </h3>
        <p className="text-sm text-ivory/80 max-w-prose mx-auto font-reading">
          Accédez au Chat de consultation pour soumettre vos premières
          ébauches de sujet et de problématique selon les normes LMD & CAMES.
        </p>
        <Link
          to={user ? '/workspace' : '/register'}
          className="inline-flex items-center space-x-2 px-8 py-3.5 bg-ochre hover:bg-ochre-hover text-ivory rounded-full text-xs font-semibold shadow-md transition-colors"
        >
          <span>{user ? 'Ouvrir mon Chat de consultation' : 'Créer mon projet de recherche'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
