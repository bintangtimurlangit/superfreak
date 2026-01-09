'use client'

interface Step {
  id: number
  name: string
}

interface StepsProgressProps {
  steps: Step[]
  currentStep: number
}

export default function StepsProgress({ steps, currentStep }: StepsProgressProps) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-[#EFEFEF]">
      <div className="mx-auto px-6 md:px-10">
        <div className="flex items-end gap-6 py-4">
          {/* Steps Counter */}
          <div className="flex items-center gap-2 pb-1">
            <span
              className="text-sm font-semibold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Steps
            </span>
            <div className="px-3 py-1.5 bg-[#F8F8F8] rounded-[8px]">
              <span
                className="text-sm text-[#7C7C7C]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {currentStep}/{steps.length}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="flex-1 flex items-end gap-3 relative">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex-1 flex flex-col relative">
                  {/* Individual Horizontal Line Segment */}
                  <div className="relative h-1 mb-2">
                    <div
                      className={`h-full w-full rounded-sm ${
                        isActive ? 'bg-[#292929]' : isCompleted ? 'bg-[#292929]' : 'bg-[#EFEFEF]'
                      }`}
                    ></div>
                  </div>
                  {/* Step Label */}
                  <div className="px-1">
                    <span
                      className={`text-xs ${
                        isActive ? 'font-semibold text-[#292929]' : 'font-normal text-[#7C7C7C]'
                      }`}
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {step.name}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
