import React, { useState, useMemo } from 'react';

import { DailyAttendance, Classroom } from '../types-school';
import { Users, RefreshCw, TrendingUp, AlertCircle, Check, Clock, ChefHat } from 'lucide-react';
import { supabase } from '../services/supabase';

interface AttendanceDashboardProps {
  onStudentCountUpdate?: (count: number) => void;
}

export const AttendanceDashboard: React.FC<AttendanceDashboardProps> = ({ onStudentCountUpdate }) => {
  const [attendances, setAttendances] = useState<DailyAttendance[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  React.useEffect(() => {
    fetchTodayAttendance();
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchTodayAttendance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTodayAttendance = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch all classrooms
      const { data: classData, error: classError } = await supabase
        .from('classrooms')
        .select(`
          *,
          grades(name),
          students!inner(count)
        `)
        .eq('is_active', true);

      if (classError) throw classError;

      const formattedClassrooms: Classroom[] = (classData || []).map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        gradeId: item.grade_id,
        gradeName: item.grades?.name,
        name: item.name,
        capacity: item.capacity,
        shift: item.shift,
        isActive: item.is_active,
        totalStudents: item.students?.[0]?.count || 0
      }));

      setClassrooms(formattedClassrooms);

      // Fetch today's attendance
      const { data: attData, error: attError } = await supabase
        .from('daily_attendance')
        .select(`
          *,
          classrooms(name, shift, grades(name))
        `)
        .eq('date', today);

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
        notes: item.notes,
        updatedAt: item.updated_at
      }));

      setAttendances(formattedAttendances);
      setLastUpdate(new Date());

      // Notify parent component
      const totalPresent = formattedAttendances.reduce((acc, a) => acc + a.presentCount, 0);
      if (onStudentCountUpdate) {
        onStudentCountUpdate(totalPresent);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalPresent = attendances.reduce((acc, a) => acc + a.presentCount, 0);
    const totalEnrolled = classrooms.reduce((acc, c) => acc + (c.totalStudents || 0), 0);
    const totalAbsent = attendances.reduce((acc, a) => acc + a.absentCount, 0);
    const attendanceRate = totalEnrolled > 0 ? (totalPresent / totalEnrolled) * 100 : 0;

    const morning = attendances.filter(a => a.shift === 'morning').reduce((acc, a) => acc + a.presentCount, 0);
    const afternoon = attendances.filter(a => a.shift === 'afternoon').reduce((acc, a) => acc + a.presentCount, 0);
    const evening = attendances.filter(a => a.shift === 'evening').reduce((acc, a) => acc + a.presentCount, 0);
    const fullTime = attendances.filter(a => a.shift === 'full_time').reduce((acc, a) => acc + a.presentCount, 0);

    const registeredRooms = attendances.length;
    const totalRooms = classrooms.length;
    const allRegistered = registeredRooms === totalRooms && totalRooms > 0;

    return {
      totalPresent,
      totalEnrolled,
      totalAbsent,
      attendanceRate,
      morning,
      afternoon,
      evening,
      fullTime,
      registeredRooms,
      totalRooms,
      allRegistered
    };
  }, [attendances, classrooms]);

  const getShiftLabel = (shift: string) => {
    const labels = {
      morning: 'Manhã',
      afternoon: 'Tarde',
      evening: 'Noite',
      full_time: 'Integral'
    };
    return labels[shift] || shift;
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ChefHat className="text-orange-600" />
            Presença do Dia - Cozinha
          </h2>
          <p className="text-gray-500">Veja quantos alunos estão na escola HOJE em tempo real</p>
        </div>
        <button
          onClick={fetchTodayAttendance}
          disabled={loading}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors shadow-lg font-bold disabled:bg-gray-400"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </header>

      {/* MEGA COUNTER - O mais importante para a merendeira */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl shadow-2xl p-12 text-white text-center">
        <div className="flex items-center justify-center mb-4">
          <Users className="w-20 h-20 opacity-80" />
        </div>
        <p className="text-2xl font-medium mb-2 text-orange-100">ALUNOS PRESENTES HOJE</p>
        <p className="text-9xl font-black mb-4" style={{ lineHeight: '1' }}>{stats.totalPresent}</p>
        <p className="text-xl text-orange-100">
          De {stats.totalEnrolled} matriculados ({stats.attendanceRate.toFixed(1)}% de presença)
        </p>

        <div className="mt-6 flex justify-center gap-4">
          {stats.morning > 0 && (
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm text-orange-100">Manhã</p>
              <p className="text-2xl font-bold">{stats.morning}</p>
            </div>
          )}
          {stats.afternoon > 0 && (
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm text-orange-100">Tarde</p>
              <p className="text-2xl font-bold">{stats.afternoon}</p>
            </div>
          )}
          {stats.evening > 0 && (
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm text-orange-100">Noite</p>
              <p className="text-2xl font-bold">{stats.evening}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {!stats.allRegistered ? (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <p className="text-red-800 font-bold text-lg">⚠️ Atenção! Faltam salas registrarem presença</p>
            <p className="text-red-700 mt-1">
              Apenas <strong>{stats.registeredRooms} de {stats.totalRooms}</strong> salas registraram presença.
              O número acima pode estar INCOMPLETO. Aguarde todas as salas registrarem ou contate os professores.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 flex items-start gap-4">
          <Check className="w-8 h-8 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <p className="text-green-800 font-bold text-lg">✅ Todas as salas já registraram!</p>
            <p className="text-green-700 mt-1">
              O número de <strong>{stats.totalPresent} alunos</strong> está confirmado e você pode preparar a merenda com segurança.
            </p>
          </div>
        </div>
      )}

      {/* Last Update */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Clock className="w-4 h-4" />
        <span>Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}</span>
      </div>

      {/* Breakdown by Classroom */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-orange-50 p-4 border-b border-orange-100">
          <h3 className="text-lg font-bold text-gray-800">Detalhamento por Sala</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {attendances.map(att => (
            <div key={att.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-800">{att.classroomName}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {getShiftLabel(att.shift)}
                  </span>
                </div>
                {att.notes && (
                  <p className="text-sm text-gray-500">📝 {att.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Presentes</p>
                  <p className="text-2xl font-bold text-green-600">{att.presentCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Ausentes</p>
                  <p className="text-lg font-medium text-red-500">{att.absentCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Taxa</p>
                  <p className="text-lg font-bold text-blue-600">
                    {att.totalStudents > 0 ? ((att.presentCount / att.totalStudents) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>
          ))}

          {attendances.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhuma presença registrada hoje</p>
              <p className="text-sm mt-2">Aguarde os professores fazerem a chamada</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box for Kitchen Staff */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
        <ChefHat className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-orange-800 font-medium">💡 Dica para a Cozinha</p>
          <p className="text-orange-700 text-sm">
            Use o número VERDE acima ({stats.totalPresent} alunos) na calculadora de merenda.
            Este é o número REAL de alunos que estão na escola hoje.
            Sempre atualize antes de começar a cozinhar!
          </p>
        </div>
      </div>
    </div>
  );
};
