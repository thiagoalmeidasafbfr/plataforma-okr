import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Users, Target, PlusCircle, Filter, ChevronDown, FileDown, X } from 'lucide-react';

// --- DADOS INICIAIS (Mocando uma API) ---
const initialUser = {
    name: 'Thiago Almeida',
    role: 'Gerente de Performance',
    avatar: `https://placehold.co/100x100/E2E8F0/4A5568?text=TA`
};

const initialKrs = [
    { id: 1, name: 'Aumentar a receita recorrente (MRR) em 15%', owner: 'Ana Silva', progress: 85, status: 'Aprovado', deadline: '30/09/2025' },
    { id: 2, name: 'Reduzir o Churn Rate para 2%', owner: 'Carlos Souza', progress: 35, status: 'Aprovado', deadline: '31/12/2025' },
    { id: 3, name: 'Aumentar o NPS de 70 para 85', owner: 'Mariana Lima', progress: 65, status: 'Aprovado', deadline: '31/12/2025' },
    { id: 4, name: 'Implementar novo módulo de relatórios no sistema', owner: 'Pedro Costa', progress: 0, status: 'Pendente', deadline: '15/10/2025' },
    { id: 5, name: 'Otimizar o custo de aquisição de clientes (CAC) em 10%', owner: 'Juliana Alves', progress: 50, status: 'Aprovado', deadline: '30/11/2025' },
];

// --- COMPONENTES DE UI ---

// Componente: Cabeçalho da Página
const Header = ({ user }) => (
    <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <Target size={32} className="text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-800">Plataforma OKR</h1>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-right">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.role}</p>
                </span>
                <img src={user.avatar} alt="Avatar do usuário" className="w-12 h-12 rounded-full border-2 border-blue-500" />
            </div>
        </div>
    </header>
);

// Componente: Card de Estatística
const StatCard = ({ title, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm flex items-center space-x-4 transition-transform hover:scale-105">
        <div className={`rounded-full p-3 ${color}`}>{icon}</div>
        <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

// Componente: Barra de Progresso
const ProgressBar = ({ value }) => {
    const cappedValue = Math.min(Math.max(value, 0), 100);
    let colorClass = 'bg-blue-500';
    if (cappedValue < 40) colorClass = 'bg-red-500';
    else if (cappedValue < 70) colorClass = 'bg-yellow-500';
    else colorClass = 'bg-green-500';

    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5"><div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${cappedValue}%` }}></div></div>
    );
};

// Componente: Linha da Tabela de KR
const KrTableRow = ({ kr, onSelectKr }) => {
    const statusMap = {
        'Aprovado': { icon: <CheckCircle2 size={20} className="text-green-500" />, text: 'text-green-600' },
        'Pendente': { icon: <Clock size={20} className="text-yellow-500" />, text: 'text-yellow-600' },
        'Rejeitado': { icon: <XCircle size={20} className="text-red-500" />, text: 'text-red-600' },
    };
    const statusInfo = statusMap[kr.status];

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="py-4 px-6 font-medium text-gray-800">{kr.name}</td>
            <td className="py-4 px-6 text-gray-600">{kr.owner}</td>
            <td className="py-4 px-6">
                <div className="flex items-center space-x-2">
                    <ProgressBar value={kr.progress} />
                    <span className="font-semibold text-sm text-gray-700">{kr.progress}%</span>
                </div>
            </td>
            <td className="py-4 px-6">
                <span className={`inline-flex items-center space-x-1.5 py-1 px-3 rounded-full text-xs font-medium ${statusInfo.text} bg-gray-100`}>{statusInfo.icon}<span>{kr.status}</span></span>
            </td>
            <td className="py-4 px-6 text-gray-600">{kr.deadline}</td>
            <td className="py-4 px-6"><button onClick={() => onSelectKr(kr)} className="text-blue-600 hover:underline font-semibold">Detalhes</button></td>
        </tr>
    );
};

// Componente: Tabela de KRs
const KrTable = ({ krs, onCreateKr, onSelectKr }) => (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-xl font-bold">Key Results da Equipe</h3>
            <div className="flex items-center space-x-2">
                <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition"><Filter size={16} /><span>Filtrar</span></button>
                <button className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition"><FileDown size={16} /><span>Exportar</span></button>
                <button onClick={onCreateKr} className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"><PlusCircle size={16} /><span>Criar KR</span></button>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                    <tr>
                        <th scope="col" className="py-3 px-6">Key Result</th><th scope="col" className="py-3 px-6">Responsável</th><th scope="col" className="py-3 px-6">Progresso</th><th scope="col" className="py-3 px-6">Status</th><th scope="col" className="py-3 px-6">Prazo Final</th><th scope="col" className="py-3 px-6">Ações</th>
                    </tr>
                </thead>
                <tbody>{krs.map(kr => <KrTableRow key={kr.id} kr={kr} onSelectKr={onSelectKr} />)}</tbody>
            </table>
        </div>
        <div className="p-4 border-t border-gray-200 flex justify-between items-center text-sm">
            <span className="text-gray-600">Mostrando 1-{krs.length} de {krs.length} resultados</span>
            <div className="flex space-x-1"><button className="px-3 py-1 border rounded-md bg-gray-100">Anterior</button><button className="px-3 py-1 border rounded-md bg-blue-500 text-white">1</button><button className="px-3 py-1 border rounded-md bg-gray-100">Próximo</button></div>
        </div>
    </div>
);

// Componente: Modal de Criação de KR
const CreateKrModal = ({ isOpen, onClose, onSave }) => {
    if (!isOpen) return null;

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const newKr = {
            id: Date.now(), // ID único temporário
            name: formData.get('name'),
            owner: formData.get('owner'),
            progress: 0,
            status: 'Pendente',
            deadline: new Date(formData.get('deadline')).toLocaleDateString('pt-BR', {timeZone: 'UTC'}),
        };
        onSave(newKr);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 flex justify-center items-center">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg m-4">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold">Criar Novo Key Result</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X size={24} /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome do KR</label>
                            <input type="text" name="name" id="name" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Aumentar o engajamento em 20%" />
                        </div>
                        <div>
                            <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                            <input type="text" name="owner" id="owner" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: João da Silva" />
                        </div>
                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">Prazo Final</label>
                            <input type="date" name="deadline" id="deadline" required className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition">Cancelar</button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm">Salvar KR</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL DA APLICAÇÃO ---
export default function App() {
    const [krs, setKrs] = useState(initialKrs);
    const [isCreateModalOpen, setCreateIsModalOpen] = useState(false);
    const [selectedKr, setSelectedKr] = useState(null); // Para o modal de detalhes

    const handleCreateKr = () => {
        setCreateIsModalOpen(true);
    };

    const handleCloseCreateModal = () => {
        setCreateIsModalOpen(false);
    };


    const handleSaveKr = (newKr) => {
        setKrs(prevKrs => [...prevKrs, newKr]);
        setCreateIsModalOpen(false);
    };

    const handleSelectKr = (kr) => {
        setSelectedKr(kr);
    };

    const handleCloseDetailModal = () => {
        setSelectedKr(null);
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans text-gray-800">
            <Header user={initialUser} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h2 className="text-3xl font-bold mb-2">Dashboard do Time de Produto</h2>
                <p className="text-gray-600 mb-8">Visão geral do progresso e metas da sua equipe.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Progresso Médio do Time" value="59%" icon={<Target size={24} className="text-blue-600"/>} color="bg-blue-100" />
                    <StatCard title="Metas Aprovadas" value="4" icon={<CheckCircle2 size={24} className="text-green-600"/>} color="bg-green-100" />
                    <StatCard title="Metas Pendentes" value="1" icon={<Clock size={24} className="text-yellow-600"/>} color="bg-yellow-100" />
                    <StatCard title="Membros da Equipe" value="5" icon={<Users size={24} className="text-indigo-600"/>} color="bg-indigo-100" />
                </div>
                <KrTable krs={krs} onCreateKr={handleCreateKr} onSelectKr={handleSelectKr} />
            </main>
            <CreateKrModal isOpen={isCreateModalOpen} onClose={handleCloseCreateModal} onSave={handleSaveKr} />
        </div>
    );
}
