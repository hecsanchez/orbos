'use client';

import type { EvidenceResponseDto, PhenomenonResponseDto } from '@orbos/types';

interface Props {
  evidence: EvidenceResponseDto[];
  phenomena: PhenomenonResponseDto[];
}

export function EvidencePortfolio({ evidence, phenomena }: Props) {
  const phenomenaMap = new Map(phenomena.map((p) => [p.id, p]));

  const grouped = evidence.reduce<Record<string, EvidenceResponseDto[]>>(
    (acc, ev) => {
      const key = ev.phenomenon_id || 'other';
      (acc[key] ??= []).push(ev);
      return acc;
    },
    {},
  );

  if (evidence.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3">Portafolio de Evidencia</h3>
        <p className="text-gray-400 text-sm">
          A&uacute;n no hay evidencia capturada.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Portafolio de Evidencia</h3>
      <div className="space-y-6">
        {Object.entries(grouped).map(([phenomenonId, items]) => {
          const phenomenon = phenomenaMap.get(phenomenonId);
          return (
            <div
              key={phenomenonId}
              className="bg-white rounded-xl p-4 border border-gray-100"
            >
              <h4 className="font-medium mb-3">
                {phenomenon?.title ?? 'Evidencia general'}
              </h4>
              <div className="flex flex-wrap gap-3">
                {items.map((ev) =>
                  ev.type === 'photo' ? (
                    <div
                      key={ev.id}
                      className="w-32 h-24 rounded-lg bg-gray-100 overflow-hidden"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ev.storage_url}
                        alt="Evidencia"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-3"
                    >
                      <span className="text-lg">🎤</span>
                      <audio
                        controls
                        src={ev.storage_url}
                        className="h-8"
                      />
                    </div>
                  ),
                )}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {items.length} evidencia{items.length !== 1 ? 's' : ''}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
