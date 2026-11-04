import Image from 'next/image';

const SITE = 'https://www.pakartalenta.co.id';

const solutions = [
  { label: 'Learning & Development', href: `${SITE}/learning-and-development/` },
  { label: 'People & Transformation Consulting', href: `${SITE}/people-and-consulting/` },
  { label: 'E3 Digital Platform', href: `${SITE}/digital-platform/` },
];

/**
 * Pakar Talenta footer — clean, minimal, modern, matching pakartalenta.co.id.
 * Links point to the original website. The year is the current (active) year.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <a href={SITE} target="_blank" rel="noopener noreferrer" className="inline-block">
              <Image
                src="/pakar-talenta-logo.png"
                alt="Pakar Talenta"
                width={666}
                height={302}
                style={{ height: 40, width: 'auto' }}
                className="mb-4"
                draggable={false}
              />
            </a>
            <p className="max-w-xs text-sm leading-relaxed text-slate-500">
              Exclusive digital access pass for vetted professionals — issued by
              Pakar Talenta.
            </p>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Solutions</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              {solutions.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[#7a2fff]"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Website */}
          <div>
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Website</h4>
            <ul className="space-y-2.5 text-sm text-slate-500">
              <li>
                <a
                  href={`${SITE}/public-program/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#7a2fff]"
                >
                  Public Program
                </a>
              </li>
              <li>
                <a
                  href={SITE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#7a2fff]"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-2 border-t border-slate-200 pt-6 text-center text-xs text-slate-400 md:flex-row md:items-center md:justify-between md:text-left">
          <p>© {year} Pakar Talenta. All rights reserved.</p>
          <p>
            Powered by <span className="font-semibold text-[#002060]">NAT Indonesia</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;