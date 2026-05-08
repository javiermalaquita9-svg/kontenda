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

  const {
    brandName, elevatorPitch, targetAudience, targetAudienceOptions,
    brandPersonality, brandPersonalityOptions, differentiator,
    colorPalette, prohibitedColors, colorPsychology, visualReferencesText,
    editingStyle, editingStyleManual, brandIdentityDriveLink,
    requiredFormats, requiredFormatsManual, reviewProcessContact, callToActions,
  } = brandData;

  const content = (
    <div className="bg-k-surface rounded-card-lg p-6 sm:p-8 flex flex-col gap-8" style={{ border: '1px solid var(--color-border)' }}>
      {/* Paso 1: ADN de Marca */}
      <div>
        <h2 className="text-k-text text-xl font-semibold mb-4">Paso 1: ADN de Marca</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Nombre de la marca y eslogan" value={brandName} />
          <InfoField label="Elevator Pitch" value={elevatorPitch} />
          <InfoField label="Audiencia Objetivo (Opciones)" value={targetAudienceOptions} />
          <InfoField label="Audiencia Objetivo (Detalles)" value={targetAudience} />
          <InfoField label="Personalidad de Marca (Opciones)" value={brandPersonalityOptions} />
          <InfoField label="Personalidad de Marca (Detalles)" value={brandPersonality} />
          <InfoField label="Diferenciador" value={differentiator} />
        </div>
      </div>

      {/* Paso 2: El Universo Visual */}
      <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-k-text text-xl font-semibold mb-4">Paso 2: El Universo Visual</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Estado de la Identidad (Drive)" value={brandIdentityDriveLink} isLink />
          
          {/* Paleta de Colores */}
          <div>
            <p className="text-k-muted text-xs mb-1">Paleta de Colores</p>
            {colorPalette && colorPalette.length > 0 && (
              <div className="flex w-full h-8 rounded-card overflow-hidden mb-2 border border-k-border">
                {colorPalette.filter(color => color.trim() !== '').map((color, index, filteredArr) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: color, flex: 1,
                      borderRight: index < filteredArr.length - 1 ? '1px solid var(--color-border)' : 'none'
                    }}
                    title={color}
                  ></div>
                ))}
              </div>
            )}
            {colorPalette && colorPalette.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {colorPalette.filter(color => color.trim() !== '').map((color, index) => (
                  <span key={index} className="bg-k-surface2 text-k-text text-xs px-2 py-1 rounded-card">
                    {color}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Colores Prohibidos */}
          <div>
            <p className="text-k-muted text-xs mb-1">Colores Prohibidos</p>
            {prohibitedColors && prohibitedColors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {prohibitedColors.filter(color => color.trim() !== '').map((color, index) => (
                  <span key={index} className="bg-k-surface2 text-k-text text-xs px-2 py-1 rounded-card">
                    {color}
                  </span>
                ))}
              </div>
            )}
          </div>

          <InfoField label="Psicología del Color" value={colorPsychology} />
          <InfoField label="Referencias Visuales (Links)" value={visualReferencesText} />
          <InfoField label="Estilo de Edición (Opciones)" value={editingStyle} />
          <InfoField label="Estilo de Edición (Manual)" value={editingStyleManual} />
        </div>
      </div>

      {/* Paso 3: El Flujo de Trabajo */}
      <div className="pt-6 border-t border-k-border" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-k-text text-xl font-semibold mb-4">Paso 3: El Flujo de Trabajo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Formatos Requeridos (Opciones)" value={requiredFormats} />
          <InfoField label="Formatos Requeridos (Manual)" value={requiredFormatsManual} />
          <InfoField label="Contacto Proceso de Revisión" value={reviewProcessContact} />
          <InfoField label="Llamados a la Acción (CTA)" value={callToActions} />
        </div>
      </div>
    </div>
  );

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