import { useState } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { login } from '../utils/api';
import '../styles/Login.css';

export const Login = ({ onLogin, onSwitchToRegister }) => {
    const [formData, setFormData] = useState({
        usuario: '',
        senha: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.usuario || !formData.senha) {
            setError('Preencha todos os campos');
            return;
        }

        setLoading(true);

        try {
            const usuario = formData.usuario.trim();
            const senha = formData.senha.trim();

            const user = await login(usuario, senha);

            if (user) {
                onLogin({
                    ...user,
                    role: user.type // 'aluno' ou 'professor'
                });
            } else {
                setError('Usuário ou senha inválidos');
            }
        } catch (err) {
            console.error('Erro ao fazer login:', err);
            setError('Erro ao conectar com o servidor. Tente novamente.');
        } finally {
            setLoading(false);
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

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="login-form">
                            <div className="form-group">
                                <label htmlFor="usuario">Usuário:</label>
                                <div className="input-with-icon">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        id="usuario"
                                        placeholder="Ex: carlos.silva ou matrícula"
                                        autoComplete="username"
                                        value={formData.usuario}
                                        onChange={(e) =>
                                            setFormData({ ...formData, usuario: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="senha">Senha:</label>
                                <div className="input-with-icon">
                                    <FaLock className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="senha"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        value={formData.senha}
                                        onChange={(e) =>
                                            setFormData({ ...formData, senha: e.target.value })
                                        }
                                    />
                                    <button
                                        type='button'
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', paddingRight: '10px', color: '#666', marginRight: '-60px' }}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Entrando...' : 'Entrar'}
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