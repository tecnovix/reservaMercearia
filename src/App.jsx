import React, { useEffect } from 'react'
import useReservationStore from './store/reservationStore'
import { ProgressBar } from './components/Layout/ProgressBar'
import { StepPersonalData } from './components/FormSteps/StepPersonalData'
import { StepReservationDetails } from './components/FormSteps/StepReservationDetails'
import { StepSummary } from './components/FormSteps/StepSummary'
import { useFormPersistence } from './hooks/useFormPersistence'
import { getAvailabilityConfig } from './lib/api'

function App() {
  const currentStep = useReservationStore((state) => state.currentStep)
  const setAvailabilityConfig = useReservationStore((state) => state.setAvailabilityConfig)

  // Initialize form persistence
  useFormPersistence()

  // 1) Ao iniciar o app: check-availability-mercearia (disponibilidade geral)
  useEffect(() => {
    const load = async () => {
      try {
        const config = await getAvailabilityConfig()
        setAvailabilityConfig(config)
      } catch (error) {
        console.error('Error loading availability config:', error)
        setAvailabilityConfig({
          defaultTimeSlots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
          blockedDates: [],
          exceptions: [],
          blockedWeekdays: [0],
          message: '',
        })
      }
    }
    load()
  }, [setAvailabilityConfig])

  // Process offline queue when app loads
  useEffect(() => {
    const processOfflineReservations = async () => {
      if (navigator.onLine) {
        const offlineQueue = localStorage.getItem('offlineReservations')
        if (offlineQueue) {
          const { processOfflineQueue } = await import('./lib/api')
          processOfflineQueue()
        }
      }
    }

    processOfflineReservations()
  }, [])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepPersonalData />
      case 2:
        return <StepReservationDetails />
      case 3:
        return <StepSummary />
      default:
        return <StepPersonalData />
    }
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center">
            <img 
              src="/assets/IconSemFundo.webp" 
              alt="Mercearia Logo" 
              className="h-32 w-32 object-contain"
            />
          </div>
        </div>

        {/* Progress Bar */}
        <ProgressBar />

        {/* Form Steps */}
        <div className="transition-all duration-300">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            © {new Date().getFullYear()} Mercearia. Desenvolvido por{' '}
            <a
              href="https://tecnovix.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-custom-600 hover:text-orange-custom-700 underline"
            >
              Tecnovix
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App