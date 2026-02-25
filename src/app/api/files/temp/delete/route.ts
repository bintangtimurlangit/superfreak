import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { withApiLogger } from '@/lib/api-logger'

/**
 * Delete temporary files after they've been converted to permanent user-files
 * Used by the finalizeOrderFiles hook
 */
export const POST = withApiLogger(async function deleteTempFiles(request: NextRequest) {
  try {
    const payload = await getPayload()
    const { fileIds } = await request.json()

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'Invalid file IDs' }, { status: 400 })
    }

    // Delete temp files from Redis/KV store
    const deleted = []
    const failed = []

    for (const fileId of fileIds) {
      try {
        await payload.delete({
          collection: 'payload-kv',
          id: fileId,
        })
        deleted.push(fileId)
      } catch (error) {
        console.error(`Failed to delete temp file ${fileId}:`, error)
        failed.push(fileId)
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      failed,
    })
  } catch (error) {
    console.error('Error deleting temp files:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete temp files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})
