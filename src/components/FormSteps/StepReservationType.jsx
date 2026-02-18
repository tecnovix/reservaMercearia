import React, { useState, useRef } from 'react'
import useReservationStore from '../../store/reservationStore'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { reservationTypes, fileToBase64, compressImage } from '../../lib/utils'
import { Upload, X, Cake, PartyPopper, Heart, Check, Image } from 'lucide-react'

export function StepReservationType() {
  const {
    formData,
    updateFormData,
    nextStep,
    previousStep,
    setFotoPainel,
    clearFotoPainel,
  } = useReservationStore()

  const [imagePreview, setImagePreview] = useState(formData.fotoPainelPreview)
  const [imageError, setImageError] = useState('')
  const fileInputRef = useRef(null)

  const handleTypeChange = (type) => {
    updateFormData({
      tipoReserva: type,
      // Reset conditional fields when changing type
      reservaPainel: false,
      fotoPainel: null,
      fotoPainelPreview: null,
      orientacoesPainel: '',
      tipoCardapio: '',
      orientacoesCompra: '',
    })
    setImagePreview(null)
    setImageError('')
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageError('')

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      setImageError('Por favor, envie apenas imagens JPG ou PNG')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setImageError('A imagem deve ter no máximo 5MB')
      return
    }

    try {
      // Compress if needed
      const processedFile = await compressImage(file, 2)

      // Convert to base64
      const base64 = await fileToBase64(processedFile)

      // Create preview
      const preview = URL.createObjectURL(processedFile)
      setImagePreview(preview)
      setFotoPainel(base64, preview)
    } catch (error) {
      setImageError('Erro ao processar imagem. Tente novamente.')
      console.error('Error processing image:', error)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    clearFotoPainel()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate conditional fields (Aniversário e Despedida de Solteiro com painel)
    const tipoComPainel = formData.tipoReserva === 'aniversario' || formData.tipoReserva === 'despedida_solteiro'
    if (tipoComPainel && formData.reservaPainel) {
      if (!formData.fotoPainel) {
        setImageError('Por favor, envie uma foto para o painel')
        return
      }
      if (!formData.orientacoesPainel) {
        return
      }
    }

    nextStep()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Tipo de Reserva</CardTitle>
        <CardDescription>
          Selecione o tipo de reserva que deseja fazer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label>Tipo de Reserva *</Label>
            <div className="grid grid-cols-1 gap-3">
              {reservationTypes.map((type) => {
                const isSelected = formData.tipoReserva === type.value
                const icons = {
                  aniversario: Cake,
                  despedida_solteiro: PartyPopper,
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

          {/* Conditional fields for Aniversário e Despedida de Solteiro (painel) */}
          {(formData.tipoReserva === 'aniversario' || formData.tipoReserva === 'despedida_solteiro') && (
            <div className="space-y-4 p-4 border border-custom rounded-lg bg-gray-800">
              <div className={`
                relative p-6 rounded-xl border-2 transition-all duration-300 overflow-hidden
                ${formData.reservaPainel
                  ? 'border-orange-custom-600 bg-gradient-to-br from-orange-custom-600/30 to-orange-custom-600/10 shadow-2xl shadow-orange-custom-600/30'
                  : 'border-yellow-500/60 bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20'
                }
              `}>
                {/* Background glow effect when selected */}
                {formData.reservaPainel && (
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
                            font-bold text-xl mb-1 transition-colors duration-200
                            ${formData.reservaPainel ? 'text-white' : 'text-yellow-200'}
                          `}>
                            {formData.tipoReserva === 'aniversario' ? 'Painel de Aniversário' : 'Painel de Despedida de Solteiro'}
                          </h3>
                          <p className={`
                            text-sm font-medium transition-colors duration-200
                            ${formData.reservaPainel 
                              ? 'text-green-300' 
                              : 'text-yellow-300/80'
                            }
                          `}>
                            {formData.reservaPainel 
                              ? '✓ Opção selecionada - Clique para desmarcar' 
                              : '⚠ Clique para selecionar'
                            }
                          </p>
                        </div>
                        {/* Large toggle switch */}
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
                        {formData.reservaPainel ? (
                          <>A disponibilidade do painel será verificada ao preencher os detalhes da reserva.</>
                        ) : (
                          <>Você precisa marcar esta opção se deseja reservar o painel.</>
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {formData.reservaPainel && (
                <>
                  <div className="space-y-2">
                    <Label>Foto para o Painel *</Label>
                    <div className="border-2 border-dashed rounded-lg p-4">
                      {!imagePreview ? (
                        <div
                          className="flex flex-col items-center justify-center cursor-pointer"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-10 w-10 text-gray-400 mb-2" />
                          <p className="text-sm text-gray-300">
                            Clique para enviar uma foto
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            JPG ou PNG, máx. 5MB
                          </p>
                        </div>
                      ) : (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-48 mx-auto rounded"
                          />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </div>
                    {imageError && (
                      <p className="text-sm text-red-500">{imageError}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orientacoesPainel">
                      Orientações sobre o Painel *
                    </Label>
                    <Textarea
                      id="orientacoesPainel"
                      placeholder="Ex: Nome a ser escrito, mensagem especial, etc."
                      value={formData.orientacoesPainel}
                      onChange={(e) =>
                        updateFormData({ orientacoesPainel: e.target.value })
                      }
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-400">
                      {formData.orientacoesPainel.length}/500 caracteres
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={previousStep}>
              Voltar
            </Button>
            <Button type="submit" size="lg">
              Próximo
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}