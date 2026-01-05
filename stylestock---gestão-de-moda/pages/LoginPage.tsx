import React, { useState } from 'react';

// User types
export type UserRole = 'admin' | 'vendedor';

export interface User {
    username: string;
    role: UserRole;
    name: string;
}

// Predefined users
const USERS: Record<string, { password: string; role: UserRole; name: string }> = {
    'admin': { password: 'admin123', role: 'admin', name: 'Administrador' },
    'vendedor': { password: 'vendedor123', role: 'vendedor', name: 'Vendedor' },
};

interface LoginPageProps {
    onLogin: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate loading
        setTimeout(() => {
            const user = USERS[username.toLowerCase()];

            if (user && user.password === password) {
                onLogin({
                    username: username.toLowerCase(),
                    role: user.role,
                    name: user.name,
                });
            } else {
                setError('Usuário ou senha incorretos');
            }

            setLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-600/30">
                            S
                        </div>
                        <h1 className="text-3xl font-bold text-white">StyleStock</h1>
                    </div>
                    <p className="text-slate-400">Sistema de Gestão de Moda</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white mb-6 text-center">
                        Entrar no Sistema
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Usuário
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Digite seu usuário"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Senha
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha"
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Entrando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>
                </div>

                {/* Help text */}
                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-sm">
                        Credenciais de acesso:
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-slate-400">
                        <p><span className="text-blue-400 font-medium">Admin:</span> admin / admin123</p>
                        <p><span className="text-emerald-400 font-medium">Vendedor:</span> vendedor / vendedor123</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
