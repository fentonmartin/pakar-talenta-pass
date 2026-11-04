// Generates a bcrypt hash for an admin password.
// Usage: node scripts/hash-password.mjs <password>
import { hash } from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.error('Usage: node scripts/hash-password.mjs <password>');
  process.exit(1);
}

const h = await hash(password, 12);
console.log(h);
