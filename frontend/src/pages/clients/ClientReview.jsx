import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
    MessageSquare,
    ChevronRight,
    Info,
    ExternalLink,
} from 'lucide-react';

const DOCUMENT_STATUS = {
    PENDING: 'pendiente',
    APPROVED: 'aprobado',
    REJECTED: 'rechazado',
};

const ClientReview = () => {
    const { id: clientId } = useParams();
    const navigate = useNavigate();

    // Client data
    const [client, setClient] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);

    // Document validation
    const [documentStatuses, setDocumentStatuses] = useState({});
    const [rejectionComments, setRejectionComments] = useState({});

    // Signers configuration
    const [registeredUsers, setRegisteredUsers] = useState([]);
    const [selectedSigners, setSelectedSigners] = useState([]);
    const [externalSigners, setExternalSigners] = useState([]);

    // PEP validation
    const [hasPEP, setHasPEP] = useState(false);
    const [pepApproved, setPepApproved] = useState(false);
    const [complianceOfficerComment, setComplianceOfficerComment] = useState('');

    // UI state
    const [activeTab, setActiveTab] = useState('documents'); // documents, signers, pep
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectType, setRejectType] = useState(null); // 'document' or 'client'
    const [rejectComment, setRejectComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadClientData();
    }, [clientId]);

    const loadClientData = async () => {
        try {
            // Simulamos la carga de datos con identidad deCampo
            const mockClient = {
                id: clientId,
                legalName: 'Estancias de Campo S.A.',
                cuit: '30-71458962-4',
                entityType: 'SA',
                status: 'pendiente_revision',
                submittedDate: '24/01/2026',
                riskLevel: 'medio',
            };

            const mockDocuments = [
                {
                    id: 'doc1',
                    type: 'contrato_social',
                    name: 'Contrato Social y Estatutos',
                    required: true,
                    status: DOCUMENT_STATUS.PENDING,
                    uploadDate: '24/01/2026',
                    fileUrl: '#',
                },
                {
                    id: 'doc2',
                    type: 'acta_designacion',
                    name: 'Acta de Designación de Autoridades',
                    required: true,
                    status: DOCUMENT_STATUS.PENDING,
                    uploadDate: '24/01/2026',
                    fileUrl: '#',
                },
                {
                    id: 'doc3',
                    type: 'libro_socios',
                    name: 'Libro de Accionistas / Registro de Socios',
                    required: true,
                    status: DOCUMENT_STATUS.PENDING,
                    uploadDate: '24/01/2026',
                    fileUrl: '#',
                },
                {
                    id: 'doc4',
                    type: 'poder',
                    name: 'Poder de Representación',
                    required: false,
                    status: DOCUMENT_STATUS.PENDING,
                    uploadDate: '25/01/2026',
                    fileUrl: '#',
                },
            ];

            const mockUsers = [
                { id: 'u1', name: 'Ricardo Thompson', cuit: '20-15487963-2', email: 'r.thompson@estancias.com', role: 'Presidente' },
                { id: 'u2', name: 'Sofía Martínez', cuit: '27-32158964-1', email: 's.martinez@estancias.com', role: 'Director Titular' },
                { id: 'u3', name: 'Hernán Caselli', cuit: '20-22458963-5', email: 'h.caselli@estancias.com', role: 'Apoderado' },
            ];

            setClient(mockClient);
            setDocuments(mockDocuments);
            setRegisteredUsers(mockUsers);
            setHasPEP(true);

            const initialStatuses = {};
            mockDocuments.forEach(doc => {
                initialStatuses[doc.id] = doc.status;
            });
            setDocumentStatuses(initialStatuses);
        } catch (error) {
            toast.error('Error al cargar datos del cliente');
        }
    };

    const handleDocumentStatusChange = (docId, status) => {
        if (status === DOCUMENT_STATUS.REJECTED && !rejectionComments[docId]) {
            const doc = documents.find(d => d.id === docId);
            openRejectModal('document', doc);
            return;
        }

        setDocumentStatuses(prev => ({
            ...prev,
            [docId]: status,
        }));

        if (status === DOCUMENT_STATUS.APPROVED) {
            toast.success('Documento marcado como aprobado');
        }
    };

    const toggleSigner = (userId) => {
        setSelectedSigners(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const addExternalSigner = () => {
        setExternalSigners(prev => [
            ...prev,
            { id: `ext-${Date.now()}`, name: '', cuit: '', email: '' },
        ]);
    };

    const updateExternalSigner = (id, field, value) => {
        setExternalSigners(prev =>
            prev.map(signer =>
                signer.id === id ? { ...signer, [field]: value } : signer
            )
        );
    };

    const removeExternalSigner = (id) => {
        setExternalSigners(prev => prev.filter(signer => signer.id !== id));
    };

    const canAcceptDocumentation = () => {
        const requiredDocs = documents.filter(doc => doc.required);
        const allRequiredApproved = requiredDocs.every(
            doc => documentStatuses[doc.id] === DOCUMENT_STATUS.APPROVED
        );
        const hasSigners = selectedSigners.length > 0 || externalSigners.some(s => s.name && s.cuit && s.email);
        const pepCondition = !hasPEP || pepApproved;

        return allRequiredApproved && hasSigners && pepCondition;
    };

    const handleAcceptDocumentation = async () => {
        if (!canAcceptDocumentation()) return;

        setIsSubmitting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            toast.success('Documentación aceptada correctamente.');
            navigate('/clients');
        } catch (error) {
            toast.error('Error al procesar la aceptación');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = () => {
        if (!rejectComment.trim()) {
            toast.error('Debe ingresar un comentario para el rechazo');
            return;
        }

        if (rejectType === 'document') {
            setDocumentStatuses(prev => ({ ...prev, [selectedDoc.id]: DOCUMENT_STATUS.REJECTED }));
            setRejectionComments(prev => ({ ...prev, [selectedDoc.id]: rejectComment }));
            toast.warning('Documento rechazado');
        } else {
            toast.error('Solicitud rechazada globalmente');
            navigate('/clients');
        }

        setShowRejectModal(false);
        setRejectComment('');
    };

    const openRejectModal = (type, doc = null) => {
        setRejectType(type);
        setSelectedDoc(doc);
        setShowRejectModal(true);
    };

    const getDayCount = (dateStr) => {
        // Calculo simple de días
        return 3;
    };

    if (!client) return (
        <div className="flex h-96 items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
    );

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
                            <Building2 size={36} />
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
                                CUIT: <span className="text-slate-700 dark:text-slate-300 tracking-wider font-mono">{client.cuit}</span> • <span className="uppercase text-emerald-600">{client.entityType}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openRejectModal('client')}
                        className="btn h-12 px-6 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-900/30 text-red-600 font-black hover:bg-red-50 dark:hover:bg-red-950/20 transition-all active:scale-95"
                    >
                        <X size={18} className="mr-2 inline" />
                        Rechazar
                    </button>
                    <button
                        onClick={handleAcceptDocumentation}
                        disabled={!canAcceptDocumentation() || isSubmitting}
                        className="btn h-12 px-8 rounded-2xl bg-emerald-600 text-white font-black hover:bg-emerald-700 shadow-xl shadow-emerald-200/50 dark:shadow-none disabled:opacity-30 disabled:grayscale transition-all active:scale-95 flex items-center"
                    >
                        {isSubmitting ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></span>
                        ) : (
                            <CheckCircle size={20} className="mr-2" />
                        )}
                        Aceptar Documentación
                    </button>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                {[
                    { label: 'Ingreso', value: client.submittedDate, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Riesgo', value: client.riskLevel, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Espera', value: `${getDayCount()} Días`, icon: Info, color: 'text-purple-500', bg: 'bg-purple-50' },
                    { label: 'Documentos', value: `${documents.length} Archivos`, icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((stat, i) => (
                    <div key={i} className="card p-5 border-none shadow-sm bg-white dark:bg-slate-900 flex items-center gap-4 rounded-[1.5rem] group hover:shadow-md transition-shadow">
                        <div className={`p-3 rounded-2xl ${stat.bg} dark:bg-opacity-10 ${stat.color} group-hover:scale-110 transition-transform`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                            <p className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter">
                                {stat.value}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs Navigation */}
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="w-full lg:w-72 flex-shrink-0">
                    <div className="sticky top-24 space-y-2">
                        {[
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

                {/* Tab Content Area */}
                <div className="flex-1 min-w-0">
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
                                                    documentStatuses[doc.id] === 'rechazado' ? 'bg-red-600 text-white' :
                                                        'bg-slate-900 text-white'
                                                    }`}>
                                                    <FileText size={24} />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                                            {doc.name}
                                                        </h4>
                                                        {doc.required && (
                                                            <span className="bg-red-50 text-red-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase border border-red-100">Requerido</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Actualizado el {doc.uploadDate}</p>

                                                    {documentStatuses[doc.id] === 'rechazado' && rejectionComments[doc.id] && (
                                                        <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20 rounded-xl border-l-4 border-red-400">
                                                            <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                                                                Motivo del rechazo
                                                            </p>
                                                            <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">"{rejectionComments[doc.id]}"</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 self-end md:self-center bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <button className="h-10 px-4 rounded-xl text-emerald-600 text-xs font-black hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all flex items-center gap-2">
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
                                                    onClick={() => openRejectModal('document', doc)}
                                                    className={`h-10 w-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${documentStatuses[doc.id] === 'rechazado'
                                                        ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                                                        : 'text-slate-400 hover:text-red-600 hover:bg-white'
                                                        }`}
                                                >
                                                    <X size={20} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                            className={`flex items-center gap-5 p-6 cursor-pointer transition-all ${selectedSigners.includes(user.id) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                                                }`}
                                        >
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSigners.includes(user.id)}
                                                    onChange={() => toggleSigner(user.id)}
                                                    className="peer hidden"
                                                />
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
                                        <button
                                            onClick={() => removeExternalSigner(signer.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-xl transition-all"
                                        >
                                            <X size={24} strokeWidth={3} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="label text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Nombre y Apellido</label>
                                            <input
                                                type="text"
                                                value={signer.name}
                                                onChange={(e) => updateExternalSigner(signer.id, 'name', e.target.value)}
                                                className="input h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-5 text-lg font-bold focus:ring-4 focus:ring-emerald-100"
                                                placeholder="Ej: Juan Pérez"
                                            />
                                        </div>
                                        <div>
                                            <label className="label text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">CUIT / CUIL</label>
                                            <input
                                                type="text"
                                                value={signer.cuit}
                                                onChange={(e) => updateExternalSigner(signer.id, 'cuit', e.target.value)}
                                                className="input h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-5 text-lg font-bold focus:ring-4 focus:ring-emerald-100"
                                                placeholder="20-XXXXXXXX-X"
                                            />
                                        </div>
                                        <div>
                                            <label className="label text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Correo Electrónico</label>
                                            <input
                                                type="email"
                                                value={signer.email}
                                                onChange={(e) => updateExternalSigner(signer.id, 'email', e.target.value)}
                                                className="input h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none px-5 text-lg font-bold focus:ring-4 focus:ring-emerald-100"
                                                placeholder="ejemplo@deCampo.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'pep' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                            <div className="px-2 font-['Lato']">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                    <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                    Perfiles PEP
                                </h2>
                                <p className="text-sm text-slate-500 font-bold mt-1">Análisis de Personas Expuestas Políticamente y riesgos asociados.</p>
                            </div>

                            <div className="card border-none shadow-sm dark:bg-slate-900 rounded-[3rem] p-10 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full -mr-20 -mt-20"></div>

                                <div className="w-24 h-24 rounded-[2rem] bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-200">
                                    <Shield size={48} strokeWidth={2.5} />
                                </div>

                                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic mb-4">Requiere Auditoría</h3>
                                <p className="text-base text-slate-500 font-bold max-w-sm mx-auto mb-10 leading-snug">
                                    Se han detectado vínculos con cargos públicos. El Oficial de Cumplimiento debe validar la procedencia de fondos.
                                </p>

                                <div className="max-w-xl mx-auto space-y-6 text-left">
                                    <div
                                        onClick={() => setPepApproved(!pepApproved)}
                                        className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all active:scale-[0.98] flex items-center gap-6 ${pepApproved
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200'
                                            : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${pepApproved ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                            }`}>
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
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal Estilizado */}
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
                                : 'Esta acción denegará el acceso del cliente de forma permanente. No se podrá revertir sin intervención técnica.'}
                        </p>

                        <div className="mb-8 space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-400 block tracking-widest ml-1">Observaciones del Rechazo</label>
                            <textarea
                                value={rejectComment}
                                onChange={(e) => setRejectComment(e.target.value)}
                                className="input bg-slate-50 dark:bg-slate-800 rounded-2xl min-h-[120px] border-none p-5 text-base font-bold focus:ring-4 focus:ring-red-100 dark:focus:ring-red-950"
                                placeholder="Explica qué error encontraste..."
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="h-14 px-6 rounded-2xl text-slate-400 font-black hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex-1"
                            >
                                CANCELAR
                            </button>
                            <button
                                onClick={handleReject}
                                className="h-14 px-8 rounded-2xl bg-red-600 text-white font-black hover:bg-red-700 shadow-xl shadow-red-200 dark:shadow-none transition-all active:scale-95 flex-1"
                            >
                                CONFIRMAR RECHAZO
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientReview;
