import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { InventoryManager } from './components/InventoryManager';
import { DailyLog } from './components/DailyLog';
import { Dashboard } from './components/Dashboard';
import { AiAdvisor } from './components/AiAdvisor';
import { SupplyManager } from './components/SupplyManager';
import { CookingCalculator } from './components/CookingCalculator';
import { Reports } from './components/Reports';
import { MovementHistory } from './components/MovementHistory';
import { WeeklyMenu } from './components/WeeklyMenu';
import { DailyRegister } from './components/DailyRegister';
import { Login } from './components/Login';
import { Ingredient, ConsumptionLog, UserRole, SupplyLog } from './types';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>('cook');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<any>(null); // To track login
  const [loading, setLoading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [session]);

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
    // Optimistic remove from UI
    setInventory(prev => prev.filter(item => item.id !== id));

    try {
      // 1. Delete associated Consumption Logs
      const { error: consumptionError } = await supabase
        .from('consumption_logs')
        .delete()
        .eq('ingredient_id', id);

      if (consumptionError) throw consumptionError;

      // 2. Delete associated Supply Logs
      const { error: supplyError } = await supabase
        .from('supply_logs')
        .delete()
        .eq('ingredient_id', id);

      if (supplyError) throw supplyError;

      // 3. Finally delete the Ingredient
      const { error: deleteError } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

    } catch (error) {
      console.error('Error deleting ingredient:', error);
      alert('Erro ao excluir. O item pode ter registros históricos que impedem a exclusão.');
      fetchData(); // Rollback UI if failed
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setRole('cook'); // reset default
  };

  const handleLoginSuccess = (session: any, userRole: 'admin' | 'cook') => {
    setSession(session);
    setRole(userRole);
    setActiveTab(userRole === 'admin' ? 'dashboard' : 'daily-log');
  };

  if (!session) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        currentRole={role}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        switchRole={handleLogout}
      />

      <main className="flex-1 ml-64">
        {activeTab === 'dashboard' && role === 'admin' && (
          <Dashboard inventory={inventory} logs={logs} supplyLogs={supplyLogs} />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            inventory={inventory}
            onUpdateInventory={handleUpdateInventory}
            onDelete={handleDeleteInventory}
            onAdd={handleAddInventory}
            consumptionLogs={logs}
            supplyLogs={supplyLogs}
            readOnly={role === 'cook'}
          />
        )}

        {activeTab === 'supply' && (
          <SupplyManager
            inventory={inventory}
            supplyLogs={supplyLogs}
            onSupplyEntry={handleSupplyEntry}
          />
        )}

        {activeTab === 'daily-log' && (
          <DailyRegister
            inventory={inventory}
            onConsumption={handleLogConsumption}
          />
        )}

        {activeTab === 'calculator' && (
          <CookingCalculator inventory={inventory} />
        )}

        {activeTab === 'weekly-menu' && (
          <WeeklyMenu inventory={inventory} />
        )}

        {activeTab === 'reports' && role === 'admin' && (
          <Reports inventory={inventory} logs={logs} supplyLogs={supplyLogs} />
        )}

        {activeTab === 'insights' && role === 'admin' && (
          <AiAdvisor inventory={inventory} logs={logs} />
        )}
      </main>
    </div>
  );
};

export default App;