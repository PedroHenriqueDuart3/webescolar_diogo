import { useState, useEffect } from 'react';
import { FaSearch, FaPencilAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { storage } from '../utils/storage';
import * as apiService from '../utils/api';
import { AlertModal } from '../components/AlertModal';
import '../styles/ProfessorDashboard.css';

export const ProfessorDashboard = ({ user, activeTab, setActiveTab }) => {
    const [termoBusca, setTermoBusca] = useState('');
    const [alunos, setAlunos] = useState([]);
    const [alunoSelecionado, setAlunoSelecionado] = useState(null);
    const [exibirModal, setExibirModal] = useState(false);
    const [tipoModal, setTipoModal] = useState('');
    const [dadosFormulario, setDadosFormulario] = useState({ observation: '', nota1: '', nota2: '' });
    const [editandoNotas, setEditandoNotas] = useState(false);
    const [dadosNotas, setDadosNotas] = useState([]);
    const [editandoObservacoes, setEditandoObservacoes] = useState(false);
    const [idComentarioEditando, setIdComentarioEditando] = useState(null);
    const [textoComentarioEditando, setTextoComentarioEditando] = useState('');
    const [modalAlerta, setModalAlerta] = useState({ show: false, message: '', type: 'info' });
    const [disciplina, setDisciplina] = useState(null);

    useEffect(() => {
        carregarAlunos();
        carregarDisciplina();
    }, []);

    useEffect(() => {
        carregarAlunos();
    }, [activeTab]);

    const carregarAlunos = async () => {
        try {
            const todosAlunos = await apiService.getAlunos();
            const alunosNormalizados = todosAlunos.map((aluno) => ({
                ...aluno,
                name: aluno.nome || aluno.name,
            }));
            setAlunos(alunosNormalizados);
        } catch (erro) {
            exibirAlerta('Erro ao carregar alunos', 'error');
        }
    };

    const carregarDisciplina = async () => {
        try {
            const disciplinas = await apiService.getDisciplinas();
            const minhaDisc = disciplinas.find((d) => d.professor_id === user.id);
            setDisciplina(minhaDisc || null);
        } catch (erro) {

        }
    };

    const exibirAlerta = (mensagem, tipo = 'info') => {
        setModalAlerta({ show: true, message: mensagem, type: tipo });
    };

    const fecharAlerta = () => setModalAlerta({ show: false, message: '', type: 'info' });

    const alunosFiltrados = alunos.filter(
        (aluno) =>
            (aluno.name || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
            (aluno.matricula || '').includes(termoBusca)
    );

    const abrirModal = (aluno, tipo) => {
        setAlunoSelecionado(aluno);
        setTipoModal(tipo);
        setExibirModal(true);
    };

    const fecharModal = () => {
        setExibirModal(false);
        setAlunoSelecionado(null);
        setDadosFormulario({ observation: '', nota1: '', nota2: '' });
    };

    const processarEnvioObservacao = async (e) => {
        e.preventDefault();
        try {
            const novaObservacao = await apiService.createObservacao({
                observacao: dadosFormulario.observation,
                data_observacao: new Date().toISOString().split('T')[0],
                aluno_id: alunoSelecionado.id,
                professor_id: user.id,
            });

            const comentarioLocal = {
                id: novaObservacao?.id || Date.now(),
                studentId: alunoSelecionado.id,
                studentName: alunoSelecionado.name,
                matricula: alunoSelecionado.matricula,
                subject: user.subject,
                professorName: user.name,
                observation: dadosFormulario.observation,
                date: new Date().toISOString(),
            };
            storage.addComment(comentarioLocal);

            exibirAlerta('Observação adicionada com sucesso!', 'success');
            fecharModal();
        } catch (erro) {
            exibirAlerta('Erro ao adicionar observação', 'error');
        }
    };

    const processarEnvioNota = async (e) => {
        e.preventDefault();

        const nota1 = parseFloat(dadosFormulario.nota1);
        const nota2 = parseFloat(dadosFormulario.nota2);

        if (isNaN(nota1) || isNaN(nota2) || nota1 < 0 || nota1 > 10 || nota2 < 0 || nota2 > 10) {
            exibirAlerta('Notas devem estar entre 0 e 10', 'error');
            return;
        }

        const media = parseFloat(((nota1 + nota2) / 2).toFixed(2));

        try {
            const idDisciplina = disciplina?.id || 1;

            const novaNota = await apiService.createNota({
                nota: media,
                data_avaliacao: new Date().toISOString().split('T')[0],
                aluno_id: alunoSelecionado.id,
                professor_id: user.id,
                disciplina_id: idDisciplina,
            });

            const notaLocal = {
                id: novaNota?.id || Date.now(),
                studentId: alunoSelecionado.id,
                studentName: alunoSelecionado.name,
                matricula: alunoSelecionado.matricula,
                subject: user.subject,
                professorName: user.name,
                nota1,
                nota2,
                media,
                date: new Date().toISOString(),
            };
            storage.addGrade(notaLocal);

            exibirAlerta('Notas adicionadas com sucesso!', 'success');
            fecharModal();
            carregarAlunos();
        } catch (erro) {
            exibirAlerta('Erro ao adicionar notas', 'error');
        }
    };

    const obterNotasAluno = (idAluno) => {
        const notas = storage.getGrades();
        return notas.filter((n) => n.studentId === idAluno && n.subject === user.subject);
    };

    const obterTodosAlunosComNotas = (listaAlunos = alunos) => {
        return listaAlunos.map((aluno) => {
            const notas = obterNotasAluno(aluno.id);
            const ultimaNota = notas.length > 0 ? notas[notas.length - 1] : null;
            return {
                ...aluno,
                nota1: ultimaNota?.nota1 ?? null,
                nota2: ultimaNota?.nota2 ?? null,
                media: ultimaNota?.media ?? null,
                gradeId: ultimaNota?.id ?? null,
            };
        });
    };

    const iniciarEdicaoNotas = () => {
        setDadosNotas(obterTodosAlunosComNotas(alunos));
        setEditandoNotas(true);
    };

    const cancelarEdicaoNotas = () => {
        setEditandoNotas(false);
        setDadosNotas([]);
    };

    const alterarNota = (idAluno, campo, valor) => {
        setDadosNotas((anterior) =>
            anterior.map((aluno) => {
                if (aluno.id !== idAluno) return aluno;
                const atualizado = { ...aluno, [campo]: parseFloat(valor) || null };
                if (atualizado.nota1 !== null && atualizado.nota2 !== null) {
                    atualizado.media = ((atualizado.nota1 + atualizado.nota2) / 2).toFixed(2);
                }
                return atualizado;
            })
        );
    };

    const salvarNotas = async () => {
        try {
            const idDisciplina = disciplina?.id || 1;

            for (const aluno of dadosNotas) {
                if (aluno.nota1 === null || aluno.nota2 === null) continue;

                const media = parseFloat(aluno.media);

                if (!aluno.gradeId) {
                    const novaNota = await apiService.createNota({
                        nota: media,
                        data_avaliacao: new Date().toISOString().split('T')[0],
                        aluno_id: aluno.id,
                        professor_id: user.id,
                        disciplina_id: idDisciplina,
                    });

                    const notaLocal = {
                        id: novaNota?.id || Date.now() + Math.random(),
                        studentId: aluno.id,
                        studentName: aluno.name,
                        matricula: aluno.matricula,
                        subject: user.subject,
                        professorName: user.name,
                        nota1: aluno.nota1,
                        nota2: aluno.nota2,
                        media,
                        date: new Date().toISOString(),
                    };
                    storage.addGrade(notaLocal);
                } else {
                    const notaAtualizada = {
                        id: aluno.gradeId,
                        studentId: aluno.id,
                        studentName: aluno.name,
                        matricula: aluno.matricula,
                        subject: user.subject,
                        professorName: user.name,
                        nota1: aluno.nota1,
                        nota2: aluno.nota2,
                        media,
                        date: new Date().toISOString(),
                    };
                    storage.updateGrade(aluno.gradeId, notaAtualizada);
                }
            }

            exibirAlerta('Notas salvas com sucesso!', 'success');
            setEditandoNotas(false);
            setDadosNotas([]);
        } catch (erro) {
            exibirAlerta('Erro ao salvar notas', 'error');
        }
    };

    const iniciarEdicaoObservacoes = () => setEditandoObservacoes(true);

    const cancelarEdicaoObservacoes = () => {
        setEditandoObservacoes(false);
        setIdComentarioEditando(null);
        setTextoComentarioEditando('');
    };

    const iniciarEdicaoComentario = (comentario) => {
        setIdComentarioEditando(comentario.id);
        setTextoComentarioEditando(comentario.observation);
    };

    const salvarComentario = (idComentario) => {
        storage.updateComment(idComentario, { observation: textoComentarioEditando });
        setIdComentarioEditando(null);
        setTextoComentarioEditando('');
        exibirAlerta('Observação atualizada com sucesso!', 'success');
    };

    const deletarComentario = (idComentario) => {
        if (window.confirm('Tem certeza que deseja deletar esta observação?')) {
            storage.deleteComment(idComentario);
            exibirAlerta('Observação deletada com sucesso!', 'success');
        }
    };

    const possuiNotas = () => {
        return storage.getGrades().some((n) => n.subject === user.subject);
    };

    const possuiObservacoes = () => {
        return storage.getComments().some((c) => c.subject === user.subject);
    };

    return (
        <div className="professor-dashboard">
            <div className="dashboard-content">
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Procurar aluno"
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                    />
                </div>

                {activeTab === 'alunos' && (
                    <div className="students-grid">
                        {alunosFiltrados.map((aluno) => (
                            <div key={aluno.id} className="student-card">
                                <div className="student-card-header">
                                    <h3>{aluno.name}</h3>
                                    <p className="matricula">Matrícula: {aluno.matricula}</p>
                                </div>
                                <div className="student-card-actions">
                                    <button
                                        className="btn-action btn-add-grades"
                                        onClick={() => abrirModal(aluno, 'addGrades')}
                                    >
                                        Adicionar Notas
                                    </button>
                                    <button
                                        className="btn-action btn-grades"
                                        onClick={() => abrirModal(aluno, 'grades')}
                                    >
                                        Visualizar Notas
                                    </button>
                                    <button
                                        className="btn-action btn-observation"
                                        onClick={() => abrirModal(aluno, 'observation')}
                                    >
                                        Adicionar Observação
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'notas' && (
                    <div className="grades-section">
                        <div className="grades-header">
                            {!editandoNotas ? (
                                <button
                                    className="btn-edit-grades"
                                    onClick={iniciarEdicaoNotas}
                                    disabled={!possuiNotas()}
                                    style={{
                                        background: !possuiNotas() ? '#6c757d' : '#2135A4',
                                        cursor: !possuiNotas() ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <FaPencilAlt /> Editar Notas
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button className="btn-save-grades" onClick={salvarNotas}>
                                        Salvar
                                    </button>
                                    <button className="btn-cancel-grades" onClick={cancelarEdicaoNotas}>
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grades-table-container">
                            <table className="grades-table-full">
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Matrícula</th>
                                        <th>N1</th>
                                        <th>N2</th>
                                        <th>Média</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(editandoNotas
                                        ? dadosNotas.filter(
                                            (a) =>
                                                (a.name || '').toLowerCase().includes(termoBusca.toLowerCase()) ||
                                                (a.matricula || '').includes(termoBusca)
                                        )
                                        : obterTodosAlunosComNotas(alunosFiltrados)
                                    ).map((aluno) => (
                                        <tr key={aluno.id}>
                                            <td>{aluno.name}</td>
                                            <td>{aluno.matricula}</td>
                                            <td>
                                                {editandoNotas ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={aluno.nota1 ?? ''}
                                                        onChange={(e) =>
                                                            alterarNota(aluno.id, 'nota1', e.target.value)
                                                        }
                                                        className="grade-input"
                                                    />
                                                ) : aluno.nota1 !== null ? (
                                                    aluno.nota1.toFixed(1)
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>
                                                {editandoNotas ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={aluno.nota2 ?? ''}
                                                        onChange={(e) =>
                                                            alterarNota(aluno.id, 'nota2', e.target.value)
                                                        }
                                                        className="grade-input"
                                                    />
                                                ) : aluno.nota2 !== null ? (
                                                    aluno.nota2.toFixed(1)
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td
                                                className={
                                                    aluno.media >= 6
                                                        ? 'media-approved'
                                                        : aluno.media !== null
                                                            ? 'media-failed'
                                                            : ''
                                                }
                                            >
                                                {aluno.media !== null
                                                    ? parseFloat(aluno.media).toFixed(2)
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'observacoes' && (
                    <div className="observations-list">
                        <div className="observations-header">
                            {!editandoObservacoes ? (
                                <button
                                    className="btn-edit-observations"
                                    onClick={iniciarEdicaoObservacoes}
                                    disabled={!possuiObservacoes()}
                                    style={{
                                        background: !possuiObservacoes() ? '#6c757d' : '#2135A4',
                                        cursor: !possuiObservacoes() ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <FaPencilAlt /> Editar Anotações
                                </button>
                            ) : (
                                <button
                                    className="btn-cancel-observations"
                                    onClick={cancelarEdicaoObservacoes}
                                >
                                    Concluir
                                </button>
                            )}
                        </div>

                        {alunosFiltrados.map((aluno) => {
                            const comentarios = storage
                                .getComments()
                                .filter(
                                    (c) => c.studentId === aluno.id && c.subject === user.subject
                                );
                            if (comentarios.length === 0) return null;

                            return (
                                <div key={aluno.id} className="observation-section">
                                    <h3>
                                        {aluno.name} - Matrícula: {aluno.matricula}
                                    </h3>
                                    {comentarios.map((comentario) => (
                                        <div key={comentario.id} className="observation-card">
                                            <div className="observation-header-card">
                                                <p className="observation-date">
                                                    {new Date(comentario.date).toLocaleDateString('pt-BR')}
                                                </p>
                                                {editandoObservacoes && (
                                                    <div className="observation-actions">
                                                        <button
                                                            className="btn-icon btn-edit-icon"
                                                            onClick={() => iniciarEdicaoComentario(comentario)}
                                                            title="Editar"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-delete-icon"
                                                            onClick={() => deletarComentario(comentario.id)}
                                                            title="Deletar"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {idComentarioEditando === comentario.id ? (
                                                <div className="edit-comment-form">
                                                    <textarea
                                                        value={textoComentarioEditando}
                                                        onChange={(e) => setTextoComentarioEditando(e.target.value)}
                                                        rows="4"
                                                        className="edit-comment-textarea"
                                                    />
                                                    <div className="edit-comment-actions">
                                                        <button
                                                            className="btn-save-comment"
                                                            onClick={() => salvarComentario(comentario.id)}
                                                        >
                                                            Salvar
                                                        </button>
                                                        <button
                                                            className="btn-cancel-comment"
                                                            onClick={() => {
                                                                setIdComentarioEditando(null);
                                                                setTextoComentarioEditando('');
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="observation-text">{comentario.observation}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {modalAlerta.show && (
                <AlertModal
                    message={modalAlerta.message}
                    type={modalAlerta.type}
                    onClose={fecharAlerta}
                />
            )}

            {exibirModal && (
                <div className="modal-overlay" onClick={fecharModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {tipoModal === 'observation' && 'Adicionar Observação'}
                                {tipoModal === 'grades' && 'Notas do Aluno'}
                                {tipoModal === 'addGrades' && 'Adicionar Notas'}
                            </h2>
                            <button className="modal-close" onClick={fecharModal}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="student-name-modal">{alunoSelecionado.name}</p>
                            <p className="student-matricula-modal">
                                Matrícula: {alunoSelecionado.matricula}
                            </p>

                            {tipoModal === 'observation' && (
                                <form onSubmit={processarEnvioObservacao}>
                                    <textarea
                                        placeholder="Digite a observação..."
                                        value={dadosFormulario.observation}
                                        onChange={(e) =>
                                            setDadosFormulario({ ...dadosFormulario, observation: e.target.value })
                                        }
                                        required
                                        rows="6"
                                    />
                                    <button type="submit" className="btn-submit">
                                        Salvar Observação
                                    </button>
                                </form>
                            )}

                            {tipoModal === 'addGrades' && (
                                <form onSubmit={processarEnvioNota}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Nota 1 (0-10)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                step={0.1}
                                                value={dadosFormulario.nota1}
                                                onChange={(e) =>
                                                    setDadosFormulario({ ...dadosFormulario, nota1: e.target.value })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Nota 2 (0-10)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                step={0.1}
                                                value={dadosFormulario.nota2}
                                                onChange={(e) =>
                                                    setDadosFormulario({ ...dadosFormulario, nota2: e.target.value })
                                                }
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="btn-submit">
                                        Adicionar Notas
                                    </button>
                                </form>
                            )}

                            {tipoModal === 'grades' && (
                                <div className="grades-list">
                                    {obterNotasAluno(alunoSelecionado.id).length > 0 ? (
                                        obterNotasAluno(alunoSelecionado.id).map((nota) => (
                                            <div key={nota.id} className="grade-detail">
                                                <div className="grade-row">
                                                    <span>Nota 1:</span>
                                                    <strong>{nota.nota1.toFixed(1)}</strong>
                                                </div>
                                                <div className="grade-row">
                                                    <span>Nota 2:</span>
                                                    <strong>{nota.nota2.toFixed(1)}</strong>
                                                </div>
                                                <div className="grade-row">
                                                    <span>Média:</span>
                                                    <strong
                                                        className={nota.media >= 6 ? 'approved' : 'failed'}
                                                    >
                                                        {nota.media.toFixed(2)}
                                                    </strong>
                                                </div>
                                                <div className="grade-date">
                                                    {new Date(nota.date).toLocaleDateString('pt-BR')}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="no-grades-modal">Nenhuma nota lançada ainda.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
