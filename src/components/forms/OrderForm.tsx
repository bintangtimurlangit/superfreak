'use client'

import { useState, useEffect } from 'react'
import StepsProgress from '@/components/ui/StepsProgress'
import UploadStep, { type UploadedFile, type ModelConfiguration } from './order/UploadStep'
import SummaryStep from './order/SummaryStep'
import PaymentStep from './order/PaymentStep'
import ConfigureModal from '@/components/modals/ConfigureModal'
import SignInModal from '@/components/modals/SignInModal'
import { useSession } from '@/hooks/useSession'

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
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false)
  const [pendingNextStep, setPendingNextStep] = useState(false)
  const { isSuccess: isAuthenticated, loading: sessionLoading } = useSession()

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

  const handleNext = () => {
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
            <SummaryStep uploadedFiles={uploadedFiles} onBack={handleBack} onNext={handleNext} />
          )}

          {currentStep === 3 && <PaymentStep onBack={handleBack} />}
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
