import { useState } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { login } from '../utils/api';
import '../styles/Login.css';

export const Login = ({ onLogin, onSwitchToRegister }) => {
    const [dadosFormulario, setDadosFormulario] = useState({
        usuario: '',
        senha: ''
    });
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const processarEnvio = async (e) => {
        e.preventDefault();
        setErro('');

        if (!dadosFormulario.usuario || !dadosFormulario.senha) {
            setErro('Preencha todos os campos');
            return;
        }

        setCarregando(true);

        try {
            const usuario = dadosFormulario.usuario.trim();
            const senha = dadosFormulario.senha.trim();

            const usuarioAutenticado = await login(usuario, senha);

            if (usuarioAutenticado) {
                onLogin({
                    ...usuarioAutenticado,
                    role: usuarioAutenticado.type
                });
            } else {
                setErro('Usuário ou senha inválidos');
            }
        } catch (err) {
            setErro('Erro ao conectar com o servidor. Tente novamente.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-gradient-side" />

                <div className="login-form-side">
                    <div className="form-content">
                        <div className="login-header">
                            <h1>Sistema Escolar</h1>
                            <p>Faça login para continuar</p>
                        </div>

                        {erro && <div className="alert alert-error">{erro}</div>}

                        <form onSubmit={processarEnvio} className="login-form">
                            <div className="form-group">
                                <label htmlFor="usuario">Usuário:</label>
                                <div className="input-with-icon">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        id="usuario"
                                        placeholder="Ex: carlos.silva ou matrícula"
                                        autoComplete="username"
                                        value={dadosFormulario.usuario}
                                        onChange={(e) =>
                                            setDadosFormulario({ ...dadosFormulario, usuario: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="senha">Senha:</label>
                                <div className="input-with-icon">
                                    <FaLock className="input-icon" />
                                    <input
                                        type={mostrarSenha ? "text" : "password"}
                                        id="senha"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        value={dadosFormulario.senha}
                                        onChange={(e) =>
                                            setDadosFormulario({ ...dadosFormulario, senha: e.target.value })
                                        }
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', paddingRight: '10px', color: '#666', marginRight: '-60px' }}
                                    >
                                        {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={carregando}>
                                {carregando ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>

                        <div className="login-footer">
                            <button className="btn-link" onClick={onSwitchToRegister}>
                                Cadastrar-se como aluno
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
