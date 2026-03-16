import { useState } from 'react';
import { FaUser, FaEnvelope, FaIdCard, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import * as apiService from '../utils/api';
import '../styles/Register.css';

export const Register = ({ onRegister, onSwitchToLogin }) => {
    const [dadosFormulario, setDadosFormulario] = useState({
        nome: '',
        matricula: '',
        email: '',
        senha: '',
        confirmarSenha: ''
    });
    const [erro, setErro] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [mostrarSenha, setMostrarSenha] = useState(false);

    const processarEnvio = async (e) => {
        e.preventDefault();
        setErro('');

        if (!dadosFormulario.nome || !dadosFormulario.matricula || !dadosFormulario.email || !dadosFormulario.senha) {
            setErro('Preencha todos os campos obrigatórios');
            return;
        }

        if (dadosFormulario.senha !== dadosFormulario.confirmarSenha) {
            setErro('As senhas não coincidem');
            return;
        }

        if (dadosFormulario.senha.length < 6) {
            setErro('A senha deve ter no mínimo 6 caracteres');
            return;
        }

        setCarregando(true);

        try {
            const alunos = await apiService.getAlunos();

            const matriculaExiste = alunos.find((a) => a.matricula === dadosFormulario.matricula);
            if (matriculaExiste) {
                setErro('Já existe um aluno cadastrado com esta matrícula.');
                setCarregando(false);
                return;
            }

            const emailExiste = alunos.find((a) => a.email === dadosFormulario.email);
            if (emailExiste) {
                setErro('Já existe um aluno cadastrado com este e-mail.');
                setCarregando(false);
                return;
            }

            const novoAluno = await apiService.createAluno({
                name: dadosFormulario.nome,
                email: dadosFormulario.email,
                password: dadosFormulario.senha,
                matricula: dadosFormulario.matricula
            });

            onRegister({
                ...novoAluno,
                role: 'aluno',
                name: novoAluno.nome || dadosFormulario.nome
            });
        } catch (err) {
            setErro('Erro ao cadastrar. Tente novamente.');
        } finally {
            setCarregando(false);
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

                        {erro && <div className="alert alert-error">{erro}</div>}

                        <form onSubmit={processarEnvio} className="register-form">
                            <div className="form-group">
                                <label htmlFor="nome">Nome:</label>
                                <div className="input-with-icon">
                                    <FaUser className="input-icon" />
                                    <input
                                        type="text"
                                        id="nome"
                                        autoComplete="name"
                                        placeholder="Fulano Silva dos Santos"
                                        value={dadosFormulario.nome}
                                        onChange={(e) =>
                                            setDadosFormulario({ ...dadosFormulario, nome: e.target.value })
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
                                        value={dadosFormulario.email}
                                        onChange={(e) =>
                                            setDadosFormulario({ ...dadosFormulario, email: e.target.value })
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
                                        value={dadosFormulario.matricula}
                                        onChange={(e) =>
                                            setDadosFormulario({ ...dadosFormulario, matricula: e.target.value })
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
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        value={dadosFormulario.senha}
                                        onChange={(e) =>
                                            setDadosFormulario({ ...dadosFormulario, senha: e.target.value })
                                        }
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setMostrarSenha(!mostrarSenha)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', paddingRight: '10px', color: '#666', marginRight: '-60px' }}
                                    >
                                        {mostrarSenha ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmarSenha">Confirmar Senha:</label>
                                <div className="input-with-icon">
                                    <FaLock className="input-icon" />
                                    <input
                                        type={mostrarSenha ? "text" : "password"}
                                        id="confirmarSenha"
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                        value={dadosFormulario.confirmarSenha}
                                        onChange={(e) =>
                                            setDadosFormulario({ ...dadosFormulario, confirmarSenha: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary" disabled={carregando}>
                                {carregando ? 'Cadastrando...' : 'Cadastrar-se'}
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
