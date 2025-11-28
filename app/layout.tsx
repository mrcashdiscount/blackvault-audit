import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Black Vault Forensic Audit Tool',
  description: 'See exactly how much you’re being overpaying on credit card processing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
