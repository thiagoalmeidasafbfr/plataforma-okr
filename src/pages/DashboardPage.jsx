import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, Users, Target, PlusCircle, X, LogOut, Shield, AlertTriangle, Edit } from 'lucide-react';
import { db, auth } from '../firebase/config';
import { collection, onSnapshot, addDoc, query, where, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

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
                    <p className="font-semibold">{user?.name || 'Carregando...'}</p>
                    <p className="text-sm text-gray-500 capitalize">{user?.role || ''}</p>
                </span>
                <img src={user?.avatar || `https://placehold.co/100x100/E2E8F0/4A5568?text=${user?.name?.charAt(0) || '?'}`} alt="Avatar do usuário" className="w-12 h-12 rounded-full border-2 border-blue-500" />
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

const ProgressBar = ({ value }) => {
    const cappedValue = Math.min(Math.max(value, 0), 100);
    let colorClass = 'bg-blue-500';
    if (cappedValue < 40) colorClass = 'bg-red-500';
    else if (cappedValue < 70) colorClass = 'bg-yellow-500';
    else colorClass = 'bg-green-500';
    return <div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${cappedValue}%` }}></div></div>;
};

const KrTableRow = ({ kr, onSelectKr }) => {
    const statusMap = {
        'Aprovado': { icon: <CheckCircle2 size={20} className="text-green-500" />, text: 'text-green-600' },
        'Pendente': { icon: <Clock size={20} className="text-yellow-500" />, text: 'text-yellow-600' },
    };
    const statusInfo = statusMap[kr.status] || statusMap['Pendente'];
    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="py-4 px-6 font-medium text-gray-800">{kr.name}</td>
            <td className="py-4 px-6 text-gray-600">{kr.ownerName}</td>
            <td className="py-4 px-6"><div className="flex items-center space-x-2"><ProgressBar value={kr.progress} /><span className="font-semibold text-sm text-gray-700">{kr.progress}%</span></div></td>
            <td className="py-4 px-6"><span className={`inline-flex items-center space-x-1.5 py-1 px-3 rounded-full text-xs font-medium ${statusInfo.text} bg-gray-100`}>{statusInfo.icon}<span>{kr.status}</span></span></td>
            <td className="py-4 px-6 text-gray-600">{kr.deadline}</td>
            <td className="py-4 px-6"><button onClick={() => onSelectKr(kr)} className="text-blue-600 hover:underline font-semibold flex items-center space-x-1"><Edit size={14}/><span>Detalhes</span></button></td>
        </tr>
    );
};

const KrTable = ({ krs, onCreateKr, onSelectKr }) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-xl font-bold">Key Results da Equipe</h3>
            <div className="flex items-center space-x-2">
                <button onClick={onCreateKr} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"><PlusCircle size={16} /><span>Criar KR</span></button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr><th scope="col" className="py-3 px-6">Key Result</th><th scope="col" className="py-3 px-6">Responsável</th><th scope="col" className="py-3 px-6">Progresso</th><th scope="col" className="py-3 px-6">Status</th><th scope="col" className="py-3 px-6">Prazo Final</th><th scope="col" className="py-3 px-6">Ações</th></tr>
                </thead>
                <tbody>
                    {krs.length > 0 ? krs.map(kr => <KrTableRow key={kr.id} kr={kr} onSelectKr={onSelectKr} />) : (
                        <tr><td colSpan="6" className="text-center py-10 text-gray-500">Nenhum KR encontrado para esta equipe.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);

const CreateKrModal = ({ isOpen, onClose, onSave, userProfile }) => {
    if (!isOpen) return null;
    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const newKr = {
            name: formData.get('name'),
            ownerId: userProfile.uid,
            ownerName: userProfile.name,
            teamId: userProfile.teamId,
            progress: 0,
            status: 'Pendente',
            deadline: new Date(formData.get('deadline')).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        };
        onSave(newKr);
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"><form onSubmit={handleSubmit}><div className="p-6 border-b border-gray-200 flex justify-between items-center"><h3 className="text-xl font-bold">Criar Novo Key Result</h3><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div><div className="p-6 space-y-4"><div><label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do KR</label><input type="text" name="name" id="name" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><div><label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Prazo Final</label><input type="date" name="deadline" id="deadline" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div></div><div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3"><button type="button" onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition">Cancelar</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">Salvar KR</button></div></form></div>
        </div>
    );
};

const KrDetailModal = ({ isOpen, onClose, onSave, kr }) => {
    if (!isOpen) return null;

    const [progress, setProgress] = useState(kr.progress || 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(kr.id, { progress: Number(progress) });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold">Detalhes do KR</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <h4 className="font-semibold">{kr.name}</h4>
                            <p className="text-sm text-gray-500">Responsável: {kr.ownerName}</p>
                        </div>
                        <div>
                            <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-1">Progresso Atual (%)</label>
                            <input 
                                id="progress" 
                                name="progress" 
                                type="number"
                                min="0"
                                max="100"
                                value={progress}
                                onChange={(e) => setProgress(e.target.value)}
                                required 
                                className="w-full border p-2 rounded-md"
                            />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end">
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Progresso</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function DashboardPage({ userProfile }) {
    const [krs, setKrs] = useState([]);
    const [team, setTeam] = useState(null);
    const [isCreateModalOpen, setCreateIsModalOpen] = useState(false);
    const [selectedKr, setSelectedKr] = useState(null);

    useEffect(() => {
        if (!userProfile?.teamId) return;
        
        const krsCollectionRef = collection(db, 'krs');
        const q = query(krsCollectionRef, where("teamId", "==", userProfile.teamId));
        const unsubscribeKrs = onSnapshot(q, (snapshot) => {
            const krsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setKrs(krsData);
        });
        
        const teamDocRef = doc(db, 'teams', userProfile.teamId);
        const unsubscribeTeam = onSnapshot(teamDocRef, (doc) => {
            if (doc.exists()) {
                setTeam({ id: doc.id, ...doc.data() });
            }
        });

        return () => { unsubscribeKrs(); unsubscribeTeam(); };
    }, [userProfile]);

    const handleSaveKr = async (newKrData) => {
        if (!userProfile || !userProfile.teamId) {
            alert("Erro: Perfil do usuário ou time não encontrado. Peça a um admin para associar seu perfil a um time.");
            return;
        }
        try {
            await addDoc(collection(db, 'krs'), newKrData);
            setCreateIsModalOpen(false);
        } catch (error) {
            console.error("Erro ao salvar KR:", error);
            alert("Ocorreu um erro ao salvar a meta.");
        }
    };

    const handleUpdateKr = async (krId, updatedData) => {
        const krDocRef = doc(db, 'krs', krId);
        try {
            await updateDoc(krDocRef, updatedData);
            alert("Progresso atualizado com sucesso!");
            setSelectedKr(null);
        } catch (error) {
            console.error("Erro ao atualizar KR:", error);
            alert("Ocorreu um erro ao atualizar o progresso.");
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <Header user={userProfile} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold mb-2">Dashboard do Time: {team?.name || '...'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
                    <StatCard title="Progresso Médio" value={`${krs.length > 0 ? Math.round(krs.reduce((acc, kr) => acc + kr.progress, 0) / krs.length) : 0}%`} icon={<Target size={24} className="text-blue-600"/>} color="bg-blue-100" />
                    <StatCard title="Metas na Pista" value={krs.length} icon={<CheckCircle2 size={24} className="text-green-600"/>} color="bg-green-100" />
                    <StatCard title="Membros da Equipe" value={team?.memberCount || "-"} icon={<Users size={24} className="text-indigo-600"/>} color="bg-indigo-100" />
                </div>
                {userProfile?.teamId ? (
                    <KrTable krs={krs} onCreateKr={() => setCreateIsModalOpen(true)} onSelectKr={setSelectedKr} />
                ) : (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <div className="flex">
                            <div className="py-1"><AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" /></div>
                            <div>
                                <p className="font-bold">Perfil Incompleto</p>
                                <p className="text-sm">Você ainda não está associado a um time. Por favor, peça a um administrador para configurar seu perfil no painel de administração.</p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
            <CreateKrModal isOpen={isCreateModalOpen} onClose={() => setCreateIsModalOpen(false)} onSave={handleSaveKr} userProfile={userProfile} />
            <KrDetailModal isOpen={!!selectedKr} onClose={() => setSelectedKr(null)} onSave={handleUpdateKr} kr={selectedKr} />
        </div>
    );
}