import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Convert temporary uploaded files to permanent user-files records
 * POST /api/files/finalize
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { tempFiles } = await req.json()

    if (!tempFiles || !Array.isArray(tempFiles)) {
      return NextResponse.json({ error: 'tempFiles array is required' }, { status: 400 })
    }

    // Get authenticated user
    const { user } = await payload.auth({ headers: req.headers })
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create permanent user-files records
    const permanentFiles = []

    for (const tempFile of tempFiles) {
      // Create user-file record (just metadata, actual file is in temp storage)
      const userFile = await payload.create({
        collection: 'user-files',
        data: {
          filename: tempFile.fileName,
          fileType: 'stl', // Assuming STL for now
          description: `Uploaded for order - ${tempFile.configuration?.material || 'PLA'} ${tempFile.configuration?.color || 'Black'}`,
        },
        filePath: undefined, // No actual file upload, just metadata
      })

      permanentFiles.push({
        tempId: tempFile.tempId,
        permanentId: userFile.id,
        fileName: tempFile.fileName,
      })
    }

    return NextResponse.json({
      success: true,
      files: permanentFiles,
    })
  } catch (error) {
    console.error('Error finalizing files:', error)
    return NextResponse.json(
      {
        error: 'Failed to finalize files',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
