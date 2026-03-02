import './global.css';

export const metadata = {
  title: 'Orbos - Panel de Padres',
  description: 'Panel de seguimiento del aprendizaje de tu hijo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
