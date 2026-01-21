import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import config from '@payload-config'

/**
 * Cleanup endpoint for temporary files
 * Deletes files older than 24 hours
 * Should be called by a cron job or scheduled task
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is a cron job or admin request
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const payload = await getPayload({ config })
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 24) // 24 hours ago

    // Find all user-files created more than 24 hours ago
    // Note: In a production setup, you'd want to:
    // 1. Add a "isTemp" or "expiresAt" field to user-files collection
    // 2. Or create a separate temp-files collection
    // 3. Query based on that field instead of createdAt

    const oldFiles = await payload.find({
      collection: 'user-files',
      where: {
        createdAt: {
          less_than: cutoffDate.toISOString(),
        },
        // Add additional filter if you have a temp flag
        // isTemp: { equals: true },
      },
      limit: 1000, // Process in batches
      overrideAccess: true,
    })

    let deletedCount = 0
    const errors: string[] = []

    // Delete old files
    for (const file of oldFiles.docs) {
      try {
        await payload.delete({
          collection: 'user-files',
          id: file.id,
          overrideAccess: true,
        })
        deletedCount++
      } catch (error) {
        console.error(`Error deleting file ${file.id}:`, error)
        errors.push(`Failed to delete ${file.id}`)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      totalFound: oldFiles.totalDocs,
      errors: errors.length > 0 ? errors : undefined,
      message: `Cleaned up ${deletedCount} temporary file(s)`,
    })
  } catch (error) {
    console.error('Error cleaning up temp files:', error)
    return NextResponse.json(
      { error: 'Failed to cleanup files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
