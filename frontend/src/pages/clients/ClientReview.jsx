import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';
import { documentService } from '../../services/documentService';
import { toast } from 'react-toastify';
import { ENTITY_TYPE_LABELS } from '../../config/documentRequirements';
import {
    ArrowLeft,
    Check,
    X,
    FileText,
    Users,
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    UserPlus,
    Mail,
    Building2,
    Calendar,
    Eye,
    Info,
    CreditCard,
    MapPin,
    Briefcase,
    Phone,
    Send,
    MessageSquare,
    User,
} from 'lucide-react';

const DOCUMENT_STATUS = {
    PENDING: 'pendiente',
    APPROVED: 'aprobado',
    REJECTED: 'rechazado',
};

const ROLE_LABELS = {
    esBeneficiarioFinal: 'Benef. Final',
    esPep: 'PEP',
    esPresidente: 'Presidente',
    esDirector: 'Director',
    esGerente: 'Gerente',
    esApoderado: 'Apoderado',
    esAccionista: 'Accionista',
    esSocioSRL: 'Socio',
    esSocioSH: 'Socio',
    esHeredero: 'Heredero',
    esAdministrador: 'Administrador',
    esFirmante: 'Firmante',
    esAutoridad: 'Autoridad',
};

const ClientReview = () => {
    const { id: clientId } = useParams();
    const navigate = useNavigate();

    const [client, setClient] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [documentStatuses, setDocumentStatuses] = useState({});
    const [rejectionComments, setRejectionComments] = useState({});
    const [registeredUsers, setRegisteredUsers] = useState([]);
    const [selectedSigners, setSelectedSigners] = useState([]);
    const [externalSigners, setExternalSigners] = useState([]);
    const [hasPEP, setHasPEP] = useState(false);
    const [pepApproved, setPepApproved] = useState(false);
    const [complianceOfficerComment, setComplianceOfficerComment] = useState('');
    const [activeTab, setActiveTab] = useState('datos');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectType, setRejectType] = useState(null);
    const [rejectComment, setRejectComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewingDoc, setViewingDoc] = useState(null);
    const [rejectingDoc, setRejectingDoc] = useState(null);
    const [inlineRejectComment, setInlineRejectComment] = useState('');
    const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
    const [requestInfoComment, setRequestInfoComment] = useState('');

    useEffect(() => {
        loadClientData();
    }, [clientId]);

    const loadClientData = async () => {
        try {
            const res = await clientService.getById(clientId);
            const data = res.data?.data;
            if (!data) { toast.error('Cliente no encontrado'); return; }

            setClient(data);

            const docs = Object.entries(data.documents || {}).map(([key, doc]) => ({
                id: doc.id,
                versionId: doc.versionId,
                type: key,
                name: doc.nombre,
                required: doc.esObligatorio,
                status: doc.estado || 'sin_version',
                uploadDate: '-',
                fileUrl: doc.url ? `/api/${doc.url}` : null,
                motivoRechazo: doc.motivoRechazo,
                observaciones: doc.observaciones,
            }));
            setDocuments(docs);

            const users = (data.personas || []).map(p => ({
                id: String(p.id),
                name: `${p.firstName || p.nombre || ''} ${p.lastName || p.apellido || ''}`.trim(),
                cuit: p.cuit,
                email: p.email,
                role: p.rol,
            }));
            setRegisteredUsers(users);

            const autoSigners = (data.personas || [])
                .filter(p => p.tipo_firma && p.tipo_firma !== 'ninguna')
                .map(p => String(p.id));
            setSelectedSigners(autoSigners);

            setHasPEP((data.personas || []).some(p => p.es_pep || p.esPep));

            const initialStatuses = {};
            docs.forEach(doc => { initialStatuses[doc.id] = doc.status; });
            setDocumentStatuses(initialStatuses);

            const initialComments = {};
            docs.forEach(doc => {
                if (doc.motivoRechazo) initialComments[doc.id] = doc.motivoRechazo;
            });
            setRejectionComments(initialComments);
        } catch (error) {
            console.error(error);
            toast.error('Error al cargar datos del cliente');
        }
    };

    const getDayCount = () => {
        if (!client?.createdAt) return 0;
        return Math.ceil((new Date() - new Date(client.createdAt)) / (1000 * 60 * 60 * 24));
    };

    // Build unified personas list (handles both new format and legacy arrays)
    const getPersonas = () => {
        if (!client) return [];
        if (client.personas?.length) return client.personas;
        const combined = [];
        (client.authorities || []).forEach(p => combined.push({
            ...p, esAutoridad: true, cargo: p.position,
            nombre: p.firstName, apellido: p.lastName,
        }));
        (client.beneficialOwners || []).forEach(p => combined.push({
            ...p, esBeneficiarioFinal: true, porcentaje: p.ownershipPercentage,
            nombre: p.firstName, apellido: p.lastName,
        }));
        (client.signatories || []).forEach(p => combined.push({
            ...p, esFirmante: true,
            nombre: p.firstName, apellido: p.lastName,
        }));
        (client.attorneys || []).forEach(p => combined.push({
            ...p, esApoderado: true,
            nombre: p.firstName, apellido: p.lastName,
        }));
        return combined;
    };

    // Flatten formData for entity details display
    const getEntityData = () => {
        if (!client) return {};
        const flat = {};
        if (client.datosSociedad) Object.assign(flat, client.datosSociedad);
        if (client.formData && typeof client.formData === 'object') {
            Object.values(client.formData).forEach(d => {
                if (d && typeof d === 'object') Object.assign(flat, d);
            });
        }
        return flat;
    };

    const handleDocumentStatusChange = async (docId, status) => {
        if (status === DOCUMENT_STATUS.REJECTED && !rejectionComments[docId]) {
            const doc = documents.find(d => d.id === docId);
            openRejectModal('document', doc);
            return;
        }
        if (status === DOCUMENT_STATUS.APPROVED) {
            const doc = documents.find(d => d.id === docId);
            if (!doc?.versionId) {
                toast.error('Este documento no tiene archivo cargado');
                return;
            }
            try {
                await documentService.aprobar(docId, { id_version: doc.versionId });
                setDocumentStatuses(prev => ({ ...prev, [docId]: status }));
                toast.success('Documento aprobado');
            } catch {
                toast.error('Error al aprobar documento');
            }
        }
    };

    const toggleSigner = (userId) => {
        setSelectedSigners(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const addExternalSigner = () => {
        setExternalSigners(prev => [...prev, { id: `ext-${Date.now()}`, name: '', cuit: '', email: '' }]);
    };

    const updateExternalSigner = (id, field, value) => {
        setExternalSigners(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const removeExternalSigner = (id) => {
        setExternalSigners(prev => prev.filter(s => s.id !== id));
    };

    const canAcceptDocumentation = () => {
        const hasSigners = selectedSigners.length > 0 || externalSigners.some(s => s.name && s.cuit && s.email);
        const pepCondition = !hasPEP || pepApproved;
        return hasSigners && pepCondition;
    };

    const getPendingDocsCount = () => {
        const requiredDocs = documents.filter(doc => doc.required);
        return requiredDocs.filter(doc => documentStatuses[doc.id] !== DOCUMENT_STATUS.APPROVED).length;
    };

    const handleAcceptDocumentation = async () => {
        if (!canAcceptDocumentation()) return;
        setIsSubmitting(true);
        try {
            await clientService.approve(clientId);
            toast.success('Documentación aceptada. Cliente aprobado.');
            navigate('/clients');
        } catch {
            toast.error('Error al procesar la aceptación');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectComment.trim()) {
            toast.error('Debe ingresar un comentario para el rechazo');
            return;
        }
        if (rejectType === 'document') {
            try {
                if (selectedDoc?.versionId) {
                    await documentService.rechazar(selectedDoc.id, {
                        id_version: selectedDoc.versionId,
                        motivo_rechazo: rejectComment,
                    });
                }
                setDocumentStatuses(prev => ({ ...prev, [selectedDoc.id]: DOCUMENT_STATUS.REJECTED }));
                setRejectionComments(prev => ({ ...prev, [selectedDoc.id]: rejectComment }));
                toast.warning('Documento rechazado');
            } catch {
                toast.error('Error al rechazar documento');
            }
        } else {
            try {
                await clientService.reject(clientId, rejectComment);
                toast.error('Solicitud rechazada');
                navigate('/clients');
            } catch {
                toast.error('Error al rechazar solicitud');
            }
        }
        setShowRejectModal(false);
        setRejectComment('');
    };

    const handleRequestInfo = async () => {
        if (!requestInfoComment.trim()) {
            toast.error('Debe especificar qué información se necesita');
            return;
        }
        setIsSubmitting(true);
        try {
            await clientService.update(clientId, {
                status: 'info_solicitada',
                infoSolicitadaMotivo: requestInfoComment,
            });
            toast.info('Solicitud de información enviada al cliente via app');
            navigate('/clients');
        } catch {
            toast.error('Error al enviar la solicitud');
        } finally {
            setIsSubmitting(false);
            setShowRequestInfoModal(false);
        }
    };

    const handleInlineReject = async (doc) => {
        if (!inlineRejectComment.trim()) {
            toast.error('Debe ingresar un motivo');
            return;
        }
        try {
            if (doc.versionId) {
                await documentService.rechazar(doc.id, {
                    id_version: doc.versionId,
                    motivo_rechazo: inlineRejectComment,
                });
            }
            setDocumentStatuses(prev => ({ ...prev, [doc.id]: DOCUMENT_STATUS.REJECTED }));
            setRejectionComments(prev => ({ ...prev, [doc.id]: inlineRejectComment }));
            toast.warning('Documento rechazado');
        } catch {
            toast.error('Error al rechazar documento');
        }
        setRejectingDoc(null);
        setInlineRejectComment('');
    };

    const openRejectModal = (type, doc = null) => {
        setRejectType(type);
        setSelectedDoc(doc);
        setShowRejectModal(true);
    };

    if (!client) return (
        <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );

    const personas = getPersonas();
    const entityData = getEntityData();
    const isHuman = client.clientType === 'persona_humana';
    const entityTypeLabel = ENTITY_TYPE_LABELS[client.legalForm || client.entityType] || client.legalForm || client.entityType || '-';

    const domicilioLegal = entityData.domicilioLegal
        || (entityData.srl_dom_calle
            ? [entityData.srl_dom_calle, entityData.srl_dom_numero, entityData.srl_dom_piso, entityData.srl_dom_localidad, entityData.srl_dom_provincia].filter(Boolean).join(', ')
            : null)
        || entityData.lugar_constitucion
        || [client.address, client.city, client.province].filter(Boolean).join(', ')
        || null;

    const actividadPrincipal = entityData.actividadPrincipal
        || entityData.actividad_principal
        || entityData.objeto_social
        || entityData.sh_objeto_social
        || null;

    const capitalSocial = entityData.capitalSocial
        || entityData.capital_suscripto
        || entityData.srl_capital_social
        || entityData.sh_capital_aportes
        || null;

    const pepPersonas = personas.filter(p => p.esPep || p.es_pep);
    const beneficiarios = personas.filter(p => p.esBeneficiarioFinal);

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-500 font-['Lato']">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="group mb-4 flex items-center gap-2 text-sm text-slate-500 hover:text-emerald-600 transition-colors font-bold"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver a la lista
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-[2rem] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shadow-inner">
                            {isHuman ? <User size={36} /> : <Building2 size={36} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white italic">
                                    {client.legalName}
                                </h1>
                                <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-black px-3 py-1 text-[10px] uppercase tracking-tighter shadow-sm border border-amber-200 dark:border-amber-800">
                                    Pendiente
                                </span>
                            </div>
                            <p className="text-slate-500 mt-1 font-bold text-lg">
                                CUIT: <span className="text-slate-700 dark:text-slate-300 tracking-wider font-mono">{client.cuit}</span>
                                {' • '}
                                <span className="uppercase text-emerald-600">{entityTypeLabel}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <button
                        onClick={() => openRejectModal('client')}
                        className="btn h-12 px-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-900/30 text-red-600 font-black hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95"
                    >
                        <X size={18} className="mr-2 inline" />
                        Rechazar
                    </button>
                    <button
                        onClick={() => setShowRequestInfoModal(true)}
                        className="btn h-12 px-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-blue-100 dark:border-blue-900/30 text-blue-600 font-black hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all active:scale-95"
                    >
                        <MessageSquare size={18} className="mr-2 inline" />
                        Solicitar Info
                    </button>
                    <button
                        onClick={handleAcceptDocumentation}
                        disabled={!canAcceptDocumentation() || isSubmitting}
                        className={`btn h-12 px-8 rounded-2xl text-white font-black shadow-xl transition-all active:scale-95 flex items-center disabled:opacity-30 disabled:grayscale ${getPendingDocsCount() > 0 ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200/50 dark:shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200/50 dark:shadow-none'}`}
                    >
                        {isSubmitting ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                        ) : (
                            <CheckCircle size={20} className="mr-2" />
                        )}
                        {getPendingDocsCount() > 0 ? `Aprobar con observaciones (${getPendingDocsCount()})` : 'Aprobar'}
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Ingreso', value: client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-AR') : '-', icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Riesgo', value: (client.riskLevel || '-').toUpperCase(), icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Espera', value: `${getDayCount()} día${getDayCount() !== 1 ? 's' : ''}`, icon: Info, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Documentos', value: `${documents.length} archivo${documents.length !== 1 ? 's' : ''}`, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <div key={i} className="card p-5 border-none shadow-sm bg-white dark:bg-slate-900 flex items-center gap-4 rounded-[1.5rem] group hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-2xl ${stat.bg} dark:bg-opacity-10 ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="flex flex-col lg:flex-row gap-10">
                {/* Tab navigation */}
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="sticky top-24 space-y-2">
                        {[
                            { id: 'datos', label: 'Datos Entidad', icon: Building2, desc: 'Identificación y personas' },
                            { id: 'documents', label: 'Documentos', icon: FileText, desc: 'Expediente legal' },
                            { id: 'signers', label: 'Firmantes', icon: Users, desc: 'Asignación de firmas' },
                            { id: 'pep', label: 'Riesgo PEP', icon: Shield, desc: 'Análisis de perfiles' },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left p-5 rounded-[1.8rem] transition-all duration-300 border-2 ${activeTab === tab.id
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200/50 dark:shadow-none translate-x-1'
                                    : 'bg-white dark:bg-slate-900 border-transparent text-slate-500 hover:border-slate-100 dark:hover:border-slate-800'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-xl ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                        <tab.icon size={22} />
                                    </div>
                                    <div>
                                        <p className="font-black text-sm tracking-tight">{tab.label}</p>
                                        <p className={`text-[10px] font-bold opacity-70 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                                            {tab.desc}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 min-w-0">

                    {/* ── DATOS ENTIDAD ── */}
                    {activeTab === 'datos' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-3 px-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                    Datos de la Entidad
                                </h2>
                            </div>

                            {/* Identificación */}
                            <div className="card shadow-sm border-none dark:bg-slate-900 rounded-[2rem] p-6 space-y-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificación</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { icon: Building2, label: 'Razón Social', value: client.legalName },
                                        { icon: CreditCard, label: 'CUIT', value: client.cuit, mono: true },
                                        { icon: Briefcase, label: 'Tipo de Entidad', value: entityTypeLabel },
                                        { icon: User, label: 'Tipo de Persona', value: isHuman ? 'Persona Humana' : 'Persona Jurídica' },
                                        ...(client.email ? [{ icon: Mail, label: 'Email', value: client.email }] : []),
                                        ...(client.phone ? [{ icon: Phone, label: 'Teléfono', value: client.phone }] : []),
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                                                <item.icon className="w-5 h-5 text-emerald-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{item.label}</p>
                                                <p className={`font-bold text-slate-900 dark:text-white truncate ${item.mono ? 'font-mono' : ''}`}>
                                                    {item.value || '-'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {domicilioLegal && (
                                    <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
                                            <MapPin className="w-5 h-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Domicilio Legal</p>
                                            <p className="font-bold text-slate-900 dark:text-white">{domicilioLegal}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Datos adicionales de la entidad */}
                            {(actividadPrincipal || capitalSocial || entityData.fechaConstitucion || entityData.fecha_constitucion || entityData.srl_fecha_constitucion) && (
                                <div className="card shadow-sm border-none dark:bg-slate-900 rounded-[2rem] p-6 space-y-4">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Datos Societarios</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: 'Actividad / Objeto Social', value: actividadPrincipal },
                                            { label: 'Capital Social', value: capitalSocial },
                                            { label: 'Fecha Constitución', value: entityData.fechaConstitucion || entityData.fecha_constitucion || entityData.srl_fecha_constitucion },
                                            { label: 'Inscripción IGJ', value: entityData.inscripcionIGJ || entityData.numero_inscripcion },
                                        ].filter(item => item.value).map((item, i) => (
                                            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{item.label}</p>
                                                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{item.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PEP alert */}
                            {pepPersonas.length > 0 && (
                                <div className="flex items-start gap-4 p-5 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-[2rem]">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={24} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="font-black text-amber-800 dark:text-amber-300 text-base">PEP Detectado</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                            {pepPersonas.map(p => `${p.apellido || p.lastName || ''} ${p.nombre || p.firstName || ''}`.trim()).join(', ')} — revisar tab Riesgo PEP
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Personas vinculadas */}
                            <div className="card shadow-sm border-none dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                                <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Personas Vinculadas</p>
                                    <div className="flex gap-4 mt-3">
                                        {[
                                            { label: 'Benef. Finales', count: beneficiarios.length, color: 'blue' },
                                            { label: 'PEPs', count: pepPersonas.length, color: 'amber' },
                                            { label: 'Total', count: personas.length, color: 'slate' },
                                        ].map((s, i) => (
                                            <div key={i} className={`text-center px-4 py-2 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 border border-${s.color}-100 dark:border-${s.color}-900/30`}>
                                                <p className={`text-xl font-black text-${s.color}-700 dark:text-${s.color}-400`}>{s.count}</p>
                                                <p className={`text-[10px] font-bold text-${s.color}-600 dark:text-${s.color}-300`}>{s.label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {personas.length === 0 ? (
                                    <div className="px-6 py-10 text-center text-slate-400 font-bold">
                                        Sin personas vinculadas registradas
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {personas.map((persona, idx) => {
                                            const nombre = [persona.apellido || persona.lastName, persona.nombre || persona.firstName].filter(Boolean).join(', ') || 'Sin nombre';
                                            const roles = Object.entries(ROLE_LABELS)
                                                .filter(([key]) => persona[key])
                                                .map(([, label]) => label);
                                            if (persona.cargo) roles.unshift(persona.cargo);
                                            return (
                                                <div key={idx} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 font-black text-sm shrink-0">
                                                        {(persona.apellido?.[0] || persona.lastName?.[0] || '?')}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-slate-900 dark:text-white text-sm truncate">{nombre}</p>
                                                        {(persona.cuit || persona.numeroDocumento) && (
                                                            <p className="text-xs text-slate-400 font-bold font-mono">
                                                                {persona.cuit || persona.numeroDocumento}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5 justify-end">
                                                        {roles.slice(0, 3).map((r, ri) => (
                                                            <span key={ri} className="px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-tight">
                                                                {r}
                                                            </span>
                                                        ))}
                                                        {(persona.esPep || persona.es_pep) && (
                                                            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 uppercase">PEP</span>
                                                        )}
                                                        {persona.porcentaje && (
                                                            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                                                {persona.porcentaje}%
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── DOCUMENTOS ── */}
                    {activeTab === 'documents' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center justify-between px-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                    Expediente Digital
                                </h2>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado General</p>
                                    <p className="text-sm font-black text-emerald-600">
                                        {Object.values(documentStatuses).filter(s => s === 'aprobado').length} / {documents.length} Completados
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-5">
                                {documents.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className={`group card p-0 border-2 transition-all duration-500 rounded-[2rem] overflow-hidden ${documentStatuses[doc.id] === 'aprobado' ? 'border-emerald-100 dark:border-emerald-900/30' :
                                            documentStatuses[doc.id] === 'rechazado' ? 'border-red-100 dark:border-red-900/30' : 'border-transparent shadow-sm'
                                            }`}
                                    >
                                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="flex items-start gap-5">
                                                <div className={`mt-1 p-3 rounded-2xl shadow-sm transition-transform group-hover:scale-105 ${documentStatuses[doc.id] === 'aprobado' ? 'bg-emerald-600 text-white' :
                                                    documentStatuses[doc.id] === 'rechazado' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'
                                                    }`}>
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{doc.name}</h4>
                                                        {doc.required && (
                                                            <span className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-red-100">Requerido</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Actualizado el {doc.uploadDate}</p>
                                                    {documentStatuses[doc.id] === 'rechazado' && rejectionComments[doc.id] && (
                                                        <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 rounded-xl border-l-4 border-red-400">
                                                            <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                                                Motivo del rechazo
                                                            </p>
                                                            <p className="text-sm text-red-700 dark:text-red-300">"{rejectionComments[doc.id]}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-end md:self-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => {
                                                        if (!doc.fileUrl) { toast.info('Sin archivo disponible'); return; }
                                                        setViewingDoc(viewingDoc === doc.id ? null : doc.id);
                                                    }}
                                                    className={`h-10 px-4 rounded-xl text-xs font-black shadow-sm transition-all flex items-center gap-2 ${viewingDoc === doc.id ? 'bg-emerald-600 text-white' : 'text-emerald-600 hover:bg-white dark:hover:bg-slate-700'}`}
                                                >
                                                    <Eye size={16} /> VER
                                                </button>
                                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                                                <button
                                                    onClick={() => handleDocumentStatusChange(doc.id, DOCUMENT_STATUS.APPROVED)}
                                                    className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${documentStatuses[doc.id] === 'aprobado'
                                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
                                                        : 'text-slate-400 hover:text-emerald-600 hover:bg-white'
                                                        }`}
                                                >
                                                    <Check size={20} strokeWidth={3} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (rejectingDoc === doc.id) { setRejectingDoc(null); }
                                                        else { setRejectingDoc(doc.id); setInlineRejectComment(''); }
                                                    }}
                                                    className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${documentStatuses[doc.id] === 'rechazado'
                                                        ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                                                        : 'text-slate-400 hover:text-red-600 hover:bg-white'
                                                        }`}
                                                >
                                                    <X size={20} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                        {viewingDoc === doc.id && doc.fileUrl && (
                                            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                                                <iframe
                                                    src={doc.fileUrl}
                                                    className="w-full rounded-2xl border border-slate-200 dark:border-slate-700"
                                                    style={{ height: '500px' }}
                                                    title={doc.name}
                                                />
                                            </div>
                                        )}
                                        {rejectingDoc === doc.id && (
                                            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                                                <div className="bg-red-50 dark:bg-red-950/20 rounded-2xl p-5 border border-red-100 dark:border-red-900/30">
                                                    <label className="text-[10px] font-black uppercase text-red-500 mb-2 block tracking-widest">Motivo del rechazo</label>
                                                    <textarea
                                                        value={inlineRejectComment}
                                                        onChange={(e) => setInlineRejectComment(e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-800 rounded-xl border border-red-100 dark:border-red-900/30 min-h-[80px] p-4 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-200 mb-3"
                                                        placeholder="Explica qué error encontraste..."
                                                        autoFocus
                                                    />
                                                    <div className="flex gap-3 justify-end">
                                                        <button onClick={() => setRejectingDoc(null)} className="h-9 px-4 rounded-xl text-slate-500 font-black text-xs hover:bg-white dark:hover:bg-slate-800 transition-all">CANCELAR</button>
                                                        <button onClick={() => handleInlineReject(doc)} className="h-9 px-5 rounded-xl bg-red-600 text-white font-black text-xs hover:bg-red-700 shadow-md transition-all active:scale-95">CONFIRMAR RECHAZO</button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── FIRMANTES ── */}
                    {activeTab === 'signers' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="px-2">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                    Esquema de Firmas
                                </h2>
                                <p className="text-sm text-slate-500 font-bold mt-1">Habilita a los usuarios que deben suscribir legalmente la documentación.</p>
                            </div>

                            <div className="card shadow-sm border-none dark:bg-slate-900 rounded-[2.5rem] overflow-hidden">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {registeredUsers.map(user => (
                                        <label
                                            key={user.id}
                                            className={`flex items-center gap-5 p-6 cursor-pointer transition-all ${selectedSigners.includes(user.id) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
                                        >
                                            <div className="relative">
                                                <input type="checkbox" checked={selectedSigners.includes(user.id)} onChange={() => toggleSigner(user.id)} className="peer hidden" />
                                                <div className="w-8 h-8 rounded-2xl border-2 border-slate-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-500 transition-all flex items-center justify-center shadow-sm">
                                                    <Check size={18} strokeWidth={4} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-slate-900 dark:text-white text-lg leading-tight tracking-tight">{user.name}</p>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{user.role} • {user.email}</p>
                                            </div>
                                            <div className="text-[10px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full tracking-widest border border-slate-200 dark:border-slate-700">
                                                {user.cuit}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={addExternalSigner}
                                className="w-full py-6 border-3 border-dashed border-emerald-200 dark:border-emerald-900/30 rounded-[2.5rem] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-400 transition-all flex items-center justify-center gap-3 font-black text-lg tracking-tight active:scale-95"
                            >
                                <div className="p-1 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <UserPlus size={24} />
                                </div>
                                AGREGAR FIRMANTE EXTERNO
                            </button>

                            {externalSigners.map((signer, idx) => (
                                <div key={signer.id} className="card p-8 border-none shadow-md dark:bg-slate-900 rounded-[2.5rem] animate-in slide-in-from-top-4 duration-300">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-6 bg-slate-900 dark:bg-white rounded-full"></div>
                                            <span className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">Firmante Externo #{idx + 1}</span>
                                        </div>
                                        <button onClick={() => removeExternalSigner(signer.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all">
                                            <X size={24} strokeWidth={3} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { field: 'name', label: 'Nombre y Apellido', placeholder: 'Ej: Juan Pérez', type: 'text' },
                                            { field: 'cuit', label: 'CUIT / CUIL', placeholder: '20-XXXXXXXX-X', type: 'text' },
                                            { field: 'email', label: 'Correo Electrónico', placeholder: 'ejemplo@deCampo.com', type: 'email' },
                                        ].map(({ field, label, placeholder, type }) => (
                                            <div key={field}>
                                                <label className="label text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">{label}</label>
                                                <input
                                                    type={type}
                                                    value={signer[field]}
                                                    onChange={(e) => updateExternalSigner(signer.id, field, e.target.value)}
                                                    className="input h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-5 text-lg font-bold focus:ring-4 focus:ring-emerald-100"
                                                    placeholder={placeholder}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── RIESGO PEP ── */}
                    {activeTab === 'pep' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="px-2 font-['Lato']">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                    Perfiles PEP
                                </h2>
                                <p className="text-sm text-slate-500 font-bold mt-1">Análisis de Personas Expuestas Políticamente y riesgos asociados.</p>
                            </div>

                            {pepPersonas.length > 0 && (
                                <div className="card border-none shadow-sm dark:bg-slate-900 rounded-[2rem] overflow-hidden">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PEPs detectados</p>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {pepPersonas.map((p, i) => (
                                            <div key={i} className="flex items-center gap-4 p-5">
                                                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 font-black text-sm shrink-0">
                                                    {(p.apellido?.[0] || p.lastName?.[0] || '?')}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900 dark:text-white">
                                                        {[p.apellido || p.lastName, p.nombre || p.firstName].filter(Boolean).join(', ')}
                                                    </p>
                                                    {p.cargo && <p className="text-xs text-amber-600 font-bold">{p.cargo}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="card border-none shadow-sm dark:bg-slate-900 rounded-[3rem] p-10 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full -mr-20 -mt-20"></div>
                                <div className="w-24 h-24 rounded-[2rem] bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-200">
                                    <Shield size={48} strokeWidth={2.5} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic mb-4">Requiere Auditoría</h3>
                                <p className="text-base text-slate-500 font-bold max-w-sm mx-auto mb-10 leading-snug">
                                    {hasPEP
                                        ? 'Se han detectado vínculos con cargos públicos. El Oficial de Cumplimiento debe validar la procedencia de fondos.'
                                        : 'No se detectaron PEPs. Igual se requiere validación del Oficial de Cumplimiento.'}
                                </p>
                                <div className="max-w-xl mx-auto space-y-6 text-left">
                                    <div
                                        onClick={() => setPepApproved(!pepApproved)}
                                        className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all active:scale-[0.98] flex items-center gap-6 ${pepApproved
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200'
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${pepApproved ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                            <Check size={28} strokeWidth={4} className={pepApproved ? 'opacity-100' : 'opacity-0'} />
                                        </div>
                                        <div>
                                            <p className={`text-lg font-black tracking-tight ${pepApproved ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Aprobar Perfil de Riesgo</p>
                                            <p className={`text-xs font-bold leading-none ${pepApproved ? 'text-white/80' : 'text-slate-400'}`}>Valido que el cliente cumple con las normativas UIF vigentes.</p>
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <label className="text-[10px] font-black uppercase text-slate-400 mb-3 block tracking-widest ml-1">Dictamen Técnico</label>
                                        <textarea
                                            className="input min-h-[150px] rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-none p-6 text-base font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-emerald-100 dark:focus:ring-emerald-950"
                                            placeholder="Redacta aquí las conclusiones del análisis de riesgo..."
                                            value={complianceOfficerComment}
                                            onChange={(e) => setComplianceOfficerComment(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Rechazar */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 max-w-lg w-full animate-in zoom-in-95 duration-500 relative overflow-hidden font-['Lato']">
                        <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm border border-red-200">
                            <AlertTriangle size={36} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 italic tracking-tighter">
                            {rejectType === 'document' ? 'Invalidar Documento' : 'Rechazar Solicitud'}
                        </h3>
                        <p className="text-base text-slate-500 font-bold mb-8 leading-snug">
                            {rejectType === 'document'
                                ? `Estás por marcar como INSUFICIENTE el documento "${selectedDoc?.name}". El cliente deberá subirlo nuevamente.`
                                : 'Esta acción denegará el acceso del cliente. Quedará en estado rechazado para reactivación posterior.'}
                        </p>
                        <div className="mb-8 space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-1">Motivo del Rechazo</label>
                            <textarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                className="input bg-slate-50 dark:bg-slate-800 rounded-2xl min-h-[120px] border-none p-5 text-base font-bold focus:ring-4 focus:ring-red-100 dark:focus:ring-red-950"
                                placeholder="Explica el motivo..."
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowRejectModal(false)} className="h-14 px-6 rounded-2xl text-slate-400 font-black hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex-1">
                                CANCELAR
                            </button>
                            <button onClick={handleReject} className="h-14 px-8 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-none transition-all active:scale-95 flex-1">
                                CONFIRMAR RECHAZO
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Solicitar Info */}
            {showRequestInfoModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] animate-in fade-in duration-300 p-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl p-10 max-w-lg w-full animate-in zoom-in-95 duration-500 relative overflow-hidden font-['Lato']">
                        <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-sm border border-blue-200">
                            <MessageSquare size={36} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 italic tracking-tighter">
                            Solicitar Información
                        </h3>
                        <p className="text-base text-slate-500 font-bold mb-8 leading-snug">
                            El cliente recibirá una notificación en su app indicando qué información o documentación se necesita.
                        </p>
                        <div className="mb-8 space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-1">¿Qué información se necesita?</label>
                            <textarea
                                value={requestInfoComment}
                                onChange={(e) => setRequestInfoComment(e.target.value)}
                                className="input bg-slate-50 dark:bg-slate-800 rounded-2xl min-h-[120px] border-none p-5 text-base font-bold focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-950"
                                placeholder="Ej: Falta acta de asamblea actualizada con fecha 2024..."
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => { setShowRequestInfoModal(false); setRequestInfoComment(''); }}
                                className="h-14 px-6 rounded-2xl text-slate-400 font-black hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex-1"
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={handleRequestInfo}
                                disabled={isSubmitting}
                                className="h-14 px-8 rounded-2xl bg-blue-600 text-white font-black hover:bg-blue-700 shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex-1 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                                ) : (
                                    <Send size={18} />
                                )}
                                ENVIAR SOLICITUD
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientReview;
