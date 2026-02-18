import axios from 'axios'

const N8N_API_URL = import.meta.env.VITE_N8N_API_URL || 'http://localhost:5678/webhook/check-panel-availability-mercearia'
const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_WEBHOOK_URL || 'http://localhost:5678/webhook/booking-mercearia'
const N8N_AVAILABILITY_URL = import.meta.env.VITE_N8N_AVAILABILITY_URL || 'https://webhook.builder.autonix.com.br/webhook/check-availability-mercearia'

const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Retry logic
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

async function retryRequest(fn, retries = MAX_RETRIES) {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      return retryRequest(fn, retries - 1)
    }
    throw error
  }
}

export async function checkPanelAvailability(date) {
  try {
    const response = await apiClient.get(N8N_API_URL, {
      params: { date }
    })

    return {
      available: response.data.available ?? true,
      count: response.data.count ?? 0,
      message: response.data.message || '',
    }
  } catch (error) {
    console.error('Error checking panel availability:', error)

    // Return default values if API is not available
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return {
        available: true,
        count: 0,
        message: 'Não foi possível verificar a disponibilidade do painel. Você pode continuar com a reserva.',
      }
    }

    throw new Error('Não foi possível verificar a disponibilidade do painel. Tente novamente.')
  }
}

export async function submitReservation(data) {
  try {
    const response = await retryRequest(async () => {
      return await apiClient.post(N8N_WEBHOOK_URL, data)
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    console.error('Error submitting reservation:', error)

    // Store in localStorage if offline
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || !navigator.onLine) {
      const offlineQueue = JSON.parse(localStorage.getItem('offlineReservations') || '[]')
      offlineQueue.push({
        ...data,
        offlineTimestamp: new Date().toISOString(),
      })
      localStorage.setItem('offlineReservations', JSON.stringify(offlineQueue))

      return {
        success: true,
        offline: true,
        message: 'Reserva salva localmente. Será enviada quando a conexão for restabelecida.',
      }
    }

    throw new Error(error.response?.data?.message || 'Não foi possível enviar sua reserva. Tente novamente.')
  }
}

// Get availability configuration from N8N
export async function getAvailabilityConfig() {
  try {
    const response = await apiClient.get(N8N_AVAILABILITY_URL)

    // Expected response structure:
    // {
    //   defaultTimeSlots: ['18:00', '18:30', ...],
    //   blockedDates: ['2025-01-01', '2025-12-25', ...],
    //   exceptions: [
    //     {date: '2025-05-11', timeSlots: ['11:00', '11:30']},
    //     {date: '2025-05-12', timeSlots: []} // Data totalmente bloqueada
    //   ],
    //   blockedWeekdays: [0], // 0=domingo, 1=segunda, etc
    //   message: string
    // }

    return {
      defaultTimeSlots: response.data.defaultTimeSlots || generateDefaultTimeSlots(),
      blockedDates: response.data.blockedDates || [],
      exceptions: response.data.exceptions || [],
      blockedWeekdays: response.data.blockedWeekdays || [0], // Domingo bloqueado por padrão
      message: response.data.message || ''
    }
  } catch (error) {
    console.error('Error getting availability config:', error)

    // Return default configuration if API fails
    return {
      defaultTimeSlots: generateDefaultTimeSlots(),
      blockedDates: [],
      exceptions: [],
      blockedWeekdays: [0], // Domingo bloqueado por padrão
      message: ''
    }
  }
}

// Generate default time slots (18:00 to 20:30)
function generateDefaultTimeSlots() {
  const slots = []
  for (let hour = 18; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 20 && minute > 30) break
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      slots.push(time)
    }
  }
  return slots
}

// Process offline queue when back online
export async function processOfflineQueue() {
  const offlineQueue = JSON.parse(localStorage.getItem('offlineReservations') || '[]')

  if (offlineQueue.length === 0) return

  const results = []

  for (const reservation of offlineQueue) {
    try {
      const result = await submitReservation(reservation)
      results.push({ success: true, reservation, result })
    } catch (error) {
      results.push({ success: false, reservation, error })
    }
  }

  // Remove successfully sent reservations
  const failedReservations = results
    .filter(r => !r.success)
    .map(r => r.reservation)

  localStorage.setItem('offlineReservations', JSON.stringify(failedReservations))

  return results
}

// Check connection and process queue on load
if (typeof window !== 'undefined') {
  window.addEventListener('online', processOfflineQueue)

  // Check for offline reservations on load
  if (navigator.onLine) {
    processOfflineQueue()
  }
}