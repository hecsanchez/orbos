'use client';

import Link from 'next/link';
import type { StudentResponseDto } from '@orbos/types';

const GRADE_LABELS: Record<number, string> = {
  1: '1er grado',
  2: '2do grado',
  3: '3er grado',
  4: '4to grado',
  5: '5to grado',
  6: '6to grado',
};

export function StudentCard({ student }: { student: StudentResponseDto }) {
  return (
    <Link
      href={`/student/${student.id}`}
      className="block bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
          {student.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{student.name}</h2>
          <p className="text-gray-500 text-sm">
            {student.age} a&ntilde;os &middot;{' '}
            {GRADE_LABELS[student.grade_target] ?? `Grado ${student.grade_target}`}
          </p>
          {student.interests.length > 0 && (
            <p className="text-gray-400 text-xs mt-1">
              {student.interests.join(', ')}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
