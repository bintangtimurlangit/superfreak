'use client'

import { useState, useEffect } from 'react'
import StepsProgress from '@/components/ui/StepsProgress'
import UploadStep, { type UploadedFile, type ModelConfiguration } from './order/UploadStep'
import SummaryStep from './order/SummaryStep'
import PaymentStep from './order/PaymentStep'
import ConfigureModal from '@/components/forms/order/ConfigureModal'
import SignInModal from '@/components/modals/SignInModal'
import { useSession } from '@/lib/auth/client'

const steps = [
  { id: 1, name: 'Upload Model' },
  { id: 2, name: 'Order Summary' },
  { id: 3, name: 'Payment' },
]

export default function OrderForm() {
  const [currentStep, setCurrentStep] = useState(1)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [configureModalOpen, setConfigureModalOpen] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [snapToken, setSnapToken] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [isCreatingOrder, setIsCreatingOrder] = useState(false)
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [pendingNextStep, setPendingNextStep] = useState(false)
  const [shippingDetails, setShippingDetails] = useState<any>(null) // TODO: Type this properly
  const [selectedAddress, setSelectedAddress] = useState<any>(null) // TODO: Type this properly
  const { data: sessionData, isPending: sessionLoading } = useSession()
  const isAuthenticated = !!sessionData?.user

  // Check for files from Hero Section or restored order state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // First check for restored order state (after OAuth redirect)
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
          // Clear after restoring
          sessionStorage.removeItem('pendingOrderState')
          // Also clear pending next step flag
          sessionStorage.removeItem('pendingOrderNextStep')
        } catch (error) {
          console.error('Error restoring order state:', error)
        }
      }

      // Then check for files from Hero Section
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
          // Clear sessionStorage after loading
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

  const handleSaveConfiguration = (fileId: string, configuration: ModelConfiguration) => {
    setUploadedFiles((prev) =>
      prev.map((file) => {
        if (file.id === fileId) {
          // Check if critical configuration changed (material, layerHeight, infill, wallCount)
          const configChanged =
            file.configuration?.material !== configuration.material ||
            file.configuration?.layerHeight !== configuration.layerHeight ||
            file.configuration?.infill !== configuration.infill ||
            file.configuration?.wallCount !== configuration.wallCount

          return {
            ...file,
            configuration: {
              ...file.configuration,
              ...configuration,
            },
            // Clear statistics if configuration changed, so file will be re-processed
            statistics: configChanged ? undefined : file.statistics,
          }
        }
        return file
      }),
    )
    setConfigureModalOpen(false)
    setSelectedFileId(null)
  }

  const handleNext = async () => {
    // Check authentication when moving from step 1 (Upload) to step 2 (Summary)
    if (currentStep === 1 && !isAuthenticated && !sessionLoading) {
      // Save current order state to sessionStorage before opening sign-in modal
      // This preserves files and configuration in case of OAuth redirect
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

    // Create order when moving from Summary (step 2) to Payment (step 3)
    if (currentStep === 2) {
      setIsCreatingOrder(true)
      try {
        // Calculate pricing
        // TODO: Get these from CourierSettings global or calculate from SummaryStep
        const FILAMENT_COST_PER_GRAM = 100 // IDR per gram
        const PRINT_TIME_COST_PER_HOUR = 10000 // IDR per hour
        const MARKUP_PERCENTAGE = 30 // 30%

        // Calculate pricing for each item
        const itemsWithPricing = uploadedFiles.map((file) => {
          const filamentWeight = file.statistics?.filament_weight_g || 0
          const printTime = file.statistics?.print_time_minutes || 0
          const quantity = file.configuration?.quantity || 1

          // Calculate costs
          const filamentTotalCost = filamentWeight * FILAMENT_COST_PER_GRAM
          const printTimeTotalCost = (printTime / 60) * PRINT_TIME_COST_PER_HOUR
          const basePrice = filamentTotalCost + printTimeTotalCost
          const markupAmount = basePrice * (MARKUP_PERCENTAGE / 100)
          const subtotalPerUnit = basePrice + markupAmount
          const totalPrice = subtotalPerUnit * quantity

          return {
            file: file.id, // Temp file ID - will be converted to permanent by backend hook
            fileName: file.name,
            fileSize: file.file instanceof File ? file.file.size : 0,
            quantity,
            configuration: {
              material: file.configuration?.material || 'PLA',
              color: file.configuration?.color || 'Black',
              layerHeight: file.configuration?.layerHeight || '0.2mm',
              infill: file.configuration?.infill || '20%',
              wallCount: file.configuration?.wallCount || '2',
            },
            statistics: {
              printTime,
              filamentWeight,
            },
            pricing: {
              filamentCostPerGram: FILAMENT_COST_PER_GRAM,
              filamentTotalCost,
              printTimeCostPerHour: PRINT_TIME_COST_PER_HOUR,
              printTimeTotalCost,
              basePrice,
              markupPercentage: MARKUP_PERCENTAGE,
              markupAmount,
              subtotalPerUnit,
            },
            totalPrice,
          }
        })

        // Calculate summary
        const subtotal = itemsWithPricing.reduce((sum, item) => sum + item.totalPrice, 0)
        const shippingCost = shippingDetails?.cost || 0
        const totalAmount = subtotal + shippingCost
        const totalWeight = uploadedFiles.reduce(
          (sum, file) => sum + (file.statistics?.filament_weight_g || 0),
          0,
        )
        const totalPrintTime = uploadedFiles.reduce(
          (sum, file) => sum + (file.statistics?.print_time_minutes || 0),
          0,
        )

        // Prepare order data to match Orders schema
        const orderData = {
          status: 'unpaid',
          items: itemsWithPricing,
          summary: {
            subtotal,
            shippingCost,
            totalAmount,
            totalWeight,
            totalPrintTime,
          },
          shipping: {
            recipientName: selectedAddress?.recipientName || 'Test User',
            phoneNumber: selectedAddress?.phoneNumber || '08123456789',
            addressLine1: selectedAddress?.addressLine1 || 'Test Address',
            addressLine2: selectedAddress?.addressLine2 || '',
            villageName: selectedAddress?.villageName || 'Test Village',
            districtName: selectedAddress?.districtName || 'Test District',
            regencyName: selectedAddress?.regencyName || 'Test Regency',
            provinceName: selectedAddress?.provinceName || 'Test Province',
            postalCode: selectedAddress?.postalCode || '12345',
            courier: shippingDetails?.courier || 'JNE',
            service: shippingDetails?.service || 'REG',
            estimatedDelivery: shippingDetails?.estimatedDelivery || '2-3 days',
            shippingCost,
            totalWeight,
          },
          paymentInfo: {
            paymentStatus: 'pending',
          },
        }

        // Debug: Check file IDs
        console.log(
          'Uploaded files:',
          uploadedFiles.map((f) => ({ id: f.id, name: f.name })),
        )
        console.log('Order data being sent:', JSON.stringify(orderData, null, 2))

        // Create order via Payload API
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Important for session cookies
          body: JSON.stringify(orderData),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.errors?.[0]?.message || 'Failed to create order')
        }

        const order = await response.json()
        console.log('Order created:', order)

        // Now initialize payment with the created order
        const paymentResponse = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            orderId: order.doc.id,
          }),
        })

        if (!paymentResponse.ok) {
          throw new Error('Failed to initialize payment')
        }

        const paymentResult = await paymentResponse.json()
        setSnapToken(paymentResult.snapToken)
        setOrderId(order.doc.id)

        // Move to payment step
        setCurrentStep(currentStep + 1)
      } catch (error) {
        console.error('Error creating order:', error)
        alert(error instanceof Error ? error.message : 'Failed to create order')
      } finally {
        setIsCreatingOrder(false)
      }
      return
    }

    // Normal step progression
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Check for pending next step on mount (for OAuth redirects)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pendingNext = sessionStorage.getItem('pendingOrderNextStep')
      const savedOrderState = sessionStorage.getItem('pendingOrderState')

      if (pendingNext === 'true' && isAuthenticated && !sessionLoading) {
        // Restore order state if it exists
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

        // Navigate to order page if we're on home page
        if (window.location.pathname !== '/order') {
          window.location.href = '/order'
          return
        }

        // Proceed to next step
        if (currentStep < steps.length) {
          setCurrentStep(currentStep + 1)
        }
      }
    }
  }, [isAuthenticated, sessionLoading, currentStep])

  // Handle successful login - proceed to next step if pending
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

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Steps Progress Bar - Below Navbar */}
      <StepsProgress steps={steps} currentStep={currentStep} />

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 md:py-12">
        {/* Main Content Area - Full Width */}
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
            <SummaryStep
              uploadedFiles={uploadedFiles}
              onBack={handleBack}
              onNext={handleNext}
              onShippingUpdate={setShippingDetails}
              onAddressUpdate={setSelectedAddress}
              isCreatingOrder={isCreatingOrder}
            />
          )}

          {currentStep === 3 && (
            <PaymentStep
              uploadedFiles={uploadedFiles}
              onBack={handleBack}
              snapToken={snapToken || undefined}
              orderId={orderId || undefined}
            />
          )}
        </div>
      </div>

      {/* Configuration Modal */}
      <ConfigureModal
        isOpen={configureModalOpen}
        onClose={() => {
          setConfigureModalOpen(false)
          setSelectedFileId(null)
        }}
        file={uploadedFiles.find((f) => f.id === selectedFileId) || null}
        onSave={handleSaveConfiguration}
      />

      {/* Sign In Modal */}
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
