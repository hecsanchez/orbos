'use client';

import { useEffect, useState } from 'react';
import type { StudentResponseDto } from '@orbos/types';
import { getStudents } from '../lib/api';
import { StudentCard } from '../components/StudentCard';

export default function HomePage() {
  const [students, setStudents] = useState<StudentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getStudents()
      .then(setStudents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Orbos — Panel de Padres
        </h1>
        <p className="text-gray-500 mt-1">
          Selecciona un estudiante para ver su progreso
        </p>
      </header>

      {loading && (
        <p className="text-gray-400 text-center py-12">Cargando...</p>
      )}

      {error && (
        <p className="text-red-500 text-center py-12">Error: {error}</p>
      )}

      {!loading && !error && students.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">
            No hay estudiantes registrados a&uacute;n.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {students.map((s) => (
          <StudentCard key={s.id} student={s} />
        ))}
      </div>
    </div>
  );
}
