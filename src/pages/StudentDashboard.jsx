import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import { storage } from '../utils/storage';
import * as apiService from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/StudentDashboard.css';

export const StudentDashboard = ({ user, activeTab, setActiveTab }) => {
    const [grades, setGrades] = useState([]);
    const [comments, setComments] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    // ──────────────────────────────────────────────
    //  Carregamento de dados via API + storage local
    // ──────────────────────────────────────────────

    const loadData = async () => {
        await loadGrades();
        await loadComments();
    };

    const loadGrades = async () => {
        try {
            // Busca todas as notas da API e filtra pelo aluno logado
            const apiNotas = await apiService.getNotas();
            const notasDoAluno = apiNotas.filter((n) => n.aluno_id === user.id);

            // Converte formato da API → formato interno
            const notasConvertidas = notasDoAluno.map((n) => ({
                id: n.id,
                studentId: n.aluno_id,
                professorId: n.professor_id,
                subject: n.disciplina?.nome || n.subject || 'Disciplina',
                professorName: n.professor?.nome || n.professorName || '',
                nota1: n.nota1 ?? n.nota ?? 0,
                nota2: n.nota2 ?? n.nota ?? 0,
                media: n.nota ?? n.media ?? 0,
                date: n.data_avaliacao || n.date || new Date().toISOString(),
            }));

            // Mescla com dados do storage local (adicionados por professores nesta sessão)
            const localGrades = storage.getGrades().filter((g) => g.studentId === user.id);

            // Prioriza locais (mais recentes), evita duplicatas por id
            const allIds = new Set(localGrades.map((g) => g.id));
            const merged = [
                ...localGrades,
                ...notasConvertidas.filter((n) => !allIds.has(n.id)),
            ];

            setGrades(merged);
        } catch (error) {
            console.error('Erro ao carregar notas da API:', error);
            // Fallback: apenas dados locais
            const localGrades = storage.getGrades().filter((g) => g.studentId === user.id);
            setGrades(localGrades);
        }
    };

    const loadComments = async () => {
        try {
            // Busca todas as observações da API e filtra pelo aluno logado
            const apiObs = await apiService.getObservacoes();
            const obsDoAluno = apiObs.filter((o) => o.aluno_id === user.id);

            // Converte formato da API → formato interno
            const obsConvertidas = obsDoAluno.map((o) => ({
                id: o.id,
                studentId: o.aluno_id,
                professorId: o.professor_id,
                subject: o.professor?.disciplina || o.subject || 'Disciplina',
                professorName: o.professor?.nome || o.professorName || '',
                observation: o.observacao || o.observation || '',
                date: o.data_observacao || o.date || new Date().toISOString(),
            }));

            // Mescla com dados do storage local
            const localComments = storage.getComments().filter((c) => c.studentId === user.id);
            const allIds = new Set(localComments.map((c) => c.id));
            const merged = [
                ...localComments,
                ...obsConvertidas.filter((o) => !allIds.has(o.id)),
            ];

            setComments(merged);
        } catch (error) {
            console.error('Erro ao carregar observações da API:', error);
            const localComments = storage.getComments().filter((c) => c.studentId === user.id);
            setComments(localComments);
        }
    };

    // ──────────────────────────────────────────────
    //  Cálculos
    // ──────────────────────────────────────────────

    const getGradesBySubject = () => {
        const gradesBySubject = {};
        grades.forEach((grade) => {
            if (!gradesBySubject[grade.subject]) gradesBySubject[grade.subject] = [];
            gradesBySubject[grade.subject].push(grade);
        });
        return gradesBySubject;
    };

    const calculateSubjectAverage = (subjectGrades) => {
        if (subjectGrades.length === 0) return 0;
        const sum = subjectGrades.reduce((acc, g) => acc + g.media, 0);
        return (sum / subjectGrades.length).toFixed(2);
    };

    const calculateGeneralAverage = () => {
        if (grades.length === 0) return 0;
        const sum = grades.reduce((acc, g) => acc + g.media, 0);
        return (sum / grades.length).toFixed(2);
    };

    // ──────────────────────────────────────────────
    //  Download do boletim em PDF
    // ──────────────────────────────────────────────

    const downloadBoletim = () => {
        const doc = new jsPDF();
        let currentY = 20;

        // ═══════════════════════════════════════════
        // CABEÇALHO
        // ═══════════════════════════════════════════
        doc.setFillColor(33, 53, 164);
        doc.rect(0, 0, 210, 35, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('BOLETIM ESCOLAR', 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Gestão Acadêmica', 105, 23, { align: 'center' });

        // ═══════════════════════════════════════════
        // INFORMAÇÕES DO ALUNO
        // ═══════════════════════════════════════════
        currentY = 45;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DADOS DO ALUNO', 20, currentY);

        currentY += 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`Nome: ${user.name}`, 20, currentY);

        currentY += 6;
        doc.text(`Matrícula: ${user.matricula}`, 20, currentY);

        currentY += 6;
        doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 20, currentY);

        currentY += 8;
        doc.setLineWidth(0.5);
        doc.setDrawColor(200, 200, 200);
        doc.line(20, currentY, 190, currentY);

        // ═══════════════════════════════════════════
        // TABELA DE NOTAS
        // ═══════════════════════════════════════════
        currentY += 8;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('DESEMPENHO ACADÊMICO', 20, currentY);

        const gradesBySubject = getGradesBySubject();
        const tableData = [];

        Object.keys(gradesBySubject).forEach((subject) => {
            const subjectGrades = gradesBySubject[subject];
            const latestGrade = subjectGrades[subjectGrades.length - 1];
            const average = calculateSubjectAverage(subjectGrades);

            tableData.push([
                subject,
                latestGrade.nota1.toFixed(1),
                latestGrade.nota2.toFixed(1),
                average,
                parseFloat(average) >= 6 ? 'Aprovado' : 'Reprovado',
            ]);
        });

        doc.autoTable({
            startY: currentY + 5,
            head: [['Disciplina', 'Nota 1', 'Nota 2', 'Média', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [33, 53, 164],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center',
                fontSize: 11,
            },
            bodyStyles: {
                halign: 'center',
                fontSize: 10,
            },
            columnStyles: {
                0: { halign: 'left', cellWidth: 70 },
                1: { cellWidth: 25 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { halign: 'center', cellWidth: 35 },
            },
            didParseCell(data) {
                if (data.section === 'body' && data.column.index === 4) {
                    if (data.cell.raw === 'Aprovado') {
                        data.cell.styles.textColor = [40, 167, 69];
                        data.cell.styles.fontStyle = 'bold';
                    } else {
                        data.cell.styles.textColor = [220, 53, 69];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
        });

        // ═══════════════════════════════════════════
        // MÉDIA GERAL E STATUS FINAL
        // ═══════════════════════════════════════════
        currentY = doc.lastAutoTable.finalY + 12;

        doc.setFillColor(245, 245, 245);
        doc.rect(20, currentY - 5, 170, 15, 'F');

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text(`MÉDIA GERAL: ${calculateGeneralAverage()}`, 25, currentY + 4);

        const generalAvg = parseFloat(calculateGeneralAverage());
        doc.setTextColor(
            generalAvg >= 7 ? 40 : 220,
            generalAvg >= 7 ? 167 : 53,
            69
        );
        doc.setFontSize(14);
        doc.text(
            generalAvg >= 7 ? 'APROVADO' : 'REPROVADO',
            185,
            currentY + 4,
            { align: 'right' }
        );

        // ═══════════════════════════════════════════
        // OBSERVAÇÕES (se houver)
        // ═══════════════════════════════════════════
        if (comments.length > 0) {
            currentY += 20;

            // Verifica se há espaço na página
            if (currentY > 250) {
                doc.addPage();
                currentY = 20;
            }

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('OBSERVAÇÕES DOS PROFESSORES', 20, currentY);

            currentY += 8;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');

            comments.slice(0, 5).forEach((comment) => {
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFont('helvetica', 'bold');
                doc.text(`${comment.subject} - ${comment.professorName}`, 20, currentY);

                currentY += 5;
                doc.setFont('helvetica', 'italic');
                doc.text(`${new Date(comment.date).toLocaleDateString('pt-BR')}`, 20, currentY);

                currentY += 5;
                doc.setFont('helvetica', 'normal');
                const lines = doc.splitTextToSize(comment.observation, 170);
                doc.text(lines, 20, currentY);

                currentY += (lines.length * 4) + 6;
            });
        }

        // ═══════════════════════════════════════════
        // RODAPÉ
        // ═══════════════════════════════════════════
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                105,
                285,
                { align: 'center' }
            );
            doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        }

        doc.save(`boletim_${user.matricula}_${Date.now()}.pdf`);
    };

    //  Render
    return (
        <div className="student-dashboard">
            <div className="dashboard-content">
                <div className="student-welcome">
                    <h1>Bem-vindo, {user.name}!</h1>
                    <p className="student-matricula-info">Sua Matrícula: {user.matricula}</p>
                </div>

                {/* ── ABA NOTAS ── */}
                {activeTab === 'notas' && (
                    <div className="student-grades-section">
                        <div className="grades-header-student">
                            <h2>Minhas Notas</h2>
                            {grades.length > 0 && (
                                <button className="btn-download-boletim" onClick={downloadBoletim}>
                                    <FaDownload /> Baixar Boletim
                                </button>
                            )}
                        </div>

                        {grades.length > 0 ? (
                            <>
                                <div className="subjects-grid">
                                    {Object.entries(getGradesBySubject()).map(([subject, subjectGrades]) => {
                                        const latestGrade = subjectGrades[subjectGrades.length - 1];
                                        const average = calculateSubjectAverage(subjectGrades);

                                        return (
                                            <div key={subject} className="subject-card">
                                                <h3>{subject}</h3>
                                                <div className="grade-info">
                                                    <div className="grade-item">
                                                        <span className="grade-label">Nota 1:</span>
                                                        <span className="grade-value">
                                                            {latestGrade.nota1.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="grade-item">
                                                        <span className="grade-label">Nota 2:</span>
                                                        <span className="grade-value">
                                                            {latestGrade.nota2.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="grade-item grade-average">
                                                        <span className="grade-label">Média:</span>
                                                        <span
                                                            className={`grade-value ${parseFloat(average) >= 7 ? 'approved' : 'failed'
                                                                }`}
                                                        >
                                                            {average}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`status-badge ${parseFloat(average) >= 7 ? 'approved' : 'failed'
                                                        }`}
                                                >
                                                    {parseFloat(average) >= 7 ? 'Aprovado' : 'Reprovado'}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="general-average-card">
                                    <h3>Média Geral</h3>
                                    <div className="general-average-value">
                                        <span
                                            className={
                                                parseFloat(calculateGeneralAverage()) >= 7
                                                    ? 'approved'
                                                    : 'failed'
                                            }
                                        >
                                            {calculateGeneralAverage()}
                                        </span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="no-data-message">
                                <p>Você ainda não possui notas lançadas.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── ABA OBSERVAÇÕES ── */}
                {activeTab === 'observacoes' && (
                    <div className="student-observations-section">
                        <h2>Minhas Observações</h2>

                        {comments.length > 0 ? (
                            <div className="observations-list-student">
                                {comments.map((comment) => (
                                    <div key={comment.id} className="observation-card-student">
                                        <div className="observation-header-student">
                                            <span className="observation-subject">{comment.subject}</span>
                                            <span className="observation-date-student">
                                                {new Date(comment.date).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <p className="observation-professor">
                                            Professor: {comment.professorName}
                                        </p>
                                        <p className="observation-text-student">{comment.observation}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-data-message">
                                <p>Você ainda não possui observações registradas.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};