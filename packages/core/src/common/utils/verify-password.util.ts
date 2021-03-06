import { strictEqual } from 'assert';
import { pbkdf2, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

/**
 * Compare a plain text password and a hash to see if they match.
 *
 * @export
 * @param {string} plainTextPassword - The password in clear text.
 * @param {string} passwordHash - The password hash generated by the `hashPassword` function.
 * @param {{ legacy?: boolean }} [options={}]
 * @returns {Promise<boolean>} True if the hash and the password match. False otherwise.
 */
export async function verifyPassword(plainTextPassword: string, passwordHash: string,
                                     options: { legacy?: boolean } = {}): Promise<boolean> {
  const legacy = options.legacy || false;
  const [ algorithm, iterations, salt, derivedKey ] = passwordHash.split('$');

  strictEqual(algorithm, 'pbkdf2_sha256', 'Invalid algorithm.');

  strictEqual(typeof iterations, 'string', 'Invalid password format.');
  strictEqual(typeof salt, 'string', 'Invalid password format.');
  strictEqual(typeof derivedKey, 'string', 'Invalid password format.');
  strictEqual(isNaN(parseInt(iterations, 10)), false, 'Invalid password format.');

  const saltBuffer = Buffer.from(salt, legacy ? 'hex' : 'base64');
  const derivedKeyBuffer = Buffer.from(derivedKey, legacy ? 'hex' : 'base64');
  const digest = 'sha256'; // TODO: depends on the algorthim var
  const password = await promisify(pbkdf2)(
    plainTextPassword,
    legacy ? saltBuffer.toString('hex') : saltBuffer,
    parseInt(iterations, 10),
    derivedKeyBuffer.length,
    digest
  );
  return timingSafeEqual(password, derivedKeyBuffer);
}
