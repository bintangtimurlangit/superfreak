import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { withApiLogger } from '@/lib/api-logger'

export const GET = withApiLogger(async function cleanupFiles(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload()
    const cutoffDate = new Date()
    cutoffDate.setHours(cutoffDate.getHours() - 24)

    const oldFiles = await payload.find({
      collection: 'user-files',
      where: {
        createdAt: {
          less_than: cutoffDate.toISOString(),
        },
      },
      limit: 1000,
      overrideAccess: true,
    })

    let deletedCount = 0
    const errors: string[] = []

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
      {
        error: 'Failed to cleanup files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})
