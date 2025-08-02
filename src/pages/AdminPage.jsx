// ===================================================================
// ARQUIVO: src/pages/AdminPage.jsx
// ATUALIZADO: Implementada uma lógica de chamada à Cloud Function mais robusta e segura.
// ===================================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, functions, auth } from '../firebase/config'; // Importa `auth`
import { httpsCallable } from "firebase/functions";
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Home, UserPlus, Users as TeamIcon, X, Edit, Loader2 } from 'lucide-react';

const EditUserModal = ({ isOpen, onClose, onSave, user, teams }) => {
    if (!isOpen) return null;
    const [formData, setFormData] = useState({ 
        name: user.name || '', 
        role: user.role || 'colaborador', 
        jobTitle: user.jobTitle || '',
        teamId: user.teamId || '' 
    });
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
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center"><h3 className="text-xl font-bold">Editar Utilizador</h3><button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button></div>
                    <div className="p-6 space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Email (não editável)</label><input type="email" disabled value={user.email} className="w-full bg-gray-100 border p-2 rounded-md"/></div>
                        <div><label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label><input id="edit-name" name="name" value={formData.name} onChange={handleChange} required className="w-full border p-2 rounded-md"/></div>
                        <div>
                            <label htmlFor="edit-role" className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                            <select id="edit-role" name="role" value={formData.role} onChange={handleChange} required className="w-full border p-2 rounded-md">
                                <option value="colaborador">Colaborador</option>
                                <option value="gestor">Gestor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="edit-jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                            <select id="edit-jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} required className="w-full border p-2 rounded-md">
                                <option value="">Selecione um cargo</option>
                                <option value="Analista Jr">Analista Jr</option>
                                <option value="Analista Pleno">Analista Pleno</option>
                                <option value="Analista Sr">Analista Sr</option>
                                <option value="Especialista">Especialista</option>
                                <option value="Coordenador">Coordenador</option>
                                <option value="Gerente">Gerente</option>
                            </select>
                        </div>
                        <div><label htmlFor="edit-teamId" className="block text-sm font-medium text-gray-700 mb-1">Equipa</label><select id="edit-teamId" name="teamId" value={formData.teamId} onChange={handleChange} required className="w-full border p-2 rounded-md"><option value="">Nenhuma equipa</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select></div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end"><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Guardar Alterações</button></div>
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
    const [creationError, setCreationError] = useState("");

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
        setCreationError("");

        try {
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error("Utilizador não autenticado. Por favor, faça login novamente.");
            }

            // Força a atualização do token de autenticação para garantir que está válido.
            await currentUser.getIdToken(true);

            const createUserCallable = httpsCallable(functions, 'createUser');
            const formData = new FormData(e.target);

            const result = await createUserCallable({
                email: formData.get('email'),
                password: formData.get('password'),
                name: formData.get('name'),
                role: formData.get('role'),
                jobTitle: formData.get('jobTitle'),
                teamId: formData.get('teamId'),
            });

            alert(result.data.result);
            e.target.reset();
        } catch (error) {
            console.error("Erro detalhado ao criar utilizador:", error);
            setCreationError(`Erro: ${error.message}. Verifique os registos da função e o console do navegador.`);
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
            alert(`Equipa "${newTeam.name}" criada com sucesso!`);
            e.target.reset();
        } catch (error) {
            console.error("Erro ao criar equipa:", error);
            alert("Ocorreu um erro ao criar a equipa.");
        }
    };

    const handleUpdateUser = async (userId, updatedData) => {
        const userDocRef = doc(db, 'users', userId);
        try {
            await updateDoc(userDocRef, updatedData);
            alert("Utilizador atualizado com sucesso!");
            setEditingUser(null);
        } catch (error) {
            console.error("Erro ao atualizar utilizador:", error);
            alert("Ocorreu um erro ao atualizar o utilizador.");
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
                            <h2 className="text-xl font-bold mb-4">Gerir Utilizadores</h2>
                            <form onSubmit={handleCreateUser} className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-semibold flex items-center space-x-2"><UserPlus size={20}/><span>Criar Novo Utilizador</span></h3>
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
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                                    <select id="role" name="role" required defaultValue="" className="w-full border p-2 rounded-md"><option value="" disabled>Selecione um perfil</option><option value="colaborador">Colaborador</option><option value="gestor">Gestor</option><option value="admin">Admin</option></select>
                                </div>
                                <div>
                                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                                    <select id="jobTitle" name="jobTitle" required defaultValue="" className="w-full border p-2 rounded-md">
                                        <option value="" disabled>Selecione um cargo</option>
                                        <option value="Analista Jr">Analista Jr</option>
                                        <option value="Analista Pleno">Analista Pleno</option>
                                        <option value="Analista Sr">Analista Sr</option>
                                        <option value="Especialista">Especialista</option>
                                        <option value="Coordenador">Coordenador</option>
                                        <option value="Gerente">Gerente</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="teamId" className="block text-sm font-medium text-gray-700 mb-1">Equipa</label>
                                    <select id="teamId" name="teamId" required defaultValue="" className="w-full border p-2 rounded-md"><option value="" disabled>Selecione uma equipa</option>{teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                                </div>
                                {creationError && <p className="text-red-500 text-sm">{creationError}</p>}
                                <button type="submit" disabled={isCreatingUser} className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 flex justify-center items-center disabled:bg-blue-300">
                                    {isCreatingUser ? <Loader2 className="animate-spin" /> : 'Criar Utilizador'}
                                </button>
                            </form>
                            <ul className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                                {users.map(user => (
                                    <li key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                        <div><p className="font-medium">{user.name}</p><p className="text-xs text-gray-500">{user.jobTitle || user.email}</p></div>
                                        <div className="flex items-center space-x-2"><span className="text-sm font-medium bg-gray-200 px-2 py-1 rounded-full capitalize">{user.role}</span><button onClick={() => setEditingUser(user)} className="p-1 text-gray-500 hover:text-blue-600"><Edit size={16}/></button></div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                             <h2 className="text-xl font-bold mb-4">Gerir Equipas</h2>
                             <form onSubmit={handleCreateTeam} className="space-y-4 p-4 border rounded-lg">
                                <h3 className="font-semibold flex items-center space-x-2"><TeamIcon size={20}/><span>Criar Nova Equipa</span></h3>
                                <div>
                                    <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">Nome da Equipa</label>
                                    <input id="teamName" name="teamName" required className="w-full border p-2 rounded-md"/>
                                </div>
                                <div>
                                    <label htmlFor="leaderId" className="block text-sm font-medium text-gray-700 mb-1">Líder da Equipa</label>
                                    <select id="leaderId" name="leaderId" required className="w-full border p-2 rounded-md"><option value="">Selecione um líder</option>{users.filter(u => u.role === 'admin' || u.role === 'gestor').map(leader => <option key={leader.id} value={leader.id}>{leader.name}</option>)}</select>
                                </div>
                                <button type="submit" className="w-full bg-green-600 text-white p-2 rounded-lg hover:bg-green-700">Criar Equipa</button>
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
