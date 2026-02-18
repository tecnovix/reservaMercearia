import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatPhoneBR(value) {
  if (!value) return ''

  const phoneNumber = value.replace(/\D/g, '')
  const phoneNumberLength = phoneNumber.length

  if (phoneNumberLength < 3) return phoneNumber

  if (phoneNumberLength < 7) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`
  }

  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`
}

export function formatDateBR(date) {
  if (!date) return ''

  // Handle YYYY-MM-DD format by adding time to avoid timezone issues
  const dateStr = typeof date === 'string' && date.includes('-')
    ? `${date}T00:00:00`
    : date

  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()

  return `${day}/${month}/${year}`
}

export function parseDateBR(dateStr) {
  if (!dateStr) return ''

  const parts = dateStr.split('/')
  if (parts.length !== 3) return ''

  const [day, month, year] = parts
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

export async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

export async function compressImage(file, maxSizeMB = 2) {
  const maxSize = maxSizeMB * 1024 * 1024

  if (file.size <= maxSize) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        // Calculate new dimensions
        const scaleFactor = Math.sqrt(maxSize / file.size)
        width *= scaleFactor
        height *= scaleFactor

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          file.type,
          0.8
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export const timeSlots = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'
]

export const locationOptions = [
  { value: 'proximo_play_salao', label: 'Próximo ao play (salão)' },
  { value: 'proximo_palco_salao', label: 'Próximo ao palco (salão)' },
  { value: 'deck_lateral_fundo', label: 'Deck lateral (fundo)' },
  { value: 'deck_lateral_palco', label: 'Deck lateral (próximo ao palco)' },
  { value: 'area_externa_frente', label: 'Área externa (frente)' },
]

export const reservationTypes = [
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'despedida_solteiro', label: 'Despedida de Solteiro' },
  { value: 'reuniao', label: 'Reunião de Família ou Amigos' },
]

export const menuTypes = [
  { value: 'normal', label: 'Cardápio Normal' },
  { value: 'pacote_fechado', label: 'Pacote Fechado' },
]

export function getReservationTypeLabel(type) {
  const found = reservationTypes.find(t => t.value === type)
  return found ? found.label : type
}

export function getLocationLabel(location) {
  const found = locationOptions.find(l => l.value === location)
  return found ? found.label : location
}

export function getMenuTypeLabel(type) {
  const found = menuTypes.find(m => m.value === type)
  return found ? found.label : type
}

// Locais que permitem reserva de painel
export const panelAllowedLocations = [
  'deck_lateral_fundo',
  'deck_lateral_palco', 
  'area_externa_frente'
]

export function isPanelAllowedLocation(location) {
  return panelAllowedLocations.includes(location)
}