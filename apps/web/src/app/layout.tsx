import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SugarStack — Digital Ordering',
  description: 'Fresh baked goods, ordered seamlessly.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
