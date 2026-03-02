'use client';

interface InteractionBlock {
  component: string;
  props?: Record<string, unknown>;
  tts_text?: string;
}

export function LessonPreview({ script }: { script: unknown[] }) {
  const blocks = script as InteractionBlock[];

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        <div
          key={i}
          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
              {block.component}
            </span>
            <span className="text-xs text-gray-400">#{i + 1}</span>
          </div>
          {block.tts_text && (
            <p className="text-sm text-gray-600 italic">
              &ldquo;{block.tts_text}&rdquo;
            </p>
          )}
          {block.props && (
            <details className="mt-1">
              <summary className="text-xs text-gray-400 cursor-pointer">
                Props
              </summary>
              <pre className="text-xs bg-white p-2 rounded mt-1 overflow-auto max-h-40">
                {JSON.stringify(block.props, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}
