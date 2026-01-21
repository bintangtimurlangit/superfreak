import { getPayload } from '@/lib/payload'

type PayloadWithBetterAuth = Awaited<ReturnType<typeof getPayload>>
export type Session = PayloadWithBetterAuth['betterAuth']['$Infer']['Session']
export type User = PayloadWithBetterAuth['betterAuth']['$Infer']['Session']['user']
// Admin invitation type - to be implemented when adding admin invitation feature
// The better-auth plugin creates an admin-invitations collection that can be used
// export type Invitation = PayloadWithBetterAuth['betterAuth']['$Infer']['Invitation']
export type Account = Awaited<ReturnType<PayloadWithBetterAuth['betterAuth']['api']['listUserAccounts']>>[number]
export type DeviceSession = Awaited<ReturnType<PayloadWithBetterAuth['betterAuth']['api']['listSessions']>>[number]

export type Error = PayloadWithBetterAuth['betterAuth']['$ERROR_CODES']
