import type { User } from "@razzia/common/types/user"
import { credentialsRepo, usersRepo } from "@razzia/socket/db/repositories"
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

export const registrationOptions = async (user: User) => {
  const existing = credentialsRepo.byUser(user.id)

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.username,
    userDisplayName: user.displayName,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({ id: c.id })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  })

  remember(`reg:${user.id}`, { challenge: options.challenge, userId: user.id })

  return options
}

export const verifyRegistration = async (
  user: User,
  response: unknown,
  deviceLabel?: string,
): Promise<boolean> => {
  const ctx = recall(`reg:${user.id}`)

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
    return false
  }

  const { credential } = verification.registrationInfo

  credentialsRepo.create({
    id: credential.id,
    userId: user.id,
    publicKey: Buffer.from(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports,
    deviceLabel,
  })

  return true
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
