'use client';

import { useEffect, useState } from 'react';
import type { LessonScriptResponseDto } from '@orbos/types';
import { getLessonScripts, approveLessonScript } from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { LessonPreview } from '../../components/LessonPreview';

type LessonRow = LessonScriptResponseDto & {
  student_age_target?: number;
  created_at?: string;
};

export default function LessonsPage() {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLessons = () => {
    const filters =
      filter === 'all'
        ? undefined
        : { admin_approved: filter === 'approved' ? 'true' : 'false' };
    getLessonScripts(filters)
      .then(setLessons)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLessons();
  }, [filter]);

  const handleApprove = async (id: string) => {
    await approveLessonScript(id);
    fetchLessons();
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Lecciones</h1>
        <select
          className="border rounded-lg px-3 py-2 text-sm bg-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="pending">Pendientes</option>
          <option value="approved">Aprobadas</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-400">Cargando...</p>
      ) : lessons.length === 0 ? (
        <p className="text-gray-400">No hay lecciones.</p>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedId(expandedId === lesson.id ? null : lesson.id)
                }
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-gray-600">
                    {lesson.standard_id}
                  </span>
                  <StatusBadge
                    status={lesson.admin_approved ? 'approved' : 'pending'}
                  />
                  <StatusBadge
                    status={lesson.safety_approved ? 'true' : 'false'}
                  />
                </div>
                <div className="flex items-center gap-3">
                  {lesson.created_at && (
                    <span className="text-xs text-gray-400">
                      {new Date(lesson.created_at).toLocaleDateString('es-MX')}
                    </span>
                  )}
                  {!lesson.admin_approved && (
                    <button
                      className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApprove(lesson.id);
                      }}
                    >
                      Aprobar
                    </button>
                  )}
                  <span className="text-gray-400 text-sm">
                    {expandedId === lesson.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>
              {expandedId === lesson.id && (
                <div className="border-t border-gray-100 p-4">
                  <LessonPreview script={lesson.script} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
