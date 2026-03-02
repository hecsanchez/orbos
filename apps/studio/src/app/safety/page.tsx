'use client';

import { useEffect, useState } from 'react';
import type { SafetyLogResponseDto } from '@orbos/types';
import { getSafetyLogs } from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';

export default function SafetyPage() {
  const [logs, setLogs] = useState<SafetyLogResponseDto[]>([]);
  const [filterPassed, setFilterPassed] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const filters: { passed?: string; content_type?: string } = {};
    if (filterPassed !== 'all') filters.passed = filterPassed;
    if (filterType !== 'all') filters.content_type = filterType;

    getSafetyLogs(filters)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filterPassed, filterType]);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Registros de Seguridad</h1>
        <div className="flex gap-3">
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={filterPassed}
            onChange={(e) => setFilterPassed(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="true">Aprobados</option>
            <option value="false">Rechazados</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-white"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tipo: Todos</option>
            <option value="script">Script</option>
            <option value="phenomenon">Fenómeno</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : logs.length === 0 ? (
        <p className="text-gray-400">No hay registros.</p>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Tipo
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Resultado
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Intento
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Fecha
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Flags
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === log.id ? null : log.id)
                  }
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    {log.content_type}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={String(log.passed)} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    #{log.attempt_number}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(log.created_at).toLocaleString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    {log.flags.length > 0 ? (
                      expandedId === log.id ? (
                        <ul className="list-disc list-inside text-xs text-red-600">
                          {log.flags.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {log.flags.length} flag
                          {log.flags.length !== 1 ? 's' : ''}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
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
