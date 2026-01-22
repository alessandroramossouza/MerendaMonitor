import React, { useState } from 'react';
import { Supplier } from '../types-extended';
import { Truck, Plus, Edit2, Trash2, Phone, Mail, MapPin, Star } from 'lucide-react';
import { supabase } from '../services/supabase';

export const SupplierManager: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    rating: 5,
    isActive: true
  });

  React.useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;

      const formatted: Supplier[] = (data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        contact: item.contact,
        phone: item.phone,
        email: item.email,
        address: item.address,
        rating: item.rating,
        isActive: item.is_active,
        createdAt: item.created_at
      }));

      setSuppliers(formatted);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setLoading(true);
    try {
      const supplierData = {
        name: formData.name,
        contact: formData.contact || null,
        phone: formData.phone || null,
        email: formData.email || null,
        address: formData.address || null,
        rating: formData.rating,
        is_active: formData.isActive
      };

      if (editingId) {
        const { error } = await supabase
          .from('suppliers')
          .update(supplierData)
          .eq('id', editingId);

        if (error) throw error;
        setSuccessMsg('Fornecedor atualizado!');
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([supplierData]);

        if (error) throw error;
        setSuccessMsg('Fornecedor cadastrado!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
      resetForm();
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Erro ao salvar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este fornecedor?')) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Erro ao excluir fornecedor');
    }
  };

  const startEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      rating: supplier.rating,
      isActive: supplier.isActive
    });
    setEditingId(supplier.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact: '',
      phone: '',
      email: '',
      address: '',
      rating: 5,
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
            <Truck className="text-green-600" />
            Gerenciamento de Fornecedores
          </h2>
          <p className="text-gray-500">Cadastre e gerencie seus fornecedores</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" />
          Novo Fornecedor
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-green-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-green-800 flex items-center gap-2">
            <Truck className="w-5 h-5" />
            {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h3>

          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Fornecedor *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Ex: Distribuidora ABC"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contato</label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="(11) 98765-4321"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="contato@fornecedor.com.br"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Rua, número, bairro, cidade"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ Excelente</option>
                  <option value={4}>⭐⭐⭐⭐ Muito Bom</option>
                  <option value={3}>⭐⭐⭐ Bom</option>
                  <option value={2}>⭐⭐ Regular</option>
                  <option value={1}>⭐ Ruim</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Fornecedor Ativo</span>
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
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm font-medium disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(supplier => (
          <div key={supplier.id} className={`bg-white rounded-xl shadow-sm border ${supplier.isActive ? 'border-gray-200' : 'border-gray-300 opacity-60'} overflow-hidden`}>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{supplier.name}</h3>
                  {!supplier.isActive && (
                    <span className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded mt-1 inline-block">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: supplier.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-white" />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 space-y-3">
              {supplier.contact && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                    👤
                  </div>
                  <span>{supplier.contact}</span>
                </div>
              )}

              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>{supplier.phone}</span>
                </div>
              )}

              {supplier.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span className="truncate">{supplier.email}</span>
                </div>
              )}

              {supplier.address && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>{supplier.address}</span>
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => startEdit(supplier)}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {suppliers.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhum fornecedor cadastrado. Clique em "Novo Fornecedor" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};
