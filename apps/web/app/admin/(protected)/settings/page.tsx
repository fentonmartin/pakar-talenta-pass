import Link from 'next/link';
import { SettingsForm, type SmtpFormValue } from '@/app/components/SettingsForm';
import { getSmtpConfig } from '@/app/lib/settings';

export const dynamic = 'force-dynamic';

/**
 * Admin — settings: change admin password & SMTP configuration.
 */
export default async function SettingsPage() {
  const smtp = getSmtpConfig();
  const initial: SmtpFormValue = {
    host: smtp.host,
    port: smtp.port,
    user: smtp.user,
    from: smtp.from,
    secure: smtp.secure,
  };

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin" className="text-xs font-mono text-slate-400 hover:text-[#7a2fff]">
          ← Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[#002060]">Settings</h1>
        <p className="mt-1 text-slate-500">Admin password and mail (SMTP) configuration.</p>
      </div>

      <SettingsForm initial={initial} />
    </div>
  );
}