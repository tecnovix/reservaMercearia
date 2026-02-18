import React, { useState } from 'react'
import useReservationStore from '../../store/reservationStore'
import { useN8N } from '../../hooks/useN8N'
import {
  formatDateBR,
  getReservationTypeLabel,
  getLocationLabel,
} from '../../lib/utils'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export function StepSummary() {
  const {
    formData,
    previousStep,
    getSubmissionData,
    clearFormData,
    submitSuccess,
    submitError,
    submitting,
  } = useReservationStore()

  const { submitReservation } = useN8N()
  const [localSubmitError, setLocalSubmitError] = useState(null)

  const handleSubmit = async () => {
    setLocalSubmitError(null)

    try {
      const submissionData = getSubmissionData()
      const result = await submitReservation(submissionData)

      if (result.success) {
        // Clear form data after successful submission
        setTimeout(() => {
          clearFormData()
        }, 3000)
      }
    } catch (error) {
      setLocalSubmitError(error.message || 'Não foi possível enviar sua reserva. Tente novamente.')
    }
  }

  if (submitSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h2 className="text-2xl font-bold text-center text-white">
              Reserva Enviada com Sucesso!
            </h2>
            <p className="text-center text-gray-300">
              Sua reserva foi recebida e você receberá uma confirmação por e-mail.
            </p>
            <Button
              onClick={() => clearFormData()}
              className="mt-4"
            >
              Fazer Nova Reserva
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const displayError = localSubmitError || submitError

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Resumo da Reserva</CardTitle>
        <CardDescription>
          Revise os detalhes da sua reserva antes de enviar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Data Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-white">Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
            <div>
              <span className="text-sm text-gray-300">Nome:</span>
              <p className="font-medium text-white">{formData.nome}</p>
            </div>
            <div>
              <span className="text-sm text-gray-300">E-mail:</span>
              <p className="font-medium text-white">{formData.email}</p>
            </div>
            <div>
              <span className="text-sm text-gray-300">Telefone:</span>
              <p className="font-medium text-white">{formData.telefone}</p>
            </div>
            <div>
              <span className="text-sm text-gray-300">Data de Nascimento:</span>
              <p className="font-medium text-white">{formatDateBR(formData.dataNascimento)}</p>
            </div>
          </div>
        </div>

        {/* Reservation Type Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-white">Tipo de Reserva</h3>
          <div className="pl-4 space-y-2">
            <div>
              <span className="text-sm text-gray-300">Tipo:</span>
              <p className="font-medium text-white">
                {getReservationTypeLabel(formData.tipoReserva)}
              </p>
            </div>

            {((formData.tipoReserva === 'aniversario' || formData.tipoReserva === 'despedida_solteiro') && formData.reservaPainel) && (
              <>
                <div>
                  <Badge variant="secondary">
                    {formData.tipoReserva === 'aniversario' ? 'Painel de Aniversário Reservado' : 'Painel de Despedida de Solteiro Reservado'}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reservation Details Section */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg text-white">Detalhes da Reserva</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-4">
            <div>
              <span className="text-sm text-gray-300">Data:</span>
              <p className="font-medium text-white">{formatDateBR(formData.dataReserva)}</p>
            </div>
            <div>
              <span className="text-sm text-gray-300">Horário:</span>
              <p className="font-medium text-white">{formData.horarioDesejado}</p>
            </div>
            <div>
              <span className="text-sm text-gray-300">Quantidade de Pessoas:</span>
              <p className="font-medium text-white">{formData.quantidadePessoas}</p>
            </div>
            <div>
              <span className="text-sm text-gray-300">Local:</span>
              <p className="font-medium text-white">
                {getLocationLabel(formData.localDesejado)}
              </p>
            </div>
          </div>
          {formData.observacoes && (
            <div className="pl-4">
              <span className="text-sm text-gray-300">Observações:</span>
              <p className="font-medium text-white">{formData.observacoes}</p>
            </div>
          )}
        </div>

        {/* Error message */}
        {displayError && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">
                Não foi possível enviar sua reserva
              </p>
              <p className="text-sm text-red-600 mt-1">{displayError}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={previousStep}
            disabled={submitting}
          >
            Voltar
          </Button>
          <Button
            onClick={handleSubmit}
            size="lg"
            disabled={submitting}
            className="min-w-[120px]"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              'Confirmar Reserva'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}