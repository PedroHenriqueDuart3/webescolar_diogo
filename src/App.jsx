import { useState, useEffect } from 'react';
import './App.css';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { storage } from './utils/storage';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('alunos');

  useEffect(() => {
    const savedUser = storage.getAuth();
    if (savedUser) {
      loadUserWithSubject(savedUser);
    }
  }, []);

  const loadUserWithSubject = async (userData) => {
    try {
      if (userData.type === 'professor') {
        // Busca informações completas do professor
        const professores = await import('./utils/api').then(m => m.getProfessores());
        const professor = professores.find(p => p.id === userData.id);

        if (professor && professor.disciplina) {
          userData.subject = professor.disciplina;
          storage.setAuth(userData);
        }
      }

      setUser(userData);
      setCurrentPage(userData.type === 'professor' ? 'dashboard' : 'student');
      setActiveTab(userData.type === 'professor' ? 'alunos' : 'notas');
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      setUser(userData);
      setCurrentPage(userData.type === 'professor' ? 'dashboard' : 'student');
      setActiveTab(userData.type === 'professor' ? 'alunos' : 'notas');
    }
  };

  const handleLogin = async (userData) => {
    if (userData) {
      try {
        if (userData.type === 'professor') {
          // Busca informações completas do professor
          const { getProfessores } = await import('./utils/api');
          const professores = await getProfessores();
          const professor = professores.find(p => p.id === userData.id);

          if (professor && professor.disciplina) {
            userData.subject = professor.disciplina;
          }
        }

        storage.setAuth(userData);
        setUser(userData);
        setCurrentPage(userData.type === 'professor' ? 'dashboard' : 'student');
        setActiveTab(userData.type === 'professor' ? 'alunos' : 'notas');
        showMessage('Login realizado com sucesso!', 'success');
      } catch (error) {
        console.error('Erro ao carregar dados do professor:', error);
        storage.setAuth(userData);
        setUser(userData);
        setCurrentPage(userData.type === 'professor' ? 'dashboard' : 'student');
        setActiveTab(userData.type === 'professor' ? 'alunos' : 'notas');
        showMessage('Login realizado com sucesso!', 'success');
      }
    } else {
      showMessage('Usuário ou senha incorretos', 'error');
    }
  };

  const handleRegister = (userData) => {
    showMessage('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
    setCurrentPage('login');
  };

  const handleLogout = () => {
    storage.clearAuth();
    setUser(null);
    setCurrentPage('login');
    showMessage('Logout realizado com sucesso!', 'success');
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  return (
    <div className="app">
      {user && (
        <Header
          user={user}
          onLogout={handleLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {message.text && (
        <div className={`app-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {currentPage === 'login' && (
        <Login
          onLogin={handleLogin}
          onSwitchToRegister={() => setCurrentPage('register')}
        />
      )}

      {currentPage === 'register' && (
        <Register
          onRegister={handleRegister}
          onSwitchToLogin={() => setCurrentPage('login')}
        />
      )}

      {currentPage === 'dashboard' && user?.type === 'professor' && (
        <ProfessorDashboard
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {currentPage === 'student' && user?.type === 'aluno' && (
        <StudentDashboard
          user={user}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}
    </div>
  );
}

export default App;