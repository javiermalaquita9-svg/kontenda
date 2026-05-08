import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { FiCheck, FiUploadCloud, FiArrowLeft, FiArrowRight, FiExternalLink, FiSave } from 'react-icons/fi'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useMyBrand } from '../../hooks/useMyBrand'
import { useToast } from '../../context/ToastContext'

const AUDIENCE_OPTIONS = [
  'B2B (Otras empresas)',
  'B2C (Consumidor final)',
  'Jóvenes / Generación Z',
  'Adultos / Millennials',
  'Profesionales / Ejecutivos',
  'Familias / Padres'
]

const PERSONALITY_OPTIONS = [
  'Serio y corporativo',
  'Cercano y amigable',
  'Innovador y disruptivo',
  'Elegante y premium',
  'Divertido y relajado',
  'Inspirador y motivador'
]

const FORMAT_OPTIONS = [
  'Reels/TikTok (9:16)',
  'YouTube (16:9)',
  'Post Cuadrado (1:1)',
  'Story (9:16)',
  'Carrusel (1:1)',
  'Meta Ads (varios)',
  'Diseño Gráfico (varios)',
  'Otro'
]

export default function BrandForm() {
  const { clientId } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const { brand, loading: brandDataLoading } = useMyBrand(clientId)

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    brandName: '',
    elevatorPitch: '',
    targetAudience: '',
    targetAudienceOptions: [],
    brandPersonality: '',
    brandPersonalityOptions: [],
    differentiator: '',
    // Campos del Paso 2
    colorPalette: Array(6).fill(''),
    prohibitedColors: ['', '', ''],
    editingStyle: [],
    editingStyleManual: '',
    // Campos del Paso 3
    requiredFormats: [],
    requiredFormatsManual: '',
    reviewProcessContact: '',
    callToActions: '',
  })

  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleTextChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleColorChange = (index, value) => {
    setFormData(prev => {
      const newPalette = [...prev.colorPalette]
      newPalette[index] = value
      return { ...prev, colorPalette: newPalette }
    })
  }

  const handleCheckboxChange = (field, option) => {
    setFormData(prev => {
      const list = prev[field]
      if (list.includes(option)) {
        return { ...prev, [field]: list.filter(item => item !== option) }
      } else {
        return { ...prev, [field]: [...list, option] }
      }
    })
  }

  const handleProhibitedColorChange = (index, value) => {
    setFormData(prev => {
      const newProhibitedColors = [...prev.prohibitedColors]
      newProhibitedColors[index] = value
      return { ...prev, prohibitedColors: newProhibitedColors }
    })
  }

  const handleNext = () => {
    if (currentStep === 1) {
      const isAudienceValid = formData.targetAudience.trim() !== '' || formData.targetAudienceOptions.length > 0;
      const isPersonalityValid = formData.brandPersonality.trim() !== '' || formData.brandPersonalityOptions.length > 0;

      if (!formData.brandName || !formData.elevatorPitch || !isAudienceValid || !isPersonalityValid || !formData.differentiator) {
        showToast('Por favor, completa todos los campos del Paso 1.', 'warning')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (formData.editingStyle.length === 0 && formData.editingStyleManual.trim() === '') {
        showToast('Por favor, completa los campos del Paso 2.', 'warning')
        return
      }
      setCurrentStep(3)
    }
  }

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleSaveDraft = async () => {
    if (!clientId) return
    setUploading(true)
    try {
      await setDoc(doc(db, 'clients', clientId, 'brandForm', 'latest'), {
        ...formData,
        colorPalette: formData.colorPalette.filter(color => color.trim() !== ''),
        prohibitedColors: formData.prohibitedColors.filter(color => color.trim() !== ''),
        updatedAt: serverTimestamp()
      }, { merge: true })
      showToast('Borrador guardado con éxito.')
    } catch (error) {
      console.error("Error al guardar borrador:", error)
      showToast('Hubo un error al guardar el borrador.', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clientId) {
      showToast('Error de autenticación.', 'error')
      return
    }

    if (currentStep === 3) {
      const isRequiredFormatsValid = formData.requiredFormats.length > 0 || formData.requiredFormatsManual.trim() !== '';

      if (!isRequiredFormatsValid || !formData.reviewProcessContact.trim() || !formData.callToActions.trim()) {
        showToast('Por favor, completa todos los campos del Paso 3.', 'warning')
        return
      }
    } else {
      handleNext()
      return
    }

    setUploading(true)
    try {
      await setDoc(doc(db, 'clients', clientId, 'brandForm', 'latest'), {
        ...formData,
        colorPalette: formData.colorPalette.filter(color => color.trim() !== ''),
        prohibitedColors: formData.prohibitedColors.filter(color => color.trim() !== ''),
        updatedAt: serverTimestamp()
      }, { merge: true })

      setSuccess(true)
      showToast('¡Formulario enviado con éxito!')
      
    } catch (error) {
      console.error("Error en el formulario:", error)
      showToast('Hubo un error al enviar la información.', 'error')
    } finally {
      setUploading(false)
    }
  }

  if (success || brandDataLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheck size={32} />
        </div>
        <h2 className="text-k-text text-2xl font-semibold mb-2">¡Información recibida!</h2>
        <p className="text-k-muted text-sm">Gracias por completar tu información de marca. Nuestro equipo la revisará en breve.</p>
        {brandDataLoading && (
          <div className="flex justify-center py-4">
            <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
          </div>
        )}
        <button onClick={() => navigate('/portal/marca')} className="mt-8 px-5 py-2.5 bg-k-surface2 text-k-text rounded-card text-sm hover:brightness-110 transition-all">
          Volver a Mi Marca
        </button>
      </div>
    )
  }

  const inputClass = "w-full bg-k-surface2 text-k-text text-sm px-4 py-3 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30 placeholder:text-k-muted/40 transition-all"

  return (
    <div className="max-w-2xl">
      <button 
        onClick={() => navigate('/portal/marca')} 
        className="flex items-center gap-2 text-k-muted hover:text-k-text text-sm mb-6 transition-colors w-fit"
      >
        <FiArrowLeft size={16} /> Volver a Mi Marca
      </button>

      <div className="flex items-center gap-2 mb-8">
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${currentStep >= 1 ? 'bg-k-orange' : 'bg-k-surface2'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${currentStep >= 2 ? 'bg-k-orange' : 'bg-k-surface2'}`} />
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${currentStep >= 3 ? 'bg-k-orange' : 'bg-k-surface2'}`} />
      </div>

      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">
          {currentStep === 1 ? 'Paso 1: ADN de Marca' : currentStep === 2 ? 'Paso 2: El Universo Visual' : 'Paso 3: El Flujo de Trabajo'}
        </h1>
        <p className="text-k-muted text-sm mt-1">
          {currentStep === 1 
            ? 'El "Quién" y "Por qué". Completa esta base estratégica para alinear tu contenido.' 
            : currentStep === 2 ? 'Estética y Activos. Recolectamos lo técnico y lo aspiracional.'
            : 'Logística y Formatos. Evita retrasos por temas técnicos y de entrega.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-k-surface rounded-card-lg p-6 sm:p-8 flex flex-col gap-6" style={{ border: '1px solid var(--color-border)' }}>
        
        {currentStep === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-k-text font-medium text-sm mb-2">Nombre de la marca y eslogan</label>
              <input type="text" name="brandName" value={formData.brandName} onChange={handleTextChange} className={inputClass} placeholder="¿Cómo se llama el proyecto y cuál es su frase de batalla?" />
            </div>

            <div>
              <label className="block text-k-text font-medium text-sm mb-2">Elevator Pitch</label>
              <textarea name="elevatorPitch" value={formData.elevatorPitch} onChange={handleTextChange} rows={2} className={`${inputClass} resize-none`} placeholder="En una frase, ¿qué haces y qué problema resuelves?" />
            </div>

            <div>
              <label className="block text-k-text font-medium text-sm mb-3">¿Quién es tu público objetivo?</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {AUDIENCE_OPTIONS.map(opt => {
                  const isSelected = formData.targetAudienceOptions.includes(opt);
                  return (
                    <label key={opt} className={`flex items-center gap-3 text-sm text-k-text cursor-pointer p-3 rounded-card transition-all border ${isSelected ? 'border-k-orange bg-k-orange/10' : 'border-transparent bg-k-surface2 hover:brightness-110'}`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => handleCheckboxChange('targetAudienceOptions', opt)} 
                        className="w-4 h-4 accent-k-orange cursor-pointer" 
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
              <textarea name="targetAudience" value={formData.targetAudience} onChange={handleTextChange} rows={2} className={`${inputClass} resize-none`} placeholder="Más detalles o especificaciones sobre tu audiencia..." />
            </div>

            <div>
              <label className="block text-k-text font-medium text-sm mb-3">Personalidad de Marca</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {PERSONALITY_OPTIONS.map(opt => {
                  const isSelected = formData.brandPersonalityOptions.includes(opt);
                  return (
                    <label key={opt} className={`flex items-center gap-3 text-sm text-k-text cursor-pointer p-3 rounded-card transition-all border ${isSelected ? 'border-k-orange bg-k-orange/10' : 'border-transparent bg-k-surface2 hover:brightness-110'}`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => handleCheckboxChange('brandPersonalityOptions', opt)} 
                        className="w-4 h-4 accent-k-orange cursor-pointer" 
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
              <textarea name="brandPersonality" value={formData.brandPersonality} onChange={handleTextChange} rows={2} className={`${inputClass} resize-none`} placeholder="Describe con tus propias palabras cómo se comunicaría tu marca..." />
            </div>

            <div>
              <label className="block text-k-text font-medium text-sm mb-2">Diferenciador</label>
              <textarea name="differentiator" value={formData.differentiator} onChange={handleTextChange} rows={2} className={`${inputClass} resize-none`} placeholder="¿Por qué un cliente debería elegirte a ti y no a la competencia?" />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-4 pt-4 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
              <button type="button" onClick={handleSaveDraft} disabled={uploading} className="px-6 py-3 rounded-card text-sm font-medium text-k-muted hover:text-k-text hover:bg-k-surface2 transition-all flex items-center justify-center gap-2">
                <FiSave size={16} /> Guardar borrador
              </button>
              <button type="button" onClick={handleNext} className="px-6 py-3 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-all flex items-center justify-center gap-2">
                Siguiente Paso <FiArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col gap-6">
            <div className="pb-6 border-b border-k-border" style={{ borderColor: 'var(--color-border)' }}>
              <label className="block text-k-text font-medium text-sm mb-2">Estado de la Identidad</label>
              <p className="text-k-muted text-xs mb-4">¿Cuentas con un Manual de Marca o Logo en alta resolución? Súbelos a la carpeta de Drive que te ofrecemos.</p>
              {brand?.logoDriveLink ? (
                <a
                  href={brand.logoDriveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-k-text bg-k-surface2 hover:bg-k-surface2/80 px-4 py-2 rounded-card transition-colors w-fit"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <FiExternalLink size={14} /> Abrir carpeta Drive
                </a>
              ) : (
                <p className="text-k-muted text-xs italic">No hay una carpeta de Drive asignada para tu identidad. Contáctanos.</p>
              )}
            </div>

            <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
              <label className="block text-k-text font-medium text-sm mb-2">Paleta de Colores</label>
              <p className="text-k-muted text-xs mb-4">Ingresa los códigos de color de tu marca (HEX, RGB, etc.) o usa el selector. Puedes definir hasta 6 colores.</p>
              
              {formData.colorPalette.some(c => c.trim() !== '') && (
                <div className="flex w-full h-8 rounded-card overflow-hidden mb-4 border border-k-border">
                  {formData.colorPalette
                    .filter(color => color.trim() !== '')
                    .map((color, index, filteredArr) => (
                      <div
                        key={index}
                        style={{
                          backgroundColor: color, flex: 1,
                          borderRight: index < filteredArr.length - 1 ? '1px solid var(--color-border)' : 'none'
                        }}
                        title={color}
                      ></div>
                    )
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.colorPalette.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color || '#000000'}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className="w-10 h-10 rounded-card border-none p-0 overflow-hidden cursor-pointer bg-transparent"
                      style={{ backgroundColor: color || 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handleColorChange(index, e.target.value)}
                      className={`${inputClass} flex-1`}
                      placeholder={`Color ${index + 1} ${index === 0 ? '(Dominante)' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
              <label className="block text-k-text font-medium text-sm mb-2">Colores Prohibidos (Opcional)</label>
              <p className="text-k-muted text-xs mb-4">¿Hay colores que tu marca NO debe usar? Define hasta 3.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {formData.prohibitedColors.map((color, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={color || '#000000'}
                      onChange={(e) => handleProhibitedColorChange(index, e.target.value)}
                      className="w-10 h-10 rounded-card border-none p-0 overflow-hidden cursor-pointer bg-transparent"
                      style={{ backgroundColor: color || 'var(--color-surface2)', border: '1px solid var(--color-border)' }}
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => handleProhibitedColorChange(index, e.target.value)}
                      className={`${inputClass} flex-1`}
                      placeholder={`Prohibido ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-k-text font-medium text-sm mb-2">Referencias Visuales (Moodboard)</label>
              <p className="text-k-muted text-xs mb-4">Sube tus imágenes a la carpeta de Drive que te ofrecemos.</p>
              
              {brand?.referencesDriveLink ? (
                <a
                  href={brand.referencesDriveLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-k-text bg-k-surface2 hover:bg-k-surface2/80 px-4 py-2 rounded-card transition-colors"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <FiExternalLink size={14} /> Abrir carpeta Drive
                </a>
              ) : (
                <p className="text-k-muted text-xs italic">No hay una carpeta de Drive asignada para tus referencias visuales. Contáctanos.</p>
              )}
            </div>

            <div>
              <label className="block text-k-text font-medium text-sm mb-3">Estilo de Edición</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button type="button" onClick={() => handleCheckboxChange('editingStyle', 'dinamico')}
                  className={`p-5 rounded-card text-left transition-all border-2 ${formData.editingStyle.includes('dinamico') ? 'border-k-orange bg-k-orange/10' : 'border-transparent bg-k-surface2 hover:brightness-110'}`}>
                  <span className="block font-semibold text-k-text text-sm mb-1">Dinámico (Estilo TikTok)</span>
                  <span className="block text-k-muted text-xs leading-relaxed">Cortes rápidos, muchos efectos, subtítulos grandes y alta retención de atención.</span>
                </button>

                <button type="button" onClick={() => handleCheckboxChange('editingStyle', 'cinematografico')}
                  className={`p-5 rounded-card text-left transition-all border-2 ${formData.editingStyle.includes('cinematografico') ? 'border-k-orange bg-k-orange/10' : 'border-transparent bg-k-surface2 hover:brightness-110'}`}>
                  <span className="block font-semibold text-k-text text-sm mb-1">Minimalista / Cinematográfico</span>
                  <span className="block text-k-muted text-xs leading-relaxed">Transiciones suaves, estética elegante, colores cuidados y un ritmo más pausado.</span>
                </button>

                <button type="button" onClick={() => handleCheckboxChange('editingStyle', 'documental')}
                  className={`p-5 rounded-card text-left transition-all border-2 ${formData.editingStyle.includes('documental') ? 'border-k-orange bg-k-orange/10' : 'border-transparent bg-k-surface2 hover:brightness-110'}`}>
                  <span className="block font-semibold text-k-text text-sm mb-1">Documental / Educativo</span>
                  <span className="block text-k-muted text-xs leading-relaxed">Enfoque en la información, claridad, gráficos explicativos y ritmo constante.</span>
                </button>

                <button type="button" onClick={() => handleCheckboxChange('editingStyle', 'humoristico')}
                  className={`p-5 rounded-card text-left transition-all border-2 ${formData.editingStyle.includes('humoristico') ? 'border-k-orange bg-k-orange/10' : 'border-transparent bg-k-surface2 hover:brightness-110'}`}>
                  <span className="block font-semibold text-k-text text-sm mb-1">Humorístico / Entretenido</span>
                  <span className="block text-k-muted text-xs leading-relaxed">Edición ágil, uso de memes, sonidos divertidos y un tono ligero.</span>
                </button>
              </div>
              <textarea name="editingStyleManual" value={formData.editingStyleManual} onChange={handleTextChange} rows={2} className={`${inputClass} resize-none mt-4`} placeholder="Describe con tus propias palabras el estilo de edición que buscas o añade más detalles..." />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-4 pt-4 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
              <button type="button" onClick={handlePrev} className="px-6 py-3 rounded-card text-sm font-medium text-k-muted hover:text-k-text hover:bg-k-surface2 transition-all flex items-center justify-center gap-2">
                <FiArrowLeft size={16} /> Paso Anterior
              </button>
              <div className="flex flex-col-reverse sm:flex-row gap-4">
                <button type="button" onClick={handleSaveDraft} disabled={uploading} className="px-6 py-3 rounded-card text-sm font-medium text-k-muted hover:text-k-text hover:bg-k-surface2 transition-all flex items-center justify-center gap-2">
                  <FiSave size={16} /> Guardar borrador
                </button>
                <button type="button" onClick={handleNext} className="px-6 py-3 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-all flex items-center justify-center gap-2">
                  Siguiente Paso <FiArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col gap-6">
            <div>
              <label className="block text-k-text font-medium text-sm mb-2">Formatos Requeridos</label>
              <p className="text-k-muted text-xs mb-3">¿Dónde se publicará el contenido principalmente? (Selecciona uno o varios)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                {FORMAT_OPTIONS.map(opt => {
                  const isSelected = formData.requiredFormats.includes(opt);
                  return (
                    <label key={opt} className={`flex items-center gap-3 text-sm text-k-text cursor-pointer p-3 rounded-card transition-all border ${isSelected ? 'border-k-orange bg-k-orange/10' : 'border-transparent bg-k-surface2 hover:brightness-110'}`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => handleCheckboxChange('requiredFormats', opt)} 
                        className="w-4 h-4 accent-k-orange cursor-pointer" 
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
              <textarea name="requiredFormatsManual" value={formData.requiredFormatsManual} onChange={handleTextChange} rows={2} className={`${inputClass} resize-none`} placeholder="Describe otros formatos o añade más detalles..." />
            </div>

            <div>
              <label className="block text-k-text font-medium text-sm mb-2">Proceso de Revisión</label>
              <input type="text" name="reviewProcessContact" value={formData.reviewProcessContact} onChange={handleTextChange} className={inputClass} placeholder="¿Quién es la persona encargada de dar el visto bueno final a los diseños?" required />
            </div>

            <div>
              <label className="block text-k-text font-medium text-sm mb-2">Llamados a la Acción (CTA)</label>
              <textarea name="callToActions" value={formData.callToActions} onChange={handleTextChange} rows={3} className={`${inputClass} resize-none`} placeholder='¿Cuáles son las frases que siempre deben aparecer al final? (Ej: "Link en la bio", "Escríbenos al DM", "Visita nuestra web")' required />
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-4 pt-4 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
              <button type="button" onClick={handlePrev} className="px-6 py-3 rounded-card text-sm font-medium text-k-muted hover:text-k-text hover:bg-k-surface2 transition-all flex items-center justify-center gap-2">
                <FiArrowLeft size={16} /> Paso Anterior
              </button>
              <div className="flex flex-col-reverse sm:flex-row gap-4">
                <button type="button" onClick={handleSaveDraft} disabled={uploading} className="px-6 py-3 rounded-card text-sm font-medium text-k-muted hover:text-k-text hover:bg-k-surface2 transition-all flex items-center justify-center gap-2">
                  <FiSave size={16} /> Guardar borrador
                </button>
                <button type="submit" disabled={uploading} className="px-6 py-3 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {uploading ? 'Guardando...' : <><FiUploadCloud size={16} /> Enviar Formulario</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
