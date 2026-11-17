// =============================================================
// Create (or promote) a Bhook_Lgi admin account.
//
//   cd server
//   npm run create-admin
//
// You'll be asked for name, phone, email and a password (typing is
// hidden). The password is stored as a bcrypt hash only.
// If the phone/email already belongs to an account, you can promote
// that account to admin instead.
// =============================================================

import readline from 'readline';
import bcrypt from 'bcryptjs';
import { pool } from '../db/postgres.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

function askHidden(question) {
  return new Promise(resolve => {
    const originalWrite = rl._writeToOutput;
    rl._writeToOutput = (text) => {
      // Show the prompt, hide what is typed.
      if (text.includes(question)) originalWrite.call(rl, text);
      else if (text === '\r\n' || text === '\n') originalWrite.call(rl, text);
      else originalWrite.call(rl, '*');
    };
    rl.question(question, answer => {
      rl._writeToOutput = originalWrite;
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  console.log('\n=== Create Bhook_Lgi admin ===\n');

  const name = await ask('Admin name: ');
  const phone = await ask('Admin phone (used to log in): ');
  const email = await ask('Admin email (optional, also works to log in): ');

  if (!name || !phone) {
    throw new Error('Name and phone are required.');
  }

  const password = await askHidden('Password (min 10 characters): ');
  const confirm = await askHidden('Confirm password: ');

  if (password.length < 10) {
    throw new Error('Password must be at least 10 characters.');
  }

  if (password !== confirm) {
    throw new Error('Passwords do not match.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await pool.query(
    `SELECT id, name, role FROM users
      WHERE phone = $1 OR ($2 <> '' AND LOWER(email) = LOWER($2))
      LIMIT 1`,
    [phone, email]
  );

  if (existing.rowCount > 0) {
    const user = existing.rows[0];
    const answer = await ask(
      `An account already exists for ${user.name} (role: ${user.role}). ` +
      'Make it an admin and set this password? (yes/no): '
    );

    if (answer.toLowerCase() !== 'yes') {
      console.log('Cancelled. Nothing was changed.');
      return;
    }

    await pool.query(
      `UPDATE users SET role = 'ADMIN', password_hash = $1, updated_at = NOW()
        WHERE id = $2`,
      [passwordHash, user.id]
    );

    console.log(`\n✅ ${user.name} is now an admin. Log in with phone ${phone}.`);
    return;
  }

  await pool.query(
    `INSERT INTO users (name, phone, email, hostel, room_number, role, password_hash)
     VALUES ($1, $2, $3, 'ADMIN', '-', 'ADMIN', $4)`,
    [name, phone, email || null, passwordHash]
  );

  console.log(`\n✅ Admin created. Log in on the normal Sign In screen with phone ${phone}${email ? ` or ${email}` : ''}.`);
}

main()
  .catch(error => {
    console.error(`\n❌ ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await pool.end();
  });
