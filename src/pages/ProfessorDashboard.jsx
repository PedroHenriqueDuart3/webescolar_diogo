import { useState, useEffect } from 'react';
import { FaSearch, FaPencilAlt, FaEdit, FaTrash } from 'react-icons/fa';
import { storage } from '../utils/storage';
import * as apiService from '../utils/api';
import { AlertModal } from '../components/AlertModal';
import { BIDashboard } from './BIDashboard';
import '../styles/ProfessorDashboard.css';

export const ProfessorDashboard = ({ user, activeTab, setActiveTab }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('');
    const [formData, setFormData] = useState({ observation: '', nota1: '', nota2: '' });
    const [editingGrades, setEditingGrades] = useState(false);
    const [gradesData, setGradesData] = useState([]);
    const [editingObservations, setEditingObservations] = useState(false);
    const [editingCommentId, setEditingCommentId] = useState(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [alertModal, setAlertModal] = useState({ show: false, message: '', type: 'info' });
    const [disciplina, setDisciplina] = useState(null);

    useEffect(() => {
        loadStudents();
        loadDisciplina();
    }, []);

    useEffect(() => {
        loadStudents();
    }, [activeTab]);

    // ──────────────────────────────────────────────
    //  Carregamento de dados via API
    // ──────────────────────────────────────────────

    const loadStudents = async () => {
        try {
            const allStudents = await apiService.getAlunos();
            // Normaliza campo "nome" → "name" para compatibilidade interna
            const normalized = allStudents.map((s) => ({
                ...s,
                name: s.nome || s.name,
            }));
            setStudents(normalized);
        } catch (error) {
            console.error('Erro ao carregar alunos:', error);
            showAlert('Erro ao carregar alunos', 'error');
        }
    };

    const loadDisciplina = async () => {
        try {
            // Busca disciplinas e filtra pela que pertence a este professor
            const disciplinas = await apiService.getDisciplinas();
            const disc = disciplinas.find((d) => d.professor_id === user.id);
            setDisciplina(disc || null);
        } catch (error) {
            console.error('Erro ao carregar disciplina:', error);
        }
    };

    // ──────────────────────────────────────────────
    //  Helpers / UI
    // ──────────────────────────────────────────────

    const showAlert = (message, type = 'info') => {
        setAlertModal({ show: true, message, type });
    };

    const closeAlert = () => setAlertModal({ show: false, message: '', type: 'info' });

    const filteredStudents = students.filter(
        (student) =>
            (student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.matricula || '').includes(searchTerm)
    );

    const openModal = (student, type) => {
        setSelectedStudent(student);
        setModalType(type);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedStudent(null);
        setFormData({ observation: '', nota1: '', nota2: '' });
    };

    // ──────────────────────────────────────────────
    //  Observações
    // ──────────────────────────────────────────────

    const handleSubmitObservation = async (e) => {
        e.preventDefault();
        try {
            // Persiste na API
            const novaObs = await apiService.createObservacao({
                observacao: formData.observation,
                data_observacao: new Date().toISOString().split('T')[0],
                aluno_id: selectedStudent.id,
                professor_id: user.id,
            });

            // Espelha no storage local para exibição imediata
            const newComment = {
                id: novaObs?.id || Date.now(),
                studentId: selectedStudent.id,
                studentName: selectedStudent.name,
                matricula: selectedStudent.matricula,
                subject: user.subject,
                professorName: user.name,
                observation: formData.observation,
                date: new Date().toISOString(),
            };
            storage.addComment(newComment);

            showAlert('Observação adicionada com sucesso!', 'success');
            closeModal();
        } catch (error) {
            console.error('Erro ao adicionar observação:', error);
            showAlert('Erro ao adicionar observação', 'error');
        }
    };

    // ──────────────────────────────────────────────
    //  Notas (modal de adição unitária)
    // ──────────────────────────────────────────────

    const handleSubmitGrade = async (e) => {
        e.preventDefault();

        const nota1 = parseFloat(formData.nota1);
        const nota2 = parseFloat(formData.nota2);

        if (isNaN(nota1) || isNaN(nota2) || nota1 < 0 || nota1 > 10 || nota2 < 0 || nota2 > 10) {
            showAlert('Notas devem estar entre 0 e 10', 'error');
            return;
        }

        const media = parseFloat(((nota1 + nota2) / 2).toFixed(2));

        try {
            const disciplinaId = disciplina?.id || 1;

            // Persiste na API
            const novaNota = await apiService.createNota({
                nota: media,
                data_avaliacao: new Date().toISOString().split('T')[0],
                aluno_id: selectedStudent.id,
                professor_id: user.id,
                disciplina_id: disciplinaId,
            });

            // Espelha no storage local
            const newGrade = {
                id: novaNota?.id || Date.now(),
                studentId: selectedStudent.id,
                studentName: selectedStudent.name,
                matricula: selectedStudent.matricula,
                subject: user.subject,
                professorName: user.name,
                nota1,
                nota2,
                media,
                date: new Date().toISOString(),
            };
            storage.addGrade(newGrade);

            showAlert('Notas adicionadas com sucesso!', 'success');
            closeModal();
            loadStudents();
        } catch (error) {
            console.error('Erro ao adicionar notas:', error);
            showAlert('Erro ao adicionar notas', 'error');
        }
    };

    // ──────────────────────────────────────────────
    //  Notas (tabela editável em massa)
    // ──────────────────────────────────────────────

    const getStudentGrades = (studentId) => {
        const grades = storage.getGrades();
        return grades.filter((g) => g.studentId === studentId && g.subject === user.subject);
    };

    const getAllStudentsWithGrades = (studentsList = students) => {
        return studentsList.map((student) => {
            const grades = getStudentGrades(student.id);
            const latestGrade = grades.length > 0 ? grades[grades.length - 1] : null;
            return {
                ...student,
                nota1: latestGrade?.nota1 ?? null,
                nota2: latestGrade?.nota2 ?? null,
                media: latestGrade?.media ?? null,
                gradeId: latestGrade?.id ?? null,
            };
        });
    };

    const handleEditGrades = () => {
        setGradesData(getAllStudentsWithGrades(students));
        setEditingGrades(true);
    };

    const handleCancelEdit = () => {
        setEditingGrades(false);
        setGradesData([]);
    };

    const handleGradeChange = (studentId, field, value) => {
        setGradesData((prev) =>
            prev.map((student) => {
                if (student.id !== studentId) return student;
                const updated = { ...student, [field]: parseFloat(value) || null };
                if (updated.nota1 !== null && updated.nota2 !== null) {
                    updated.media = ((updated.nota1 + updated.nota2) / 2).toFixed(2);
                }
                return updated;
            })
        );
    };

    const handleSaveGrades = async () => {
        try {
            const disciplinaId = disciplina?.id || 1;

            for (const student of gradesData) {
                if (student.nota1 === null || student.nota2 === null) continue;

                const media = parseFloat(student.media);

                if (!student.gradeId) {
                    // Nova nota → cria na API
                    const novaNota = await apiService.createNota({
                        nota: media,
                        data_avaliacao: new Date().toISOString().split('T')[0],
                        aluno_id: student.id,
                        professor_id: user.id,
                        disciplina_id: disciplinaId,
                    });

                    const newGrade = {
                        id: novaNota?.id || Date.now() + Math.random(),
                        studentId: student.id,
                        studentName: student.name,
                        matricula: student.matricula,
                        subject: user.subject,
                        professorName: user.name,
                        nota1: student.nota1,
                        nota2: student.nota2,
                        media,
                        date: new Date().toISOString(),
                    };
                    storage.addGrade(newGrade);
                } else {
                    // Nota existente → atualiza no storage local
                    // (a API não expõe PUT /notas, então mantemos só local)
                    const updatedGrade = {
                        id: student.gradeId,
                        studentId: student.id,
                        studentName: student.name,
                        matricula: student.matricula,
                        subject: user.subject,
                        professorName: user.name,
                        nota1: student.nota1,
                        nota2: student.nota2,
                        media,
                        date: new Date().toISOString(),
                    };
                    storage.updateGrade(student.gradeId, updatedGrade);
                }
            }

            showAlert('Notas salvas com sucesso!', 'success');
            setEditingGrades(false);
            setGradesData([]);
        } catch (error) {
            console.error('Erro ao salvar notas:', error);
            showAlert('Erro ao salvar notas', 'error');
        }
    };

    // ──────────────────────────────────────────────
    //  Observações (edição inline)
    // ──────────────────────────────────────────────

    const handleEditObservations = () => setEditingObservations(true);

    const handleCancelEditObservations = () => {
        setEditingObservations(false);
        setEditingCommentId(null);
        setEditCommentText('');
    };

    const handleStartEditComment = (comment) => {
        setEditingCommentId(comment.id);
        setEditCommentText(comment.observation);
    };

    const handleSaveComment = (commentId) => {
        storage.updateComment(commentId, { observation: editCommentText });
        setEditingCommentId(null);
        setEditCommentText('');
        showAlert('Observação atualizada com sucesso!', 'success');
    };

    const handleDeleteComment = (commentId) => {
        if (window.confirm('Tem certeza que deseja deletar esta observação?')) {
            storage.deleteComment(commentId);
            showAlert('Observação deletada com sucesso!', 'success');
        }
    };

    const hasGrades = () => {
        return storage.getGrades().some((g) => g.subject === user.subject);
    };

    const hasObservations = () => {
        return storage.getComments().some((c) => c.subject === user.subject);
    };

    // ──────────────────────────────────────────────
    //  Render
    // ──────────────────────────────────────────────

    return (
        <div className="professor-dashboard">
            <div className="dashboard-content">
                <div className="search-bar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Procurar aluno"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* ── ABA ALUNOS ── */}
                {activeTab === 'alunos' && (
                    <div className="students-grid">
                        {filteredStudents.map((student) => (
                            <div key={student.id} className="student-card">
                                <div className="student-card-header">
                                    <h3>{student.name}</h3>
                                    <p className="matricula">Matrícula: {student.matricula}</p>
                                </div>
                                <div className="student-card-actions">
                                    <button
                                        className="btn-action btn-add-grades"
                                        onClick={() => openModal(student, 'addGrades')}
                                    >
                                        Adicionar Notas
                                    </button>
                                    <button
                                        className="btn-action btn-grades"
                                        onClick={() => openModal(student, 'grades')}
                                    >
                                        Visualizar Notas
                                    </button>
                                    <button
                                        className="btn-action btn-observation"
                                        onClick={() => openModal(student, 'observation')}
                                    >
                                        Adicionar Observação
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── ABA NOTAS ── */}
                {activeTab === 'notas' && (
                    <div className="grades-section">
                        <div className="grades-header">
                            {!editingGrades ? (
                                <button
                                    className="btn-edit-grades"
                                    onClick={handleEditGrades}
                                    disabled={!hasGrades()}
                                    style={{
                                        background: !hasGrades() ? '#6c757d' : '#2135A4',
                                        cursor: !hasGrades() ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <FaPencilAlt /> Editar Notas
                                </button>
                            ) : (
                                <div className="edit-actions">
                                    <button className="btn-save-grades" onClick={handleSaveGrades}>
                                        Salvar
                                    </button>
                                    <button className="btn-cancel-grades" onClick={handleCancelEdit}>
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
                                    {(editingGrades
                                        ? gradesData.filter(
                                              (s) =>
                                                  (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                  (s.matricula || '').includes(searchTerm)
                                          )
                                        : getAllStudentsWithGrades(filteredStudents)
                                    ).map((student) => (
                                        <tr key={student.id}>
                                            <td>{student.name}</td>
                                            <td>{student.matricula}</td>
                                            <td>
                                                {editingGrades ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={student.nota1 ?? ''}
                                                        onChange={(e) =>
                                                            handleGradeChange(student.id, 'nota1', e.target.value)
                                                        }
                                                        className="grade-input"
                                                    />
                                                ) : student.nota1 !== null ? (
                                                    student.nota1.toFixed(1)
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td>
                                                {editingGrades ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={student.nota2 ?? ''}
                                                        onChange={(e) =>
                                                            handleGradeChange(student.id, 'nota2', e.target.value)
                                                        }
                                                        className="grade-input"
                                                    />
                                                ) : student.nota2 !== null ? (
                                                    student.nota2.toFixed(1)
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                            <td
                                                className={
                                                    student.media >= 6
                                                        ? 'media-approved'
                                                        : student.media !== null
                                                        ? 'media-failed'
                                                        : ''
                                                }
                                            >
                                                {student.media !== null
                                                    ? parseFloat(student.media).toFixed(2)
                                                    : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── ABA OBSERVAÇÕES ── */}
                {activeTab === 'observacoes' && (
                    <div className="observations-list">
                        <div className="observations-header">
                            {!editingObservations ? (
                                <button
                                    className="btn-edit-observations"
                                    onClick={handleEditObservations}
                                    disabled={!hasObservations()}
                                    style={{
                                        background: !hasObservations() ? '#6c757d' : '#2135A4',
                                        cursor: !hasObservations() ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    <FaPencilAlt /> Editar Anotações
                                </button>
                            ) : (
                                <button
                                    className="btn-cancel-observations"
                                    onClick={handleCancelEditObservations}
                                >
                                    Concluir
                                </button>
                            )}
                        </div>

                        {filteredStudents.map((student) => {
                            const comments = storage
                                .getComments()
                                .filter(
                                    (c) => c.studentId === student.id && c.subject === user.subject
                                );
                            if (comments.length === 0) return null;

                            return (
                                <div key={student.id} className="observation-section">
                                    <h3>
                                        {student.name} - Matrícula: {student.matricula}
                                    </h3>
                                    {comments.map((comment) => (
                                        <div key={comment.id} className="observation-card">
                                            <div className="observation-header-card">
                                                <p className="observation-date">
                                                    {new Date(comment.date).toLocaleDateString('pt-BR')}
                                                </p>
                                                {editingObservations && (
                                                    <div className="observation-actions">
                                                        <button
                                                            className="btn-icon btn-edit-icon"
                                                            onClick={() => handleStartEditComment(comment)}
                                                            title="Editar"
                                                        >
                                                            <FaEdit />
                                                        </button>
                                                        <button
                                                            className="btn-icon btn-delete-icon"
                                                            onClick={() => handleDeleteComment(comment.id)}
                                                            title="Deletar"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {editingCommentId === comment.id ? (
                                                <div className="edit-comment-form">
                                                    <textarea
                                                        value={editCommentText}
                                                        onChange={(e) => setEditCommentText(e.target.value)}
                                                        rows="4"
                                                        className="edit-comment-textarea"
                                                    />
                                                    <div className="edit-comment-actions">
                                                        <button
                                                            className="btn-save-comment"
                                                            onClick={() => handleSaveComment(comment.id)}
                                                        >
                                                            Salvar
                                                        </button>
                                                        <button
                                                            className="btn-cancel-comment"
                                                            onClick={() => {
                                                                setEditingCommentId(null);
                                                                setEditCommentText('');
                                                            }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="observation-text">{comment.observation}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── ABA BI ── */}
                {activeTab === 'bi' && <BIDashboard user={user} />}
            </div>

            {alertModal.show && (
                <AlertModal
                    message={alertModal.message}
                    type={alertModal.type}
                    onClose={closeAlert}
                />
            )}

            {/* ── MODAL ── */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                {modalType === 'observation' && 'Adicionar Observação'}
                                {modalType === 'grades' && 'Notas do Aluno'}
                                {modalType === 'addGrades' && 'Adicionar Notas'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}>
                                ×
                            </button>
                        </div>

                        <div className="modal-body">
                            <p className="student-name-modal">{selectedStudent.name}</p>
                            <p className="student-matricula-modal">
                                Matrícula: {selectedStudent.matricula}
                            </p>

                            {modalType === 'observation' && (
                                <form onSubmit={handleSubmitObservation}>
                                    <textarea
                                        placeholder="Digite a observação..."
                                        value={formData.observation}
                                        onChange={(e) =>
                                            setFormData({ ...formData, observation: e.target.value })
                                        }
                                        required
                                        rows="6"
                                    />
                                    <button type="submit" className="btn-submit">
                                        Salvar Observação
                                    </button>
                                </form>
                            )}

                            {modalType === 'addGrades' && (
                                <form onSubmit={handleSubmitGrade}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Nota 1 (0-10)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={10}
                                                step={0.1}
                                                value={formData.nota1}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, nota1: e.target.value })
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
                                                value={formData.nota2}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, nota2: e.target.value })
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

                            {modalType === 'grades' && (
                                <div className="grades-list">
                                    {getStudentGrades(selectedStudent.id).length > 0 ? (
                                        getStudentGrades(selectedStudent.id).map((grade) => (
                                            <div key={grade.id} className="grade-detail">
                                                <div className="grade-row">
                                                    <span>Nota 1:</span>
                                                    <strong>{grade.nota1.toFixed(1)}</strong>
                                                </div>
                                                <div className="grade-row">
                                                    <span>Nota 2:</span>
                                                    <strong>{grade.nota2.toFixed(1)}</strong>
                                                </div>
                                                <div className="grade-row">
                                                    <span>Média:</span>
                                                    <strong
                                                        className={grade.media >= 6 ? 'approved' : 'failed'}
                                                    >
                                                        {grade.media.toFixed(2)}
                                                    </strong>
                                                </div>
                                                <div className="grade-date">
                                                    {new Date(grade.date).toLocaleDateString('pt-BR')}
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