import React, { useState } from 'react';
import { School } from '../types-school';
import { Building2, Save, MapPin, Phone, Mail, FileText } from 'lucide-react';
import { supabase } from '../services/supabase';

export const SchoolManager: React.FC = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    inepCode: '',
    address: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    zipCode: '',
    totalCapacity: 500
  });

  React.useEffect(() => {
    fetchSchool();
  }, []);

  const fetchSchool = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const formatted: School = {
          id: data.id,
          name: data.name,
          inepCode: data.inep_code,
          address: data.address,
          phone: data.phone,
          email: data.email,
          city: data.city,
          state: data.state,
          zipCode: data.zip_code,
          totalCapacity: data.total_capacity,
          logoUrl: data.logo_url,
          isActive: data.is_active,
          createdAt: data.created_at
        };

        setSchool(formatted);
        setFormData({
          name: formatted.name,
          inepCode: formatted.inepCode || '',
          address: formatted.address || '',
          phone: formatted.phone || '',
          email: formatted.email || '',
          city: formatted.city || '',
          state: formatted.state || '',
          zipCode: formatted.zipCode || '',
          totalCapacity: formatted.totalCapacity
        });
      }
    } catch (error) {
      console.error('Error fetching school:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const schoolData = {
        name: formData.name,
        inep_code: formData.inepCode || null,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zipCode || null,
        total_capacity: formData.totalCapacity,
        is_active: true
      };

      if (school) {
        const { error } = await supabase
          .from('schools')
          .update(schoolData)
          .eq('id', school.id);

        if (error) throw error;
        setSuccessMsg('Escola atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('schools')
          .insert([schoolData]);

        if (error) throw error;
        setSuccessMsg('Escola cadastrada com sucesso!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      setIsEditing(false);
      fetchSchool();
    } catch (error: any) {
      console.error('Error saving school:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Building2 className="text-blue-600" />
          Dados da Instituição
        </h2>
        <p className="text-gray-500">Informações da unidade escolar</p>
      </header>

      {successMsg && (
        <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg">
          ✅ {successMsg}
        </div>
      )}

      <div className="max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            {school ? school.name : 'Nova Escola'}
          </h3>
          {school?.inepCode && (
            <p className="text-blue-100 text-sm mt-1">Código INEP: {school.inepCode}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Escola *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                required
                disabled={!isEditing && !!school}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código INEP</label>
              <input
                type="text"
                value={formData.inepCode}
                onChange={(e) => setFormData({ ...formData, inepCode: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={!isEditing && !!school}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Endereço Completo
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Rua, número, bairro"
                disabled={!isEditing && !!school}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={!isEditing && !!school}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                maxLength={2}
                placeholder="SP"
                disabled={!isEditing && !!school}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
              <input
                type="text"
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="00000-000"
                disabled={!isEditing && !!school}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Telefone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="(11) 3000-0000"
                disabled={!isEditing && !!school}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={!isEditing && !!school}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidade Total</label>
              <input
                type="number"
                value={formData.totalCapacity}
                onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-md p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={!isEditing && !!school}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            {school && !isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2"
              >
                <Edit2 className="w-5 h-5" />
                Editar Informações
              </button>
            ) : (
              <>
                {school && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      fetchSchool();
                    }}
                    className="px-6 py-3 text-gray-600 hover:bg-gray-100 rounded-xl font-medium"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold flex items-center gap-2 disabled:bg-gray-400"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
