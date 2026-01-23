import React, { useState } from 'react';
import { Staff } from '../types-school';
import { Briefcase, Plus, Edit2, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '../services/supabase';

interface StaffManagerProps {
  schoolId?: string;
}

export const StaffManager: React.FC<StaffManagerProps> = ({ schoolId = '00000000-0000-0000-0000-000000000000' }) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    role: 'coordinator' as Staff['role'],
    cpf: '',
    enrollmentNumber: '',
    address: '',
    phone: '',
    email: '',
    hireDate: '',
    isActive: true
  });

  React.useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name');

      if (error) throw error;

      const formatted: Staff[] = (data || []).map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        name: item.name,
        role: item.role,
        cpf: item.cpf,
        enrollmentNumber: item.enrollment_number,
        address: item.address,
        phone: item.phone,
        email: item.email,
        hireDate: item.hire_date,
        isActive: item.is_active,
        createdAt: item.created_at
      }));

      setStaff(formatted);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const staffData = {
        school_id: schoolId,
        name: formData.name,
        role: formData.role,
        cpf: formData.cpf || null,
        enrollment_number: formData.enrollmentNumber || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        hire_date: formData.hireDate || null,
        is_active: formData.isActive
      };

      if (editingId) {
        const { error } = await supabase.from('staff').update(staffData).eq('id', editingId);
        if (error) throw error;
        setSuccessMsg('Funcionário atualizado!');
      } else {
        const { error } = await supabase.from('staff').insert([staffData]);
        if (error) throw error;
        setSuccessMsg('Funcionário cadastrado!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      fetchStaff();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este funcionário?')) return;
    try {
      await supabase.from('staff').delete().eq('id', id);
      fetchStaff();
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  const startEdit = (item: Staff) => {
    setFormData({
      name: item.name,
      role: item.role,
      cpf: item.cpf || '',
      enrollmentNumber: item.enrollmentNumber || '',
      address: item.address || '',
      phone: item.phone || '',
      email: item.email || '',
      hireDate: item.hireDate || '',
      isActive: item.isActive
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: 'coordinator',
      cpf: '',
      enrollmentNumber: '',
      address: '',
      phone: '',
      email: '',
      hireDate: '',
      isActive: true
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const getRoleLabel = (role: Staff['role']) => {
    const labels = {
      director: 'Diretor(a)',
      coordinator: 'Coordenador(a)',
      supervisor: 'Supervisor(a)'
    };
    return labels[role];
  };

  const getRoleColor = (role: Staff['role']) => {
    const colors = {
      director: 'from-red-500 to-red-600',
      coordinator: 'from-blue-500 to-blue-600',
      supervisor: 'from-green-500 to-green-600'
    };
    return colors[role];
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Briefcase className="text-indigo-600" />
            Gestão da Direção
          </h2>
          <p className="text-gray-500">Diretores, Coordenadores e Supervisores</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" />
          Novo Funcionário
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100">
          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as Staff['role'] })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="director">Diretor(a)</option>
                  <option value="coordinator">Coordenador(a)</option>
                  <option value="supervisor">Supervisor(a)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                <input
                  type="text"
                  value={formData.enrollmentNumber}
                  onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map(member => (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`bg-gradient-to-r ${getRoleColor(member.role)} p-4 text-white`}>
              <h3 className="text-xl font-bold">{member.name}</h3>
              <p className="text-sm opacity-90">{getRoleLabel(member.role)}</p>
            </div>

            <div className="p-4 space-y-2">
              {member.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{member.phone}</span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{member.address}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => startEdit(member)}
                  className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {staff.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Briefcase className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum funcionário cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
};
