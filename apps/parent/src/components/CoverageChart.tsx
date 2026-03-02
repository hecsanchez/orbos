'use client';

import type { MasteryResponseDto, StandardResponseDto } from '@orbos/types';

interface Props {
  mastery: MasteryResponseDto[];
  standards: StandardResponseDto[];
}

export function CoverageChart({ mastery, standards }: Props) {
  const subjects = [...new Set(standards.map((s) => s.subject))].sort();
  const masteryMap = new Map(
    mastery.map((m) => [m.standard_id, m]),
  );

  const subjectData = subjects.map((subject) => {
    const subjectStandards = standards.filter((s) => s.subject === subject);
    const total = subjectStandards.length;
    const mastered = subjectStandards.filter((s) => {
      const m = masteryMap.get(s.id);
      return m && m.mastery_level >= 0.8;
    }).length;
    const pct = total > 0 ? (mastered / total) * 100 : 0;
    return { subject, total, mastered, pct };
  });

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Cobertura por Materia</h3>
      <div className="space-y-3">
        {subjectData.map(({ subject, total, mastered, pct }) => (
          <div key={subject}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{subject}</span>
              <span className="text-gray-500">
                {mastered}/{total} ({pct.toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  backgroundColor:
                    pct >= 80
                      ? 'hsl(120, 60%, 45%)'
                      : pct >= 40
                        ? 'hsl(48, 90%, 50%)'
                        : 'hsl(15, 80%, 55%)',
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
