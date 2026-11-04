// Seeds the production PostgreSQL database with a realistic starter dataset.
// Usage:  POSTGRES_URL=postgresql://... node scripts/seed-prod.mjs
import pg from 'pg';

const url = process.env.POSTGRES_URL || 'postgresql://postgres:postgres@localhost:5432/pakar_talenta';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const SEED = [
  { full_name: 'Rizky Aditya Pratama', email: 'rizky.aditya@techwijaya.id', phone: '6281234567890', code: 'PTP-RZDY-7K9F', createdDaysAgo: 2, expiresInDays: 363, status: 'active' },
  { full_name: 'Sari Kartika Dewi', email: 'sari.kartika@gmail.com', phone: '6281298765432', code: 'PTP-SRKT-4M2Q', createdDaysAgo: 5, expiresInDays: 300, status: 'active' },
  { full_name: 'Budi Santoso Wijaya', email: 'budi.santoso@finansialnusantara.com', phone: '6281380011223', code: 'PTP-BDSN-9X3F', createdDaysAgo: 9, expiresInDays: 356, status: 'active' },
  { full_name: 'Anisa Rahmawati', email: 'anisa.rahmawati@studioarta.co.id', phone: '6282112233445', code: 'PTP-ANSZ-QT7P', createdDaysAgo: 12, expiresInDays: 250, status: 'active' },
  { full_name: 'Dimas Anggara Putra', email: 'dimas.putra@logistix.id', phone: '6287789012345', code: 'PTP-DMSP-2HV8', createdDaysAgo: 15, expiresInDays: 320, status: 'active' },
  { full_name: 'Maya Anggreni Sitorus', email: 'maya.sitorus@medika.digital', phone: '6285644556677', code: 'PTP-MYAS-5GJ2', createdDaysAgo: 18, expiresInDays: 275, status: 'active' },
  { full_name: 'Fajar Nugroho Permana', email: 'fajar.nugroho@propertikita.com', phone: '6282223456789', code: 'PTP-FJRP-WD4K', createdDaysAgo: 21, expiresInDays: 180, status: 'active' },
  { full_name: 'Citra Ayu Lestari', email: 'citra.ayu@eduwisata.id', phone: '6285955566778', code: 'PTP-CTRL-8BYH', createdDaysAgo: 24, expiresInDays: 340, status: 'active' },
  { full_name: 'Hendra Gunawan', email: 'hendra.gunawan@energialam.co.id', phone: '6281231112223', code: 'PTP-HNDG-X6CV', createdDaysAgo: 28, expiresInDays: 90, status: 'active' },
  { full_name: 'Nadia Berliana', email: 'nadia.berliana@gmail.com', phone: '6281388899000', code: 'PTP-NDBL-3KQ7', createdDaysAgo: 31, expiresInDays: 200, status: 'active' },
  { full_name: 'Rangga Mahesa', email: 'rangga.mahesa@kreatifmedia.id', phone: '6282112345678', code: 'PTP-RNGM-JZ5N', createdDaysAgo: 35, expiresInDays: 160, status: 'active' },
  { full_name: 'Fitri Handayani', email: 'fitri.handayani@bankansuri.co.id', phone: '6285644889900', code: 'PTP-FTRH-9LW2', createdDaysAgo: 40, expiresInDays: 365, status: 'active' },
  { full_name: 'Andre Prakoso', email: 'andre.prakoso@teknoinovatif.id', phone: '6287799988776', code: 'PTP-ANDR-U4SM', createdDaysAgo: 46, expiresInDays: 120, status: 'active' },
  { full_name: 'Lina Marlina', email: 'lina.marlina@retailerjuara.id', phone: '6282311122233', code: 'PTP-LNMR-B7TC', createdDaysAgo: 358, expiresInDays: 6, status: 'active' },
  { full_name: 'Tono Haryanto', email: 'tono.haryanto@olddomain.com', phone: '6281288887766', code: 'PTP-TNHR-5PDJ', createdDaysAgo: 400, expiresInDays: 365, status: 'expired' },
  { full_name: 'Yulia Anggraeni', email: 'yulia.angg@contoh.co.id', phone: '6285700011223', code: 'PTP-YLAG-R8VS', createdDaysAgo: 500, expiresInDays: 365, status: 'expired' },
  { full_name: 'Gunawan Cahyadi', email: 'gunawan.cahyadi@kasus.id', phone: '6281288777666', code: 'PTP-GNWC-WKX3', createdDaysAgo: 90, expiresInDays: 275, status: 'revoked' },
  { full_name: 'Ratna Puspita', email: 'ratna.puspita@duplikat.net', phone: '6281322233444', code: 'PTP-RTNP-2YH9', createdDaysAgo: 150, expiresInDays: 215, status: 'revoked' },
];

const client = new pg.Client({ connectionString: url });
await client.connect();

const fmt = (d) => d.toISOString();

let inserted = 0;
for (const s of SEED) {
  const createdAt = new Date(now - s.createdDaysAgo * DAY);
  const expiryDate = new Date(createdAt.getTime() + s.expiresInDays * DAY);
  const res = await client.query(
    `INSERT INTO passport_passes (full_name, email, phone, unique_code, expiry_date, created_at, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (unique_code) DO NOTHING`,
    [s.full_name, s.email, s.phone, s.code, fmt(expiryDate), fmt(createdAt), s.status],
  );
  inserted += res.rowCount ?? 0;
}

// Insert a couple of audit events so Recent Activity isn't empty.
await client.query(
  `INSERT INTO audit_log (event_type, resource_type, actor, metadata, timestamp)
   VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
  ['verification_success', 'passport', 'public', JSON.stringify({ resourceLabel: 'PTP-RZDY-7K9F' }), fmt(new Date(now - 8 * 60 * 1000))],
);
await client.query(
  `INSERT INTO audit_log (event_type, resource_type, actor, metadata, timestamp)
   VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,
  ['admin_login', 'session', 'admin', JSON.stringify({ resourceLabel: 'Admin Console' }), fmt(new Date(now - 15 * 60 * 1000))],
);

await client.end();
console.log(`Seeded ${inserted} passes (already present: ${SEED.length - inserted}).`);