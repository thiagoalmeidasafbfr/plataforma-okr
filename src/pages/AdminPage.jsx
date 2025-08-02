import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase/config';
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Home, UserPlus, Users as TeamIcon, X, Edit, Loader2 } from 'lucide-react';

const EditUserModal = ({ isOpen, onClose, onSave, user, teams }) => {
    if (!isOpen) return null;
    const [formData, setFormData] = useState({ name: user.name || '', role: user.role || 'colaborador', teamId: user.teamId || '' });
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(user.id, formData);
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center"><h3 className="text-xl font-bold">Editar Usuário</h3><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
                    <div className="p-6 space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email (não editável)</label><input type="email" disabled value={user.email} className="w-full bg-gray-100 border p-2 rounded-md"/></div>
                        <div><label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label><input id="edit-name" name="name" value={formData.name} onChange={handleChange} required className="w-full border p-2 rounded-md"/></div>
                        <div><label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">Cargo</label><select id="edit-role" name="role" value={formData.role} onChange={handleChange} required className="w-full border p-2 rounded-md"><option value="colaborador">Colaborador</option><option value="admin">Admin</option></select></div>
                        <div><label htmlFor="edit-teamId" className="block text-sm font-medium text-gray-700 mb-1">Time</label><select id="edit-teamId" name="teamId" value={formData.teamId} onChange={handleChange} required className="w-full border p-2 rounded-md"><option value="">Nenhum time</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Salvar Alterações</button></div>
                </form>
            </div>
        </div>
    );
};

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [teams, setTeams] = useState([]);
    const [editingUser, setEditingUser] = useState(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    useEffect(() => {
        const unsubUsers = onSnapshot(collection(db, 'users'), snapshot => {
            setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        const unsubTeams = onSnapshot(collection(db, 'teams'), snapshot => {
            setTeams(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => { unsubUsers(); unsubTeams(); };
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsCreatingUser(true);
        const formData = new FormData(e.target);
        
        const functions = getFunctions();
        const createUserCallable = httpsCallable(functions, 'createUser');

        try {
            const result = await createUserCallable({
                email: formData.get('email'),
                password: formData.get('password'),
                name: formData.get('name'),
                role: formData.get('role'),
                teamId: formData.get('teamId'),
            });
            alert(result.data.result);
            e.target.reset();
        } catch (error) {
            console.error("Erro ao chamar a Cloud Function:", error);
            alert(`Erro: ${error.message}. Verifique se a Cloud Function 'createUser' foi implementada e está ativa.`);
        } finally {
            setIsCreatingUser(false);
        }
    };
    
    const handleCreateTeam = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const newTeam = { name: formData.get('teamName'), leaderId: formData.get('leaderId'), memberCount: 0 };
        try {
            await addDoc(collection(db, 'teams'), newTeam);
            alert(`Time "${newTeam.name}" criado com sucesso!`);
            e.target.reset();
        } catch (error) {
            console.error("Erro ao criar time:", error);
            alert("Ocorreu um erro ao criar o time.");
        }
    };

    const handleUpdateUser = async (userId, updatedData) => {
        const userDocRef = doc(db, 'users', userId);
        try {
            await updateDoc(userDocRef, updatedData);
            alert("Usuário atualizado com sucesso!");
            setEditingUser(null);
        } catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            alert("Ocorreu um erro ao atualizar o usuário.");
        }
    };

    return (
        <>
            <div className="bg-gray-50 min-h-screen p-8">
                <div className="max-w-7xl mx-auto">
                    <Link to="/" className="inline-flex items-center space-x-2 text-blue-600 hover:underline mb-8"><Home size={16}/><span>Voltar ao Dashboard</span></Link>
                    <h1 className="text-3xl font-bold mb-8">Painel de Administração</h1>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-bold mb-4">Gerenciar Usuários</h2>
                            <form onSubmit={handleCreateUser} className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-semibold flex items-center space-x-2"><UserPlus size={20}/><span>Criar Novo Usuário</span></h3>
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                    <input id="name" name="name" required className="w-full border p-2 rounded-md"/>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input id="email" name="email" type="email" required className="w-full border p-2 rounded-md"/>
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                                    <input id="password" name="password" type="password" required placeholder="Mín. 6 caracteres" className="w-full border p-2 rounded-md"/>
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                                    <select id="role" name="role" required className="w-full border p-2 rounded-md"><option value="">Selecione um cargo</option><option value="colaborador">Colaborador</option><option value="admin">Admin</option></select>
                                </div>
                                <div>
                                    <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                    <select id="teamId" name="teamId" required className="w-full border p-2 rounded-md"><option value="">Selecione um time</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                                </div>
                                <button type="submit" disabled={isCreatingUser} className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 flex justify-center items-center disabled:bg-blue-300">
                                    {isCreatingUser ? <Loader2 className="animate-spin" /> : 'Criar Usuário'}
                                </button>
                            </form>
                            <ul className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                                {users.map(user => (
                                    <li key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                        <div><p className="font-medium">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                                        <div className="flex items-center space-x-2"><span className="text-sm font-medium bg-gray-200 px-2 py-1 rounded-full capitalize">{user.role}</span><button onClick={() => setEditingUser(user)} className="p-1 text-gray-500 hover:text-blue-600"><Edit size={16}/></button></div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                             <h2 className="text-xl font-bold mb-4">Gerenciar Equipes</h2>
                             <form onSubmit={handleCreateTeam} className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-semibold flex items-center space-x-2"><TeamIcon size={20}/><span>Criar Nova Equipe</span></h3>
                                <div>
                                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">Nome da Equipe</label>
                                    <input id="teamName" name="teamName" required className="w-full border p-2 rounded-md"/>
                                </div>
                                <div>
                                    <label htmlFor="leaderId" className="block text-sm font-medium text-gray-700 mb-1">Líder da Equipe</label>
                                    <select id="leaderId" name="leaderId" required className="w-full border p-2 rounded-md"><option value="">Selecione um líder</option>{users.filter(u => u.role === 'admin').map(admin => <option key={admin.id} value={admin.id}>{admin.name}</option>)}</select>
                                </div>
                                <button type="submit" className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">Criar Equipe</button>
                            </form>
                             <ul className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                                {teams.map(team => <li key={team.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md"><span>{team.name}</span></li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <EditUserModal isOpen={!!editingUser} onClose={() => setEditingUser(null)} onSave={handleUpdateUser} user={editingUser} teams={teams} />
        </>
    );
}