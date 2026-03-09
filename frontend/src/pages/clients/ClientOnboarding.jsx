import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  User,
  FileText,
  Users,
  Shield,
  Save,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Search,
  Eye,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  FileCheck,
  X,
  Upload,
  Info,
  HelpCircle,
  Pencil,
  Send,
} from 'lucide-react';
import PDFViewer from '../../components/PDFViewer';
import DocumentChecklist from '../../components/DocumentChecklist';
import DocumentForm from '../../components/DocumentForm';
import {
  ENTITY_TYPES,
  ENTITY_TYPE_LABELS,
  getRequiredDocuments,
  getDocumentFields,
  COMPLEMENTARY_DOCUMENTS,
} from '../../config/documentRequirements';
import { clientService } from '../../services/clientService';

const STEPS = [
  { id: 'type', label: 'Revisión Docs.', icon: FileCheck },
  { id: 'documents', label: 'Datos Entidad', icon: Building2 },
  { id: 'dd', label: 'Riesgo - Perfil Transaccional', icon: Search },
  { id: 'review', label: 'Alta Final', icon: Check },
];

const ClientOnboarding = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [currentStep, setCurrentStep] = useState(0); // Always start at step 0 so entity type selector is always visible
  const [altaExitosa, setAltaExitosa] = useState(null); // { clientId, clientName, isPendiente, docsIncompletos }
  const [entityType, setEntityType] = useState(null);
  const [datosSociedad, setDatosSociedad] = useState({
    razonSocial: '',
    cuit: '',
    domicilioLegal: '',
    actividadPrincipal: '',
    fechaConstitucion: '',
    capitalSocial: '',
    objetoSocial: '',
    inscripcionIGJ: '',
    fechaInscripcion: '',
  });
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [docData, setDocData] = useState({});
  const [completedFields, setCompletedFields] = useState({});
  const [selectedDocId, setSelectedDocId] = useState(null);

  // Unified persons list - each person can have multiple roles
  const [personas, setPersonas] = useState([]);
  const [signatories, setSignatories] = useState([]);

  // Debida Diligencia
  const [ddData, setDdData] = useState({
    nosisResultado: '',
    nosisAntecedentes: null,
    nosisArchivo: null,
    nosisArchivoNombre: '',
    nosisNotas: '',
    nseNivel: '',
    nseNotas: '',
    nivelRiesgo: '',
    ventasEstimadasAnuales: '',
  });


  // Clear selected document when entity type changes so stale docId doesn't persist
  useEffect(() => {
    setSelectedDocId(null);
  }, [entityType]);

  // Auto-select first document when entering step 1 or switching entity type on step 1
  useEffect(() => {
    if (currentStep === 1) {
      const docs = entityType ? getRequiredDocuments(entityType) : [];
      if (docs.length > 0) setSelectedDocId(docs[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, entityType]);

  // Combobox de personas
  const [personaQuery, setPersonaQuery] = useState('');
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false);

  // Vista detalle individual
  const [personaDetalleIdx, setPersonaDetalleIdx] = useState(null);
  const [slideDir, setSlideDir] = useState('right'); // 'right' | 'left'

  // Quick-add: cantidad + nombre/apellido de nuevas personas
  const [showNuevoInput, setShowNuevoInput] = useState(false);
  const [nuevasPersonas, setNuevasPersonas] = useState([{ apellido: '', nombre: '' }]);

  // Edit mode por sección de persona
  const [editingSection, setEditingSection] = useState(null); // { personaIdx, section }
  const [editBuffer, setEditBuffer] = useState({});

  const startEditSection = (personaIdx, section, persona) => {
    setEditingSection({ personaIdx, section });
    setEditBuffer({ ...persona });
  };
  const saveEditSection = (personaIdx) => {
    setPersonas(prev => prev.map((p, i) => i === personaIdx ? { ...p, ...editBuffer } : p));
    setEditingSection(null);
    setEditBuffer({});
  };
  const cancelEditSection = () => {
    setEditingSection(null);
    setEditBuffer({});
  };
  const buf = (field, value) => setEditBuffer(prev => ({ ...prev, [field]: value }));

  const irAPersona = (nuevoIdx) => {
    setSlideDir(nuevoIdx > (personaDetalleIdx ?? -1) ? 'right' : 'left');
    setPersonaDetalleIdx(nuevoIdx);
  };


  const personaNueva = {
    apellido: '', nombre: '', email: '', telefono: '', numeroDocumento: '', cuit: '',
    porcentaje: '', cargo: '', facultades: '', domicilio: '', vigenciaPoder: '',
    fechaOtorgamiento: '', fechaVencimientoPoder: '', camposDelSistema: [],
    vinculoCausante: '', tipoAdministrador: '', aceptoCargo: '',
    esFirmante: false, esBeneficiarioFinal: false, esPep: false,
    esAutoridad: false, esApoderado: false, esAccionista: false, esHeredero: false, esAdministrador: false, esSocioSH: false,
    // Campos extra Socio SH
    shPorcentaje: '', shFirmaPresente: null, shCargoRol: '', shCargoOtro: '',
    // Screening
    screeningAbierto: false,
    figuraEnRepet: null,
    repetNotas: '',
    screeningListas: {},   // { OFAC: { estado, fecha, detalle }, ONU: {...}, ... }
    screeningCorriendo: false,
  };

  // Listas contra las que se corre el screening automático
  const LISTAS_SCREENING = ['OFAC', 'ONU Sanciones', 'GAFI', 'UIF Argentina'];

  const correrScreeningPersona = (index) => {
    const u = [...personas];
    u[index].screeningCorriendo = true;
    setPersonas(u);

    setTimeout(() => {
      const u2 = [...personas];
      const p = u2[index];
      p.screeningCorriendo = false;
      p.screeningListas = {};
      LISTAS_SCREENING.forEach((lista) => {
        // Simulación: 95% sin coincidencias
        const hayMatch = Math.random() < 0.05;
        p.screeningListas[lista] = {
          estado: hayMatch ? 'coincidencia' : 'sin_coincidencias',
          fecha: new Date().toLocaleString('es-AR'),
          detalle: hayMatch ? `Posible coincidencia en lista ${lista}` : '',
        };
      });
      setPersonas(u2);
    }, 1800);
  };

  const updatePersonaField = (index, field, value) => {
    setPersonas((prev) => {
      const u = [...prev];
      u[index] = { ...u[index], [field]: value };
      return u;
    });
  };

  const agregarDesdeDirectorio = (p) => {
    setPersonas((prev) => {
      const nueva = [...prev, {
        ...personaNueva,
        _dirId: p.id,
        apellido: p.apellido,
        nombre: p.nombre,
        email: p.email,
        telefono: p.telefono || '',
        fromSystem: true,
        camposDelSistema: ['apellido', 'nombre', 'email', 'telefono'],
      }];
      setSlideDir('right');
      setPersonaDetalleIdx(nueva.length - 1);
      return nueva;
    });
    setPersonaQuery('');
    setPersonaDropdownOpen(false);
  };

  const agregarPersonaManual = () => {
    setShowNuevoInput(true);
    setNuevasPersonas([{ apellido: '', nombre: '' }]);
  };

  const setCantidadNuevas = (n) => {
    const cant = Math.max(1, Math.min(10, n));
    setNuevasPersonas(prev => {
      const arr = [...prev];
      while (arr.length < cant) arr.push({ apellido: '', nombre: '' });
      return arr.slice(0, cant);
    });
  };

  const confirmarNuevoPersona = () => {
    const validas = nuevasPersonas.filter(p => p.apellido.trim() || p.nombre.trim());
    if (validas.length === 0) return;
    setPersonas(prev => [...prev, ...validas.map(p => ({
      ...personaNueva,
      apellido: p.apellido.trim(),
      nombre: p.nombre.trim(),
    }))]);
    setShowNuevoInput(false);
    setNuevasPersonas([{ apellido: '', nombre: '' }]);
  };

  const cerrarNuevoInput = () => {
    setShowNuevoInput(false);
    setNuevasPersonas([{ apellido: '', nombre: '' }]);
  };

  // Tilda/destilda una persona del sistema (desde el dropdown con checkboxes)
  const togglePersonaDelSistema = (personaDisp) => {
    setPersonas((prev) => {
      const yaEsta = prev.some((p) => p._dirId === personaDisp.id);
      if (yaEsta) {
        return prev.filter((p) => p._dirId !== personaDisp.id);
      }
      const camposDelSistema = [
        ...(personaDisp.apellido ? ['apellido'] : []),
        ...(personaDisp.nombre ? ['nombre'] : []),
        ...(personaDisp.email ? ['email'] : []),
        ...(personaDisp.telefono ? ['telefono'] : []),
      ];
      return [
        ...prev,
        {
          _dirId: personaDisp.id,
          id: personaDisp.id,
          uuid: personaDisp.id,
          apellido: personaDisp.apellido,
          nombre: personaDisp.nombre,
          email: personaDisp.email || '',
          telefono: personaDisp.telefono || '',
          tipoDocumento: 'dni',
          numeroDocumento: '',
          cuit: '',
          porcentaje: '',
          tipoControl: '',
          cargo: '',
          facultades: '',
          domicilio: '',
          vigenciaPoder: '',
          fechaOtorgamiento: '',
          fechaVencimientoPoder: '',
          vinculoCausante: '',
          tipoAdministrador: '',
          aceptoCargo: '',
          fromSystem: true,
          camposDelSistema,
          esFirmante: false,
          esBeneficiarioFinal: false,
          esPep: false,
          esAutoridad: false,
          esApoderado: false,
          esAccionista: false,
          esHeredero: false,
          esAdministrador: false,
          esSocioSH: false,
          shPorcentaje: '', shFirmaPresente: null, shCargoRol: '', shCargoOtro: '',
          screeningAbierto: false,
          figuraEnRepet: null,
          repetNotas: '',
          screeningListas: {},
          screeningCorriendo: false,
        },
      ];
    });
  };

  const quitarPersona = (index) => {
    setPersonas((prev) => prev.filter((_, i) => i !== index));
    setPersonaDetalleIdx(null);
  };

  // Risk assessment
  const [riskData, setRiskData] = useState(null);

  // Comentarios internos del alta
  const [comentariosAlta, setComentariosAlta] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');

  const agregarComentario = () => {
    const texto = nuevoComentario.trim();
    if (!texto) return;
    setComentariosAlta(prev => [...prev, {
      id: Date.now(),
      texto,
      fecha: new Date().toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      autor: 'Administración',
    }]);
    setNuevoComentario('');
  };

  // Alta Final — card inline editing
  const [reviewEditCard, setReviewEditCard] = useState(null); // 'risk'|'nse'|'ventas'|'entidad'|'personas'|'docs'
  const [reviewEditBuf, setReviewEditBuf] = useState({});
  // Inline persona editing within Alta Final (no navigation away)
  const [personaInlineEditIdx, setPersonaInlineEditIdx] = useState(null);
  const [personaInlineBuf, setPersonaInlineBuf] = useState({});


  // Panel visibility for split view
  const [showChecklist, setShowChecklist] = useState(false); // Collapsed by default

  // Tab in documents step: 'docs' or 'people'
  const [documentsTab, setDocumentsTab] = useState('docs');

  // Auto-poblar persona desde datos del DNI para monotributista
  useEffect(() => {
    if (
      documentsTab === 'personas' &&
      entityType === ENTITY_TYPES.MONOTRIBUTISTA &&
      personas.length === 0
    ) {
      const dniFrente = docData['dni_frente'] || {};
      const dniDorso  = docData['dni_dorso']  || {};
      const apellido  = dniFrente.dni_apellido || '';
      const nombre    = dniFrente.dni_nombre   || '';
      const nroDni    = dniFrente.dni_numero   || '';
      const domicilio = dniDorso.dni_domicilio  || '';

      if (apellido || nombre || nroDni) {
        const camposDelSistema = [
          ...(apellido  ? ['apellido']         : []),
          ...(nombre    ? ['nombre']           : []),
          ...(nroDni    ? ['numeroDocumento']  : []),
          ...(domicilio ? ['domicilio']        : []),
        ];
        setPersonas([{
          apellido, nombre,
          numeroDocumento: nroDni,
          tipoDocumento:   'dni',
          cuit: datosSociedad.cuit || '',
          domicilio,
          email: '', telefono: '', porcentaje: '', cargo: '', facultades: '',
          vigenciaPoder: '', fechaOtorgamiento: '', fechaVencimientoPoder: '',
          vinculoCausante: '', tipoAdministrador: '', aceptoCargo: '',
          fromDNI: true,
          camposDelSistema,
          esFirmante: false, esBeneficiarioFinal: false, esPep: false,
          esAutoridad: false, esApoderado: false, esAccionista: false,
          esHeredero: false, esAdministrador: false, esSocioSH: false,
          shPorcentaje: '', shFirmaPresente: null, shCargoRol: '', shCargoOtro: '',
          screeningAbierto: false, figuraEnRepet: null, repetNotas: '',
          screeningListas: {}, screeningCorriendo: false,
        }]);
        toast.info('Persona cargada automáticamente desde el DNI');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentsTab, entityType]);

  // Índice de la persona expandida en el acordeón
  const [personaExpandida, setPersonaExpandida] = useState(null);

  // Pending clients list
  const [pendingClients, setPendingClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [documentReviews, setDocumentReviews] = useState({}); // { clientId: { docId: 'approved' | 'rejected' | 'solicitado' | null } }
  const [rejectionReasons, setRejectionReasons] = useState({}); // { clientId: { docId: 'motivo' } }
  const [tableUploadedDocs, setTableUploadedDocs] = useState({}); // { clientId: { docId: { file, dataUrl, name } } }
  const [rejectingDoc, setRejectingDoc] = useState(null); // { clientId, docId, docName } - para modal de rechazo
  const [rejectReason, setRejectReason] = useState('');

  // Document viewer modal
  const [viewingDocument, setViewingDocument] = useState(null); // { client, doc, fileUrl }

  // Arma el directorio de personas a partir del cliente seleccionado
  const personasDeEstaSociedad = React.useMemo(() => {
    const cliente = pendingClients.find((c) => c.id === selectedClientId);
    if (!cliente) return [];
    const vistas = new Set();
    const lista = [];
    const agregar = (arr) => {
      (arr || []).forEach((p) => {
        const key = p.email || `${p.firstName}-${p.lastName}`;
        if (!vistas.has(key)) {
          vistas.add(key);
          lista.push({
            id: `${p.id}-${key}`,
            apellido: p.lastName || '',
            nombre: p.firstName || '',
            email: p.email || '',
            telefono: p.phone || '',
          });
        }
      });
    };
    agregar(cliente.beneficialOwners);
    agregar(cliente.signatories);
    agregar(cliente.attorneys);
    agregar(cliente.authorities);
    return lista;
  }, [pendingClients, selectedClientId]);

  const personasDirectorioFiltradas = personasDeEstaSociedad.filter((p) => {
    const q = personaQuery.toLowerCase();
    const yaAgregada = personas.some((per) => per._dirId === p.id);
    if (yaAgregada) return false;
    if (!q) return true;
    return (
      p.apellido.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });


  // Load pending clients on mount
  useEffect(() => {
    const loadPendingClients = async () => {
      try {
        setLoadingClients(true);
        const response = await clientService.list({ status: 'pendiente' });
        setPendingClients(response.data?.data || []);
      } catch (error) {
        console.error('Error loading pending clients:', error);
        toast.error('Error al cargar clientes pendientes');
      } finally {
        setLoadingClients(false);
      }
    };
    loadPendingClients();
  }, []);

  // Toggle expanded client row
  const handleToggleExpand = (clientId) => {
    setExpandedClientId(expandedClientId === clientId ? null : clientId);
  };

  // Handle document review (approve/reject)
  const handleDocumentReview = (clientId, docId, status, reason = '') => {
    setDocumentReviews(prev => ({
      ...prev,
      [clientId]: {
        ...prev[clientId],
        [docId]: status,
      },
    }));
    if (status === 'rejected' && reason) {
      setRejectionReasons(prev => ({
        ...prev,
        [clientId]: {
          ...prev[clientId],
          [docId]: reason,
        },
      }));
    }
  };

  // Abrir modal de rechazo
  const openRejectModal = (clientId, docId, docName) => {
    setRejectingDoc({ clientId, docId, docName });
    setRejectReason('');
  };

  // Confirmar rechazo con motivo
  const confirmReject = () => {
    if (rejectingDoc && rejectReason.trim()) {
      handleDocumentReview(rejectingDoc.clientId, rejectingDoc.docId, 'rejected', rejectReason);
      toast.warning('Documento rechazado');
      setRejectingDoc(null);
      setRejectReason('');
      setViewingDocument(null); // cerrar visor al confirmar rechazo
    }
  };

  // Open document viewer modal
  const handleViewDocument = (client, doc) => {
    const fileData = client.documents?.[doc.id] || tableUploadedDocs[client.id]?.[doc.id];
    setViewingDocument({
      client,
      doc,
      fileName: fileData?.name || doc.name,
      fileUrl: fileData?.dataUrl || null,
    });
  };

  // Close document viewer modal
  const handleCloseDocumentViewer = () => {
    setViewingDocument(null);
  };

  // Check if all documents for a client are reviewed
  const areAllDocsReviewed = (clientId, clientDocs) => {
    const reviews = documentReviews[clientId] || {};
    return clientDocs.every(doc => reviews[doc.id] === 'approved' || reviews[doc.id] === 'rejected');
  };

  // Check if all REQUIRED docs are approved (for "Dar de Alta")
  const areRequiredDocsApproved = (clientId, clientDocs) => {
    const reviews = documentReviews[clientId] || {};
    const requiredDocs = clientDocs.filter(doc => doc.required);
    return requiredDocs.length > 0 && requiredDocs.every(doc => reviews[doc.id] === 'approved');
  };

  // Check if client can proceed (all docs approved)
  const canProceed = (clientId, clientDocs) => {
    const reviews = documentReviews[clientId] || {};
    return clientDocs.every(doc => reviews[doc.id] === 'approved');
  };

  // Handle client selection from list (after docs are reviewed)
  const handleSelectClient = (client) => {
    // If this client is already selected, just navigate to step 1 without resetting data
    if (client.id === selectedClientId) {
      setCurrentStep(1);
      return;
    }

    const clientDocs = getRequiredDocuments(client.legalForm || client.clientType);

    // Warn if not all required docs are approved, but allow to continue
    if (!areRequiredDocsApproved(client.id, clientDocs)) {
      toast.warning('Algunos documentos obligatorios no están aprobados. Podrá continuar pero no podrá dar de alta hasta completarlos.');
    }

    setSelectedClientId(client.id);
    setEntityType(client.legalForm || client.clientType);

    // Merge backend documents with any docs uploaded inline in the review table
    const mergedDocs = {
      ...(client.documents || {}),
      ...(tableUploadedDocs[client.id] || {}),
    };
    if (Object.keys(mergedDocs).length > 0) {
      setUploadedDocs(mergedDocs);
      const firstDocId = Object.keys(mergedDocs)[0];
      setSelectedDocId(firstDocId);
    }

    // Pre-fill personas from backend data
    // SOLO traemos de DCAC: Nombre, Apellido, Email y Teléfono
    // Los demás campos y checkboxes son para carga manual
    const personasFromBackend = [];
    const personasAgregadas = new Set(); // Para evitar duplicados

    // Función para agregar persona con datos básicos únicamente
    const agregarPersona = (persona) => {
      const key = `${persona.firstName || ''}-${persona.lastName || ''}-${persona.email || ''}`.toLowerCase();
      if (personasAgregadas.has(key)) return;
      personasAgregadas.add(key);

      const camposDelSistema = [];
      if (persona.lastName) camposDelSistema.push('apellido');
      if (persona.firstName) camposDelSistema.push('nombre');
      if (persona.email) camposDelSistema.push('email');
      if (persona.phone) camposDelSistema.push('telefono');

      personasFromBackend.push({
        id: persona.id,
        uuid: persona.id,
        apellido: persona.lastName || '',
        nombre: persona.firstName || '',
        email: persona.email || '',
        telefono: persona.phone || '',
        // Campos para carga manual (vacíos)
        tipoDocumento: 'dni',
        numeroDocumento: '',
        cuit: '',
        porcentaje: '',
        tipoControl: '',
        cargo: '',
        facultades: '',
        domicilio: '',
        vigenciaPoder: '',
        fechaOtorgamiento: '',
        fechaVencimientoPoder: '',
        vinculoCausante: '',
        tipoAdministrador: '',
        aceptoCargo: '',
        fromSystem: true,
        camposDelSistema,
        // Roles: todos sin marcar, para asignar manualmente
        esFirmante: false,
        esBeneficiarioFinal: false,
        esPep: false,
        esAutoridad: false,
        esApoderado: false,
        esAccionista: false,
        esHeredero: false,
        esAdministrador: false,
        // Screening
        screeningAbierto: false,
        figuraEnRepet: false,
        repetNotas: '',
        screeningListas: {},
        screeningCorriendo: false,
      });
    };

    // Agregar personas de todas las fuentes (solo datos básicos)
    if (client.beneficialOwners?.length > 0) {
      client.beneficialOwners.forEach(agregarPersona);
    }
    if (client.authorities?.length > 0) {
      client.authorities.forEach(agregarPersona);
    }
    if (client.attorneys?.length > 0) {
      client.attorneys.forEach(agregarPersona);
    }
    if (client.signatories?.length > 0) {
      client.signatories.forEach(agregarPersona);
    }

    // Restaurar personas: si el cliente tiene personas guardadas (alta nueva), usarlas directamente
    if (client.personas?.length > 0) {
      setPersonas(client.personas);
    } else {
      // Clientes legacy: no preseleccionar, el usuario las elige manualmente
      setPersonas([]);
    }

    // Pre-fill datos sociedad — primero desde client.datosSociedad (alta nueva), luego legacy
    setDatosSociedad(client.datosSociedad || {
      razonSocial: client.legalName || '',
      cuit: client.cuit || '',
      domicilioLegal: client.address || '',
      actividadPrincipal: client.activityType || '',
      fechaConstitucion: client.constitutionDate || '',
      capitalSocial: client.capital || '',
      objetoSocial: client.businessObject || '',
      inscripcionIGJ: client.igjRegistration || '',
      fechaInscripcion: client.registrationDate || '',
    });

    // Restaurar campos de formulario de documentos
    if (client.formData && Object.keys(client.formData).length > 0) {
      setDocData(client.formData);
    }

    // Restaurar ddData (NSE, riesgo, ventas) si el cliente lo tiene guardado
    if (client.dd && Object.keys(client.dd).length > 0) {
      setDdData(prev => ({ ...prev, ...client.dd }));
    }

    // Pre-fill risk data
    if (client.riskLevel) {
      setRiskData({
        riskLevel: client.riskLevel,
        totalScore: client.riskScore,
        dueDiligenceType: client.dueDiligenceType
      });
    }

    setCurrentStep(1);
    toast.success(`Cliente ${client.legalName || client.cuit} seleccionado - Datos precargados`);
  };

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    if (!searchTerm) return pendingClients;
    const term = searchTerm.toLowerCase();
    return pendingClients.filter(client =>
      (client.legalName?.toLowerCase().includes(term)) ||
      (client.cuit?.includes(term)) ||
      (client.id?.toString().includes(term))
    );
  }, [pendingClients, searchTerm]);

  // All persons (unified)
  const allPersons = useMemo(() => {
    return personas.filter(p => p.nombre || p.apellido).map((p, idx) => ({
      id: p.id || `persona_${idx}`,
      firstName: p.nombre || '',
      lastName: p.apellido || '',
      dni: p.numeroDocumento || '',
      cuit: p.cuit || '',
      email: p.email || '',
      esAutoridad: p.esAutoridad,
      esFirmante: p.esFirmante,
      esBeneficiarioFinal: p.esBeneficiarioFinal,
      esPep: p.esPep,
    }));
  }, [personas]);


  const documents = entityType ? getRequiredDocuments(entityType) : [];
  const specificDocs = documents.filter(d => !COMPLEMENTARY_DOCUMENTS.find(c => c.id === d.id));

  // Documentos complementarios - siempre mostrar para sociedades (el cliente ya los cargó)
  const complementaryDocs = useMemo(() => {
    if (entityType === ENTITY_TYPES.MONOTRIBUTISTA) return [];
    // Mostrar todos los documentos complementarios - vienen precargados del cliente
    return COMPLEMENTARY_DOCUMENTS;
  }, [entityType]);

  // Determinar si el alta quedará pendiente por documentación incompleta
  const quedaPendiente = useMemo(() => {
    if (!entityType) return false;
    const allDocs = [
      ...getRequiredDocuments(entityType).filter(d => !COMPLEMENTARY_DOCUMENTS.find(c => c.id === d.id)),
    ];
    return allDocs
      .filter(d => d.required !== false)
      .some(doc => {
        const data = docData[doc.id];
        const hasData = data && Object.keys(data).some(k => data[k]);
        const isAutoGenerated = uploadedDocs[doc.id]?.autoGenerated;
        return !hasData && !isAutoGenerated;
      });
  }, [entityType, docData, uploadedDocs, personas]);

  const selectedDocument = documents.find(d => d.id === selectedDocId);
  const selectedFile = uploadedDocs[selectedDocId];
  const selectedFields = selectedDocId ? getDocumentFields(selectedDocId, entityType) : [];

  // Para Constancia ARCA, pre-llenar Razón Social y CUIT desde Estatuto/Contrato Social
  const getInitialValuesForDoc = (docId) => {
    const baseValues = docData[docId] || {};
    if (docId === 'constancia_cuit') {
      const estatutoData = docData['estatuto'] || {};
      return {
        ...baseValues,
        arca_razon_verificar: baseValues.arca_razon_verificar || estatutoData.denominacion_social || '',
        arca_cuit_verificar: baseValues.arca_cuit_verificar || estatutoData.sa_cuit || '',
      };
    }
    if (docId === 'constancia_cuit_srl') {
      const contratoData = docData['contrato_social'] || {};
      return {
        ...baseValues,
        arca_razon_verificar: baseValues.arca_razon_verificar || contratoData.srl_razon_social || '',
        arca_cuit_verificar: baseValues.arca_cuit_verificar || contratoData.srl_cuit || '',
      };
    }
    return baseValues;
  };

  const handleUploadDocument = useCallback((docId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedDocs(prev => ({
        ...prev,
        [docId]: {
          file,
          dataUrl: e.target.result,
          name: file.name,
        },
      }));
      setSelectedDocId(docId);
      toast.success(`${file.name} cargado correctamente`);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFieldChange = useCallback((docId, fields) => {
    setCompletedFields(prev => ({
      ...prev,
      [docId]: fields,
    }));
  }, []);

  const handleSaveDocData = useCallback((docId, data, allDocsList) => {
    setDocData(prev => ({ ...prev, [docId]: data }));
    toast.success('Datos guardados');
    // Pasar al siguiente documento en la lista
    if (allDocsList && allDocsList.length > 0) {
      const currentIndex = allDocsList.findIndex(d => d.id === docId);
      const nextDoc = allDocsList[currentIndex + 1];
      if (nextDoc) {
        setTimeout(() => setSelectedDocId(nextDoc.id), 300);
      }
    }
  }, []);


  const handleNextStep = () => {
    const currentStepId = STEPS[currentStep].id;

    if (currentStepId === 'type' && !selectedClientId) {
      toast.error('Seleccione un cliente de la lista');
      return;
    }

    if (currentStepId === 'documents') {
      // Verificar que todos los documentos obligatorios tengan datos
      const allDocsForValidation = [...(entityType ? getRequiredDocuments(entityType).filter(d => !COMPLEMENTARY_DOCUMENTS.find(c => c.id === d.id)) : [])];

      const requiredDocsValidation = allDocsForValidation.filter(d => d.required !== false);
      const docsIncompletos = requiredDocsValidation.filter(doc => {
        const data = docData[doc.id];
        const hasData = data && Object.keys(data).some(k => data[k]);
        const isAutoGenerated = uploadedDocs[doc.id]?.autoGenerated;
        return !hasData && !isAutoGenerated;
      });

      if (docsIncompletos.length > 0) {
        toast.warning(`Documentos pendientes: ${docsIncompletos.map(d => d.name).join(', ')}. Podrá continuar pero deberá completarlos antes del Alta.`);
        // No bloquear - permitir avanzar
      }

      // Warn if no personas added (not blocking)
      if (personas.length === 0 && entityType !== ENTITY_TYPES.MONOTRIBUTISTA) {
        toast.warning('No se han agregado personas de la sociedad');
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleGuardarBorrador = async () => {
    try {
      const clientData = {
        clientType: entityType === ENTITY_TYPES.MONOTRIBUTISTA ? 'monotributista' : 'persona_juridica',
        legalForm: entityType,
        ...extractClientData(entityType, docData),
        status: 'pendiente_documentacion',
        formData: docData,
        datosSociedad,
        riskLevel: riskData?.riskLevel || 'medio',
        riskScore: riskData?.totalScore || 0,
        dueDiligenceType: riskData?.dueDiligenceType || 'media',
        dd: ddData,
        riskFactors: riskData?.factors || {},
        personas,
        authorities: personas.filter(p => p.esAutoridad).map(p => ({
          name: `${p.apellido} ${p.nombre}`, position: p.cargo, dni: p.numeroDocumento,
          cuit: p.cuit, email: p.email, phone: p.telefono,
        })),
      };
      const response = await clientService.create(clientData);
      const responseData = response?.data?.data ?? response?.data;
      const newClientId = responseData?.id;
      if (!newClientId) throw new Error('El servidor no devolvió el ID del cliente.');
      const docsConArchivo = Object.entries(uploadedDocs).filter(([, fi]) => fi.file);
      if (docsConArchivo.length > 0) {
        await Promise.all(docsConArchivo.map(async ([docId, fileInfo]) => {
          try {
            const formData = new FormData();
            formData.append('file', fileInfo.file);
            formData.append('documentType', docId);
            formData.append('documentCategory', getCategoryForDoc(docId));
            const meta = docData[docId] || {};
            formData.append('issueDate', meta.fecha_emision || '');
            formData.append('expirationDate', meta.fecha_vencimiento || '');
            return clientService.uploadDocument(newClientId, formData);
          } catch (e) { console.warn(`Error subiendo ${docId}:`, e); }
        }));
      }
      toast.success('Datos guardados. El cliente queda pendiente de aprobación.');
      navigate('/clients?status=pendiente');
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleFinish = async () => {
    try {
      // VALIDACIÓN: Duplicado por CUIT — solo bloquea si ya hay un cliente aprobado/activo
      if (datosSociedad.cuit) {
        const existing = await clientService.list({});
        const clientes = existing?.data?.data || [];
        const duplicado = clientes.find(c =>
          c.cuit === datosSociedad.cuit &&
          c.status === 'aprobado' &&
          c.id !== selectedClientId
        );
        if (duplicado) {
          toast.error(`Ya existe un cliente activo con CUIT ${datosSociedad.cuit}: ${duplicado.legalName}. No se puede dar de alta dos veces.`, { autoClose: 6000 });
          return;
        }
      }

      // VALIDACIÓN: Verificar que todos los documentos obligatorios estén completos
      const allDocsForValidation = [...(entityType ? getRequiredDocuments(entityType).filter(d => !COMPLEMENTARY_DOCUMENTS.find(c => c.id === d.id)) : [])];

      // Agregar documentos complementarios según corresponda
      if (entityType && entityType !== ENTITY_TYPES.MONOTRIBUTISTA) {
        COMPLEMENTARY_DOCUMENTS.forEach(doc => {
          allDocsForValidation.push(doc);
        });
      }

      const requiredDocsValidation = allDocsForValidation.filter(d => d.required !== false);
      const docsIncompletos = requiredDocsValidation.filter(doc => {
        const data = docData[doc.id];
        const hasData = data && Object.keys(data).some(k => data[k]);
        const isAutoGenerated = uploadedDocs[doc.id]?.autoGenerated;
        return !hasData && !isAutoGenerated;
      });

      const clientStatus = docsIncompletos.length > 0 ? 'pendiente_documentacion' : 'aprobado';

      if (docsIncompletos.length > 0) {
        toast.info(
          `Documentación incompleta: ${docsIncompletos.map(d => d.name).join(', ')}. El cliente quedará en estado PENDIENTE hasta completarla.`,
          { autoClose: 8000 }
        );
      }

      // 1. Create Client
      const clientData = {
        clientType: entityType === ENTITY_TYPES.MONOTRIBUTISTA
          ? 'monotributista'
          : 'persona_juridica',
        legalForm: entityType,
        ...extractClientData(entityType, docData),
        status: clientStatus,
        // Include form data for conditional document validation
        formData: docData,
        datosSociedad,
        // Risk assessment
        riskLevel: riskData?.riskLevel || 'medio',
        riskScore: riskData?.totalScore || 0,
        dueDiligenceType: riskData?.dueDiligenceType || 'media',
        // Debida Diligencia
        dd: ddData,
        riskFactors: riskData?.factors || {},
        // Comentarios internos
        comentariosInternos: comentariosAlta,
        // Archivos subidos (dataUrl para visualización posterior)
        uploadedDocsData: Object.fromEntries(
          Object.entries(uploadedDocs)
            .filter(([, v]) => v?.dataUrl)
            .map(([k, v]) => [k, { name: v.name, dataUrl: v.dataUrl }])
        ),
        // Personas (todos los campos para poder retomar el alta)
        personas,
        authorities: personas.filter(p => p.esAutoridad).map(p => ({
          name: `${p.apellido} ${p.nombre}`,
          position: p.cargo,
          dni: p.numeroDocumento,
          cuit: p.cuit,
          email: p.email,
          phone: p.telefono,
        })),
      };

      const response = await clientService.create(clientData);
      console.info('[handleFinish] response:', response);
      const responseData = response?.data?.data ?? response?.data;
      if (!responseData) {
        console.warn('[handleFinish] responseData undefined. response:', response);
        throw new Error('El servidor no devolvió datos del cliente.');
      }
      const newClientId = responseData.id;
      if (!newClientId) {
        console.warn('[handleFinish] id undefined. responseData:', responseData);
        throw new Error('El servidor no devolvió el ID del cliente.');
      }

      // 2. Upload Documents — solo los que tienen archivo real
      const docsConArchivo = Object.entries(uploadedDocs).filter(([, fileInfo]) => fileInfo.file);
      if (docsConArchivo.length > 0) {
        const uploadPromises = docsConArchivo.map(async ([docId, fileInfo]) => {
          try {
            const formData = new FormData();
            formData.append('file', fileInfo.file);
            formData.append('documentType', docId);
            formData.append('documentCategory', getCategoryForDoc(docId));
            const meta = docData[docId] || {};
            formData.append('issueDate', meta.fecha_emision || '');
            formData.append('expirationDate', meta.fecha_vencimiento || '');
            return clientService.uploadDocument(newClientId, formData);
          } catch (uploadErr) {
            console.warn(`Error subiendo ${docId}:`, uploadErr);
          }
        });
        await Promise.all(uploadPromises);
      }

      toast.success(
        clientStatus === 'pendiente_documentacion'
          ? 'Cliente guardado como Pendiente. Completá la documentación faltante.'
          : 'Alta confirmada exitosamente.',
        { autoClose: 4000 }
      );
      navigate(`/clients/${newClientId}`);

    } catch (error) {
      console.error('[handleFinish] error:', error);
      toast.error('Error al guardar: ' + (error.response?.data?.message || error.message));
    }
  };

  // Helper to extract basic data from document forms
  const extractClientData = (type, data) => {
    // This logic depends on which document holds the "truth".
    // Usually DNI or Estatuto.
    // We iterate known fields and find values.
    let result = {};
    Object.values(data).forEach(docForm => {
      // Merge known fields
      if (docForm.cuit) result.cuit = docForm.cuit;
      if (docForm.razon_social) result.legalName = docForm.razon_social;
      if (docForm.nombre) result.firstName = docForm.nombre;
      if (docForm.apellido) result.lastName = docForm.apellido;
      // ... add other mappings
    });
    return result;
  };

  const getCategoryForDoc = (docId) => {
    // Simple mapping
    if (docId.includes('dni') || docId.includes('estatuto')) return 'identificacion';
    if (docId.includes('pep')) return 'pep';
    return 'otro';
  };

  const getCompletionPercentage = () => {
    if (!entityType) return 0;
    const requiredDocs = documents.filter(d => d.required);
    const uploadedRequired = requiredDocs.filter(d => uploadedDocs[d.id]);
    return Math.round((uploadedRequired.length / requiredDocs.length) * 100);
  };

  // Render step content
  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case 'type':
        return (
          <div className="p-6 max-w-7xl mx-auto">
            {/* Header con diseño mejorado */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">Clientes Pendientes</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Revise la documentación y apruebe para continuar
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por CUIT, razón social..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl text-sm w-72 bg-white dark:bg-gray-800 focus:border-[#3879a3] focus:ring-2 focus:ring-[#3879a3]/20 transition-all"
                />
              </div>
            </div>

            {/* Table Header mejorado */}
            {!loadingClients && filteredClients.length > 0 && (
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-t-2xl shadow-sm">
                <div className="grid grid-cols-12 gap-4 px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <div className="col-span-4">Sociedad</div>
                  <div className="col-span-2">CUIT</div>
                  <div className="col-span-2">Forma Social</div>
                  <div className="col-span-2">Fecha de Alta</div>
                  <div className="col-span-2">Estado</div>
                </div>
              </div>
            )}

            {loadingClients ? (
              <div className="flex flex-col items-center justify-center py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3879a3]/5 via-transparent to-[#2d6a8a]/5 rounded-2xl"></div>
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3879a3] to-[#2d6a8a] flex items-center justify-center mb-5 shadow-xl shadow-[#3879a3]/20 animate-pulse">
                    <Loader2 className="w-10 h-10 animate-spin text-white" />
                  </div>
                  <div className="absolute -inset-4 bg-[#3879a3]/20 rounded-full blur-2xl animate-pulse"></div>
                </div>
                <span className="text-lg font-medium text-foreground mt-2">Cargando clientes...</span>
                <span className="text-sm text-muted-foreground">Por favor espere</span>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-20 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-slate-50/30 dark:from-slate-800/50 dark:to-slate-900/30 rounded-2xl"></div>
                <div className="relative">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-5 shadow-lg border border-slate-200 dark:border-slate-600">
                    <Building2 className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-xl font-semibold text-slate-700 dark:text-slate-200">
                    {searchTerm ? 'No se encontraron resultados' : 'No hay clientes pendientes'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                    {searchTerm ? 'Intente con otro término de búsqueda' : 'Los nuevos clientes aparecerán aquí cuando se registren'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-b-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                {filteredClients.map((client, index) => {
                  const clientDocs = getRequiredDocuments(client.legalForm || client.clientType);
                  const reviews = documentReviews[client.id] || {};
                  const reviewedCount = Object.values(reviews).filter(r => r).length;
                  const approvedCount = Object.values(reviews).filter(r => r === 'approved').length;
                  const isExpanded = expandedClientId === client.id;
                  const allReviewed = areAllDocsReviewed(client.id, clientDocs);
                  const allApproved = canProceed(client.id, clientDocs);

                  const readyForAlta = areRequiredDocsApproved(client.id, clientDocs);

                  // Determine status label
                  const getStatusLabel = () => {
                    if (client.status === 'aprobado') return { text: 'Aprobado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'check', glow: 'shadow-emerald-500/20' };
                    if (readyForAlta) return { text: 'Listo para Alta', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: 'check', glow: 'shadow-emerald-500/20' };
                    if (allReviewed) return { text: 'Con Observaciones', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: 'warning', glow: 'shadow-amber-500/20' };
                    return { text: 'Pendiente', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: 'clock', glow: '' };
                  };
                  const statusInfo = getStatusLabel();

                  return (
                    <div key={client.id} className={`${index > 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''} transition-all duration-300 ${readyForAlta
                      ? 'bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-teal-50/60 dark:from-emerald-900/20 dark:via-emerald-900/15 dark:to-teal-900/10'
                      : isExpanded
                        ? 'bg-slate-50/50 dark:bg-slate-800/30'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                      }`}>
                      {/* Client Row - When ready for alta, show different layout */}
                      {readyForAlta ? (
                        <div className="flex items-center justify-between px-6 py-5">
                          <div className="flex items-center gap-5">
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                              </div>
                            </div>
                            <div>
                              <p className="text-lg font-bold text-foreground">
                                {client.legalName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre'}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <span className="font-mono">{client.cuit}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{ENTITY_TYPE_LABELS[client.legalForm] || client.legalForm}</span>
                              </p>
                              <div className="flex items-center gap-1.5 mt-2 text-emerald-600 dark:text-emerald-400">
                                <Check className="w-4 h-4" />
                                <span className="text-sm font-medium">Documentación aprobada - Listo para continuar</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleSelectClient(client)}
                            className="group relative px-7 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-3 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <span>Continuar Carga de Datos</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Normal row - Grid matching header */}
                          <div
                            className={`grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer transition-all duration-200 items-center group`}
                            onClick={() => handleToggleExpand(client.id)}
                          >
                            {/* Sociedad */}
                            <div className="col-span-4 flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isExpanded
                                ? 'bg-[#3879a3] text-white rotate-0'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-[#3879a3]/10 group-hover:text-[#3879a3]'
                                }`}>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="font-semibold text-foreground block truncate group-hover:text-[#3879a3] transition-colors">
                                  {client.legalName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Sin nombre'}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {clientDocs.length} documentos
                                </span>
                              </div>
                            </div>

                            {/* CUIT */}
                            <div className="col-span-2">
                              <span className="text-sm text-foreground font-mono bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                                {client.cuit || '-'}
                              </span>
                            </div>

                            {/* Tipo de Sociedad */}
                            <div className="col-span-2">
                              <span className="text-sm text-foreground font-medium">
                                {{ sa: 'SA', srl: 'SRL', sh: 'SH', monotributista: 'Monotributo', sucesion: 'Sucesión' }[client.legalForm] || client.legalForm?.toUpperCase() || 'N/A'}
                              </span>
                            </div>

                            {/* Fecha Alta */}
                            <div className="col-span-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                {client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-AR') : '-'}
                              </div>
                            </div>

                            {/* Estado */}
                            <div className="col-span-2">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${statusInfo.color} ${statusInfo.glow}`}>
                                {statusInfo.icon === 'check' && <CheckCircle className="w-3.5 h-3.5" />}
                                {statusInfo.icon === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                                {statusInfo.icon === 'clock' && <Clock className="w-3.5 h-3.5" />}
                                {statusInfo.text}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Expanded Documents Table - Only show when not ready for alta */}
                      {isExpanded && !readyForAlta && (
                        <div className="px-6 pb-6 pt-2">
                          <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
                            {/* Section Header */}
                            <div className="px-5 py-4 bg-gradient-to-r from-[#3879a3]/10 to-[#2d6a8a]/5 border-b border-slate-200 dark:border-slate-700">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3879a3] to-[#2d6a8a] flex items-center justify-center shadow-md">
                                    <FileCheck className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-foreground">Documentación a Revisar</h4>
                                    <p className="text-xs text-muted-foreground">{clientDocs.length} documentos requeridos</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{approvedCount}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                    <span className="font-semibold text-amber-700 dark:text-amber-400">{clientDocs.length - reviewedCount}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-slate-100/80 dark:bg-slate-800/80">
                                  <tr>
                                    <th className="text-left px-5 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Documento</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24">Carácter</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estado</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-36">Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {clientDocs.map((doc) => {
                                    const reviewStatus = reviews[doc.id];
                                    const hasDocument = client.documents?.[doc.id] || tableUploadedDocs[client.id]?.[doc.id];
                                    return (
                                      <React.Fragment key={doc.id}>
                                        <tr
                                          className={`transition-all duration-200 ${hasDocument
                                            ? 'hover:bg-[#3879a3]/5'
                                            : 'opacity-50 bg-slate-50/50 dark:bg-slate-800/20'
                                            } ${reviewStatus === 'approved' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}
                                        ${reviewStatus === 'rejected' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                                        >
                                          <td className="px-5 py-4">
                                            {hasDocument && reviewStatus !== 'solicitado' ? (
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleViewDocument(client, doc);
                                                }}
                                                className="flex items-center gap-3 transition-all group cursor-pointer"
                                              >
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3879a3]/20 to-[#2d6a8a]/10 flex items-center justify-center group-hover:from-[#3879a3] group-hover:to-[#2d6a8a] transition-all">
                                                  <FileText className="w-5 h-5 text-[#3879a3] group-hover:text-white transition-colors" />
                                                </div>
                                                <div className="text-left">
                                                  <span className="text-sm font-semibold text-foreground group-hover:text-[#3879a3] transition-colors block">{doc.name}</span>
                                                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Eye className="w-3 h-3" />
                                                    Click para ver
                                                  </span>
                                                </div>
                                              </button>
                                            ) : (() => {
                                              const handleFileUpload = (e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                  setTableUploadedDocs(prev => ({
                                                    ...prev,
                                                    [client.id]: { ...prev[client.id], [doc.id]: { file, dataUrl: ev.target.result, name: file.name } },
                                                  }));
                                                  handleDocumentReview(client.id, doc.id, null);
                                                  toast.success(`${file.name} cargado`);
                                                };
                                                reader.readAsDataURL(file);
                                              };
                                              return (
                                                <label className={`flex items-center gap-3 cursor-pointer group w-fit rounded-xl px-3 py-2 border-2 border-dashed transition-all ${
                                                  reviewStatus === 'solicitado'
                                                    ? 'border-blue-300 dark:border-blue-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                    : 'border-slate-300 dark:border-slate-600 hover:border-[#3879a3] hover:bg-[#3879a3]/5'
                                                }`}>
                                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                    reviewStatus === 'solicitado' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'
                                                  }`}>
                                                    <Upload className={`w-4 h-4 ${reviewStatus === 'solicitado' ? 'text-blue-500' : 'text-slate-400 group-hover:text-[#3879a3]'}`} />
                                                  </div>
                                                  <div>
                                                    <span className="text-sm font-medium text-foreground block">{doc.name}</span>
                                                    <span className={`text-xs ${reviewStatus === 'solicitado' ? 'text-blue-500' : 'text-muted-foreground'}`}>
                                                      {reviewStatus === 'solicitado' ? 'Cargar nuevo documento' : 'Cargar archivo'}
                                                    </span>
                                                  </div>
                                                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} />
                                                </label>
                                              );
                                            })()}
                                          </td>
                                          <td className="px-4 py-4 text-center">
                                            {doc.required !== false ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-md text-xs font-semibold text-slate-700 dark:text-slate-300">
                                                <Shield className="w-3 h-3" />
                                                Req.
                                              </span>
                                            ) : (
                                              <span className="text-xs text-slate-400 italic">Opcional</span>
                                            )}
                                          </td>
                                          <td className="px-4 py-4">
                                            <div className="flex justify-center">
                                              {reviewStatus === 'approved' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-lg shadow-sm">
                                                  <CheckCircle className="w-4 h-4" />
                                                  Aprobado
                                                </span>
                                              ) : reviewStatus === 'rejected' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-semibold rounded-lg shadow-sm">
                                                  <XCircle className="w-4 h-4" />
                                                  Rechazado
                                                </span>
                                              ) : reviewStatus === 'solicitado' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-lg">
                                                  <Send className="w-4 h-4" />
                                                  Solicitado
                                                </span>
                                              ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-lg">
                                                  <Clock className="w-4 h-4" />
                                                  Pendiente
                                                </span>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-4 py-4">
                                            {hasDocument ? (
                                              <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                {reviewStatus !== 'rejected' && (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      handleDocumentReview(client.id, doc.id, 'approved');
                                                    }}
                                                    className={`p-2.5 rounded-xl transition-all duration-200 ${reviewStatus === 'approved'
                                                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30'
                                                      }`}
                                                    title="Aprobar"
                                                  >
                                                    <CheckCircle className="w-5 h-5" />
                                                  </button>
                                                )}
                                                {reviewStatus === 'rejected' ? (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      handleDocumentReview(client.id, doc.id, 'solicitado');
                                                      toast.info(`Documentación solicitada: ${doc.name}`);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 transition-all"
                                                    title="Solicitar documento nuevamente"
                                                  >
                                                    <Send className="w-3.5 h-3.5" />
                                                    Solicitar
                                                  </button>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      openRejectModal(client.id, doc.id, doc.name);
                                                    }}
                                                    className="p-2.5 rounded-xl transition-all duration-200 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                                                    title="Rechazar"
                                                  >
                                                    <XCircle className="w-5 h-5" />
                                                  </button>
                                                )}
                                              </div>
                                            ) : (
                                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    handleDocumentReview(client.id, doc.id, reviewStatus === 'solicitado' ? null : 'solicitado');
                                                    if (reviewStatus !== 'solicitado') toast.info(`Documentación solicitada: ${doc.name}`);
                                                  }}
                                                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${reviewStatus === 'solicitado'
                                                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30'
                                                  }`}
                                                >
                                                  <Send className="w-3.5 h-3.5" />
                                                  {reviewStatus === 'solicitado' ? 'Solicitado' : 'Solicitar'}
                                                </button>
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                        {/* Fila para motivo de rechazo */}
                                        {reviewStatus === 'rejected' && rejectionReasons[client.id]?.[doc.id] && (
                                          <tr className="bg-red-50/60 dark:bg-red-900/10">
                                            <td colSpan={4} className="px-5 py-2.5">
                                              <div className="flex items-center gap-3 pl-12">
                                                <div className="w-1 h-6 rounded-full bg-red-400 shrink-0"></div>
                                                <span className="text-xs text-red-600 dark:text-red-400">
                                                  <span className="font-bold">Motivo: </span>
                                                  {rejectionReasons[client.id][doc.id]}
                                                </span>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* Continue with observations - only if all reviewed but some rejected */}
                            {allReviewed && (
                              <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/10 border-t border-amber-200 dark:border-amber-800">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                                      <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-amber-800 dark:text-amber-200">
                                        Documentación con observaciones
                                      </p>
                                      <p className="text-sm text-amber-600 dark:text-amber-400">
                                        {Object.values(reviews).filter(r => r === 'rejected').length} documento(s) rechazado(s) - Puede continuar con observaciones
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleSelectClient(client)}
                                    className="group px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
                                  >
                                    Continuar con Observaciones
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Stats footer */}
            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Mostrando {filteredClients.length} de {pendingClients.length} clientes pendientes
              </span>
            </div>

          </div>
        );

      case 'documents': {
        // Todos los documentos en una sola lista
        const allDocs = [...specificDocs, ...complementaryDocs];

        // Calcular progreso
        const docsCompletos = allDocs.filter(doc =>
          (docData[doc.id] && Object.keys(docData[doc.id]).some(k => docData[doc.id][k])) || uploadedDocs[doc.id]?.autoGenerated
        ).length;
        const progresoPercent = allDocs.length > 0 ? Math.round((docsCompletos / allDocs.length) * 100) : 0;

        // Navegación entre documentos
        const currentDocIdx = allDocs.findIndex(d => d.id === selectedDocId);
        const prevDoc = currentDocIdx > 0 ? allDocs[currentDocIdx - 1] : null;
        const nextDoc = currentDocIdx < allDocs.length - 1 ? allDocs[currentDocIdx + 1] : null;

        return (
          <div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden">
            {/* PDF Viewer */}
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 min-w-0 overflow-hidden">
              <PDFViewer
                file={selectedFile?.dataUrl}
                fileName={selectedFile?.name}
              />
            </div>

            {/* Form Panel con Tabs */}
            <div className="w-[360px] flex-shrink-0 border-l border-border bg-card flex flex-col">
              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setDocumentsTab('docs')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${documentsTab === 'docs'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Documentos
                </button>
                <button
                  onClick={() => setDocumentsTab('personas')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${documentsTab === 'personas'
                    ? 'text-primary border-b-2 border-primary bg-primary/5'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  Personas
                </button>
              </div>

              {/* Navegador de documentos */}
              {(
                <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-slate-50 dark:bg-slate-800/50 shrink-0">
                  <button
                    type="button"
                    onClick={() => prevDoc && setSelectedDocId(prevDoc.id)}
                    disabled={!prevDoc}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center px-2">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {selectedDocument?.name || 'Seleccionar documento'}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {currentDocIdx + 1} de {allDocs.length}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => nextDoc && setSelectedDocId(nextDoc.id)}
                    disabled={!nextDoc}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {documentsTab === 'personas' && personaDetalleIdx !== null && personas[personaDetalleIdx] && (() => {
                  const p = personas[personaDetalleIdx];
                  const idx = personaDetalleIdx;
                  const upd = (field, value) => updatePersonaField(idx, field, value);
                  const total = personas.length;
                  return (
                    <div className="flex flex-col h-full">

                      {/* ── Header ── */}
                      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-slate-50 dark:bg-slate-800/50 shrink-0">
                        <button type="button" onClick={() => setPersonaDetalleIdx(null)}
                          className="flex items-center gap-1 text-xs text-[#3879a3] hover:underline shrink-0">
                          <ChevronLeft className="w-3.5 h-3.5" /> Lista
                        </button>
                        {/* Prev / dots / Next */}
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => irAPersona(idx - 1)} disabled={idx === 0}
                            className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          {personas.map((_, i) => (
                            <button key={i} type="button" onClick={() => irAPersona(i)}
                              className={`rounded-full transition-all ${i === idx ? 'w-4 h-2 bg-[#3879a3]' : 'w-2 h-2 bg-slate-300 dark:bg-slate-600 hover:bg-[#3879a3]/50'}`} />
                          ))}
                          <button type="button" onClick={() => irAPersona(idx + 1)} disabled={idx === total - 1}
                            className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{idx + 1}/{total}</span>
                      </div>

                      {/* ── Card animada ── */}
                      <div key={`scroll-${idx}`} className="flex-1 overflow-y-auto">
                        <div className={`p-4 space-y-4 ${slideDir === 'right' ? 'slide-in-right' : 'slide-in-left'}`}>

                          {/* Avatar + nombre */}
                          <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="w-11 h-11 rounded-full bg-[#3879a3] text-white flex items-center justify-center text-base font-bold shrink-0 shadow">
                              {p.apellido?.[0] || p.nombre?.[0] || '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                                {p.apellido || p.nombre ? `${p.apellido} ${p.nombre}`.trim() : 'Nueva persona'}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {p.numeroDocumento ? `DNI ${p.numeroDocumento}` : 'Completar DNI'}
                              </p>
                            </div>
                            <button type="button" onClick={() => quitarPersona(idx)}
                              className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Roles */}
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Roles</p>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { key: 'esFirmante', label: 'Firmante' },
                                { key: 'esBeneficiarioFinal', label: 'Benef. Final' },
                                { key: 'esPep', label: 'PEP' },
                                { key: 'esAccionista', label: entityType === ENTITY_TYPES.SA ? 'Accionista' : 'Socio', show: [ENTITY_TYPES.SA, ENTITY_TYPES.SRL].includes(entityType) },
                                { key: 'esSocioSH', label: 'Socio', show: entityType === ENTITY_TYPES.SH },
                                { key: 'esAutoridad', label: 'Autoridad' },
                                { key: 'esApoderado', label: 'Apoderado' },
                                { key: 'esHeredero', label: 'Heredero', show: entityType === ENTITY_TYPES.SUCESION },
                                { key: 'esAdministrador', label: 'Administrador', show: entityType === ENTITY_TYPES.SUCESION },
                              ].filter(r => r.show !== false).map(({ key, label }) => (
                                <button key={key} type="button" onClick={() => upd(key, !p[key])}
                                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${p[key] ? 'bg-[#3879a3] text-white border-[#3879a3]' : 'bg-transparent text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600 hover:border-[#3879a3] hover:text-[#3879a3]'}`}>
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Datos personales */}
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Datos personales</p>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div><label className="label text-[10px]">Apellido *</label>
                                  <input type="text" className="input text-sm py-1.5" placeholder="Apellido"
                                    value={p.apellido || ''} onChange={e => upd('apellido', e.target.value)} /></div>
                                <div><label className="label text-[10px]">Nombre *</label>
                                  <input type="text" className="input text-sm py-1.5" placeholder="Nombre"
                                    value={p.nombre || ''} onChange={e => upd('nombre', e.target.value)} /></div>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div><label className="label text-[10px]">DNI *</label>
                                  <input type="text" className="input text-sm py-1.5" placeholder="12345678"
                                    value={p.numeroDocumento || ''} onChange={e => upd('numeroDocumento', e.target.value)} /></div>
                                <div><label className="label text-[10px]">CUIT</label>
                                  <input type="text" className="input text-sm py-1.5" placeholder="20-00000000-0"
                                    value={p.cuit || ''} onChange={e => upd('cuit', e.target.value)} /></div>
                              </div>
                              <div><label className="label text-[10px]">Email</label>
                                <input type="email" className="input text-sm py-1.5 w-full" placeholder="email@ejemplo.com"
                                  value={p.email || ''} onChange={e => upd('email', e.target.value)} /></div>
                              <div><label className="label text-[10px]">Teléfono</label>
                                <input type="tel" className="input text-sm py-1.5 w-full" placeholder="11-1234-5678"
                                  value={p.telefono || ''} onChange={e => upd('telefono', e.target.value)} /></div>
                              <div><label className="label text-[10px]">Domicilio</label>
                                <input type="text" className="input text-sm py-1.5 w-full" placeholder="Av. Corrientes 1234, CABA"
                                  value={p.domicilio || ''} onChange={e => upd('domicilio', e.target.value)} /></div>
                            </div>
                          </div>

                          {/* Datos por rol */}
                          {p.esAutoridad && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Cargo</p>
                              <input type="text" className="input text-sm py-1.5 w-full" placeholder="Ej: Presidente, Director"
                                value={p.cargo || ''} onChange={e => upd('cargo', e.target.value)} />
                              <div><label className="label text-[10px]">Inicio de mandato</label>
                                <input type="date" className="input text-sm py-1.5 w-full" value={p.fechaInicioMandato || ''} onChange={e => upd('fechaInicioMandato', e.target.value)} /></div>
                              <div>
                                <label className="label text-[10px]">¿Se indica fecha de caducidad?</label>
                                <div className="flex gap-2 mt-0.5">
                                  {['Sí', 'No'].map(opt => (
                                    <button key={opt} type="button" onClick={() => upd('indicaFinMandato', opt === 'Sí')}
                                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${p.indicaFinMandato === (opt === 'Sí') && p.indicaFinMandato !== undefined ? 'bg-[#3879a3] text-white border-[#3879a3]' : 'bg-transparent text-slate-500 border-slate-300 hover:border-[#3879a3] hover:text-[#3879a3]'}`}>
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {p.indicaFinMandato === true && (
                                <div><label className="label text-[10px]">Fin de mandato</label>
                                  <input type="date" className="input text-sm py-1.5 w-full" value={p.fechaFinMandato || ''} onChange={e => upd('fechaFinMandato', e.target.value)} /></div>
                              )}
                            </div>
                          )}
                          {p.esAccionista && (
                            <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">% Participación</p>
                              <input type="text" className="input text-sm py-1.5 w-full" placeholder="Ej: 33.33%"
                                value={p.porcentaje || ''} onChange={e => upd('porcentaje', e.target.value)} /></div>
                          )}
                          {p.esSocioSH && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Datos del Socio</p>
                              <div><label className="label text-[10px]">% Participación / Cuota-parte</label>
                                <input type="text" className="input text-sm py-1.5 w-full" placeholder="Ej: 50%"
                                  value={p.shPorcentaje || ''} onChange={e => upd('shPorcentaje', e.target.value)} /></div>
                              <div><label className="label text-[10px]">Cargo / Rol</label>
                                <select className="input text-sm py-1.5 w-full" value={p.shCargoRol || ''} onChange={e => upd('shCargoRol', e.target.value)}>
                                  <option value="">Seleccionar...</option>
                                  <option value="Socio">Socio</option>
                                  <option value="Socio Administrador">Socio Administrador</option>
                                  <option value="Socio Gerente">Socio Gerente</option>
                                  <option value="Otro">Otro</option>
                                </select>
                                {p.shCargoRol === 'Otro' && (
                                  <input type="text" className="input text-sm py-1.5 w-full mt-1.5" placeholder="Especificar cargo..."
                                    value={p.shCargoOtro || ''} onChange={e => upd('shCargoOtro', e.target.value)} />
                                )}
                              </div>
                              <div><label className="label text-[10px]">Firma presente en el contrato</label>
                                <div className="flex gap-2 mt-0.5">
                                  {['Sí', 'No'].map(opt => (
                                    <button key={opt} type="button" onClick={() => upd('shFirmaPresente', opt)}
                                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${p.shFirmaPresente === opt ? 'bg-[#3879a3] text-white border-[#3879a3]' : 'bg-transparent text-slate-500 border-slate-300 hover:border-[#3879a3] hover:text-[#3879a3]'}`}>
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                          {p.esApoderado && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Poder</p>
                              <div><label className="label text-[10px]">Otorgamiento</label>
                                <input type="date" className="input text-sm py-1.5 w-full" value={p.fechaOtorgamiento || ''} onChange={e => upd('fechaOtorgamiento', e.target.value)} /></div>
                              <div>
                                <label className="label text-[10px]">¿Se indica fecha de caducidad?</label>
                                <div className="flex gap-2 mt-0.5">
                                  {['Sí', 'No'].map(opt => (
                                    <button key={opt} type="button" onClick={() => upd('indicaFinPoder', opt === 'Sí')}
                                      className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all ${p.indicaFinPoder === (opt === 'Sí') && p.indicaFinPoder !== undefined ? 'bg-[#3879a3] text-white border-[#3879a3]' : 'bg-transparent text-slate-500 border-slate-300 hover:border-[#3879a3] hover:text-[#3879a3]'}`}>
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              {p.indicaFinPoder === true && (
                                <div><label className="label text-[10px]">Vencimiento del poder</label>
                                  <input type="date" className="input text-sm py-1.5 w-full" value={p.fechaVencimientoPoder || ''} onChange={e => upd('fechaVencimientoPoder', e.target.value)} /></div>
                              )}
                            </div>
                          )}
                          {p.esHeredero && (
                            <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Heredero</p>
                              <div className="space-y-2">
                                <select className="input text-sm py-1.5 w-full" value={p.vinculoCausante || ''} onChange={e => upd('vinculoCausante', e.target.value)}>
                                  <option value="">Vínculo con causante...</option>
                                  <option value="conyuge">Cónyuge</option><option value="hijo">Hijo/a</option>
                                  <option value="padre">Padre/Madre</option><option value="hermano">Hermano/a</option>
                                  <option value="nieto">Nieto/a</option><option value="otro">Otro</option>
                                </select>
                                <input type="text" className="input text-sm py-1.5 w-full" placeholder="% participación en herencia"
                                  value={p.porcentaje || ''} onChange={e => upd('porcentaje', e.target.value)} />
                              </div>
                            </div>
                          )}
                          {p.esAdministrador && (
                            <div><p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Administrador</p>
                              <div className="space-y-2">
                                <select className="input text-sm py-1.5 w-full" value={p.tipoAdministrador || ''} onChange={e => upd('tipoAdministrador', e.target.value)}>
                                  <option value="">Tipo...</option>
                                  <option value="judicial">Judicial</option><option value="convenido">Convenido</option>
                                  <option value="provisorio">Provisorio</option><option value="definitivo">Definitivo</option>
                                </select>
                                <select className="input text-sm py-1.5 w-full" value={p.aceptoCargo || ''} onChange={e => upd('aceptoCargo', e.target.value)}>
                                  <option value="">¿Aceptó el cargo?</option>
                                  <option value="si">Sí</option><option value="no">No</option><option value="pendiente">Pendiente</option>
                                </select>
                              </div>
                            </div>
                          )}


                          {/* Screening */}
                          <div>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Screening</p>
                            <div className="flex items-center justify-between p-3 border-2 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
                              <div>
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">RepET</p>
                                <p className="text-[10px] text-slate-400">¿Figura en la lista?</p>
                              </div>
                              <div className="flex gap-1.5">
                                <button type="button" onClick={() => upd('figuraEnRepet', true)}
                                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${p.figuraEnRepet === true ? 'bg-red-500 border-red-500 text-white' : 'border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500'}`}>SÍ</button>
                                <button type="button" onClick={() => upd('figuraEnRepet', false)}
                                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${p.figuraEnRepet === false ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'}`}>NO</button>
                              </div>
                            </div>
                          </div>

                        </div>{/* fin card animada */}
                      </div>

                      {/* ── Footer navegación ── */}
                      <div className="shrink-0 border-t border-border bg-white dark:bg-slate-900 px-3 py-3 flex items-center gap-2">
                        <button type="button" onClick={() => setPersonaDetalleIdx(null)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0">
                          <ChevronLeft className="w-3.5 h-3.5" />
                          Lista
                        </button>
                        <div className="flex-1 flex items-center justify-center gap-2">
                          <button type="button" disabled={idx === 0} onClick={() => irAPersona(idx - 1)}
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#3879a3] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-xs font-semibold text-muted-foreground tabular-nums">{idx + 1} / {total}</span>
                          <button type="button" disabled={idx >= total - 1} onClick={() => irAPersona(idx + 1)}
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-[#3879a3] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <button type="button"
                          onClick={() => toast.success('Datos de persona guardados')}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#3879a3] text-white hover:bg-[#2d6a8a] transition-colors shrink-0">
                          <Save className="w-3.5 h-3.5" />
                          Guardar
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {documentsTab === 'personas' && personaDetalleIdx === null && (
                  <div className="p-4 space-y-3 overflow-y-auto h-full">

                    {/* ── Chips de personas seleccionadas ── */}
                    {personas.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-3 bg-[#3879a3]/5 rounded-xl border border-[#3879a3]/20">
                        <p className="w-full text-[10px] font-semibold text-[#3879a3] uppercase tracking-wider mb-1">
                          Seleccionadas ({personas.length})
                        </p>
                        {personas.map((p, idx) => (
                          <div
                            key={idx}
                            onClick={() => irAPersona(idx)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-[#3879a3]/30 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200 shadow-sm cursor-pointer hover:border-[#3879a3] hover:bg-[#3879a3]/5 transition-colors"
                          >
                            <span className="w-5 h-5 rounded-full bg-[#3879a3] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                              {p.apellido?.[0] || p.nombre?.[0] || '?'}
                            </span>
                            <span className="truncate max-w-[100px]">{`${p.apellido} ${p.nombre}`.trim() || 'Nueva persona'}</span>
                            <span
                              className={`ml-1 w-2 h-2 rounded-full shrink-0 ${p.figuraEnRepet === true ? 'bg-red-400' : p.figuraEnRepet === false ? 'bg-emerald-400' : 'bg-slate-200'}`}
                              title={p.figuraEnRepet === true ? 'RepET: Figura' : p.figuraEnRepet === false ? 'RepET: No figura' : 'RepET: Pendiente'}
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); quitarPersona(idx); }}
                              className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── Dropdown / panel con personas disponibles ── */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">

                      {/* Header del panel */}
                      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[#3879a3]" />
                          Personas disponibles
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Seleccioná las que forman parte de esta sociedad
                        </p>
                      </div>

                      {/* Lista con checkboxes */}
                      <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
                        {personasDeEstaSociedad.map((p) => {
                          const seleccionada = personas.some((per) => per._dirId === p.id);
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${seleccionada
                                ? 'bg-[#3879a3]/5 dark:bg-[#3879a3]/10'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                                }`}
                              onClick={() => togglePersonaDelSistema(p)}
                            >
                              {/* Checkbox visual */}
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${seleccionada
                                ? 'bg-[#3879a3] border-[#3879a3]'
                                : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                {seleccionada && <Check className="w-3 h-3 text-white" />}
                              </div>

                              {/* Avatar */}
                              <div className="w-8 h-8 rounded-full bg-[#3879a3] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                {p.apellido?.[0] || p.nombre?.[0] || '?'}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                  {`${p.apellido} ${p.nombre}`.trim() || 'Sin nombre'}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">
                                  {p.email || 'Sin email'}{p.telefono ? ` · ${p.telefono}` : ''}
                                </p>
                              </div>

                              {seleccionada && <CheckCircle className="w-4 h-4 text-[#3879a3] shrink-0" />}
                            </div>
                          );
                        })}

                        {personasDeEstaSociedad.length === 0 && (
                          <div className="px-4 py-6 text-center text-sm text-gray-400">
                            No hay personas del sistema para este cliente
                          </div>
                        )}

                        {/* ── Agregar nueva persona ── */}
                        {!showNuevoInput ? (
                          <button
                            type="button"
                            onClick={agregarPersonaManual}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors text-left border-t border-dashed border-gray-200 dark:border-gray-700"
                          >
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl font-bold shrink-0">+</div>
                            <div>
                              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Agregar nueva persona</p>
                              <p className="text-[11px] text-gray-400">No figura en el sistema todavía</p>
                            </div>
                          </button>
                        ) : (
                          <div className="border-t border-dashed border-emerald-200 p-3 bg-emerald-50/50 dark:bg-emerald-900/10 space-y-3">
                            {/* Selector de cantidad */}
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">¿Cuántas personas?</p>
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setCantidadNuevas(nuevasPersonas.length - 1)}
                                  className="w-7 h-7 rounded-full border-2 border-emerald-300 text-emerald-600 font-bold text-lg flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-30"
                                  disabled={nuevasPersonas.length <= 1}>−</button>
                                <span className="w-6 text-center text-sm font-bold text-emerald-700 dark:text-emerald-300">{nuevasPersonas.length}</span>
                                <button type="button" onClick={() => setCantidadNuevas(nuevasPersonas.length + 1)}
                                  className="w-7 h-7 rounded-full border-2 border-emerald-300 text-emerald-600 font-bold text-lg flex items-center justify-center hover:bg-emerald-100 transition-colors disabled:opacity-30"
                                  disabled={nuevasPersonas.length >= 10}>+</button>
                              </div>
                            </div>
                            {/* Filas nombre/apellido */}
                            <div className="space-y-2">
                              {nuevasPersonas.map((np, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-400 w-4 shrink-0">{i + 1}.</span>
                                  <input
                                    autoFocus={i === 0}
                                    type="text"
                                    placeholder="Apellido"
                                    value={np.apellido}
                                    onChange={e => setNuevasPersonas(prev => prev.map((x, j) => j === i ? { ...x, apellido: e.target.value } : x))}
                                    className="input text-sm py-1.5 flex-1"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={np.nombre}
                                    onChange={e => setNuevasPersonas(prev => prev.map((x, j) => j === i ? { ...x, nombre: e.target.value } : x))}
                                    className="input text-sm py-1.5 flex-1"
                                  />
                                </div>
                              ))}
                            </div>
                            {/* Acciones */}
                            <div className="flex gap-2">
                              <button type="button" onClick={confirmarNuevoPersona}
                                disabled={!nuevasPersonas.some(p => p.apellido.trim() || p.nombre.trim())}
                                className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-40 transition-colors">
                                Agregar {nuevasPersonas.length > 1 ? `${nuevasPersonas.length} personas` : 'persona'}
                              </button>
                              <button type="button" onClick={cerrarNuevoInput}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                                Cancelar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Botón Continuar: primero existentes, luego nuevas ── */}
                    {personas.length > 0 && !showNuevoInput && (
                      <button
                        type="button"
                        onClick={() => {
                          // Ir primero a las personas del sistema, luego a las nuevas
                          const primeraExistente = personas.findIndex(p => p.fromSystem);
                          setPersonaDetalleIdx(primeraExistente >= 0 ? primeraExistente : 0);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-[#3879a3] to-[#2d6a8a] text-white font-semibold text-sm hover:shadow-lg hover:shadow-[#3879a3]/30 transition-all active:scale-[0.99]"
                      >
                        Carga de datos — {personas.length} persona{personas.length !== 1 ? 's' : ''}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                  </div>
                )}

                {documentsTab === 'docs' && (
                  <DocumentForm
                    document={selectedDocument}
                    fields={selectedFields}
                    initialValues={getInitialValuesForDoc(selectedDocId)}
                    onSave={(docId, data) => handleSaveDocData(docId, data, allDocs)}
                    onFieldChange={handleFieldChange}
                  />
                )}
              </div>
            </div>
          </div>
        );
      }

      case 'dd':
        return (
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#3879a3] to-[#2d6a8a] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3879a3]/20 shrink-0">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Riesgo — Perfil Transaccional</h2>
                <p className="text-sm text-muted-foreground">Nivel socioeconómico · Clasificación de riesgo · Ventas estimadas</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">

                {/* NSE */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-4 bg-violet-500/5 dark:bg-violet-500/10 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">NSE — Nivel Socioeconómico</h3>
                      <p className="text-[10px] text-muted-foreground">Clasificación del segmento del cliente</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: 'ABC1', label: 'ABC1', desc: 'Alto' },
                        { val: 'C2',   label: 'C2',   desc: 'Medio-Alto' },
                        { val: 'C3',   label: 'C3',   desc: 'Medio' },
                        { val: 'D1',   label: 'D1',   desc: 'Medio-Bajo' },
                        { val: 'D2',   label: 'D2',   desc: 'Bajo' },
                        { val: 'E',    label: 'E',    desc: 'Muy Bajo' },
                      ].map(({ val, label, desc }) => (
                        <button key={val} type="button"
                          onClick={() => setDdData(prev => ({ ...prev, nseNivel: val }))}
                          className={`py-2.5 rounded-xl border-2 text-center transition-all ${
                            ddData.nseNivel === val
                              ? 'bg-[#3879a3] border-[#3879a3] text-white shadow-md shadow-[#3879a3]/20'
                              : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-[#3879a3]/50 hover:bg-[#3879a3]/5'
                          }`}>
                          <p className="text-xs font-bold">{label}</p>
                          <p className={`text-[9px] ${ddData.nseNivel === val ? 'text-white/80' : 'text-muted-foreground'}`}>{desc}</p>
                        </button>
                      ))}
                    </div>
                    <textarea
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm resize-none placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3] transition-all"
                      rows={2}
                      placeholder="Observaciones sobre NSE..."
                      value={ddData.nseNotas}
                      onChange={e => setDdData(prev => ({ ...prev, nseNotas: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Nivel de Riesgo */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-4 bg-amber-500/5 dark:bg-amber-500/10 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Nivel de Riesgo</h3>
                      <p className="text-[10px] text-muted-foreground">Clasificación según política de riesgo</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { val: 'bajo',  label: 'Bajo',  color: 'emerald', desc: 'DDS' },
                        { val: 'medio', label: 'Medio', color: 'amber',   desc: 'DDM' },
                        { val: 'alto',  label: 'Alto',  color: 'red',     desc: 'DDR' },
                      ].map(({ val, label, color, desc }) => {
                        const isActive = ddData.nivelRiesgo === val;
                        const activeCls =
                          color === 'emerald' ? 'bg-emerald-500 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : color === 'amber'   ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-500/20'
                          :                       'bg-red-500 border-red-500 text-white shadow-md shadow-red-500/20';
                        return (
                          <button key={val} type="button"
                            onClick={() => setDdData(prev => ({ ...prev, nivelRiesgo: val }))}
                            className={`py-3 rounded-xl border-2 text-center transition-all ${isActive ? activeCls : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-400'}`}>
                            <p className="text-sm font-bold">{label}</p>
                            <p className={`text-[10px] font-medium ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>{desc}</p>
                          </button>
                        );
                      })}
                    </div>
                    {(ddData.nivelRiesgo === 'bajo' || ddData.nivelRiesgo === 'medio' || ddData.nivelRiesgo === 'alto') && (
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ventas estimadas anuales</p>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">$</span>
                          <input type="text"
                            className="w-full pl-7 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3] transition-all placeholder:text-slate-400"
                            placeholder="Ej: 5.000.000"
                            value={ddData.ventasEstimadasAnuales}
                            onChange={e => setDdData(prev => ({ ...prev, ventasEstimadasAnuales: e.target.value }))} />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1.5">Requerido para todos los niveles de riesgo</p>
                      </div>
                    )}
                  </div>
                </div>

            </div>
          </div>
        );

      case 'review': {
        // Collect all doc data
        const allData = {};
        Object.keys(docData).forEach(docId => { Object.assign(allData, docData[docId]); });

        const razonSocial = datosSociedad.razonSocial || allData.denominacion_social || allData.srl_razon_social || allData.sh_denominacion || '';
        const cuit = datosSociedad.cuit || allData.sa_cuit || allData.arca_cuit_verificar || allData.srl_cuit || allData.sh_cuit || '';
        const uploadedCount = Object.keys(uploadedDocs).length;

        const datosEntidad = [
          { label: 'Razón Social', value: datosSociedad.razonSocial || allData.denominacion_social || allData.srl_razon_social },
          { label: 'CUIT', value: datosSociedad.cuit || allData.sa_cuit || allData.srl_cuit },
          { label: 'Domicilio Legal', value: datosSociedad.domicilioLegal || allData.srl_domicilio_legal || allData.sh_domicilio },
          { label: 'Actividad Principal', value: datosSociedad.actividadPrincipal || allData.actividad_principal },
          { label: 'Capital Social', value: datosSociedad.capitalSocial || allData.capital_suscripto || allData.srl_capital_social },
          { label: 'Objeto Social', value: datosSociedad.objetoSocial },
          { label: 'Inscripción IGJ', value: datosSociedad.inscripcionIGJ },
          { label: 'Tipo Societario', value: allData.tipo_societario },
          { label: 'Fecha de Constitución', value: datosSociedad.fechaConstitucion || allData.fecha_constitucion || allData.srl_fecha_constitucion },
          { label: 'Sede Social', value: allData.srl_sede_social },
          { label: 'Duración', value: allData.duracion_sociedad || allData.srl_plazo_duracion },
          { label: 'Mandato Vigente', value: allData.mandato_vigente },
        ].filter(d => d.value);

        const riskMetaMap = {
          alto:  { label: 'Alto',  badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',     dd: 'DDR — Debida Diligencia Reforzada' },
          medio: { label: 'Medio', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dd: 'DDM — Debida Diligencia Media' },
          bajo:  { label: 'Bajo',  badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dd: 'DDS — Debida Diligencia Simplificada' },
        };
        const riskMeta = riskMetaMap[ddData.nivelRiesgo];

        const docsCompletos = documents.filter(d => uploadedDocs[d.id] && docData[d.id] && Object.keys(docData[d.id]).some(k => docData[d.id][k])).length;
        const docsPendientes = documents.filter(d => d.required && !uploadedDocs[d.id]).length;

        // Inline card header: Editar / Guardar | Cancelar
        const cardActions = (cardId, onEditInit, onSave) => (
          reviewEditCard !== cardId ? (
            <button onClick={() => { setReviewEditCard(cardId); onEditInit?.(); }}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-[#3879a3] transition-colors">
              <Pencil className="w-3 h-3" /> Editar
            </button>
          ) : (
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => { onSave?.(); setReviewEditCard(null); }}
                className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
                <Check className="w-3 h-3" /> Guardar
              </button>
              <span className="text-slate-300 dark:text-slate-600 select-none">|</span>
              <button onClick={() => setReviewEditCard(null)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-3 h-3" /> Cancelar
              </button>
            </div>
          )
        );

        return (
          <div className="overflow-y-auto p-6 space-y-5 bg-slate-50 dark:bg-slate-900">

            {/* ── HERO: identidad + estado ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-5">
              <div className="w-9 h-9 rounded-xl bg-[#3879a3]/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-[#3879a3]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{razonSocial || <span className="text-muted-foreground italic">Sin razón social</span>}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-muted-foreground font-mono">{cuit || '—'}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">{ENTITY_TYPE_LABELS[entityType] || '—'}</span>
                </div>
              </div>
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 shrink-0 ${
                quedaPendiente
                  ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700'
                  : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700'
              }`}>
                {quedaPendiente
                  ? <Clock className="w-5 h-5 text-amber-500" />
                  : <CheckCircle className="w-5 h-5 text-emerald-500" />}
                <div>
                  <p className={`text-sm font-bold leading-tight ${quedaPendiente ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    {quedaPendiente ? 'Quedará Pendiente' : 'Listo para Alta'}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{uploadedCount}/{documents.length} docs · {personas.length} personas</p>
                </div>
              </div>
            </div>

            {/* ── MÉTRICAS: Riesgo / NSE / Ventas ── */}
            <div className="grid grid-cols-3 gap-4">

              {/* Nivel de Riesgo */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nivel de Riesgo</p>
                  {cardActions('risk',
                    () => setReviewEditBuf({ nivelRiesgo: ddData.nivelRiesgo }),
                    () => setDdData(prev => ({ ...prev, nivelRiesgo: reviewEditBuf.nivelRiesgo }))
                  )}
                </div>
                <div className="p-4">
                  {reviewEditCard === 'risk' ? (
                    <select value={reviewEditBuf.nivelRiesgo || ''}
                      onChange={e => setReviewEditBuf(prev => ({ ...prev, nivelRiesgo: e.target.value }))}
                      className="w-full p-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]">
                      <option value="">Seleccione...</option>
                      <option value="bajo">Bajo</option>
                      <option value="medio">Medio</option>
                      <option value="alto">Alto</option>
                    </select>
                  ) : riskMeta ? (
                    <>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold ${riskMeta.badge}`}>
                        <Shield className="w-4 h-4" />{riskMeta.label}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2">{riskMeta.dd}</p>
                    </>
                  ) : <p className="text-xs text-muted-foreground italic">Sin definir</p>}
                </div>
              </div>

              {/* NSE */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">NSE</p>
                  {cardActions('nse',
                    () => setReviewEditBuf({ nseNivel: ddData.nseNivel, nseNotas: ddData.nseNotas }),
                    () => setDdData(prev => ({ ...prev, nseNivel: reviewEditBuf.nseNivel, nseNotas: reviewEditBuf.nseNotas }))
                  )}
                </div>
                <div className="p-4">
                  {reviewEditCard === 'nse' ? (
                    <div className="space-y-2">
                      <select value={reviewEditBuf.nseNivel || ''}
                        onChange={e => setReviewEditBuf(prev => ({ ...prev, nseNivel: e.target.value }))}
                        className="w-full p-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]">
                        <option value="">Seleccione...</option>
                        <option value="ABC1">ABC1 — Alto</option>
                        <option value="C2">C2 — Medio-Alto</option>
                        <option value="C3">C3 — Medio</option>
                        <option value="D1">D1 — Medio-Bajo</option>
                        <option value="D2">D2 — Bajo</option>
                        <option value="E">E — Muy Bajo</option>
                      </select>
                      <textarea value={reviewEditBuf.nseNotas || ''}
                        onChange={e => setReviewEditBuf(prev => ({ ...prev, nseNotas: e.target.value }))}
                        className="w-full p-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3] resize-none"
                        rows={2} placeholder="Notas..." />
                    </div>
                  ) : ddData.nseNivel ? (
                    <>
                      <p className="text-2xl font-bold text-foreground">{ddData.nseNivel}</p>
                      {ddData.nseNotas && <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2">{ddData.nseNotas}</p>}
                    </>
                  ) : <p className="text-xs text-muted-foreground italic">Sin definir</p>}
                </div>
              </div>

              {/* Ventas Est. Anuales */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ventas Est. Anuales</p>
                  {cardActions('ventas',
                    () => setReviewEditBuf({ ventasEstimadasAnuales: ddData.ventasEstimadasAnuales }),
                    () => setDdData(prev => ({ ...prev, ventasEstimadasAnuales: reviewEditBuf.ventasEstimadasAnuales }))
                  )}
                </div>
                <div className="p-4">
                  {reviewEditCard === 'ventas' ? (
                    <input type="number" value={reviewEditBuf.ventasEstimadasAnuales || ''}
                      onChange={e => setReviewEditBuf(prev => ({ ...prev, ventasEstimadasAnuales: e.target.value }))}
                      className="w-full p-2 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]"
                      placeholder="Monto en $..." />
                  ) : ddData.ventasEstimadasAnuales ? (
                    <p className="text-xl font-bold text-foreground">
                      ${Number(ddData.ventasEstimadasAnuales).toLocaleString('es-AR')}
                    </p>
                  ) : <p className="text-xs text-muted-foreground italic">Sin definir</p>}
                </div>
              </div>
            </div>

            {/* ── DATOS ENTIDAD + PERSONAS (2 col) ── */}
            <div className="grid grid-cols-2 gap-5">

              {/* Datos Entidad */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                  <Building2 className="w-4 h-4 text-[#3879a3]" />
                  <h4 className="text-sm font-bold text-foreground">Datos de la Entidad</h4>
                  {cardActions('entidad',
                    () => setReviewEditBuf({ ...datosSociedad }),
                    () => setDatosSociedad(prev => ({ ...prev, ...reviewEditBuf }))
                  )}
                </div>
                {reviewEditCard === 'entidad' ? (
                  <div className="p-4 space-y-2">
                    {[
                      { key: 'razonSocial', label: 'Razón Social' },
                      { key: 'cuit', label: 'CUIT' },
                      { key: 'domicilioLegal', label: 'Domicilio Legal' },
                      { key: 'actividadPrincipal', label: 'Actividad Principal' },
                      { key: 'capitalSocial', label: 'Capital Social' },
                      { key: 'objetoSocial', label: 'Objeto Social' },
                      { key: 'inscripcionIGJ', label: 'Inscripción IGJ' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
                        <input type="text" value={reviewEditBuf[key] || ''}
                          onChange={e => setReviewEditBuf(prev => ({ ...prev, [key]: e.target.value }))}
                          className="w-full mt-0.5 p-1.5 text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-[#3879a3]/30 focus:border-[#3879a3]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 divide-y divide-slate-100 dark:divide-slate-700">
                    {datosEntidad.length > 0 ? datosEntidad.map((d, i) => (
                      <div key={i} className="flex justify-between items-baseline gap-3 py-2 first:pt-0 last:pb-0">
                        <span className="text-xs text-muted-foreground shrink-0">{d.label}</span>
                        <span className="text-xs font-medium text-foreground text-right">{d.value}</span>
                      </div>
                    )) : <p className="text-xs text-muted-foreground italic">Sin datos cargados</p>}
                  </div>
                )}
              </div>

              {/* Personas */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                  <Users className="w-4 h-4 text-[#3879a3]" />
                  <h4 className="text-sm font-bold text-foreground">Personas</h4>
                  <span className="text-xs text-muted-foreground ml-1">({personas.length})</span>
                  {cardActions('personas', () => {}, () => {})}
                </div>
                {reviewEditCard === 'personas' ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {personas.length === 0 && <p className="px-5 py-3 text-xs text-muted-foreground italic">Sin personas registradas</p>}
                    {personas.map((p, i) => {
                      const isOpen = personaInlineEditIdx === i;
                      return (
                        <div key={i}>
                          <div className="flex items-center gap-2.5 px-4 py-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#3879a3]/10 flex items-center justify-center text-[#3879a3] font-bold text-[11px] shrink-0 uppercase">
                              {p.apellido?.[0] || p.nombre?.[0] || '?'}
                            </div>
                            <span className="text-xs font-semibold text-foreground flex-1 truncate">{p.apellido} {p.nombre}</span>
                            <button type="button"
                              onClick={() => {
                                if (isOpen) {
                                  setPersonas(prev => prev.map((px, idx) => idx === i ? { ...px, ...personaInlineBuf } : px));
                                  setPersonaInlineEditIdx(null);
                                  toast.success('Persona actualizada');
                                } else {
                                  setPersonaInlineEditIdx(i);
                                  setPersonaInlineBuf({ ...p });
                                }
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded transition-colors shrink-0 ${isOpen ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300'}`}>
                              {isOpen ? 'Guardar' : 'Editar'}
                            </button>
                            {isOpen && (
                              <button type="button" onClick={() => setPersonaInlineEditIdx(null)}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 transition-colors shrink-0">
                                ✕
                              </button>
                            )}
                          </div>
                          {isOpen && (
                            <div className="px-4 pb-3 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/30">
                              {[
                                { key: 'apellido', label: 'Apellido' },
                                { key: 'nombre', label: 'Nombre' },
                                { key: 'cuit', label: 'CUIT' },
                                { key: 'numeroDocumento', label: 'Nro. Doc.' },
                                { key: 'email', label: 'Email' },
                                { key: 'telefono', label: 'Teléfono' },
                                { key: 'domicilio', label: 'Domicilio' },
                                { key: 'cargo', label: 'Cargo' },
                              ].map(({ key, label }) => (
                                <div key={key}>
                                  <label className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider block">{label}</label>
                                  <input type="text" value={personaInlineBuf[key] || ''}
                                    onChange={e => setPersonaInlineBuf(prev => ({ ...prev, [key]: e.target.value }))}
                                    className="w-full mt-0.5 px-2 py-1 text-xs border border-border rounded bg-background focus:ring-1 focus:ring-[#3879a3]/30 focus:border-[#3879a3]" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : personas.length === 0 ? (
                  <p className="px-5 py-4 text-xs text-muted-foreground italic">Sin personas registradas</p>
                ) : (
                  <>
                    {/* Table header */}
                    <div className="grid grid-cols-[28px_1fr_90px_90px_22px] gap-x-2 items-center px-4 py-2 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-700/60">
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">#</span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Nombre</span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Cargo</span>
                      <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Perfil</span>
                      <span></span>
                    </div>
                    {/* Table rows */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {personas.map((p, i) => {
                        const primaryRole = [
                          { key: 'esAdministrador', label: 'Administrador' },
                          { key: 'esAutoridad', label: 'Autoridad' },
                          { key: 'esFirmante', label: 'Firmante' },
                          { key: 'esApoderado', label: 'Apoderado' },
                          { key: 'esAccionista', label: entityType === ENTITY_TYPES.SA ? 'Accionista' : 'Socio' },
                          { key: 'esBeneficiarioFinal', label: 'B. Final' },
                          { key: 'esSocioSH', label: 'Socio SH' },
                        ].find(r => p[r.key]);
                        const isExpanded = personaInlineEditIdx === i;
                        return (
                          <div key={i}>
                            <div className="grid grid-cols-[28px_1fr_90px_90px_22px] gap-x-2 items-center px-4 py-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                              <span className="text-[10px] text-muted-foreground font-mono">{i + 1}</span>
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-foreground truncate">
                                  {[p.apellido, p.nombre].filter(Boolean).join(', ')}
                                </p>
                                {p.cuit && <p className="text-[9px] text-muted-foreground font-mono leading-none mt-0.5">CUIT: {p.cuit}</p>}
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate">{p.cargo || 'Sin definir'}</span>
                              <div className="flex items-center gap-1 flex-wrap">
                                {primaryRole ? (
                                  <span className="px-1.5 py-px rounded text-[9px] font-semibold bg-[#3879a3]/10 text-[#3879a3] whitespace-nowrap truncate">
                                    {primaryRole.label}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-muted-foreground">—</span>
                                )}
                                {p.esPep && (
                                  <span className="px-1.5 py-px rounded text-[9px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                                    PEP
                                  </span>
                                )}
                              </div>
                              <button type="button"
                                onClick={() => setPersonaInlineEditIdx(isExpanded ? null : i)}
                                className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-[#3879a3] hover:bg-[#3879a3]/10 transition-colors">
                                <Info className="w-3 h-3" />
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/60 grid grid-cols-3 gap-x-4 gap-y-2">
                                {[
                                  { label: 'Email', value: p.email },
                                  { label: 'Teléfono', value: p.telefono },
                                  { label: 'CUIT', value: p.cuit },
                                  { label: 'Nro. Documento', value: p.numeroDocumento },
                                  { label: 'Domicilio', value: p.domicilio },
                                  { label: '% Participación', value: p.porcentaje ? `${p.porcentaje}%` : null },
                                ].filter(d => d.value).map(d => (
                                  <div key={d.label}>
                                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{d.label}</p>
                                    <p className="text-[10px] font-medium text-foreground truncate">{d.value}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── DOCUMENTACIÓN ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                <FileText className="w-4 h-4 text-[#3879a3]" />
                <h4 className="text-sm font-bold text-foreground">Documentación</h4>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle className="w-3.5 h-3.5" />{docsCompletos} completos</span>
                  {docsPendientes > 0 && <span className="flex items-center gap-1 text-red-500"><XCircle className="w-3.5 h-3.5" />{docsPendientes} faltantes</span>}
                </div>
                {cardActions('docs', () => {}, () => {})}
              </div>
              {reviewEditCard === 'docs' ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {documents.map(doc => {
                    const hasUpload = uploadedDocs[doc.id];
                    return (
                      <div key={doc.id} className="flex flex-col gap-1 px-4 py-2.5 border-b border-slate-100 dark:border-slate-700/60 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${hasUpload ? 'bg-emerald-100 dark:bg-emerald-900/30' : doc.required ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <FileText className={`w-3 h-3 ${hasUpload ? 'text-emerald-600' : doc.required ? 'text-red-400' : 'text-slate-400'}`} />
                          </div>
                          <span className="text-xs text-foreground flex-1">{doc.name}</span>
                          {hasUpload && (
                            <button type="button"
                              onClick={() => setViewingDocument({ doc, client: { legalName: datosSociedad.razonSocial || 'Alta en proceso', cuit: datosSociedad.cuit || '' }, fileName: hasUpload.name || doc.name, fileUrl: hasUpload.dataUrl || null })}
                              className="w-6 h-6 rounded flex items-center justify-center text-[#3879a3] hover:bg-[#3879a3]/10 transition-colors shrink-0" title="Ver documento">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <label className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-[#3879a3]/10 text-[#3879a3] hover:bg-[#3879a3]/20 cursor-pointer transition-colors shrink-0">
                            <Upload className="w-3 h-3" />
                            {hasUpload ? 'Cambiar' : 'Subir'}
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onload = (ev) => setUploadedDocs(prev => ({ ...prev, [doc.id]: { file, dataUrl: ev.target.result, name: file.name } }));
                                reader.readAsDataURL(file);
                              }} />
                          </label>
                        </div>
                        {hasUpload && (
                          <p className="text-[10px] text-emerald-600 font-medium pl-9">{hasUpload.name}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {documents.map(doc => {
                    const hasUpload = uploadedDocs[doc.id];
                    const hasData = docData[doc.id] && Object.keys(docData[doc.id]).some(k => docData[doc.id][k]);
                    const status = hasUpload && hasData ? 'completo' : hasUpload ? 'cargado' : doc.required ? 'faltante' : 'opcional';
                    const statusCfg = {
                      completo: { icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />, badge: null },
                      cargado:  { icon: <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />, badge: <span className="text-[9px] font-bold text-amber-500 uppercase">Sin datos</span> },
                      faltante: { icon: <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />, badge: <span className="text-[9px] font-bold text-red-500 uppercase">Req.</span> },
                      opcional: { icon: <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />, badge: null },
                    }[status];
                    return (
                      <div key={doc.id} className="flex flex-col gap-0.5 px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {statusCfg.icon}
                          <span className="text-xs text-foreground flex-1">{doc.name}</span>
                          {statusCfg.badge}
                          {hasUpload ? (
                            <button type="button"
                              onClick={() => setViewingDocument({ doc, client: { legalName: datosSociedad.razonSocial || 'Alta en proceso', cuit: datosSociedad.cuit || '' }, fileName: hasUpload.name || doc.name, fileUrl: hasUpload.dataUrl || null })}
                              className="w-6 h-6 rounded flex items-center justify-center text-[#3879a3] hover:bg-[#3879a3]/10 transition-colors shrink-0" title="Ver documento">
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <label className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-[#3879a3]/10 hover:text-[#3879a3] cursor-pointer transition-colors shrink-0">
                              <Upload className="w-3 h-3" />
                              Subir
                              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const reader = new FileReader();
                                  reader.onload = (ev) => setUploadedDocs(prev => ({ ...prev, [doc.id]: { file, dataUrl: ev.target.result, name: file.name } }));
                                  reader.readAsDataURL(file);
                                }} />
                            </label>
                          )}
                        </div>
                        {hasUpload && (
                          <p className="text-[10px] text-emerald-600 font-medium pl-6">{hasUpload.name}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── NOSIS ── */}
            {(ddData.nosisNotas || ddData.nosisArchivo) && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                  <Search className="w-4 h-4 text-[#3879a3]" />
                  <h4 className="text-sm font-bold text-foreground">NOSIS</h4>
                  {ddData.nosisArchivo && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />PDF cargado
                    </span>
                  )}
                </div>
                {ddData.nosisNotas && (
                  <div className="p-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{ddData.nosisNotas}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── COMENTARIOS INTERNOS ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700">
                <HelpCircle className="w-4 h-4 text-[#3879a3]" />
                <h4 className="text-sm font-bold text-foreground">Comentarios internos</h4>
                {comentariosAlta.length > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-[#3879a3] text-white text-[10px] font-bold flex items-center justify-center">
                    {comentariosAlta.length}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-3">
                {comentariosAlta.length > 0 && (
                  <div className="space-y-2">
                    {comentariosAlta.map(c => (
                      <div key={c.id} className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="w-7 h-7 rounded-full bg-[#3879a3]/15 flex items-center justify-center shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-[#3879a3]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold text-foreground">{c.autor}</span>
                            <span className="text-[10px] text-muted-foreground">{c.fecha}</span>
                            <button type="button" onClick={() => setComentariosAlta(prev => prev.filter(x => x.id !== c.id))}
                              className="ml-auto text-slate-300 hover:text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">{c.texto}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <textarea
                    className="input text-sm resize-none flex-1 py-2"
                    rows={2}
                    placeholder="Comentario interno para el equipo..."
                    value={nuevoComentario}
                    onChange={e => setNuevoComentario(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) agregarComentario(); }}
                  />
                  <button type="button" onClick={agregarComentario}
                    disabled={!nuevoComentario.trim()}
                    className="px-4 py-2 rounded-xl bg-[#3879a3] text-white text-sm font-semibold hover:bg-[#2d6285] disabled:opacity-40 disabled:cursor-not-allowed transition-all self-end">
                    Agregar
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">Ctrl+Enter para agregar</p>
              </div>
            </div>


          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header con gradiente */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#3879a3] via-[#4a8ab5] to-[#2d6a8a] sticky top-0 z-10 shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNi42MjcgMC0xMiA1LjM3My0xMiAxMnM1LjM3MyAxMiAxMiAxMiAxMi01LjM3MyAxMi0xMi01LjM3My0xMi0xMi0xMnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/clients')}
                className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Alta de Usuario</h1>
                <p className="text-sm text-white/70">Revise documentación y complete el alta</p>
              </div>
            </div>

            {/* Stepper moderno */}
            <div className="hidden md:flex items-center bg-white/10 backdrop-blur-sm rounded-2xl p-1.5 border border-white/20">
              {STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const isClickable = index <= currentStep;

                return (
                  <div key={step.id} className="flex items-center">
                    <button
                      onClick={() => isClickable && setCurrentStep(index)}
                      disabled={!isClickable}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
                        ${isActive
                          ? 'bg-white/95 text-[#3879a3] shadow-lg dark:bg-white/15 dark:text-white dark:shadow-black/20'
                          : isCompleted
                            ? 'text-white/90 hover:bg-white/10'
                            : 'text-white/40 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                        ${isActive
                          ? 'bg-[#3879a3] text-white dark:bg-white/30 dark:text-white'
                          : isCompleted
                            ? 'bg-emerald-400 text-white'
                            : 'bg-white/15 text-white/40'
                        }
                      `}>
                        {isCompleted ? <Check size={14} /> : index + 1}
                      </div>
                      <span className="font-medium text-sm hidden lg:inline">{step.label}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1">
        {renderStepContent()}
      </div>

      {/* Footer Navigation */}
      {currentStep > 0 && (
        <div className="border-t border-border bg-card sticky bottom-0 px-4 py-2 flex items-center justify-between">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1 && false /* always enabled when step>0 */}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            {currentStep === STEPS.length - 1 ? (
              <button
                onClick={handleFinish}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                  quedaPendiente ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#3879a3] hover:bg-[#2d6a8a]'
                }`}
              >
                <Save size={14} />
                {quedaPendiente ? 'Guardar como Pendiente' : 'Confirmar Alta'}
              </button>
            ) : (
              <button
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-[#3879a3] hover:bg-[#2d6a8a] transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-[92vw] h-[92vh] max-w-7xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#3879a3] via-[#4a8ab5] to-[#2d6a8a] text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{viewingDocument.doc.name}</h3>
                  <p className="text-sm text-white/80">
                    {viewingDocument.client.legalName || viewingDocument.client.cuit} • {viewingDocument.fileName}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseDocumentViewer}
                className="w-10 h-10 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - PDF Viewer */}
            <div className="flex-1 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6">
              {viewingDocument.fileUrl ? (
                <div className="h-full rounded-xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
                  <PDFViewer
                    file={viewingDocument.fileUrl}
                    fileName={viewingDocument.fileName}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FileText className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Documento no disponible</p>
                  <p className="text-sm mt-1">El archivo no ha sido cargado aún</p>
                  <p className="text-xs mt-4 text-muted-foreground/70">
                    En modo demo, los documentos son simulados
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className={`font-medium ${viewingDocument.doc.required !== false ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                  {viewingDocument.doc.required !== false ? 'Obligatorio' : 'Opcional'}
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>{viewingDocument.doc.description || 'Documento de la entidad'}</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseDocumentViewer}
                  className="px-4 py-2 rounded-xl text-sm text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => {
                    openRejectModal(viewingDocument.client.id, viewingDocument.doc.id, viewingDocument.doc.name);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Rechazar
                </button>
                <button
                  onClick={() => {
                    handleDocumentReview(viewingDocument.client.id, viewingDocument.doc.id, 'approved');
                    toast.success('Documento aprobado');
                    handleCloseDocumentViewer();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Rechazo con Motivo */}
      {rejectingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Rechazar Documento</h3>
              <p className="text-sm text-muted-foreground mt-1">{rejectingDoc.docName}</p>
            </div>
            <div className="p-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Motivo del rechazo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="Ingrese el motivo por el cual rechaza este documento..."
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => {
                  setRejectingDoc(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL ALTA EXITOSA ── */}
      {altaExitosa && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

            {/* Banner superior */}
            <div className={`px-8 py-8 text-white text-center ${altaExitosa.isPendiente ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-[#3879a3] to-[#2d6a8a]'}`}>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-black">Cliente dado de alta</h2>
              <p className="text-white/80 mt-1 text-sm font-medium">{altaExitosa.clientName}</p>
            </div>

            {/* Contenido */}
            <div className="px-8 py-6 space-y-4">

              {altaExitosa.isPendiente ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Alta registrada con documentación incompleta</p>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">El cliente fue creado en estado <span className="font-bold">Pendiente</span>. Deberá completar la información faltante para activarlo:</p>
                  <ul className="space-y-1.5">
                    {altaExitosa.docsIncompletos.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Alta completa y aprobada</p>
                  </div>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">El cliente ya es visible en Clientes Activos.</p>
                </div>
              )}

              {/* Acciones */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => navigate(`/clients/${altaExitosa.clientId}`)}
                  className="w-full py-3 bg-[#3879a3] hover:bg-[#2d6a8a] text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg hover:shadow-[#3879a3]/25"
                >
                  Ver ficha del cliente
                </button>
                <button
                  onClick={() => navigate('/clients')}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-sm transition-all"
                >
                  Ir a lista de clientes
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ClientOnboarding;
