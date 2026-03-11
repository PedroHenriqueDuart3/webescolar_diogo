import { useState } from 'react';
import { FaUser } from 'react-icons/fa';
import '../styles/Header.css';

export const Header = ({ user, onLogout, activeTab, setActiveTab }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    <h1 className="logo-text">Sistema Escolar</h1>

                    {user?.type === 'professor' && (
                        <nav className="nav-tabs">
                            <button
                                className={`nav-tab ${activeTab === 'alunos' ? 'active' : ''}`}
                                onClick={() => setActiveTab('alunos')}
                            >
                                Alunos
                            </button>
                            <button
                                className={`nav-tab ${activeTab === 'notas' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notas')}
                            >
                                Notas
                            </button>
                            <button
                                className={`nav-tab ${activeTab === 'observacoes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('observacoes')}
                            >
                                Observações
                            </button>
                            <button
                                className={`nav-tab ${activeTab === 'bi' ? 'active' : ''}`}
                                onClick={() => setActiveTab('bi')}
                            >
                                BI
                            </button>
                        </nav>
                    )}

                    {user?.type === 'student' && (
                        <nav className="nav-tabs">
                            <button
                                className={`nav-tab ${activeTab === 'notas' ? 'active' : ''}`}
                                onClick={() => setActiveTab('notas')}
                            >
                                Minhas Notas
                            </button>
                            <button
                                className={`nav-tab ${activeTab === 'observacoes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('observacoes')}
                            >
                                Minhas Observações
                            </button>
                        </nav>
                    )}
                </div>

                {user && (
                    <div className="user-menu">
                        <button
                            className="user-button"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <div className="user-info-header">
                                <span className="user-name-header">{user.name}</span>
                                <span className="user-type-header">
                                    {user.type === 'professor' ? 'Professor' : 'Aluno'}
                                </span>
                            </div>
                            <div className="user-avatar">
                                <FaUser />
                            </div>
                        </button>

                        {menuOpen && (
                            <div className="dropdown-menu">
                                <div className="dropdown-item user-info">
                                    <strong>{user.name}</strong>
                                    <small>{user.email}</small>
                                    {user.matricula && <small>Matrícula: {user.matricula}</small>}
                                    {user.subject && <small>Disciplina: {user.subject}</small>}
                                </div>
                                <button
                                    className="dropdown-item logout-btn"
                                    onClick={onLogout}
                                >
                                    Sair
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};
