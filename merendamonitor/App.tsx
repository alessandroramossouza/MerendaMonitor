import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { InventoryManager } from './components/InventoryManager';
import { DailyLog } from './components/DailyLog';
import { Dashboard } from './components/Dashboard';
import { AiAdvisor } from './components/AiAdvisor';
import { SupplyManager } from './components/SupplyManager';
import { CookingCalculator } from './components/CookingCalculator';
import { Reports } from './components/Reports';
import { Ingredient, ConsumptionLog, UserRole, SupplyLog } from './types';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // App State "Database"
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [supplyLogs, setSupplyLogs] = useState<SupplyLog[]>([]);

  // Fetch Data from Supabase
  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch Ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

      if (ingredientsError) throw ingredientsError;

      const formattedIngredients: Ingredient[] = (ingredientsData || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.current_stock,
        minThreshold: item.min_threshold,
        unit: item.unit
      }));

      // Fetch Consumption Logs
      const { data: logsData, error: logsError } = await supabase
        .from('consumption_logs')
        .select('*')
        .order('date', { ascending: false });

      if (logsError) throw logsError;

      const formattedLogs: ConsumptionLog[] = (logsData || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        ingredientId: item.ingredient_id,
        ingredientName: item.ingredient_name,
        amountUsed: item.amount_used,
        studentCount: item.student_count,
        gramsPerStudent: item.grams_per_student
      }));

      // Fetch Supply Logs (Recent)
      const { data: supplyData, error: supplyError } = await supabase
        .from('supply_logs')
        .select('*')
        .order('expiration_date', { ascending: true }); // Order by expiration to find nearest

      if (supplyError && supplyError.code !== 'PGRST116') { // Ignore if table missing initially
        console.warn('Supply logs fetch error', supplyError);
      }

      const formattedSupplyLogs: SupplyLog[] = (supplyData || []).map((item: any) => ({
        id: item.id,
        date: item.date,
        ingredientId: item.ingredient_id,
        ingredientName: item.ingredient_name,
        amountAdded: item.amount_added,
        source: item.source,
        notes: item.notes,
        expirationDate: item.expiration_date
      }));

      setInventory(formattedIngredients);
      setLogs(formattedLogs);
      setSupplyLogs(formattedSupplyLogs);

    } catch (error) {
      console.error('Error fetching data:', error);
      // Optional: Handle error UI here
    } finally {
      setLoading(false);
    }
  };

  // Upload Effect
  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateInventory = async (updatedItem: Ingredient) => {
    // Optimistic Update
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    const { error } = await supabase
      .from('ingredients')
      .update({
        name: updatedItem.name,
        category: updatedItem.category,
        current_stock: updatedItem.currentStock,
        min_threshold: updatedItem.minThreshold,
        unit: updatedItem.unit
      })
      .eq('id', updatedItem.id);

    if (error) {
      console.error('Error updating ingredient:', error);
      fetchData(); // Revert on error
    }
  };

  const handleAddInventory = async (newItem: Ingredient) => {
    const { error } = await supabase
      .from('ingredients')
      .insert([{
        name: newItem.name,
        category: newItem.category,
        current_stock: newItem.currentStock,
        min_threshold: newItem.minThreshold,
        unit: newItem.unit
      }]);

    if (error) {
      console.error('Error adding ingredient:', error);
    } else {
      fetchData();
    }
  };

  const handleDeleteInventory = async (id: string) => {
    // Optimistic
    setInventory(prev => prev.filter(item => item.id !== id));

    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting ingredient:', error);
      fetchData();
    }
  };

  const handleLogConsumption = async (ingredientId: string, amount: number, students: number) => {
    const item = inventory.find(i => i.id === ingredientId);
    if (!item) return;

    const gramsPerStudent = (amount * 1000) / students;
    const date = new Date().toISOString().split('T')[0];

    // 1. Create Log Record
    const { error: logError } = await supabase
      .from('consumption_logs')
      .insert([{
        date: date,
        ingredient_id: ingredientId,
        ingredient_name: item.name,
        amount_used: amount,
        student_count: students,
        grams_per_student: gramsPerStudent
      }]);

    if (logError) {
      console.error('Error logging consumption:', logError);
      return;
    }

    // 2. Update Stock
    const newStock = item.currentStock - amount;
    const updatedItem = { ...item, currentStock: newStock };

    // We reuse the update handler which handles Supabase update for the ingredient
    await handleUpdateInventory(updatedItem);

    // Refresh to get the new log in the list
    fetchData();
  };

  const handleSupplyEntry = async (ingredientId: string, amount: number, source: string, notes: string, expirationDate?: string) => {
    const item = inventory.find(i => i.id === ingredientId);
    if (!item) return;

    const date = new Date().toISOString().split('T')[0];

    // 1. Create Supply Log
    const { error: logError } = await supabase
      .from('supply_logs')
      .insert([{
        date: date,
        ingredient_id: ingredientId,
        ingredient_name: item.name,
        amount_added: amount,
        source: source,
        notes: notes,
        expiration_date: expirationDate
      }]);

    if (logError) {
      console.error('Error adding supply log:', logError);
    }

    // 2. Update Stock (Addition)
    const newStock = item.currentStock + amount;
    const updatedItem = { ...item, currentStock: newStock };

    await handleUpdateInventory(updatedItem);
    fetchData();
  };

  const switchRole = () => {
    const newRole = role === 'admin' ? 'cook' : 'admin';
    setRole(newRole);
    setActiveTab(newRole === 'admin' ? 'dashboard' : 'daily-log');
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center text-emerald-600 font-bold text-xl">Carregando Sistema...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentRole={role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        switchRole={switchRole}
      />

      <main className="flex-1 ml-64">
        {activeTab === 'dashboard' && role === 'admin' && (
          <Dashboard inventory={inventory} logs={logs} supplyLogs={supplyLogs} />
        )}

        {activeTab === 'inventory' && role === 'admin' && (
          <InventoryManager
            inventory={inventory}
            onUpdateInventory={handleUpdateInventory}
            onDelete={handleDeleteInventory}
            onAdd={handleAddInventory}
          />
        )}

        {activeTab === 'supply' && role === 'admin' && (
          <SupplyManager
            inventory={inventory}
            onSupplyEntry={handleSupplyEntry}
          />
        )}

        {activeTab === 'calculator' && role === 'admin' && (
          <CookingCalculator inventory={inventory} />
        )}

        {activeTab === 'reports' && role === 'admin' && (
          <Reports inventory={inventory} logs={logs} supplyLogs={supplyLogs} />
        )}

        {activeTab === 'insights' && role === 'admin' && (
          <AiAdvisor inventory={inventory} logs={logs} />
        )}

        {activeTab === 'daily-log' && (
          <div className="p-8 mt-10">
            <DailyLog inventory={inventory} onLogConsumption={handleLogConsumption} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;