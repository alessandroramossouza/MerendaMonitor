import React, { useState, useMemo } from 'react';
import { SchoolDay } from '../types-extended';
import { Calendar as CalendarIcon, Plus, X, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

interface SchoolCalendarProps {
  onDateSelect?: (date: string) => void;
}

export const SchoolCalendar: React.FC<SchoolCalendarProps> = ({ onDateSelect }) => {
  const [schoolDays, setSchoolDays] = useState<SchoolDay[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    date: '',
    isSchoolDay: false,
    eventName: '',
    expectedAttendanceRate: '1.0',
    notes: ''
  });

  React.useEffect(() => {
    fetchSchoolDays();
  }, [currentMonth]);

  const fetchSchoolDays = async () => {
    try {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('school_calendar')
        .select('*')
        .gte('date', startOfMonth.toISOString().split('T')[0])
        .lte('date', endOfMonth.toISOString().split('T')[0])
        .order('date');

      if (error) throw error;

      const formatted: SchoolDay[] = (data || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        isSchoolDay: item.is_school_day,
        eventName: item.event_name,
        expectedAttendanceRate: item.expected_attendance_rate,
        notes: item.notes
      }));

      setSchoolDays(formatted);
    } catch (error) {
      console.error('Error fetching school days:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) return;

    try {
      const { error } = await supabase
        .from('school_calendar')
        .upsert([{
          date: formData.date,
          is_school_day: formData.isSchoolDay,
          event_name: formData.eventName || null,
          expected_attendance_rate: parseFloat(formData.expectedAttendanceRate),
          notes: formData.notes || null
        }], { onConflict: 'date' });

      if (error) throw error;

      setSuccessMsg('Evento salvo com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);

      setFormData({
        date: '',
        isSchoolDay: false,
        eventName: '',
        expectedAttendanceRate: '1.0',
        notes: ''
      });
      setIsAdding(false);
      fetchSchoolDays();
    } catch (error) {
      console.error('Error saving school day:', error);
      alert('Erro ao salvar evento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este evento do calendário?')) return;

    try {
      const { error } = await supabase
        .from('school_calendar')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSchoolDays();
    } catch (error) {
      console.error('Error deleting school day:', error);
      alert('Erro ao excluir evento');
    }
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: Array<{ date: number | null; fullDate: string | null; event?: SchoolDay }> = [];

    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, fullDate: null });
    }

    // Month days
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const event = schoolDays.find(sd => sd.date === fullDate);
      days.push({ date: day, fullDate, event });
    }

    return days;
  }, [currentMonth, schoolDays]);

  const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const getDayClass = (day: typeof calendarDays[0]) => {
    if (!day.fullDate) return 'bg-gray-50 cursor-default';

    const dayOfWeek = new Date(day.fullDate + 'T12:00:00').getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (day.event) {
      if (!day.event.isSchoolDay) {
        return 'bg-red-100 border-red-300 cursor-pointer hover:bg-red-200';
      }
      if (day.event.expectedAttendanceRate < 1) {
        return 'bg-yellow-100 border-yellow-300 cursor-pointer hover:bg-yellow-200';
      }
      return 'bg-green-100 border-green-300 cursor-pointer hover:bg-green-200';
    }

    if (isWeekend) {
      return 'bg-gray-100 border-gray-200 cursor-pointer hover:bg-gray-200';
    }

    return 'bg-white border-gray-200 cursor-pointer hover:bg-blue-50';
  };

  // Statistics
  const stats = useMemo(() => {
    const totalDaysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const schoolDaysCount = schoolDays.filter(sd => sd.isSchoolDay).length;
    const nonSchoolDaysCount = schoolDays.filter(sd => !sd.isSchoolDay).length;

    return {
      totalDaysInMonth,
      schoolDaysCount,
      nonSchoolDaysCount,
      pendingDays: totalDaysInMonth - schoolDays.length
    };
  }, [schoolDays, currentMonth]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <CalendarIcon className="text-blue-600" />
            Calendário Escolar
          </h2>
          <p className="text-gray-500">Gerencie feriados, recessos e dias letivos</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" />
          Adicionar Evento
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Dias Letivos</p>
          <p className="text-3xl font-bold text-green-600">{stats.schoolDaysCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Feriados/Recessos</p>
          <p className="text-3xl font-bold text-red-600">{stats.nonSchoolDaysCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total de Dias</p>
          <p className="text-3xl font-bold text-blue-600">{stats.totalDaysInMonth}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Sem Marcação</p>
          <p className="text-3xl font-bold text-gray-400">{stats.pendingDays}</p>
        </div>
      </div>

      {/* Form Modal */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Novo Evento no Calendário
          </h3>

          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={formData.isSchoolDay ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, isSchoolDay: e.target.value === 'yes' })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="yes">Dia Letivo</option>
                  <option value="no">Feriado/Recesso</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Evento</label>
                <input
                  type="text"
                  value={formData.eventName}
                  onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ex: Feriado Nacional, Recesso Escolar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa de Presença Esperada</label>
                <select
                  value={formData.expectedAttendanceRate}
                  onChange={(e) => setFormData({ ...formData, expectedAttendanceRate: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="1.0">100% - Normal</option>
                  <option value="0.9">90% - Ligeira Redução</option>
                  <option value="0.8">80% - Redução Moderada</option>
                  <option value="0.7">70% - Redução Alta</option>
                  <option value="0.5">50% - Evento Especial</option>
                  <option value="0.0">0% - Sem Aula</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={2}
                  placeholder="Informações adicionais..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-medium"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={goToPreviousMonth}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            ← Anterior
          </button>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-800 capitalize">{monthName}</h3>
            <button
              onClick={goToToday}
              className="text-sm text-blue-600 hover:underline mt-1"
            >
              Ir para Hoje
            </button>
          </div>
          <button
            onClick={goToNextMonth}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
          >
            Próximo →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Week days header */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="text-center font-bold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`min-h-24 p-2 border-2 rounded-lg ${getDayClass(day)}`}
              onClick={() => {
                if (day.fullDate) {
                  setSelectedDate(day.fullDate);
                  if (onDateSelect) onDateSelect(day.fullDate);
                }
              }}
            >
              {day.date && (
                <>
                  <div className="font-bold text-gray-700">{day.date}</div>
                  {day.event && (
                    <div className="mt-1 text-xs">
                      {day.event.eventName && (
                        <div className="font-medium text-gray-800 truncate">
                          {day.event.eventName}
                        </div>
                      )}
                      {!day.event.isSchoolDay && (
                        <div className="text-red-700 font-bold">Sem Aula</div>
                      )}
                      {day.event.expectedAttendanceRate < 1 && day.event.isSchoolDay && (
                        <div className="text-yellow-700">
                          {Math.round(day.event.expectedAttendanceRate * 100)}% presença
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(day.event!.id);
                        }}
                        className="mt-1 text-red-500 hover:text-red-700"
                        title="Remover"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
            <span>Dia Letivo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded"></div>
            <span>Feriado/Recesso</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-yellow-100 border-2 border-yellow-300 rounded"></div>
            <span>Presença Reduzida</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 border-2 border-gray-200 rounded"></div>
            <span>Fim de Semana</span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-800 font-medium">Dica</p>
          <p className="text-blue-700 text-sm">
            Use o calendário escolar para melhorar as previsões de consumo. 
            O sistema ajustará automaticamente as compras baseado nos dias letivos.
          </p>
        </div>
      </div>
    </div>
  );
};
