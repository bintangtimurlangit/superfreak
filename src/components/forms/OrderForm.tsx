'use client'

import { useState, useEffect } from 'react'
import StepsProgress from '@/components/ui/StepsProgress'
import UploadStep, { type UploadedFile, type ModelConfiguration } from './order/UploadStep'
import SummaryStep from './order/SummaryStep'
import PaymentStep from './order/PaymentStep'
import ConfigureModal from '@/components/modals/ConfigureModal'

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

  // Check for files from Hero Section on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
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
      prev.map((file) =>
        file.id === fileId
          ? {
              ...file,
              configuration: {
                ...file.configuration,
                ...configuration,
              },
            }
          : file,
      ),
    )
    setConfigureModalOpen(false)
    setSelectedFileId(null)
  }

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

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
    </div>
  )
}
