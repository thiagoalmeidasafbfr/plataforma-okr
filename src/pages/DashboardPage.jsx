import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Users, Target, PlusCircle, X, LogOut, Shield, AlertTriangle, Edit, TrendingUp } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { collection, onSnapshot, addDoc, query, where, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Header = ({ user }) => (
    <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <Target size={32} className="text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800">Plataforma OKR</h1>
            </div>
            <div className="flex items-center space-x-4">
                {user?.role === 'admin' && (
                    <Link to="/admin" className="flex items-center space-x-2 text-sm font-semibold text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-gray-100">
                        <Shield size={20} />
                        <span>Admin</span>
                    </Link>
                )}
                <span className="text-right">
                    <p className="font-semibold">{user?.name || 'A carregar...'}</p>
                    <p className="text-sm text-gray-500 capitalize">{user?.jobTitle || user?.role || ''}</p>
                    {user?.area && <p className="text-xs text-blue-600 font-medium">Área: {user.area}</p>}
                </span>
                <img src={user?.avatar || `https://placehold.co/100x100/E2E8F0/4A5568?text=${user?.name?.charAt(0) || '?'}`} alt="Avatar do utilizador" className="w-12 h-12 rounded-full border-2 border-blue-500" />
                <button onClick={() => signOut(auth)} className="p-2 rounded-full hover:bg-gray-200" title="Sair"><LogOut size={20} className="text-gray-600"/></button>
            </div>
        </div>
    </header>
);

const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4 transition-transform hover:scale-105">
        <div className={`rounded-full p-3 ${color}`}>{icon}</div>
        <div><p className="text-sm text-gray-500 font-medium">{title}</p><p className="text-2xl font-bold text-gray-800">{value}</p></div>
    </div>
);

const ProgressBar = ({ progress, weight }) => {
    const displayProgress = Math.min(progress, 100);
    let colorClass = 'bg-blue-500';
    if (progress >= 100) colorClass = 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    else if (progress < 40) colorClass = 'bg-red-500';
    else if (progress < 70) colorClass = 'bg-yellow-500';
    
    return (
        <div className="w-full space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                <div className={`${colorClass} h-3 rounded-full transition-all duration-500`} style={{ width: `${displayProgress}%` }}></div>
                {progress > 100 && (
                    <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                        <span className="text-xs font-bold text-yellow-800">BÓNUS!</span>
                    </div>
                )}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
                <span>Peso: {weight}%</span>
                <span>{progress}%</span>
            </div>
        </div>
    );
};

const KrTableRow = ({ kr, onSelectKr }) => {
    const currentValue = kr.checkpoints?.reduce((sum, cp) => sum + (cp.value || 0), 0) || 0;
    const progress = kr.targetValue > 0 ? Math.round((currentValue / kr.targetValue) * 100) : 0;

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="py-4 px-6 font-medium text-gray-800 w-1/3">{kr.name}</td>
            <td className="py-4 px-6 text-gray-600">{kr.area || 'N/A'}</td>
            <td className="py-4 px-6 text-center text-gray-600 font-medium">{kr.weight || 0}%</td>
            <td className="py-4 px-6">
                <ProgressBar progress={progress} weight={kr.weight || 0} />
            </td>
            <td className="py-4 px-6"><button onClick={() => onSelectKr(kr)} className="text-blue-600 hover:underline font-semibold flex items-center space-x-1"><Edit size={14}/><span>Detalhes</span></button></td>
        </tr>
    );
};

const KrTable = ({ krs, userProfile }) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
                <h3 className="text-xl font-bold">Metas da {userProfile?.area || 'Área'}</h3>
                <p className="text-sm text-gray-500 mt-1">
                    {userProfile?.role === 'admin' ? 'Visualizando todas as metas' : `Metas específicas da área ${userProfile?.area}`}
                </p>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th scope="col" className="py-3 px-6 w-1/3">Meta</th>
                        <th scope="col" className="py-3 px-6">Área</th>
                        <th scope="col" className="py-3 px-6 text-center">Peso</th>
                        <th scope="col" className="py-3 px-6">Progresso</th>
                        <th scope="col" className="py-3 px-6">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {krs.length > 0 ? krs.map(kr => <KrTableRow key={kr.id} kr={kr} onSelectKr={() => {}} />) : (
                        <tr><td colSpan="5" className="text-center py-10 text-gray-500">Nenhuma meta encontrada para sua área.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const KrDetailModal = ({ isOpen, onClose, kr }) => {
    if (!isOpen) return null;

    const currentValue = kr.checkpoints?.reduce((sum, cp) => sum + (cp.value || 0), 0) || 0;
    const progress = kr.targetValue > 0 ? Math.round((currentValue / kr.targetValue) * 100) : 0;

    // Agregar dados por mês para o gráfico
    const monthlyData = kr.checkpoints?.reduce((acc, cp) => {
        const date = new Date(cp.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        
        if (!acc[monthKey]) {
            acc[monthKey] = { month: monthName, valor: 0, acumulado: 0 };
        }
        acc[monthKey].valor += cp.value || 0;
        return acc;
    }, {}) || {};

    // Calcular valores acumulados
    let accumulated = 0;
    const chartData = Object.values(monthlyData).map(item => {
        accumulated += item.valor;
        return { ...item, acumulado: accumulated };
    });

    const formatValue = (value) => {
        if (kr.unit === 'R$' || kr.unit === '€') {
            return new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: kr.unit === 'R$' ? 'BRL' : 'EUR' 
            }).format(value);
        }
        return `${new Intl.NumberFormat('pt-BR').format(value)} ${kr.unit}`;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{kr.name}</h3>
                        <p className="text-sm text-gray-600">Área: {kr.area} | Peso: {kr.weight}% | Meta: {formatValue(kr.targetValue)}</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 transition">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-gray-800 mb-3">Progresso Atual</h4>
                            <ProgressBar progress={progress} weight={kr.weight} />
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500">Atual</p>
                                    <p className="font-bold text-lg">{formatValue(currentValue)}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <p className="text-gray-500">Faltam</p>
                                    <p className="font-bold text-lg">{formatValue(Math.max(0, kr.targetValue - currentValue))}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h5 className="font-semibold text-blue-800 mb-2">Informações da Meta</h5>
                            <div className="space-y-1 text-sm">
                                <p><span className="font-medium">Diretoria:</span> {kr.diretoria}</p>
                                <p><span className="font-medium">Responsável:</span> {kr.responsavel_apuracao}</p>
                                <p><span className="font-medium">Frequência:</span> {kr.frequencia_apuracao}</p>
                                <p><span className="font-medium">Fonte:</span> {kr.fonte_dados}</p>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800 mb-4">Evolução Mensal</h4>
                        <div className="h-64 mb-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => kr.unit === 'R$' ? `R$${(value/1000000).toFixed(0)}M` : `${value}`} />
                                    <Tooltip formatter={(value) => [formatValue(value), 'Valor']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} name="Mensal" />
                                    <Line type="monotone" dataKey="acumulado" stroke="#10b981" strokeWidth={2} name="Acumulado" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            <h5 className="font-semibold text-gray-700">Histórico de Resultados</h5>
                            {kr.checkpoints?.length > 0 ? (
                                [...kr.checkpoints].reverse().map((cp, index) => (
                                    <div key={index} className="text-sm border-b border-gray-200 pb-2">
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-blue-600">{formatValue(cp.value)}</p>
                                            <span className="text-gray-500 text-xs">{new Date(cp.date).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                        <p className="text-gray-600 italic">"{cp.comment}"</p>
                                        <p className="text-gray-500 text-xs">por {cp.author}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">Nenhum resultado registrado ainda.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function DashboardPage({ userProfile }) {
    const [krs, setKrs] = useState([]);
    const [selectedKr, setSelectedKr] = useState(null);

    useEffect(() => {
        if (!userProfile) return;

        let q;
        if (userProfile.role === 'admin') {
            // Admin pode ver todas as metas
            q = collection(db, 'krs');
        } else if (userProfile.area) {
            // Usuários normais veem apenas metas da sua área
            q = query(collection(db, 'krs'), where("area", "==", userProfile.area));
        } else {
            // Se não tem área definida, não mostra nada
            setKrs([]);
            return;
        }

        const unsubscribeKrs = onSnapshot(q, (snapshot) => {
            const krsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setKrs(krsData);
        });

        return () => unsubscribeKrs();
    }, [userProfile]);

    const calculateWeightedAverage = () => {
        if (krs.length === 0) return 0;
        const totalWeight = krs.reduce((sum, kr) => sum + (kr.weight || 0), 0);
        if (totalWeight === 0) return 0;
        
        const weightedProgress = krs.reduce((sum, kr) => {
            const currentValue = kr.checkpoints?.reduce((s, cp) => s + (cp.value || 0), 0) || 0;
            const progress = kr.targetValue > 0 ? (currentValue / kr.targetValue) * 100 : 0;
            return sum + (progress * ((kr.weight || 0) / totalWeight));
        }, 0);

        return Math.round(weightedProgress);
    };

    const getKrsOnTrack = () => {
        return krs.filter(kr => {
            const currentValue = kr.checkpoints?.reduce((sum, cp) => sum + (cp.value || 0), 0) || 0;
            const progress = kr.targetValue > 0 ? (currentValue / kr.targetValue) * 100 : 0;
            return progress >= 60; // Consideramos "na pista" se >= 60%
        }).length;
    };

    const getKrsWithBonus = () => {
        return krs.filter(kr => {
            const currentValue = kr.checkpoints?.reduce((sum, cp) => sum + (cp.value || 0), 0) || 0;
            const progress = kr.targetValue > 0 ? (currentValue / kr.targetValue) * 100 : 0;
            return progress > 100;
        }).length;
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <Header user={userProfile} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Dashboard - {userProfile?.area || 'Área não definida'}
                    </h2>
                    <p className="text-gray-600">
                        {userProfile?.role === 'admin' 
                            ? 'Visualização completa de todas as metas do clube' 
                            : `Acompanhe o desempenho das metas da área ${userProfile?.area}`
                        }
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        title="Progresso Ponderado" 
                        value={`${calculateWeightedAverage()}%`} 
                        icon={<Target size={24} className="text-blue-600"/>} 
                        color="bg-blue-100" 
                    />
                    <StatCard 
                        title="Metas na Pista" 
                        value={`${getKrsOnTrack()}/${krs.length}`} 
                        icon={<CheckCircle2 size={24} className="text-green-600"/>} 
                        color="bg-green-100" 
                    />
                    <StatCard 
                        title="Metas com Bônus" 
                        value={getKrsWithBonus()} 
                        icon={<TrendingUp size={24} className="text-yellow-600"/>} 
                        color="bg-yellow-100" 
                    />
                    <StatCard 
                        title="Total de Metas" 
                        value={krs.length} 
                        icon={<Users size={24} className="text-indigo-600"/>} 
                        color="bg-indigo-100" 
                    />
                </div>
                
                {userProfile?.area || userProfile?.role === 'admin' ? (
                    <KrTable krs={krs} userProfile={userProfile} onSelectKr={setSelectedKr} />
                ) : (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-r-lg">
                        <div className="flex">
                            <div className="py-1">
                                <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
                            </div>
                            <div>
                                <p className="font-bold text-yellow-800">Área não definida</p>
                                <p className="text-sm text-yellow-700">
                                    Você ainda não tem uma área associada ao seu perfil. Por favor, entre em contato com um administrador para configurar sua área de acesso.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <KrDetailModal 
                isOpen={!!selectedKr} 
                onClose={() => setSelectedKr(null)} 
                kr={selectedKr} 
            />
        </div>
    );
}