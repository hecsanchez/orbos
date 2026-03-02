'use client';

import type { MasteryResponseDto, StandardResponseDto } from '@orbos/types';

function masteryColor(level: number): string {
  if (level >= 0.8) return 'hsl(120, 60%, 45%)';
  if (level >= 0.5) return 'hsl(48, 90%, 50%)';
  if (level > 0) return 'hsl(15, 80%, 55%)';
  return '#e5e7eb';
}

interface Props {
  mastery: MasteryResponseDto[];
  standards: StandardResponseDto[];
}

export function MasteryHeatMap({ mastery, standards }: Props) {
  const subjects = [...new Set(standards.map((s) => s.subject))].sort();
  const masteryMap = new Map(
    mastery.map((m) => [m.standard_id, m]),
  );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Mapa de Dominio</h3>
      <div className="space-y-4">
        {subjects.map((subject) => {
          const subjectStandards = standards
            .filter((s) => s.subject === subject)
            .sort((a, b) => a.id.localeCompare(b.id));

          return (
            <div key={subject}>
              <p className="text-sm font-medium text-gray-600 mb-2">
                {subject}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {subjectStandards.map((std) => {
                  const m = masteryMap.get(std.id);
                  const level = m?.mastery_level ?? 0;
                  return (
                    <div
                      key={std.id}
                      title={`${std.id}: ${std.description}\nDominio: ${(level * 100).toFixed(0)}%`}
                      className="w-8 h-8 rounded cursor-help transition-transform hover:scale-125"
                      style={{ backgroundColor: masteryColor(level) }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#e5e7eb' }} />
          Sin datos
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(15, 80%, 55%)' }} />
          Bajo
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(48, 90%, 50%)' }} />
          Medio
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: 'hsl(120, 60%, 45%)' }} />
          Dominado
        </span>
      </div>
    </div>
  );
}
