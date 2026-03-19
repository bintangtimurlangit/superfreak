'use client'

import { useState, useEffect } from 'react'
import StepsProgress from '@/components/ui/StepsProgress'
import UploadStep, { type UploadedFile, type ModelConfiguration } from './order/UploadStep'
import ReviewStep from './order/ReviewStep'
import SummaryStep, { type FilePrice } from './order/SummaryStep'
import PaymentStep from './order/PaymentStep'
import ConfigureModal from '@/components/forms/order/ConfigureModal'
import SignInModal from '@/components/modals/SignInModal'
import { useAuthSession } from '@/lib/auth/use-auth-session'
import { sliceFile } from '@/lib/slice'
import { useCart } from '@/components/providers/CartProvider'
import type { CartItem } from '@/lib/cart'

const steps = [
  { id: 1, name: 'Upload Model' },
  { id: 2, name: 'Review Model' },
  { id: 3, name: 'Order Summary' },
  { id: 4, name: 'Payment' },
]

export default function OrderForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [configureModalOpen, setConfigureModalOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  /** When set, the duplicate is only kept if user saves in ConfigureModal; closing without save removes it */
  const [pendingDuplicateId, setPendingDuplicateId] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [pricingSummary, setPricingSummary] = useState<{
    subtotal: number
    shippingCost: number
    totalAmount: number
  } | null>(null)
  const [filePrices, setFilePrices] = useState<FilePrice[]>([])
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [pendingNextStep, setPendingNextStep] = useState(false)
  const [shippingDetails, setShippingDetails] = useState<any>(null)
  const [selectedAddress, setSelectedAddress] = useState<any>(null)
  const { data: sessionData, isPending: sessionLoading } = useAuthSession()
  const isAuthenticated = !!sessionData?.user
  const { cart, setCart, clearCart, isLoading: cartLoading } = useCart()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const savedOrderState = sessionStorage.getItem('pendingOrderState')
    if (savedOrderState) {
      try {
        const orderState = JSON.parse(savedOrderState)
        // #region agent debug log restore from sessionStorage
        fetch('http://127.0.0.1:7877/ingest/36ed12ab-b5c5-46e1-8c4f-f5fb8dd64ccd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '170b7e',
          },
          body: JSON.stringify({
            sessionId: '170b7e',
            runId: 'orderform_mount',
            hypothesisId: 'H2_sessionStorage_restore_incomplete',
            location: 'OrderForm.tsx:sessionStorageRestore',
            message: 'Restoring pendingOrderState from sessionStorage',
            data: {
              hasFiles: !!(orderState?.files && Array.isArray(orderState.files)),
              filesCount: Array.isArray(orderState?.files) ? orderState.files.length : 0,
              firstHasConfiguration: !!(Array.isArray(orderState?.files) ? orderState.files[0] : undefined)?.configuration,
              firstHasStatistics: !!(Array.isArray(orderState?.files) ? orderState.files[0] : undefined)?.statistics,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        if (orderState.files && Array.isArray(orderState.files)) {
          setUploadedFiles(orderState.files)
          if (orderState.currentStep) setCurrentStep(orderState.currentStep)
        }
        sessionStorage.removeItem('pendingOrderState')
        sessionStorage.removeItem('pendingOrderNextStep')
      } catch (error) {
        console.error('Error restoring order state:', error)
      }
      return
    }

    const heroFiles = sessionStorage.getItem('heroUploadedFiles')
    if (heroFiles) {
      try {
        const fileData = JSON.parse(heroFiles)
        const newFiles: UploadedFile[] = fileData.map(
          (file: { name: string; size: number; data: string }) => ({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            size: file.size,
            file: file.data,
            status: 'completed' as const,
            progress: 100,
            configuration: {
              quantity: 1,
              enabled: true,
              wallCount: '2',
            },
          }),
        )
        // #region agent debug log restore from heroUploadedFiles
        fetch('http://127.0.0.1:7877/ingest/36ed12ab-b5c5-46e1-8c4f-f5fb8dd64ccd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '170b7e',
          },
          body: JSON.stringify({
            sessionId: '170b7e',
            runId: 'orderform_mount',
            hypothesisId: 'H2_sessionStorage_restore_incomplete',
            location: 'OrderForm.tsx:heroUploadedFilesRestore',
            message: 'Restoring heroUploadedFiles from sessionStorage',
            data: {
              filesCount: newFiles.length,
              firstHasConfiguration: !!newFiles[0]?.configuration,
              firstHasStatistics: !!newFiles[0]?.statistics,
              firstHasFile: !!newFiles[0]?.file,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        setUploadedFiles(newFiles)
        sessionStorage.removeItem('heroUploadedFiles')
      } catch (error) {
        console.error('Error loading files from Hero Section:', error)
      }
      return
    }
  }, [])

  // Restore from backend cart when user comes from cart page (e.g. "Proceed to checkout")
  useEffect(() => {
    if (cartLoading || cart.length === 0 || uploadedFiles.length > 0) {
      // #region agent debug log skip cart restore
      fetch('http://127.0.0.1:7877/ingest/36ed12ab-b5c5-46e1-8c4f-f5fb8dd64ccd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': '170b7e',
        },
        body: JSON.stringify({
          sessionId: '170b7e',
          runId: 'orderform_cart_restore',
          hypothesisId: 'H3_cart_restore_missing_config',
          location: 'OrderForm.tsx:cartRestoreSkip',
          message: 'Skipping restore-from-backend-cart',
          data: {
            cartLoading,
            cartItemsCount: cart.length,
            uploadedFilesCount: uploadedFiles.length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {})
      // #endregion
      return
    }
    const restored: UploadedFile[] = cart.map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      status: 'completed' as const,
      configuration: item.configuration,
      tempFileId: item.tempFileId,
      statistics: item.statistics,
    }))
    // #region agent debug log after cart restore mapping
    fetch('http://127.0.0.1:7877/ingest/36ed12ab-b5c5-46e1-8c4f-f5fb8dd64ccd', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '170b7e',
      },
      body: JSON.stringify({
        sessionId: '170b7e',
        runId: 'orderform_cart_restore',
        hypothesisId: 'H3_cart_restore_missing_config',
        location: 'OrderForm.tsx:cartRestoreMapped',
        message: 'Restored uploadedFiles from backend cart',
        data: {
          restoredCount: restored.length,
          restoredFirstHasConfiguration: !!restored[0]?.configuration,
          restoredFirstHasStatistics: !!restored[0]?.statistics,
          restoredFirstHasFile: !!restored[0]?.file,
          cartFirstHasConfiguration: !!cart[0]?.configuration,
          cartFirstHasStatistics: !!cart[0]?.statistics,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    setUploadedFiles(restored)
    setCurrentStep(2)
  }, [cartLoading, cart, uploadedFiles.length])

  const handleConfigure = (fileId: string) => {
    setSelectedFileId(fileId)
    setConfigureModalOpen(true)
  }

  const handleReSliceFile = (fileId: string, fileObject: File, configuration: ModelConfiguration) => {
    sliceFile(fileObject, {
      material: configuration.material,
      layerHeight: configuration.layerHeight,
      infill: configuration.infill,
      wallCount: configuration.wallCount,
    })
      .then((statistics) => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, statistics, status: 'completed' as const } : f,
          ),
        )
      })
      .catch((err) => {
        console.error('Re-slice failed:', err)
        alert(
          'Failed to re-calculate weight. You can go back to Upload step to change settings and process again.',
        )
      })
  }

  const handleSaveConfiguration = (fileId: string, configuration: ModelConfiguration) => {
    const file = uploadedFiles.find((f) => f.id === fileId)
    const configChanged =
      file &&
      (file.configuration?.material !== configuration.material ||
        file.configuration?.layerHeight !== configuration.layerHeight ||
        file.configuration?.infill !== configuration.infill ||
        file.configuration?.wallCount !== configuration.wallCount)

    // When adding a variant: if same model name + same settings already exist, merge into that item's quantity instead of adding a new row
    if (fileId === pendingDuplicateId && file) {
      const sameSettings = (f: UploadedFile) =>
        f.name === file.name &&
        f.id !== fileId &&
        (f.configuration?.material ?? '') === (configuration.material ?? '') &&
        (f.configuration?.color ?? '') === (configuration.color ?? '') &&
        (f.configuration?.layerHeight ?? '') === (configuration.layerHeight ?? '') &&
        (f.configuration?.infill ?? '') === (configuration.infill ?? '') &&
        (f.configuration?.wallCount ?? '') === (configuration.wallCount ?? '')
      const existing = uploadedFiles.find(sameSettings)
      if (existing) {
        const addQty = configuration.quantity ?? 1
        const existingQty = existing.configuration?.quantity ?? 1
        const newQty = Math.min(999, existingQty + addQty)
        setUploadedFiles((prev) =>
          prev
            .filter((f) => f.id !== fileId)
            .map((f) =>
              f.id === existing.id
                ? {
                    ...f,
                    configuration: {
                      ...f.configuration,
                      quantity: newQty,
                    },
                  }
                : f,
            ),
        )
        setPendingDuplicateId(null)
        setConfigureModalOpen(false)
        setSelectedFileId(null)
        return
      }
    }

    setUploadedFiles((prev) =>
      prev.map((f) => {
        if (f.id === fileId) {
          return {
            ...f,
            configuration: {
              ...f.configuration,
              ...configuration,
            },
            statistics: configChanged ? undefined : f.statistics,
          }
        }
        return f
      }),
    )
    if (fileId === pendingDuplicateId) {
      setPendingDuplicateId(null)
    }
    setConfigureModalOpen(false)
    setSelectedFileId(null)

    // Re-slice from Review step when config affecting weight changed and we have the file
    if (currentStep === 2 && configChanged && file?.file) {
      handleReSliceFile(fileId, file.file, configuration)
    }
  }

  const handleNext = async () => {
    // Sign-in gate: require login before Order Summary (step 3), not before Review (step 2)
    if (currentStep === 2 && !isAuthenticated && !sessionLoading) {
      const orderState = {
        files: uploadedFiles,
        currentStep: currentStep,
      }
      sessionStorage.setItem('pendingOrderState', JSON.stringify(orderState))
      sessionStorage.setItem('pendingOrderNextStep', 'true')
      setPendingNextStep(true)
      setIsSignInModalOpen(true)
      return
    }

    if (currentStep === 3) {
      setIsCreatingOrder(true)
      try {
        if (!pricingSummary) {
          throw new Error('Pricing data not available. Please go back and review the summary.')
        }

        const orderItems = uploadedFiles.map((file) => {
          const filePrice = filePrices.find((fp) => fp.fileId === file.id)

          return {
            file: file.tempFileId ?? file.id,
            fileName: file.name,
            fileSize: file.size || (file.file instanceof File ? file.file.size : 0),
            quantity: file.configuration?.quantity || 1,
            configuration: {
              material: file.configuration?.material || 'PLA',
              color: file.configuration?.color || 'Black',
              layerHeight: file.configuration?.layerHeight || '0.2mm',
              infill: file.configuration?.infill || '20%',
              wallCount: file.configuration?.wallCount || '2',
            },
            statistics: {
              printTime: file.statistics?.print_time_minutes || 0,
              filamentWeight: file.statistics?.filament_weight_g || 0,
            },
            pricing: {
              pricePerGram: filePrice?.pricePerGram || 0,
            },
            totalPrice: filePrice?.totalPrice || 0,
          }
        })

        const totalWeight = uploadedFiles.reduce(
          (sum, file) => sum + (file.statistics?.filament_weight_g || 0),
          0,
        )
        const totalPrintTime = uploadedFiles.reduce(
          (sum, file) => sum + (file.statistics?.print_time_minutes || 0),
          0,
        )

        const orderData = {
          items: orderItems,
          summary: {
            subtotal: pricingSummary.subtotal,
            shippingCost: pricingSummary.shippingCost,
            totalAmount: pricingSummary.totalAmount,
            totalWeight,
            totalPrintTime,
          },
          shipping: {
            recipientName: selectedAddress?.recipientName,
            phoneNumber: selectedAddress?.phoneNumber,
            addressLine1: selectedAddress?.addressLine1,
            addressLine2: selectedAddress?.addressLine2,
            villageName: selectedAddress?.villageName,
            districtName: selectedAddress?.districtName,
            regencyName: selectedAddress?.regencyName,
            provinceName: selectedAddress?.provinceName,
            postalCode: selectedAddress?.postalCode,
            courier: shippingDetails?.courier,
            service: shippingDetails?.service,
            estimatedDelivery: shippingDetails?.estimatedDelivery,
            shippingCost: pricingSummary.shippingCost,
            totalWeight,
          },
          paymentInfo: {
            paymentStatus: 'pending',
          },
        }

        if (
          !orderData.shipping.recipientName ||
          !orderData.shipping.phoneNumber ||
          !orderData.shipping.addressLine1 ||
          !orderData.shipping.regencyName ||
          !orderData.shipping.provinceName ||
          !orderData.shipping.postalCode ||
          !orderData.shipping.courier ||
          !orderData.shipping.service
        ) {
          throw new Error(
            'Missing required shipping information. Please complete all address fields.',
          )
        }

        const { api, isUsingNestApi } = await import('@/lib/api-client')
        const { ORDERS } = await import('@/lib/api/urls')

        if (isUsingNestApi()) {
          const res = await api.post(ORDERS.base, orderData)
          if (!res.ok) {
            const errorData = (await res.json().catch(() => ({}))) as { message?: string; errors?: { message?: string }[] }
            throw new Error(errorData.errors?.[0]?.message || errorData.message || 'Failed to create order')
          }
          const order = await res.json() as { id?: string; doc?: { id?: string } }
          const orderId = order.doc?.id || order.id
          if (!orderId) throw new Error('Order created but no ID returned')
          setOrderId(orderId)
          // #region agent debug log order creation clearing cart
          fetch('http://127.0.0.1:7877/ingest/36ed12ab-b5c5-46e1-8c4f-f5fb8dd64ccd', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Debug-Session-Id': '170b7e',
            },
            body: JSON.stringify({
              sessionId: '170b7e',
              runId: 'orderform_order_create',
              hypothesisId: 'H4_order_creation_clear_cart',
              location: 'OrderForm.tsx:clearCartAfterOrder',
              message: 'Calling clearCart() after successful order creation',
              data: { currentStep, isUsingNestApi: true },
              timestamp: Date.now(),
            }),
          }).catch(() => {})
          // #endregion
          clearCart()
          setCurrentStep(currentStep + 1)
          return
        }

        const response = await fetch(ORDERS.base, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(orderData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.errors?.[0]?.message || 'Failed to create order')
        }

        const order = await response.json()
        const orderId = order.doc?.id || order.id
        setOrderId(orderId)
        // #region agent debug log order creation clearing cart
        fetch('http://127.0.0.1:7877/ingest/36ed12ab-b5c5-46e1-8c4f-f5fb8dd64ccd', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '170b7e',
          },
          body: JSON.stringify({
            sessionId: '170b7e',
            runId: 'orderform_order_create',
            hypothesisId: 'H4_order_creation_clear_cart',
            location: 'OrderForm.tsx:clearCartAfterOrder',
            message: 'Calling clearCart() after successful order creation',
            data: { currentStep, isUsingNestApi: false },
            timestamp: Date.now(),
          }),
        }).catch(() => {})
        // #endregion
        clearCart()
        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error('Error creating order:', error)
        alert(error instanceof Error ? error.message : 'Failed to create order')
      } finally {
        setIsCreatingOrder(false)
      }
      return
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleNextWithFiles = (files?: UploadedFile[]) => {
    if (files && files.length > 0) {
      setUploadedFiles(files)
      const cartItems: CartItem[] = files
        .filter((f) => f.statistics)
        .map((f) => ({
          id: f.id,
          name: f.name,
          size: f.size,
          tempFileId: f.tempFileId,
          configuration: f.configuration,
          statistics: f.statistics,
        }))
      setCart(cartItems)
      setCurrentStep(2)
      return
    }
    handleNext()
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingNext = sessionStorage.getItem('pendingOrderNextStep')
      const savedOrderState = sessionStorage.getItem('pendingOrderState')

      if (pendingNext === 'true' && isAuthenticated && !sessionLoading) {
        if (savedOrderState) {
          try {
            const orderState = JSON.parse(savedOrderState)
            if (orderState.files && Array.isArray(orderState.files)) {
              setUploadedFiles(orderState.files)
            }
            if (orderState.currentStep) {
              setCurrentStep(orderState.currentStep)
            }
          } catch (error) {
            console.error('Error restoring order state:', error)
          }
        }

        sessionStorage.removeItem('pendingOrderNextStep')
        sessionStorage.removeItem('pendingOrderState')
        setPendingNextStep(false)
        setIsSignInModalOpen(false)

        if (window.location.pathname !== '/order') {
          window.location.href = '/order'
          return
        }

        if (currentStep < steps.length) {
          setCurrentStep(currentStep + 1)
        }
      }
    }
  }, [isAuthenticated, sessionLoading, currentStep])

  useEffect(() => {
    if (isAuthenticated && pendingNextStep && !sessionLoading) {
      sessionStorage.removeItem('pendingOrderNextStep')
      sessionStorage.removeItem('pendingOrderState')
      setPendingNextStep(false)
      setIsSignInModalOpen(false)
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1)
      }
    }
  }, [isAuthenticated, pendingNextStep, sessionLoading, currentStep])

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleQuantityChange = (fileId: string, quantity: number) => {
    const qty = Math.max(1, Math.min(999, quantity))
    setUploadedFiles((prev) =>
      prev.map((f) =>
        f.id === fileId
          ? { ...f, configuration: { ...f.configuration, quantity: qty } }
          : f,
      ),
    )
  }

  const handleDuplicateFile = (fileId: string) => {
    const file = uploadedFiles.find((f) => f.id === fileId)
    if (!file) return
    const newId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2, 11)
    const duplicate: UploadedFile = {
      ...file,
      id: newId,
      name: file.name,
      configuration: file.configuration ? { ...file.configuration } : undefined,
      statistics: file.statistics ? { ...file.statistics } : undefined,
      tempFileId: file.tempFileId,
    }
    setUploadedFiles((prev) => [...prev, duplicate])
    setPendingDuplicateId(newId)
    setSelectedFileId(newId)
    setConfigureModalOpen(true)
  }

  const handleRemoveFile = (fileId: string) => {
    if (fileId === pendingDuplicateId) {
      setPendingDuplicateId(null)
    }
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId))
    if (selectedFileId === fileId) {
      setConfigureModalOpen(false)
      setSelectedFileId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <StepsProgress steps={steps} currentStep={currentStep} />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-12">
        <div>
          {currentStep === 1 && (
            <UploadStep
              uploadedFiles={uploadedFiles}
              setUploadedFiles={setUploadedFiles}
              onNext={handleNextWithFiles}
              onConfigure={handleConfigure}
            />
          )}

          {currentStep === 2 && (
            <ReviewStep
              uploadedFiles={uploadedFiles}
              onBack={handleBack}
              onNext={handleNext}
              onConfigure={handleConfigure}
              onQuantityChange={handleQuantityChange}
              onDuplicateFile={handleDuplicateFile}
              onRemoveFile={handleRemoveFile}
            />
          )}

          {currentStep === 3 && (
            <SummaryStep
              uploadedFiles={uploadedFiles}
              onBack={handleBack}
              onNext={handleNext}
              onShippingUpdate={setShippingDetails}
              onAddressUpdate={setSelectedAddress}
              onPricingUpdate={setPricingSummary}
              onFilePricesUpdate={setFilePrices}
              isCreatingOrder={isCreatingOrder}
            />
          )}

          {currentStep === 4 && (
            <PaymentStep
              uploadedFiles={uploadedFiles}
              onBack={handleBack}
              orderId={orderId || undefined}
            />
          )}
        </div>
      </div>

      <ConfigureModal
        isOpen={configureModalOpen}
        onClose={() => {
          if (pendingDuplicateId && selectedFileId === pendingDuplicateId) {
            setUploadedFiles((prev) => prev.filter((f) => f.id !== pendingDuplicateId))
            setPendingDuplicateId(null)
          }
          setConfigureModalOpen(false)
          setSelectedFileId(null)
        }}
        file={uploadedFiles.find((f) => f.id === selectedFileId) || null}
        onSave={handleSaveConfiguration}
        submitButtonLabel={
          pendingDuplicateId && selectedFileId === pendingDuplicateId ? 'Add model' : 'Save Configuration'
        }
      />

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => {
          setIsSignInModalOpen(false)
          setPendingNextStep(false)
          sessionStorage.removeItem('pendingOrderNextStep')
          sessionStorage.removeItem('pendingOrderState')
        }}
      />
    </div>
  )
}
