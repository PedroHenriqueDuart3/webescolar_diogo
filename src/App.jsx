import { useState, useEffect } from 'react';
import './App.css';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProfessorDashboard } from './pages/ProfessorDashboard';
import { StudentDashboard } from './pages/StudentDashboard';
import { storage } from './utils/storage';

function App() {
  const [paginaAtual, setPaginaAtual] = useState('login');
  const [usuario, setUsuario] = useState(null);
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });
  const [abaAtiva, setAbaAtiva] = useState('alunos');

  useEffect(() => {
    const usuarioSalvo = storage.getAuth();
    if (usuarioSalvo) {
      carregarUsuarioComDisciplina(usuarioSalvo);
    }
  }, []);

  const carregarUsuarioComDisciplina = async (dadosUsuario) => {
    setUsuario(dadosUsuario);
    setPaginaAtual(dadosUsuario.type === 'professor' ? 'dashboard' : 'student');
    setAbaAtiva(dadosUsuario.type === 'professor' ? 'alunos' : 'notas');
  };

  const processarLogin = async (dadosUsuario) => {
    if (dadosUsuario) {
      storage.setAuth(dadosUsuario);
      console.log('Token salvo no storage:', dadosUsuario.token);

      setUsuario(dadosUsuario);
      setPaginaAtual(dadosUsuario.type === 'professor' ? 'dashboard' : 'student');
      setAbaAtiva(dadosUsuario.type === 'professor' ? 'alunos' : 'notas');
      exibirMensagem('Login realizado com sucesso!', 'success');
    } else {
      exibirMensagem('Usuário ou senha incorretos', 'error');
    }
  };

  const processarCadastro = () => {
    exibirMensagem('Cadastro realizado com sucesso! Faça login para continuar.', 'success');
    setPaginaAtual('login');
  };

  const processarLogout = () => {
    storage.clearAuth();
    setUsuario(null);
    setPaginaAtual('login');
    exibirMensagem('Logout realizado com sucesso!', 'success');
  };

  const exibirMensagem = (texto, tipo) => {
    setMensagem({ texto, tipo });
    setTimeout(() => setMensagem({ texto: '', tipo: '' }), 3000);
  };

  return (
    <div className="app">
      {usuario && (
        <Header
          user={usuario}
          onLogout={processarLogout}
          activeTab={abaAtiva}
          setActiveTab={setAbaAtiva}
        />
      )}

      {mensagem.texto && (
        <div className={`app-message ${mensagem.tipo}`}>
          {mensagem.texto}
        </div>
      )}

      {paginaAtual === 'login' && (
        <Login
          onLogin={processarLogin}
          onSwitchToRegister={() => setPaginaAtual('register')}
        />
      )}

      {paginaAtual === 'register' && (
        <Register
          onRegister={processarCadastro}
          onSwitchToLogin={() => setPaginaAtual('login')}
        />
      )}

      {paginaAtual === 'dashboard' && usuario?.type === 'professor' && (
        <ProfessorDashboard
          user={usuario}
          activeTab={abaAtiva}
          setActiveTab={setAbaAtiva}
        />
      )}

      {paginaAtual === 'student' && usuario?.type === 'aluno' && (
        <StudentDashboard
          user={usuario}
          activeTab={abaAtiva}
          setActiveTab={setAbaAtiva}
        />
      )}
    </div>
  );
}

export default App;
