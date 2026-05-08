import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { FiCheck, FiUploadCloud, FiArrowLeft, FiArrowRight, FiSave, FiX } from 'react-icons/fi'
import { db } from '../../firebase/config'
import { useAuth } from '../../hooks/useAuth'
import { useMyBrand } from '../../hooks/useMyBrand'
import { useMyPlan } from '../../hooks/useMyPlan'
import { useToast } from '../../context/ToastContext'

const BRAND_VALUES = ['Transparencia', 'Innovación', 'Cercanía', 'Calidad', 'Velocidad', 'Confianza', 'Creatividad', 'Sostenibilidad', 'Honestidad', 'Impacto', 'Accesibilidad', 'Excelencia'];
const PROBLEM_CATEGORIES = ['⏱️ Pérdida de tiempo', '💸 Costos demasiado altos', '😵 Demasiada complejidad', '🚪 Falta de acceso o información', '😟 Resultados poco confiables', '🤝 Mal servicio o atención', '📦 Otro'];
const TONE_POSITIVE = ['Cercano', 'Inspirador', 'Directo', 'Energético', 'Sofisticado', 'Técnico', 'Divertido', 'Empático', 'Atrevido', 'Confiable'];
const TONE_NEGATIVE = ['Frío', 'Aburrido', 'Corporativo', 'Agresivo', 'Distante', 'Superficial'];
const MOTIVATION_CATEGORIES = ['🚀 Estoy lanzando algo nuevo', '📉 Siento que mi marca no me representa', '👀 Mi competencia se ve mejor que yo', '📱 Quiero crecer en redes sociales', '🔄 Es momento de renovar la imagen', '💡 Tuve una idea y quiero materializarla', '🤝 Conseguí un cliente importante y necesito estar a la altura', '✏️ Otro'];
const ASSETS_CHECKLIST = ['Tengo logotipo en alta resolución', 'Tengo manual de marca o brandbook', 'Tengo paleta de colores definida', 'Tengo tipografías corporativas'];
const VISUAL_CONCEPTS_GRID = ['🤍 Minimalista', '⚡ Enérgico', '🌿 Orgánico y natural', '🔩 Industrial', '🕰️ Vintage', '🚀 Futurista', '🎨 Colorido y expresivo', '🖤 Oscuro y elegante', '🌸 Suave y femenino', '📐 Geométrico', '🤖 Tecnológico', '✨ Lujoso'];
const RECURRENT_ELEMENTS_CHIPS = ['🌈 Degradados o gradientes', '📷 Fotografía real (no stock)', '🖼️ Ilustraciones o dibujos', '🔲 Formas geométricas', '🌫️ Texturas o ruido digital', '✏️ Tipografía como elemento visual', '🎞️ Marcos o bordes decorativos', '📌 Íconos lineales', '🎭 Máscaras o recortes creativos'];
const OCCUPATIONS_Q17 = ['Emprendedor/a', 'Profesional independiente', 'Empleado en empresa', 'Dueño de negocio', 'Estudiante', 'Directivo o ejecutivo', 'Otro'];
const FRUSTRATIONS_Q18 = ['No encontrar soluciones confiables', 'Pagar mucho y recibir poco', 'Perder tiempo buscando opciones', 'No entender los términos técnicos', 'Que no le respondan rápido', 'Sentir que nadie lo entiende de verdad', 'No tener claridad sobre qué necesita', 'Malas experiencias anteriores'];
const SOCIAL_PLATFORMS_Q19 = ['Instagram', 'TikTok', 'YouTube', 'LinkedIn', 'Facebook', 'X (Twitter)', 'Pinterest', 'WhatsApp'];
const CONTENT_TYPES_Q19 = ['🎓 Educativo / tutoriales', '😂 Humor y memes', '💡 Inspiracional', '📰 Noticias y actualidad', '🛍️ Reviews y recomendaciones', '🎭 Entretenimiento', '🌿 Lifestyle', '💼 Contenido de negocios'];
const BARRIERS_Q20 = ['💰 "Es muy caro para lo que ofrece"', '🤷 "No sé si realmente me va a funcionar"', '⏳ "No tengo tiempo de implementarlo ahora"', '🔍 "Prefiero investigar más antes de decidir"', '😬 "Tuve una mala experiencia con algo similar"', '👥 "Necesito consultarlo con alguien más"', '✏️ Otra barrera'];
const FEELINGS_Q21 = ['💪 Empoderado', '😌 Tranquilo', '🌟 Inspirado', '🎯 Enfocado', '🤝 Acompañado', '🚀 Listo para crecer', '😎 Seguro de sí mismo', '🧠 Más inteligente', '✨ Orgulloso', '🏆 Exitoso', '🌈 Esperanzado', '🔓 Libre'];
const INTERESTS_TECH = ['IA', 'Startups', 'Marketing digital', 'E-commerce', 'Finanzas personales'];
const INTERESTS_LIFESTYLE = ['Viajes', 'Gastronomía', 'Fitness', 'Bienestar mental', 'Moda'];
const INTERESTS_CULTURE = ['Sostenibilidad', 'Arte', 'Música', 'Cine', 'Deportes', 'Educación'];
const TRIGGERS_Q24 = ['🌅 Al comenzar su jornada laboral', '📱 Mientras navega redes sociales', '😤 Después de una mala experiencia con otro proveedor', '🔎 Cuando está buscando activamente una solución', '💬 Después de una recomendación de alguien cercano', '📈 Cuando siente que su negocio necesita crecer', '🗓️ En un momento de planificación o cambio', '✏️ Otro momento'];
const PLATFORMS_Q25 = ['📸 Instagram Feed', '🎬 Instagram Reels', '📖 Instagram Stories', '🎵 TikTok', '▶️ YouTube', '💼 LinkedIn', '👥 Facebook', '📌 Pinterest', '🌐 Sitio web', '✉️ Email marketing'];
const FORMATS_Q26 = [{key: '9:16', icon: '📱', title: '9:16 Vertical', desc: 'Stories, Reels, TikTok'}, {key: '16:9', icon: '🖥️', title: '16:9 Horizontal', desc: 'YouTube, presentaciones'}, {key: '1:1', icon: '⬜', title: '1:1 Cuadrado', desc: 'Feed de Instagram y LinkedIn'}, {key: '4:5', icon: '📄', title: '4:5 Retrato', desc: 'Feed Instagram optimizado'}, {key: 'static', icon: '🖼️', title: 'Diseño estático', desc: 'posts, flyers, banners'}];
const SOURCES_Q28 = ['☁️ Google Drive', '📦 Dropbox', '🌐 WeTransfer', '📋 Notion', '💬 WhatsApp (para proyectos pequeños)', '🖥️ Servidor o FTP propio', '✏️ Otra plataforma'];
const CTAS_Q29 = ['"Haz clic en el link de la bio"', '"Escríbeme al DM"', '"Comenta con la palabra X"', '"Comparte con alguien que lo necesite"', '"Guarda este post para no olvidarlo"', '"Visita nuestro sitio web"', '"Suscríbete al canal"', '"Agenda una llamada gratuita"'];
const LEGAL_ELEMENTS_Q30 = ['Logo de partner', 'Marca de agua', 'Disclaimer legal', 'Hashtag obligatorio', 'Otro'];
const REVIEW_TIMES_Q31 = ['⚡ Menos de 24 horas', '🕐 Entre 24 y 48 horas', '🕑 Entre 48 y 72 horas', '📅 Más de 72 horas', '💬 Lo coordinamos caso a caso'];
const KPIS_Q32 = ['💰 Aumento en ventas o consultas', '👥 Crecimiento de seguidores', '❤️ Likes y reacciones', '💬 Comentarios y conversaciones', '🔄 Shares y guardados', '👁️ Alcance e impresiones', '🔗 Clics al sitio web o link', '✨ Que se vea profesional y coherente'];

// Legacy constants for large form
const CORP_VALUES = ['Innovación', 'Integridad', 'Excelencia', 'Sostenibilidad', 'Confianza', 'Liderazgo', 'Responsabilidad', 'Transparencia', 'Impacto social', 'Agilidad', 'Colaboración', 'Orientación al cliente', 'Eficiencia', 'Diversidad', 'Seguridad', 'Calidad'];
const CORP_PROBLEMS = ['⚙️ Ineficiencia operativa', '💸 Costos difíciles de controlar', '📊 Falta de visibilidad o datos', '🤝 Problemas de integración entre áreas o sistemas', '🌍 Dificultad para escalar o expandirse', '🔒 Riesgos de seguridad o cumplimiento normativo', '👥 Gestión de talento o cultura organizacional', '🧩 Experiencia del cliente deficiente', '✏️ Otro'];
const CORP_IMPACTS = ['Reduce costos', 'Ahorra tiempo', 'Aumenta ingresos', 'Mejora la experiencia del cliente', 'Reduce riesgos', 'Facilita la toma de decisiones'];
const CORP_TONE_POSITIVE = ['Confiable', 'Innovador', 'Técnico', 'Cercano', 'Inspirador', 'Directo', 'Sofisticado', 'Colaborativo', 'Visionario', 'Empático', 'Sólido', 'Ágil'];
const CORP_TONE_NEGATIVE = ['Frío', 'Distante', 'Arrogante', 'Complejo', 'Genérico', 'Conservador en exceso', 'Informal en exceso'];
const CORP_GOAL_TYPES = ['Posicionamiento', 'Facturación', 'Expansión geográfica', 'Lanzamiento de producto', 'Comunidad y marca', 'Reconocimiento del sector'];
const CORP_MOTIVATIONS = ['🚀 Lanzamiento de nuevo producto o servicio', '🔄 Proceso de rebranding o actualización de imagen', '📈 Etapa de crecimiento o expansión', '🤝 Apertura a nuevos mercados o segmentos', '👥 Cambio en el equipo directivo o estrategia corporativa', '💼 Necesidad de atraer inversión o socios estratégicos', '📉 Percepción de marca que no refleja el nivel actual de la empresa', '🏆 Presión competitiva del mercado', '✏️ Otro contexto'];
const CORP_ASSETS = ['Logotipo en versiones (principal, secundario, isotipo)', 'Manual de marca o brandbook', 'Paleta de colores corporativa con códigos HEX/CMYK/Pantone', 'Tipografías corporativas con licencias', 'Librería de fotografía o banco de imágenes propio', 'Guía de tono de voz y comunicación', 'Plantillas de presentación o documentos corporativos'];
const CORP_CONCEPTS_AESTHETIC = ['🤍 Minimalismo corporativo', '⚡ Dinámico y de alto impacto', '🔩 Industrial y técnico', '🚀 Futurista y tecnológico', '🖤 Sobrio y elegante', '📐 Geométrico y estructurado', '✨ Premium y lujoso'];
const CORP_CONCEPTS_CHARACTER = ['🌿 Humano y cercano', '🌍 Responsable y sostenible', '🎨 Creativo y expresivo', '🤝 Colaborativo y abierto', '🔬 Científico y preciso', '📊 Data-driven y analítico', '🏛️ Tradicional y sólido'];
const CORP_REF_PLATFORMS = ['Instagram', 'YouTube', 'LinkedIn', 'TikTok', 'Vimeo', 'Behance', 'Sitio web', 'Otro'];
const CORP_REF_ASPIRATIONS = ['Queremos algo muy similar', 'Es una referencia de estilo', 'Solo un elemento puntual nos inspira'];
const CORP_TYPO_DIRECTIONS = ['Más moderno', 'Más legible', 'Más premium', 'Más cercano'];
const CORP_ELEMENTS = ['🌈 Degradados o gradientes corporativos', '📷 Fotografía institucional propia', '🖼️ Ilustraciones o íconos personalizados', '🔲 Formas geométricas o patrones', '🌫️ Texturas o fondos con ruido', '✏️ Tipografía como elemento visual principal', '📌 Librería de íconos definida', '🎞️ Marcos, bordes o estructuras de layout', '🎭 Recursos de motion graphics o animación', '🏷️ Sistema de etiquetas o badges corporativos'];
const CORP_RISK_CHANNELS = ['Todos los canales por igual', 'Solo redes sociales', 'Solo comunicación interna', 'Varía según el canal'];
const CORP_Q17_AGES = ['18-24', '25-34', '35-44', '45-54', '55+', 'Varía según segmento'];
const CORP_Q17_SIZES = ['Persona natural', 'Microempresa (1-10)', 'Pequeña (11-50)', 'Mediana (51-200)', 'Grande (200+)', 'Todos los segmentos'];
const CORP_Q17_DECISIONS = ['Usuario final', 'Tomador de decisión (B2B)', 'Ambos perfiles', 'Depende del producto/servicio'];
const CORP_Q18_PAINS = ['Pérdida de tiempo en procesos manuales o ineficientes', 'Costos operativos difíciles de justificar', 'Falta de visibilidad o información en tiempo real', 'Dificultad para escalar sin aumentar costos', 'Mala integración entre herramientas o áreas', 'Riesgo de incumplimiento normativo o legal', 'Dificultad para retener o atraer talento', 'Experiencia del cliente final deficiente', 'Competencia que avanza más rápido', 'Falta de datos confiables para tomar decisiones'];
const CORP_Q19_PLATFORMS = ['LinkedIn', 'YouTube', 'Instagram', 'Twitter/X', 'Facebook', 'TikTok', 'Podcasts', 'Newsletters', 'Blogs especializados', 'Foros o comunidades', 'WhatsApp Business'];
const CORP_Q19_CONTENT = ['📊 Cases de éxito y resultados', '🎓 Contenido educativo y formativo', '📰 Tendencias e industria', '🎙️ Entrevistas a referentes', '📈 Datos, estudios e informes', '🎬 Demostraciones de producto', '💡 Opinión y thought leadership', '🤝 Contenido de comunidad y networking', '🛍️ Reviews y comparativas'];
const CORP_Q19_TIME = ['Durante la jornada laboral', 'Fuera del horario de trabajo', 'Ambos por igual'];
const CORP_Q20_BARRIERS = ['💰 Percepción de precio elevado versus el valor percibido', '🤷 Incertidumbre sobre el retorno de inversión (ROI)', '⏳ Ciclos de decisión largos con múltiples aprobadores', '🔍 Necesidad de más información o prueba de concepto', '😬 Experiencias negativas previas con soluciones similares', '🔗 Complejidad de integración con sistemas existentes', '👥 Resistencia interna al cambio dentro de la organización', '📋 Requisitos de cumplimiento normativo que frenan la adopción', '✏️ Otra barrera'];
const CORP_Q21_CARDS = ['Reducir costos operativos', 'Aumentar productividad del equipo', 'Tomar mejores decisiones con datos', 'Escalar sin fricciones', 'Cumplir normativas con tranquilidad', 'Diferenciarse de la competencia', 'Ser reconocido como líder en su sector', 'Atraer y retener mejor talento', 'Mejorar la experiencia de sus propios clientes', 'Reducir riesgos del negocio', 'Tener procesos más predecibles', 'Innovar antes que la competencia', 'Ganar confianza de inversionistas', 'Fortalecer la cultura interna', 'Crecer con mayor certeza'];
const CORP_Q22_INTERESTS = [
  { cat: 'Negocios y liderazgo', items: ['Innovación empresarial', 'Transformación digital', 'Finanzas y economía', 'Estrategia corporativa', 'Emprendimiento', 'Gestión de equipos'] },
  { cat: 'Tecnología', items: ['Inteligencia Artificial', 'Automatización', 'Ciberseguridad', 'Data & Analytics', 'SaaS y tecnología empresarial'] },
  { cat: 'Tendencias globales', items: ['Sostenibilidad y ESG', 'Diversidad e inclusión', 'Geopolítica y economía global', 'Futuro del trabajo'] },
  { cat: 'Desarrollo personal', items: ['Liderazgo personal', 'Productividad', 'Bienestar ejecutivo', 'Networking y comunidad'] }
];
const CORP_Q24_STAGES = ['😴 Inconsciente', '🤔 Consciente del problema', '🔍 En búsqueda activa', '⚖️ Evaluando alternativas', '🤝 Listo para decidir', '🔄 Cliente activo'];
const CORP_Q25_PLATFORMS = ['💼 LinkedIn (orgánico)', '💼 LinkedIn (ads)', '📸 Instagram Feed', '🎬 Instagram Reels', '📖 Instagram Stories', '▶️ YouTube (orgánico)', '▶️ YouTube (ads)', '🎵 TikTok', '👥 Facebook', '🌐 Sitio web corporativo', '✉️ Email marketing', '📱 App propia', '📊 Presentaciones internas'];
const CORP_Q25_ROLES = ['Canal principal', 'Canal secundario', 'Canal en desarrollo'];
const CORP_Q26_FORMATS = [{title: '9:16 Vertical', icon: '📱', desc: 'Stories, Reels, TikTok'}, {title: '16:9 Horizontal', icon: '🖥️', desc: 'YouTube, webinars, presentaciones'}, {title: '1:1 Cuadrado', icon: '⬜', desc: 'Feed de LinkedIn e Instagram'}, {title: '4:5 Retrato', icon: '📄', desc: 'Feed de Instagram optimizado'}, {title: 'Banner web', icon: '📰', desc: 'sitio corporativo y landing pages'}, {title: 'Diseño estático editorial', icon: '🖼️', desc: 'posts, infografías, reportes'}, {title: 'Motion graphics / animación', icon: '🎞️', desc: 'piezas animadas sin cámara'}, {title: 'Video institucional', icon: '🎬', desc: 'formato largo, alta producción'}, {title: 'Deck o presentación', icon: '📊', desc: 'formato de diapositivas'}];
const CORP_Q27_VARIATIONS = ['Sí, varía significativamente', 'Sí, varía levemente', 'No, es constante todo el año'];
const CORP_Q28_SOURCES = ['☁️ Google Drive', '📦 Dropbox Business', '🖥️ SharePoint / OneDrive corporativo', '📋 Notion', '🌐 Servidor FTP o almacenamiento propio', '🔗 Frame.io (para revisión de video)', '📁 Wetransfer Pro', '✏️ Otra plataforma'];
const CORP_Q29_CTAS = ['"Visita nuestro sitio web"', '"Solicita una demo"', '"Descarga el informe / recurso"', '"Agenda una reunión con nuestro equipo"', '"Contáctanos por este canal"', '"Conoce más sobre este producto o servicio"', '"Suscríbete a nuestro newsletter"', '"Únete a nuestra comunidad"', '"Comparte con tu red"', '"Lee el caso de éxito completo"'];
const CORP_Q30_ELEMENTS = ['Logotipo de la empresa', 'Logo de partner o co-branding', 'Marca de agua', 'Disclaimer o texto legal', 'Hashtag corporativo obligatorio', 'Número de registro, certificación o membresía', 'Dato de contacto fijo', 'Otro elemento obligatorio'];
const CORP_Q31_TIMES = ['⚡ Menos de 24 horas', '🕐 Entre 24 y 48 horas', '🕑 Entre 48 y 72 horas', '📅 Entre 3 y 5 días hábiles', '📋 Depende del tipo de pieza'];
const CORP_Q31_ROUNDS = ['1 ronda', '2 rondas', '3 rondas', 'Varía según el proyecto'];
const CORP_Q32_KPIS = ['💰 Generación de leads calificados', '📈 Aumento en tráfico web o landing pages', '🤝 Solicitudes de demo o reunión comercial', '👁️ Alcance e impresiones de marca', '❤️ Engagement con la audiencia objetivo', '🔄 Contenido compartido por la comunidad', '💬 Conversaciones generadas con clientes potenciales', '🏆 Posicionamiento como referente del sector', '📊 Contribución al pipeline de ventas', '✨ Coherencia y calidad de la imagen de marca'];

function Field({ label, description, children }) {
  return (
    <div>
      <label className="block text-k-text font-medium text-sm mb-1">{label}</label>
      {description && <p className="text-k-muted text-xs mb-3">{description}</p>}
      {children}
    </div>
  )
}

export default function BrandForm() {
  const { clientId } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const { loading: brandDataLoading } = useMyBrand(clientId)
  const { plan, loading: planLoading } = useMyPlan(clientId)
  
  const formType = plan?.brandFormType || 'small'

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Small business form - 4 steps
    s_dna_q1: '', s_dna_q2: [], s_dna_q3_cat: '', s_dna_q3_text: '', s_dna_q4: '', s_dna_q5: [],
    s_dna_q6_pending: [], s_dna_q6_admired: [], s_dna_q6_competitors: [], s_dna_q6_admired_desc: '', s_dna_q6_comp_desc: '',
    s_dna_q7_today: '', s_dna_q7_m3: '', s_dna_q7_m6: '', s_dna_q7_m12: '', s_dna_q7_goalType: '', s_dna_q8_cat: '', s_dna_q8_text: '',
    s_visual_q9_assets: [], s_visual_q9_none: false, s_visual_q9_link: '',
    s_visual_q10_no_restrictions: false, s_visual_q10_mandatory: [], s_visual_q10_mandatory_reason: '', s_visual_q10_forbidden: [], s_visual_q10_forbidden_reason: '',
    s_visual_q11_concepts: [], s_visual_q11_custom: '',
    s_visual_q12_style_step: 3,
    s_visual_q13_references: [{url: '', comment: ''}, {url: '', comment: ''}, {url: '', comment: ''}],
    s_visual_q14_typo_choice: '', s_visual_q14_typo_custom: '', s_visual_q14_typo_style: '',
    s_visual_q15_elements: [], s_visual_q15_none: false, s_visual_q15_custom: '',
    s_visual_q16_risk: 5,
    s_client_q17_age: '', s_client_q17_location: '', s_client_q17_occupation: [], s_client_q17_details: '',
    s_client_q18_ranked: [],
    s_client_q19_platforms: [], s_client_q19_content_types: [],
    s_client_q20_barrier: '', s_client_q20_response: '',
    s_client_q21_positive: [], s_client_q21_negative: [], s_client_q21_details: '',
    s_client_q22_interests: [],
    s_client_q23_register_slider: 50, s_client_q23_specialization_slider: 50, s_client_q23_phrases: '',
    s_client_q24_trigger: '', s_client_q24_details: '',
    s_ops_q25_platforms: [], s_ops_q25_freq: {}, s_ops_q26_formats: [], s_ops_q27_period: 'por mes', s_ops_q27_videos: 0, s_ops_q27_designs: 0, 
    s_ops_q28_source: '', s_ops_q28_details: '', s_ops_q29_ranked: [], s_ops_q30_has_legal: 'no', s_ops_q30_elements: [], s_ops_q30_link: '', 
    s_ops_q30_details: '', s_ops_q31_reviewer: '', s_ops_q31_time: '', s_ops_q31_details: '', s_ops_q32_ranked: [],
    // Large business form - 4 steps
    l_dna_q1: '', l_dna_q2: [], l_dna_q3_cat: '', l_dna_q3_impact: '', l_dna_q3_text: '', l_dna_q4: '', l_dna_q5: [],
    l_dna_q6_pending: [], l_dna_q6_admired: [], l_dna_q6_comp_dir: [], l_dna_q6_comp_ind: [], l_dna_q6_admired_desc: '', l_dna_q6_comp_dir_desc: '', l_dna_q6_comp_ind_desc: '',
    l_dna_q7_today: {goal: '', kpi: '', type: ''}, l_dna_q7_m3: {goal: '', kpi: '', type: ''}, l_dna_q7_m6: {goal: '', kpi: '', type: ''}, l_dna_q7_m9: {goal: '', kpi: '', type: ''}, l_dna_q7_m12: {goal: '', kpi: '', type: ''}, 
    l_dna_q8_cat: '', l_dna_q8_text: '',
    l_visual_q9_assets: {}, l_visual_q9_none: false, l_visual_q9_link: '',
    l_visual_q10_no_restrictions: false, l_visual_q10_primary: [{hex: '#000000', pantone: '', cmyk: ''}], l_visual_q10_secondary: [], l_visual_q10_forbidden: [], l_visual_q10_forbidden_reason: '',
    l_visual_q11_concepts: [], l_visual_q11_custom: '',
    l_visual_q12_style_step: 3, l_visual_q12_details: '',
    l_visual_q13_references: [{url: '', platform: '', like: '', aspiration: ''}, {url: '', platform: '', like: '', aspiration: ''}, {url: '', platform: '', like: '', aspiration: ''}],
    l_visual_q14_typo_choice: '', l_visual_q14_typo_name: '', l_visual_q14_typo_in_manual: '', l_visual_q14_typo_missing: '', l_visual_q14_typo_direction: '',
    l_visual_q15_elements: {}, l_visual_q15_none: false, l_visual_q15_custom: '', l_visual_q15_untouchable: '',
    l_visual_q16_risk: 5, l_visual_q16_channels: '', l_visual_q16_restrictions: '',
    l_client_q17_age: '', l_client_q17_location: '', l_client_q17_sector: '', l_client_q17_size: '', l_client_q17_decision: '', l_client_q17_details: '',
    l_client_q18_ranked: [], l_client_q18_context: '',
    l_client_q19_platforms: [], l_client_q19_content: [], l_client_q19_time: '',
    l_client_q20_barrier: '', l_client_q20_stage: '', l_client_q20_arguments: '',
    l_client_q21_functional: [], l_client_q21_strategic: [], l_client_q21_emotional: [], l_client_q21_missing: '',
    l_client_q22_interests: [],
    l_client_q23_formal: 50, l_client_q23_technical: 50, l_client_q23_speed: 50, l_client_q23_terms: '',
    l_client_q24_stages: [], l_client_q24_details: {},
    l_ops_q25_platforms: [], l_ops_q25_roles: {}, 
    l_ops_q26_formats: [], l_ops_q26_usage: {}, 
    l_ops_q27_period: 'por mes', l_ops_q27_videos: 0, l_ops_q27_motion: 0, l_ops_q27_designs: 0, l_ops_q27_variation: '', l_ops_q27_variation_details: '',
    l_ops_q28_source: '', l_ops_q28_structure: 'no', l_ops_q28_structure_details: '', l_ops_q28_uploader: '',
    l_ops_q29_ranked: [], l_ops_q29_mandatory: '',
    l_ops_q30_has_legal: 'no', l_ops_q30_elements: [], l_ops_q30_details: {}, l_ops_q30_link: '',
    l_ops_q31_name: '', l_ops_q31_role: '', l_ops_q31_time: '', l_ops_q31_rounds: '', l_ops_q31_multiple: false, l_ops_q31_flow: '', l_ops_q31_particularity: '',
    l_ops_q32_ranked: [], l_ops_q32_system: ''
  })

  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // Local UI states for Q2, Q5 & Q6 (Adding custom values)
  const [customValueQ2, setCustomValueQ2] = useState('')
  const [customValueQ5, setCustomValueQ5] = useState('')
  const [customBrandQ6, setCustomBrandQ6] = useState('')
  const [activeTimelineNode, setActiveTimelineNode] = useState('12m')
  const [customConceptQ11, setCustomConceptQ11] = useState('')
  const [customElementQ15, setCustomElementQ15] = useState('')
  const [customFrustrationQ18, setCustomFrustrationQ18] = useState('')
  const [customInterestQ22, setCustomInterestQ22] = useState('')
  const [draggedItem, setDraggedItem] = useState(null)
  const [customPlatformQ25, setCustomPlatformQ25] = useState('')
  const [customCtaQ29, setCustomCtaQ29] = useState('')
  const [customKpiQ32, setCustomKpiQ32] = useState('')
  const [customValueLQ2, setCustomValueLQ2] = useState('')
  const [customValueLQ5, setCustomValueLQ5] = useState('')
  const [customBrandLQ6, setCustomBrandLQ6] = useState('')
  const [activeTimelineNodeCorp, setActiveTimelineNodeCorp] = useState('m12')
  const [customConceptLQ11, setCustomConceptLQ11] = useState('')
  const [customElementLQ15, setCustomElementLQ15] = useState('')
  const [customFrustrationLQ18, setCustomFrustrationLQ18] = useState('')
  const [customInterestLQ22, setCustomInterestLQ22] = useState('')
  const [customPlatformLQ25, setCustomPlatformLQ25] = useState('')
  const [customCtaLQ29, setCustomCtaLQ29] = useState('')
  const [customKpiLQ32, setCustomKpiLQ32] = useState('')

  const handleTextChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleColorChange = (type, index, value) => {
    setFormData(prev => {
      const newPalette = [...prev[type]]
      newPalette[index] = value
      return { ...prev, [type]: newPalette }
    })
  }

  const handleCorpColorChange = (type, index, field, value) => {
    setFormData(prev => {
      const newArr = [...prev[type]];
      newArr[index] = { ...newArr[index], [field]: value };
      return { ...prev, [type]: newArr };
    });
  }
  const handleAddCorpColor = (type, max) => {
    if (formData[type].length < max) {
      setFormData(prev => ({ ...prev, [type]: [...prev[type], {hex: '#000000', pantone: '', cmyk: ''}] }))
    }
  }

  const handleArrayChange = (type, index, field, value) => {
    setFormData(prev => {
      const newArr = [...prev[type]];
      newArr[index] = { ...newArr[index], [field]: value };
      return { ...prev, [type]: newArr };
    });
  }

  const handleCheckboxChange = (field, option) => {
    setFormData(prev => {
      const list = prev[field] || []
      if (list.includes(option)) {
        return { ...prev, [field]: list.filter(item => item !== option) }
      } else {
        return { ...prev, [field]: [...list, option] }
      }
    })
  }

  const handleCorpAssetChange = (asset, status) => {
    setFormData(prev => {
      const newAssets = { ...prev.l_visual_q9_assets };
      if (status === 'none') { delete newAssets[asset]; } else { newAssets[asset] = status; }
      return { ...prev, l_visual_q9_assets: newAssets };
    })
  }
  const handleCorpElementChange = (el, status) => {
    setFormData(prev => {
      const newEls = { ...prev.l_visual_q15_elements };
      if (status === 'none') { delete newEls[el]; } else { newEls[el] = status; }
      return { ...prev, l_visual_q15_elements: newEls };
    })
  }

  const handleNext = () => {
    if (formType === 'small' && currentStep === 1) {
      if (formData.s_dna_q3_cat === '📦 Otro' && !formData.s_dna_q3_text.trim()) {
        showToast('Debes especificar el problema si seleccionaste "Otro".', 'warning'); return;
      }
      if (formData.s_dna_q6_admired.length < 1 || formData.s_dna_q6_competitors.length < 1) {
        showToast('Debes agregar al menos 1 marca que admires y 1 competencia (Paso 6).', 'warning'); return;
      }
      if (!formData.s_dna_q7_m12.trim()) {
        showToast('La meta a 12 meses es obligatoria (Paso 7).', 'warning'); return;
      }
    } else if (formType === 'small' && currentStep === 2) {
      if (formData.s_visual_q13_references[0].url === '') {
        showToast('Debes compartir al menos 1 URL de referencia (Pregunta 13).', 'warning'); return;
      }
      if (!formData.s_visual_q14_typo_choice) {
        showToast('Debes elegir una opción sobre tus tipografías (Pregunta 14).', 'warning'); return;
      }
    } else if (formType === 'small' && currentStep === 3) {
      if (formData.s_client_q18_ranked.length < 3) {
        showToast('Debes ordenar las 3 frustraciones más relevantes de tu cliente (Pregunta 18).', 'warning'); return;
      }
      if (formData.s_client_q20_barrier === '✏️ Otra barrera' && !formData.s_client_q20_response.trim()) {
        showToast('Debes especificar la barrera si seleccionaste "Otra barrera" (Pregunta 20).', 'warning'); return;
      }
    } else if (formType === 'large' && currentStep === 1) {
      if (formData.l_dna_q6_admired.length < 1 || formData.l_dna_q6_comp_dir.length < 1 || formData.l_dna_q6_comp_ind.length < 1) {
        showToast('Debes agregar al menos 1 marca en cada columna (Pregunta 6).', 'warning'); return;
      }
      if (!formData.l_dna_q7_m12.goal.trim()) {
        showToast('El objetivo a 12 meses es obligatorio (Pregunta 7).', 'warning'); return;
      }
    } else if (formType === 'large' && currentStep === 2) {
      if (formData.l_visual_q13_references[0].url === '') {
        showToast('Debes compartir al menos 1 URL de referencia en el paso 13.', 'warning'); return;
      }
      if (!formData.l_visual_q14_typo_choice) {
        showToast('Debes elegir una opción sobre tus tipografías corporativas (Pregunta 14).', 'warning'); return;
      }
    } else if (formType === 'large' && currentStep === 3) {
      if (formData.l_client_q18_ranked.length < 3) {
        showToast('Debes ordenar los 3 pain points principales de tu cliente (Pregunta 18).', 'warning'); return;
      }
      if (formData.l_client_q19_platforms.length < 1) {
        showToast('Debes indicar al menos 1 plataforma de presencia de tu cliente (Pregunta 19).', 'warning'); return;
      }
      if (formData.l_client_q21_functional.length < 2 || formData.l_client_q21_strategic.length < 2 || formData.l_client_q21_emotional.length < 2) {
        showToast('Debes clasificar al menos 2 tarjetas en cada columna de transformación (Pregunta 21).', 'warning'); return;
      }
      if (formData.l_client_q24_stages.length < 1) {
        showToast('Debes indicar al menos 1 etapa del Customer Journey (Pregunta 24).', 'warning'); return;
      }
    }
    if (currentStep < 4) setCurrentStep(p => p + 1)
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
        ...(formType === 'small' ? {
        } : {
          l_visual_must_have_colors: formData.l_visual_must_have_colors.filter(c => c.trim() !== ''),
          l_visual_forbidden_colors: formData.l_visual_forbidden_colors.filter(c => c.trim() !== ''),
          l_visual_references: formData.l_visual_references.filter(url => url.trim() !== ''),
        }),
        formType,
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

  // --- D&D Handlers para Pregunta 2 ---
  const handleDragStartQ2 = (e, val, source) => { e.dataTransfer.setData('val', val); e.dataTransfer.setData('source', source) }
  const handleDropQ2Selected = (e) => {
    e.preventDefault()
    const val = e.dataTransfer.getData('val'); const source = e.dataTransfer.getData('source');
    if (source === 'selected' || !val) return
    if (formData.s_dna_q2.length >= 3) { showToast('Ya tienes tus 3 valores. Quita uno para cambiar.', 'warning'); return }
    setFormData(prev => ({ ...prev, s_dna_q2: [...prev.s_dna_q2, val] }))
  }
  const handleDropQ2Available = (e) => {
    e.preventDefault()
    const val = e.dataTransfer.getData('val'); const source = e.dataTransfer.getData('source');
    if (source === 'available' || !val) return
    setFormData(prev => ({ ...prev, s_dna_q2: prev.s_dna_q2.filter(v => v !== val) }))
  }
  const availableQ2 = BRAND_VALUES.filter(v => !formData.s_dna_q2.includes(v))

  // --- D&D Handlers para Pregunta 6 ---
  const handleDragStartQ6 = (e, val, source) => { e.dataTransfer.setData('val', val); e.dataTransfer.setData('source', source) }
  const handleDropQ6 = (e, target) => {
    e.preventDefault()
    const val = e.dataTransfer.getData('val'); const source = e.dataTransfer.getData('source');
    if (!val || source === target) return
    setFormData(prev => {
      let newPending = prev.s_dna_q6_pending; let newAdmired = prev.s_dna_q6_admired; let newComp = prev.s_dna_q6_competitors;
      if (source === 'pending') newPending = newPending.filter(v => v !== val)
      if (source === 'admired') newAdmired = newAdmired.filter(v => v !== val)
      if (source === 'comp') newComp = newComp.filter(v => v !== val)
      
      if (target === 'pending') newPending = [...newPending, val]
      if (target === 'admired') newAdmired = [...newAdmired, val]
      if (target === 'comp') newComp = [...newComp, val]
      return { ...prev, s_dna_q6_pending: newPending, s_dna_q6_admired: newAdmired, s_dna_q6_competitors: newComp }
    })
  }
  const removeBrandQ6 = (val, source) => {
    setFormData(prev => {
      let newPending = prev.s_dna_q6_pending; let newAdmired = prev.s_dna_q6_admired; let newComp = prev.s_dna_q6_competitors;
      if (source === 'pending') newPending = newPending.filter(v => v !== val)
      if (source === 'admired') newAdmired = newAdmired.filter(v => v !== val)
      if (source === 'comp') newComp = newComp.filter(v => v !== val)
      return { ...prev, s_dna_q6_pending: newPending, s_dna_q6_admired: newAdmired, s_dna_q6_competitors: newComp }
    })
  }

  // --- Handler limitador Q5 ---
  const handleQ5Change = (val) => {
    if (formData.s_dna_q5.includes(val)) { setFormData(prev => ({ ...prev, s_dna_q5: prev.s_dna_q5.filter(v => v !== val) })) } 
    else if (formData.s_dna_q5.length < 3) { setFormData(prev => ({ ...prev, s_dna_q5: [...prev.s_dna_q5, val] })) }
    else { showToast('¡Perfecto! Si quieres cambiar uno, desactívalo primero', 'warning') }
  }

  // --- D&D Handlers para Pregunta 2 Corporativa ---
  const handleDropLQ2Selected = (e) => {
    e.preventDefault()
    const val = e.dataTransfer.getData('val'); const source = e.dataTransfer.getData('source');
    if (source === 'selected' || !val) return
    if (formData.l_dna_q2.length >= 3) { showToast('Ya definieron sus 3 valores clave. Retiren uno para hacer un cambio.', 'warning'); return }
    setFormData(prev => ({ ...prev, l_dna_q2: [...prev.l_dna_q2, val] }))
  }
  const handleDropLQ2Available = (e) => {
    e.preventDefault()
    const val = e.dataTransfer.getData('val'); const source = e.dataTransfer.getData('source');
    if (source === 'available' || !val) return
    setFormData(prev => ({ ...prev, l_dna_q2: prev.l_dna_q2.filter(v => v !== val) }))
  }
  const availableLQ2 = CORP_VALUES.filter(v => !formData.l_dna_q2.includes(v))

  // --- D&D Handlers para Pregunta 6 Corporativa ---
  const handleDropLQ6 = (e, target) => {
    e.preventDefault()
    const val = e.dataTransfer.getData('val'); const source = e.dataTransfer.getData('source');
    if (!val || source === target) return
    setFormData(prev => {
      let pending = prev.l_dna_q6_pending; let admired = prev.l_dna_q6_admired; let compDir = prev.l_dna_q6_comp_dir; let compInd = prev.l_dna_q6_comp_ind;
      if (source === 'pending') pending = pending.filter(v => v !== val)
      if (source === 'admired') admired = admired.filter(v => v !== val)
      if (source === 'compDir') compDir = compDir.filter(v => v !== val)
      if (source === 'compInd') compInd = compInd.filter(v => v !== val)
      
      if (target === 'pending') pending = [...pending, val]
      if (target === 'admired') admired = [...admired, val]
      if (target === 'compDir') compDir = [...compDir, val]
      if (target === 'compInd') compInd = [...compInd, val]
      return { ...prev, l_dna_q6_pending: pending, l_dna_q6_admired: admired, l_dna_q6_comp_dir: compDir, l_dna_q6_comp_ind: compInd }
    })
  }
  const removeBrandLQ6 = (val, source) => {
    setFormData(prev => {
      let pending = prev.l_dna_q6_pending; let admired = prev.l_dna_q6_admired; let compDir = prev.l_dna_q6_comp_dir; let compInd = prev.l_dna_q6_comp_ind;
      if (source === 'pending') pending = pending.filter(v => v !== val)
      if (source === 'admired') admired = admired.filter(v => v !== val)
      if (source === 'compDir') compDir = compDir.filter(v => v !== val)
      if (source === 'compInd') compInd = compInd.filter(v => v !== val)
      return { ...prev, l_dna_q6_pending: pending, l_dna_q6_admired: admired, l_dna_q6_comp_dir: compDir, l_dna_q6_comp_ind: compInd }
    })
  }

  const handleLQ5Change = (val) => {
    if (formData.l_dna_q5.includes(val)) { setFormData(prev => ({ ...prev, l_dna_q5: prev.l_dna_q5.filter(v => v !== val) })) } 
    else if (formData.l_dna_q5.length < 3) { setFormData(prev => ({ ...prev, l_dna_q5: [...prev.l_dna_q5, val] })) }
    else { showToast('Ya tienen sus 3 atributos de tono. Deseleccionen uno para cambiarlo.', 'warning') }
  }

  const handleQ7CorpChange = (node, field, value) => {
    setFormData(prev => ({
      ...prev,
      [`l_dna_q7_${node}`]: {
        ...prev[`l_dna_q7_${node}`],
        [field]: value
      }
    }))
  }

  const handleLQ11Change = (val) => {
    if (formData.l_visual_q11_concepts.includes(val)) { setFormData(prev => ({ ...prev, l_visual_q11_concepts: prev.l_visual_q11_concepts.filter(v => v !== val) })) } 
    else if (formData.l_visual_q11_concepts.length < 3) { setFormData(prev => ({ ...prev, l_visual_q11_concepts: [...prev.l_visual_q11_concepts, val] })) }
    else { showToast('Máximo 3 conceptos visuales.', 'warning') }
  }

  // --- D&D Handlers para Q21 Corporativo ---
  const handleDropCorpQ21 = (e, targetListKey) => {
    e.preventDefault();
    if (!draggedItem) return;

    let newFormData = { ...formData };
    // Remove from all targeted lists first
    newFormData.l_client_q21_functional = newFormData.l_client_q21_functional.filter(i => i !== draggedItem);
    newFormData.l_client_q21_strategic = newFormData.l_client_q21_strategic.filter(i => i !== draggedItem);
    newFormData.l_client_q21_emotional = newFormData.l_client_q21_emotional.filter(i => i !== draggedItem);

    if (targetListKey) {
      newFormData[targetListKey] = [...newFormData[targetListKey], draggedItem];
    }
    
    setFormData(newFormData);
    setDraggedItem(null);
  }
  const availableCorpQ21 = CORP_Q21_CARDS.filter(c => !formData.l_client_q21_functional.includes(c) && !formData.l_client_q21_strategic.includes(c) && !formData.l_client_q21_emotional.includes(c));

  // --- Handlers para Q24 Timeline Corporativo ---
  const toggleCorpQ24Stage = (stage) => {
    setFormData(p => {
      if (p.l_client_q24_stages.includes(stage)) {
        return { ...p, l_client_q24_stages: p.l_client_q24_stages.filter(s => s !== stage) }
      } else {
        if (p.l_client_q24_stages.length >= 2) { showToast('Máximo 2 puntos de entrada.', 'warning'); return p; }
        return { ...p, l_client_q24_stages: [...p.l_client_q24_stages, stage] }
      }
    })
  }
  const handleCorpQ24Detail = (stage, field, value) => {
    setFormData(p => ({
      ...p, l_client_q24_details: {
        ...p.l_client_q24_details,
        [stage]: { ...(p.l_client_q24_details[stage] || {}), [field]: value }
      }
    }))
  }
  const handleCorpOpsRoles = (platform, role) => { setFormData(p => ({ ...p, l_ops_q25_roles: { ...p.l_ops_q25_roles, [platform]: role } })) }
  const handleCorpOpsUsage = (format, usage) => { setFormData(p => ({ ...p, l_ops_q26_usage: { ...p.l_ops_q26_usage, [format]: usage } })) }
  const handleCorpOpsLegal = (el, val) => { setFormData(p => ({ ...p, l_ops_q30_details: { ...p.l_ops_q30_details, [el]: val } })) }

  // --- D&D Handlers para Q18 & Q19 ---
  const handleDragStartRank = (e, item) => { setDraggedItem(item) }
  const handleDragOverRank = (e) => { e.preventDefault() }
  const handleDropRank = (e, listKey, action, max) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    const currentList = [...formData[listKey]];

    if (action === 'add') {
      if (currentList.includes(draggedItem)) return;
      if (max && currentList.length >= max) { showToast(`Solo puedes seleccionar un máximo de ${max}.`, 'warning'); return; }
      setFormData(p => ({ ...p, [listKey]: [...currentList, draggedItem] }));
    } else if (action === 'remove') {
      setFormData(p => ({ ...p, [listKey]: currentList.filter(item => item !== draggedItem) }));
    }
    
    setDraggedItem(null);
  }

  // --- D&D Handlers para Q21 ---
  const handleDropFeeling = (e, targetListKey, max) => {
    e.preventDefault();
    if (!draggedItem) return;

    const currentTarget = targetListKey ? [...formData[targetListKey]] : null;
    if (currentTarget && max && currentTarget.length >= max) {
      showToast(`Puedes seleccionar un máximo de ${max} opciones.`, 'warning');
      return;
    }

    const newFormData = { ...formData };
    newFormData.s_client_q21_positive = newFormData.s_client_q21_positive.filter(f => f !== draggedItem);
    newFormData.s_client_q21_negative = newFormData.s_client_q21_negative.filter(f => f !== draggedItem);
    if (targetListKey) {
      newFormData[targetListKey] = [...newFormData[targetListKey], draggedItem];
    }
    setFormData(newFormData);
  }

  // --- Helpers UI Slider Q12 & Q16 ---
  const getStyleDescription = (val) => {
    switch(val.toString()) {
      case '1': return "Muy dinámico — ritmo rápido";
      case '2': return "Dinámico con momentos de pausa";
      case '3': return "Equilibrado";
      case '4': return "Tranquilo con energía puntual";
      case '5': return "Muy contemplativo — cuidado, cinematográfico";
      default: return "";
    }
  }
  const getRiskDescription = (val) => {
    const v = parseInt(val);
    if (v <= 3) return "Evolución suave, respetando lo que ya tienes";
    if (v <= 6) return "Renovación con identidad, arriesgado pero coherente";
    if (v <= 9) return "Ruptura creativa, diseño que genera conversación";
    return "Sin límites. Confianza total en el equipo creativo";
  }
  const getCorpStyleDescription = (val) => {
    switch(val.toString()) {
      case '1': return "Ideal para campañas de awareness, lanzamientos y contenido de redes de alta rotación";
      case '2': return "Dinámico pero con momentos de pausa para mensajes clave";
      case '3': return "Equilibrio entre impacto y comunicación de valor. Versátil para múltiples canales";
      case '4': return "Tranquilo, profesional. Ideal para LinkedIn, cases de éxito y contenido institucional";
      case '5': return "Cinematográfico y sobrio. Adecuado para brand films, presentaciones corporativas y comunicación ejecutiva";
      default: return "";
    }
  }
  const getCorpRiskDescription = (val) => {
    const v = parseInt(val);
    if (v <= 2) return "Refinamiento. Mismo ADN visual, mayor consistencia y calidad de ejecución";
    if (v <= 4) return "Evolución. Se mantiene la esencia pero se moderniza el lenguaje visual";
    if (v <= 6) return "Renovación. Nueva dirección visual con puentes hacia la identidad actual";
    if (v <= 8) return "Disrupción controlada. Ruptura estratégica que posiciona la marca como referente";
    return "Reposicionamiento total. La marca se reinventa visualmente desde la base";
  }

  const handleAddColor = (type, max) => {
    if (formData[type].length < max) { setFormData(prev => ({ ...prev, [type]: [...prev[type], '#000000'] })) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!clientId) {
      showToast('Error de autenticación.', 'error')
      return
    }

    if (currentStep < 4) {
      handleNext()
      return
    }

    if (formType === 'small') {
      if (!formData.s_ops_q25_platforms.length || !formData.s_ops_q26_formats.length) {
        showToast('Por favor, indica las plataformas y formatos que necesitas (Preguntas 25 y 26).', 'warning');
        return
      }
    } else if (formType === 'large') {
      if (!formData.l_ops_q25_platforms.length || !formData.l_ops_q26_formats.length) {
        showToast('Por favor, indica las plataformas y formatos que requieren.', 'warning');
        return
      }
    }

    setUploading(true)
    try {
      await setDoc(doc(db, 'clients', clientId, 'brandForm', 'latest'), {
        ...formData,
        ...(formType === 'small' ? {
        } : {
          l_visual_q10_primary: formData.l_visual_q10_primary.filter(c => c.hex.trim() !== ''),
          l_visual_q10_secondary: formData.l_visual_q10_secondary.filter(c => c.hex.trim() !== ''),
          l_visual_q10_forbidden: formData.l_visual_q10_forbidden.filter(c => c.hex.trim() !== ''),
        }),
        formType,
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

  if (success || brandDataLoading || planLoading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheck size={32} />
        </div>
        <h2 className="text-k-text text-2xl font-semibold mb-2">¡Información recibida!</h2>
        <p className="text-k-muted text-sm">Gracias por completar tu información de marca. Nuestro equipo la revisará en breve.</p>
        {(brandDataLoading || planLoading) && (
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
        <div className={`h-1.5 flex-1 rounded-full transition-colors ${currentStep >= 4 ? 'bg-k-orange' : 'bg-k-surface2'}`} />
      </div>

      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">
          {formType === 'small'
            ? ['Paso 1: ADN de Marca', 'Paso 2: Universo Visual', 'Paso 3: Tu Cliente Ideal', 'Paso 4: Operación y Logística'][currentStep - 1]
            : ['Paso 1: ADN de Marca', 'Paso 2: Universo Visual', 'Paso 3: Buyer Persona', 'Paso 4: Operación y Logística'][currentStep - 1]}
        </h1>
        <p className="text-k-muted text-sm mt-1">
          Completando el formulario para {formType === 'small' ? 'pequeñas empresas' : 'medianas/grandes empresas'}.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-k-surface rounded-card-lg p-6 sm:p-8 flex flex-col gap-6" style={{ border: '1px solid var(--color-border)' }}>
        
        {currentStep === 1 && formType === 'small' && ( // ── PASO 1: ADN ────────────────────────────────
          <div className="flex flex-col gap-6">
            
            {/* Q1 */}
            <Field label="1. Si tu marca desapareciera mañana, ¿qué es lo que el mundo dejaría de tener?">
              <div className="relative">
                <input type="text" name="s_dna_q1" value={formData.s_dna_q1} onChange={handleTextChange} maxLength={150} className={`${inputClass} pr-16`} placeholder="Ej: La única asesoría de marketing que habla en simple..." />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-k-muted">{formData.s_dna_q1.length}/150</span>
              </div>
            </Field>

            {/* Q2 */}
            <Field label="2. ¿Cuáles son los 3 valores que guían cada decisión que tomas en tu negocio?" description="Arrastra desde la izquierda hacia la derecha. El orden define su prioridad.">
              <div className="grid grid-cols-2 gap-4">
                {/* Disponibles */}
                <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={e => e.preventDefault()} onDrop={handleDropQ2Available}>
                  <p className="text-k-muted text-xs font-semibold mb-2">Valores disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {availableQ2.map(v => (
                      <div key={v} draggable onDragStart={e => handleDragStartQ2(e, v, 'available')} className="bg-k-surface border border-k-border text-k-text text-xs px-2.5 py-1.5 rounded cursor-grab active:cursor-grabbing hover:border-k-orange transition-colors">{v}</div>
                    ))}
                    <div className="flex w-full gap-2 mt-2">
                      <input type="text" value={customValueQ2} onChange={e => setCustomValueQ2(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customValueQ2.trim() && formData.s_dna_q2.length < 3) { setFormData(prev => ({...prev, s_dna_q2: [...prev.s_dna_q2, customValueQ2.trim()]})); setCustomValueQ2('') } } }} placeholder="Agregar el mío..." className="bg-k-surface text-k-text text-xs px-2 py-1.5 rounded border border-k-border outline-none flex-1" />
                      <button type="button" onClick={() => { if(customValueQ2.trim() && formData.s_dna_q2.length < 3) { setFormData(prev => ({...prev, s_dna_q2: [...prev.s_dna_q2, customValueQ2.trim()]})); setCustomValueQ2('') } }} className="bg-k-surface2 text-k-muted hover:text-k-text px-2 py-1 rounded text-xs">+</button>
                    </div>
                  </div>
                </div>
                {/* Seleccionados */}
                <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-2" onDragOver={e => e.preventDefault()} onDrop={handleDropQ2Selected}>
                  <p className="text-k-orange text-xs font-semibold mb-1">Mis 3 valores</p>
                  {formData.s_dna_q2.length === 0 && <p className="text-k-muted text-xs italic text-center mt-4">Arrastra aquí</p>}
                  {formData.s_dna_q2.map((v, i) => (
                    <div key={v} draggable onDragStart={e => handleDragStartQ2(e, v, 'selected')} className="bg-k-surface border border-k-orange text-k-text text-xs px-3 py-2 rounded flex items-center justify-between cursor-grab active:cursor-grabbing">
                      <span><span className="text-k-orange font-bold mr-2">{i+1}°</span> {v}</span>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, s_dna_q2: prev.s_dna_q2.filter(val => val !== v)}))} className="text-k-muted hover:text-red-400">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </Field>

            {/* Q3 */}
            <Field label="3. ¿Qué problema le resuelves a tu cliente? ¿Qué frustración desaparece cuando te elige a ti?">
              <select name="s_dna_q3_cat" value={formData.s_dna_q3_cat} onChange={handleTextChange} className={`${inputClass} mb-3`}>
                <option value="">Selecciona una categoría...</option>
                {PROBLEM_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formData.s_dna_q3_cat && (
                <div className="relative">
                  <input type="text" name="s_dna_q3_text" value={formData.s_dna_q3_text} onChange={handleTextChange} maxLength={120} className={`${inputClass} pr-16`} placeholder="Cuéntanos con tus palabras cómo lo resuelves" required={formData.s_dna_q3_cat === '📦 Otro'} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-k-muted">{formData.s_dna_q3_text.length}/120</span>
                </div>
              )}
            </Field>

            {/* Q4 */}
            <Field label="4. ¿Qué es lo que haces tan bien que a tu competencia le costaría mucho imitarte?">
              <div className="relative">
                <textarea name="s_dna_q4" value={formData.s_dna_q4} onChange={handleTextChange} rows={3} maxLength={200} className={`${inputClass} pr-14 pb-6 resize-none`} placeholder="Ej: Entregamos diseños en 24 horas con revisiones ilimitadas..." />
                <span className="absolute right-3 bottom-2 text-xs text-k-muted">{formData.s_dna_q4.length}/200</span>
              </div>
            </Field>

            {/* Q5 */}
            <Field label="5. Si tu marca tuviera voz, ¿cómo sonaría? Descríbela con 3 adjetivos." description={formData.s_dna_q5.length >= 3 ? "¡Perfecto! Si quieres cambiar uno, desactívalo primero" : "Selecciona hasta 3."}>
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-k-muted text-xs font-semibold mb-2">Positivos</p>
                  <div className="flex flex-wrap gap-2">
                    {TONE_POSITIVE.map(adj => {
                      const active = formData.s_dna_q5.includes(adj);
                      const disabled = !active && formData.s_dna_q5.length >= 3;
                      return <button key={adj} type="button" disabled={disabled} onClick={() => handleQ5Change(adj)} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${active ? 'bg-k-orange/10 border-k-orange text-k-orange font-medium' : disabled ? 'bg-k-surface2 opacity-40 border-transparent text-k-muted cursor-not-allowed' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}>{adj}</button>
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-k-muted text-xs font-semibold mb-2">Descartar (No quiero sonar así)</p>
                  <div className="flex flex-wrap gap-2">
                    {TONE_NEGATIVE.map(adj => {
                      const active = formData.s_dna_q5.includes(adj);
                      const disabled = !active && formData.s_dna_q5.length >= 3;
                      return <button key={adj} type="button" disabled={disabled} onClick={() => handleQ5Change(adj)} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${active ? 'bg-red-500/10 border-red-500 text-red-500 font-medium' : disabled ? 'bg-k-surface2 opacity-40 border-transparent text-k-muted cursor-not-allowed' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}>{adj}</button>
                    })}
                  </div>
                </div>
                <div className="flex w-full sm:w-1/2 gap-2">
                  <input type="text" value={customValueQ5} onChange={e => setCustomValueQ5(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customValueQ5.trim() && formData.s_dna_q5.length < 3) { handleQ5Change(customValueQ5.trim()); setCustomValueQ5('') } } }} placeholder="+ Escribir el mío..." disabled={formData.s_dna_q5.length >= 3} className={`bg-k-surface2 text-k-text text-xs px-3 py-1.5 rounded-full border border-transparent outline-none flex-1 ${formData.s_dna_q5.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`} />
                  <button type="button" disabled={formData.s_dna_q5.length >= 3} onClick={() => { if(customValueQ5.trim() && formData.s_dna_q5.length < 3) { handleQ5Change(customValueQ5.trim()); setCustomValueQ5('') } }} className={`bg-k-surface2 text-k-text px-3 py-1.5 rounded-full text-xs ${formData.s_dna_q5.length >= 3 ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'}`}>+</button>
                </div>
              </div>
            </Field>

            {/* Q6 */}
            <Field label="6. Nombra 2 marcas que admires y 2 que consideres competencia." description="Ingresa nombres y arrástralos a las columnas.">
              <div className="flex gap-2 mb-4">
                <input type="text" value={customBrandQ6} onChange={e => setCustomBrandQ6(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customBrandQ6.trim()) { setFormData(prev => ({...prev, s_dna_q6_pending: [...prev.s_dna_q6_pending, customBrandQ6.trim()]})); setCustomBrandQ6('') } } }} placeholder="Escribe una marca y presiona Enter..." className={`${inputClass} flex-1`} />
                <button type="button" onClick={() => { if(customBrandQ6.trim()) { setFormData(prev => ({...prev, s_dna_q6_pending: [...prev.s_dna_q6_pending, customBrandQ6.trim()]})); setCustomBrandQ6('') } }} className="bg-k-surface2 text-k-text hover:brightness-110 px-4 py-2 rounded-card text-sm">Agregar</button>
              </div>
              
              <div className="flex gap-2 flex-wrap mb-4" onDragOver={e => e.preventDefault()} onDrop={e => handleDropQ6(e, 'pending')}>
                {formData.s_dna_q6_pending.map(b => (
                   <span key={b} draggable onDragStart={e => handleDragStartQ6(e, b, 'pending')} className="bg-k-surface border border-k-border text-k-text text-xs px-3 py-1.5 rounded-full cursor-grab active:cursor-grabbing flex items-center gap-2">{b} <button type="button" onClick={() => removeBrandQ6(b, 'pending')} className="text-k-muted hover:text-red-400">×</button></span>
                ))}
                {formData.s_dna_q6_pending.length === 0 && <span className="text-k-muted text-xs italic py-1.5">Marcas pendientes de clasificar...</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-k-orange/5 rounded-card p-4 border border-dashed border-k-orange/50 flex flex-col gap-2" onDragOver={e => e.preventDefault()} onDrop={e => handleDropQ6(e, 'admired')}>
                  <p className="text-k-orange text-sm font-semibold mb-1">Marcas que admiro</p>
                  {formData.s_dna_q6_admired.length === 0 && <p className="text-k-muted text-xs italic text-center py-4">Arrastra aquí</p>}
                  {formData.s_dna_q6_admired.map(b => (
                    <div key={b} draggable onDragStart={e => handleDragStartQ6(e, b, 'admired')} className="bg-k-surface border border-k-orange text-k-text text-sm px-3 py-2 rounded flex items-center justify-between cursor-grab active:cursor-grabbing">
                      {b} <button type="button" onClick={() => removeBrandQ6(b, 'admired')} className="text-k-muted hover:text-red-400">×</button>
                    </div>
                  ))}
                  <textarea name="s_dna_q6_admired_desc" value={formData.s_dna_q6_admired_desc} onChange={handleTextChange} rows={2} maxLength={100} className="w-full bg-k-surface text-k-text text-xs p-2 rounded mt-2 outline-none resize-none" placeholder="¿Qué es lo que más valoras de ellas?" />
                </div>
                <div className="bg-blue-500/5 rounded-card p-4 border border-dashed border-blue-500/50 flex flex-col gap-2" onDragOver={e => e.preventDefault()} onDrop={e => handleDropQ6(e, 'comp')}>
                  <p className="text-blue-400 text-sm font-semibold mb-1">Mi competencia directa</p>
                  {formData.s_dna_q6_competitors.length === 0 && <p className="text-k-muted text-xs italic text-center py-4">Arrastra aquí</p>}
                  {formData.s_dna_q6_competitors.map(b => (
                    <div key={b} draggable onDragStart={e => handleDragStartQ6(e, b, 'comp')} className="bg-k-surface border border-blue-500/50 text-k-text text-sm px-3 py-2 rounded flex items-center justify-between cursor-grab active:cursor-grabbing">
                      {b} <button type="button" onClick={() => removeBrandQ6(b, 'comp')} className="text-k-muted hover:text-red-400">×</button>
                    </div>
                  ))}
                  <textarea name="s_dna_q6_comp_desc" value={formData.s_dna_q6_comp_desc} onChange={handleTextChange} rows={2} maxLength={100} className="w-full bg-k-surface text-k-text text-xs p-2 rounded mt-2 outline-none resize-none" placeholder="¿Qué te diferencia de ellas?" />
                </div>
              </div>
            </Field>

            {/* Q7 */}
            <Field label="7. ¿Dónde te imaginas tu marca dentro de un año? Cuéntanos tu gran meta." description="Haz clic en cada punto para completar. Solo la meta a 12 meses es obligatoria.">
              <div className="flex items-center justify-between relative px-2 mb-6 mt-2">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-k-surface2 rounded-full -z-10"></div>
                {[ { id: 'today', label: 'Hoy' }, { id: 'm3', label: '3 meses' }, { id: 'm6', label: '6 meses' }, { id: 'm12', label: '12 meses' } ].map(node => (
                  <div key={node.id} className="flex flex-col items-center gap-2 relative">
                    <button type="button" onClick={() => setActiveTimelineNode(node.id)} className={`w-5 h-5 rounded-full transition-all border-4 ${activeTimelineNode === node.id ? 'bg-k-orange border-k-bg scale-125' : formData[`s_dna_q7_${node.id}`]?.trim() ? 'bg-green-400 border-k-bg' : 'bg-k-surface2 border-k-bg hover:bg-k-orange/50'}`}></button>
                    <span className={`text-[10px] sm:text-xs font-medium absolute -bottom-6 whitespace-nowrap ${activeTimelineNode === node.id ? 'text-k-orange' : 'text-k-muted'}`}>{node.label}</span>
                  </div>
                ))}
              </div>
              <div className="bg-k-surface2/50 rounded-card p-4 mt-6 border border-k-border">
                {activeTimelineNode === 'today' && <><label className="text-xs text-k-muted block mb-2">¿Cómo describirías tu marca hoy?</label><input type="text" name="s_dna_q7_today" value={formData.s_dna_q7_today} onChange={handleTextChange} maxLength={80} className={inputClass} placeholder="Ej: Recién empezando, con pocas ventas..." /></>}
                {activeTimelineNode === 'm3' && <><label className="text-xs text-k-muted block mb-2">¿Qué quieres haber logrado en 3 meses?</label><input type="text" name="s_dna_q7_m3" value={formData.s_dna_q7_m3} onChange={handleTextChange} maxLength={80} className={inputClass} placeholder="Ej: Lanzar mi sitio web y tener 1000 seguidores..." /></>}
                {activeTimelineNode === 'm6' && <><label className="text-xs text-k-muted block mb-2">¿En qué punto esperas estar en 6 meses?</label><input type="text" name="s_dna_q7_m6" value={formData.s_dna_q7_m6} onChange={handleTextChange} maxLength={80} className={inputClass} placeholder="Ej: Duplicar mis ventas y tener un equipo de 2..." /></>}
                {activeTimelineNode === 'm12' && (
                  <>
                    <label className="text-xs text-k-text font-semibold block mb-2">¿Cuál es tu gran meta a 12 meses? *</label>
                    <input type="text" name="s_dna_q7_m12" value={formData.s_dna_q7_m12} onChange={handleTextChange} maxLength={80} className={inputClass} placeholder="Ej: Ser referente en mi ciudad y facturar 10k/mes..." />
                    <select name="s_dna_q7_goalType" value={formData.s_dna_q7_goalType} onChange={handleTextChange} className="w-full bg-k-surface text-k-text text-xs px-3 py-2 rounded outline-none mt-2 border border-k-border">
                      <option value="">Tipo de meta (Opcional)</option>
                      <option value="Facturación">Facturación / Ventas</option>
                      <option value="Comunidad">Comunidad / Seguidores</option>
                      <option value="Reconocimiento">Reconocimiento de marca</option>
                      <option value="Expansión">Expansión / Nuevo local</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </>
                )}
              </div>
            </Field>

            {/* Q8 */}
            <Field label="8. ¿Qué te motivó a querer trabajar tu marca justamente ahora?">
              <select name="s_dna_q8_cat" value={formData.s_dna_q8_cat} onChange={handleTextChange} className={`${inputClass} mb-2`}>
                <option value="">Selecciona un motivo...</option>
                {MOTIVATION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formData.s_dna_q8_cat && (
                <div className="relative">
                  <input type="text" name="s_dna_q8_text" value={formData.s_dna_q8_text} onChange={handleTextChange} maxLength={120} className={`${inputClass} pr-16`} placeholder="Si quieres contarnos más contexto, este es el lugar..." />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-k-muted">{formData.s_dna_q8_text.length}/120</span>
                </div>
              )}
            </Field>
          </div>
        )}

        {currentStep === 1 && formType === 'large' && ( // ── PASO 1: ESTRATEGIA (LARGE) ───────────────
          <div className="flex flex-col gap-6">
            
            {/* Q1 */}
            <Field label="1. Si su marca dejara de existir mañana, ¿qué vacío real dejaría en el mercado? ¿Qué los hace verdaderamente irremplazables?">
              <div className="relative">
                <textarea name="l_dna_q1" value={formData.l_dna_q1} onChange={handleTextChange} rows={4} maxLength={200} className={`${inputClass} pr-14 pb-6 resize-none`} placeholder="Ej: Somos la única plataforma que integra gestión financiera y logística en tiempo real para pymes latinoamericanas" />
                <span className="absolute right-3 bottom-2 text-xs text-k-muted">{formData.l_dna_q1.length}/200</span>
              </div>
            </Field>

            {/* Q2 */}
            <Field label="2. ¿Cuáles son los 3 valores que no son negociables en su negocio y que guían cada decisión estratégica?" description="Arrastra desde la izquierda hacia la derecha. Si su empresa ya tiene valores corporativos definidos, pueden ingresarlos directamente.">
              <div className="grid grid-cols-2 gap-4">
                {/* Disponibles */}
                <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={e => e.preventDefault()} onDrop={handleDropLQ2Available}>
                  <p className="text-k-muted text-xs font-semibold mb-2">Valores disponibles</p>
                  <div className="flex flex-wrap gap-2">
                    {availableLQ2.map(v => (
                      <div key={v} draggable onDragStart={e => handleDragStartQ2(e, v, 'available')} className="bg-k-surface border border-k-border text-k-text text-[11px] px-2 py-1.5 rounded cursor-grab active:cursor-grabbing hover:border-k-orange transition-colors">{v}</div>
                    ))}
                    <div className="flex w-full gap-2 mt-2">
                      <input type="text" value={customValueLQ2} onChange={e => setCustomValueLQ2(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customValueLQ2.trim() && formData.l_dna_q2.length < 3) { setFormData(prev => ({...prev, l_dna_q2: [...prev.l_dna_q2, customValueLQ2.trim()]})); setCustomValueLQ2('') } } }} placeholder="Agregar valor propio..." className="bg-k-surface text-k-text text-xs px-2 py-1.5 rounded border border-k-border outline-none flex-1" />
                      <button type="button" onClick={() => { if(customValueLQ2.trim() && formData.l_dna_q2.length < 3) { setFormData(prev => ({...prev, l_dna_q2: [...prev.l_dna_q2, customValueLQ2.trim()]})); setCustomValueLQ2('') } }} className="bg-k-surface2 text-k-muted hover:text-k-text px-2 py-1 rounded text-xs">+</button>
                    </div>
                  </div>
                </div>
                {/* Seleccionados */}
                <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-2" onDragOver={e => e.preventDefault()} onDrop={handleDropLQ2Selected}>
                  <p className="text-k-orange text-xs font-semibold mb-1">Valores estratégicos</p>
                  {formData.l_dna_q2.length === 0 && <p className="text-k-muted text-xs italic text-center mt-4">Arrastra aquí</p>}
                  {formData.l_dna_q2.map((v, i) => (
                    <div key={v} draggable onDragStart={e => handleDragStartQ2(e, v, 'selected')} className="bg-k-surface border border-k-orange text-k-text text-xs px-3 py-2 rounded flex items-center justify-between cursor-grab active:cursor-grabbing">
                      <span><span className="text-k-orange font-bold mr-2">{i+1}°</span> {v}</span>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, l_dna_q2: prev.l_dna_q2.filter(val => val !== v)}))} className="text-k-muted hover:text-red-400">×</button>
                    </div>
                  ))}
                </div>
              </div>
            </Field>

            {/* Q3 */}
            <Field label="3. ¿Cuál es el problema central que su producto o servicio resuelve y cómo impacta en la vida o negocio de sus clientes?">
              <select name="l_dna_q3_cat" value={formData.l_dna_q3_cat} onChange={handleTextChange} className={`${inputClass} mb-2`}>
                <option value="">Selecciona una categoría...</option>
                {CORP_PROBLEMS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {formData.l_dna_q3_cat && (
                <>
                  <select name="l_dna_q3_impact" value={formData.l_dna_q3_impact} onChange={handleTextChange} className={`${inputClass} mb-2`}>
                    <option value="">Selecciona el impacto principal...</option>
                    {CORP_IMPACTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="relative">
                    <textarea name="l_dna_q3_text" value={formData.l_dna_q3_text} onChange={handleTextChange} rows={2} maxLength={150} className={`${inputClass} pr-14 pb-6 resize-none`} placeholder="Describan brevemente cómo su solución resuelve este problema de forma concreta" />
                    <span className="absolute right-3 bottom-2 text-xs text-k-muted">{formData.l_dna_q3_text.length}/150</span>
                  </div>
                </>
              )}
            </Field>

            {/* Q4 */}
            <Field label="4. ¿Qué es aquello que hacen excepcionalmente bien y que su competencia no puede o no está dispuesta a replicar?" description="Piensen en lo que sus clientes más valoran y que difícilmente encuentran en otro lugar.">
              <div className="relative">
                <textarea name="l_dna_q4" value={formData.l_dna_q4} onChange={handleTextChange} rows={3} maxLength={250} className={`${inputClass} pr-14 pb-6 resize-none`} placeholder="Ej: Somos el único proveedor del sector que ofrece implementación en menos de 30 días..." />
                <span className="absolute right-3 bottom-2 text-xs text-k-muted">{formData.l_dna_q4.length}/250</span>
              </div>
            </Field>

            {/* Q5 */}
            <Field label="5. Si tuvieran que describir el tono de comunicación de su marca con 3 adjetivos, ¿cuáles serían?" description="Si ya cuentan con lineamientos, pueden compartirlos luego en la sección visual.">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-k-muted text-xs font-semibold mb-2">Tono que quieren proyectar</p>
                  <div className="flex flex-wrap gap-2">
                    {CORP_TONE_POSITIVE.map(adj => {
                      const active = formData.l_dna_q5.includes(adj);
                      const disabled = !active && formData.l_dna_q5.length >= 3;
                      return <button key={adj} type="button" disabled={disabled} onClick={() => handleLQ5Change(adj)} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${active ? 'bg-k-orange/10 border-k-orange text-k-orange font-medium' : disabled ? 'bg-k-surface2 opacity-40 border-transparent text-k-muted cursor-not-allowed' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}>{adj}</button>
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-k-muted text-xs font-semibold mb-2">Tono que quieren evitar</p>
                  <div className="flex flex-wrap gap-2">
                    {CORP_TONE_NEGATIVE.map(adj => {
                      const active = formData.l_dna_q5.includes(adj);
                      const disabled = !active && formData.l_dna_q5.length >= 3;
                      return <button key={adj} type="button" disabled={disabled} onClick={() => handleLQ5Change(adj)} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${active ? 'bg-red-500/10 border-red-500 text-red-500 font-medium' : disabled ? 'bg-k-surface2 opacity-40 border-transparent text-k-muted cursor-not-allowed' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}>{adj}</button>
                    })}
                  </div>
                </div>
                <div className="flex w-full sm:w-1/2 gap-2">
                  <input type="text" value={customValueLQ5} onChange={e => setCustomValueLQ5(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customValueLQ5.trim() && formData.l_dna_q5.length < 3) { handleLQ5Change(customValueLQ5.trim()); setCustomValueLQ5('') } } }} placeholder="+ Agregar atributo propio..." disabled={formData.l_dna_q5.length >= 3} className={`bg-k-surface2 text-k-text text-xs px-3 py-1.5 rounded-full border border-transparent outline-none flex-1 ${formData.l_dna_q5.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`} />
                  <button type="button" disabled={formData.l_dna_q5.length >= 3} onClick={() => { if(customValueLQ5.trim() && formData.l_dna_q5.length < 3) { handleLQ5Change(customValueLQ5.trim()); setCustomValueLQ5('') } }} className={`bg-k-surface2 text-k-text px-3 py-1.5 rounded-full text-xs ${formData.l_dna_q5.length >= 3 ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'}`}>+</button>
                </div>
              </div>
            </Field>

            {/* Q6 */}
            <Field label="6. ¿Qué marcas admiran y cuáles consideran su competencia? ¿Qué los distingue?" description="Ingresa nombres y arrástralos a las columnas (máx 6 marcas en total).">
              <div className="flex gap-2 mb-4">
                <input type="text" value={customBrandLQ6} onChange={e => setCustomBrandLQ6(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); const totalBrands = formData.l_dna_q6_pending.length + formData.l_dna_q6_admired.length + formData.l_dna_q6_comp_dir.length + formData.l_dna_q6_comp_ind.length; if(customBrandLQ6.trim() && totalBrands < 6) { setFormData(prev => ({...prev, l_dna_q6_pending: [...prev.l_dna_q6_pending, customBrandLQ6.trim()]})); setCustomBrandLQ6('') } else if (totalBrands >= 6) { showToast('Límite de 6 marcas alcanzado.', 'warning'); } } }} placeholder="Escribe una marca y presiona Enter..." className={`${inputClass} flex-1`} />
                <button type="button" onClick={() => { const totalBrands = formData.l_dna_q6_pending.length + formData.l_dna_q6_admired.length + formData.l_dna_q6_comp_dir.length + formData.l_dna_q6_comp_ind.length; if(customBrandLQ6.trim() && totalBrands < 6) { setFormData(prev => ({...prev, l_dna_q6_pending: [...prev.l_dna_q6_pending, customBrandLQ6.trim()]})); setCustomBrandLQ6('') } else if (totalBrands >= 6) { showToast('Límite de 6 marcas alcanzado.', 'warning'); } }} className="bg-k-surface2 text-k-text hover:brightness-110 px-4 py-2 rounded-card text-sm">Agregar</button>
              </div>
              
              <div className="flex gap-2 flex-wrap mb-4" onDragOver={e => e.preventDefault()} onDrop={e => handleDropLQ6(e, 'pending')}>
                {formData.l_dna_q6_pending.map(b => (
                   <span key={b} draggable onDragStart={e => handleDragStartQ2(e, b, 'pending')} className="bg-k-surface border border-k-border text-k-text text-xs px-3 py-1.5 rounded-full cursor-grab active:cursor-grabbing flex items-center gap-2">{b} <button type="button" onClick={() => removeBrandLQ6(b, 'pending')} className="text-k-muted hover:text-red-400">×</button></span>
                ))}
                {formData.l_dna_q6_pending.length === 0 && <span className="text-k-muted text-xs italic py-1.5">Marcas pendientes de clasificar...</span>}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 flex flex-col gap-2" onDragOver={e => e.preventDefault()} onDrop={e => handleDropLQ6(e, 'admired')}>
                  <p className="text-k-orange text-xs font-semibold mb-1">🌟 Referentes que admiramos</p>
                  {formData.l_dna_q6_admired.map(b => <div key={b} draggable onDragStart={e => handleDragStartQ2(e, b, 'admired')} className="bg-k-surface border border-k-orange text-k-text text-[11px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab">{b} <button type="button" onClick={() => removeBrandLQ6(b, 'admired')} className="text-k-muted hover:text-red-400">×</button></div>)}
                  <textarea name="l_dna_q6_admired_desc" value={formData.l_dna_q6_admired_desc} onChange={handleTextChange} rows={2} maxLength={120} className="w-full bg-k-surface text-k-text text-[10px] p-2 rounded mt-auto outline-none resize-none" placeholder="¿Qué es lo que más valoran de su comunicación?" />
                </div>
                <div className="bg-red-500/5 rounded-card p-3 border border-dashed border-red-500/50 flex flex-col gap-2" onDragOver={e => e.preventDefault()} onDrop={e => handleDropLQ6(e, 'compDir')}>
                  <p className="text-red-400 text-xs font-semibold mb-1">⚔️ Competencia directa</p>
                  {formData.l_dna_q6_comp_dir.map(b => <div key={b} draggable onDragStart={e => handleDragStartQ2(e, b, 'compDir')} className="bg-k-surface border border-red-500/50 text-k-text text-[11px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab">{b} <button type="button" onClick={() => removeBrandLQ6(b, 'compDir')} className="text-k-muted hover:text-red-400">×</button></div>)}
                  <textarea name="l_dna_q6_comp_dir_desc" value={formData.l_dna_q6_comp_dir_desc} onChange={handleTextChange} rows={2} maxLength={120} className="w-full bg-k-surface text-k-text text-[10px] p-2 rounded mt-auto outline-none resize-none" placeholder="¿Cuál es su principal diferenciador frente a ellos?" />
                </div>
                <div className="bg-blue-500/5 rounded-card p-3 border border-dashed border-blue-500/50 flex flex-col gap-2" onDragOver={e => e.preventDefault()} onDrop={e => handleDropLQ6(e, 'compInd')}>
                  <p className="text-blue-400 text-xs font-semibold mb-1">👀 Competencia indirecta</p>
                  {formData.l_dna_q6_comp_ind.map(b => <div key={b} draggable onDragStart={e => handleDragStartQ2(e, b, 'compInd')} className="bg-k-surface border border-blue-500/50 text-k-text text-[11px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab">{b} <button type="button" onClick={() => removeBrandLQ6(b, 'compInd')} className="text-k-muted hover:text-red-400">×</button></div>)}
                  <textarea name="l_dna_q6_comp_ind_desc" value={formData.l_dna_q6_comp_ind_desc} onChange={handleTextChange} rows={2} maxLength={120} className="w-full bg-k-surface text-k-text text-[10px] p-2 rounded mt-auto outline-none resize-none" placeholder="¿Por qué un cliente los elegiría a ustedes?" />
                </div>
              </div>
            </Field>

            {/* Q7 */}
            <Field label="7. ¿Cuál es la visión de su marca para los próximos 12 meses?" description="Haz clic en cada punto para establecer objetivos corporativos. Solo la meta a 12 meses es obligatoria.">
              <div className="flex items-center justify-between relative px-2 mb-6 mt-2">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-k-surface2 rounded-full -z-10"></div>
                {[ { id: 'today', label: 'Hoy' }, { id: 'm3', label: '3 meses' }, { id: 'm6', label: '6 meses' }, { id: 'm9', label: '9 meses' }, { id: 'm12', label: '12 meses' } ].map(node => (
                  <div key={node.id} className="flex flex-col items-center gap-2 relative">
                    <button type="button" onClick={() => setActiveTimelineNodeCorp(node.id)} className={`w-5 h-5 rounded-full transition-all border-4 ${activeTimelineNodeCorp === node.id ? 'bg-k-orange border-k-bg scale-125' : formData[`l_dna_q7_${node.id}`]?.goal.trim() ? 'bg-green-400 border-k-bg' : 'bg-k-surface2 border-k-bg hover:bg-k-orange/50'}`}></button>
                    <span className={`text-[10px] sm:text-xs font-medium absolute -bottom-6 whitespace-nowrap ${activeTimelineNodeCorp === node.id ? 'text-k-orange' : 'text-k-muted'}`}>{node.label}</span>
                  </div>
                ))}
              </div>
              <div className="bg-k-surface2/50 rounded-card p-4 mt-6 border border-k-border">
                <div className="grid grid-cols-1 gap-3">
                  <input type="text" value={formData[`l_dna_q7_${activeTimelineNodeCorp}`].goal} onChange={e => handleQ7CorpChange(activeTimelineNodeCorp, 'goal', e.target.value)} maxLength={80} className={inputClass} placeholder="¿Qué quieren haber logrado en este punto?" />
                  <input type="text" value={formData[`l_dna_q7_${activeTimelineNodeCorp}`].kpi} onChange={e => handleQ7CorpChange(activeTimelineNodeCorp, 'kpi', e.target.value)} maxLength={60} className={inputClass} placeholder="¿Cómo medirán que lo lograron? (Indicador de éxito)" />
                  <select value={formData[`l_dna_q7_${activeTimelineNodeCorp}`].type} onChange={e => handleQ7CorpChange(activeTimelineNodeCorp, 'type', e.target.value)} className="w-full bg-k-surface text-k-text text-sm px-4 py-3 rounded-card outline-none focus:ring-2 focus:ring-k-orange/30 border border-transparent transition-all cursor-pointer">
                    <option value="">Clasificación de la meta (Opcional)</option>
                    {CORP_GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </Field>

            {/* Q8 */}
            <Field label="8. ¿Qué contexto o motivación los llevó a querer fortalecer o renovar su presencia de marca en este momento?">
              <select name="l_dna_q8_cat" value={formData.l_dna_q8_cat} onChange={handleTextChange} className={`${inputClass} mb-3`}>
                <option value="">Selecciona el detonante principal...</option>
                {CORP_MOTIVATIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="relative">
                <textarea name="l_dna_q8_text" value={formData.l_dna_q8_text} onChange={handleTextChange} rows={2} maxLength={150} className={`${inputClass} pr-14 pb-6 resize-none`} placeholder="Si hay un contexto adicional que sea relevante para entender el momento de la empresa, este es el espacio" />
                <span className="absolute right-3 bottom-2 text-xs text-k-muted">{formData.l_dna_q8_text.length}/150</span>
              </div>
            </Field>
          </div>
        )}

        {currentStep === 2 && formType === 'small' && ( // ── PASO 2: VISUAL ───────────────────────────
          <div className="flex flex-col gap-6">
            
            {/* Q9 */}
            <Field label="9. ¿Tienes logo, manual de marca o paleta de colores definida?" description="Selecciona todo lo que tengas actualmente.">
              <div className="flex flex-col gap-2">
                {ASSETS_CHECKLIST.map(opt => (
                  <label key={opt} className={`flex items-center gap-2 text-sm cursor-pointer ${formData.s_visual_q9_none ? 'opacity-50' : ''}`}>
                    <input type="checkbox" checked={formData.s_visual_q9_assets.includes(opt)} disabled={formData.s_visual_q9_none} onChange={() => handleCheckboxChange('s_visual_q9_assets', opt)} className="w-4 h-4 accent-k-orange" /> {opt}
                  </label>
                ))}
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
                  <input type="checkbox" checked={formData.s_visual_q9_none} onChange={() => setFormData(p => ({ ...p, s_visual_q9_none: !p.s_visual_q9_none, s_visual_q9_assets: !p.s_visual_q9_none ? [] : p.s_visual_q9_assets }))} className="w-4 h-4 accent-k-orange" />
                  No tengo nada definido aún
                </label>
                
                {formData.s_visual_q9_assets.length > 0 && !formData.s_visual_q9_none && (
                  <div className="mt-3 p-4 bg-k-surface2 rounded-card border border-k-border">
                    <p className="text-k-text text-sm font-medium mb-1">Carga de archivos</p>
                    <p className="text-k-muted text-xs mb-3">Formatos aceptados: PDF, AI, PNG, SVG, ZIP (máx. 20MB)</p>
                    <div className="flex items-center gap-3">
                      <input type="file" accept=".pdf,.ai,.png,.svg,.zip" multiple className="text-xs text-k-muted file:mr-4 file:py-2 file:px-4 file:rounded-card file:border-0 file:text-xs file:font-semibold file:bg-k-orange/10 file:text-k-orange hover:file:bg-k-orange/20 cursor-pointer" />
                    </div>
                    <p className="text-k-muted text-[10px] mt-2 italic">O pega el enlace a tu carpeta de Drive si son muy pesados:</p>
                    <input type="text" name="s_visual_q9_link" value={formData.s_visual_q9_link} onChange={handleTextChange} placeholder="https://drive.google.com/..." className={`${inputClass} mt-1 py-2 text-xs`} />
                  </div>
                )}
                {formData.s_visual_q9_none && <p className="text-green-400 text-xs italic mt-2">Perfecto, partimos desde cero juntos.</p>}
              </div>
            </Field>

            {/* Q10 */}
            <Field label="10. ¿Hay colores que sí o sí deben estar en tu marca? ¿Y alguno que no va contigo?">
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                  <input type="checkbox" checked={formData.s_visual_q10_no_restrictions} onChange={() => setFormData(p => ({ ...p, s_visual_q10_no_restrictions: !p.s_visual_q10_no_restrictions }))} className="w-4 h-4 accent-k-orange" />
                  No tengo restricciones de color
                </label>
              </div>
              {!formData.s_visual_q10_no_restrictions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-green-500/5 rounded-card p-4 border border-green-500/20">
                    <p className="text-green-400 text-sm font-semibold mb-3 flex items-center gap-1"><FiCheck /> Colores que deben estar</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {formData.s_visual_q10_mandatory.map((c, i) => (
                        <div key={i} className="flex items-center gap-2"><input type="color" value={c} onChange={e => handleColorChange('s_visual_q10_mandatory', i, e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" /><input type="text" value={c} onChange={e => handleColorChange('s_visual_q10_mandatory', i, e.target.value)} className={`${inputClass} flex-1 py-1.5 text-xs`} /><button type="button" onClick={() => setFormData(p => ({...p, s_visual_q10_mandatory: p.s_visual_q10_mandatory.filter((_, idx) => idx !== i)}))} className="text-k-muted hover:text-red-400">×</button></div>
                      ))}
                      {formData.s_visual_q10_mandatory.length < 5 && <button type="button" onClick={() => handleAddColor('s_visual_q10_mandatory', 5)} className="text-xs text-green-400 bg-green-500/10 hover:bg-green-500/20 py-1.5 rounded transition-colors">+ Agregar color</button>}
                    </div>
                    <input type="text" name="s_visual_q10_mandatory_reason" value={formData.s_visual_q10_mandatory_reason} onChange={handleTextChange} maxLength={80} placeholder="¿Alguna razón especial para usarlos?" className={`${inputClass} text-xs py-2`} />
                  </div>
                  <div className="bg-red-500/5 rounded-card p-4 border border-red-500/20">
                    <p className="text-red-400 text-sm font-semibold mb-3 flex items-center gap-1"><FiX /> Colores que nunca usaría</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {formData.s_visual_q10_forbidden.map((c, i) => (
                        <div key={i} className="flex items-center gap-2"><input type="color" value={c} onChange={e => handleColorChange('s_visual_q10_forbidden', i, e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer" /><input type="text" value={c} onChange={e => handleColorChange('s_visual_q10_forbidden', i, e.target.value)} className={`${inputClass} flex-1 py-1.5 text-xs`} /><button type="button" onClick={() => setFormData(p => ({...p, s_visual_q10_forbidden: p.s_visual_q10_forbidden.filter((_, idx) => idx !== i)}))} className="text-k-muted hover:text-red-400">×</button></div>
                      ))}
                      {formData.s_visual_q10_forbidden.length < 3 && <button type="button" onClick={() => handleAddColor('s_visual_q10_forbidden', 3)} className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 py-1.5 rounded transition-colors">+ Agregar color</button>}
                    </div>
                    <input type="text" name="s_visual_q10_forbidden_reason" value={formData.s_visual_q10_forbidden_reason} onChange={handleTextChange} maxLength={80} placeholder="¿Por qué los descartarías?" className={`${inputClass} text-xs py-2`} />
                  </div>
                </div>
              )}
            </Field>

            {/* Q11 */}
            <Field label="11. Elige 3 palabras que describan cómo quieres que se vea tu marca visualmente." description="Selecciona hasta 3 conceptos.">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                {VISUAL_CONCEPTS_GRID.map(c => {
                  const active = formData.s_visual_q11_concepts.includes(c);
                  const disabled = !active && formData.s_visual_q11_concepts.length >= 3;
                  return (
                    <button key={c} type="button" disabled={disabled} onClick={() => { if(active) setFormData(p => ({...p, s_visual_q11_concepts: p.s_visual_q11_concepts.filter(v => v !== c)})); else if(formData.s_visual_q11_concepts.length < 3) setFormData(p => ({...p, s_visual_q11_concepts: [...p.s_visual_q11_concepts, c]})) }} className={`flex items-center gap-2 text-sm p-3 rounded-card transition-all border text-left ${active ? 'border-k-orange bg-k-orange/10 text-k-orange font-medium' : disabled ? 'border-transparent bg-k-surface2 opacity-40 cursor-not-allowed' : 'border-transparent bg-k-surface2 text-k-text hover:brightness-110'}`}>{c}</button>
                  )
                })}
              </div>
              <div className="flex w-full sm:w-1/2 gap-2">
                <input type="text" value={customConceptQ11} onChange={e => setCustomConceptQ11(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customConceptQ11.trim() && formData.s_visual_q11_concepts.length < 3) { setFormData(p => ({...p, s_visual_q11_concepts: [...p.s_visual_q11_concepts, customConceptQ11.trim()]})); setCustomConceptQ11('') } } }} placeholder="+ Agregar concepto propio..." disabled={formData.s_visual_q11_concepts.length >= 3} className={`bg-k-surface2 text-k-text text-sm px-4 py-2.5 rounded-card border border-transparent outline-none flex-1 ${formData.s_visual_q11_concepts.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`} />
                <button type="button" disabled={formData.s_visual_q11_concepts.length >= 3} onClick={() => { if(customConceptQ11.trim() && formData.s_visual_q11_concepts.length < 3) { setFormData(p => ({...p, s_visual_q11_concepts: [...p.s_visual_q11_concepts, customConceptQ11.trim()]})); setCustomConceptQ11('') } }} className={`bg-k-surface2 text-k-text px-4 py-2.5 rounded-card text-sm ${formData.s_visual_q11_concepts.length >= 3 ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'}`}>+</button>
              </div>
            </Field>

            {/* Q12 */}
            <Field label="12. Para tus videos, ¿prefieres algo dinámico y con mucho ritmo, o algo más tranquilo y cuidado?">
              <div className="bg-k-surface2/50 rounded-card p-4 border border-k-border">
                <input type="range" name="s_visual_q12_style_step" min="1" max="5" step="1" value={formData.s_visual_q12_style_step} onChange={handleTextChange} className="w-full accent-k-orange mb-2" />
                <div className="flex justify-between text-[10px] text-k-muted mb-4"><span>⚡ Dinámico</span><span>🧘 Contemplativo</span></div>
                <div className="bg-k-surface text-center py-2 rounded text-k-orange font-medium text-sm border border-k-orange/20">{getStyleDescription(formData.s_visual_q12_style_step)}</div>
              </div>
            </Field>

            {/* Q13 */}
            <Field label='13. Compártenos 3 cuentas o videos que te encanten y que digan "así quiero que se vea lo mío".' description="Puede ser una cuenta de Instagram, un video de TikTok o YouTube.">
              <div className="flex flex-col gap-4">
                {formData.s_visual_q13_references.map((ref, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 bg-k-surface2/30 rounded-card border border-k-border">
                    <input type="url" value={ref.url} onChange={e => handleArrayChange('s_visual_q13_references', i, 'url', e.target.value)} className={inputClass} placeholder={`Referencia ${i + 1} (URL)`} required={i === 0} />
                    {ref.url && <input type="text" value={ref.comment} onChange={e => handleArrayChange('s_visual_q13_references', i, 'comment', e.target.value)} maxLength={80} className={`${inputClass} text-xs py-2`} placeholder="¿Qué es lo que más te gusta de este contenido?" />}
                  </div>
                ))}
              </div>
            </Field>

            {/* Q14 */}
            <Field label="14. ¿Tienes fuentes o tipografías que uses actualmente, o partimos de cero?">
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-2 text-sm cursor-pointer"><input type="radio" name="s_visual_q14_typo_choice" value="definidas" checked={formData.s_visual_q14_typo_choice === 'definidas'} onChange={handleTextChange} className="accent-k-orange mt-1" /> <div><span className="font-medium">Sí, tengo tipografías definidas</span>{formData.s_visual_q14_typo_choice === 'definidas' && <input type="text" name="s_visual_q14_typo_custom" value={formData.s_visual_q14_typo_custom} onChange={handleTextChange} placeholder="Escribe el nombre de la fuente o pega un enlace..." className={`${inputClass} mt-2 py-2 text-xs w-full`} />}</div></label>
                <label className="flex items-start gap-2 text-sm cursor-pointer"><input type="radio" name="s_visual_q14_typo_choice" value="nuevas" checked={formData.s_visual_q14_typo_choice === 'nuevas'} onChange={handleTextChange} className="accent-k-orange mt-1" /> <div><span className="font-medium">Quiero explorar opciones nuevas</span>{formData.s_visual_q14_typo_choice === 'nuevas' && <select name="s_visual_q14_typo_style" value={formData.s_visual_q14_typo_style} onChange={handleTextChange} className={`${inputClass} mt-2 py-2 text-xs w-full`}><option value="">Selecciona un estilo preferido...</option><option value="Clásico">Clásico / Serif</option><option value="Moderno">Moderno / Sans-Serif</option><option value="Manuscrito">Manuscrito / Script</option><option value="Técnico">Técnico / Monospace</option></select>}</div></label>
                <label className="flex items-start gap-2 text-sm cursor-pointer"><input type="radio" name="s_visual_q14_typo_choice" value="orientacion" checked={formData.s_visual_q14_typo_choice === 'orientacion'} onChange={handleTextChange} className="accent-k-orange mt-1" /> <div><span className="font-medium">No estoy seguro, necesito orientación</span>{formData.s_visual_q14_typo_choice === 'orientacion' && <p className="text-green-400 text-xs italic mt-1">Tranquilo, lo vemos juntos en la primera reunión.</p>}</div></label>
              </div>
            </Field>

            {/* Q15 */}
            <Field label="15. ¿Usas algún elemento visual recurrente en tu comunicación?">
              <div className="flex flex-wrap gap-2 mb-3">
                {RECURRENT_ELEMENTS_CHIPS.map(el => (
                  <label key={el} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full cursor-pointer transition-colors border ${formData.s_visual_q15_none ? 'opacity-50 border-transparent bg-k-surface2' : formData.s_visual_q15_elements.includes(el) ? 'bg-k-orange/10 border-k-orange text-k-orange' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}><input type="checkbox" value={el} checked={formData.s_visual_q15_elements.includes(el)} disabled={formData.s_visual_q15_none} onChange={() => handleCheckboxChange('s_visual_q15_elements', el)} className="hidden" />{el}</label>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={formData.s_visual_q15_none} onChange={() => setFormData(p => ({ ...p, s_visual_q15_none: !p.s_visual_q15_none, s_visual_q15_elements: !p.s_visual_q15_none ? [] : p.s_visual_q15_elements }))} className="w-4 h-4 accent-k-orange" /> ❌ No uso elementos recurrentes aún</label>
                <div className="flex w-full sm:w-1/2 gap-2">
                  <input type="text" value={customElementQ15} onChange={e => setCustomElementQ15(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customElementQ15.trim() && !formData.s_visual_q15_none) { setFormData(p => ({...p, s_visual_q15_elements: [...p.s_visual_q15_elements, customElementQ15.trim()]})); setCustomElementQ15('') } } }} placeholder="+ Describir otro..." disabled={formData.s_visual_q15_none} className={`bg-k-surface2 text-k-text text-xs px-3 py-1.5 rounded-full border border-transparent outline-none flex-1 ${formData.s_visual_q15_none ? 'opacity-40 cursor-not-allowed' : ''}`} />
                  <button type="button" disabled={formData.s_visual_q15_none} onClick={() => { if(customElementQ15.trim() && !formData.s_visual_q15_none) { setFormData(p => ({...p, s_visual_q15_elements: [...p.s_visual_q15_elements, customElementQ15.trim()]})); setCustomElementQ15('') } }} className={`bg-k-surface2 text-k-text px-3 py-1.5 rounded-full text-xs ${formData.s_visual_q15_none ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'}`}>+</button>
                </div>
              </div>
            </Field>

            {/* Q16 */}
            <Field label="16. Del 1 al 10, ¿qué tan dispuesto estás a explorar un diseño arriesgado?">
              <div className="bg-k-surface2/50 rounded-card p-5 border border-k-border flex items-center gap-6">
                <div className="text-4xl font-black text-k-orange min-w-[50px] text-center shrink-0">{formData.s_visual_q16_risk}</div>
                <div className="flex-1">
                  <input type="range" name="s_visual_q16_risk" min="1" max="10" step="1" value={formData.s_visual_q16_risk} onChange={handleTextChange} className="w-full accent-k-orange mb-2" />
                  <div className="flex justify-between text-[10px] text-k-muted mb-2"><span>🛡️ Seguro</span><span>💥 Único</span></div>
                  <p className="text-k-text text-sm font-medium">{getRiskDescription(formData.s_visual_q16_risk)}</p>
                </div>
              </div>
            </Field>
          </div>
        )}

        {currentStep === 2 && formType === 'large' && ( // ── PASO 2: LINEAMIENTOS (LARGE) ──────────
          <div className="flex flex-col gap-6">
            
            {/* Q9 Corporate Assets */}
            <Field label="9. ¿Cuentan con manual de marca, logotipo oficial y paleta de colores definida?" description="Selecciona el estado de tus activos.">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mb-2 border-b border-k-border pb-2"><input type="checkbox" checked={formData.l_visual_q9_none} onChange={() => setFormData(p => ({...p, l_visual_q9_none: !p.l_visual_q9_none, l_visual_q9_assets: !p.l_visual_q9_none ? {} : p.l_visual_q9_assets}))} className="w-4 h-4 accent-k-orange" /> ❌ No contamos con esto aún</label>
                
                <div className={`flex flex-col gap-3 ${formData.l_visual_q9_none ? 'opacity-40 pointer-events-none' : ''}`}>
                  {CORP_ASSETS.map(a => (
                    <div key={a} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-k-surface2/50 rounded-card border border-k-border">
                      <span className="text-sm text-k-text">{a}</span>
                      <select value={formData.l_visual_q9_assets[a] || 'none'} onChange={e => handleCorpAssetChange(a, e.target.value)} className="bg-k-surface text-xs text-k-text px-2 py-1.5 rounded outline-none border border-k-border cursor-pointer min-w-[140px]">
                        <option value="none">No disponible</option>
                        <option value="available">✅ Disponible y actualizado</option>
                        <option value="outdated">🔄 Existe pero desactualizado</option>
                      </select>
                    </div>
                  ))}
                  
                  {Object.values(formData.l_visual_q9_assets).some(v => v === 'available' || v === 'outdated') && (
                    <div className="mt-2 p-4 bg-k-surface2 rounded-card border border-k-border">
                      <p className="text-k-text text-sm font-medium mb-1">Carga de archivos</p>
                      <p className="text-k-muted text-xs mb-3">Formatos aceptados: PDF, AI, EPS, PNG, SVG, ZIP, OTF, TTF (máx. 50MB)</p>
                      <input type="file" accept=".pdf,.ai,.eps,.png,.svg,.zip,.otf,.ttf" multiple className="text-xs text-k-muted file:mr-4 file:py-2 file:px-4 file:rounded-card file:border-0 file:font-semibold file:bg-k-orange/10 file:text-k-orange cursor-pointer mb-3" />
                      <p className="text-k-muted text-xs italic mb-1">Enlace a carpeta compartida (opcional si es muy pesado):</p>
                      <input type="url" name="l_visual_q9_link" value={formData.l_visual_q9_link} onChange={handleTextChange} placeholder="https://drive.google.com/..." className={inputClass} />
                    </div>
                  )}
                </div>
              </div>
            </Field>

            {/* Q10 Corporate Colors */}
            <Field label="10. ¿Existen colores corporativos de uso obligatorio o colores que por política deben evitarse?">
              <label className="flex items-center gap-2 text-sm cursor-pointer mb-4"><input type="checkbox" checked={formData.l_visual_q10_no_restrictions} onChange={() => setFormData(p => ({...p, l_visual_q10_no_restrictions: !p.l_visual_q10_no_restrictions}))} className="w-4 h-4 accent-k-orange" /> No tenemos restricciones de color definidas</label>
              
              {!formData.l_visual_q10_no_restrictions && (
                <div className="flex flex-col gap-4">
                  <div className="bg-green-500/5 rounded-card p-4 border border-green-500/20">
                    <p className="text-green-400 text-sm font-semibold mb-2">✅ Colores primarios obligatorios (Máx 3)</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {formData.l_visual_q10_primary.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 flex-wrap"><input type="color" value={c.hex} onChange={e => handleCorpColorChange('l_visual_q10_primary', i, 'hex', e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer shrink-0" /><input type="text" value={c.hex} onChange={e => handleCorpColorChange('l_visual_q10_primary', i, 'hex', e.target.value)} placeholder="HEX" className={`${inputClass} w-24 py-1.5 text-xs`} /><input type="text" value={c.pantone} onChange={e => handleCorpColorChange('l_visual_q10_primary', i, 'pantone', e.target.value)} placeholder="Pantone (opc)" className={`${inputClass} flex-1 py-1.5 text-xs min-w-[100px]`} /><input type="text" value={c.cmyk} onChange={e => handleCorpColorChange('l_visual_q10_primary', i, 'cmyk', e.target.value)} placeholder="CMYK (opc)" className={`${inputClass} flex-1 py-1.5 text-xs min-w-[100px]`} /><button type="button" onClick={() => setFormData(p => ({...p, l_visual_q10_primary: p.l_visual_q10_primary.filter((_, idx) => idx !== i)}))} className="text-k-muted hover:text-red-400 px-1">×</button></div>
                      ))}
                      {formData.l_visual_q10_primary.length < 3 && <button type="button" onClick={() => handleAddCorpColor('l_visual_q10_primary', 3)} className="text-xs text-green-400 self-start mt-1">+ Agregar color primario</button>}
                    </div>
                  </div>
                  <div className="bg-blue-500/5 rounded-card p-4 border border-blue-500/20">
                    <p className="text-blue-400 text-sm font-semibold mb-2">🔄 Colores secundarios o complementarios (Máx 5)</p>
                    <div className="flex flex-col gap-2">
                      {formData.l_visual_q10_secondary.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 flex-wrap"><input type="color" value={c.hex} onChange={e => handleCorpColorChange('l_visual_q10_secondary', i, 'hex', e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer shrink-0" /><input type="text" value={c.hex} onChange={e => handleCorpColorChange('l_visual_q10_secondary', i, 'hex', e.target.value)} placeholder="HEX" className={`${inputClass} w-24 py-1.5 text-xs`} /><input type="text" value={c.pantone} onChange={e => handleCorpColorChange('l_visual_q10_secondary', i, 'pantone', e.target.value)} placeholder="Pantone (opc)" className={`${inputClass} flex-1 py-1.5 text-xs min-w-[100px]`} /><input type="text" value={c.cmyk} onChange={e => handleCorpColorChange('l_visual_q10_secondary', i, 'cmyk', e.target.value)} placeholder="CMYK (opc)" className={`${inputClass} flex-1 py-1.5 text-xs min-w-[100px]`} /><button type="button" onClick={() => setFormData(p => ({...p, l_visual_q10_secondary: p.l_visual_q10_secondary.filter((_, idx) => idx !== i)}))} className="text-k-muted hover:text-red-400 px-1">×</button></div>
                      ))}
                      {formData.l_visual_q10_secondary.length < 5 && <button type="button" onClick={() => handleAddCorpColor('l_visual_q10_secondary', 5)} className="text-xs text-blue-400 self-start mt-1">+ Agregar color secundario</button>}
                    </div>
                  </div>
                  <div className="bg-red-500/5 rounded-card p-4 border border-red-500/20">
                    <p className="text-red-400 text-sm font-semibold mb-2">❌ Colores restringidos (Máx 3)</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {formData.l_visual_q10_forbidden.map((c, i) => (
                        <div key={i} className="flex items-center gap-2"><input type="color" value={c.hex} onChange={e => handleCorpColorChange('l_visual_q10_forbidden', i, 'hex', e.target.value)} className="w-8 h-8 rounded border-none p-0 cursor-pointer shrink-0" /><input type="text" value={c.hex} onChange={e => handleCorpColorChange('l_visual_q10_forbidden', i, 'hex', e.target.value)} placeholder="HEX" className={`${inputClass} flex-1 py-1.5 text-xs`} /><button type="button" onClick={() => setFormData(p => ({...p, l_visual_q10_forbidden: p.l_visual_q10_forbidden.filter((_, idx) => idx !== i)}))} className="text-k-muted hover:text-red-400 px-1">×</button></div>
                      ))}
                      {formData.l_visual_q10_forbidden.length < 3 && <button type="button" onClick={() => handleAddCorpColor('l_visual_q10_forbidden', 3)} className="text-xs text-red-400 self-start mt-1">+ Agregar color restringido</button>}
                    </div>
                    <input type="text" name="l_visual_q10_forbidden_reason" value={formData.l_visual_q10_forbidden_reason} onChange={handleTextChange} maxLength={80} placeholder="¿Por qué están restringidos?" className={`${inputClass} py-2 text-xs`} />
                  </div>
                </div>
              )}
            </Field>

            {/* Q11 Concepts */}
            <Field label="11. ¿Con qué 3 conceptos visuales describirían la identidad estética de su marca?" description="Selecciona hasta 3 de cualquier categoría.">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-k-muted text-xs font-semibold mb-2">Estilo estético</p>
                  <div className="flex flex-wrap gap-2">
                    {CORP_CONCEPTS_AESTHETIC.map(c => {
                      const active = formData.l_visual_q11_concepts.includes(c);
                      const disabled = !active && formData.l_visual_q11_concepts.length >= 3;
                      return <button key={c} type="button" disabled={disabled} onClick={() => handleLQ11Change(c)} className={`text-xs p-2 rounded-card transition-all border ${active ? 'border-k-orange bg-k-orange/10 text-k-orange' : disabled ? 'border-transparent bg-k-surface2 opacity-40 cursor-not-allowed' : 'border-transparent bg-k-surface2 text-k-text hover:brightness-110'}`}>{c}</button>
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-k-muted text-xs font-semibold mb-2">Carácter visual</p>
                  <div className="flex flex-wrap gap-2">
                    {CORP_CONCEPTS_CHARACTER.map(c => {
                      const active = formData.l_visual_q11_concepts.includes(c);
                      const disabled = !active && formData.l_visual_q11_concepts.length >= 3;
                      return <button key={c} type="button" disabled={disabled} onClick={() => handleLQ11Change(c)} className={`text-xs p-2 rounded-card transition-all border ${active ? 'border-k-orange bg-k-orange/10 text-k-orange' : disabled ? 'border-transparent bg-k-surface2 opacity-40 cursor-not-allowed' : 'border-transparent bg-k-surface2 text-k-text hover:brightness-110'}`}>{c}</button>
                    })}
                  </div>
                </div>
                <div className="flex w-full sm:w-1/2 gap-2 mt-1">
                  <input type="text" value={customConceptLQ11} onChange={e => setCustomConceptLQ11(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customConceptLQ11.trim() && formData.l_visual_q11_concepts.length < 3) { handleLQ11Change(customConceptLQ11.trim()); setCustomConceptLQ11('') } } }} placeholder="+ Agregar concepto propio..." disabled={formData.l_visual_q11_concepts.length >= 3} className={`bg-k-surface2 text-k-text text-xs px-3 py-2 rounded-card border border-transparent outline-none flex-1 ${formData.l_visual_q11_concepts.length >= 3 ? 'opacity-40 cursor-not-allowed' : ''}`} />
                  <button type="button" disabled={formData.l_visual_q11_concepts.length >= 3} onClick={() => { if(customConceptLQ11.trim() && formData.l_visual_q11_concepts.length < 3) { handleLQ11Change(customConceptLQ11.trim()); setCustomConceptLQ11('') } }} className={`bg-k-surface2 text-k-text px-3 py-2 rounded-card text-xs ${formData.l_visual_q11_concepts.length >= 3 ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110'}`}>+</button>
                </div>
              </div>
            </Field>

            {/* Q12 Edit Style */}
            <Field label="12. En cuanto al estilo de edición de video, ¿se inclinan por un montaje dinámico o por un formato más sobrio?">
              <div className="bg-k-surface2/50 rounded-card p-4 border border-k-border mb-3">
                <input type="range" name="l_visual_q12_style_step" min="1" max="5" step="1" value={formData.l_visual_q12_style_step} onChange={handleTextChange} className="w-full accent-k-orange mb-3" />
                <div className="flex justify-between text-[10px] text-k-muted mb-4 font-semibold uppercase tracking-wider"><span>⚡ Alto impacto</span><span>🎬 Corporativo</span></div>
                <p className="bg-k-surface text-center p-3 rounded text-k-orange text-xs border border-k-orange/20 leading-relaxed font-medium">{getCorpStyleDescription(formData.l_visual_q12_style_step)}</p>
              </div>
              <input type="text" name="l_visual_q12_details" value={formData.l_visual_q12_details} onChange={handleTextChange} maxLength={100} className={`${inputClass} text-xs`} placeholder="¿Hay algún canal específico donde el estilo deba ser diferente?" />
            </Field>

            {/* Q13 References */}
            <Field label="13. ¿Podrían compartir 3 referencias de contenido que representen el estilo visual al que aspiran?" description="Pueden ser de otras industrias.">
              <div className="flex flex-col gap-4">
                {formData.l_visual_q13_references.map((ref, i) => (
                  <div key={i} className="flex flex-col gap-3 p-4 bg-k-surface2/30 rounded-card border border-k-border">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input type="url" value={ref.url} onChange={e => handleArrayChange('l_visual_q13_references', i, 'url', e.target.value)} className={`${inputClass} flex-[2]`} placeholder={`URL de referencia ${i + 1}`} required={i === 0} />
                      {ref.url && <select value={ref.platform} onChange={e => handleArrayChange('l_visual_q13_references', i, 'platform', e.target.value)} className={`${inputClass} flex-1 py-2 text-xs cursor-pointer`}><option value="">Plataforma...</option>{CORP_REF_PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}</select>}
                    </div>
                    {ref.url && (
                      <div className="flex flex-col gap-3">
                        <input type="text" value={ref.like} onChange={e => handleArrayChange('l_visual_q13_references', i, 'like', e.target.value)} maxLength={100} className={`${inputClass} text-xs py-2`} placeholder="¿Qué les gusta de este contenido? Ej: El ritmo, la paleta..." />
                        <select value={ref.aspiration} onChange={e => handleArrayChange('l_visual_q13_references', i, 'aspiration', e.target.value)} className={`${inputClass} text-xs py-2 cursor-pointer`}><option value="">Nivel de aspiración...</option>{CORP_REF_ASPIRATIONS.map(a => <option key={a} value={a}>{a}</option>)}</select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Field>

            {/* Q14 Typography */}
            <Field label="14. ¿Cuentan con tipografías corporativas definidas o están abiertos a explorar opciones que aporten frescura?">
              <div className="flex flex-col gap-3">
                <label className="flex items-start gap-2 text-sm cursor-pointer"><input type="radio" name="l_visual_q14_typo_choice" value="definidas" checked={formData.l_visual_q14_typo_choice === 'definidas'} onChange={handleTextChange} className="accent-k-orange mt-1" /> <div className="flex-1"><span className="font-medium text-k-text">Sí, tenemos tipografías corporativas con licencias</span>{formData.l_visual_q14_typo_choice === 'definidas' && <div className="mt-3 flex flex-col gap-3 bg-k-surface2 p-4 rounded-card border border-k-border"><input type="text" name="l_visual_q14_typo_name" value={formData.l_visual_q14_typo_name} onChange={handleTextChange} maxLength={100} placeholder="Nombres de las fuentes..." className={`${inputClass} text-xs py-2`} /><input type="file" accept=".otf,.ttf,.zip" className="text-xs text-k-muted file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-k-orange/10 file:text-k-orange cursor-pointer" /><select name="l_visual_q14_typo_in_manual" value={formData.l_visual_q14_typo_in_manual} onChange={handleTextChange} className={`${inputClass} text-xs py-2`}><option value="">¿Están incluidas en el manual de marca?</option><option value="si">Sí, están en el manual</option><option value="no">No, se manejan aparte</option></select></div>}</div></label>
                <label className="flex items-start gap-2 text-sm cursor-pointer"><input type="radio" name="l_visual_q14_typo_choice" value="actualizar" checked={formData.l_visual_q14_typo_choice === 'actualizar'} onChange={handleTextChange} className="accent-k-orange mt-1" /> <div className="flex-1"><span className="font-medium text-k-text">Tenemos tipografías pero estamos abiertos a actualizarlas</span>{formData.l_visual_q14_typo_choice === 'actualizar' && <div className="mt-3 flex flex-col gap-3 bg-k-surface2 p-4 rounded-card border border-k-border"><input type="text" name="l_visual_q14_typo_missing" value={formData.l_visual_q14_typo_missing} onChange={handleTextChange} maxLength={120} placeholder="¿Qué sienten que falta en sus tipografías actuales?" className={`${inputClass} text-xs py-2`} /><select name="l_visual_q14_typo_direction" value={formData.l_visual_q14_typo_direction} onChange={handleTextChange} className={`${inputClass} text-xs py-2 cursor-pointer`}><option value="">Dirección buscada...</option>{CORP_TYPO_DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>}</div></label>
                <label className="flex items-start gap-2 text-sm cursor-pointer"><input type="radio" name="l_visual_q14_typo_choice" value="cero" checked={formData.l_visual_q14_typo_choice === 'cero'} onChange={handleTextChange} className="accent-k-orange mt-1" /> <div className="flex-1"><span className="font-medium text-k-text">No tenemos tipografías definidas, partimos desde cero</span>{formData.l_visual_q14_typo_choice === 'cero' && <p className="text-green-400 text-xs italic mt-2">Perfecto, lo trabajamos como parte del proceso creativo.</p>}</div></label>
              </div>
            </Field>

            {/* Q15 Graphic Elements */}
            <Field label="15. ¿Existen elementos gráficos recurrentes en su comunicación actual?">
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2 text-sm font-medium cursor-pointer border-b border-k-border pb-2"><input type="checkbox" checked={formData.l_visual_q15_none} onChange={() => setFormData(p => ({...p, l_visual_q15_none: !p.l_visual_q15_none, l_visual_q15_elements: !p.l_visual_q15_none ? {} : p.l_visual_q15_elements}))} className="w-4 h-4 accent-k-orange" /> ❌ No contamos con elementos definidos aún</label>
                
                <div className={`flex flex-col gap-2 ${formData.l_visual_q15_none ? 'opacity-40 pointer-events-none' : ''}`}>
                  {CORP_ELEMENTS.map(el => {
                    const isActive = !!formData.l_visual_q15_elements[el];
                    return (
                      <div key={el} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-card border transition-colors ${isActive ? 'bg-k-orange/5 border-k-orange/50' : 'bg-k-surface2/50 border-k-border'}`}>
                        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={isActive} onChange={() => handleCorpElementChange(el, isActive ? 'none' : 'works_well')} className="w-4 h-4 accent-k-orange" /> {el}</label>
                        {isActive && (
                          <select value={formData.l_visual_q15_elements[el]} onChange={e => handleCorpElementChange(el, e.target.value)} className="bg-k-surface text-xs text-k-text px-2 py-1.5 rounded outline-none border border-k-orange/30 cursor-pointer w-full sm:w-auto">
                            <option value="works_well">✅ Funciona bien</option>
                            <option value="needs_update">🔄 Necesita actualización</option>
                          </select>
                        )}
                      </div>
                    )
                  })}
                  <div className="flex gap-2 mt-1">
                    <input type="text" value={customElementLQ15} onChange={e => setCustomElementLQ15(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customElementLQ15.trim()) { handleCorpElementChange(customElementLQ15.trim(), 'works_well'); setCustomElementLQ15('') } } }} placeholder="+ Agregar otro elemento..." className={`${inputClass} text-xs flex-1`} />
                    <button type="button" onClick={() => { if(customElementLQ15.trim()) { handleCorpElementChange(customElementLQ15.trim(), 'works_well'); setCustomElementLQ15('') } }} className="bg-k-surface2 text-k-text px-3 py-1.5 rounded-card text-xs hover:brightness-110">Agregar</button>
                  </div>
                  <input type="text" name="l_visual_q15_untouchable" value={formData.l_visual_q15_untouchable} onChange={handleTextChange} maxLength={120} className={`${inputClass} text-xs mt-2 py-2`} placeholder="¿Hay algún elemento que quieran conservar o que sea intocable?" />
                </div>
              </div>
            </Field>

            {/* Q16 Disruption Risk */}
            <Field label="16. En una escala del 1 al 10, ¿qué nivel de disrupción visual están dispuestos a explorar?">
              <div className="bg-k-surface2/50 rounded-card p-5 border border-k-border mb-3 flex items-center gap-6">
                <div className="text-4xl font-black text-k-orange min-w-[50px] text-center shrink-0">{formData.l_visual_q16_risk}</div>
                <div className="flex-1">
                  <input type="range" name="l_visual_q16_risk" min="1" max="10" step="1" value={formData.l_visual_q16_risk} onChange={handleTextChange} className="w-full accent-k-orange mb-2" />
                  <div className="flex justify-between text-[10px] text-k-muted mb-2 font-medium uppercase tracking-wider"><span>Conservador</span><span>Ruptura total</span></div>
                  <p className="text-k-text text-sm font-medium leading-snug">{getCorpRiskDescription(formData.l_visual_q16_risk)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <select name="l_visual_q16_channels" value={formData.l_visual_q16_channels} onChange={handleTextChange} className={`${inputClass} text-xs py-2.5 cursor-pointer`}>
                  <option value="">¿Este nivel aplica para todos los canales?</option>
                  {CORP_RISK_CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="text" name="l_visual_q16_restrictions" value={formData.l_visual_q16_restrictions} onChange={handleTextChange} maxLength={100} className={`${inputClass} text-xs`} placeholder="Si tienen restricciones corporativas, indíquenlas aquí..." />
              </div>
            </Field>
          </div>
        )}

        {currentStep === 3 && formType === 'small' && ( // ── PASO 3: CLIENTE ──────────────────────────
          <div className="flex flex-col gap-6">
            
            {/* Q17 */}
            <Field label="17. ¿Cómo es la persona que más te compra?">
              <div className="space-y-4">
                <div><p className="text-k-muted text-xs mb-2">Edad:</p><div className="flex flex-wrap gap-2">{['18-24', '25-34', '35-44', '45-54', '55+'].map(age => <button key={age} type="button" onClick={() => setFormData(p => ({ ...p, s_client_q17_age: age }))} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${formData.s_client_q17_age === age ? 'bg-k-orange/10 border-k-orange text-k-orange font-medium' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}>{age}</button>)}</div></div>
                <div><p className="text-k-muted text-xs mb-2">¿Dónde vive?:</p><input type="text" name="s_client_q17_location" value={formData.s_client_q17_location} onChange={handleTextChange} className={inputClass} placeholder="Región/País o 'Internacional'" /></div>
                <div><p className="text-k-muted text-xs mb-2">¿A qué se dedica? (máx. 3):</p><div className="grid grid-cols-2 gap-2">{OCCUPATIONS_Q17.map(occ => <label key={occ} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" value={occ} checked={formData.s_client_q17_occupation.includes(occ)} onChange={() => { if(formData.s_client_q17_occupation.includes(occ)) { handleCheckboxChange('s_client_q17_occupation', occ) } else if (formData.s_client_q17_occupation.length < 3) { handleCheckboxChange('s_client_q17_occupation', occ) } }} className="w-4 h-4 accent-k-orange" />{occ}</label>)}</div></div>
                <div><p className="text-k-muted text-xs mb-2">Detalles adicionales:</p><input type="text" name="s_client_q17_details" value={formData.s_client_q17_details} onChange={handleTextChange} maxLength={100} className={inputClass} placeholder="¿Algo más que quieras contarnos sobre quién te compra?" /></div>
              </div>
            </Field>

            {/* Q18 */}
            <Field label="18. ¿Qué es lo que más le preocupa o frustra a tu cliente?" description="Arrastra y ordena las 3 frustraciones más relevantes.">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 's_client_q18_ranked', 'remove', null)}>
                  <p className="text-k-muted text-xs font-semibold mb-2">Frustraciones disponibles</p>
                  <div className="flex flex-col gap-2">
                    {FRUSTRATIONS_Q18.filter(f => !formData.s_client_q18_ranked.includes(f)).map(f => <div key={f} draggable onDragStart={e => handleDragStartRank(e, f)} className="bg-k-surface border border-k-border text-k-text text-xs px-2.5 py-1.5 rounded cursor-grab">{f}</div>)}
                    <input type="text" value={customFrustrationQ18} onChange={e => setCustomFrustrationQ18(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customFrustrationQ18.trim() && formData.s_client_q18_ranked.length < 3) { setFormData(p => ({...p, s_client_q18_ranked: [...p.s_client_q18_ranked, customFrustrationQ18.trim()]})); setCustomFrustrationQ18('') } } }} placeholder="+ Agregar otra frustración" className="bg-k-surface text-k-text text-xs px-2 py-1.5 rounded border border-k-border outline-none mt-2" />
                  </div>
                </div>
                <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-2" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 's_client_q18_ranked', 'add', 3)}>
                  <p className="text-k-orange text-xs font-semibold mb-1">Top 3 Frustraciones</p>
                  {formData.s_client_q18_ranked.map((f, i) => <div key={f} draggable onDragStart={e => handleDragStartRank(e, f)} className="bg-k-surface border border-k-orange text-k-text text-xs px-3 py-2 rounded flex items-center justify-between cursor-grab"><span><span className="text-k-orange font-bold mr-2">{i+1}°</span> {f}</span><button type="button" onClick={() => setFormData(p => ({...p, s_client_q18_ranked: p.s_client_q18_ranked.filter(item => item !== f)}))} className="text-k-muted hover:text-red-400">×</button></div>)}
                </div>
              </div>
            </Field>

            {/* Q19 */}
            <Field label="19. ¿En qué redes sociales pasa más tiempo tu cliente y qué consume ahí?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-k-muted text-xs mb-2">Plataformas (ordena el top 3):</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 's_client_q19_platforms', 'remove')}>
                      <p className="text-k-muted text-[10px] font-semibold mb-2">Disponibles</p>
                      <div className="flex flex-col gap-1">
                        {SOCIAL_PLATFORMS_Q19.filter(p => !formData.s_client_q19_platforms.includes(p)).map(p => <div key={p} draggable onDragStart={e => handleDragStartRank(e, p)} className="bg-k-surface border border-k-border text-k-text text-xs px-2 py-1 rounded cursor-grab">{p}</div>)}
                      </div>
                    </div>
                    <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-1" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 's_client_q19_platforms', 'add', 3)}>
                      <p className="text-k-orange text-[10px] font-semibold mb-1">Top 3</p>
                      {formData.s_client_q19_platforms.map((p, i) => <div key={p} draggable onDragStart={e => handleDragStartRank(e, p)} className="bg-k-surface border border-k-orange text-k-text text-xs px-2 py-1 rounded flex items-center justify-between cursor-grab"><span><span className="text-k-orange font-bold mr-1">{i+1}°</span> {p}</span><button type="button" onClick={() => setFormData(prev => ({...prev, s_client_q19_platforms: prev.s_client_q19_platforms.filter(item => item !== p)}))} className="text-k-muted hover:text-red-400">×</button></div>)}
                    </div>
                  </div>
                </div>
                <div><p className="text-k-muted text-xs mb-2">Tipo de contenido (máx. 3):</p><div className="flex flex-col gap-2">{CONTENT_TYPES_Q19.map(c => <label key={c} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" value={c} checked={formData.s_client_q19_content_types.includes(c)} onChange={() => { if(formData.s_client_q19_content_types.includes(c)) { handleCheckboxChange('s_client_q19_content_types', c) } else if (formData.s_client_q19_content_types.length < 3) { handleCheckboxChange('s_client_q19_content_types', c) } }} className="w-4 h-4 accent-k-orange" />{c}</label>)}</div></div>
              </div>
            </Field>

            {/* Q20 */}
            <Field label="20. ¿Cuál es el miedo o la duda que le impide comprarte por primera vez?">
              <select name="s_client_q20_barrier" value={formData.s_client_q20_barrier} onChange={handleTextChange} className={`${inputClass} mb-3`}>
                <option value="">Selecciona la barrera principal...</option>
                {BARRIERS_Q20.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {formData.s_client_q20_barrier && <input type="text" name="s_client_q20_response" value={formData.s_client_q20_response} onChange={handleTextChange} maxLength={120} className={inputClass} placeholder="¿Cómo sueles responder a esa duda cuando aparece?" />}
            </Field>

            {/* Q21 */}
            <Field label="21. ¿Cómo quiere sentirse tu cliente después de trabajar contigo?" description="Arrastra las emociones a las columnas correspondientes.">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-green-500/5 rounded-card p-3 border border-dashed border-green-500/20 min-h-[120px]" onDragOver={handleDragOverRank} onDrop={e => handleDropFeeling(e, 's_client_q21_positive', 4)}><p className="text-green-400 text-xs font-semibold mb-2">✅ Así quiero que se sienta (máx 4)</p><div className="flex flex-col gap-1">{formData.s_client_q21_positive.map(f => <div key={f} draggable onDragStart={e => handleDragStartRank(e, f)} className="bg-k-surface border border-k-border text-k-text text-xs p-1.5 rounded flex items-center justify-between cursor-grab"><span>{f}</span><button type="button" onClick={() => setFormData(p => ({...p, s_client_q21_positive: p.s_client_q21_positive.filter(item => item !== f)}))} className="text-k-muted hover:text-red-400">×</button></div>)}</div></div>
                <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[120px]" onDragOver={handleDragOverRank} onDrop={e => handleDropFeeling(e, null, null)}><p className="text-k-muted text-xs font-semibold mb-2">Emociones disponibles</p><div className="flex flex-col gap-1">{FEELINGS_Q21.filter(f => !formData.s_client_q21_positive.includes(f) && !formData.s_client_q21_negative.includes(f)).map(f => <div key={f} draggable onDragStart={e => handleDragStartRank(e, f)} className="bg-k-surface border border-k-border text-k-text text-xs p-1.5 rounded cursor-grab">{f}</div>)}</div></div>
                <div className="bg-red-500/5 rounded-card p-3 border border-dashed border-red-500/20 min-h-[120px]" onDragOver={handleDragOverRank} onDrop={e => handleDropFeeling(e, 's_client_q21_negative', null)}><p className="text-red-400 text-xs font-semibold mb-2">❌ Esto no aplica para mí</p><div className="flex flex-col gap-1">{formData.s_client_q21_negative.map(f => <div key={f} draggable onDragStart={e => handleDragStartRank(e, f)} className="bg-k-surface border border-k-border text-k-text text-xs p-1.5 rounded flex items-center justify-between cursor-grab"><span>{f}</span><button type="button" onClick={() => setFormData(p => ({...p, s_client_q21_negative: p.s_client_q21_negative.filter(item => item !== f)}))} className="text-k-muted hover:text-red-400">×</button></div>)}</div></div>
              </div>
              <input type="text" name="s_client_q21_details" value={formData.s_client_q21_details} onChange={handleTextChange} maxLength={100} className={`${inputClass} mt-3`} placeholder="Detalles adicionales (opcional)" />
            </Field>

            {/* Q22 */}
            <Field label="22. ¿Qué otros temas le apasionan a tu cliente fuera de lo que tú ofreces?">
              <div className="space-y-4">
                <div><p className="text-k-muted text-xs mb-2">Tecnología y negocios:</p><div className="flex flex-wrap gap-2">{INTERESTS_TECH.map(i => <label key={i} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" value={i} checked={formData.s_client_q22_interests.includes(i)} onChange={() => handleCheckboxChange('s_client_q22_interests', i)} className="w-4 h-4 accent-k-orange" />{i}</label>)}</div></div>
                <div><p className="text-k-muted text-xs mb-2">Estilo de vida:</p><div className="flex flex-wrap gap-2">{INTERESTS_LIFESTYLE.map(i => <label key={i} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" value={i} checked={formData.s_client_q22_interests.includes(i)} onChange={() => handleCheckboxChange('s_client_q22_interests', i)} className="w-4 h-4 accent-k-orange" />{i}</label>)}</div></div>
                <div><p className="text-k-muted text-xs mb-2">Cultura y sociedad:</p><div className="flex flex-wrap gap-2">{INTERESTS_CULTURE.map(i => <label key={i} className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" value={i} checked={formData.s_client_q22_interests.includes(i)} onChange={() => handleCheckboxChange('s_client_q22_interests', i)} className="w-4 h-4 accent-k-orange" />{i}</label>)}</div></div>
                <input type="text" value={customInterestQ22} onChange={e => setCustomInterestQ22(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customInterestQ22.trim()) { setFormData(p => ({...p, s_client_q22_interests: [...p.s_client_q22_interests, customInterestQ22.trim()]})); setCustomInterestQ22('') } } }} placeholder="+ Agregar interés propio" className={`${inputClass} text-sm`} />
              </div>
            </Field>

            {/* Q23 */}
            <Field label="23. ¿Cómo habla tu cliente? ¿Informal, técnico, o con lenguaje propio de su industria?">
              <div className="space-y-4">
                <div><p className="text-k-muted text-xs mb-2">Registro:</p><input type="range" name="s_client_q23_register_slider" min="0" max="100" value={formData.s_client_q23_register_slider} onChange={handleTextChange} className="w-full accent-k-orange" /><div className="flex justify-between text-xs text-k-muted mt-1"><span>💬 Muy informal</span><span>📋 Muy formal</span></div></div>
                <div><p className="text-k-muted text-xs mb-2">Especialización:</p><input type="range" name="s_client_q23_specialization_slider" min="0" max="100" value={formData.s_client_q23_specialization_slider} onChange={handleTextChange} className="w-full accent-k-orange" /><div className="flex justify-between text-xs text-k-muted mt-1"><span>🙋 Lenguaje general</span><span>🔬 Muy técnico</span></div></div>
                <input type="text" name="s_client_q23_phrases" value={formData.s_client_q23_phrases} onChange={handleTextChange} maxLength={100} className={inputClass} placeholder="¿Hay alguna palabra o frase que use mucho?" />
              </div>
            </Field>

            {/* Q24 */}
            <Field label="24. ¿En qué momento exacto de su día o de su vida decide que necesita lo que tú ofreces?">
              <select name="s_client_q24_trigger" value={formData.s_client_q24_trigger} onChange={handleTextChange} className={`${inputClass} mb-2`}>
                <option value="">Selecciona el momento desencadenante...</option>
                {TRIGGERS_Q24.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {formData.s_client_q24_trigger && <input type="text" name="s_client_q24_details" value={formData.s_client_q24_details} onChange={handleTextChange} maxLength={100} className={inputClass} placeholder="¿Puedes darnos más detalles de ese momento?" required={formData.s_client_q24_trigger === '✏️ Otro momento'} />}
            </Field>
          </div>
        )}

        {currentStep === 3 && formType === 'large' && ( // ── PASO 3: OPERACIONES (LARGE) ───────────
          <div className="flex flex-col gap-6">
            
            {/* Q17 Demographics */}
            <Field label="17. ¿Cómo describirían a su cliente ideal en términos de perfil demográfico?">
              <div className="space-y-4">
                <div><p className="text-k-muted text-xs mb-2">Rango de edad del decisor:</p><div className="flex flex-wrap gap-2">{CORP_Q17_AGES.map(age => <button key={age} type="button" onClick={() => setFormData(p => ({ ...p, l_client_q17_age: age }))} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${formData.l_client_q17_age === age ? 'bg-k-orange/10 border-k-orange text-k-orange font-medium' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}>{age}</button>)}</div></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><p className="text-k-muted text-xs mb-2">Ubicación principal:</p><input type="text" name="l_client_q17_location" value={formData.l_client_q17_location} onChange={handleTextChange} className={inputClass} placeholder="País/Región u 'Operación internacional'" /></div>
                  <div><p className="text-k-muted text-xs mb-2">Sector o industria:</p><input type="text" name="l_client_q17_sector" value={formData.l_client_q17_sector} onChange={handleTextChange} className={inputClass} placeholder="Industria o 'Múltiples sectores'" /></div>
                </div>
                <div><p className="text-k-muted text-xs mb-2">Tamaño de la empresa cliente:</p><select name="l_client_q17_size" value={formData.l_client_q17_size} onChange={handleTextChange} className={`${inputClass} cursor-pointer`}><option value="">Selecciona el tamaño...</option>{CORP_Q17_SIZES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><p className="text-k-muted text-xs mb-2">¿Su cliente es el usuario final o el tomador de decisión?:</p><div className="flex flex-wrap gap-2">{CORP_Q17_DECISIONS.map(d => <button key={d} type="button" onClick={() => setFormData(p => ({ ...p, l_client_q17_decision: d }))} className={`px-3 py-1.5 rounded-full text-xs transition-all border ${formData.l_client_q17_decision === d ? 'bg-k-orange/10 border-k-orange text-k-orange font-medium' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}>{d}</button>)}</div></div>
                <input type="text" name="l_client_q17_details" value={formData.l_client_q17_details} onChange={handleTextChange} maxLength={150} className={`${inputClass} text-xs`} placeholder="Si tienen más de un perfil de cliente relevante, descríbanlo brevemente aquí" />
              </div>
            </Field>

            {/* Q18 Pain Points */}
            <Field label="18. ¿Cuáles son los principales puntos de dolor que enfrenta su cliente en relación con lo que ustedes ofrecen?" description="Arrastra al top 3 de mayor a menor impacto.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 'l_client_q18_ranked', 'remove', null)}>
                  <p className="text-k-muted text-xs font-semibold mb-2">Pain points disponibles</p>
                  <div className="flex flex-col gap-2">
                    {CORP_Q18_PAINS.filter(f => !formData.l_client_q18_ranked.includes(f)).map(f => <div key={f} draggable onDragStart={e => handleDragStartRank(e, f)} className="bg-k-surface border border-k-border text-k-text text-[10px] px-2 py-1.5 rounded cursor-grab leading-tight">{f}</div>)}
                    <input type="text" value={customFrustrationLQ18} onChange={e => setCustomFrustrationLQ18(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customFrustrationLQ18.trim() && formData.l_client_q18_ranked.length < 3) { setFormData(p => ({...p, l_client_q18_ranked: [...p.l_client_q18_ranked, customFrustrationLQ18.trim()]})); setCustomFrustrationLQ18('') } } }} placeholder="+ Agregar pain point propio" className="bg-k-surface text-k-text text-xs px-2 py-1.5 rounded border border-k-border outline-none mt-2" />
                  </div>
                </div>
                <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-2" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 'l_client_q18_ranked', 'add', 3)}>
                  <p className="text-k-orange text-xs font-semibold mb-1">Top 3 Dolores principales</p>
                  {formData.l_client_q18_ranked.map((f, i) => <div key={f} draggable onDragStart={e => handleDragStartRank(e, f)} className="bg-k-surface border border-k-orange text-k-text text-xs px-3 py-2 rounded flex items-center justify-between cursor-grab"><span><span className="text-k-orange font-bold mr-2">{i+1}°</span> <span className="text-[10px]">{f}</span></span><button type="button" onClick={() => setFormData(p => ({...p, l_client_q18_ranked: p.l_client_q18_ranked.filter(item => item !== f)}))} className="text-k-muted hover:text-red-400 shrink-0 ml-2">×</button></div>)}
                </div>
              </div>
              <input type="text" name="l_client_q18_context" value={formData.l_client_q18_context} onChange={handleTextChange} maxLength={150} className={`${inputClass} text-xs mt-3`} placeholder="¿Hay algún contexto del mercado que amplifique estos dolores en este momento?" />
            </Field>

            {/* Q19 Platforms & Content */}
            <Field label="19. ¿En qué plataformas digitales tiene mayor presencia su cliente objetivo y qué tipo de contenido consume?">
              <div className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-k-muted text-xs mb-2">Parte A: Plataformas (ordena top 3)</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 'l_client_q19_platforms', 'remove', null)}>
                        <p className="text-k-muted text-[10px] font-semibold mb-2">Disponibles</p>
                        <div className="flex flex-col gap-1">
                          {CORP_Q19_PLATFORMS.filter(p => !formData.l_client_q19_platforms.includes(p)).map(p => <div key={p} draggable onDragStart={e => handleDragStartRank(e, p)} className="bg-k-surface border border-k-border text-k-text text-[10px] px-2 py-1 rounded cursor-grab">{p}</div>)}
                        </div>
                      </div>
                      <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-1" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 'l_client_q19_platforms', 'add', 3)}>
                        <p className="text-k-orange text-[10px] font-semibold mb-1">Top 3 Presencia</p>
                        {formData.l_client_q19_platforms.map((p, i) => <div key={p} draggable onDragStart={e => handleDragStartRank(e, p)} className="bg-k-surface border border-k-orange text-k-text text-[10px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab"><span><span className="text-k-orange font-bold mr-1">{i+1}°</span> {p}</span><button type="button" onClick={() => setFormData(prev => ({...prev, l_client_q19_platforms: prev.l_client_q19_platforms.filter(item => item !== p)}))} className="text-k-muted hover:text-red-400">×</button></div>)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-k-muted text-xs mb-2">Parte B: Tipo de contenido (máx. 4)</p>
                    <div className="flex flex-col gap-2">{CORP_Q19_CONTENT.map(c => <label key={c} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" value={c} checked={formData.l_client_q19_content.includes(c)} onChange={() => { if(formData.l_client_q19_content.includes(c)) { handleCheckboxChange('l_client_q19_content', c) } else if (formData.l_client_q19_content.length < 4) { handleCheckboxChange('l_client_q19_content', c) } }} className="w-4 h-4 accent-k-orange shrink-0" /><span className="truncate">{c}</span></label>)}</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-k-border">
                  <p className="text-k-muted text-xs mb-2">Parte C: Momento de consumo principal</p>
                  <div className="flex flex-wrap gap-2">{CORP_Q19_TIME.map(t => <button key={t} type="button" onClick={() => setFormData(p => ({ ...p, l_client_q19_time: t }))} className={`px-4 py-2 rounded-full text-xs transition-all border ${formData.l_client_q19_time === t ? 'bg-k-orange/10 border-k-orange text-k-orange font-medium' : 'bg-k-surface2 border-transparent text-k-text hover:brightness-110'}`}>{t}</button>)}</div>
                </div>
              </div>
            </Field>

            {/* Q20 Barriers */}
            <Field label="20. ¿Cuál es la principal barrera que frena a un cliente potencial al momento de tomar la decisión de compra?">
              <select name="l_client_q20_barrier" value={formData.l_client_q20_barrier} onChange={handleTextChange} className={`${inputClass} mb-3`}>
                <option value="">Selecciona la objeción principal...</option>
                {CORP_Q20_BARRIERS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {formData.l_client_q20_barrier && (
                <div className="flex flex-col gap-3">
                  <input type="text" name="l_client_q20_stage" value={formData.l_client_q20_stage} onChange={handleTextChange} maxLength={100} className={`${inputClass} text-xs py-2.5`} placeholder="¿En qué etapa del proceso de venta suele aparecer esta barrera?" />
                  <input type="text" name="l_client_q20_arguments" value={formData.l_client_q20_arguments} onChange={handleTextChange} maxLength={120} className={`${inputClass} text-xs py-2.5`} placeholder="¿Qué argumentos o acciones suelen ser más efectivos para superarla?" />
                </div>
              )}
            </Field>

            {/* Q21 Transformation Card Sorting */}
            <Field label="21. ¿Qué resultado o transformación espera obtener su cliente al elegir su producto o servicio?" description="Mínimo 2 tarjetas en cada columna funcional, estratégica y emocional.">
              <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[80px] flex flex-wrap gap-1.5 mb-4" onDragOver={handleDragOverRank} onDrop={e => handleDropCorpQ21(e, null)}>
                {availableCorpQ21.length === 0 ? <p className="text-k-muted text-xs italic w-full text-center py-2">Todas clasificadas</p> : availableCorpQ21.map(c => <div key={c} draggable onDragStart={e => handleDragStartRank(e, c)} className="bg-k-surface border border-k-border text-k-text text-[10px] px-2 py-1 rounded cursor-grab">{c}</div>)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-500/5 rounded-card p-3 border border-dashed border-blue-500/30 min-h-[150px] flex flex-col gap-1.5" onDragOver={handleDragOverRank} onDrop={e => handleDropCorpQ21(e, 'l_client_q21_functional')}><p className="text-blue-400 text-xs font-semibold mb-1">⚙️ Valor funcional</p>{formData.l_client_q21_functional.map(c => <div key={c} draggable onDragStart={e => handleDragStartRank(e, c)} className="bg-k-surface border border-blue-500/30 text-k-text text-[10px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab"><span>{c}</span><button type="button" onClick={() => setFormData(p => ({...p, l_client_q21_functional: p.l_client_q21_functional.filter(item => item !== c)}))} className="text-k-muted hover:text-red-400">×</button></div>)}</div>
                <div className="bg-purple-500/5 rounded-card p-3 border border-dashed border-purple-500/30 min-h-[150px] flex flex-col gap-1.5" onDragOver={handleDragOverRank} onDrop={e => handleDropCorpQ21(e, 'l_client_q21_strategic')}><p className="text-purple-400 text-xs font-semibold mb-1">🧠 Valor estratégico</p>{formData.l_client_q21_strategic.map(c => <div key={c} draggable onDragStart={e => handleDragStartRank(e, c)} className="bg-k-surface border border-purple-500/30 text-k-text text-[10px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab"><span>{c}</span><button type="button" onClick={() => setFormData(p => ({...p, l_client_q21_strategic: p.l_client_q21_strategic.filter(item => item !== c)}))} className="text-k-muted hover:text-red-400">×</button></div>)}</div>
                <div className="bg-red-500/5 rounded-card p-3 border border-dashed border-red-500/30 min-h-[150px] flex flex-col gap-1.5" onDragOver={handleDragOverRank} onDrop={e => handleDropCorpQ21(e, 'l_client_q21_emotional')}><p className="text-red-400 text-xs font-semibold mb-1">❤️ Valor emocional</p>{formData.l_client_q21_emotional.map(c => <div key={c} draggable onDragStart={e => handleDragStartRank(e, c)} className="bg-k-surface border border-red-500/30 text-k-text text-[10px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab"><span>{c}</span><button type="button" onClick={() => setFormData(p => ({...p, l_client_q21_emotional: p.l_client_q21_emotional.filter(item => item !== c)}))} className="text-k-muted hover:text-red-400">×</button></div>)}</div>
              </div>
              <input type="text" name="l_client_q21_missing" value={formData.l_client_q21_missing} onChange={handleTextChange} maxLength={120} className={`${inputClass} text-xs mt-3`} placeholder="¿Hay alguna transformación clave que no esté en la lista?" />
            </Field>

            {/* Q22 Interests */}
            <Field label="22. ¿Qué otros intereses o ámbitos forman parte del contexto de vida o trabajo de su cliente?">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {CORP_Q22_INTERESTS.map(group => (
                  <div key={group.cat}>
                    <p className="text-k-muted text-xs font-semibold mb-2">{group.cat}:</p>
                    <div className="flex flex-col gap-1.5">{group.items.map(i => <label key={i} className="flex items-center gap-2 text-xs cursor-pointer"><input type="checkbox" value={i} checked={formData.l_client_q22_interests.includes(i)} onChange={() => handleCheckboxChange('l_client_q22_interests', i)} className="w-3.5 h-3.5 accent-k-orange shrink-0" /><span className="truncate">{i}</span></label>)}</div>
                  </div>
                ))}
              </div>
              <input type="text" value={customInterestLQ22} onChange={e => setCustomInterestLQ22(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customInterestLQ22.trim()) { setFormData(p => ({...p, l_client_q22_interests: [...p.l_client_q22_interests, customInterestLQ22.trim()]})); setCustomInterestLQ22('') } } }} placeholder="+ Agregar interés relevante (presiona Enter)" className={`${inputClass} text-xs mt-4`} />
            </Field>

            {/* Q23 Language Sliders */}
            <Field label="23. ¿Su cliente se comunica en un registro técnico, formal, o utiliza un lenguaje más propio de su industria?">
              <div className="space-y-5">
                <div><p className="text-k-muted text-xs mb-2">Formalidad:</p><input type="range" name="l_client_q23_formal" min="0" max="100" value={formData.l_client_q23_formal} onChange={handleTextChange} className="w-full accent-k-orange" /><div className="flex justify-between text-[10px] text-k-muted mt-1 font-medium"><span>💬 Informal y directo</span><span>📋 Muy formal</span></div></div>
                <div><p className="text-k-muted text-xs mb-2">Especialización técnica:</p><input type="range" name="l_client_q23_technical" min="0" max="100" value={formData.l_client_q23_technical} onChange={handleTextChange} className="w-full accent-k-orange" /><div className="flex justify-between text-[10px] text-k-muted mt-1 font-medium"><span>🙋 Lenguaje general</span><span>🔬 Altamente técnico</span></div></div>
                <div><p className="text-k-muted text-xs mb-2">Velocidad de comunicación:</p><input type="range" name="l_client_q23_speed" min="0" max="100" value={formData.l_client_q23_speed} onChange={handleTextChange} className="w-full accent-k-orange" /><div className="flex justify-between text-[10px] text-k-muted mt-1 font-medium"><span>⏳ Prefiere profundidad</span><span>⚡ Prefiere síntesis</span></div></div>
                <input type="text" name="l_client_q23_terms" value={formData.l_client_q23_terms} onChange={handleTextChange} maxLength={120} className={`${inputClass} text-xs`} placeholder="¿Hay términos, siglas o expresiones propias de su industria que deberíamos conocer?" />
              </div>
            </Field>

            {/* Q24 Customer Journey */}
            <Field label="24. ¿En qué momento del recorrido del cliente surge la necesidad de su solución?" description="Marca en qué etapa(s) su cliente suele encontrarlos por primera vez (máximo 2).">
              <div className="flex flex-col md:flex-row md:items-center justify-between relative px-4 sm:px-6 mb-6 mt-2 gap-6 md:gap-0">
                <div className="hidden md:block absolute left-10 right-10 top-1/2 -translate-y-1/2 h-1 bg-k-surface2 rounded-full -z-10"></div>
                {CORP_Q24_STAGES.map((stage, idx) => (
                  <div key={idx} onClick={() => toggleCorpQ24Stage(stage)} className={`cursor-pointer flex md:flex-col items-center gap-3 md:gap-2 relative p-2 md:p-0 rounded transition-all ${formData.l_client_q24_stages.includes(stage) ? 'bg-k-orange/10 md:bg-transparent' : 'hover:bg-k-surface2'}`}>
                    <div className={`w-5 h-5 rounded-full transition-all border-4 flex items-center justify-center shrink-0 ${formData.l_client_q24_stages.includes(stage) ? 'bg-k-orange border-k-bg scale-125' : 'bg-k-surface2 border-k-bg'}`}><span className="text-[8px] text-white opacity-0"></span></div>
                    <span className={`text-[11px] sm:text-xs font-medium md:absolute md:-bottom-8 md:whitespace-nowrap ${formData.l_client_q24_stages.includes(stage) ? 'text-k-orange' : 'text-k-muted'}`}>{stage}</span>
                  </div>
                ))}
              </div>
              {formData.l_client_q24_stages.length > 0 && (
                <div className="mt-8 flex flex-col gap-4">
                  {formData.l_client_q24_stages.map(stage => (
                    <div key={stage} className="bg-k-surface2/30 rounded-card p-4 border border-k-orange/30">
                      <p className="text-k-orange text-sm font-semibold mb-3">{stage}</p>
                      <div className="flex flex-col gap-3">
                        <input type="text" value={formData.l_client_q24_details[stage]?.trigger || ''} onChange={e => handleCorpQ24Detail(stage, 'trigger', e.target.value)} maxLength={120} className={`${inputClass} text-xs py-2.5`} placeholder="¿Qué desencadena que lleguen a ustedes en este punto?" />
                        <input type="text" value={formData.l_client_q24_details[stage]?.content || ''} onChange={e => handleCorpQ24Detail(stage, 'content', e.target.value)} maxLength={120} className={`${inputClass} text-xs py-2.5`} placeholder="¿Qué tipo de contenido los convence de avanzar al siguiente paso?" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Field>
          </div>
        )}

        {currentStep === 4 && formType === 'small' && ( // ── PASO 4: LOGÍSTICA ────────────────────────
          <div className="flex flex-col gap-6">
            
            {/* Q25 */}
            <Field label="25. ¿En qué plataformas vas a publicar el contenido que creemos juntos?">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                   {PLATFORMS_Q25.map(p => {
                     const isActive = formData.s_ops_q25_platforms.includes(p);
                     return (
                       <div key={p} className={`border rounded-card p-3 transition-colors ${isActive ? 'border-k-orange bg-k-orange/5' : 'border-k-border bg-k-surface2'}`}>
                          <label className="flex items-center gap-2 text-sm cursor-pointer mb-2">
                             <input type="checkbox" className="w-4 h-4 accent-k-orange" checked={isActive} onChange={() => { if (isActive) { setFormData(prev => ({...prev, s_ops_q25_platforms: prev.s_ops_q25_platforms.filter(x => x !== p)})); } else { setFormData(prev => ({...prev, s_ops_q25_platforms: [...prev.s_ops_q25_platforms, p], s_ops_q25_freq: {...prev.s_ops_q25_freq, [p]: 'Principal'}})); } }} />
                             {p}
                          </label>
                          {isActive && (
                             <div className="flex gap-2 ml-6">
                                {['Principal', 'Secundaria', 'Ocasional'].map(f => (
                                   <button key={f} type="button" onClick={() => setFormData(prev => ({...prev, s_ops_q25_freq: {...prev.s_ops_q25_freq, [p]: f}}))} className={`text-[10px] px-2 py-1 rounded transition-colors ${formData.s_ops_q25_freq[p] === f ? 'bg-k-orange text-white' : 'bg-k-surface border border-k-border text-k-muted'}`}>{f}</button>
                                ))}
                             </div>
                          )}
                       </div>
                     )
                   })}
                </div>
                <div className="flex gap-2 mt-2 sm:w-1/2">
                   <input type="text" value={customPlatformQ25} onChange={e => setCustomPlatformQ25(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customPlatformQ25.trim() && !formData.s_ops_q25_platforms.includes(customPlatformQ25.trim())) { setFormData(p => ({...p, s_ops_q25_platforms: [...p.s_ops_q25_platforms, customPlatformQ25.trim()], s_ops_q25_freq: {...p.s_ops_q25_freq, [customPlatformQ25.trim()]: 'Principal'}})); setCustomPlatformQ25('') } } }} placeholder="+ Agregar otra plataforma" className={`${inputClass} text-sm py-2 flex-1`} />
                   <button type="button" onClick={() => { if(customPlatformQ25.trim() && !formData.s_ops_q25_platforms.includes(customPlatformQ25.trim())) { setFormData(p => ({...p, s_ops_q25_platforms: [...p.s_ops_q25_platforms, customPlatformQ25.trim()], s_ops_q25_freq: {...p.s_ops_q25_freq, [customPlatformQ25.trim()]: 'Principal'}})); setCustomPlatformQ25('') } }} className="bg-k-surface2 text-k-text px-4 py-2 rounded-card text-sm hover:brightness-110">Agregar</button>
                </div>
              </div>
            </Field>

            {/* Q26 */}
            <Field label="26. ¿Qué formatos de contenido necesitas?">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FORMATS_Q26.map(f => {
                   const isActive = formData.s_ops_q26_formats.includes(f.title);
                   return (
                     <div key={f.title} onClick={() => handleCheckboxChange('s_ops_q26_formats', f.title)} className={`cursor-pointer border rounded-card p-3 flex flex-col items-center text-center transition-colors ${isActive ? 'border-k-orange bg-k-orange/10' : 'border-k-border bg-k-surface2 hover:brightness-110'}`}>
                        <span className="text-2xl mb-1">{f.icon}</span>
                        <span className={`text-sm font-medium ${isActive ? 'text-k-orange' : 'text-k-text'}`}>{f.title}</span>
                        <span className="text-[10px] text-k-muted mt-1">{f.desc}</span>
                     </div>
                   )
                })}
              </div>
            </Field>

            {/* Q27 */}
            <Field label="27. ¿Cuántas piezas de contenido necesitas por semana o por mes?">
              <div className="bg-k-surface2/50 rounded-card p-4 border border-k-border">
                 <div className="flex items-center gap-2 mb-6">
                   <span className="text-sm text-k-muted">Período:</span>
                   <div className="flex bg-k-surface border border-k-border rounded-card overflow-hidden">
                      <button type="button" onClick={() => setFormData(p => ({...p, s_ops_q27_period: 'por semana'}))} className={`px-3 py-1.5 text-xs font-medium ${formData.s_ops_q27_period === 'por semana' ? 'bg-k-orange text-white' : 'text-k-muted'}`}>Por semana</button>
                      <button type="button" onClick={() => setFormData(p => ({...p, s_ops_q27_period: 'por mes'}))} className={`px-3 py-1.5 text-xs font-medium ${formData.s_ops_q27_period === 'por mes' ? 'bg-k-orange text-white' : 'text-k-muted'}`}>Por mes</button>
                   </div>
                 </div>
                 <div className="mb-4">
                   <div className="flex justify-between text-sm mb-2"><span className="text-k-text">🎬 Videos</span><span className="text-k-orange font-bold">{formData.s_ops_q27_videos}</span></div>
                   <input type="range" min="0" max="20" step="1" value={formData.s_ops_q27_videos} onChange={e => setFormData(p => ({...p, s_ops_q27_videos: parseInt(e.target.value)}))} className="w-full accent-k-orange" />
                 </div>
                 <div className="mb-4">
                   <div className="flex justify-between text-sm mb-2"><span className="text-k-text">🖼️ Diseños estáticos</span><span className="text-k-orange font-bold">{formData.s_ops_q27_designs}</span></div>
                   <input type="range" min="0" max="30" step="1" value={formData.s_ops_q27_designs} onChange={e => setFormData(p => ({...p, s_ops_q27_designs: parseInt(e.target.value)}))} className="w-full accent-k-orange" />
                 </div>
                 <div className="mt-4 pt-4 border-t border-k-border text-center">
                   <p className="text-k-text font-medium text-sm">Eso equivale a <span className="text-k-orange">{formData.s_ops_q27_videos + formData.s_ops_q27_designs}</span> piezas {formData.s_ops_q27_period}.</p>
                   <p className="text-k-muted text-[10px] mt-1 italic">Si no estás seguro aún, puedes dejarlo en 0 y lo definimos juntos.</p>
                 </div>
              </div>
            </Field>

            {/* Q28 */}
            <Field label="28. ¿Cómo nos vas a enviar el material en bruto para trabajar?">
              <select name="s_ops_q28_source" value={formData.s_ops_q28_source} onChange={handleTextChange} className={`${inputClass} mb-2`}>
                 <option value="">Selecciona una plataforma...</option>
                 {SOURCES_Q28.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {formData.s_ops_q28_source && (
                <input type="text" name="s_ops_q28_details" value={formData.s_ops_q28_details} onChange={handleTextChange} className={inputClass} placeholder="¿Tienes alguna carpeta o estructura de archivos que ya uses?" />
              )}
            </Field>

            {/* Q29 */}
            <Field label="29. ¿Cuáles son las 3 frases con las que más le pides a tu audiencia que haga algo?" description="Arrastra tus 3 CTAs principales.">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 's_ops_q29_ranked', 'remove', null)}>
                    <p className="text-k-muted text-xs font-semibold mb-2">CTAs disponibles</p>
                    <div className="flex flex-col gap-2">
                       {CTAS_Q29.filter(c => !formData.s_ops_q29_ranked.includes(c)).map(c => <div key={c} draggable onDragStart={e => handleDragStartRank(e, c)} className="bg-k-surface border border-k-border text-k-text text-[10px] px-2 py-1.5 rounded cursor-grab">{c}</div>)}
                       <input type="text" value={customCtaQ29} onChange={e => setCustomCtaQ29(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customCtaQ29.trim() && formData.s_ops_q29_ranked.length < 3) { setFormData(p => ({...p, s_ops_q29_ranked: [...p.s_ops_q29_ranked, customCtaQ29.trim()]})); setCustomCtaQ29('') } } }} placeholder="+ Agregar mi propio CTA" className="bg-k-surface text-k-text text-xs px-2 py-1.5 rounded border border-k-border outline-none mt-2" />
                    </div>
                 </div>
                 <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-2" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 's_ops_q29_ranked', 'add', 3)}>
                    <p className="text-k-orange text-xs font-semibold mb-1">Top 3 CTAs</p>
                    {formData.s_ops_q29_ranked.map((c, i) => <div key={c} draggable onDragStart={e => handleDragStartRank(e, c)} className="bg-k-surface border border-k-orange text-k-text text-[10px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab"><span><span className="text-k-orange font-bold mr-2">{i+1}°</span> {c}</span><button type="button" onClick={() => setFormData(p => ({...p, s_ops_q29_ranked: p.s_ops_q29_ranked.filter(item => item !== c)}))} className="text-k-muted hover:text-red-400">×</button></div>)}
                 </div>
              </div>
            </Field>

            {/* Q30 */}
            <Field label="30. ¿Hay algún logo de partner, marca de agua o texto legal que deba aparecer siempre?">
              <div className="flex flex-col gap-3">
                 <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="s_ops_q30_has_legal" value="yes" checked={formData.s_ops_q30_has_legal === 'yes'} onChange={handleTextChange} className="accent-k-orange" /> ✅ Sí, hay elementos obligatorios</label>
                 {formData.s_ops_q30_has_legal === 'yes' && (
                    <div className="ml-6 p-4 bg-k-surface2 rounded-card border border-k-border">
                       <p className="text-k-text text-sm font-medium mb-2">Selecciona qué necesitas y comparte el enlace de los archivos:</p>
                       <div className="flex flex-wrap gap-2 mb-3">
                          {LEGAL_ELEMENTS_Q30.map(el => (
                             <label key={el} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={formData.s_ops_q30_elements.includes(el)} onChange={() => handleCheckboxChange('s_ops_q30_elements', el)} className="accent-k-orange" />{el}</label>
                          ))}
                       </div>
                       <input type="text" name="s_ops_q30_link" value={formData.s_ops_q30_link} onChange={handleTextChange} className={`${inputClass} mb-2`} placeholder="Enlace de Drive con los archivos..." />
                       <input type="text" name="s_ops_q30_details" value={formData.s_ops_q30_details} onChange={handleTextChange} maxLength={100} className={inputClass} placeholder="¿En qué posición o tamaño deben aparecer?" />
                    </div>
                 )}
                 <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="s_ops_q30_has_legal" value="no" checked={formData.s_ops_q30_has_legal === 'no'} onChange={handleTextChange} className="accent-k-orange" /> ❌ No, por ahora nada de eso</label>
              </div>
            </Field>

            {/* Q31 */}
            <Field label="31. ¿Quién va a revisar y aprobar el contenido antes de publicarlo?">
              <div className="space-y-3">
                 <input type="text" name="s_ops_q31_reviewer" value={formData.s_ops_q31_reviewer} onChange={handleTextChange} maxLength={60} className={inputClass} placeholder="Ej: María González, dueña del negocio" />
                 <select name="s_ops_q31_time" value={formData.s_ops_q31_time} onChange={handleTextChange} className={inputClass}>
                    <option value="">Tiempo de respuesta esperado...</option>
                    {REVIEW_TIMES_Q31.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
                 <input type="text" name="s_ops_q31_details" value={formData.s_ops_q31_details} onChange={handleTextChange} maxLength={100} className={inputClass} placeholder="¿Hay algo del proceso de aprobación que debamos saber? (Opcional)" />
              </div>
            </Field>

            {/* Q32 */}
            <Field label="32. ¿Cómo vamos a saber que lo que creamos está funcionando?" description="Arrastra y ordena el Top 3 de indicadores clave (KPIs).">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 's_ops_q32_ranked', 'remove', null)}>
                    <p className="text-k-muted text-xs font-semibold mb-2">Indicadores disponibles</p>
                    <div className="flex flex-col gap-2">
                       {KPIS_Q32.filter(k => !formData.s_ops_q32_ranked.includes(k)).map(k => <div key={k} draggable onDragStart={e => handleDragStartRank(e, k)} className="bg-k-surface border border-k-border text-k-text text-[10px] px-2 py-1.5 rounded cursor-grab">{k}</div>)}
                       <input type="text" value={customKpiQ32} onChange={e => setCustomKpiQ32(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customKpiQ32.trim() && formData.s_ops_q32_ranked.length < 3) { setFormData(p => ({...p, s_ops_q32_ranked: [...p.s_ops_q32_ranked, customKpiQ32.trim()]})); setCustomKpiQ32('') } } }} placeholder="+ Agregar propio" className="bg-k-surface text-k-text text-xs px-2 py-1.5 rounded border border-k-border outline-none mt-2" />
                    </div>
                 </div>
                 <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-2" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 's_ops_q32_ranked', 'add', 3)}>
                    <p className="text-k-orange text-xs font-semibold mb-1">Top 3 KPIs</p>
                    {formData.s_ops_q32_ranked.map((k, i) => <div key={k} draggable onDragStart={e => handleDragStartRank(e, k)} className="bg-k-surface border border-k-orange text-k-text text-[10px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab"><span><span className="text-k-orange font-bold mr-2">{i+1}°</span> {k}</span><button type="button" onClick={() => setFormData(p => ({...p, s_ops_q32_ranked: p.s_ops_q32_ranked.filter(item => item !== k)}))} className="text-k-muted hover:text-red-400">×</button></div>)}
                 </div>
              </div>
            </Field>
          </div>
        )}

        {currentStep === 4 && formType === 'large' && (
          <div className="flex flex-col gap-6">
            
            {/* Q25 */}
            <Field label="25. ¿En qué canales digitales se publicará el material que desarrollemos?">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {CORP_Q25_PLATFORMS.map(p => {
                     const isActive = formData.l_ops_q25_platforms.includes(p);
                     return (
                       <div key={p} className={`border rounded-card p-3 transition-colors ${isActive ? 'border-k-orange bg-k-orange/5' : 'border-k-border bg-k-surface2'}`}>
                          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer mb-2">
                             <input type="checkbox" className="w-4 h-4 accent-k-orange" checked={isActive} onChange={() => { if (isActive) { setFormData(prev => ({...prev, l_ops_q25_platforms: prev.l_ops_q25_platforms.filter(x => x !== p)})); } else { setFormData(prev => ({...prev, l_ops_q25_platforms: [...prev.l_ops_q25_platforms, p], l_ops_q25_roles: {...prev.l_ops_q25_roles, [p]: 'Canal principal'}})); } }} />
                             {p}
                          </label>
                          {isActive && (
                             <select value={formData.l_ops_q25_roles[p] || ''} onChange={e => handleCorpOpsRoles(p, e.target.value)} className="bg-k-surface text-k-text text-[10px] px-2 py-1.5 ml-6 rounded outline-none border border-k-border cursor-pointer w-[calc(100%-1.5rem)]">
                               {CORP_Q25_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                             </select>
                          )}
                       </div>
                     )
                   })}
                </div>
                <div className="flex gap-2 mt-2 sm:w-1/2">
                   <input type="text" value={customPlatformLQ25} onChange={e => setCustomPlatformLQ25(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customPlatformLQ25.trim() && !formData.l_ops_q25_platforms.includes(customPlatformLQ25.trim())) { setFormData(p => ({...p, l_ops_q25_platforms: [...p.l_ops_q25_platforms, customPlatformLQ25.trim()], l_ops_q25_roles: {...p.l_ops_q25_roles, [customPlatformLQ25.trim()]: 'Canal principal'}})); setCustomPlatformLQ25('') } } }} placeholder="+ Agregar canal propio o interno" className={`${inputClass} text-xs py-2 flex-1`} />
                   <button type="button" onClick={() => { if(customPlatformLQ25.trim() && !formData.l_ops_q25_platforms.includes(customPlatformLQ25.trim())) { setFormData(p => ({...p, l_ops_q25_platforms: [...p.l_ops_q25_platforms, customPlatformLQ25.trim()], l_ops_q25_roles: {...p.l_ops_q25_roles, [customPlatformLQ25.trim()]: 'Canal principal'}})); setCustomPlatformLQ25('') } }} className="bg-k-surface2 text-k-text px-3 py-2 rounded-card text-xs hover:brightness-110">Agregar</button>
                </div>
                <div className="bg-k-surface2/50 text-k-muted text-[10px] p-2 rounded text-center mt-2 border border-k-border">
                  Canales principales: {formData.l_ops_q25_platforms.filter(p => formData.l_ops_q25_roles[p] === 'Canal principal').length} | Canales secundarios: {formData.l_ops_q25_platforms.filter(p => formData.l_ops_q25_roles[p] === 'Canal secundario').length} | En desarrollo: {formData.l_ops_q25_platforms.filter(p => formData.l_ops_q25_roles[p] === 'Canal en desarrollo').length}
                </div>
              </div>
            </Field>

            {/* Q26 */}
            <Field label="26. ¿Qué formatos de contenido requieren principalmente?">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CORP_Q26_FORMATS.map(f => {
                   const isActive = formData.l_ops_q26_formats.includes(f.title);
                   return (
                     <div key={f.title} className={`border rounded-card p-3 flex flex-col transition-colors ${isActive ? 'border-k-orange bg-k-orange/5' : 'border-k-border bg-k-surface2 hover:border-k-orange/30'}`}>
                        <label className="flex items-start gap-2 cursor-pointer mb-2">
                          <input type="checkbox" checked={isActive} onChange={() => handleCheckboxChange('l_ops_q26_formats', f.title)} className="w-4 h-4 accent-k-orange mt-0.5" />
                          <div className="flex flex-col">
                            <span className={`text-xs font-semibold ${isActive ? 'text-k-orange' : 'text-k-text'}`}>{f.icon} {f.title}</span>
                            <span className="text-[10px] text-k-muted mt-0.5 leading-tight">{f.desc}</span>
                          </div>
                        </label>
                        {isActive && <input type="text" value={formData.l_ops_q26_usage[f.title] || ''} onChange={e => handleCorpOpsUsage(f.title, e.target.value)} maxLength={60} className="w-full bg-k-surface text-k-text text-[10px] p-2 rounded outline-none border border-k-border mt-auto" placeholder="¿En qué canal o campaña se usará?" />}
                     </div>
                   )
                })}
              </div>
            </Field>

            {/* Q27 */}
            <Field label="27. ¿Cuál es el volumen estimado de piezas de contenido que esperan recibir de forma semanal o mensual?">
              <div className="bg-k-surface2/50 rounded-card p-5 border border-k-border">
                 <div className="flex items-center gap-2 mb-6">
                   <span className="text-xs text-k-muted font-semibold uppercase tracking-wider">Período:</span>
                   <div className="flex bg-k-surface border border-k-border rounded-card overflow-hidden">
                      <button type="button" onClick={() => setFormData(p => ({...p, l_ops_q27_period: 'por semana'}))} className={`px-4 py-2 text-xs font-medium ${formData.l_ops_q27_period === 'por semana' ? 'bg-k-orange text-white' : 'text-k-muted hover:text-k-text'}`}>Por semana</button>
                      <button type="button" onClick={() => setFormData(p => ({...p, l_ops_q27_period: 'por mes'}))} className={`px-4 py-2 text-xs font-medium ${formData.l_ops_q27_period === 'por mes' ? 'bg-k-orange text-white' : 'text-k-muted hover:text-k-text'}`}>Por mes</button>
                   </div>
                 </div>
                 <div className="flex flex-col gap-5 mb-5">
                   <div><div className="flex justify-between text-xs mb-2 font-medium"><span className="text-k-text">🎬 Videos producción propia (0-20)</span><span className="text-k-orange">{formData.l_ops_q27_videos}</span></div><input type="range" min="0" max="20" step="1" value={formData.l_ops_q27_videos} onChange={e => setFormData(p => ({...p, l_ops_q27_videos: parseInt(e.target.value)}))} className="w-full accent-k-orange" /></div>
                   <div><div className="flex justify-between text-xs mb-2 font-medium"><span className="text-k-text">🎞️ Motion graphics (0-20)</span><span className="text-k-orange">{formData.l_ops_q27_motion}</span></div><input type="range" min="0" max="20" step="1" value={formData.l_ops_q27_motion} onChange={e => setFormData(p => ({...p, l_ops_q27_motion: parseInt(e.target.value)}))} className="w-full accent-k-orange" /></div>
                   <div><div className="flex justify-between text-xs mb-2 font-medium"><span className="text-k-text">🖼️ Diseños estáticos (0-50)</span><span className="text-k-orange">{formData.l_ops_q27_designs}</span></div><input type="range" min="0" max="50" step="1" value={formData.l_ops_q27_designs} onChange={e => setFormData(p => ({...p, l_ops_q27_designs: parseInt(e.target.value)}))} className="w-full accent-k-orange" /></div>
                 </div>
                 <div className="bg-k-surface p-3 rounded text-center border border-k-orange/20 mb-5">
                   <p className="text-k-text font-semibold text-sm">Estimado total: <span className="text-k-orange text-lg">{formData.l_ops_q27_videos + formData.l_ops_q27_motion + formData.l_ops_q27_designs}</span> piezas {formData.l_ops_q27_period}</p>
                 </div>
                 <div className="border-t border-k-border pt-4">
                   <p className="text-k-muted text-xs mb-2">¿Este volumen varía según la temporada o campaña?</p>
                   <select name="l_ops_q27_variation" value={formData.l_ops_q27_variation} onChange={handleTextChange} className={`${inputClass} text-xs py-2.5 cursor-pointer mb-3`}>
                     <option value="">Seleccionar...</option>
                     {CORP_Q27_VARIATIONS.map(v => <option key={v} value={v}>{v}</option>)}
                   </select>
                   {formData.l_ops_q27_variation.includes('Sí') && <input type="text" name="l_ops_q27_variation_details" value={formData.l_ops_q27_variation_details} onChange={handleTextChange} maxLength={100} className={`${inputClass} text-xs`} placeholder="¿En qué períodos el volumen aumenta? Ej: lanzamientos, temporada alta..." />}
                 </div>
              </div>
            </Field>

            {/* Q28 */}
            <Field label="28. ¿A través de qué plataforma nos harán llegar el material en bruto para producción?">
              <div className="flex flex-col gap-4">
                <select name="l_ops_q28_source" value={formData.l_ops_q28_source} onChange={handleTextChange} className={`${inputClass} cursor-pointer`}>
                   <option value="">Selecciona la plataforma corporativa...</option>
                   {CORP_Q28_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {formData.l_ops_q28_source && (
                  <div className="bg-k-surface2/30 p-4 rounded-card border border-k-border flex flex-col gap-4">
                    <div>
                      <p className="text-k-muted text-xs mb-2">¿Tienen una estructura de carpetas o nomenclatura de archivos que debamos respetar?</p>
                      <div className="flex gap-4 mb-2">
                        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="l_ops_q28_structure" value="yes" checked={formData.l_ops_q28_structure === 'yes'} onChange={handleTextChange} className="accent-k-orange" /> Sí</label>
                        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="radio" name="l_ops_q28_structure" value="no" checked={formData.l_ops_q28_structure === 'no'} onChange={handleTextChange} className="accent-k-orange" /> No</label>
                      </div>
                      {formData.l_ops_q28_structure === 'yes' && <input type="text" name="l_ops_q28_structure_details" value={formData.l_ops_q28_structure_details} onChange={handleTextChange} maxLength={120} className={`${inputClass} text-xs py-2`} placeholder="Describe brevemente la estructura o comparte un link con las instrucciones..." />}
                    </div>
                    <div>
                      <p className="text-k-muted text-xs mb-2">¿Quién del equipo se encargará de subir el material?</p>
                      <input type="text" name="l_ops_q28_uploader" value={formData.l_ops_q28_uploader} onChange={handleTextChange} maxLength={60} className={`${inputClass} text-xs py-2`} placeholder="Nombre y cargo de la persona responsable..." />
                    </div>
                  </div>
                )}
              </div>
            </Field>

            {/* Q29 */}
            <Field label="29. ¿Cuáles son los 3 llamados a la acción que utilizan con mayor frecuencia en su comunicación?" description="Arrastra al Top 3 los institucionales.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 'l_ops_q29_ranked', 'remove', null)}>
                    <p className="text-k-muted text-xs font-semibold mb-2">CTAs disponibles</p>
                    <div className="flex flex-col gap-2">
                       {CORP_Q29_CTAS.filter(c => !formData.l_ops_q29_ranked.includes(c)).map(c => <div key={c} draggable onDragStart={e => handleDragStartRank(e, c)} className="bg-k-surface border border-k-border text-k-text text-[10px] px-2 py-1.5 rounded cursor-grab">{c}</div>)}
                       <input type="text" value={customCtaLQ29} onChange={e => setCustomCtaLQ29(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customCtaLQ29.trim() && formData.l_ops_q29_ranked.length < 3) { setFormData(p => ({...p, l_ops_q29_ranked: [...p.l_ops_q29_ranked, customCtaLQ29.trim()]})); setCustomCtaLQ29('') } } }} placeholder="+ Agregar CTA institucional propio" className="bg-k-surface text-k-text text-xs px-2 py-1.5 rounded border border-k-border outline-none mt-2" />
                    </div>
                 </div>
                 <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-2" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 'l_ops_q29_ranked', 'add', 3)}>
                    <p className="text-k-orange text-xs font-semibold mb-1">Top 3 CTAs</p>
                    {formData.l_ops_q29_ranked.map((c, i) => <div key={c} draggable onDragStart={e => handleDragStartRank(e, c)} className="bg-k-surface border border-k-orange text-k-text text-[10px] px-2 py-1.5 rounded flex items-center justify-between cursor-grab"><span><span className="text-k-orange font-bold mr-2">{i+1}°</span> {c}</span><button type="button" onClick={() => setFormData(p => ({...p, l_ops_q29_ranked: p.l_ops_q29_ranked.filter(item => item !== c)}))} className="text-k-muted hover:text-red-400">×</button></div>)}
                 </div>
              </div>
              <input type="text" name="l_ops_q29_mandatory" value={formData.l_ops_q29_mandatory} onChange={handleTextChange} maxLength={100} className={`${inputClass} text-xs mt-3`} placeholder="¿Hay algún CTA que deban usar obligatoriamente por política de marca o legal?" />
            </Field>

            {/* Q30 */}
            <Field label="30. ¿Existe algún elemento de uso obligatorio en todas las piezas?">
              <div className="flex flex-col gap-3">
                 <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="radio" name="l_ops_q30_has_legal" value="yes" checked={formData.l_ops_q30_has_legal === 'yes'} onChange={handleTextChange} className="w-4 h-4 accent-k-orange" /> ✅ Sí, hay elementos de uso obligatorio</label>
                 {formData.l_ops_q30_has_legal === 'yes' && (
                    <div className="ml-6 p-4 bg-k-surface2/50 rounded-card border border-k-border flex flex-col gap-4">
                       <div className="flex flex-col gap-3">
                          {CORP_Q30_ELEMENTS.map(el => {
                            const isActive = formData.l_ops_q30_elements.includes(el);
                            return (
                              <div key={el} className={`flex flex-col gap-2 p-3 rounded border transition-colors ${isActive ? 'bg-k-surface border-k-orange/30' : 'border-transparent'}`}>
                                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer"><input type="checkbox" checked={isActive} onChange={() => handleCheckboxChange('l_ops_q30_elements', el)} className="accent-k-orange" />{el}</label>
                                {isActive && <input type="text" value={formData.l_ops_q30_details[el] || ''} onChange={e => handleCorpOpsLegal(el, e.target.value)} maxLength={100} className="w-full bg-k-surface2 text-k-text text-[10px] p-2 rounded outline-none border border-k-border" placeholder="Especificaciones (posición, tamaño, etc.)..." />}
                              </div>
                            )
                          })}
                       </div>
                       <div>
                         <p className="text-k-muted text-xs font-semibold mb-2">Compartir archivos de los elementos</p>
                         <input type="text" name="l_ops_q30_link" value={formData.l_ops_q30_link} onChange={handleTextChange} className={`${inputClass} text-xs py-2`} placeholder="Enlace de Drive con los logos, marcas de agua, etc..." />
                       </div>
                    </div>
                 )}
                 <label className="flex items-center gap-2 text-sm font-medium cursor-pointer"><input type="radio" name="l_ops_q30_has_legal" value="no" checked={formData.l_ops_q30_has_legal === 'no'} onChange={handleTextChange} className="w-4 h-4 accent-k-orange" /> ❌ No, por ahora no hay elementos obligatorios</label>
              </div>
            </Field>

            {/* Q31 */}
            <Field label="31. ¿Quién es la persona responsable de aprobar los materiales finales y cuál es el tiempo promedio de feedback?">
              <div className="bg-k-surface2/30 p-5 rounded-card border border-k-border flex flex-col gap-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div><p className="text-k-muted text-xs mb-1">Responsable principal:</p><input type="text" name="l_ops_q31_name" value={formData.l_ops_q31_name} onChange={handleTextChange} maxLength={60} className={`${inputClass} text-xs`} placeholder="Nombre completo" /></div>
                   <div><p className="text-k-muted text-xs mb-1">Cargo:</p><input type="text" name="l_ops_q31_role" value={formData.l_ops_q31_role} onChange={handleTextChange} maxLength={60} className={`${inputClass} text-xs`} placeholder="Cargo" /></div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div>
                     <p className="text-k-muted text-xs mb-1">Tiempo de primera revisión:</p>
                     <select name="l_ops_q31_time" value={formData.l_ops_q31_time} onChange={handleTextChange} className={`${inputClass} text-xs cursor-pointer`}>
                        <option value="">Selecciona SLA...</option>
                        {CORP_Q31_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                   </div>
                   <div>
                     <p className="text-k-muted text-xs mb-1">Rondas habituales:</p>
                     <select name="l_ops_q31_rounds" value={formData.l_ops_q31_rounds} onChange={handleTextChange} className={`${inputClass} text-xs cursor-pointer`}>
                        <option value="">Selecciona rondas...</option>
                        {CORP_Q31_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                     </select>
                   </div>
                 </div>
                 <div className="pt-3 border-t border-k-border">
                   <label className="flex items-center gap-2 text-sm font-medium cursor-pointer mb-3"><input type="checkbox" checked={formData.l_ops_q31_multiple} onChange={() => setFormData(p => ({...p, l_ops_q31_multiple: !p.l_ops_q31_multiple}))} className="w-4 h-4 accent-k-orange" /> ¿Hay más de una persona en el proceso de aprobación?</label>
                   {formData.l_ops_q31_multiple && <input type="text" name="l_ops_q31_flow" value={formData.l_ops_q31_flow} onChange={handleTextChange} maxLength={150} className={`${inputClass} text-xs mb-3`} placeholder="Describe el flujo (ej: Primero marketing, luego legal)..." />}
                   <input type="text" name="l_ops_q31_particularity" value={formData.l_ops_q31_particularity} onChange={handleTextChange} maxLength={100} className={`${inputClass} text-xs`} placeholder="¿Hay alguna particularidad importante del proceso?" />
                 </div>
              </div>
            </Field>

            {/* Q32 */}
            <Field label="32. ¿Bajo qué indicadores medirán el éxito del contenido producido?">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                 <div className="bg-k-surface2/50 rounded-card p-3 border border-dashed border-k-border min-h-[150px]" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 'l_ops_q32_ranked', 'remove', null)}>
                    <p className="text-k-muted text-xs font-semibold mb-2">KPIs estratégicos disponibles</p>
                    <div className="flex flex-col gap-2">
                       {CORP_Q32_KPIS.filter(k => !formData.l_ops_q32_ranked.includes(k)).map(k => <div key={k} draggable onDragStart={e => handleDragStartRank(e, k)} className="bg-k-surface border border-k-border text-k-text text-[10px] px-2 py-1.5 rounded cursor-grab leading-tight">{k}</div>)}
                       <input type="text" value={customKpiLQ32} onChange={e => setCustomKpiLQ32(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(customKpiLQ32.trim() && formData.l_ops_q32_ranked.length < 3) { setFormData(p => ({...p, l_ops_q32_ranked: [...p.l_ops_q32_ranked, customKpiLQ32.trim()]})); setCustomKpiLQ32('') } } }} placeholder="+ Agregar KPI propio" className="bg-k-surface text-k-text text-xs px-2 py-1.5 rounded border border-k-border outline-none mt-2" />
                    </div>
                 </div>
                 <div className="bg-k-orange/5 rounded-card p-3 border border-dashed border-k-orange/50 min-h-[150px] flex flex-col gap-2" onDragOver={handleDragOverRank} onDrop={e => handleDropRank(e, 'l_ops_q32_ranked', 'add', 3)}>
                    <p className="text-k-orange text-xs font-semibold mb-1">Top 3 KPIs</p>
                    {formData.l_ops_q32_ranked.map((k, i) => <div key={k} draggable onDragStart={e => handleDragStartRank(e, k)} className="bg-k-surface border border-k-orange text-k-text text-[10px] px-3 py-2 rounded flex items-center justify-between cursor-grab leading-tight"><span><span className="text-k-orange font-bold mr-2">{i+1}°</span> {k}</span><button type="button" onClick={() => setFormData(p => ({...p, l_ops_q32_ranked: p.l_ops_q32_ranked.filter(item => item !== k)}))} className="text-k-muted hover:text-red-400 shrink-0 ml-2">×</button></div>)}
                 </div>
              </div>
              <input type="text" name="l_ops_q32_system" value={formData.l_ops_q32_system} onChange={handleTextChange} maxLength={150} className={`${inputClass} text-xs mt-1`} placeholder="¿Tienen un sistema de medición activo donde reportar estos resultados? Ej: HubSpot..." />
            </Field>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-4 pt-4 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
          {currentStep > 1 ? (
            <button type="button" onClick={handlePrev} className="px-6 py-3 rounded-card text-sm font-medium text-k-muted hover:text-k-text hover:bg-k-surface2 transition-all flex items-center justify-center gap-2">
              <FiArrowLeft size={16} /> Paso Anterior
            </button>
          ) : (
            <button type="button" onClick={handleSaveDraft} disabled={uploading} className="px-6 py-3 rounded-card text-sm font-medium text-k-muted hover:text-k-text hover:bg-k-surface2 transition-all flex items-center justify-center gap-2">
              <FiSave size={16} /> Guardar borrador
            </button>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-4">
            {currentStep > 1 && (
                <button type="button" onClick={handleSaveDraft} disabled={uploading} className="px-6 py-3 rounded-card text-sm font-medium text-k-muted hover:text-k-text hover:bg-k-surface2 transition-all flex items-center justify-center gap-2">
                  <FiSave size={16} /> Guardar borrador
                </button>
            )}
            {currentStep < 4 ? (
              <button type="button" onClick={handleNext} className="px-6 py-3 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-all flex items-center justify-center gap-2">
                Siguiente Paso <FiArrowRight size={16} />
              </button>
            ) : (
              <button type="submit" disabled={uploading} className="px-6 py-3 rounded-card text-sm font-medium bg-k-orange hover:bg-k-orange/90 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {uploading ? 'Guardando...' : <><FiUploadCloud size={16} /> Enviar Formulario</>}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
