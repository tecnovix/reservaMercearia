import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const initialState = {
  currentStep: 1,
  formData: {
    // Step 1: Dados Pessoais
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',

    // Step 2: Tipo de Reserva
    tipoReserva: '',
    reservaPainel: false,
    tipoCardapio: '',

    // Step 3: Detalhes da Reserva
    quantidadePessoas: 1,
    dataReserva: '',
    horarioDesejado: '',
    localDesejado: '',
    observacoes: '',
  },

  // Panel availability states
  checkingPanelAvailability: false,
  panelAvailabilityError: null,
  panelAvailable: null,
  panelSlotsUsed: 0,

  // Spots availability (data + local)
  checkingSpotsAvailability: false,
  spotsAvailabilityError: null,
  spotsAvailable: null,
  spotsMessage: '',

  // Availability config (check-availability-mercearia), carregado ao iniciar o app
  availabilityConfig: null,

  // Form submission states
  submitting: false,
  submitError: null,
  submitSuccess: false,
}

const useReservationStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Navigation actions
      setCurrentStep: (step) => set({ currentStep: step }),
      nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),
      previousStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      // Form data actions
      updateFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
      })),

      clearFormData: () => set({
        ...initialState,
        currentStep: 1,
      }),

      // Panel availability actions
      setCheckingPanelAvailability: (checking) => set({ checkingPanelAvailability: checking }),
      setPanelAvailability: (data) => set({
        panelAvailable: data.available,
        panelSlotsUsed: data.count,
        panelAvailabilityError: null,
      }),
      setPanelAvailabilityError: (error) => set({
        panelAvailabilityError: error,
        panelAvailable: null,
        panelSlotsUsed: 0,
      }),

      // Spots availability actions
      setCheckingSpotsAvailability: (checking) => set({ checkingSpotsAvailability: checking }),
      setSpotsAvailability: (data) => set({
        spotsAvailable: data.available,
        spotsMessage: data.message ?? '',
        spotsAvailabilityError: null,
      }),
      setSpotsAvailabilityError: (error) => set({
        spotsAvailabilityError: error,
        spotsAvailable: null,
        spotsMessage: '',
      }),

      setAvailabilityConfig: (config) => set({ availabilityConfig: config }),

      // Submission actions
      setSubmitting: (submitting) => set({ submitting }),
      setSubmitError: (error) => set({ submitError: error, submitSuccess: false }),
      setSubmitSuccess: () => set({ submitSuccess: true, submitError: null }),


      // Validation helpers
      isStepValid: (step) => {
        const { formData } = get()

        switch (step) {
          case 1:
            return !!(
              formData.nome &&
              formData.email &&
              formData.telefone &&
              formData.dataNascimento
            )

          case 2:
            // Combine validations from old steps 2 and 3
            if (!formData.tipoReserva) return false

            // Check reservation details
            return !!(
              formData.quantidadePessoas > 0 &&
              formData.dataReserva &&
              formData.horarioDesejado &&
              formData.localDesejado
            )

          default:
            return true
        }
      },

      // Get form data for submission
      getSubmissionData: () => {
        const { formData } = get()

        return {
          timestamp: new Date().toISOString(),
          formId: crypto.randomUUID(),
          dadosPessoais: {
            nome: formData.nome,
            email: formData.email,
            telefone: formData.telefone,
            dataNascimento: formData.dataNascimento,
          },
          tipoReserva: {
            tipo: formData.tipoReserva,
            reservaPainel: formData.reservaPainel || false,
            fotoPainel: formData.fotoPainel || null,
            orientacoesPainel: formData.orientacoesPainel || null,
            tipoCardapio: formData.tipoCardapio || null,
            orientacoesCompra: formData.orientacoesCompra || null,
          },
          detalhesReserva: {
            quantidadePessoas: formData.quantidadePessoas,
            dataReserva: formData.dataReserva,
            horarioDesejado: formData.horarioDesejado,
            localDesejado: formData.localDesejado,
            observacoes: formData.observacoes || null,
          },
        }
      },
    }),
    {
      name: 'reservation-storage',
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
        // availabilityConfig não persiste; é recarregado ao abrir o app
      }),
    }
  )
)

export default useReservationStore