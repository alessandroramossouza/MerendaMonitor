import React, { useState, useEffect } from 'react';
import { getCustomers, addCustomer, updateCustomer, deleteCustomer, getSales, subscribeToCustomers } from '../services/dataService';
import { Customer, Sale } from '../types';

// Icons
const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export const CustomersPage: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formEmail, setFormEmail] = useState('');

    // History modal
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        loadData();
        const unsub = subscribeToCustomers(() => loadData());
        return () => unsub();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [cData, sData] = await Promise.all([getCustomers(), getSales()]);
        setCustomers(cData);
        setSales(sData);
        setLoading(false);
    };

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
    );

    const openAddModal = () => {
        setEditingCustomer(null);
        setFormName('');
        setFormPhone('');
        setFormEmail('');
        setIsModalOpen(true);
    };

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer);
        setFormName(customer.name);
        setFormPhone(customer.phone || '');
        setFormEmail(customer.email || '');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCustomer(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim()) return;

        try {
            if (editingCustomer) {
                await updateCustomer(editingCustomer.id, { name: formName, phone: formPhone, email: formEmail });
            } else {
                await addCustomer({ name: formName, phone: formPhone, email: formEmail });
            }
            closeModal();
            loadData();
        } catch (error) {
            alert('Erro ao salvar cliente');
        }
    };

    const handleDelete = async (customer: Customer) => {
        if (!window.confirm(`Excluir cliente "${customer.name}"?`)) return;
        try {
            await deleteCustomer(customer.id);
            loadData();
        } catch (error) {
            alert('Erro ao excluir cliente');
        }
    };

    const getCustomerSales = (customerId: string) => {
        return sales.filter(s => s.customerId === customerId);
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <UsersIcon />
                        Clientes
                    </h2>
                    <p className="text-slate-500">Gerencie sua base de clientes</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                    <PlusIcon />
                    Novo Cliente
                </button>
            </header>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por nome, telefone ou email..."
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 text-left">Cliente</th>
                            <th className="px-4 py-3 text-left">Contato</th>
                            <th className="px-4 py-3 text-center">Compras</th>
                            <th className="px-4 py-3 text-right">Total Gasto</th>
                            <th className="px-4 py-3 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredCustomers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                    {loading ? 'Carregando...' : 'Nenhum cliente cadastrado'}
                                </td>
                            </tr>
                        ) : (
                            filteredCustomers.map(customer => (
                                <tr key={customer.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-800">{customer.name}</p>
                                        <p className="text-xs text-slate-400">desde {new Date(customer.createdAt).toLocaleDateString('pt-BR')}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        {customer.phone && <p className="text-slate-600">{customer.phone}</p>}
                                        {customer.email && <p className="text-xs text-slate-400">{customer.email}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => setSelectedCustomer(customer)}
                                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200"
                                        >
                                            {customer.totalPurchases} compras
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                                        R$ {customer.totalSpent.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => openEditModal(customer)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg">
                                                <EditIcon />
                                            </button>
                                            <button onClick={() => handleDelete(customer)} className="p-2 text-red-600 hover:bg-red-100 rounded-lg">
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <h3 className="font-semibold text-lg text-slate-800">
                                {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                            </h3>
                            <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg">
                                <CloseIcon />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                                <input
                                    type="text"
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                                <input
                                    type="tel"
                                    value={formPhone}
                                    onChange={(e) => setFormPhone(e.target.value)}
                                    placeholder="(00) 00000-0000"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formEmail}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    placeholder="cliente@email.com"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="flex-1 py-2 px-4 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Customer History Modal */}
            {selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200">
                            <div>
                                <h3 className="font-semibold text-lg text-slate-800">{selectedCustomer.name}</h3>
                                <p className="text-sm text-slate-500">Histórico de Compras</p>
                            </div>
                            <button onClick={() => setSelectedCustomer(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                                <CloseIcon />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {getCustomerSales(selectedCustomer.id).length === 0 ? (
                                <p className="text-center text-slate-400 py-8">Nenhuma compra registrada</p>
                            ) : (
                                <div className="space-y-3">
                                    {getCustomerSales(selectedCustomer.id).map(sale => (
                                        <div key={sale.id} className="p-3 bg-slate-50 rounded-lg">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium text-slate-800">{sale.productName}</p>
                                                    <p className="text-xs text-slate-400">{new Date(sale.timestamp).toLocaleString('pt-BR')}</p>
                                                </div>
                                                <p className="font-bold text-emerald-600">R$ {sale.total.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
