import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi';

function InfoField({ label, value, isLink = false }) {
  if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) return null;

  return (
    <div>
      <p className="text-k-muted text-xs mb-1">{label}</p>
      {isLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-k-orange text-sm hover:underline flex items-center gap-1">
          {value} <FiExternalLink size={12} />
        </a>
      ) : Array.isArray(value) ? (
        <div className="flex flex-wrap gap-2">
          {value.map((item, idx) => (
            <span key={idx} className="bg-k-surface2 text-k-text text-xs px-2 py-1 rounded-card">
              {typeof item === 'object' && item !== null && 'color' in item ? item.color : item}
              {typeof item === 'object' && item !== null && 'percentage' in item && item.percentage > 0 && ` (${item.percentage}%)`}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-k-text text-sm whitespace-pre-wrap">{value}</p>
      )}
    </div>
  );
}

export default function ClientBrandView({ clientId: propClientId, isModal = false }) {
  const params = useParams();
  const navigate = useNavigate();
  const clientId = isModal ? propClientId : params.clientId;

  const [brandData, setBrandData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchBrandData = async () => {
      if (!clientId) {
        if (isMounted) {
          setError("No se proporcionó ID de cliente.");
          setLoading(false);
        }
        return;
      }

      try {
        const brandFormRef = doc(db, 'clients', clientId, 'brandForm', 'latest');
        const docSnap = await getDoc(brandFormRef);

        if (!isMounted) return;

        if (docSnap.exists()) {
          setBrandData(docSnap.data());
        } else {
          setError("No se encontró información de marca para este cliente.");
        }
      } catch (err) {
        console.error("Error al obtener el formulario de marca del cliente:", err);
        if (isMounted) setError("Error al cargar la información de marca.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchBrandData();

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={() => navigate('/admin/clientes')} className="mt-8 px-5 py-2.5 bg-k-surface2 text-k-text rounded-card text-sm hover:brightness-110 transition-all">
          Volver a Clientes
        </button>
      </div>
    );
  }

  if (!brandData) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <h2 className="text-k-text text-2xl font-semibold mb-2">Sin información de marca</h2>
        <p className="text-k-muted text-sm">Este cliente aún no ha completado su formulario de marca.</p>
        <button onClick={() => navigate('/admin/clientes')} className="mt-8 px-5 py-2.5 bg-k-surface2 text-k-text rounded-card text-sm hover:brightness-110 transition-all">
          Volver a Clientes
        </button>
      </div>
    );
  }

  let content;
  const formType = brandData.formType;

  if (formType === 'small') {
    content = (
      <div className="bg-k-surface rounded-card-lg p-6 sm:p-8 flex flex-col gap-8" style={{ border: '1px solid var(--color-border)' }}>
        {/* Paso 1 */}
        <div>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 1: ADN de Marca</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="¿Qué dejaría de tener el mundo?" value={brandData.s_dna_q1} />
            <InfoField label="3 Valores Prioritarios" value={brandData.s_dna_q2} />
            <InfoField label="Problema que resuelve" value={`${brandData.s_dna_q3_cat}${brandData.s_dna_q3_text ? `: ${brandData.s_dna_q3_text}` : ''}`} />
            <InfoField label="Diferenciador / Imposible de imitar" value={brandData.s_dna_q4} />
            <InfoField label="Tono de Voz (Adjetivos)" value={brandData.s_dna_q5} />
            <div>
              <p className="text-k-muted text-xs mb-1">Marcas y Competencia</p>
              {brandData.s_dna_q6_admired?.length > 0 && <p className="text-k-text text-sm"><strong>Admiradas:</strong> {brandData.s_dna_q6_admired.join(', ')} ({brandData.s_dna_q6_admired_desc})</p>}
              {brandData.s_dna_q6_competitors?.length > 0 && <p className="text-k-text text-sm mt-1"><strong>Competencia:</strong> {brandData.s_dna_q6_competitors.join(', ')} ({brandData.s_dna_q6_comp_desc})</p>}
            </div>
            <InfoField label="Línea de tiempo a 1 año" value={`Hoy: ${brandData.s_dna_q7_today || '-'}\n3m: ${brandData.s_dna_q7_m3 || '-'}\n6m: ${brandData.s_dna_q7_m6 || '-'}\n12m: ${brandData.s_dna_q7_m12} [${brandData.s_dna_q7_goalType || 'General'}]`} />
            <InfoField label="Motivación Actual" value={`${brandData.s_dna_q8_cat}${brandData.s_dna_q8_text ? `: ${brandData.s_dna_q8_text}` : ''}`} />
          </div>
        </div>
        {/* Paso 2 */}
        <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 2: Universo Visual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-k-muted text-xs mb-1">Activos de Marca</p>
              {brandData.s_visual_q9_none ? <p className="text-k-text text-sm">Parten desde cero.</p> : (
                <>
                  <div className="flex flex-wrap gap-2 mb-2">{brandData.s_visual_q9_assets?.map(a => <span key={a} className="bg-k-surface2 text-k-text text-xs px-2 py-1 rounded-card">{a}</span>)}</div>
                  {brandData.s_visual_q9_link && <a href={brandData.s_visual_q9_link} target="_blank" rel="noreferrer" className="text-k-orange text-sm hover:underline flex items-center gap-1">Link Drive <FiExternalLink size={12} /></a>}
                </>
              )}
            </div>
            <div>
              <p className="text-k-muted text-xs mb-1">Restricciones de Color</p>
              {brandData.s_visual_q10_no_restrictions ? <p className="text-k-text text-sm">No tiene restricciones.</p> : (
                <div className="flex flex-col gap-3">
                  <div><p className="text-green-400 text-xs mb-1">Obligatorios:</p><div className="flex gap-2 mb-1">{brandData.s_visual_q10_mandatory?.map((c,i) => <div key={i} className="w-5 h-5 rounded-sm border border-k-border" style={{ backgroundColor: c }} title={c} />)}</div><p className="text-k-muted text-xs">{brandData.s_visual_q10_mandatory_reason}</p></div>
                  <div><p className="text-red-400 text-xs mb-1">Prohibidos:</p><div className="flex gap-2 mb-1">{brandData.s_visual_q10_forbidden?.map((c,i) => <div key={i} className="w-5 h-5 rounded-sm border border-k-border" style={{ backgroundColor: c }} title={c} />)}</div><p className="text-k-muted text-xs">{brandData.s_visual_q10_forbidden_reason}</p></div>
                </div>
              )}
            </div>
            <InfoField label="Conceptos Visuales" value={brandData.s_visual_q11_concepts} />
            <InfoField label="Ritmo de Video (1: Dinámico, 5: Contemplativo)" value={brandData.s_visual_q12_style_step} />
            <div>
              <p className="text-k-muted text-xs mb-1">Referencias (Moodboard)</p>
              <div className="flex flex-col gap-2">
                {brandData.s_visual_q13_references?.map((r, i) => r.url && <div key={i} className="bg-k-surface2 p-2 rounded-card text-xs"><a href={r.url} target="_blank" rel="noreferrer" className="text-k-orange hover:underline block truncate mb-1">{r.url}</a><p className="text-k-muted">{r.comment}</p></div>)}
              </div>
            </div>
            <InfoField label="Tipografías" value={`Decisión: ${brandData.s_visual_q14_typo_choice}\n${brandData.s_visual_q14_typo_custom ? `Detalle: ${brandData.s_visual_q14_typo_custom}` : ''}${brandData.s_visual_q14_typo_style ? `Estilo buscado: ${brandData.s_visual_q14_typo_style}` : ''}`} />
            <div>
              <p className="text-k-muted text-xs mb-1">Elementos Recurrentes</p>
              {brandData.s_visual_q15_none ? <p className="text-k-text text-sm">No usa actualmente.</p> : (
                <div className="flex flex-wrap gap-2">{brandData.s_visual_q15_elements?.map(e => <span key={e} className="bg-k-surface2 text-k-text text-xs px-2 py-1 rounded-card">{e}</span>)}</div>
              )}
            </div>
            <InfoField label="Apertura al Riesgo Visual (1 a 10)" value={brandData.s_visual_q16_risk} />
          </div>
        </div>
        {/* Paso 3 */}
        <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 3: Tu Cliente Ideal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Perfil del Cliente" value={`Edad: ${brandData.s_client_q17_age || '-'}\nLugar: ${brandData.s_client_q17_location || '-'}\nOcupación: ${brandData.s_client_q17_occupation?.join(', ') || '-'}\nDetalles: ${brandData.s_client_q17_details || '-'}`} />
            <InfoField label="Top 3 Frustraciones" value={brandData.s_client_q18_ranked} />
            <InfoField label="Plataformas y Contenido" value={`Plataformas: ${brandData.s_client_q19_platforms?.join(', ') || '-'}\nContenido: ${brandData.s_client_q19_content_types?.join(', ') || '-'}`} />
            <InfoField label="Barrera de Compra y Respuesta" value={`${brandData.s_client_q20_barrier || '-'}\nRespuesta: ${brandData.s_client_q20_response || '-'}`} />
            <div>
              <p className="text-k-muted text-xs mb-1">Sentimientos del Cliente</p>
              {brandData.s_client_q21_positive?.length > 0 && <p className="text-k-text text-sm"><strong>Positivos:</strong> {brandData.s_client_q21_positive.join(', ')}</p>}
              {brandData.s_client_q21_negative?.length > 0 && <p className="text-k-text text-sm mt-1"><strong>No aplica:</strong> {brandData.s_client_q21_negative.join(', ')}</p>}
              {brandData.s_client_q21_details && <p className="text-k-muted text-xs mt-1">{brandData.s_client_q21_details}</p>}
            </div>
            <InfoField label="Otros Intereses" value={brandData.s_client_q22_interests} />
            <InfoField label="Lenguaje del Cliente" value={`Registro (0-100): ${brandData.s_client_q23_register_slider}\nEspecialización (0-100): ${brandData.s_client_q23_specialization_slider}\nFrases: ${brandData.s_client_q23_phrases || '-'}`} />
            <InfoField label="Momento de Decisión" value={`${brandData.s_client_q24_trigger || '-'}\nDetalles: ${brandData.s_client_q24_details || '-'}`} />
          </div>
        </div>
        {/* Paso 4 */}
        <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 4: Operación y Logística</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Plataformas y Frecuencia" value={brandData.s_ops_q25_platforms?.map(p => `${p} (${brandData.s_ops_q25_freq?.[p] || 'Principal'})`)} />
            <InfoField label="Formatos Requeridos" value={brandData.s_ops_q26_formats} />
            <InfoField label="Volumen de Piezas" value={`Videos: ${brandData.s_ops_q27_videos}\nDiseños: ${brandData.s_ops_q27_designs}\n(${brandData.s_ops_q27_period})`} />
            <InfoField label="Material en Bruto" value={`${brandData.s_ops_q28_source || '-'}\nDetalles: ${brandData.s_ops_q28_details || '-'}`} />
            <InfoField label="Top 3 CTAs" value={brandData.s_ops_q29_ranked} />
            <InfoField label="Elementos Legales/Obligatorios" value={brandData.s_ops_q30_has_legal === 'yes' ? `Elementos: ${brandData.s_ops_q30_elements?.join(', ')}\nLink: ${brandData.s_ops_q30_link}\nDetalles: ${brandData.s_ops_q30_details}` : 'No requiere'} />
            <InfoField label="Proceso de Aprobación" value={`Revisor: ${brandData.s_ops_q31_reviewer || '-'}\nTiempo: ${brandData.s_ops_q31_time || '-'}\nDetalles: ${brandData.s_ops_q31_details || '-'}`} />
            <InfoField label="Top 3 KPIs" value={brandData.s_ops_q32_ranked} />
          </div>
        </div>
      </div>
    );
  } else if (formType === 'large') {
    content = (
      <div className="bg-k-surface rounded-card-lg p-6 sm:p-8 flex flex-col gap-8" style={{ border: '1px solid var(--color-border)' }}>
        {/* Paso 1 */}
        <div>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 1: ADN de Marca (Corp)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Vacío en el mercado" value={brandData.l_dna_q1} />
            <InfoField label="3 Valores Estratégicos" value={brandData.l_dna_q2} />
            <InfoField label="Problema y su Impacto" value={`${brandData.l_dna_q3_cat}\nImpacto: ${brandData.l_dna_q3_impact}\nDetalle: ${brandData.l_dna_q3_text}`} />
            <InfoField label="Diferenciador (No replicable)" value={brandData.l_dna_q4} />
            <InfoField label="Tono de Voz Corporativo" value={brandData.l_dna_q5} />
            <div className="md:col-span-2">
              <p className="text-k-muted text-xs mb-1">Ecosistema Competitivo</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {brandData.l_dna_q6_admired?.length > 0 && <div><p className="text-k-text text-sm font-semibold">🌟 Referentes</p><p className="text-k-text text-sm">{brandData.l_dna_q6_admired.join(', ')}</p><p className="text-k-muted text-xs mt-1">{brandData.l_dna_q6_admired_desc}</p></div>}
                {brandData.l_dna_q6_comp_dir?.length > 0 && <div><p className="text-k-text text-sm font-semibold">⚔️ Directa</p><p className="text-k-text text-sm">{brandData.l_dna_q6_comp_dir.join(', ')}</p><p className="text-k-muted text-xs mt-1">{brandData.l_dna_q6_comp_dir_desc}</p></div>}
                {brandData.l_dna_q6_comp_ind?.length > 0 && <div><p className="text-k-text text-sm font-semibold">👀 Indirecta</p><p className="text-k-text text-sm">{brandData.l_dna_q6_comp_ind.join(', ')}</p><p className="text-k-muted text-xs mt-1">{brandData.l_dna_q6_comp_ind_desc}</p></div>}
              </div>
            </div>
            <InfoField label="Visión a 12 Meses (Hitos)" value={`Hoy: ${brandData.l_dna_q7_today?.goal || '-'}\n3m: ${brandData.l_dna_q7_m3?.goal || '-'}\n6m: ${brandData.l_dna_q7_m6?.goal || '-'}\n9m: ${brandData.l_dna_q7_m9?.goal || '-'}\n12m: ${brandData.l_dna_q7_m12?.goal} (KPI: ${brandData.l_dna_q7_m12?.kpi})`} />
            <InfoField label="Motivación Estratégica" value={`${brandData.l_dna_q8_cat}\n${brandData.l_dna_q8_text}`} />
          </div>
        </div>
        {/* Paso 2 */}
        <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 2: Universo Visual</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-k-muted text-xs mb-1">Activos de Marca Corporativos</p>
              {brandData.l_visual_q9_none ? <p className="text-k-text text-sm">No cuentan con activos aún.</p> : (
                <div className="flex flex-col gap-2">
                  {brandData.l_visual_q9_assets && Object.entries(brandData.l_visual_q9_assets).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center bg-k-surface2 px-2 py-1.5 rounded text-xs border border-k-border">
                      <span className="text-k-text truncate max-w-[70%]">{k}</span>
                      <span className={`font-medium ${v === 'available' ? 'text-green-400' : 'text-k-orange'}`}>{v === 'available' ? 'Disponible' : 'Desactualizado'}</span>
                    </div>
                  ))}
                  {brandData.l_visual_q9_link && <a href={brandData.l_visual_q9_link} target="_blank" rel="noreferrer" className="text-k-orange text-xs hover:underline mt-1">Enlace a carpeta Drive →</a>}
                </div>
              )}
            </div>
            <div>
              <p className="text-k-muted text-xs mb-1">Estructura de Color</p>
              {brandData.l_visual_q10_no_restrictions ? <p className="text-k-text text-sm">Sin restricciones definidas.</p> : (
                <div className="flex flex-col gap-3">
                  <div><p className="text-green-400 text-xs mb-1">Primarios (Obligatorios):</p><div className="flex gap-2 flex-wrap">{brandData.l_visual_q10_primary?.map((c,i) => <div key={i} className="flex items-center gap-1 bg-k-surface2 p-1 rounded border border-k-border"><div className="w-4 h-4 rounded-sm border border-k-border" style={{ backgroundColor: c.hex }} title={c.hex} /><span className="text-[10px] text-k-muted">{c.hex} {c.pantone ? `(${c.pantone})` : ''}</span></div>)}</div></div>
                  {brandData.l_visual_q10_secondary?.length > 0 && <div><p className="text-blue-400 text-xs mb-1">Secundarios:</p><div className="flex gap-2 flex-wrap">{brandData.l_visual_q10_secondary.map((c,i) => <div key={i} className="flex items-center gap-1 bg-k-surface2 p-1 rounded border border-k-border"><div className="w-4 h-4 rounded-sm border border-k-border" style={{ backgroundColor: c.hex }} title={c.hex} /><span className="text-[10px] text-k-muted">{c.hex}</span></div>)}</div></div>}
                  {brandData.l_visual_q10_forbidden?.length > 0 && <div><p className="text-red-400 text-xs mb-1">Restringidos:</p><div className="flex gap-2 flex-wrap mb-1">{brandData.l_visual_q10_forbidden.map((c,i) => <div key={i} className="w-5 h-5 rounded-sm border border-k-border" style={{ backgroundColor: c.hex }} title={c.hex} />)}</div><p className="text-k-muted text-[10px]">{brandData.l_visual_q10_forbidden_reason}</p></div>}
                </div>
              )}
            </div>
            <InfoField label="Conceptos Visuales" value={brandData.l_visual_q11_concepts} />
            <InfoField label="Estilo de Montaje Video (1-5)" value={`Nivel ${brandData.l_visual_q12_style_step}\nDetalle: ${brandData.l_visual_q12_details || '-'}`} />
            <div className="md:col-span-2">
              <p className="text-k-muted text-xs mb-2">Referencias Aspiracionales</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {brandData.l_visual_q13_references?.map((r, i) => r.url && <div key={i} className="bg-k-surface2 p-3 rounded-card text-xs border border-k-border flex flex-col gap-1.5"><a href={r.url} target="_blank" rel="noreferrer" className="text-k-orange font-medium hover:underline truncate">{r.url}</a><span className="text-k-muted font-semibold">{r.platform}</span><p className="text-k-text line-clamp-2">{r.like}</p><span className="text-k-orange/80 text-[10px] bg-k-orange/10 px-2 py-0.5 rounded-full w-fit mt-1">{r.aspiration}</span></div>)}
              </div>
            </div>
            <InfoField label="Situación de Tipografías" value={`Selección: ${brandData.l_visual_q14_typo_choice}\nDetalles (Nombre/Enlace): ${brandData.l_visual_q14_typo_name || '-'}\nEn manual: ${brandData.l_visual_q14_typo_in_manual || '-'}\nDirección si actualizan: ${brandData.l_visual_q14_typo_direction || '-'}\nFalta actual: ${brandData.l_visual_q14_typo_missing || '-'}`} />
            <div>
              <p className="text-k-muted text-xs mb-1">Elementos Gráficos Recurrentes</p>
              {brandData.l_visual_q15_none ? <p className="text-k-text text-sm">No definidos aún.</p> : (
                <div className="flex flex-col gap-1.5">
                  {brandData.l_visual_q15_elements && Object.entries(brandData.l_visual_q15_elements).map(([el, st]) => (
                    <div key={el} className="flex justify-between items-center bg-k-surface2 px-2 py-1.5 rounded text-xs border border-k-border"><span className="text-k-text truncate max-w-[70%]">{el}</span><span className={`font-medium ${st === 'works_well' ? 'text-green-400' : 'text-k-orange'}`}>{st === 'works_well' ? 'Funciona' : 'Actualizar'}</span></div>
                  ))}
                  {brandData.l_visual_q15_untouchable && <p className="text-k-muted text-[10px] mt-1">Intocable: {brandData.l_visual_q15_untouchable}</p>}
                </div>
              )}
            </div>
            <InfoField label="Nivel de Disrupción Visual (1-10)" value={`Riesgo: ${brandData.l_visual_q16_risk}\nCanales: ${brandData.l_visual_q16_channels || '-'}\nRestricciones: ${brandData.l_visual_q16_restrictions || '-'}`} />
          </div>
        </div>
        {/* Paso 3 */}
        <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 3: Buyer Persona</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Perfil Demográfico y Decisor" value={`Decisor Edad: ${brandData.l_client_q17_age || '-'}\nUbicación: ${brandData.l_client_q17_location || '-'}\nSector: ${brandData.l_client_q17_sector || '-'}\nTamaño: ${brandData.l_client_q17_size || '-'}\nTipo Perfil: ${brandData.l_client_q17_decision || '-'}\n\nDetalles extra: ${brandData.l_client_q17_details || '-'}`} />
            <InfoField label="Top 3 Puntos de Dolor (Pain Points)" value={`${brandData.l_client_q18_ranked?.map((p, i) => `${i+1}. ${p}`).join('\n') || '-'}\n\nContexto: ${brandData.l_client_q18_context || '-'}`} />
            <InfoField label="Presencia y Contenido Consumido" value={`Top Plataformas: ${brandData.l_client_q19_platforms?.join(', ') || '-'}\nTipo de Contenido: ${brandData.l_client_q19_content?.join(', ') || '-'}\nMomento de consumo: ${brandData.l_client_q19_time || '-'}`} />
            <InfoField label="Barrera de Decisión Principal" value={`${brandData.l_client_q20_barrier || '-'}\n\nEtapa: ${brandData.l_client_q20_stage || '-'}\nArgumentos/Acciones: ${brandData.l_client_q20_arguments || '-'}`} />
            <div>
              <p className="text-k-muted text-xs mb-1">Transformación Esperada (Card Sorting)</p>
              <div className="flex flex-col gap-2">
                <div><p className="text-blue-400 text-xs mb-1">Funcional:</p><div className="flex flex-wrap gap-1">{brandData.l_client_q21_functional?.map((c,i) => <span key={i} className="bg-k-surface2 text-k-text text-[10px] px-1.5 py-0.5 rounded">{c}</span>)}</div></div>
                <div><p className="text-purple-400 text-xs mb-1">Estratégico:</p><div className="flex flex-wrap gap-1">{brandData.l_client_q21_strategic?.map((c,i) => <span key={i} className="bg-k-surface2 text-k-text text-[10px] px-1.5 py-0.5 rounded">{c}</span>)}</div></div>
                <div><p className="text-red-400 text-xs mb-1">Emocional:</p><div className="flex flex-wrap gap-1">{brandData.l_client_q21_emotional?.map((c,i) => <span key={i} className="bg-k-surface2 text-k-text text-[10px] px-1.5 py-0.5 rounded">{c}</span>)}</div></div>
              </div>
              {brandData.l_client_q21_missing && <p className="text-k-muted text-[10px] mt-2">Extra: {brandData.l_client_q21_missing}</p>}
            </div>
            <InfoField label="Otros Ámbitos e Intereses" value={brandData.l_client_q22_interests} />
            <InfoField label="Lenguaje y Especialización (Sliders)" value={`Formalidad (0-100): ${brandData.l_client_q23_formal}\nTécnico (0-100): ${brandData.l_client_q23_technical}\nSíntesis (0-100): ${brandData.l_client_q23_speed}\n\nTérminos Clave: ${brandData.l_client_q23_terms || '-'}`} />
            <InfoField label="Customer Journey (Puntos de Entrada)" value={brandData.l_client_q24_stages?.map(stage => {
              const details = brandData.l_client_q24_details?.[stage] || {};
              return `Etapa: ${stage}\nDesencadenante: ${details.trigger || '-'}\nContenido que convence: ${details.content || '-'}`;
            }).join('\n\n') || '-'} />
          </div>
        </div>
        {/* Paso 4 */}
        <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 4: Operación y Logística</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Canales Digitales y Roles" value={brandData.l_ops_q25_platforms?.map(p => `${p} (${brandData.l_ops_q25_roles?.[p] || 'Principal'})`)} />
            <InfoField label="Formatos y Uso" value={brandData.l_ops_q26_formats?.map(f => `${f}: ${brandData.l_ops_q26_usage?.[f] || 'Uso general'}`)} />
            <InfoField label="Volumen Estimado" value={`Videos: ${brandData.l_ops_q27_videos}\nMotion Graphics: ${brandData.l_ops_q27_motion}\nDiseños: ${brandData.l_ops_q27_designs}\nVariación: ${brandData.l_ops_q27_variation || '-'}${brandData.l_ops_q27_variation_details ? ` (${brandData.l_ops_q27_variation_details})` : ''}`} />
            <InfoField label="Plataforma de Material en Bruto" value={`${brandData.l_ops_q28_source || '-'}\nEstructura: ${brandData.l_ops_q28_structure === 'yes' ? brandData.l_ops_q28_structure_details : 'No'}\nResponsable: ${brandData.l_ops_q28_uploader || '-'}`} />
            <InfoField label="Top 3 CTAs" value={brandData.l_ops_q29_ranked} />
            <InfoField label="CTA Obligatorio" value={brandData.l_ops_q29_mandatory} />
            <InfoField label="Elementos Obligatorios" value={brandData.l_ops_q30_has_legal === 'yes' ? `${brandData.l_ops_q30_elements?.map(e => `${e}: ${brandData.l_ops_q30_details?.[e] || 'Sin specs'}`).join('\n')}\n\nLink: ${brandData.l_ops_q30_link || '-'}` : 'No requiere'} />
            <InfoField label="Aprobación y Feedback" value={`Responsable: ${brandData.l_ops_q31_name || '-'} (${brandData.l_ops_q31_role || '-'})\nTiempo: ${brandData.l_ops_q31_time || '-'}\nRondas: ${brandData.l_ops_q31_rounds || '-'}\nFlujo múltiple: ${brandData.l_ops_q31_multiple ? brandData.l_ops_q31_flow || 'Sí' : 'No'}\nParticularidades: ${brandData.l_ops_q31_particularity || '-'}`} />
            <InfoField label="Top 3 KPIs" value={brandData.l_ops_q32_ranked} />
            <InfoField label="Sistema de Medición" value={brandData.l_ops_q32_system} />
          </div>
        </div>
      </div>
    );
  } else {
    // Legacy Fallback (para los que ya se crearon antes de la actualización)
    content = (
      <div className="bg-k-surface rounded-card-lg p-6 sm:p-8 flex flex-col gap-8" style={{ border: '1px solid var(--color-border)' }}>
        <div>
          <h2 className="text-k-text text-xl font-semibold mb-4">Paso 1: ADN de Marca (Formulario Antiguo)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoField label="Nombre de la marca y eslogan" value={brandData.brandName} />
            <InfoField label="Elevator Pitch" value={brandData.elevatorPitch} />
            <InfoField label="Audiencia Objetivo (Detalles)" value={brandData.targetAudience} />
            <InfoField label="Personalidad de Marca (Opciones)" value={brandData.brandPersonalityOptions} />
          </div>
        </div>
      </div>
    );
  }

  if (isModal) {
    return content;
  }

  return (
    <div className="max-w-4xl">
      <button 
        onClick={() => navigate('/admin/clientes')} 
        className="flex items-center gap-2 text-k-muted hover:text-k-text text-sm mb-6 transition-colors w-fit"
      >
        <FiArrowLeft size={16} /> Volver a Clientes
      </button>

      <div className="mb-6">
        <h1 className="text-k-text text-2xl font-semibold">Información de Marca del Cliente</h1>
        <p className="text-k-muted text-sm mt-1">Detalles del brief de marca enviado por el cliente.</p>
      </div>

      {content}
    </div>
  );
}