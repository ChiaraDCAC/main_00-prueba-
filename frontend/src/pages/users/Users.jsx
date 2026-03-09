import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../context/authStore';
import { demoEmployeeDirectory } from '../../services/api';
import userService from '../../services/userService';
import { toast } from 'react-toastify';
import { ROLES, getRoleInfo } from '../../config/permissions';
import {
  Lock,
  Plus,
  Users as UsersIcon,
  Search,
  X,
  ChevronDown,
  Check,
  User,
  Shield,
  UserCheck,
  UserX,
  RefreshCw,
  Pencil,
  Building2,
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const nivelLabel = (role) => {
  const map = { admin: 'Perfil Administrador', supervisor: 'Perfil Supervisor', analyst: 'Perfil Analista', auditor: 'Perfil Auditor' };
  return map[role] || `Perfil ${role}`;
};

// ─── Combobox de directorio ──────────────────────────────────────────────────

function EmployeeCombobox({ onSelect }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const filtered = demoEmployeeDirectory.filter((emp) => {
    const q = query.toLowerCase();
    return (
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.department.toLowerCase().includes(q) ||
      emp.position.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (emp) => {
    setSelected(emp);
    setQuery(`${emp.firstName} ${emp.lastName}`);
    setOpen(false);
    onSelect(emp);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
    onSelect(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <label className="label">
        Buscar en directorio de empleados
        <span className="ml-1 text-xs text-gray-400 font-normal">(opcional)</span>
      </label>
      <div className="relative flex items-center">
        <Search size={16} className="absolute left-3 text-gray-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          className="input pl-9 pr-9"
          placeholder="Buscar por nombre, email o área..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setSelected(null); }}
          onFocus={() => setOpen(true)}
        />
        {query ? (
          <button type="button" onClick={handleClear} className="absolute right-3 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        ) : (
          <ChevronDown size={16} className="absolute right-3 text-gray-400 pointer-events-none" />
        )}
      </div>
      {open && (
        <div ref={dropdownRef} className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No se encontró ningún empleado.<br />
              <span className="text-xs text-gray-400">Podés completar los datos manualmente.</span>
            </div>
          ) : (
            filtered.map((emp) => (
              <button key={emp.id} type="button" onClick={() => handleSelect(emp)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors hover:bg-[#3879a3]/5 cursor-pointer ${selected?.id === emp.id ? 'bg-[#3879a3]/5' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#3879a3] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{emp.position} · {emp.department}</p>
                  </div>
                </div>
                {selected?.id === emp.id && <Check size={16} className="text-[#3879a3] shrink-0" />}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Modal alta de usuario ───────────────────────────────────────────────────

function NuevoUsuarioModal({ onClose, onCreated, existingUsers }) {
  const existingEmails = existingUsers.map((u) => u.email);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', cargo: '', role: 'analyst', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleEmployeeSelect = (emp) => {
    if (!emp) { setForm((f) => ({ ...f, firstName: '', lastName: '', email: '', cargo: '' })); return; }
    setForm((f) => ({ ...f, firstName: emp.firstName, lastName: emp.lastName, email: emp.email, cargo: emp.position || '' }));
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Requerido';
    if (!form.lastName.trim()) e.lastName = 'Requerido';
    if (!form.email.trim()) e.email = 'Requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
    else if (existingEmails.includes(form.email)) e.email = 'Este email ya tiene acceso al sistema';
    if (!form.password) e.password = 'Requerida';
    else if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Las contraseñas no coinciden';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    try {
      const res = await userService.createUser({ firstName: form.firstName, lastName: form.lastName, email: form.email, role: form.role, cargo: form.cargo, password: form.password });
      toast.success('Usuario creado exitosamente');
      onCreated(res.data.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error al crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <label className="label">{label}</label>
      <input type={type} className={`input ${errors[key] ? 'border-red-500' : ''}`} placeholder={placeholder}
        value={form[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#3879a3] rounded-lg flex items-center justify-center">
              <Plus size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Nuevo usuario</h2>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="p-4 bg-[#3879a3]/5 border border-[#3879a3]/20 rounded-xl">
            <EmployeeCombobox onSelect={handleEmployeeSelect} />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Datos del usuario</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('firstName', 'Nombre *', 'text', 'Ej: Juan')}
            {field('lastName', 'Apellido *', 'text', 'Ej: García')}
          </div>

          {field('email', 'Email *', 'email', 'usuario@empresa.com')}

          <div className="grid grid-cols-2 gap-4">
            {field('cargo', 'Cargo', 'text', 'Ej: Dueño, Gerente...')}
            <div>
              <label className="label">Nivel de acceso *</label>
              <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{nivelLabel(r.value)}</option>)}
              </select>
              <p className="mt-1 text-xs text-muted-foreground">{getRoleInfo(form.role)?.description || ''}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">Contraseña de acceso</span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {field('password', 'Contraseña *', 'password', 'Mín. 8 caracteres')}
            {field('confirmPassword', 'Confirmar *', 'password', 'Repetir contraseña')}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
              {loading ? <><RefreshCw size={16} className="animate-spin" /> Creando...</> : <><Plus size={16} /> Crear usuario</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal editar usuario ────────────────────────────────────────────────────

function EditarUsuarioModal({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({ cargo: user.cargo || '', role: user.role || 'analyst', isActive: user.isActive });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await userService.updateUser(user.id, { cargo: form.cargo, role: form.role, isActive: form.isActive });
      toast.success('Usuario actualizado');
      onUpdated(user.id, form);
    } catch {
      toast.error('Error al actualizar el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-foreground">Editar usuario</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.lastName}, {user.firstName}</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Cargo</label>
            <input type="text" className="input" placeholder="Ej: Dueño, Gerente..."
              value={form.cargo} onChange={(e) => setForm(f => ({ ...f, cargo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nivel de acceso</label>
            <select className="input" value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{nivelLabel(r.value)}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-medium text-foreground">Estado del usuario</p>
              <p className="text-xs text-muted-foreground">{form.isActive ? 'Activo en el sistema' : 'Inactivo — sin acceso'}</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
              className={`w-12 h-6 rounded-full transition-all relative ${form.isActive ? 'bg-[#3879a3]' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isActive ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex items-center gap-2">
              {loading ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Fila de usuario ─────────────────────────────────────────────────────────

function UserRow({ user, onEdit }) {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0">
      {/* ID */}
      <div className="col-span-3">
        <span className="text-[11px] font-mono text-muted-foreground break-all leading-relaxed">{user.id}</span>
      </div>

      {/* Nombre */}
      <div className="col-span-3 flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${user.isActive ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60'}`}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${user.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
            {user.lastName}, {user.firstName}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {/* Cargo */}
      <div className="col-span-2">
        <span className="text-sm text-foreground">{user.cargo || 'Sin definir'}</span>
      </div>

      {/* Nivel */}
      <div className="col-span-3">
        <span className="text-sm text-foreground">{nivelLabel(user.role)}</span>
      </div>

      {/* Acción */}
      <div className="col-span-1 flex justify-end">
        <button type="button" onClick={() => onEdit(user)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#3879a3] hover:bg-[#3879a3]/10 rounded-lg transition-colors">
          <Pencil size={13} />
          Editar
        </button>
      </div>
    </div>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

const Users = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userService.getUsers();
      setUsers(res.data.data || []);
    } catch {
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleCreated = (newUser) => { setUsers((prev) => [newUser, ...prev]); setShowModal(false); };

  const handleUpdated = (id, data) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...data } : u));
    setEditingUser(null);
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      (u.cargo || '').toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Lock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Acceso Restringido</h1>
        <p className="text-muted-foreground">Solo el Oficial de Cumplimiento puede acceder a esta sección</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#3879a3]/10 flex items-center justify-center">
            <UsersIcon className="w-5 h-5 text-[#3879a3]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Usuarios</h1>
            <p className="text-muted-foreground text-sm">Gestión de accesos al sistema de compliance</p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3879a3] hover:bg-[#2d6a8a] text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:shadow-[#3879a3]/20"
          onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" className="input pl-9" placeholder="Buscar por nombre, email o cargo..."
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-52" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
            <option value="">Todos los niveles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{nivelLabel(r.value)}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {/* Cabecera */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
          <div className="col-span-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</div>
          <div className="col-span-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nombre</div>
          <div className="col-span-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cargo</div>
          <div className="col-span-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nivel</div>
          <div className="col-span-1" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-[#3879a3]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-muted-foreground">No se encontraron usuarios</p>
          </div>
        ) : (
          filtered.map((u) => <UserRow key={u.id} user={u} onEdit={setEditingUser} />)
        )}

        {!loading && users.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
            <p className="text-xs text-muted-foreground">
              {filtered.length} de {users.length} usuario{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Modales */}
      {showModal && <NuevoUsuarioModal onClose={() => setShowModal(false)} onCreated={handleCreated} existingUsers={users} />}
      {editingUser && <EditarUsuarioModal user={editingUser} onClose={() => setEditingUser(null)} onUpdated={handleUpdated} />}
    </div>
  );
};

export default Users;
