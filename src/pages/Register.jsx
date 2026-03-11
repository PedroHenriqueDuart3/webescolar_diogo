import { useState } from 'react';
import { FaUser, FaEnvelope, FaIdCard, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import * as apiService from '../utils/api';
import '../styles/Register.css';

export const Register = ({ onRegister, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        matricula: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.name || !formData.matricula || !formData.email || !formData.password) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            // Verifica se matrícula ou email já existem
            const alunos = await apiService.getAlunos();

            const matriculaExiste = alunos.find((a) => a.matricula === formData.matricula);
            if (matriculaExiste) {
                setError('Já existe um aluno cadastrado com esta matrícula.');
                setLoading(false);
                return;
            }

            const emailExiste = alunos.find((a) => a.email === formData.email);
            if (emailExiste) {
                setError('Já existe um aluno cadastrado com este e-mail.');
                setLoading(false);
                return;
            }

            // Cria o aluno na API
            // api.js espera { name, email, password, matricula } e converte para { nome, email, senha, matricula }
            const novoAluno = await apiService.createAluno({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                matricula: formData.matricula
            });

            // Retorna o usuário criado para o componente pai
            onRegister({
                ...novoAluno,
                role: 'aluno',
                name: novoAluno.nome || formData.name
            });
        } catch (err) {
            console.error('Erro ao cadastrar aluno:', err);
            setError('Erro ao cadastrar. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-gradient-side" />

                <div className="register-form-side">
                    <div className="form-content">
                        <div className="register-header">
                            <h1>Sistema Escolar</h1>
                            <p>Cadastro de Alunos</p>
                        </div>

                        {error && <div className="alert alert-error">{error}</div>}

                        <form onSubmit={handleSubmit} className="register-form">
                            <div className="form-group">
                                <label htmlFor="name">Nome:</label>
                                <div className="input-with-icon">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        id="name"
                                        autoComplete="name"
                                        placeholder="Fulano Silva dos Santos"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email:</label>
                                <div className="input-with-icon">
                                    <FaEnvelope className="input-icon" />
                                    <input
                                        type="email"
                                        id="email"
                                        autoComplete="email"
                                        placeholder="fulano.silva@email.com"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="matricula">Matrícula:</label>
                                <div className="input-with-icon">
                                    <FaIdCard className="input-icon" />
                                    <input
                                        type="text"
                                        id="matricula"
                                        autoComplete="off"
                                        placeholder="Ex: 2024001"
                                        value={formData.matricula}
                                        onChange={(e) =>
                                            setFormData({ ...formData, matricula: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Senha:</label>
                                <div className="input-with-icon">
                                    <FaLock className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', paddingRight: '10px', color: '#666', marginRight: '-60px'}}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirmar Senha:</label>
                                <div className="input-with-icon">
                                    <FaLock className="input-icon" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="confirmPassword"
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) =>
                                            setFormData({ ...formData, confirmPassword: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}>
                                {loading ? 'Cadastrando...' : 'Cadastrar-se'}
                            </button>
                        </form>

                        <div className="register-footer">
                            <button className="btn-link" onClick={onSwitchToLogin}>
                                Entrar no sistema
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};  