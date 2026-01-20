import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { InventoryManager } from './components/InventoryManager';
import { DailyLog } from './components/DailyLog';
import { Dashboard } from './components/Dashboard';
import { AiAdvisor } from './components/AiAdvisor';
import { Ingredient, ConsumptionLog, UserRole } from './types';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  // App State "Database"
  const [inventory, setInventory] = useState<Ingredient[]>([]);
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);

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

      // Fetch Logs
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

      setInventory(formattedIngredients);
      setLogs(formattedLogs);

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
    // We don't optimistically update here easily because we need the real UUID from DB if we want to be safe,
    // actually we can with a temp ID but simpler to just wait.

    // However, the InventoryManager usually passes a generated ID. 
    // Let's ignore the passed ID and let DB generate one, or use the passed one if valid UUID.
    // For simplicity, let's insert and refetch.

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
          <Dashboard inventory={inventory} logs={logs} />
        )}

        {activeTab === 'inventory' && role === 'admin' && (
          <InventoryManager
            inventory={inventory}
            onUpdateInventory={handleUpdateInventory}
            onDelete={handleDeleteInventory}
            onAdd={handleAddInventory}
          />
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