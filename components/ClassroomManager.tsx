import React, { useState, useMemo } from 'react';
import { Classroom, Grade, Teacher } from '../types-school';
import { School, Plus, Edit2, Trash2, Users, Clock } from 'lucide-react';
import { supabase } from '../services/supabase';

interface ClassroomManagerProps {
  schoolId?: string;
}

export const ClassroomManager: React.FC<ClassroomManagerProps> = ({ schoolId: initialPropSchoolId = '00000000-0000-0000-0000-000000000000' }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // State to hold the actual valid school ID
  const [schoolId, setSchoolId] = useState(initialPropSchoolId);

  const [formData, setFormData] = useState({
    name: '',
    gradeId: '',
    teacherId: '',
    capacity: 30,
    shift: 'morning' as Classroom['shift'],
    roomNumber: ''
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
      // Fetch grades
      const { data: gradesData, error: gradesError } = await supabase
        .from('grades')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (gradesError) throw gradesError;

      const formattedGrades: Grade[] = (gradesData || []).map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        name: item.name,
        educationLevel: item.education_level,
        orderIndex: item.order_index,
        isActive: item.is_active
      }));

      setGrades(formattedGrades);

      // Fetch teachers
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (teachersError) throw teachersError;

      const formattedTeachers: Teacher[] = (teachersData || []).map((item: any) => ({
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
        photoUrl: item.photo_url
      }));

      setTeachers(formattedTeachers);

      // Fetch classrooms with student count
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select(`
          *,
          grades(name),
          teachers(name),
          students:students(count)
        `)
        .order('name');

      if (classroomsError) throw classroomsError;

      const formattedClassrooms: Classroom[] = (classroomsData || []).map((item: any) => ({
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
        isActive: item.is_active,
        totalStudents: item.students?.[0]?.count || 0
      }));

      setClassrooms(formattedClassrooms);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.gradeId) {
      alert('Preencha os campos obrigatórios: Nome e Série');
      return;
    }

    // Validation for School ID
    if (schoolId === '00000000-0000-0000-0000-000000000000') {
      alert('Erro: Nenhuma escola encontrada. Por favor, preencha os "Dados da Escola" primeiro.');
      return;
    }

    setLoading(true);
    try {
      const classroomData = {
        school_id: schoolId,
        grade_id: formData.gradeId,
        teacher_id: formData.teacherId || null,
        name: formData.name,
        capacity: formData.capacity,
        shift: formData.shift,
        room_number: formData.roomNumber || null,
        is_active: true
      };

      if (editingId) {
        const { error } = await supabase
          .from('classrooms')
          .update(classroomData)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessMsg('Sala atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('classrooms')
          .insert([classroomData]);

        if (error) throw error;
        setSuccessMsg('Sala cadastrada com sucesso!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving classroom:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta sala? Os alunos serão desvinculados.')) return;

    try {
      const { error } = await supabase
        .from('classrooms')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting classroom:', error);
      alert('Erro ao excluir sala');
    }
  };

  const startEdit = (classroom: Classroom) => {
    setFormData({
      name: classroom.name,
      gradeId: classroom.gradeId || '',
      teacherId: classroom.teacherId || '',
      capacity: classroom.capacity,
      shift: classroom.shift,
      roomNumber: classroom.roomNumber || ''
    });
    setEditingId(classroom.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      gradeId: '',
      teacherId: '',
      capacity: 30,
      shift: 'morning',
      roomNumber: ''
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const stats = useMemo(() => {
    const totalStudents = classrooms.reduce((acc, c) => acc + (c.totalStudents || 0), 0);
    const totalCapacity = classrooms.reduce((acc, c) => acc + c.capacity, 0);
    const occupancyRate = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;

    return {
      total: classrooms.length,
      totalStudents,
      totalCapacity,
      occupancyRate,
      morning: classrooms.filter(c => c.shift === 'morning').length,
      afternoon: classrooms.filter(c => c.shift === 'afternoon').length
    };
  }, [classrooms]);

  const getShiftLabel = (shift: Classroom['shift']) => {
    const labels = {
      morning: 'Manhã',
      afternoon: 'Tarde',
      evening: 'Noite',
      full_time: 'Integral'
    };
    return labels[shift];
  };

  const getShiftColor = (shift: Classroom['shift']) => {
    const colors = {
      morning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      afternoon: 'bg-orange-100 text-orange-800 border-orange-200',
      evening: 'bg-purple-100 text-purple-800 border-purple-200',
      full_time: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[shift];
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <School className="text-indigo-600" />
            Gestão de Salas/Turmas
          </h2>
          <p className="text-gray-500">Organize as salas e vincule professores</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" />
          Nova Sala
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
          <p className="text-sm text-gray-500">Total de Salas</p>
          <p className="text-3xl font-bold text-indigo-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <p className="text-sm text-gray-500">Alunos</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
          <p className="text-sm text-gray-500">Ocupação</p>
          <p className="text-3xl font-bold text-green-600">{stats.occupancyRate.toFixed(0)}%</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100">
          <p className="text-sm text-gray-500">Manhã</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.morning}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
          <p className="text-sm text-gray-500">Tarde</p>
          <p className="text-3xl font-bold text-orange-600">{stats.afternoon}</p>
        </div>
      </div>

      {/* Form Modal */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-indigo-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-indigo-800 flex items-center gap-2">
            <School className="w-5 h-5" />
            {editingId ? 'Editar Sala' : 'Nova Sala'}
          </h3>

          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Sala *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Sala 1A, Turma Azul"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Sala</label>
                <input
                  type="text"
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: 101, A1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Série/Ano *</label>
                <select
                  value={formData.gradeId}
                  onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="">Selecione uma série</option>
                  {grades.map(grade => (
                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Professor Responsável</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">Nenhum (não atribuído)</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade</label>
                <input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                <select
                  value={formData.shift}
                  onChange={(e) => setFormData({ ...formData, shift: e.target.value as Classroom['shift'] })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="morning">Manhã</option>
                  <option value="afternoon">Tarde</option>
                  <option value="evening">Noite</option>
                  <option value="full_time">Integral</option>
                </select>
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
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm font-medium disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classrooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classrooms.map(classroom => {
          const occupancy = classroom.capacity > 0
            ? ((classroom.totalStudents || 0) / classroom.capacity) * 100
            : 0;
          const occupancyColor = occupancy >= 90 ? 'bg-red-500' : occupancy >= 70 ? 'bg-yellow-500' : 'bg-green-500';

          return (
            <div key={classroom.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-4 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{classroom.name}</h3>
                    {classroom.roomNumber && (
                      <p className="text-indigo-100 text-sm">Sala {classroom.roomNumber}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white bg-opacity-30`}>
                    {getShiftLabel(classroom.shift)}
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Série:</span>
                  <span className="font-medium text-gray-800">{classroom.gradeName || '-'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Professor:</span>
                  <span className="font-medium text-gray-800 truncate ml-2">{classroom.teacherName || 'Não atribuído'}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Alunos:
                  </span>
                  <span className="font-bold text-lg text-indigo-600">
                    {classroom.totalStudents || 0} / {classroom.capacity}
                  </span>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Ocupação</span>
                    <span>{occupancy.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${occupancyColor} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(occupancy, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => startEdit(classroom)}
                    className="flex-1 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(classroom.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {classrooms.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <School className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhuma sala cadastrada. Clique em "Nova Sala" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
