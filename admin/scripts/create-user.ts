// Create an admin user and print the one-time password and 2FA secret.
//   DATABASE_URL=... npm run create-user -- you@example.com owner
import { createAdmin, ROLES, type Role } from '../server/auth'
import { getDb, migrate } from '../server/db'
const [email, role] = process.argv.slice(2)
if (!email || !ROLES.includes(role as Role)) { console.error(`usage: create-user <email> <${ROLES.join('|')}>`); process.exit(1) }
const db = await getDb(); await migrate(db)
const u = await createAdmin(db, email, role as Role)
console.log(`\nCreated ${role} ${email}\n  password:    ${u.password}\n  2FA secret:  ${u.totp_secret}\n  2FA link:    ${u.otpauth}\nAdd the secret to an authenticator app (Google Authenticator, Authy, 1Password...). It will not be shown again.\n`)
process.exit(0)
