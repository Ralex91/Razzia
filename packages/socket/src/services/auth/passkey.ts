import { usersRepo } from "@razzia/socket/db/repositories"
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server"

// Relying-Party identity — MUST match the public origin or passkeys silently fail.
const rpID = process.env.RP_ID ?? "localhost"
const rpName = process.env.RP_NAME ?? "Razzia"
const origin = process.env.RP_ORIGIN ?? `http://${rpID}:3000`

// Short-lived challenge store (challenge -> context). In a single-container
// deployment an in-memory map is sufficient; swap for the DB to scale out.
interface PendingChallenge {
  challenge: string
  userId?: string
  expires: number
}
const pending = new Map<string, PendingChallenge>()
const CHALLENGE_TTL = 5 * 60 * 1000

const remember = (key: string, data: Omit<PendingChallenge, "expires">) =>
  pending.set(key, { ...data, expires: Date.now() + CHALLENGE_TTL })

const recall = (key: string): PendingChallenge | null => {
  const entry = pending.get(key)
  pending.delete(key)

  if (!entry || entry.expires < Date.now()) {
    return null
  }

  return entry
}

/* --------------------------- Registration -------------------------- */

// `identity` is intentionally NOT required to correspond to a real row in the
// `users` table yet. Registration is a two-step WebAuthn ceremony, and the
// caller (http.ts) defers creating the permanent user / consuming the invite
// until step 2 actually proves possession of the passkey (see verifyRegistration
// below) — so at options-time this is keyed by a short-lived pending-registration
// id, not a persisted user id.
interface Identity {
  id: string
  username: string
  displayName: string
}

export const registrationOptions = async (identity: Identity) => {
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: identity.username,
    userDisplayName: identity.displayName,
    attestationType: "none",
    // A brand-new (not-yet-created) account has no existing credentials to
    // exclude.
    excludeCredentials: [],
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  })

  remember(`reg:${identity.id}`, { challenge: options.challenge, userId: identity.id })

  return options
}

export interface VerifiedRegistration {
  credentialId: string
  publicKey: Buffer
  counter: number
  transports?: string[]
}

/**
 * Verifies the attestation for a pending registration and returns the
 * resulting credential — it does NOT persist anything. The caller is
 * responsible for creating the real user row (only after this resolves
 * successfully) and then writing the credential against that real user id.
 */
export const verifyRegistration = async (
  identity: Pick<Identity, "id">,
  response: unknown,
): Promise<VerifiedRegistration | null> => {
  const ctx = recall(`reg:${identity.id}`)

  if (!ctx) {
    throw new Error("errors:auth.challengeExpired")
  }

  const verification = await verifyRegistrationResponse({
    response: response as never,
    expectedChallenge: ctx.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    // Options request UV as "preferred", so do not hard-require it on verify.
    // (Library default is true, which rejects authenticators that skip UV.)
    requireUserVerification: false,
  })

  if (!verification.verified || !verification.registrationInfo) {
    return null
  }

  const { credential } = verification.registrationInfo

  return {
    credentialId: credential.id,
    publicKey: Buffer.from(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports,
  }
}

/* -------------------------- Authentication ------------------------- */

export const authenticationOptions = async () => {
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
  })

  // Keyed by challenge itself — discoverable (usernameless) login.
  remember(options.challenge, { challenge: options.challenge })

  return options
}

export const verifyAuthentication = async (
  response: { id?: string; response?: { clientDataJSON?: string } },
  expectedChallenge: string,
): Promise<User | null> => {
  const ctx = recall(expectedChallenge)

  if (!ctx) {
    throw new Error("errors:auth.challengeExpired")
  }

  const credentialId = response.id as string
  const credential = credentialsRepo.byId(credentialId)

  if (!credential) {
    return null
  }

  const verification = await verifyAuthenticationResponse({
    response: response as never,
    expectedChallenge: ctx.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: false,
    credential: {
      id: credential.id,
      publicKey: new Uint8Array(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports as never,
    },
  })

  if (!verification.verified) {
    return null
  }

  credentialsRepo.updateCounter(
    credential.id,
    verification.authenticationInfo.newCounter,
  )

  const user = usersRepo.byId(credential.userId)

  return user && !user.disabled ? user : null
}
