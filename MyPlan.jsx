import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase/config';
import { doc, collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth from its new location
import { useToast } from '../../context/ToastContext';
import { formatDate, getMonthLabel } from '../../utils/date';
import RoundIndicator from '../../components/shared/RoundIndicator';
import { FiExternalLink, FiWhatsapp } from 'react-icons/fi';

const MyPlan = () => {
  const { clientId, loading: authLoading } = useAuth(); // Get authLoading state
  const { showToast } = useToast();

  const [plan, setPlan] = useState(null);
  const [deliveries, setDeliveries] = useState([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(true);
  const [error, setError] = useState(null);

  const currentMonth = useMemo(() => new Date(), []);
  const currentMonthLabel = getMonthLabel(currentMonth.getMonth());
  const currentYear = currentMonth.getFullYear();

  // Fetch plan data
  useEffect(() => {
    if (authLoading) {
      // If authentication is still loading, we wait.
      // Keep local loading states true.
      return; // No change needed here, as we are just returning.
    }
    if (!clientId) { // If auth is done and no clientId, there's no plan to load.
      Promise.resolve().then(() => setLoadingPlan(false)); // Defer setState to avoid synchronous call in effect
      return;
    }

    const planRef = doc(db, 'clients', clientId, 'plan', 'current');
    const unsubscribe = onSnapshot(planRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setPlan({ id: docSnap.id, ...docSnap.data() });
        } else {
          setPlan(null);
        }
        setLoadingPlan(false);
      },
      (err) => {
        console.error("Error fetching plan:", err);
        showToast('Error al cargar el plan.', 'error');
        setError(err.message);
        setLoadingPlan(false);
      }
    );

    return () => unsubscribe();
  }, [clientId, showToast, authLoading]); // Added authLoading to dependencies

  // Fetch deliveries for the current month
  useEffect(() => {
    if (authLoading) {
      // If authentication is still loading, we wait.
      // Keep local loading states true.
      return; // No change needed here, as we are just returning.
    }
    if (!clientId) { // If auth is done and no clientId, there are no deliveries to load.
      Promise.resolve().then(() => setLoadingDeliveries(false)); // Defer setState to avoid synchronous call in effect
      return;
    }

    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    const deliveriesRef = collection(db, 'clients', clientId, 'deliveries');
    const q = query(
      deliveriesRef,
      where('scheduledDate', '>=', Timestamp.fromDate(startOfMonth)),
      where('scheduledDate', '<=', Timestamp.fromDate(endOfMonth)),
      orderBy('scheduledDate', 'asc') // Order by scheduledDate for consistency
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const fetchedDeliveries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDeliveries(fetchedDeliveries);
        setLoadingDeliveries(false);
      },
      (err) => {
        console.error("Error fetching deliveries:", err);
        showToast('Error al cargar las entregas.', 'error');
        setError(err.message);
        setLoadingDeliveries(false);
      }
    );

    return () => unsubscribe();
  }, [clientId, showToast, currentMonth, authLoading]); // Add authLoading to dependencies

  const isLoading = loadingPlan || loadingDeliveries;

  // Calculate metrics
  const producedPieces = plan?.producedPieces || 0;
  const totalPieces = plan?.totalPieces || 0;
  const totalReviewRoundsUsed = deliveries.reduce((sum, delivery) => sum + (delivery.reviewRounds || 0), 0);
  const nextBillingDate = plan?.nextBilling ? formatDate(plan.nextBilling.toDate()) : 'N/A';

  // Calculate progress bar step
  const progressSteps = [
    "Ficha recibida",
    "Calendario aprobado",
    "En producción",
    "Revisión",
    "Entrega final"
  ];

  let currentStep = 0; // Default: Ficha recibida

  if (deliveries && deliveries.length > 0) {
    currentStep = 1; // Calendario aprobado (at least 1 delivery exists)

    const hasInReview = deliveries.some(d => d.status === "in_review");
    const hasPendingOrAvailable = deliveries.some(d => d.status === "pending" || d.status === "available");
    const allAvailable = deliveries.every(d => d.status === "available");

    if (allAvailable) {
      currentStep = 4; // Entrega final
    } else if (hasInReview) {
      currentStep = 3; // Revisión
    } else if (hasPendingOrAvailable) {
      currentStep = 2; // En producción
    }
  }

  if (error) {
    return <div className="p-6 text-k-text">Error: {error}</div>;
  }

  return (
    <div className="p-6 text-k-text">
      <h1 className="text-3xl font-bold mb-6">Mi Plan</h1>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="w-7 h-7 border-2 border-k-orange/30 border-t-k-orange rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-k-surface p-4 rounded-card border" style={{ border: '1px solid var(--color-border)' }}>
              <p className="text-k-muted text-sm">Piezas producidas</p>
              <p className="text-2xl font-semibold">{producedPieces} / {totalPieces}</p>
            </div>
            <div className="bg-k-surface p-4 rounded-card border" style={{ border: '1px solid var(--color-border)' }}>
              <p className="text-k-muted text-sm">Rondas usadas (este mes)</p>
              <p className="text-2xl font-semibold">{totalReviewRoundsUsed}</p>
            </div>
            <div className="bg-k-surface p-4 rounded-card border" style={{ border: '1px solid var(--color-border)' }}>
              <p className="text-k-muted text-sm">Próximo cobro</p>
              <p className="text-2xl font-semibold">{nextBillingDate}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-k-surface p-6 rounded-card-lg mb-8 border" style={{ border: '1px solid var(--color-border)' }}>
            <h2 className="text-xl font-semibold mb-4">Progreso del ciclo de contenido</h2>
            <div className="flex justify-between items-center relative">
              {progressSteps.map((stepName, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center flex-1 z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                        ${index < currentStep ? 'bg-green-500 text-white' : ''}
                        ${index === currentStep ? 'bg-k-orange text-white' : ''}
                        ${index > currentStep ? 'bg-k-surface2 text-k-muted' : ''}
                      `}
                    >
                      {index + 1}
                    </div>
                    <p
                      className={`mt-2 text-center text-sm
                        ${index < currentStep ? 'text-green-300' : ''}
                        ${index === currentStep ? 'text-k-orange font-medium' : ''}
                        ${index > currentStep ? 'text-k-muted' : ''}
                      `}
                    >
                      {stepName}
                    </p>
                  </div>
                  {index < progressSteps.length - 1 && (
                    <div
                      className={`absolute h-1 top-4 left-[calc(${index * (100 / (progressSteps.length - 1))}%)_-_1rem] right-[calc(${(progressSteps.length - 1 - index) * (100 / (progressSteps.length - 1))}%)_-_1rem] -z-0
                        ${index < currentStep ? 'bg-green-500' : 'bg-k-surface2'}
                      `}
                      style={{ width: `calc(100% / ${progressSteps.length - 1})` }}
                    ></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Deliveries List */}
          <div className="bg-k-surface p-6 rounded-card-lg mb-8 border" style={{ border: '1px solid var(--color-border)' }}>
            <h2 className="text-xl font-semibold mb-4">Entregas de {currentMonthLabel} {currentYear}</h2>
            {deliveries.length === 0 ? (
              <div className="text-k-muted text-center py-8">
                No hay entregas programadas para este mes.
              </div>
            ) : (
              <div className="space-y-4">
                {deliveries
                  .sort((a, b) => a.deliveryNumber - b.deliveryNumber)
                  .map((delivery) => {
                    let borderColor = 'border-k-surface2/50'; // Default for pending
                    if (delivery.status === 'available') {
                      borderColor = 'border-[#E86A1A]'; // k-orange
                    } else if (delivery.status === 'in_review') {
                      borderColor = 'border-[#F5B800]'; // k-yellow
                    }

                    return (
                      <div
                        key={delivery.id}
                        className={`bg-k-surface2 p-4 rounded-card-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-l-4 ${borderColor}`}
                      >
                        <div className="flex-1">
                          <p className="text-lg font-semibold">
                            Entrega #{delivery.deliveryNumber} - {delivery.title}
                          </p>
                          <p className="text-k-muted text-sm">
                            Piezas: {delivery.pieces || 'N/A'}
                          </p>
                          <p className="text-k-muted text-sm">
                            Fecha coordinada: {delivery.scheduledDate ? formatDate(delivery.scheduledDate.toDate()) : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                          <RoundIndicator
                            used={delivery.reviewRounds || 0}
                            max={delivery.maxReviewRounds || 3}
                            size="md"
                          />
                          <span className="text-k-muted text-sm whitespace-nowrap">
                            Ronda {delivery.reviewRounds || 0} de {delivery.maxReviewRounds || 3}
                          </span>
                          <a
                            href={delivery.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 px-3 py-2 rounded-card text-sm font-medium transition-colors
                              ${delivery.status !== 'pending' && delivery.driveLink
                                ? 'bg-k-orange hover:bg-k-orange/80 text-white'
                                : 'bg-k-surface/50 text-k-muted cursor-not-allowed opacity-70'
                              }`}
                            onClick={(e) => {
                              if (delivery.status === 'pending' || !delivery.driveLink) {
                                e.preventDefault();
                                showToast('El enlace de Drive no está disponible aún.', 'info');
                              }
                            }}
                          >
                            Drive <FiExternalLink />
                          </a>
                          <a
                            href={delivery.frameLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-1 px-3 py-2 rounded-card text-sm font-medium transition-colors
                              ${delivery.status !== 'pending' && delivery.frameLink
                                ? 'bg-k-orange hover:bg-k-orange/80 text-white'
                                : 'bg-k-surface/50 text-k-muted cursor-not-allowed opacity-70'
                              }`}
                            onClick={(e) => {
                              if (delivery.status === 'pending' || !delivery.frameLink) {
                                e.preventDefault();
                                showToast('El enlace de Frame.io no está disponible aún.', 'info');
                              }
                            }}
                          >
                            Revisar (Frame.io) <FiExternalLink />
                          </a>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Fixed Note */}
          <div className="bg-k-surface p-6 rounded-card-lg text-center border" style={{ border: '1px solid var(--color-border)' }}>
            <p className="text-k-text mb-4">
              ¿Necesitas una ronda extra? Las correcciones adicionales tienen un valor de $40 USD por ronda.
              Escríbenos para coordinar.
            </p>
            <a
              href="https://wa.me/56968280822"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-card transition-colors"
            >
              <FiWhatsapp /> WhatsApp
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default MyPlan;