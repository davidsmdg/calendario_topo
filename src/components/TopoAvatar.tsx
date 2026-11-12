"use client";

import React from "react";

interface TopoAvatarProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "completo" | "personaje" | "texto" | "saludo" | "pausa" | "explorador";
  className?: string;
}

/**
 * Renderiza los logos oficiales en PNG de la Escuela Popular El Topo
 * ("/logo-completo.png", "/logo-personaje.png", "/logo-texto.png")
 * acompañados de detalles del mural (estrellita roja o flores mostaza).
 */
export function TopoAvatar({
  size = "md",
  variant = "personaje",
  className = "",
}: TopoAvatarProps) {
  if (variant === "completo") {
    const heights = {
      sm: "h-12",
      md: "h-16",
      lg: "h-24",
      xl: "h-32",
    }[size];
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/logo-completo.png"
          alt="Escuela Popular El Topo"
          className={`${heights} w-auto object-contain drop-shadow-sm`}
        />
      </div>
    );
  }

  if (variant === "texto") {
    const heights = {
      sm: "h-8",
      md: "h-11",
      lg: "h-16",
      xl: "h-20",
    }[size];
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/logo-texto.png"
          alt="Escuela Popular El Topo"
          className={`${heights} w-auto object-contain`}
        />
      </div>
    );
  }

  const dimensions = {
    sm: "h-12 w-auto",
    md: "h-16 w-auto",
    lg: "h-28 w-auto",
    xl: "h-36 w-auto",
  }[size];

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      title="Escuela Popular El Topo"
    >
      <img
        src="/logo-personaje.png"
        alt="Personaje El Topo"
        className={`${dimensions} object-contain drop-shadow-sm`}
      />
      {/* Estrella roja en la manita igual al mural */}
      <svg
        viewBox="0 0 32 32"
        className="w-5 h-5 absolute bottom-3 left-0 -translate-x-1 drop-shadow-sm"
      >
        <path
          d="M16 2L19.8 11.2L29.7 12L22.1 18.5L24.5 28.2L16 23L7.5 28.2L9.9 18.5L2.3 12L12.2 11.2L16 2Z"
          fill="#C82829"
          stroke="#2D2A26"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Sol sonriente pintado a mano igual al mural de El Topo
 */
export function SolMuralSVG({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className}>
      {/* Rayos sueltos estilo pincelada mostaza */}
      <g stroke="#D99B26" strokeWidth="3.5" strokeLinecap="round">
        <line x1="50" y1="6" x2="50" y2="18" />
        <line x1="50" y1="82" x2="50" y2="94" />
        <line x1="6" y1="50" x2="18" y2="50" />
        <line x1="82" y1="50" x2="94" y2="50" />
        <line x1="18" y1="18" x2="27" y2="27" />
        <line x1="73" y1="73" x2="82" y2="82" />
        <line x1="82" y1="18" x2="73" y2="27" />
        <line x1="27" y1="73" x2="18" y2="82" />
        <line x1="33" y1="9" x2="37" y2="20" />
        <line x1="67" y1="9" x2="63" y2="20" />
        <line x1="9" y1="33" x2="20" y2="37" />
        <line x1="91" y1="33" x2="80" y2="37" />
        <line x1="9" y1="67" x2="20" y2="63" />
        <line x1="91" y1="67" x2="80" y2="63" />
        <line x1="33" y1="91" x2="37" y2="80" />
        <line x1="67" y1="91" x2="63" y2="80" />
      </g>
      {/* Círculo del sol mostaza cálido */}
      <circle
        cx="50"
        cy="50"
        r="24"
        fill="#E5A93B"
        stroke="#B37D14"
        strokeWidth="2.5"
      />
      {/* Carita sonriente del sol del mural */}
      <circle cx="42" cy="45" r="2.2" fill="#5A3E1B" />
      <circle cx="58" cy="45" r="2.2" fill="#5A3E1B" />
      <path
        d="M40 55C43 61 57 61 60 55"
        stroke="#5A3E1B"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Abejita con estela punteada estilo mural
 */
export function AbejitaMuralSVG({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      {/* Alitas */}
      <ellipse
        cx="21"
        cy="16"
        rx="5"
        ry="7"
        transform="rotate(-20 21 16)"
        fill="#FAF8F5"
        stroke="#2D2A26"
        strokeWidth="2"
      />
      <ellipse
        cx="28"
        cy="16"
        rx="4.5"
        ry="6.5"
        transform="rotate(15 28 16)"
        fill="#FAF8F5"
        stroke="#2D2A26"
        strokeWidth="2"
      />
      {/* Cuerpo de abejita */}
      <ellipse
        cx="24"
        cy="26"
        rx="10"
        ry="7.5"
        fill="#E9A83B"
        stroke="#2D2A26"
        strokeWidth="2.2"
      />
      {/* Rayitas negras */}
      <path d="M20 19.5V32.5" stroke="#2D2A26" strokeWidth="2.5" />
      <path d="M25 18.8V33.2" stroke="#2D2A26" strokeWidth="2.5" />
      <path d="M30 20.5V31.5" stroke="#2D2A26" strokeWidth="2.2" />
      {/* Antenitas */}
      <path
        d="M16 22C13 19 12 17 11 17"
        stroke="#2D2A26"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Flor mostaza / ocre con tallo verde pintada como en el borde inferior del mural
 */
export function FlorMuralSVG({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className}>
      {/* Tallo y hojas verdes */}
      <path
        d="M32 36C32 45 30 54 31 62"
        stroke="#2E6F4E"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M31 50C23 46 18 49 20 54C24 55 28 53 31 50Z"
        fill="#2E6F4E"
      />
      <path
        d="M31 46C39 42 44 45 42 50C38 51 34 49 31 46Z"
        fill="#2E6F4E"
      />
      {/* Pétalos mostaza / ocre */}
      <circle cx="32" cy="16" r="7.5" fill="#D99B26" />
      <circle cx="44" cy="24" r="7.5" fill="#D99B26" />
      <circle cx="40" cy="36" r="7.5" fill="#D99B26" />
      <circle cx="24" cy="36" r="7.5" fill="#D99B26" />
      <circle cx="20" cy="24" r="7.5" fill="#D99B26" />
      {/* Centro terracota/café */}
      <circle cx="32" cy="26" r="6" fill="#8C4A27" />
      <circle cx="30" cy="24" r="1.5" fill="#FAF8F5" />
    </svg>
  );
}

/**
 * Franja decorativa inferior o superior con flores silvestres, enredaderas y caminitos de abejas del mural
 */
export function JardinMuralBarra({ className = "" }: { className?: string }) {
  return (
    <div
      className={`w-full overflow-hidden select-none pointer-events-none flex items-end justify-between px-6 py-1 opacity-90 ${className}`}
    >
      <div className="flex items-end gap-4">
        <FlorMuralSVG className="w-9 h-9" />
        <FlorMuralSVG className="w-7 h-7 -ml-2" />
        <AbejitaMuralSVG className="w-6 h-6 mb-4" />
      </div>

      {/* Línea punteada de vuelo de abejas estilo mural */}
      <svg
        viewBox="0 0 500 36"
        fill="none"
        className="hidden md:block flex-1 max-w-xl h-8 mx-4"
      >
        <path
          d="M10 26 C 90 4, 150 34, 240 16 C 330 -2, 390 32, 490 12"
          stroke="#2D2A26"
          strokeWidth="2.2"
          strokeDasharray="6 7"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex items-end gap-3">
        <AbejitaMuralSVG className="w-6 h-6 mb-5" />
        <FlorMuralSVG className="w-8 h-8" />
        <FlorMuralSVG className="w-10 h-10 -ml-1" />
      </div>
    </div>
  );
}
