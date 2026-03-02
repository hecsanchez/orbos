'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import type {
  MasteryResponseDto,
  EvidenceResponseDto,
  PhenomenonResponseDto,
  StandardResponseDto,
} from '@orbos/types';
import {
  getMasteryForStudent,
  getEvidenceForStudent,
  getPhenomenaForStudent,
  getStandards,
} from '../../../lib/api';
import { MasteryHeatMap } from '../../../components/MasteryHeatMap';
import { CoverageChart } from '../../../components/CoverageChart';
import { EvidencePortfolio } from '../../../components/EvidencePortfolio';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function StudentDashboard({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = use(params);

  const [mastery, setMastery] = useState<MasteryResponseDto[]>([]);
  const [evidence, setEvidence] = useState<EvidenceResponseDto[]>([]);
  const [phenomena, setPhenomena] = useState<PhenomenonResponseDto[]>([]);
  const [standards, setStandards] = useState<StandardResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [m, e, p, s] = await Promise.all([
      getMasteryForStudent(studentId),
      getEvidenceForStudent(studentId),
      getPhenomenaForStudent(studentId),
      getStandards(),
    ]);
    setMastery(m);
    setEvidence(e);
    setPhenomena(p);
    setStandards(s);
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <p className="text-gray-400 text-center py-12">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <header className="mb-8 flex items-center gap-4">
        <Link
          href="/"
          className="text-indigo-600 hover:text-indigo-800 text-sm"
        >
          &larr; Volver
        </Link>
        <h1 className="text-2xl font-bold">Progreso del Estudiante</h1>
      </header>

      <div className="space-y-8">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <MasteryHeatMap mastery={mastery} standards={standards} />
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <CoverageChart mastery={mastery} standards={standards} />
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <EvidencePortfolio evidence={evidence} phenomena={phenomena} />
        </section>
      </div>
    </div>
  );
}
