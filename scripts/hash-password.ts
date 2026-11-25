// Usage: npm run admin:hash -- "your long password"
// Prints the value for ADMIN_PASSWORD_HASH. The plain password is never stored anywhere.
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const N = 2 ** 15, R = 8, P = 1;

async function main() {
  const pw = process.argv[2];
  if (!pw || pw.length < 12) {
    console.error('Give a password of at least 12 characters:  npm run admin:hash -- "your long password"');
    process.exit(1);
  }
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64, { N, r: R, p: P, maxmem: 128 * N * R * 2 });
  console.log(["scrypt", N, R, P, salt.toString("base64url"), hash.toString("base64url")].join(":"));
}
main();
