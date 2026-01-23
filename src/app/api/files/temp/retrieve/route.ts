import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'

/**
 * Retrieve temporary files by their IDs
 * Used by the finalizeOrderFiles hook to convert temp files to permanent user-files
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await getPayload()
    const { fileIds } = await request.json()

    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'Invalid file IDs' }, { status: 400 })
    }

    // Fetch temp files from Redis/KV store
    const files = []
    for (const fileId of fileIds) {
      try {
        const tempFile = await payload.findByID({
          collection: 'payload-kv',
          id: fileId,
        })

        if (tempFile && tempFile.data) {
          files.push({
            id: fileId,
            fileData: tempFile.data.fileData,
            fileName: tempFile.data.fileName,
            fileSize: tempFile.data.fileSize,
          })
        }
      } catch (error) {
        console.error(`Failed to retrieve temp file ${fileId}:`, error)
        // Continue with other files
      }
    }

    return NextResponse.json({ files })
  } catch (error) {
    console.error('Error retrieving temp files:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve temp files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
