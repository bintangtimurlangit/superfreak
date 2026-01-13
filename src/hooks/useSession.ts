/**
 * Re-export useSession from SessionContext for backward compatibility
 * All components should use this hook, which now uses shared context
 * to prevent duplicate API calls and improve performance.
 */
export { useSession } from '@/contexts/SessionContext'
