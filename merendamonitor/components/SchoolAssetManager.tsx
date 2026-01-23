import React, { useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Classroom } from '../types-school';
import {
    Boxes,
    MapPin,
    Plus,
    Search,
    Monitor,
    Armchair,
    Book,
    Box,
    AlertTriangle,
    CheckCircle2,
    HelpCircle,
    Edit2,
    Trash2,
    MoreVertical,
    LayoutGrid
} from 'lucide-react';

interface SchoolAsset {
    id: string;
    schoolId: string;
    classroomId: string | null;
    name: string;
    category: 'Mobília' | 'Eletrônicos' | 'Didático' | 'Outros';
    quantity: number;
    condition: 'Novo' | 'Bom' | 'Regular' | 'Ruim' | 'Inservível';
    acquisitionDate?: string;
    estimatedValue?: number;
    notes?: string;
    classroomName?: string; // For display
}

interface SchoolAssetManagerProps {
    schoolId?: string;
    initialFilter?: string;
}

export const SchoolAssetManager: React.FC<SchoolAssetManagerProps> = ({
    schoolId: initialPropSchoolId = '00000000-0000-0000-0000-000000000000',
    initialFilter = 'all'
}) => {
    const [assets, setAssets] = useState<SchoolAsset[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [schoolId, setSchoolId] = useState(initialPropSchoolId);
    const [loading, setLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filtering
    const [selectedClassroom, setSelectedClassroom] = useState<string>(initialFilter);
    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {
        setSelectedClassroom(initialFilter);
    }, [initialFilter]);

    const [formData, setFormData] = useState<Partial<SchoolAsset>>({
        name: '',
        category: 'Mobília',
        quantity: 1,
        condition: 'Bom',
        classroomId: '', // Empty string = General/School
        notes: ''
    });

    React.useEffect(() => {
        if (schoolId === '00000000-0000-0000-0000-000000000000') {
            fetchSchoolId();
        }
        fetchData();
    }, []);

    const fetchSchoolId = async () => {
        try {
            const { data } = await supabase.from('schools').select('id').limit(1).single();
            if (data) setSchoolId(data.id);
        } catch (e) { console.error(e); }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch Classrooms
            const { data: classData } = await supabase
                .from('classrooms')
                .select('*')
                .eq('is_active', true)
                .order('name');

            const formattedClassrooms = (classData || []).map((c: any) => ({
                id: c.id,
                name: c.name,
                // ... map other needed fields if necessary, minimal for now
            })) as Classroom[];
            setClassrooms(formattedClassrooms);

            // Fetch Assets
            const { data: assetData, error } = await supabase
                .from('school_assets')
                .select(`
          *,
          classrooms (name)
        `)
                .order('name');

            if (error) throw error;

            const formattedAssets: SchoolAsset[] = (assetData || []).map((item: any) => ({
                id: item.id,
                schoolId: item.school_id,
                classroomId: item.classroom_id,
                name: item.name,
                category: item.category,
                quantity: item.quantity,
                condition: item.condition,
                acquisitionDate: item.acquisition_date,
                estimatedValue: item.estimated_value,
                notes: item.notes,
                classroomName: item.classrooms?.name || 'Área Comum / Geral'
            }));

            setAssets(formattedAssets);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        if (schoolId === '00000000-0000-0000-0000-000000000000') {
            alert('Erro: Escola não identificada.');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                school_id: schoolId,
                classroom_id: formData.classroomId || null,
                name: formData.name,
                category: formData.category,
                quantity: formData.quantity,
                condition: formData.condition,
                notes: formData.notes
            };

            if (editingId) {
                await supabase.from('school_assets').update(payload).eq('id', editingId);
            } else {
                await supabase.from('school_assets').insert([payload]);
            }

            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving asset:', error);
            alert('Erro ao salvar item.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este item?')) return;
        try {
            await supabase.from('school_assets').delete().eq('id', id);
            fetchData();
        } catch (error) {
            console.error(error);
        }
    };

    const startEdit = (asset: SchoolAsset) => {
        setFormData({
            name: asset.name,
            category: asset.category,
            quantity: asset.quantity,
            condition: asset.condition,
            classroomId: asset.classroomId || '',
            notes: asset.notes
        });
        setEditingId(asset.id);
        setIsAdding(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'Mobília',
            quantity: 1,
            condition: 'Bom',
            classroomId: selectedClassroom === 'all' ? '' : selectedClassroom,
            notes: ''
        });
        setEditingId(null);
        setIsAdding(false);
    };

    // derived state
    const filteredAssets = useMemo(() => {
        return assets.filter(asset => {
            const matchRoom = selectedClassroom === 'all' ||
                (selectedClassroom === 'general' ? !asset.classroomId : asset.classroomId === selectedClassroom);
            const matchSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
            return matchRoom && matchSearch;
        });
    }, [assets, selectedClassroom, searchTerm]);

    const stats = useMemo(() => {
        const totalItems = filteredAssets.reduce((acc, curr) => acc + curr.quantity, 0);
        const brokenItems = filteredAssets.filter(a => a.condition === 'Ruim' || a.condition === 'Inservível')
            .reduce((acc, curr) => acc + curr.quantity, 0);
        const valueMap = { 'Mobília': 0, 'Eletrônicos': 0, 'Didático': 0, 'Outros': 0 };
        filteredAssets.forEach(a => {
            if (valueMap[a.category] !== undefined) valueMap[a.category] += a.quantity;
        });

        return { totalItems, brokenItems, valueMap };
    }, [filteredAssets]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Mobília': return <Armchair className="w-5 h-5 text-amber-600" />;
            case 'Eletrônicos': return <Monitor className="w-5 h-5 text-blue-600" />;
            case 'Didático': return <Book className="w-5 h-5 text-emerald-600" />;
            default: return <Box className="w-5 h-5 text-gray-600" />;
        }
    };

    const getConditionColor = (condition: string) => {
        switch (condition) {
            case 'Novo': return 'bg-green-100 text-green-800 border-green-200';
            case 'Bom': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'Regular': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Ruim': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'Inservível': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Boxes className="text-indigo-600" />
                        Inventário Patrimonial
                    </h2>
                    <p className="text-gray-500">Gestão de bens, móveis e equipamentos por sala</p>
                </div>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg font-bold"
                >
                    <Plus className="w-5 h-5" />
                    Novo Item
                </button>
            </header>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Total de Itens</p>
                    <p className="text-3xl font-bold text-indigo-600">{stats.totalItems}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Mobília</p>
                            <p className="text-2xl font-bold text-amber-700">{stats.valueMap['Mobília']}</p>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-lg"><Armchair className="w-5 h-5 text-amber-600" /></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Eletrônicos</p>
                            <p className="text-2xl font-bold text-blue-700">{stats.valueMap['Eletrônicos']}</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg"><Monitor className="w-5 h-5 text-blue-600" /></div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                    <p className="text-sm text-gray-500 mb-1">Itens Danificados</p>
                    <div className="flex items-center gap-2">
                        <p className="text-3xl font-bold text-red-600">{stats.brokenItems}</p>
                        {stats.brokenItems > 0 && <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />}
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-col lg:flex-row gap-6">

                {/* Left Sidebar: Room Selector */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 font-semibold text-gray-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Locais
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            <button
                                onClick={() => setSelectedClassroom('all')}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 ${selectedClassroom === 'all' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                Todos os Locais
                            </button>
                            <button
                                onClick={() => setSelectedClassroom('general')}
                                className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 ${selectedClassroom === 'general' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                            >
                                Área Comum / Geral
                            </button>
                            <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase mt-2">Salas de Aula</div>
                            {classrooms.map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => setSelectedClassroom(room.id)}
                                    className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-4 ${selectedClassroom === room.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
                                >
                                    {room.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Content: Grid of Items */}
                <div className="flex-1 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar patrimônio..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        />
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredAssets.map(asset => (
                            <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${asset.condition === 'Ruim' || asset.condition === 'Inservível' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>

                                <div className="p-5 pl-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-lg bg-gray-50`}>
                                                {getCategoryIcon(asset.category)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 leading-tight">{asset.name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{asset.category}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-2xl font-bold text-indigo-600">{asset.quantity}</span>
                                            <span className="text-[10px] text-gray-400 uppercase tracking-wide">Qtd</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-wrap gap-2 items-center justify-between">
                                        <span className={`px-2 py-1 rounded text-xs font-bold border ${getConditionColor(asset.condition)}`}>
                                            {asset.condition}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {asset.classroomName}
                                        </span>
                                    </div>

                                    {/* Actions overlay on hover */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button
                                            onClick={() => startEdit(asset)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg bg-white shadow-sm border border-gray-200"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(asset.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg bg-white shadow-sm border border-gray-200"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredAssets.length === 0 && (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                            <Boxes className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-600">Nenhum item encontrado</h3>
                            <p className="text-gray-400 text-sm mt-1">
                                {searchTerm ? 'Tente buscar com outros termos.' : 'Selecione uma sala ou adicione um novo item.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isAdding && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={resetForm}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                {editingId ? 'Editar Item' : 'Novo Item Patrimonial'}
                            </h3>
                            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Item *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ex: Cadeira Giratória, Projetor Epson..."
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Mobília">Mobília</option>
                                        <option value="Eletrônicos">Eletrônicos</option>
                                        <option value="Didático">Material Didático</option>
                                        <option value="Outros">Outros</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                        className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Local / Sala de Aula</label>
                                <select
                                    value={formData.classroomId || ''}
                                    onChange={e => setFormData({ ...formData, classroomId: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">-- Área Comum / Geral --</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 mt-1">Deixe em branco se for item de uso geral da escola</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado de Conservação</label>
                                <div className="grid grid-cols-5 gap-1">
                                    {['Novo', 'Bom', 'Regular', 'Ruim', 'Inservível'].map(cond => (
                                        <button
                                            key={cond}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, condition: cond as any })}
                                            className={`px-1 py-2 text-xs rounded border transition-all ${formData.condition === cond
                                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-md'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {cond}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                    rows={2}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={resetForm} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium">Cancelar</button>
                                <button type="submit" disabled={loading} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50">
                                    {loading ? 'Salvando...' : 'Salvar Item'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};
