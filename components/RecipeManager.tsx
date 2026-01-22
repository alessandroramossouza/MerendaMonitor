import React, { useState, useMemo } from 'react';
import { Ingredient } from '../types';
import { Recipe, RecipeIngredient } from '../types-extended';
import { ChefHat, Plus, Edit2, Trash2, Clock, Users, DollarSign, BookOpen } from 'lucide-react';
import { supabase } from '../services/supabase';

interface RecipeManagerProps {
  inventory: Ingredient[];
  onRefresh?: () => void;
}

export const RecipeManager: React.FC<RecipeManagerProps> = ({ inventory, onRefresh }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Básico',
    servings: 100,
    preparationTime: 60,
    instructions: '',
    costPerServing: 0
  });

  const [ingredients, setIngredients] = useState<Array<{ ingredientId: string; quantityKg: number }>>([]);

  React.useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select('*')
        .order('name');

      if (recipesError) throw recipesError;

      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('recipe_ingredients')
        .select('*');

      if (ingredientsError) throw ingredientsError;

      const formatted: Recipe[] = (recipesData || []).map((recipe: any) => {
        const recipeIngredients: RecipeIngredient[] = (ingredientsData || [])
          .filter((ing: any) => ing.recipe_id === recipe.id)
          .map((ing: any) => {
            const inventoryItem = inventory.find(i => i.id === ing.ingredient_id);
            return {
              id: ing.id,
              recipeId: ing.recipe_id,
              ingredientId: ing.ingredient_id,
              ingredientName: inventoryItem?.name || 'Desconhecido',
              quantityKg: ing.quantity_kg
            };
          });

        return {
          id: recipe.id,
          name: recipe.name,
          category: recipe.category,
          servings: recipe.servings,
          preparationTime: recipe.preparation_time,
          instructions: recipe.instructions,
          costPerServing: recipe.cost_per_serving,
          ingredients: recipeIngredients
        };
      });

      setRecipes(formatted);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || ingredients.length === 0) {
      alert('Preencha o nome e adicione pelo menos 1 ingrediente');
      return;
    }

    setLoading(true);
    try {
      // Save recipe
      const recipeData = {
        name: formData.name,
        category: formData.category,
        servings: formData.servings,
        preparation_time: formData.preparationTime,
        instructions: formData.instructions,
        cost_per_serving: formData.costPerServing
      };

      let recipeId: string;

      if (editingId) {
        const { error } = await supabase
          .from('recipes')
          .update(recipeData)
          .eq('id', editingId);

        if (error) throw error;
        recipeId = editingId;

        // Delete old ingredients
        await supabase
          .from('recipe_ingredients')
          .delete()
          .eq('recipe_id', editingId);
      } else {
        const { data, error } = await supabase
          .from('recipes')
          .insert([recipeData])
          .select()
          .single();

        if (error) throw error;
        recipeId = data.id;
      }

      // Save ingredients
      const ingredientInserts = ingredients.map(ing => ({
        recipe_id: recipeId,
        ingredient_id: ing.ingredientId,
        quantity_kg: ing.quantityKg
      }));

      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientInserts);

      if (ingError) throw ingError;

      setSuccessMsg(editingId ? 'Receita atualizada!' : 'Receita criada com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);

      resetForm();
      fetchRecipes();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Erro ao salvar receita');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta receita?')) return;

    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchRecipes();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      alert('Erro ao excluir receita');
    }
  };

  const startEdit = (recipe: Recipe) => {
    setFormData({
      name: recipe.name,
      category: recipe.category,
      servings: recipe.servings,
      preparationTime: recipe.preparationTime || 60,
      instructions: recipe.instructions || '',
      costPerServing: recipe.costPerServing
    });
    setIngredients(
      recipe.ingredients?.map(ing => ({
        ingredientId: ing.ingredientId,
        quantityKg: ing.quantityKg
      })) || []
    );
    setEditingId(recipe.id);
    setIsAdding(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Básico',
      servings: 100,
      preparationTime: 60,
      instructions: '',
      costPerServing: 0
    });
    setIngredients([]);
    setEditingId(null);
    setIsAdding(false);
  };

  const addIngredient = () => {
    if (inventory.length === 0) return;
    setIngredients([...ingredients, { ingredientId: inventory[0].id, quantityKg: 1 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: 'ingredientId' | 'quantityKg', value: string | number) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  // Check availability
  const checkAvailability = (recipe: Recipe) => {
    if (!recipe.ingredients) return { available: true, missing: [] };

    const missing: string[] = [];
    let available = true;

    recipe.ingredients.forEach(ing => {
      const item = inventory.find(i => i.id === ing.ingredientId);
      if (!item || item.currentStock < ing.quantityKg) {
        available = false;
        missing.push(ing.ingredientName || 'Desconhecido');
      }
    });

    return { available, missing };
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <ChefHat className="text-orange-500" />
            Gerenciador de Receitas
          </h2>
          <p className="text-gray-500">Cadastre preparos e vincule ingredientes</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors shadow-lg font-bold"
        >
          <Plus className="w-5 h-5" />
          Nova Receita
        </button>
      </header>

      {/* Form Modal */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-orange-100 animate-fade-in">
          <h3 className="text-lg font-semibold mb-4 text-orange-800 flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            {editingId ? 'Editar Receita' : 'Nova Receita'}
          </h3>

          {successMsg && (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg mb-4">
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Receita</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="Ex: Arroz com Feijão"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="Básico">Básico</option>
                  <option value="Massas">Massas</option>
                  <option value="Carnes">Carnes</option>
                  <option value="Sopas">Sopas</option>
                  <option value="Saladas">Saladas</option>
                  <option value="Sobremesas">Sobremesas</option>
                  <option value="Lanches">Lanches</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Porções</label>
                <input
                  type="number"
                  value={formData.servings}
                  onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tempo de Preparo (min)</label>
                <input
                  type="number"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({ ...formData, preparationTime: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custo por Porção (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.costPerServing}
                  onChange={(e) => setFormData({ ...formData, costPerServing: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Preparo</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                rows={3}
                placeholder="Descreva o modo de preparo..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Ingredientes</label>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-md hover:bg-orange-200"
                >
                  + Adicionar
                </button>
              </div>

              <div className="space-y-2">
                {ingredients.map((ing, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      value={ing.ingredientId}
                      onChange={(e) => updateIngredient(index, 'ingredientId', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      {inventory.map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      value={ing.quantityKg}
                      onChange={(e) => updateIngredient(index, 'quantityKg', parseFloat(e.target.value) || 0)}
                      className="w-24 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="kg"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {ingredients.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">Nenhum ingrediente adicionado</p>
                )}
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
                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 shadow-sm font-medium disabled:bg-gray-400"
              >
                {loading ? 'Salvando...' : 'Salvar Receita'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => {
          const availability = checkAvailability(recipe);
          return (
            <div key={recipe.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-white">
                <h3 className="text-xl font-bold">{recipe.name}</h3>
                <p className="text-orange-100 text-sm">{recipe.category}</p>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{recipe.servings} porções</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.preparationTime} min</span>
                  </div>
                </div>

                {recipe.costPerServing > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span>R$ {recipe.costPerServing.toFixed(2)} por porção</span>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Ingredientes ({recipe.ingredients?.length || 0}):</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {recipe.ingredients?.map(ing => (
                      <div key={ing.id} className="text-sm text-gray-700 flex justify-between">
                        <span>{ing.ingredientName}</span>
                        <span className="text-gray-500">{ing.quantityKg} kg</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  {availability.available ? (
                    <div className="bg-green-50 text-green-700 text-sm p-2 rounded-lg border border-green-200">
                      ✅ Todos ingredientes disponíveis
                    </div>
                  ) : (
                    <div className="bg-red-50 text-red-700 text-sm p-2 rounded-lg border border-red-200">
                      ⚠️ Falta: {availability.missing.join(', ')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setSelectedRecipe(recipe)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium"
                  >
                    <BookOpen className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => startEdit(recipe)}
                    className="px-3 py-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {recipes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <ChefHat className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Nenhuma receita cadastrada. Clique em "Nova Receita" para começar.</p>
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedRecipe(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
              <h2 className="text-2xl font-bold">{selectedRecipe.name}</h2>
              <p className="text-orange-100">{selectedRecipe.category}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <Users className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Porções</p>
                  <p className="text-xl font-bold text-gray-800">{selectedRecipe.servings}</p>
                </div>
                <div className="text-center">
                  <Clock className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Tempo</p>
                  <p className="text-xl font-bold text-gray-800">{selectedRecipe.preparationTime} min</p>
                </div>
                <div className="text-center">
                  <DollarSign className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-sm text-gray-500">Custo</p>
                  <p className="text-xl font-bold text-gray-800">R$ {selectedRecipe.costPerServing.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-2">Ingredientes:</h3>
                <ul className="space-y-2">
                  {selectedRecipe.ingredients?.map(ing => (
                    <li key={ing.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{ing.ingredientName}</span>
                      <span className="font-mono text-gray-600">{ing.quantityKg} kg</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedRecipe.instructions && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-2">Modo de Preparo:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedRecipe.instructions}</p>
                </div>
              )}

              <button
                onClick={() => setSelectedRecipe(null)}
                className="w-full py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
