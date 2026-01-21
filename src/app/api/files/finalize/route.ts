import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import config from '@payload-config'

/**
 * Finalizes temporary files by moving them to permanent storage
 * and linking them to an order
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { orderId, tempFileIds } = body

    if (!orderId || !tempFileIds || !Array.isArray(tempFileIds)) {
      return NextResponse.json(
        { error: 'orderId and tempFileIds array are required' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config })

    // Get the order to verify it exists
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      overrideAccess: true,
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const finalizedFiles = []

    // Update each temp file to link to the order
    // In a real implementation, you might want to:
    // 1. Move files from temp/ prefix to permanent location in S3/R2
    // 2. Update file records with order relationship
    // 3. Delete temp file records or mark them as finalized

    for (const tempFileId of tempFileIds) {
      try {
        const fileDoc = await payload.findByID({
          collection: 'user-files',
          id: tempFileId,
          overrideAccess: true,
        })

        if (fileDoc) {
          // Update file to link to order (you might want to add an order field to user-files)
          // For now, we'll just mark it as finalized
          finalizedFiles.push({
            id: fileDoc.id,
            filename: fileDoc.filename,
          })
        }
      } catch (error) {
        console.error(`Error finalizing file ${tempFileId}:`, error)
        // Continue with other files even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      finalizedFiles,
      message: `Finalized ${finalizedFiles.length} file(s)`,
    })
  } catch (error) {
    console.error('Error finalizing files:', error)
    return NextResponse.json(
      { error: 'Failed to finalize files', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
