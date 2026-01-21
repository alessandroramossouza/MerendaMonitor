import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, Loader2, Utensils } from 'lucide-react';

interface LoginProps {
    onLoginSuccess: (session: any, role: 'admin' | 'cook') => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            if (data.session) {
                // Fetch User Role
                // Check profiles table first
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.session.user.id)
                    .single();

                // Check metadata as fallback
                const role = profile?.role || data.session.user.user_metadata?.role || 'cook';

                onLoginSuccess(data.session, role as 'admin' | 'cook');
            }
        } catch (err: any) {
            setError(err.message === 'Invalid login credentials'
                ? 'Email ou senha incorretos.'
                : 'Erro ao conectar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-green-800 p-8 text-center">
                    <div className="inline-flex p-4 bg-green-700 rounded-full mb-4 shadow-inner">
                        <Utensils className="w-12 h-12 text-green-100" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">MerendaMonitor</h1>
                    <p className="text-green-200 mt-2">Sistema de Gestão Escolar</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Institucional</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    placeholder="seu.email@escola.gov.br"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex justify-center items-center"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Acessar Sistema'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-400">
                        <p>Esqueceu a senha? Contate a Secretaria de Educação.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
