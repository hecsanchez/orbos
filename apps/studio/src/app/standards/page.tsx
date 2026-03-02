'use client';

import { useEffect, useState, useMemo } from 'react';
import type { StandardResponseDto } from '@orbos/types';
import { getStandards } from '../../lib/api';

export default function StandardsPage() {
  const [standards, setStandards] = useState<StandardResponseDto[]>([]);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStandards()
      .then(setStandards)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const subjects = useMemo(
    () => [...new Set(standards.map((s) => s.subject))].sort(),
    [standards],
  );

  const grades = useMemo(
    () => [...new Set(standards.map((s) => s.grade))].sort((a, b) => a - b),
    [standards],
  );

  const filtered = useMemo(() => {
    return standards.filter((s) => {
      if (filterSubject !== 'all' && s.subject !== filterSubject) return false;
      if (filterGrade !== 'all' && s.grade !== Number(filterGrade)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          s.id.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.topic?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [standards, filterSubject, filterGrade, search]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Estándares SEP</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar..."
          className="border rounded-lg px-3 py-2 text-sm bg-white w-64"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white"
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
        >
          <option value="all">Todas las materias</option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white"
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
        >
          <option value="all">Todos los grados</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              Grado {g}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-400">
          {filtered.length} de {standards.length}
        </span>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  ID
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Materia
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Grado
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Descripción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((std) => (
                <tr key={std.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                    {std.id}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{std.subject}</td>
                  <td className="px-4 py-3">{std.grade}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {std.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
