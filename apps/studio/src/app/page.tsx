'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLessonScripts, getSafetyLogs } from '../lib/api';

export default function StudioHome() {
  const [pendingLessons, setPendingLessons] = useState(0);
  const [safetyFailures, setSafetyFailures] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLessonScripts({ admin_approved: 'false' }),
      getSafetyLogs({ passed: 'false' }),
    ])
      .then(([lessons, logs]) => {
        setPendingLessons(lessons.length);
        setSafetyFailures(logs.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      href: '/lessons',
      title: 'Lecciones',
      description: 'Revisar y aprobar scripts de lecciones',
      count: pendingLessons,
      countLabel: 'pendientes',
      color: 'bg-indigo-50 border-indigo-200',
    },
    {
      href: '/phenomena',
      title: 'Fenómenos',
      description: 'Revisar propuestas de fenómenos',
      color: 'bg-emerald-50 border-emerald-200',
    },
    {
      href: '/safety',
      title: 'Seguridad',
      description: 'Registros de verificaciones de seguridad',
      count: safetyFailures,
      countLabel: 'fallos recientes',
      color: 'bg-red-50 border-red-200',
    },
    {
      href: '/standards',
      title: 'Estándares',
      description: 'Explorar estándares SEP',
      color: 'bg-amber-50 border-amber-200',
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Curriculum Studio</h1>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className={`block rounded-xl p-6 border ${card.color} hover:shadow-md transition-shadow`}
            >
              <h2 className="text-lg font-semibold">{card.title}</h2>
              <p className="text-sm text-gray-600 mt-1">{card.description}</p>
              {card.count !== undefined && card.count > 0 && (
                <p className="text-sm font-medium mt-3 text-gray-800">
                  {card.count} {card.countLabel}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
