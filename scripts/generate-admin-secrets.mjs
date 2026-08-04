import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline/promises'

const terminal = createInterface({ input: stdin, output: stdout })
const password = await terminal.question('Choose the portfolio admin password: ')
terminal.close()

if (password.length < 12) {
  throw new Error('Use a password with at least 12 characters.')
}

const salt = randomBytes(24)
const hash = pbkdf2Sync(password, salt, 210000, 32, 'sha256')

stdout.write(`ADMIN_PASSWORD_SALT=${salt.toString('base64')}\n`)
stdout.write(`ADMIN_PASSWORD_HASH=${hash.toString('base64')}\n`)
stdout.write(`ADMIN_SESSION_SECRET=${randomBytes(32).toString('base64')}\n`)
