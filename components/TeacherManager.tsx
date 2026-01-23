import React, { useState } from 'react';
import { Teacher } from '../types-school';
import { GraduationCap, Plus, Edit2, Trash2, Phone, Mail, MapPin, Calendar } from 'lucide-react';
import { supabase } from '../services/supabase';

interface TeacherManagerProps {
  schoolId?: string;
}

export const TeacherManager: React.FC<TeacherManagerProps> = ({ schoolId: initialPropSchoolId = '00000000-0000-0000-0000-000000000000' }) => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // State to hold the actual valid school ID
  const [schoolId, setSchoolId] = useState(initialPropSchoolId);

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    enrollmentNumber: '',
    address: '',
    phone: '',
    email: '',
    specialization: '',
    hireDate: '',
    isActive: true
  });

  React.useEffect(() => {
    // If we have the dummy ID, try to fetch the real one
    if (schoolId === '00000000-0000-0000-0000-000000000000') {
      fetchSchoolId();
    }
    fetchTeachers();
  }, []);

  const fetchSchoolId = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('id')
        .limit(1)
        .single();

      if (data) {
        setSchoolId(data.id);
      }
    } catch (error) {
      console.error('Error fetching school ID', error);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('name');

      if (error) throw error;

      const formatted: Teacher[] = (data || []).map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        name: item.name,
        cpf: item.cpf,
        enrollmentNumber: item.enrollment_number,
        address: item.address,
        phone: item.phone,
        email: item.email,
        specialization: item.specialization,
        hireDate: item.hire_date,
        isActive: item.is_active,
        photoUrl: item.photo_url,
        createdAt: item.created_at
      }));

      setTeachers(formatted);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Preencha o nome do professor');
      return;
    }

    // Validation for School ID
    if (schoolId === '00000000-0000-0000-0000-000000000000') {
      alert('Erro: Nenhuma escola encontrada. Por favor, preencha os "Dados da Escola" primeiro.');
      return;
    }

    setLoading(true);
    try {
      const teacherData = {
        school_id: schoolId,
        name: formData.name,
        cpf: formData.cpf || null,
        enrollment_number: formData.enrollmentNumber || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        specialization: formData.specialization || null,
        hire_date: formData.hireDate || null,
        is_active: formData.isActive
      };

      if (editingId) {
        const { error } = await supabase
          .from('teachers')
          .update(teacherData)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessMsg('Professor atualizado!');
      } else {
        const { error } = await supabase
          .from('teachers')
          .insert([teacherData]);

        if (error) throw error;
        setSuccessMsg('Professor cadastrado!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      fetchTeachers();
    } catch (error: any) {
      console.error('Error saving teacher:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este professor?')) return;

    try {
      const { error } = await supabase
        .from('teachers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Erro ao excluir professor');
    }
  };

  const startEdit = (teacher: Teacher) => {
    setFormData({
      name: teacher.name,
      cpf: teacher.cpf || '',
      enrollmentNumber: teacher.enrollmentNumber || '',
      address: teacher.address || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      specialization: teacher.specialization || '',
      hireDate: teacher.hireDate || '',
      isActive: teacher.isActive
    });
    setEditingId(teacher.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cpf: '',
      enrollmentNumber: '',
      address: '',
      phone: '',
      email: '',
      specialization: '',
      hireDate: '',
      isActive: true
    });
    setEditingId(null);
    setIsAdding(false);
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <GraduationCap className="text-purple-600" />
            Gestão de Professores
          </h2>
          <p className="text-gray-500">Cadastro completo do corpo docente</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" />
          Novo Professor
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
          <p className="text-sm text-gray-500">Total de Professores</p>
          <p className="text-3xl font-bold text-purple-600">{teachers.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-3xl font-bold text-green-600">
            {teachers.filter(t => t.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Inativos</p>
          <p className="text-3xl font-bold text-gray-600">
            {teachers.filter(t => !t.isActive).length}
          </p>
        </div>
      </div>

      {/* Form Modal */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-purple-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-purple-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            {editingId ? 'Editar Professor' : 'Novo Professor'}
          </h3>

          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="000.000.000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                <input
                  type="text"
                  value={formData.enrollmentNumber}
                  onChange={(e) => setFormData({ ...formData, enrollmentNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialização</label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Ex: Matemática, Polivalente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Contratação</label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Professor Ativo</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow-sm font-medium disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teachers.map(teacher => (
          <div key={teacher.id} className={`bg-white rounded-xl shadow-sm border ${teacher.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'} overflow-hidden`}>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
              <h3 className="text-xl font-bold">{teacher.name}</h3>
              {teacher.specialization && (
                <p className="text-purple-100 text-sm">{teacher.specialization}</p>
              )}
              {!teacher.isActive && (
                <span className="inline-block mt-2 text-xs bg-white bg-opacity-30 px-2 py-1 rounded">
                  Inativo
                </span>
              )}
            </div>

            <div className="p-4 space-y-3">
              {teacher.enrollmentNumber && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Matrícula:</span> {teacher.enrollmentNumber}
                </div>
              )}

              {teacher.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{teacher.phone}</span>
                </div>
              )}

              {teacher.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{teacher.email}</span>
                </div>
              )}

              {teacher.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{teacher.address}</span>
                </div>
              )}

              {teacher.hireDate && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Desde {new Date(teacher.hireDate).toLocaleDateString('pt-BR')}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => startEdit(teacher)}
                  className="flex-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(teacher.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {teachers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <GraduationCap className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum professor cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
};
