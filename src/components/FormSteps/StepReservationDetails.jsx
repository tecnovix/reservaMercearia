import React, { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { reservationDetailsSchema } from '../../lib/validations'
import {
  locationOptions,
  reservationTypes,
  menuTypes,
  isPanelAllowedLocation,
} from '../../lib/utils'
import useReservationStore from '../../store/reservationStore'
import { useN8N } from '../../hooks/useN8N'
import { getAvailabilityConfig } from '../../lib/api'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select } from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { CheckCircle, Loader2, AlertCircle, AlertTriangle, Cake, Users, Heart, Check, Image, MapPin, X, FileText } from 'lucide-react'

export function StepReservationDetails() {
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    checkingPanelAvailability,
    panelAvailable,
    panelSlotsUsed,
    panelAvailabilityError,
    checkingSpotsAvailability,
    spotsAvailable,
    spotsAvailabilityError,
    spotsMessage,
    availabilityConfig,
    setAvailabilityConfig,
  } = useReservationStore()

  const { checkPanelAvailability, checkSpotsAvailability } = useN8N()
  const [dateDebounce, setDateDebounce] = useState(null)
  const [spotsDebounce, setSpotsDebounce] = useState(null)
  const [panelMessage, setPanelMessage] = useState('')
  const [availableTimeSlots, setAvailableTimeSlots] = useState([])
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [dateAvailable, setDateAvailable] = useState(true)
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [mapModalOpen, setMapModalOpen] = useState(false)
  const [panelModeloModalOpen, setPanelModeloModalOpen] = useState(false)
  const [panelOrientacoesModalOpen, setPanelOrientacoesModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(reservationDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      quantidadePessoas: formData.quantidadePessoas || 4,
      dataReserva: formData.dataReserva || '',
      horarioDesejado: formData.horarioDesejado || '',
      localDesejado: formData.localDesejado || '',
      observacoes: formData.observacoes || '',
    },
  })

  const watchedDate = watch('dataReserva')
  const watchedQuantidadePessoas = watch('quantidadePessoas')
  const watchedLocalDesejado = watch('localDesejado')

  // Handle type change
  const handleTypeChange = (type) => {
    updateFormData({
      tipoReserva: type,
      // Reset conditional fields when changing type
      reservaPainel: false,
      tipoCardapio: '',
    })
  }


  // Sempre que a data mudar: buscar config atualizada (check-availability-mercearia)
  useEffect(() => {
    if (!watchedDate) return
    let cancelled = false
    setCheckingAvailability(true)
    getAvailabilityConfig()
      .then((config) => {
        if (!cancelled) setAvailabilityConfig(config)
      })
      .catch((err) => {
        console.error('Error loading availability config on date change:', err)
        if (!cancelled) {
          setAvailabilityConfig({
            defaultTimeSlots: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
            blockedDates: [],
            exceptions: [],
            blockedWeekdays: [0],
            message: '',
          })
        }
      })
      .finally(() => {
        if (!cancelled) setCheckingAvailability(false)
      })
    return () => { cancelled = true }
  }, [watchedDate, setAvailabilityConfig])

  // Aplica a config de disponibilidade na data selecionada (blockedDates, blockedWeekdays, exceptions, defaultTimeSlots)
  useEffect(() => {
    if (!watchedDate) {
      setAvailableTimeSlots([])
      setDateAvailable(true)
      setAvailabilityMessage('')
      return
    }
    if (!availabilityConfig) return

    const date = new Date(watchedDate + 'T00:00:00')
    const now = new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (localDate < today) {
      setDateAvailable(false)
      setAvailabilityMessage('Não é possível fazer reservas para datas passadas')
      setAvailableTimeSlots([])
      return
    }

    if (localDate.getTime() === today.getTime() && now.getHours() >= 18) {
      setDateAvailable(false)
      setAvailabilityMessage('As reservas para hoje já foram encerradas')
      setAvailableTimeSlots([])
      return
    }

    const weekday = date.getDay()
    const dateStr = watchedDate
    const exceptions = Array.isArray(availabilityConfig.exceptions) ? availabilityConfig.exceptions : []
    const blockedDates = Array.isArray(availabilityConfig.blockedDates) ? availabilityConfig.blockedDates : []
    const blockedWeekdays = Array.isArray(availabilityConfig.blockedWeekdays) ? availabilityConfig.blockedWeekdays : [0]
    const defaultTimeSlots = Array.isArray(availabilityConfig.defaultTimeSlots) ? availabilityConfig.defaultTimeSlots : ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30']

    const exception = exceptions.find((e) => e && e.date === dateStr)
    if (exception) {
      if (exception.timeSlots && exception.timeSlots.length > 0) {
        setDateAvailable(true)
        setAvailableTimeSlots(exception.timeSlots)
        setAvailabilityMessage(exception.message || '')
        if (formData.tipoReserva === 'aniversario' && formData.reservaPainel) {
          clearTimeout(dateDebounce)
          const t = setTimeout(() => {
            checkPanelAvailability(watchedDate, watchedQuantidadePessoas, watchedLocalDesejado).then((r) => r && setPanelMessage(r.message || ''))
          }, 500)
          setDateDebounce(t)
          return () => clearTimeout(t)
        }
      } else {
        setDateAvailable(false)
        setAvailabilityMessage(exception.message || 'Esta data não está disponível para reservas')
        setAvailableTimeSlots([])
      }
      return
    }

    if (blockedDates.includes(dateStr)) {
      setDateAvailable(false)
      setAvailabilityMessage('Esta data não está disponível para reservas')
      setAvailableTimeSlots([])
      return
    }

    if (blockedWeekdays.includes(weekday)) {
      setDateAvailable(false)
      setAvailabilityMessage(weekday === 0 ? 'Não atendemos aos domingos' : 'Não atendemos neste dia da semana')
      setAvailableTimeSlots([])
      return
    }

    setDateAvailable(true)
    setAvailableTimeSlots(defaultTimeSlots)
    setAvailabilityMessage('')

    if (formData.tipoReserva === 'aniversario' && formData.reservaPainel) {
      clearTimeout(dateDebounce)
      const t = setTimeout(() => {
        checkPanelAvailability(watchedDate, watchedQuantidadePessoas, watchedLocalDesejado).then((r) => r && setPanelMessage(r.message || ''))
      }, 500)
      setDateDebounce(t)
      return () => clearTimeout(t)
    }
  }, [watchedDate, watchedQuantidadePessoas, watchedLocalDesejado, availabilityConfig, formData.tipoReserva, formData.reservaPainel])

  // 2) Só depois: verificação de vagas (check-spots-available). Só chama se 1) já tiver config de disponibilidade e data disponível.
  useEffect(() => {
    if (!watchedDate || !watchedLocalDesejado) {
      if (spotsDebounce) clearTimeout(spotsDebounce)
      checkSpotsAvailability('', '')
      return
    }
    // Só chama check-spots-available se check-availability-mercearia já foi aplicado (config carregado) e a data está disponível
    if (!availabilityConfig || !dateAvailable) return
    if (spotsDebounce) clearTimeout(spotsDebounce)
    const timeout = setTimeout(async () => {
      await checkSpotsAvailability(watchedDate, watchedLocalDesejado)
    }, 500)
    setSpotsDebounce(timeout)
    return () => clearTimeout(timeout)
  }, [watchedDate, watchedLocalDesejado, dateAvailable, availabilityConfig])

  const onSubmit = (data) => {
    // Validate reservation type
    if (!formData.tipoReserva) {
      return
    }

    // Vagas (data + local): bloquear se indisponível
    if (watchedDate && watchedLocalDesejado && spotsAvailable === false) {
      return
    }

    // Validate conditional fields for anniversary
    if (formData.tipoReserva === 'aniversario' && formData.reservaPainel) {
      // If panel not available, prevent submission
      if (panelAvailable === false) {
        return
      }
      // Additional validation: panel requires minimum 10 people
      if (watchedQuantidadePessoas < 10) {
        return
      }
      // Additional validation: panel requires allowed location
      if (!isPanelAllowedLocation(watchedLocalDesejado)) {
        return
      }
    }

    // Validate conditional fields for party
    if (formData.tipoReserva === 'confraternizacao') {
      if (!formData.tipoCardapio) {
        return
      }
    }

    updateFormData(data)
    nextStep()
  }

  // Get today's date for minimum date validation
  const today = new Date().toISOString().split('T')[0]

  const anyModalOpen = mapModalOpen || panelModeloModalOpen || panelOrientacoesModalOpen
  useEffect(() => {
    if (!anyModalOpen) return
    const onEscape = (e) => {
      if (e.key === 'Escape') {
        setMapModalOpen(false)
        setPanelModeloModalOpen(false)
        setPanelOrientacoesModalOpen(false)
      }
    }
    window.addEventListener('keydown', onEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
    }
  }, [anyModalOpen])

  return (
    <>
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Detalhes da Reserva</CardTitle>
        <CardDescription>
          Informe o tipo e os detalhes da sua reserva.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Reservation Type Section */}
          <div className="space-y-3">
            <Label>Tipo de Reserva *</Label>
            <div className="grid grid-cols-1 gap-3">
              {reservationTypes.map((type) => {
                const isSelected = formData.tipoReserva === type.value
                const icons = {
                  aniversario: Cake,
                  confraternizacao: Users,
                  reuniao: Heart,
                }
                const Icon = icons[type.value] || Cake
                
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                      ${isSelected
                        ? 'border-orange-custom-600 bg-orange-custom-600/20 shadow-lg shadow-orange-custom-600/20'
                        : 'border-gray-600 bg-gray-800 hover:border-gray-500 hover:bg-gray-700'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`
                        flex items-center justify-center w-10 h-10 rounded-lg
                        ${isSelected ? 'bg-orange-custom-600 text-white' : 'bg-gray-700 text-gray-400'}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`flex-1 font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                        {type.label}
                      </span>
                      {isSelected && (
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-custom-600">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conditional fields for Confraternização */}
          {formData.tipoReserva === 'confraternizacao' && (
            <div className="space-y-4 p-4 border border-custom rounded-lg bg-gray-800">
              <div className="space-y-3">
                <Label>Tipo de Cardápio *</Label>
                <div className="grid grid-cols-1 gap-3">
                  {menuTypes.map((menu) => {
                    const isSelected = formData.tipoCardapio === menu.value
                    return (
                      <button
                        key={menu.value}
                        type="button"
                        onClick={() => updateFormData({ tipoCardapio: menu.value })}
                        className={`
                          relative p-4 rounded-lg border-2 transition-all duration-200 text-left
                          ${isSelected
                            ? 'border-orange-custom-600 bg-orange-custom-600/20 shadow-lg shadow-orange-custom-600/20'
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500 hover:bg-gray-600'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`
                            flex items-center justify-center w-10 h-10 rounded-lg
                            ${isSelected ? 'bg-orange-custom-600 text-white' : 'bg-gray-600 text-gray-400'}
                          `}>
                            <Check className="w-5 h-5" />
                          </div>
                          <span className={`flex-1 font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {menu.label}
                          </span>
                          {isSelected && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-custom-600">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-gray-700 rounded-lg border border-gray-600">
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-orange-custom-600 font-semibold mb-2">
                        Orientações:
                      </p>
                      <ul className="space-y-2 text-gray-200">
                        <li>• Nosso site nós temos todas as orientações sobre a confraternização de empresas.</li>
                        <li>• Link: <a href="https://www.barmercearia.com.br/empresas" target="_blank" rel="noopener noreferrer" className="text-orange-custom-400 hover:text-orange-custom-300 underline">https://www.barmercearia.com.br/empresas</a></li>
                        <li>• Dúvidas mandar via WhatsApp.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantidadePessoas">Quantidade de Pessoas (min 4) *</Label>
              <Input
                id="quantidadePessoas"
                type="number"
                min={4}
                max={50}
                className={errors.quantidadePessoas ? 'border-red-500 focus-visible:ring-red-500' : ''}
                aria-invalid={!!errors.quantidadePessoas}
                {...register('quantidadePessoas', { valueAsNumber: true })}
              />
              {errors.quantidadePessoas && (
                <p className="text-sm text-red-500" role="alert">
                  {errors.quantidadePessoas.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataReserva">Data da Reserva *</Label>
              <Input
                id="dataReserva"
                type="date"
                min={today}
                placeholder="DD/MM/AAAA"
                {...register('dataReserva')}
              />
              {errors.dataReserva && (
                <p className="text-sm text-red-500">{errors.dataReserva.message}</p>
              )}
              {watchedDate && !dateAvailable && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{availabilityMessage || 'Data não disponível'}</span>
                </div>
              )}
              {watchedDate && dateAvailable && availabilityMessage && (
                <div className="flex items-center gap-2 text-orange-custom-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{availabilityMessage}</span>
                </div>
              )}
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horarioDesejado">Horário Desejado *</Label>
              <Select
                id="horarioDesejado"
                {...register('horarioDesejado')}
                disabled={!watchedDate || checkingAvailability || !dateAvailable || availableTimeSlots.length === 0}
              >
                <option value="">
                  {!watchedDate
                    ? 'Selecione primeiro a data'
                    : checkingAvailability
                    ? 'Verificando disponibilidade...'
                    : !dateAvailable
                    ? 'Data indisponível'
                    : availableTimeSlots.length === 0
                    ? 'Carregando horários...'
                    : 'Selecione um horário'}
                </option>
                {availableTimeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </Select>
              {errors.horarioDesejado && (
                <p className="text-sm text-red-500">
                  {errors.horarioDesejado.message}
                </p>
              )}
              {!watchedDate && (
                <p className="text-sm text-gray-400">
                  Selecione a data para ver os horários disponíveis
                </p>
              )}
              {watchedDate && (checkingAvailability || (dateAvailable && availableTimeSlots.length === 0 && availabilityConfig)) && (
                <p className="text-sm text-yellow-600">
                  {checkingAvailability ? 'Verificando disponibilidade da data...' : 'Carregando horários disponíveis...'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="localDesejado">Local Desejado *</Label>
              <Select id="localDesejado" {...register('localDesejado')}>
                <option value="">Selecione um local</option>
                {locationOptions.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </Select>
              {errors.localDesejado && (
                <p className="text-sm text-red-500">{errors.localDesejado.message}</p>
              )}
              {watchedDate && watchedLocalDesejado && dateAvailable && (
                <div className="flex items-center gap-2 flex-wrap">
                  {checkingSpotsAvailability ? (
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando vagas...
                    </Badge>
                  ) : spotsAvailable === true ? (
                    <Badge variant="success" className="flex items-center gap-1 w-fit">
                      <CheckCircle className="h-3 w-3" />
                      {spotsMessage || 'Disponível'}
                    </Badge>
                  ) : spotsAvailable === false ? (
                    <Badge variant="destructive" className="w-fit">
                      {spotsAvailabilityError || spotsMessage || 'Sem vagas para esta data e local'}
                    </Badge>
                  ) : null}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                onClick={() => setMapModalOpen(true)}
              >
                <MapPin className="h-4 w-4" />
                Ver mapa do local
              </Button>
            </div>
          </div>

          {/* Conditional fields for Aniversário - após Local Desejado, antes de Observações */}
          {formData.tipoReserva === 'aniversario' && (
            <div className="space-y-4 p-4 border border-custom rounded-lg bg-gray-800">
              <div className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 overflow-hidden
                ${(formData.reservaPainel && (panelAvailable === false || panelAvailabilityError))
                  ? 'border-panel-error'
                  : formData.reservaPainel
                    ? 'border-orange-custom-600 bg-gradient-to-br from-orange-custom-600/30 to-orange-custom-600/10 shadow-2xl shadow-orange-custom-600/30'
                    : 'border-yellow-500/60 bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20'
                }
              `}>
                {formData.reservaPainel && !(panelAvailable === false || panelAvailabilityError) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-custom-600/20 to-transparent animate-pulse" />
                )}
                <button
                  type="button"
                  onClick={() => updateFormData({ reservaPainel: !formData.reservaPainel })}
                  className="w-full text-left relative z-10"
                >
                  <div className="flex items-start">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`
                            font-bold text-xl mb-1 transition-colors duration-200 flex items-center gap-2
                            ${formData.reservaPainel ? 'text-white' : 'text-yellow-200'}
                          `}>
                            Painel de Aniversário
                            {formData.reservaPainel && (panelAvailable === false || panelAvailabilityError) && (
                              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" aria-hidden />
                            )}
                          </h3>
                          {!formData.reservaPainel && (
                            <p className="text-sm font-medium text-yellow-300/80 transition-colors duration-200">
                              ⚠ Clique para selecionar
                            </p>
                          )}
                        </div>
                        <div className={`
                          relative w-16 h-9 rounded-full transition-all duration-300 flex-shrink-0
                          ${formData.reservaPainel 
                            ? 'bg-green-500 shadow-lg shadow-green-500/50' 
                            : 'bg-gray-600'
                          }
                        `}>
                          <div className={`
                            absolute top-1 left-1 w-7 h-7 rounded-full bg-white transition-all duration-300 shadow-md
                            ${formData.reservaPainel ? 'translate-x-7' : 'translate-x-0'}
                          `}>
                            {formData.reservaPainel && (
                              <div className="w-full h-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className={`
                        text-sm font-medium leading-relaxed
                        ${formData.reservaPainel ? 'text-gray-300' : 'text-gray-400'}
                      `}>
                        {!formData.reservaPainel ? (
                          <>Você precisa marcar esta opção se deseja reservar o painel.</>
                        ) : !watchedDate || !watch('localDesejado') ? (
                          <>Preencha data e local desejado acima para verificar a disponibilidade do painel.</>
                        ) : (
                          <span className="flex flex-wrap items-center gap-2">
                            {checkingPanelAvailability ? (
                              <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Verificando disponibilidade...
                              </Badge>
                            ) : panelAvailable === true ? (
                              <Badge variant="success" className="flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                {panelMessage || `Disponível (${2 - panelSlotsUsed} vaga${2 - panelSlotsUsed !== 1 ? 's' : ''})`}
                              </Badge>
                            ) : panelAvailable === false ? (
                              <span className="flex flex-col gap-1.5">
                                <Badge variant="destructive" className="w-fit">
                                  {panelMessage || 'Indisponível (limite atingido)'}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  Corrija o problema acima ou remova a reserva do painel para continuar.
                                </span>
                              </span>
                            ) : (
                              <>A disponibilidade do painel será verificada conforme os detalhes da reserva.</>
                            )}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {formData.reservaPainel && (
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setPanelModeloModalOpen(true)}
                  >
                    <Image className="h-4 w-4" />
                    Modelo do Painel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => setPanelOrientacoesModalOpen(true)}
                  >
                    <FileText className="h-4 w-4" />
                    Orientações
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Alguma observação especial sobre sua reserva?"
              {...register('observacoes')}
              maxLength={1000}
            />
            <p className="text-xs text-gray-400">
              {watch('observacoes')?.length || 0}/1000 caracteres
            </p>
            {errors.observacoes && (
              <p className="text-sm text-red-500">{errors.observacoes.message}</p>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={previousStep}>
              Voltar
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={
                !formData.tipoReserva ||
                !dateAvailable ||
                (watchedDate &&
                  watchedLocalDesejado &&
                  (checkingSpotsAvailability || spotsAvailable === false || spotsAvailable === null)) ||
                (formData.tipoReserva === 'aniversario' &&
                  formData.reservaPainel &&
                  panelAvailable === false)
              }
            >
              Próximo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    {/* Modal mapa do local */}
    {mapModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
        onClick={() => setMapModalOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Mapa do local"
      >
        <div
          className="relative max-w-4xl w-full max-h-[90vh] flex flex-col bg-gray-900 rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Mapa do local</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={() => setMapModalOpen(false)}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4 flex justify-center bg-gray-800">
            <img
              src="/assets/local.webp"
              alt="Mapa do local"
              className="max-w-full h-auto rounded-lg object-contain"
            />
          </div>
        </div>
      </div>
    )}

    {/* Modal Modelo do Painel */}
    {panelModeloModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
        onClick={() => setPanelModeloModalOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Modelo do Painel de Aniversário"
      >
        <div
          className="relative max-w-lg w-full max-h-[90vh] flex flex-col bg-gray-900 rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Modelo do Painel</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={() => setPanelModeloModalOpen(false)}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-3 bg-gray-800">
            <img
              src="/assets/painel.webp"
              alt="Modelo do Painel de Aniversário"
              className="max-h-80 w-auto rounded-lg shadow-lg object-contain"
            />
            <p className="text-sm text-gray-300 text-center">
              Este é o modelo do painel de aniversário que será disponibilizado gratuitamente.
            </p>
          </div>
        </div>
      </div>
    )}

    {/* Modal Orientações do Painel */}
    {panelOrientacoesModalOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70"
        onClick={() => setPanelOrientacoesModalOpen(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Orientações do Painel de Aniversário"
      >
        <div
          className="relative max-w-lg w-full max-h-[90vh] flex flex-col bg-gray-900 rounded-xl shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-700">
            <h3 className="text-lg font-semibold text-white">Orientações</h3>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white hover:bg-gray-700"
              onClick={() => setPanelOrientacoesModalOpen(false)}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-4 bg-gray-800 text-sm">
            <div>
              <p className="text-orange-custom-600 font-semibold mb-2">
                🎉 Orientações do Painel de Aniversário
              </p>
              <ul className="space-y-1 text-gray-200 ml-4">
                <li>• Painel gratuito: inclui apenas a estrutura (não acompanha decoração).</li>
                <li>• O painel só pode ser colocado na área externa.</li>
                <li>• Válido para reservas a partir de 10 pessoas.</li>
              </ul>
            </div>
            <div>
              <p className="text-orange-custom-600 font-semibold mb-2">
                ✨ Arco de balões (opcional)
              </p>
              <ul className="space-y-1 text-gray-200 ml-4">
                <li>• R$ 80 com balões inclusos (até 2 cores).</li>
                <li>• R$ 40 caso o cliente traga os balões.</li>
                <li>• Solicitação com mínimo de 2 dias de antecedência e pagamento via Pix.</li>
                <li>• A solicitação deve ser confirmada previamente via WhatsApp.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}