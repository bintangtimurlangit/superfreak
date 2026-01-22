import type { CollectionAfterChangeHook } from 'payload'

/**
 * After an order is created, convert temp files to permanent user-files
 * This runs as a background process after order creation
 */
export const finalizeOrderFiles: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  // Only run on create, and avoid infinite loops
  if (operation !== 'create' || context.skipFileFinalization) {
    return doc
  }

  try {
    console.log(`[Order ${doc.id}] Finalizing temp files...`)

    // Get all temp file IDs from order items
    const tempFileIds = doc.items.map((item: any) => item.file)

    // Fetch temp files from temp storage
    const tempFilesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/files/temp/retrieve`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileIds: tempFileIds,
        }),
      },
    )

    if (!tempFilesResponse.ok) {
      console.error(`[Order ${doc.id}] Failed to retrieve temp files`)
      return doc
    }

    const { files: tempFiles } = await tempFilesResponse.json()

    // Create permanent user-files for each temp file
    const permanentFileIds: string[] = []

    for (let i = 0; i < doc.items.length; i++) {
      const item = doc.items[i]
      const tempFile = tempFiles.find((f: any) => f.id === item.file)

      if (!tempFile || !tempFile.fileData) {
        console.warn(`[Order ${doc.id}] Temp file not found: ${item.file}`)
        permanentFileIds.push(item.file) // Keep temp ID as fallback
        continue
      }

      try {
        // Convert base64 to Buffer
        const fileBuffer = Buffer.from(tempFile.fileData, 'base64')

        // Create permanent user-file with actual file upload
        const userFile = await req.payload.create({
          collection: 'user-files',
          data: {
            filename: item.fileName,
            fileType: 'stl',
            description: `Order ${doc.orderNumber} - ${item.configuration.material} ${item.configuration.color}`,
          },
          file: {
            data: fileBuffer,
            mimetype: 'application/octet-stream',
            name: item.fileName,
            size: item.fileSize,
          },
        })

        permanentFileIds.push(userFile.id)
        console.log(`[Order ${doc.id}] Created permanent file: ${userFile.id}`)
      } catch (error) {
        console.error(`[Order ${doc.id}] Failed to create permanent file:`, error)
        permanentFileIds.push(item.file) // Keep temp ID as fallback
      }
    }

    // Update order items with permanent file IDs
    const updatedItems = doc.items.map((item: any, index: number) => ({
      ...item,
      file: permanentFileIds[index],
    }))

    // Update the order with permanent file IDs
    await req.payload.update({
      collection: 'orders',
      id: doc.id,
      data: {
        items: updatedItems,
      },
      context: {
        skipFileFinalization: true, // Prevent infinite loop
      },
    })

    console.log(`[Order ${doc.id}] File finalization complete`)

    // Delete temp files after successful migration
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/files/temp/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileIds: tempFileIds,
        }),
      })
      console.log(`[Order ${doc.id}] Temp files deleted`)
    } catch (error) {
      console.error(`[Order ${doc.id}] Failed to delete temp files:`, error)
    }
  } catch (error) {
    console.error(`[Order ${doc.id}] Error in file finalization:`, error)
    // Don't throw - let the order creation succeed even if file finalization fails
  }

  return doc
}
