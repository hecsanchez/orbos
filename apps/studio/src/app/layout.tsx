import './global.css';
import Link from 'next/link';

export const metadata = {
  title: 'Orbos Curriculum Studio',
  description: 'Herramienta interna de administración curricular',
};

const NAV_ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/lessons', label: 'Lecciones' },
  { href: '/phenomena', label: 'Fenómenos' },
  { href: '/safety', label: 'Seguridad' },
  { href: '/standards', label: 'Estándares' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex">
        <aside className="w-56 bg-slate-900 text-white min-h-screen flex-shrink-0">
          <div className="p-5 border-b border-slate-700">
            <h1 className="text-lg font-bold">Orbos Studio</h1>
          </div>
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
