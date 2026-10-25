'use client';

import React, { useState, useEffect } from 'react';
import consultaService from '@/services/consultaService';
import type { MunicipioAPI } from '@/types/api';

interface Coordenada {
  x: number; // Porcentaje en X (0-100) en el lienzo del mapa
  y: number; // Porcentaje en Y (0-100) en el lienzo del mapa
}

// Coordenadas geográficas normalizadas para proyección en el mapa de Colombia
const COORDENADAS_MUNICIPIOS: Record<string, Coordenada> = {
  // Por nombre normalizado
  bogota: { x: 52, y: 55 },
  medellin: { x: 42, y: 44 },
  cali: { x: 34, y: 64 },
  barranquilla: { x: 44, y: 15 },
  cartagena: { x: 38, y: 18 },
  bucaramanga: { x: 55, y: 39 },
  pereira: { x: 41, y: 53 },
  manizales: { x: 43, y: 51 },
  ibague: { x: 45, y: 57 },
  cucuta: { x: 61, y: 34 },
  santamarta: { x: 48, y: 14 },
  pasto: { x: 28, y: 78 },
  villavicencio: { x: 57, y: 58 },
  // Por código DANE
  '11001': { x: 52, y: 55 }, // Bogotá
  '05001': { x: 42, y: 44 }, // Medellín
  '76001': { x: 34, y: 64 }, // Cali
};

function obtenerCoordenada(municipio: MunicipioAPI, index: number, total: number): Coordenada {
  if (municipio.codigo_dane && COORDENADAS_MUNICIPIOS[municipio.codigo_dane]) {
    return COORDENADAS_MUNICIPIOS[municipio.codigo_dane];
  }
  const clave = municipio.nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

  if (COORDENADAS_MUNICIPIOS[clave]) {
    return COORDENADAS_MUNICIPIOS[clave];
  }

  // Fallback si el administrador crea un nuevo municipio no catalogado
  const angulo = (index / Math.max(total, 1)) * 2 * Math.PI;
  return {
    x: Math.min(85, Math.max(20, 50 + Math.cos(angulo) * 22)),
    y: Math.min(85, Math.max(20, 50 + Math.sin(angulo) * 22)),
  };
}

interface MapaMunicipiosProps {
  municipios?: MunicipioAPI[];
  municipioSeleccionadoId?: string | number | null;
  onSeleccionarMunicipio: (municipio: MunicipioAPI) => void;
  titulo?: string;
  subtitulo?: string;
}

export default function MapaMunicipios({
  municipios: municipiosProp,
  municipioSeleccionadoId,
  onSeleccionarMunicipio,
  titulo = 'Mapa de Municipios con Pico y Placa',
  subtitulo = 'Selecciona un municipio en el mapa para verificar el estado de restricción vehicular.',
}: MapaMunicipiosProps) {
  const [municipios, setMunicipios] = useState<MunicipioAPI[]>(municipiosProp || []);
  const [loading, setLoading] = useState<boolean>(!municipiosProp);
  const [error, setError] = useState<string | null>(null);
  const [hoveredMunicipio, setHoveredMunicipio] = useState<MunicipioAPI | null>(null);

  useEffect(() => {
    if (municipiosProp) {
      setMunicipios(municipiosProp);
      setLoading(false);
      return;
    }

    let cancel = false;
    setLoading(true);
    consultaService
      .getMunicipios()
      .then((data) => {
        if (!cancel) {
          setMunicipios(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancel) {
          setError('No fue posible cargar los municipios con restricción activa.');
        }
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, [municipiosProp]);

  const municipioActivo =
    hoveredMunicipio ||
    municipios.find((m) => String(m.id) === String(municipioSeleccionadoId)) ||
    municipios[0] ||
    null;

  return (
    <div className="space-y-6" id="seccion-mapa-municipios">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
        <div>
          <h2 className="text-xl font-bold text-primary-800 flex items-center gap-2">
            <span>🗺️</span>
            <span>{titulo}</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">{subtitulo}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          {loading ? 'Cargando...' : `${municipios.length} municipios con decreto activo`}
        </span>
      </div>

      {loading && (
        <div className="p-8 text-center text-gray-500 animate-pulse space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-100 flex items-center justify-center text-xl">
            🧭
          </div>
          <p className="text-sm">Cargando mapa interactivo desde la API...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button
            onClick={() => {
              setLoading(true);
              consultaService
                .getMunicipios()
                .then(setMunicipios)
                .catch(() => setError('Error al reintentar'))
                .finally(() => setLoading(false));
            }}
            className="underline font-semibold hover:text-red-900"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && municipios.length === 0 && (
        <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-200">
          <p className="text-gray-600 text-sm">
            No se encontraron municipios con decretos de Pico y Placa vigentes en este momento.
          </p>
        </div>
      )}

      {!loading && !error && municipios.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Mapa Visual Interactivo (SVG estilizado de Colombia) */}
          <div className="lg:col-span-7 bg-gradient-to-b from-blue-50/40 to-slate-50 border border-blue-100/80 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
            {/* Silueta geográfica estilizada de Colombia en SVG */}
            <svg
              viewBox="0 0 400 500"
              className="w-full max-w-[340px] h-auto drop-shadow-sm select-none"
              aria-label="Mapa de Colombia con municipios restringidos"
            >
              <defs>
                <linearGradient id="colombiaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.95" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Contorno simplificado y reconocible de Colombia */}
              <path
                d="M 145,28 
                   C 165,18 200,10 220,15 
                   C 230,25 210,50 200,65 
                   C 220,75 255,110 260,145 
                   C 265,175 305,190 320,225 
                   C 335,260 300,285 285,320 
                   C 270,355 260,390 235,420 
                   C 215,445 200,480 180,485 
                   C 160,490 145,465 130,440 
                   C 115,415 90,380 85,355 
                   C 80,330 65,300 70,265 
                   C 75,230 95,200 110,170 
                   C 120,145 110,110 115,80 
                   C 120,55 130,35 145,28 Z"
                fill="url(#colombiaGrad)"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* Guías náuticas / costas */}
              <path
                d="M 115,80 C 130,95 140,115 145,140"
                fill="none"
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <path
                d="M 160,180 C 175,220 180,260 185,300"
                fill="none"
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
            </svg>

            {/* Marcadores interactivos ubicados dinámicamente sobre el mapa */}
            <div className="absolute inset-0 pointer-events-none">
              {municipios.map((m, idx) => {
                const coord = obtenerCoordenada(m, idx, municipios.length);
                const isSelected = String(m.id) === String(municipioSeleccionadoId);
                const isHovered = hoveredMunicipio?.id === m.id;

                return (
                  <div
                    key={m.id}
                    style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                  >
                    <button
                      type="button"
                      id={`pin-municipio-${m.id}`}
                      onClick={() => onSeleccionarMunicipio(m)}
                      onMouseEnter={() => setHoveredMunicipio(m)}
                      onMouseLeave={() => setHoveredMunicipio(null)}
                      className={`group relative flex items-center justify-center transition-all duration-200 focus:outline-none ${
                        isSelected ? 'scale-125 z-30' : isHovered ? 'scale-115 z-20' : 'z-10'
                      }`}
                      aria-label={`Seleccionar municipio ${m.nombre}`}
                    >
                      {/* Onda de pulso para municipios con restricción */}
                      <span
                        className={`absolute w-7 h-7 rounded-full animate-ping opacity-60 ${
                          isSelected ? 'bg-red-400' : 'bg-emerald-400'
                        }`}
                      ></span>

                      {/* Pin central */}
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shadow-md border-2 border-white transition-colors ${
                          isSelected
                            ? 'bg-red-600 ring-2 ring-red-400'
                            : isHovered
                              ? 'bg-primary-600 ring-2 ring-primary-300'
                              : 'bg-emerald-600'
                        }`}
                      >
                        📍
                      </span>

                      {/* Etiqueta flotante con nombre */}
                      <span
                        className={`absolute top-full mt-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide whitespace-nowrap shadow-sm border transition-all ${
                          isSelected
                            ? 'bg-red-600 text-white border-red-700 shadow-md scale-105'
                            : isHovered
                              ? 'bg-primary-800 text-white border-primary-900'
                              : 'bg-white/95 text-gray-800 border-gray-200'
                        }`}
                      >
                        {m.nombre}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Leyenda interactiva al pie del mapa */}
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200/80">
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Decreto vigente
              </span>
              <span className="flex items-center gap-1.5 font-medium text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                Seleccionado
              </span>
            </div>
          </div>

          {/* Panel Lateral: Detalle del Municipio y Lista Rápida */}
          <div className="lg:col-span-5 space-y-4">
            {municipioActivo && (
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  String(municipioActivo.id) === String(municipioSeleccionadoId)
                    ? 'bg-primary-50/70 border-primary-200 shadow-sm'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-primary-700 bg-primary-100/80 px-2.5 py-0.5 rounded-full">
                    Municipio Seleccionado
                  </span>
                  <span className="text-xs text-gray-400">DANE: {municipioActivo.codigo_dane || 'N/A'}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-2">{municipioActivo.nombre}</h3>
                <p className="text-sm text-gray-500">{municipioActivo.departamento}, Colombia</p>

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-emerald-800 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <span>🛡️</span>
                    <span>Decreto de Pico y Placa Activo</span>
                  </p>
                  <p className="text-emerald-700">
                    Aplica restricción de circulación vehicular según el calendario oficial municipal.
                  </p>
                </div>

                <button
                  type="button"
                  id={`btn-elegir-mapa-${municipioActivo.id}`}
                  onClick={() => onSeleccionarMunicipio(municipioActivo)}
                  className="w-full mt-4 btn-primary py-2 text-sm flex items-center justify-center gap-2"
                >
                  <span>✓</span>
                  <span>Consultar en {municipioActivo.nombre}</span>
                </button>
              </div>
            )}

            {/* Lista interactiva de municipios disponibles */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Municipios con Restricción (Click para elegir):
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {municipios.map((m) => {
                  const seleccionado = String(m.id) === String(municipioSeleccionadoId);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      id={`card-municipio-${m.id}`}
                      onClick={() => onSeleccionarMunicipio(m)}
                      onMouseEnter={() => setHoveredMunicipio(m)}
                      onMouseLeave={() => setHoveredMunicipio(null)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        seleccionado
                          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                          : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-200'
                      }`}
                    >
                      <div>
                        <p className={`font-semibold text-sm ${seleccionado ? 'text-white' : 'text-gray-900'}`}>
                          {m.nombre}
                        </p>
                        <p className={`text-xs ${seleccionado ? 'text-primary-100' : 'text-gray-500'}`}>
                          {m.departamento}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          seleccionado ? 'bg-white text-primary-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        Activo
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
