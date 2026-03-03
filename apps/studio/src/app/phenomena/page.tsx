'use client';

import { useEffect, useState } from 'react';
import type { StudentResponseDto, PhenomenonResponseDto } from '@orbos/types';
import {
  getStudents,
  getPhenomenaForStudent,
  approvePhenomenon,
  batchProposePhenomena,
  batchApprovePhenomena,
} from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { FacilitationGuidePreview } from '../../components/FacilitationGuidePreview';

export default function PhenomenaPage() {
  const [students, setStudents] = useState<StudentResponseDto[]>([]);
  const [phenomenaByStudent, setPhenomenaByStudent] = useState<
    Record<string, PhenomenonResponseDto[]>
  >({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);

  const fetchAll = async () => {
    try {
      const studentList = await getStudents();
      setStudents(studentList);

      const phenomenaMap: Record<string, PhenomenonResponseDto[]> = {};
      await Promise.all(
        studentList.map(async (s) => {
          try {
            phenomenaMap[s.id] = await getPhenomenaForStudent(s.id);
          } catch {
            phenomenaMap[s.id] = [];
          }
        }),
      );
      setPhenomenaByStudent(phenomenaMap);
    } catch {
      // fail silently
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleApprove = async (id: string) => {
    await approvePhenomenon(id, 'studio-admin');
    fetchAll();
  };

  const handleBatchGenerate = async () => {
    setGenerating(true);
    try {
      await batchProposePhenomena();
      await fetchAll();
    } catch {
      // fail silently
    }
    setGenerating(false);
  };

  const handleBatchApprove = async () => {
    setApproving(true);
    try {
      await batchApprovePhenomena('studio-admin');
      await fetchAll();
    } catch {
      // fail silently
    }
    setApproving(false);
  };

  const pendingCount = Object.values(phenomenaByStudent)
    .flat()
    .filter((p) => p.status === 'pending').length;

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Fenómenos</h1>
        <p className="text-gray-400">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Fenómenos</h1>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            onClick={handleBatchGenerate}
            disabled={generating}
          >
            {generating ? 'Generando...' : 'Generar para todos'}
          </button>
          {pendingCount > 0 && (
            <button
              className="px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              onClick={handleBatchApprove}
              disabled={approving}
            >
              {approving
                ? 'Aprobando...'
                : `Aprobar todos (${pendingCount})`}
            </button>
          )}
        </div>
      </div>

      {students.map((student) => {
        const phenomena = phenomenaByStudent[student.id] ?? [];
        if (phenomena.length === 0) return null;

        return (
          <div key={student.id} className="mb-8">
            <h2 className="text-lg font-semibold mb-3">
              {student.name}{' '}
              <span className="text-sm text-gray-400 font-normal">
                ({student.age} a&ntilde;os, Grado {student.grade_target})
              </span>
            </h2>
            <div className="space-y-2">
              {phenomena.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() =>
                      setExpandedId(expandedId === p.id ? null : p.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{p.title}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        {p.linked_standards.join(', ')}
                      </span>
                      {p.status === 'pending' && (
                        <button
                          className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(p.id);
                          }}
                        >
                          Aprobar
                        </button>
                      )}
                      <span className="text-gray-400 text-sm">
                        {expandedId === p.id ? '▲' : '▼'}
                      </span>
                    </div>
                  </div>
                  {expandedId === p.id && (
                    <div className="border-t border-gray-100 p-4 space-y-4">
                      <FacilitationGuidePreview guide={p.facilitation_guide} />
                      {p.evidence_prompt && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">
                            Prompt de evidencia
                          </h4>
                          {(() => {
                            try {
                              const ep =
                                typeof p.evidence_prompt === 'string'
                                  ? JSON.parse(p.evidence_prompt)
                                  : p.evidence_prompt;
                              return (
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p>{ep.instruction_text}</p>
                                  {ep.capture_type && (
                                    <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                      {ep.capture_type}
                                    </span>
                                  )}
                                </div>
                              );
                            } catch {
                              return (
                                <p className="text-sm text-gray-600">
                                  {String(p.evidence_prompt)}
                                </p>
                              );
                            }
                          })()}
                        </div>
                      )}
                      {p.materials_needed.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700">
                            Materiales
                          </h4>
                          <p className="text-sm text-gray-600">
                            {p.materials_needed.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
