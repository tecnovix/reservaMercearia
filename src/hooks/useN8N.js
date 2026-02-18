import { useState, useCallback } from 'react'
import { checkPanelAvailability, checkSpotsAvailability, submitReservation } from '../lib/api'
import { isPanelAllowedLocation } from '../lib/utils'
import useReservationStore from '../store/reservationStore'

export function useN8N() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const {
    setCheckingPanelAvailability,
    setPanelAvailability,
    setPanelAvailabilityError,
    setCheckingSpotsAvailability,
    setSpotsAvailability,
    setSpotsAvailabilityError,
    setSubmitting,
    setSubmitError,
    setSubmitSuccess,
  } = useReservationStore()

  const checkPanelAvailabilityHandler = useCallback(async (date, quantidadePessoas = 0, localDesejado = '') => {
    setCheckingPanelAvailability(true)
    setPanelAvailabilityError(null)

    try {
      const result = await checkPanelAvailability(date)
      
      // Validação adicional: painel só disponível para 10+ pessoas e locais permitidos
      const isAvailable = result.available && quantidadePessoas >= 10 && isPanelAllowedLocation(localDesejado)
      
      let message = result.message
      if (!isAvailable) {
        if (quantidadePessoas < 10) {
          message = 'O painel só pode ser reservado para grupos com 10 ou mais pessoas. Aumente a quantidade de pessoas acima.'
        } else if (!isPanelAllowedLocation(localDesejado)) {
          message = 'O painel só pode ser reservado nestes locais: Deck lateral (fundo), Deck lateral (próximo ao palco) ou Área externa (frente). Altere o local desejado acima.'
        } else {
          message = result.message
        }
      }
      
      const finalResult = {
        ...result,
        available: isAvailable,
        message: message
      }
      
      setPanelAvailability(finalResult)
      return finalResult
    } catch (err) {
      const errorMessage = err.message || 'Não foi possível verificar a disponibilidade do painel. Tente novamente.'
      setPanelAvailabilityError(errorMessage)
      return null
    } finally {
      setCheckingPanelAvailability(false)
    }
  }, [setCheckingPanelAvailability, setPanelAvailability, setPanelAvailabilityError])

  const checkSpotsAvailabilityHandler = useCallback(async (date, localDesejado) => {
    if (!date || !localDesejado) {
      setSpotsAvailabilityError(null)
      setSpotsAvailability({ available: null, message: '' })
      return null
    }
    setCheckingSpotsAvailability(true)
    setSpotsAvailabilityError(null)
    try {
      const result = await checkSpotsAvailability(date, localDesejado)
      setSpotsAvailability(result)
      return result
    } catch (err) {
      const errorMessage = err.message || 'Não foi possível verificar a disponibilidade de vagas. Tente novamente.'
      setSpotsAvailabilityError(errorMessage)
      return null
    } finally {
      setCheckingSpotsAvailability(false)
    }
  }, [setCheckingSpotsAvailability, setSpotsAvailability, setSpotsAvailabilityError])

  const submitReservationHandler = useCallback(async (data) => {
    setSubmitting(true)
    setSubmitError(null)
    setError(null)

    try {
      const result = await submitReservation(data)

      if (result.success) {
        setSubmitSuccess()
        return result
      }

      throw new Error('Não foi possível processar sua reserva. Tente novamente.')
    } catch (err) {
      const errorMessage = err.message || 'Não foi possível enviar sua reserva. Tente novamente.'
      setSubmitError(errorMessage)
      setError(errorMessage)
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [setSubmitting, setSubmitError, setSubmitSuccess])

  return {
    loading,
    error,
    checkPanelAvailability: checkPanelAvailabilityHandler,
    checkSpotsAvailability: checkSpotsAvailabilityHandler,
    submitReservation: submitReservationHandler,
  }
}