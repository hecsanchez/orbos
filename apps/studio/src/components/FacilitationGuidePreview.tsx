'use client';

interface FacilitationGuide {
  overview: string;
  duration_days: number;
  daily_steps: {
    day: number;
    title: string;
    instructions: string;
    discussion_prompts: string[];
  }[];
  materials_needed: string[];
  success_indicators: string[];
}

export function FacilitationGuidePreview({ guide }: { guide: string }) {
  let parsed: FacilitationGuide;
  try {
    parsed = JSON.parse(guide);
  } catch {
    return <pre className="text-sm text-gray-600 whitespace-pre-wrap">{guide}</pre>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-700">Resumen</h4>
        <p className="text-sm text-gray-600">{parsed.overview}</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700">
          Plan diario ({parsed.duration_days} d&iacute;as)
        </h4>
        <div className="space-y-2 mt-1">
          {parsed.daily_steps?.map((step) => (
            <div
              key={step.day}
              className="bg-gray-50 rounded p-3 border border-gray-200"
            >
              <p className="text-sm font-medium">
                D&iacute;a {step.day}: {step.title}
              </p>
              <p className="text-sm text-gray-600 mt-1">{step.instructions}</p>
              {step.discussion_prompts?.length > 0 && (
                <ul className="list-disc list-inside text-sm text-gray-500 mt-1">
                  {step.discussion_prompts.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {parsed.materials_needed?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700">Materiales</h4>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {parsed.materials_needed.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {parsed.success_indicators?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700">
            Indicadores de &eacute;xito
          </h4>
          <ul className="list-disc list-inside text-sm text-gray-600">
            {parsed.success_indicators.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
