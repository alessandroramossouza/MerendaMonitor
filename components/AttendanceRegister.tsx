import React, { useState, useMemo } from 'react';
import { DailyAttendance, Classroom, SchoolDailyPresence } from '../types-school';
import { ClipboardCheck, Users, Check, X, Calendar, TrendingUp, AlertCircle, Edit2 } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AttendanceRegisterProps {
  schoolId?: string;
}

export const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({ schoolId = '00000000-0000-0000-0000-000000000000' }) => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [attendances, setAttendances] = useState<DailyAttendance[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [editingClassroomId, setEditingClassroomId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    presentCount: 0,
    notes: ''
  });

  React.useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      // Fetch classrooms with student count
      const { data: classData, error: classError } = await supabase
        .from('classrooms')
        .select(`
          *,
          grades(name),
          teachers(name),
          students!inner(count)
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
        isActive: item.is_active,
        totalStudents: item.students?.[0]?.count || 0
      }));

      setClassrooms(formattedClassrooms);

      // Fetch today's attendances
      const { data: attData, error: attError } = await supabase
        .from('daily_attendance')
        .select(`
          *,
          classrooms(name, shift)
        `)
        .eq('date', selectedDate);

      if (attError) throw attError;

      const formattedAttendances: DailyAttendance[] = (attData || []).map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        classroomId: item.classroom_id,
        classroomName: item.classrooms?.name,
        date: item.date,
        shift: item.shift,
        totalStudents: item.total_students,
        presentCount: item.present_count,
        absentCount: item.absent_count,
        registeredByName: item.registered_by_name,
        registeredByRole: item.registered_by_role,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      setAttendances(formattedAttendances);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRegisterAttendance = async (classroom: Classroom) => {
    if (formData.presentCount > (classroom.totalStudents || 0)) {
      alert('O número de presentes não pode ser maior que o total de alunos matriculados!');
      return;
    }

    setLoading(true);
    try {
      const existingAttendance = attendances.find(a => a.classroomId === classroom.id && a.shift === classroom.shift);

      const attendanceData = {
        school_id: schoolId,
        classroom_id: classroom.id,
        date: selectedDate,
        shift: classroom.shift,
        total_students: classroom.totalStudents || 0,
        present_count: formData.presentCount,
        absent_count: (classroom.totalStudents || 0) - formData.presentCount,
        registered_by_name: 'Sistema', // TODO: pegar do usuário logado
        registered_by_role: 'teacher',
        notes: formData.notes || null
      };

      if (existingAttendance) {
        // Update
        const { error } = await supabase
          .from('daily_attendance')
          .update({
            ...attendanceData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAttendance.id);

        if (error) throw error;
        setSuccessMsg(`Presença de ${classroom.name} atualizada!`);
      } else {
        // Insert
        const { error } = await supabase
          .from('daily_attendance')
          .insert([attendanceData]);

        if (error) throw error;
        setSuccessMsg(`Presença de ${classroom.name} registrada!`);
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      setEditingClassroomId(null);
      setFormData({ presentCount: 0, notes: '' });
      fetchData();
    } catch (error: any) {
      console.error('Error saving attendance:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (classroom: Classroom) => {
    const existing = attendances.find(a => a.classroomId === classroom.id && a.shift === classroom.shift);

    if (existing) {
      setFormData({
        presentCount: existing.presentCount,
        notes: existing.notes || ''
      });
    } else {
      setFormData({
        presentCount: classroom.totalStudents || 0,
        notes: ''
      });
    }

    setEditingClassroomId(classroom.id);
  };

  const cancelEdit = () => {
    setEditingClassroomId(null);
    setFormData({ presentCount: 0, notes: '' });
  };

  // Summary stats
  const summary = useMemo(() => {
    const totalPresent = attendances.reduce((acc, a) => acc + a.presentCount, 0);
    const totalEnrolled = attendances.reduce((acc, a) => acc + a.totalStudents, 0);
    const totalAbsent = attendances.reduce((acc, a) => acc + a.absentCount, 0);
    const attendanceRate = totalEnrolled > 0 ? (totalPresent / totalEnrolled) * 100 : 0;
    const classroomsRegistered = attendances.length;
    const classroomsTotal = classrooms.length;

    return {
      totalPresent,
      totalEnrolled,
      totalAbsent,
      attendanceRate,
      classroomsRegistered,
      classroomsTotal,
      allRegistered: classroomsRegistered === classroomsTotal
    };
  }, [attendances, classrooms]);

  const getShiftLabel = (shift: Classroom['shift']) => {
    const labels = {
      morning: 'Manhã',
      afternoon: 'Tarde',
      evening: 'Noite',
      full_time: 'Integral'
    };
    return labels[shift];
  };

  const getAttendanceForClassroom = (classroomId: string, shift: string) => {
    return attendances.find(a => a.classroomId === classroomId && a.shift === shift);
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ClipboardCheck className="text-green-600" />
            Registro de Presença (Chamada)
          </h2>
          <p className="text-gray-500">Registre quantos alunos vieram hoje em cada sala</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border-2 border-green-200 rounded-xl focus:border-green-500 outline-none font-medium"
          />
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
          <Users className="w-10 h-10 mb-2 opacity-80" />
          <p className="text-green-100 text-sm">Alunos Presentes</p>
          <p className="text-4xl font-bold">{summary.totalPresent}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">Total Matriculados</p>
          <p className="text-3xl font-bold text-gray-800">{summary.totalEnrolled}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
          <p className="text-gray-500 text-sm">Ausentes</p>
          <p className="text-3xl font-bold text-red-600">{summary.totalAbsent}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
          <p className="text-gray-500 text-sm">Taxa de Presença</p>
          <p className="text-3xl font-bold text-blue-600">{summary.attendanceRate.toFixed(1)}%</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
          <p className="text-gray-500 text-sm">Salas Registradas</p>
          <p className="text-3xl font-bold text-purple-600">
            {summary.classroomsRegistered} / {summary.classroomsTotal}
          </p>
        </div>
      </div>

      {/* Alert Box */}
      {!summary.allRegistered && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 font-medium">Atenção!</p>
            <p className="text-amber-700 text-sm">
              Ainda faltam {summary.classroomsTotal - summary.classroomsRegistered} salas para registrar presença.
              A merendeira precisa que TODAS as salas registrem presença para calcular a quantidade correta de comida.
            </p>
          </div>
        </div>
      )}

      {summary.allRegistered && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-800 font-medium">Tudo certo!</p>
            <p className="text-green-700 text-sm">
              Todas as salas já registraram presença. A merendeira pode preparar comida para <strong>{summary.totalPresent} alunos</strong>.
            </p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg animate-fade-in">
          ✅ {successMsg}
        </div>
      )}

      {/* Classrooms List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">Salas de Aula - Registro do Dia</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {classrooms.map(classroom => {
            const attendance = getAttendanceForClassroom(classroom.id, classroom.shift);
            const isEditing = editingClassroomId === classroom.id;
            const isRegistered = !!attendance;

            return (
              <div key={classroom.id} className={`p-6 ${isRegistered ? 'bg-green-50' : 'bg-white'} hover:bg-gray-50 transition-colors`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-gray-800">{classroom.name}</h4>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">
                        {classroom.gradeName}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                        {getShiftLabel(classroom.shift)}
                      </span>
                      {isRegistered && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Registrado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Professor: {classroom.teacherName || 'Não atribuído'} |
                      Total de alunos: <strong>{classroom.totalStudents}</strong>
                    </p>

                    {isEditing ? (
                      <div className="mt-4 space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Quantos alunos estão presentes?
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={classroom.totalStudents}
                              value={formData.presentCount}
                              onChange={(e) => setFormData({ ...formData, presentCount: parseInt(e.target.value) || 0 })}
                              className="w-full text-2xl font-bold border-2 border-green-300 rounded-lg p-3 focus:border-green-500 outline-none text-center"
                              autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              Ausentes: {(classroom.totalStudents || 0) - formData.presentCount}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
                            <textarea
                              value={formData.notes}
                              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                              rows={3}
                              placeholder="Ex: Turma em passeio, horário especial..."
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={cancelEdit}
                            disabled={loading}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleRegisterAttendance(classroom)}
                            disabled={loading}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 disabled:bg-gray-400"
                          >
                            <Check className="w-5 h-5" />
                            {loading ? 'Salvando...' : 'Confirmar Presença'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      attendance && (
                        <div className="mt-3 flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-600" />
                            <span className="font-bold text-green-700">{attendance.presentCount} presentes</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <X className="w-5 h-5 text-red-500" />
                            <span className="text-red-600">{attendance.absentCount} ausentes</span>
                          </div>
                          {attendance.notes && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <span>📝 {attendance.notes}</span>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => startEdit(classroom)}
                      className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 ${isRegistered
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                    >
                      {isRegistered ? (
                        <>
                          <Edit2 className="w-5 h-5" />
                          Editar
                        </>
                      ) : (
                        <>
                          <ClipboardCheck className="w-5 h-5" />
                          Registrar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {classrooms.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <ClipboardCheck className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Nenhuma sala cadastrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
