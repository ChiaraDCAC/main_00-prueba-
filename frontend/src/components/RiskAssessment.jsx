import { useState } from 'react';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  CheckCircle2,
  Sparkles,
  ClipboardCheck,
  X,
  UserCheck,
  Globe,
  Briefcase,
  CheckCircle,
  Play,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  FileText,
  BarChart3,
  Building,
} from 'lucide-react';

const RiskAssessment = ({
  client,
  initialData = {},
  onSave,
  readOnly = false,
}) => {
  const [selectedRisk, setSelectedRisk] = useState(initialData.riskLevel || null);
  const [isHovering, setIsHovering] = useState(null);
  const [showDDForm, setShowDDForm] = useState(false);
  const [ddCompleted, setDdCompleted] = useState(false);
  // Datos DDS (Debida Diligencia Simple - Riesgo Bajo)
  const [ddsData, setDdsData] = useState({
    // Datos personales
    nombre: '',
    apellido: '',
    cuit: '',
    cuil: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    // Actividad
    actividadLaboral: '',
    // Domicilio
    calle: '',
    numero: '',
    localidad: '',
    provincia: '',
    pais: 'Argentina',
    codigoPostal: '',
    // Otros datos
    nacionalidad: 'Argentina',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    // Verificaciones externas
    nosisConsultado: false,
    nosisResultado: '',
    nivelSocioeconomico: '',
  });

  // Datos DD genéricos (DDM/DDR)
  const [ddData, setDdData] = useState({
    identidadVerificada: false,
    documentoVigente: false,
    fotoCoincide: false,
    consultaPEP: false,
    resultadoPEP: 'no_pep',
    consultaOFAC: false,
    consultaONU: false,
    consultaUIF: false,
    resultadoListas: 'sin_coincidencias',
    actividadVerificada: false,
    ingresosConcuerdan: false,
    origenFondosVerificado: false,
  });

  const riskLevels = {
    bajo: {
      title: 'Bajo',
      subtitle: 'DDS',
      fullName: 'Debida Diligencia Simplificada',
      description: 'Monitoreo estándar cada 5 años',
      icon: TrendingDown,
      gradient: 'from-emerald-400 via-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/25',
      ring: 'ring-emerald-400',
      bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
      iconBg: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    },
    medio: {
      title: 'Medio',
      subtitle: 'DDM',
      fullName: 'Debida Diligencia Media',
      description: 'Monitoreo periódico cada 3 años',
      icon: Minus,
      gradient: 'from-amber-400 via-orange-500 to-amber-600',
      glow: 'shadow-amber-500/25',
      ring: 'ring-amber-400',
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
      iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    },
    alto: {
      title: 'Alto',
      subtitle: 'DDR',
      fullName: 'Debida Diligencia Reforzada',
      description: 'Monitoreo continuo anual',
      icon: TrendingUp,
      gradient: 'from-rose-400 via-red-500 to-pink-600',
      glow: 'shadow-red-500/25',
      ring: 'ring-red-400',
      bg: 'bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/40 dark:to-pink-950/40',
      iconBg: 'bg-gradient-to-br from-rose-400 to-pink-500',
    },
  };

  const handleSelectRisk = (level) => {
    if (!readOnly) {
      setSelectedRisk(level);
    }
  };

  const handleSave = () => {
    if (onSave && selectedRisk) {
      onSave({
        riskLevel: selectedRisk,
        finalRiskLevel: selectedRisk,
        dueDiligenceType: riskLevels[selectedRisk].fullName,
        ddCompleted,
        ddData: ddCompleted ? (selectedRisk === 'bajo' ? ddsData : ddData) : null,
        ddsData: selectedRisk === 'bajo' && ddCompleted ? ddsData : null,
      });
    }
  };

  const handleCompletarDD = () => {
    setDdCompleted(true);
    setShowDDForm(false);
  };

  const currentRisk = selectedRisk ? riskLevels[selectedRisk] : null;

  return (
    <div className="space-y-8">
      {/* Header con efecto glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3879a3] via-[#4a8ab5] to-[#2d6a8a] p-8">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Evaluación de Riesgo
              </h2>
              <p className="text-white/70 text-sm mt-1">
                Seleccione el nivel de riesgo para este cliente
              </p>
            </div>
          </div>

          {/* Badge de estado actual */}
          {currentRisk && (
            <div className={`px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${currentRisk.iconBg} flex items-center justify-center shadow-lg`}>
                  <currentRisk.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{currentRisk.subtitle}</p>
                  <p className="text-white/70 text-xs">{currentRisk.title}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards de selección de riesgo */}
      <div className="grid grid-cols-3 gap-6">
        {Object.entries(riskLevels).map(([level, config]) => {
          const isSelected = selectedRisk === level;
          const isHovered = isHovering === level;
          const Icon = config.icon;

          return (
            <button
              key={level}
              type="button"
              onClick={() => handleSelectRisk(level)}
              onMouseEnter={() => setIsHovering(level)}
              onMouseLeave={() => setIsHovering(null)}
              disabled={readOnly}
              className={`
                relative group p-6 rounded-2xl border-2 transition-all duration-500 ease-out
                ${isSelected
                  ? `${config.bg} border-transparent ${config.ring} ring-2 ring-offset-4 ring-offset-white dark:ring-offset-gray-900 shadow-2xl ${config.glow} scale-[1.02]`
                  : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-xl'
                }
                ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
              `}
            >
              {isSelected && (
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-gray-900 shadow-lg flex items-center justify-center">
                  <CheckCircle2 className={`w-6 h-6 ${level === 'bajo' ? 'text-emerald-500' : level === 'medio' ? 'text-amber-500' : 'text-red-500'}`} />
                </div>
              )}

              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${config.gradient} opacity-0 transition-opacity duration-300 ${isHovered && !isSelected ? 'opacity-5' : ''}`}></div>

              <div className="relative flex flex-col items-center text-center space-y-4">
                <div className={`
                  w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-500
                  ${isSelected
                    ? `${config.iconBg} shadow-xl`
                    : 'bg-gray-100 dark:bg-gray-700 group-hover:scale-110'
                  }
                `}>
                  <Icon className={`w-10 h-10 ${isSelected ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>

                <div className="space-y-1">
                  <span className={`
                    text-2xl font-bold tracking-tight transition-colors
                    ${isSelected
                      ? (level === 'bajo' ? 'text-emerald-700 dark:text-emerald-400' : level === 'medio' ? 'text-amber-700 dark:text-amber-400' : 'text-red-700 dark:text-red-400')
                      : 'text-gray-700 dark:text-gray-200'
                    }
                  `}>
                    {config.title}
                  </span>
                  <p className={`
                    text-xs font-medium px-3 py-1 rounded-full inline-block
                    ${isSelected
                      ? `bg-gradient-to-r ${config.gradient} text-white shadow-md`
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }
                  `}>
                    {config.subtitle}
                  </p>
                </div>

                <p className={`text-xs transition-colors ${isSelected ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                  {config.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Panel de confirmación */}
      {selectedRisk && (
        <div className={`rounded-2xl ${riskLevels[selectedRisk].bg} border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-500`}>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${riskLevels[selectedRisk].iconBg} flex items-center justify-center`}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                    {riskLevels[selectedRisk].fullName}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {riskLevels[selectedRisk].description}
                  </p>
                </div>
              </div>

              {/* Estado DD */}
              {ddCompleted && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">DD Completada</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          {!readOnly && (
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowDDForm(true)}
                className={`
                  flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all duration-300
                  ${ddCompleted
                    ? 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                    : 'bg-white dark:bg-gray-800 text-[#3879a3] border-2 border-[#3879a3] hover:bg-[#3879a3]/5'
                  }
                `}
              >
                <ClipboardCheck className="w-5 h-5" />
                {ddCompleted ? 'Editar DD' : 'Completar DD'}
              </button>
              <button
                onClick={handleSave}
                className={`
                  flex-1 py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-3
                  bg-gradient-to-r ${riskLevels[selectedRisk].gradient}
                  hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]
                  transition-all duration-300 ${riskLevels[selectedRisk].glow} shadow-lg
                `}
              >
                <Zap className="w-5 h-5" />
                Confirmar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Estado vacío */}
      {!selectedRisk && (
        <div className="text-center py-8 px-6 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Seleccione un nivel de riesgo para continuar
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            El tipo de debida diligencia se asignará automáticamente
          </p>
        </div>
      )}

      {/* Modal DD Form */}
      {showDDForm && selectedRisk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-[#3879a3] to-[#2d6a8a]">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {riskLevels[selectedRisk].fullName}
                  </h2>
                  <p className="text-sm text-white/80">
                    Complete las verificaciones requeridas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDDForm(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* DDS Form - Debida Diligencia Simple (Riesgo Bajo) */}
              {selectedRisk === 'bajo' ? (
                <div className="space-y-6">
                  {/* DDS Simplificada */}

                  {/* NSE */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-900/20 dark:to-teal-900/10 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
                    <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-2 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Nivel Socioeconómico (NSE) *
                    </h3>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mb-5">Seleccioná el nivel socioeconómico del cliente.</p>
                    <div className="grid grid-cols-5 gap-3">
                      {[
                        { value: 'ABC1', label: 'ABC1', sub: 'Alto', color: 'from-emerald-500 to-green-600', lightColor: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' },
                        { value: 'C2', label: 'C2', sub: 'Med. Alto', color: 'from-blue-500 to-cyan-600', lightColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700' },
                        { value: 'C3', label: 'C3', sub: 'Medio', color: 'from-amber-500 to-yellow-600', lightColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700' },
                        { value: 'D1', label: 'D1', sub: 'Med. Bajo', color: 'from-orange-500 to-red-500', lightColor: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700' },
                        { value: 'D2E', label: 'D2/E', sub: 'Bajo', color: 'from-red-500 to-rose-600', lightColor: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700' },
                      ].map((nse) => (
                        <button
                          key={nse.value}
                          type="button"
                          onClick={() => setDdsData(prev => ({ ...prev, nivelSocioeconomico: nse.value }))}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            ddsData.nivelSocioeconomico === nse.value
                              ? `bg-gradient-to-br ${nse.color} text-white border-transparent shadow-lg scale-105`
                              : `${nse.lightColor} hover:scale-105`
                          }`}
                        >
                          <span className="text-base font-bold block">{nse.label}</span>
                          <span className={`text-[10px] ${ddsData.nivelSocioeconomico === nse.value ? 'text-white/80' : 'opacity-70'}`}>{nse.sub}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>              ) : (
                /* DDM/DDR Form - Debida Diligencia Media/Reforzada */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Verificación de Identidad */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#3879a3]" />
                    Verificación de Identidad
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'identidadVerificada', label: 'Identidad verificada con documento' },
                      { key: 'documentoVigente', label: 'Documento vigente' },
                      { key: 'fotoCoincide', label: 'Foto coincide con el titular' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                        <button
                          type="button"
                          onClick={() => setDdData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            ddData[item.key]
                              ? 'bg-[#3879a3] text-white'
                              : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                          }`}
                        >
                          {ddData[item.key] && <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Verificación PEP */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#3879a3]" />
                    Verificación PEP
                  </h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <button
                        type="button"
                        onClick={() => setDdData(prev => ({ ...prev, consultaPEP: !prev.consultaPEP }))}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          ddData.consultaPEP
                            ? 'bg-[#3879a3] text-white'
                            : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                        }`}
                      >
                        {ddData.consultaPEP && <CheckCircle className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Consulta PEP realizada</span>
                    </label>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Resultado</label>
                      <select
                        value={ddData.resultadoPEP}
                        onChange={(e) => setDdData(prev => ({ ...prev, resultadoPEP: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="no_pep">No es PEP</option>
                        <option value="pep_nacional">PEP Nacional</option>
                        <option value="pep_extranjero">PEP Extranjero</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Verificación Listas */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#3879a3]" />
                    Verificación Listas Restrictivas
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'consultaOFAC', label: 'Lista OFAC consultada' },
                      { key: 'consultaONU', label: 'Lista ONU consultada' },
                      { key: 'consultaUIF', label: 'Lista UIF consultada' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                        <button
                          type="button"
                          onClick={() => setDdData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            ddData[item.key]
                              ? 'bg-[#3879a3] text-white'
                              : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                          }`}
                        >
                          {ddData[item.key] && <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                      </label>
                    ))}
                    <div className="pt-2">
                      <label className="text-xs text-gray-500 mb-1 block">Resultado</label>
                      <select
                        value={ddData.resultadoListas}
                        onChange={(e) => setDdData(prev => ({ ...prev, resultadoListas: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="sin_coincidencias">Sin coincidencias</option>
                        <option value="coincidencia_parcial">Coincidencia parcial</option>
                        <option value="coincidencia_total">Coincidencia total</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Verificación Actividad */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#3879a3]" />
                    Verificación de Actividad
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'actividadVerificada', label: 'Actividad económica verificada' },
                      { key: 'ingresosConcuerdan', label: 'Ingresos concuerdan con perfil' },
                      { key: 'origenFondosVerificado', label: 'Origen de fondos verificado' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 cursor-pointer group">
                        <button
                          type="button"
                          onClick={() => setDdData(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                            ddData[item.key]
                              ? 'bg-[#3879a3] text-white'
                              : 'bg-gray-200 dark:bg-gray-700 group-hover:bg-gray-300 dark:group-hover:bg-gray-600'
                          }`}
                        >
                          {ddData[item.key] && <CheckCircle className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between">
              <button
                onClick={() => setShowDDForm(false)}
                className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompletarDD}
                className="px-5 py-2.5 bg-[#3879a3] text-white rounded-xl hover:bg-[#2d6a8a] transition-colors font-medium flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Completar DD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessment;
