import React, { useState } from 'react';
import { Grade } from '../types-school';
import { BookOpen, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '../services/supabase';

interface GradeManagerProps {
  schoolId?: string;
}

export const GradeManager: React.FC<GradeManagerProps> = ({ schoolId: initialPropSchoolId = '00000000-0000-0000-0000-000000000000' }) => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // State to hold the actual valid school ID
  const [schoolId, setSchoolId] = useState(initialPropSchoolId);

  const [formData, setFormData] = useState({
    name: '',
    educationLevel: 'fundamental_1' as Grade['educationLevel'],
    orderIndex: 0
  });

  React.useEffect(() => {
    // If we have the dummy ID, try to fetch the real one
    if (schoolId === '00000000-0000-0000-0000-000000000000') {
      fetchSchoolId();
    }
    fetchGrades();
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

  const fetchGrades = async () => {
    try {
      const { data, error } = await supabase
        .from('grades')
        .select('*')
        .order('order_index');

      if (error) throw error;

      const formatted: Grade[] = (data || []).map((item: any) => ({
        id: item.id,
        schoolId: item.school_id,
        name: item.name,
        educationLevel: item.education_level,
        orderIndex: item.order_index,
        isActive: item.is_active
      }));

      setGrades(formatted);
    } catch (error) {
      console.error('Error fetching grades:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for School ID
    if (schoolId === '00000000-0000-0000-0000-000000000000') {
      alert('Erro: Nenhuma escola encontrada. Por favor, preencha os "Dados da Escola" primeiro.');
      return;
    }

    setLoading(true);
    try {
      const gradeData = {
        school_id: schoolId,
        name: formData.name,
        education_level: formData.educationLevel,
        order_index: formData.orderIndex,
        is_active: true
      };

      if (editingId) {
        await supabase.from('grades').update(gradeData).eq('id', editingId);
        setSuccessMsg('Série atualizada!');
      } else {
        await supabase.from('grades').insert([gradeData]);
        setSuccessMsg('Série cadastrada!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      fetchGrades();
    } catch (error: any) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta série?')) return;
    try {
      await supabase.from('grades').delete().eq('id', id);
      fetchGrades();
    } catch (error) {
      alert('Erro ao excluir');
    }
  };

  const startEdit = (grade: Grade) => {
    setFormData({
      name: grade.name,
      educationLevel: grade.educationLevel,
      orderIndex: grade.orderIndex
    });
    setEditingId(grade.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({ name: '', educationLevel: 'fundamental_1', orderIndex: grades.length });
    setEditingId(null);
    setIsAdding(false);
  };

  const getLevelLabel = (level: Grade['educationLevel']) => {
    const labels = {
      infantil: 'Educação Infantil',
      fundamental_1: 'Fundamental I (1º ao 5º)',
      fundamental_2: 'Fundamental II (6º ao 9º)',
      medio: 'Ensino Médio',
      eja: 'EJA'
    };
    return labels[level];
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BookOpen className="text-teal-600" />
            Gestão de Séries/Anos
          </h2>
          <p className="text-gray-500">Configure as séries da sua escola</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl hover:bg-teal-700 transition-colors shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" />
          Nova Série
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-teal-100">
          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Série *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  placeholder="Ex: 1º Ano, Pré-escola"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                <select
                  value={formData.educationLevel}
                  onChange={(e) => setFormData({ ...formData, educationLevel: e.target.value as Grade['educationLevel'] })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="infantil">Educação Infantil</option>
                  <option value="fundamental_1">Fundamental I</option>
                  <option value="fundamental_2">Fundamental II</option>
                  <option value="medio">Ensino Médio</option>
                  <option value="eja">EJA</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ordem</label>
                <input
                  type="number"
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-teal-500 outline-none"
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
                className="px-6 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 font-medium disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grades List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-teal-50 text-teal-900">
            <tr>
              <th className="p-4 text-left font-semibold">Ordem</th>
              <th className="p-4 text-left font-semibold">Série</th>
              <th className="p-4 text-left font-semibold">Nível</th>
              <th className="p-4 text-center font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grades.map(grade => (
              <tr key={grade.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-gray-600">{grade.orderIndex}</span>
                  </div>
                </td>
                <td className="p-4 font-medium text-gray-800">{grade.name}</td>
                <td className="p-4 text-gray-600">
                  <span className="bg-teal-100 px-2 py-1 rounded text-xs font-medium">
                    {getLevelLabel(grade.educationLevel)}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => startEdit(grade)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(grade.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {grades.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-gray-400">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma série cadastrada</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
