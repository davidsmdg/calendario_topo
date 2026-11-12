import { useState, useEffect, useCallback } from "react";

export const SUGERENCIAS_PAUSA_ACTIVA = [
  "Gira suavemente los hombros hacia atrás y relaja el cuello.",
  "Momento sagrado: ve por un vasito de agua o un café.",
  "Parpadea y mira un punto lejano por la ventana durante 20 segundos.",
  "Estira los brazos hacia arriba y respira profundo.",
];

const TIEMPO_SESION_SEGUNDOS = 30 * 60; // 30 minutos = 1800 segundos
const TIEMPO_POSPONER_SEGUNDOS = 5 * 60; // 5 minutos = 300 segundos

export function usePausaActiva() {
  const [segundosRestantes, setSegundosRestantes] = useState<number>(TIEMPO_SESION_SEGUNDOS);
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  const [indiceSugerencia, setIndiceSugerencia] = useState<number>(0);
  const [pausado, setPausado] = useState<boolean>(false);

  useEffect(() => {
    if (mostrarModal || pausado) return;

    const timer = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          setIndiceSugerencia((idx) => (idx + 1) % SUGERENCIAS_PAUSA_ACTIVA.length);
          setMostrarModal(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mostrarModal, pausado]);

  const posponerCincoMinutos = useCallback(() => {
    setMostrarModal(false);
    setSegundosRestantes(TIEMPO_POSPONER_SEGUNDOS);
  }, []);

  const reiniciarTreintaMinutos = useCallback(() => {
    setMostrarModal(false);
    setSegundosRestantes(TIEMPO_SESION_SEGUNDOS);
  }, []);

  const abrirManualmente = useCallback(() => {
    setIndiceSugerencia((idx) => (idx + 1) % SUGERENCIAS_PAUSA_ACTIVA.length);
    setMostrarModal(true);
  }, []);

  const siguienteSugerencia = useCallback(() => {
    setIndiceSugerencia((idx) => (idx + 1) % SUGERENCIAS_PAUSA_ACTIVA.length);
  }, []);

  const minutosFormateados = `${String(Math.floor(segundosRestantes / 60)).padStart(2, "0")}:${String(
    segundosRestantes % 60
  ).padStart(2, "0")}`;

  return {
    segundosRestantes,
    minutosFormateados,
    mostrarModal,
    sugerenciaActual: SUGERENCIAS_PAUSA_ACTIVA[indiceSugerencia],
    posponerCincoMinutos,
    reiniciarTreintaMinutos,
    abrirManualmente,
    siguienteSugerencia,
    pausado,
    setPausado,
  };
}
