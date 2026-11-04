/**
 * Admin base layout.
 * Deliberately unauthenticated — the login page lives under /admin.
 * Auth-protected pages are grouped under (protected)/, which applies its own guard.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
