import React, { useState, useMemo } from 'react';
import { Student, Classroom } from '../types-school';
import { Users, Plus, Edit2, Trash2, Search, Filter, UserCheck, AlertCircle, Phone, MapPin } from 'lucide-react';
import { supabase } from '../services/supabase';

interface StudentManagerProps {
  schoolId?: string;
}

export const StudentManager: React.FC<StudentManagerProps> = ({ schoolId: initialPropSchoolId = '00000000-0000-0000-0000-000000000000' }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClassroom, setFilterClassroom] = useState('all');
  const [filterStatus, setFilterStatus] = useState('active');

  // State to hold the actual valid school ID
  const [schoolId, setSchoolId] = useState(initialPropSchoolId);

  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    cpf: '',
    registrationNumber: '',
    address: '',
    classroomId: '',
    guardianName: '',
    guardianPhone: '',
    guardianCpf: '',
    guardianRelationship: 'Mãe',
    hasSpecialNeeds: false,
    specialNeedsDescription: '',
    hasFoodRestriction: false,
    foodRestrictionDescription: '',
    bloodType: '',
    enrollmentStatus: 'active' as Student['enrollmentStatus'],
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    // If we have the dummy ID, try to fetch the real one
    if (schoolId === '00000000-0000-0000-0000-000000000000') {
      fetchSchoolId();
    }
    fetchData();
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

  const fetchData = async () => {
    try {
      // Fetch classrooms
      const { data: classData, error: classError } = await supabase
        .from('classrooms')
        .select(`
          *,
          grades(name),
          teachers(name)
        `)
        .eq('is_active', true)
        .order('name');

      if (classError) throw classError;

      const formattedClassrooms: Classroom[] = (classData || []).map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        gradeId: item.grade_id,
        gradeName: item.grades?.name,
        teacherId: item.teacher_id,
        teacherName: item.teachers?.name,
        name: item.name,
        capacity: item.capacity,
        shift: item.shift,
        roomNumber: item.room_number,
        isActive: item.is_active
      }));

      setClassrooms(formattedClassrooms);

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          classrooms(name, shift)
        `)
        .order('name');

      if (studentsError) throw studentsError;

      const formattedStudents: Student[] = (studentsData || []).map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        classroomId: item.classroom_id,
        name: item.name,
        birthDate: item.birth_date,
        cpf: item.cpf,
        registrationNumber: item.registration_number,
        address: item.address,
        guardianName: item.guardian_name,
        guardianPhone: item.guardian_phone,
        guardianCpf: item.guardian_cpf,
        guardianRelationship: item.guardian_relationship,
        hasSpecialNeeds: item.has_special_needs,
        specialNeedsDescription: item.special_needs_description,
        hasFoodRestriction: item.has_food_restriction,
        foodRestrictionDescription: item.food_restriction_description,
        bloodType: item.blood_type,
        enrollmentStatus: item.enrollment_status,
        enrollmentDate: item.enrollment_date,
        photoUrl: item.photo_url,
        createdAt: item.created_at
      }));

      setStudents(formattedStudents);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.guardianName || !formData.guardianPhone) {
      alert('Preencha os campos obrigatórios: Nome do aluno, Nome e Telefone do responsável');
      return;
    }

    // Validation for School ID
    if (schoolId === '00000000-0000-0000-0000-000000000000') {
      alert('Erro: Nenhuma escola encontrada. Por favor, preencha os "Dados da Escola" primeiro.');
      return;
    }

    setLoading(true);
    try {
      const studentData = {
        school_id: schoolId,
        classroom_id: formData.classroomId || null,
        name: formData.name,
        birth_date: formData.birthDate || null,
        cpf: formData.cpf || null,
        registration_number: formData.registrationNumber || null,
        address: formData.address || null,
        guardian_name: formData.guardianName,
        guardian_phone: formData.guardianPhone,
        guardian_cpf: formData.guardianCpf || null,
        guardian_relationship: formData.guardianRelationship,
        has_special_needs: formData.hasSpecialNeeds,
        special_needs_description: formData.specialNeedsDescription || null,
        has_food_restriction: formData.hasFoodRestriction,
        food_restriction_description: formData.foodRestrictionDescription || null,
        blood_type: formData.bloodType || null,
        enrollment_status: formData.enrollmentStatus,
        enrollment_date: formData.enrollmentDate
      };

      if (editingId) {
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessMsg('Aluno atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('students')
          .insert([studentData]);

        if (error) throw error;
        setSuccessMsg('Aluno cadastrado com sucesso!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving student:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este aluno? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Erro ao excluir aluno');
    }
  };

  const startEdit = (student: Student) => {
    setFormData({
      name: student.name,
      birthDate: student.birthDate || '',
      cpf: student.cpf || '',
      registrationNumber: student.registrationNumber || '',
      address: student.address || '',
      classroomId: student.classroomId || '',
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      guardianCpf: student.guardianCpf || '',
      guardianRelationship: student.guardianRelationship || 'Mãe',
      hasSpecialNeeds: student.hasSpecialNeeds,
      specialNeedsDescription: student.specialNeedsDescription || '',
      hasFoodRestriction: student.hasFoodRestriction,
      foodRestrictionDescription: student.foodRestrictionDescription || '',
      bloodType: student.bloodType || '',
      enrollmentStatus: student.enrollmentStatus,
      enrollmentDate: student.enrollmentDate || new Date().toISOString().split('T')[0]
    });
    setEditingId(student.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      birthDate: '',
      cpf: '',
      registrationNumber: '',
      address: '',
      classroomId: '',
      guardianName: '',
      guardianPhone: '',
      guardianCpf: '',
      guardianRelationship: 'Mãe',
      hasSpecialNeeds: false,
      specialNeedsDescription: '',
      hasFoodRestriction: false,
      foodRestrictionDescription: '',
      bloodType: '',
      enrollmentStatus: 'active',
      enrollmentDate: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.guardianName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClassroom = filterClassroom === 'all' || student.classroomId === filterClassroom;
      const matchesStatus = filterStatus === 'all' || student.enrollmentStatus === filterStatus;

      return matchesSearch && matchesClassroom && matchesStatus;
    });
  }, [students, searchTerm, filterClassroom, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: students.length,
      active: students.filter(s => s.enrollmentStatus === 'active').length,
      withRestrictions: students.filter(s => s.hasFoodRestriction || s.hasSpecialNeeds).length,
      noClassroom: students.filter(s => !s.classroomId && s.enrollmentStatus === 'active').length
    };
  }, [students]);

  const getStatusColor = (status: Student['enrollmentStatus']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'transferred': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'dropped': return 'bg-red-100 text-red-800 border-red-200';
      case 'graduated': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Student['enrollmentStatus']) => {
    const labels = {
      active: 'Ativo',
      transferred: 'Transferido',
      dropped: 'Desistente',
      graduated: 'Formado'
    };
    return labels[status];
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="text-blue-600" />
            Gestão de Alunos
          </h2>
          <p className="text-gray-500">Cadastro completo de estudantes</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" />
          Novo Aluno
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <p className="text-sm text-gray-500">Total de Alunos</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
          <p className="text-sm text-gray-500">Alunos Ativos</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-amber-100">
          <p className="text-sm text-gray-500">Com Restrições</p>
          <p className="text-3xl font-bold text-amber-600">{stats.withRestrictions}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
          <p className="text-sm text-gray-500">Sem Sala</p>
          <p className="text-3xl font-bold text-red-600">{stats.noClassroom}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome do aluno ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <select
            value={filterClassroom}
            onChange={(e) => setFilterClassroom(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todas as Salas</option>
            {classrooms.map(classroom => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name} - {classroom.gradeName}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Todos os Status</option>
            <option value="active">Ativos</option>
            <option value="transferred">Transferidos</option>
            <option value="dropped">Desistentes</option>
            <option value="graduated">Formados</option>
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" onClick={() => !loading && resetForm()}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white sticky top-0">
              <h3 className="text-2xl font-bold flex items-center gap-2">
                <Users className="w-7 h-7" />
                {editingId ? 'Editar Aluno' : 'Novo Aluno'}
              </h3>
            </div>

            {successMsg && (
              <div className="mx-6 mt-6 bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
                ✅ {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Dados do Aluno */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                  Dados do Aluno
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                    <input
                      type="text"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matrícula</label>
                    <input
                      type="text"
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sala/Turma</label>
                    <select
                      value={formData.classroomId}
                      onChange={(e) => setFormData({ ...formData, classroomId: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Nenhuma (não alocado)</option>
                      {classrooms.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>
                          {classroom.name} - {classroom.gradeName} ({classroom.shift === 'morning' ? 'Manhã' : classroom.shift === 'afternoon' ? 'Tarde' : 'Noite'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Sanguíneo</label>
                    <select
                      value={formData.bloodType}
                      onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="">Não informado</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dados do Responsável */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  Dados do Responsável
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Responsável *</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
                    <input
                      type="tel"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="(11) 98765-4321"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF do Responsável</label>
                    <input
                      type="text"
                      value={formData.guardianCpf}
                      onChange={(e) => setFormData({ ...formData, guardianCpf: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parentesco</label>
                    <select
                      value={formData.guardianRelationship}
                      onChange={(e) => setFormData({ ...formData, guardianRelationship: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="Mãe">Mãe</option>
                      <option value="Pai">Pai</option>
                      <option value="Avó">Avó</option>
                      <option value="Avô">Avô</option>
                      <option value="Tia">Tia</option>
                      <option value="Tio">Tio</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Informações Especiais */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Necessidades Especiais e Restrições
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasSpecialNeeds}
                        onChange={(e) => setFormData({ ...formData, hasSpecialNeeds: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-700">Possui Necessidades Especiais</span>
                    </label>
                    {formData.hasSpecialNeeds && (
                      <textarea
                        value={formData.specialNeedsDescription}
                        onChange={(e) => setFormData({ ...formData, specialNeedsDescription: e.target.value })}
                        className="w-full mt-2 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={2}
                        placeholder="Descreva as necessidades especiais..."
                      />
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.hasFoodRestriction}
                        onChange={(e) => setFormData({ ...formData, hasFoodRestriction: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-700">Possui Restrição Alimentar</span>
                    </label>
                    {formData.hasFoodRestriction && (
                      <textarea
                        value={formData.foodRestrictionDescription}
                        onChange={(e) => setFormData({ ...formData, foodRestrictionDescription: e.target.value })}
                        className="w-full mt-2 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        rows={2}
                        placeholder="Descreva as restrições alimentares (alergias, intolerâncias, etc)..."
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Status e Matrícula */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-4">Status de Matrícula</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.enrollmentStatus}
                      onChange={(e) => setFormData({ ...formData, enrollmentStatus: e.target.value as Student['enrollmentStatus'] })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="active">Ativo</option>
                      <option value="transferred">Transferido</option>
                      <option value="dropped">Desistente</option>
                      <option value="graduated">Formado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Matrícula</label>
                    <input
                      type="date"
                      value={formData.enrollmentDate}
                      onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold disabled:bg-gray-400 flex items-center gap-2"
                >
                  {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-50 text-blue-900">
              <tr>
                <th className="p-4 text-left font-semibold">Aluno</th>
                <th className="p-4 text-left font-semibold">Responsável</th>
                <th className="p-4 text-left font-semibold">Sala</th>
                <th className="p-4 text-center font-semibold">Status</th>
                <th className="p-4 text-center font-semibold">Restrições</th>
                <th className="p-4 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map(student => {
                const classroom = classrooms.find(c => c.id === student.classroomId);
                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-800">{student.name}</div>
                        {student.registrationNumber && (
                          <div className="text-sm text-gray-500">Mat: {student.registrationNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="text-sm text-gray-800">{student.guardianName}</div>
                        <div className="text-sm text-gray-500">{student.guardianPhone}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      {classroom ? (
                        <div>
                          <div className="text-sm font-medium text-gray-800">{classroom.name}</div>
                          <div className="text-xs text-gray-500">{classroom.gradeName}</div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Sem sala</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(student.enrollmentStatus)}`}>
                        {getStatusLabel(student.enrollmentStatus)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {(student.hasFoodRestriction || student.hasSpecialNeeds) ? (
                        <div className="flex gap-1 justify-center">
                          {student.hasFoodRestriction && (
                            <span className="text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded border border-amber-200" title="Restrição alimentar">
                              🍽️
                            </span>
                          )}
                          {student.hasSpecialNeeds && (
                            <span className="text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded border border-blue-200" title="Necessidade especial">
                              ♿
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => startEdit(student)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Nenhum aluno encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
