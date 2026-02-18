import { z } from 'zod'

// Step 1: Personal Data Schema
export const personalDataSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Informe um e-mail válido'),
  telefone: z.string().regex(
    /^\(\d{2}\) \d{5}-\d{4}$/,
    'Informe o telefone no formato (XX) XXXXX-XXXX'
  ),
  dataNascimento: z.string().refine((date) => {
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    return age >= 18 && age <= 120
  }, 'É necessário ter entre 18 e 120 anos para fazer a reserva'),
})

// Step 2: Reservation Type Schema
export const reservationTypeSchema = z.discriminatedUnion('tipoReserva', [
  z.object({
    tipoReserva: z.literal('aniversario'),
    reservaPainel: z.boolean(),
    fotoPainel: z.string().nullable(),
    orientacoesPainel: z.string().max(500, 'Máximo de 500 caracteres'),
  }),
  z.object({
    tipoReserva: z.literal('confraternizacao'),
    tipoCardapio: z.enum(['normal', 'pacote_fechado']),
    orientacoesCompra: z.string().max(500, 'Máximo de 500 caracteres'),
  }),
  z.object({
    tipoReserva: z.literal('reuniao'),
  }),
])

// Step 3: Reservation Details Schema
export const reservationDetailsSchema = z.object({
  quantidadePessoas: z.number()
    .min(4, 'Reserva mínima de 4 pessoas')
    .max(50, 'Máximo de 50 pessoas por reserva'),
  dataReserva: z.string().refine((date) => {
    // Parse date string directly to local timezone
    const [year, month, day] = date.split('-').map(Number)
    const reservationDate = new Date(year, month - 1, day)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return reservationDate >= today
  }, 'Selecione uma data a partir de hoje'),
  horarioDesejado: z.string().regex(/^\d{2}:\d{2}$/, 'Selecione um horário'),
  localDesejado: z.enum(['', 'proximo_play_salao', 'proximo_palco_salao', 'deck_lateral_fundo', 'deck_lateral_palco', 'area_externa_frente'], {
    errorMap: () => ({ message: 'Selecione o local desejado para a reserva' }),
  }).refine((val) => val !== '', {
    message: 'Selecione o local desejado para a reserva'
  }),
  observacoes: z.string().max(1000, 'Máximo de 1000 caracteres').optional(),
})

// Complete form schema
export const completeFormSchema = z.object({
  ...personalDataSchema.shape,
  ...reservationDetailsSchema.shape,
  tipoReserva: z.string(),
  reservaPainel: z.boolean().optional(),
  fotoPainel: z.string().nullable().optional(),
  orientacoesPainel: z.string().optional(),
  tipoCardapio: z.string().optional(),
  orientacoesCompra: z.string().optional(),
})