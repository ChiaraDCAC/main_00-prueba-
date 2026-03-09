import { useState, useMemo } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import PersonPepUploader from './PersonPepUploader';

/**
 * SocietyPepDeclarations - Lista de DDJJ PEP de todas las personas de la sociedad
 *
 * Durante el alta de la sociedad, muestra una DDJJ PEP por cada persona humana:
 * - Socios / Beneficiarios finales
 * - Representantes legales / Autoridades
 * - Apoderados
 * - Firmantes
 *
 * Todas las DDJJ PEP deben estar completas para aprobar la documentación.
 * Si alguna persona es PEP, requiere aprobación del Oficial de Cumplimiento.
 */

const SocietyPepDeclarations = ({
  persons = [], // Lista de todas las personas de la sociedad
  pepDeclarations = {}, // { personId: pepData }
  onSavePepDeclaration,
  onUploadDocument,
  onUploadAdditionalDoc,
  readOnly = false,
}) => {
  const [expandedGroups, setExpandedGroups] = useState({
    beneficiarios: true,
    representantes: true,
    apoderados: true,
    firmantes: true,
  });

  // Agrupar personas por tipo
  const groupedPersons = useMemo(() => ({
    beneficiarios: persons.filter(p =>
      p.type === 'beneficial_owner' || p.type === 'socio'
    ),
    representantes: persons.filter(p =>
      p.type === 'authority' || p.type === 'representative' || p.type === 'presidente' || p.type === 'director'
    ),
    apoderados: persons.filter(p => p.type === 'attorney' || p.type === 'apoderado'),
    firmantes: persons.filter(p => p.type === 'signatory' || p.type === 'firmante'),
  }), [persons]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = persons.length;
    const completed = Object.values(pepDeclarations).filter(d =>
      d && d.isPep !== null && (d.documentFile || d.documentUrl)
    ).length;
    const peps = Object.values(pepDeclarations).filter(d => d?.isPep === true).length;
    const pendingApproval = Object.values(pepDeclarations).filter(d =>
      d?.isPep === true && d?.status === 'pending_approval'
    ).length;

    return { total, completed, pending: total - completed, peps, pendingApproval };
  }, [persons, pepDeclarations]);

  const toggleGroup = (group) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const renderGroup = (title, groupPersons, groupKey, icon) => {
    if (groupPersons.length === 0) return null;

    const isExpanded = expandedGroups[groupKey];
    const completedInGroup = groupPersons.filter(p => {
      const decl = pepDeclarations[p.id];
      return decl && decl.isPep !== null && (decl.documentFile || decl.documentUrl);
    }).length;

    return (
      <div className="mb-6">
        <button
          className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={() => toggleGroup(groupKey)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium text-gray-900 dark:text-white">{title}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              completedInGroup === groupPersons.length
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {completedInGroup}/{groupPersons.length} completas
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {groupPersons.map(person => (
              <PersonPepUploader
                key={person.id}
                person={{
                  ...person,
                  typeLabel: title.replace(' /', ',').split(',')[0], // Simplificar label
                }}
                pepData={pepDeclarations[person.id]}
                onSave={onSavePepDeclaration}
                onUploadDocument={onUploadDocument}
                onUploadAdditionalDoc={onUploadAdditionalDoc}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Declaraciones Juradas PEP
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Una DDJJ PEP por cada persona de la sociedad
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            <p className="text-xs text-gray-500">Total personas</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${
            stats.completed === stats.total
              ? 'bg-emerald-50 dark:bg-emerald-900/20'
              : 'bg-amber-50 dark:bg-amber-900/20'
          }`}>
            <p className={`text-2xl font-bold ${
              stats.completed === stats.total ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {stats.completed}/{stats.total}
            </p>
            <p className="text-xs text-gray-500">DDJJ completas</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${
            stats.peps > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-gray-50 dark:bg-gray-700/50'
          }`}>
            <p className={`text-2xl font-bold ${stats.peps > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {stats.peps}
            </p>
            <p className="text-xs text-gray-500">Personas PEP</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.pending}</p>
            <p className="text-xs text-gray-500">Pendientes</p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-3">
        {stats.pending > 0 && (
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">
                Faltan {stats.pending} DDJJ PEP por completar
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Todas las personas deben tener su DDJJ PEP para aprobar la documentación.
              </p>
            </div>
          </div>
        )}

        {stats.peps > 0 && (
          <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {stats.peps} persona(s) declarada(s) como PEP
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Requieren aprobación del Oficial de Cumplimiento y documentación adicional sobre origen de fondos.
              </p>
            </div>
          </div>
        )}

        {stats.completed === stats.total && stats.pending === 0 && (
          <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-200">
                Todas las DDJJ PEP están completas
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                {stats.peps > 0
                  ? 'Las personas PEP requieren aprobación del Oficial de Cumplimiento.'
                  : 'Se puede continuar con el proceso de alta.'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Person groups */}
      <div className="p-6">
        {renderGroup(
          'Socios / Beneficiarios Finales',
          groupedPersons.beneficiarios,
          'beneficiarios',
          <Users className="w-5 h-5 text-emerald-600" />
        )}

        {renderGroup(
          'Representantes Legales / Autoridades',
          groupedPersons.representantes,
          'representantes',
          <Users className="w-5 h-5 text-purple-600" />
        )}

        {renderGroup(
          'Apoderados',
          groupedPersons.apoderados,
          'apoderados',
          <Users className="w-5 h-5 text-amber-600" />
        )}

        {renderGroup(
          'Firmantes',
          groupedPersons.firmantes,
          'firmantes',
          <Users className="w-5 h-5 text-blue-600" />
        )}

        {persons.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No hay personas registradas en la sociedad
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Agregue socios, representantes o apoderados primero
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocietyPepDeclarations;
