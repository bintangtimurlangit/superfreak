'use client'

import { useState, useEffect } from 'react'
import StepsProgress from '@/components/ui/StepsProgress'
import UploadStep, { type UploadedFile, type ModelConfiguration } from './order/UploadStep'
import ReviewStep from './order/ReviewStep'
import SummaryStep, { type FilePrice } from './order/SummaryStep'
import PaymentStep from './order/PaymentStep'
import ConfigureModal from '@/components/forms/order/ConfigureModal'
import SignInModal from '@/components/modals/SignInModal'
import { useSession } from '@/lib/auth/client'
import { sliceFile } from '@/lib/slice'

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
  const { data: sessionData, isPending: sessionLoading } = useSession()
  const isAuthenticated = !!sessionData?.user

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedOrderState = sessionStorage.getItem('pendingOrderState')
      if (savedOrderState) {
        try {
          const orderState = JSON.parse(savedOrderState)
          if (orderState.files && Array.isArray(orderState.files)) {
            setUploadedFiles(orderState.files)
            if (orderState.currentStep) {
              setCurrentStep(orderState.currentStep)
            }
          }
          sessionStorage.removeItem('pendingOrderState')
          sessionStorage.removeItem('pendingOrderNextStep')
        } catch (error) {
          console.error('Error restoring order state:', error)
        }
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
          setUploadedFiles(newFiles)
          sessionStorage.removeItem('heroUploadedFiles')
        } catch (error) {
          console.error('Error loading files from Hero Section:', error)
        }
      }
    }
  }, [])

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
            file: file.id,
            fileName: file.name,
            fileSize: file.file instanceof File ? file.file.size : 0,
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
          status: 'unpaid',
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

        const response = await fetch('/api/orders', {
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
              onNext={handleNext}
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
