import { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import { storage } from '../utils/storage';
import * as apiService from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../styles/StudentDashboard.css';

export const StudentDashboard = ({ user, activeTab, setActiveTab }) => {
    const [notas, setNotas] = useState([]);
    const [observacoes, setObservacoes] = useState([]);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        await carregarNotas();
        await carregarObservacoes();
    };

    const carregarNotas = async () => {
        try {
            console.log('Carregando notas da API...');
            const notasDaAPI = await apiService.getNotas();
            console.log('Notas recebidas da API:', notasDaAPI);

            const notasDoAluno = notasDaAPI.filter((n) => n.aluno_id === user.id);
            console.log('Notas filtradas do aluno:', notasDoAluno);

            const notasConvertidas = notasDoAluno.map((n) => {
                const nota1 = n.nota1 ?? n.nota ?? 0;
                const nota2 = n.nota2 ?? n.nota ?? 0;
                const media = n.media ?? n.nota ?? ((nota1 + nota2) / 2);

                return {
                    id: n.id,
                    studentId: n.aluno_id,
                    professorId: n.professor_id,
                    subject: n.disciplina?.nome || n.subject || 'Disciplina',
                    professorName: n.professor?.nome || n.professorName || '',
                    nota1: nota1,
                    nota2: nota2,
                    media: media,
                    date: n.data_avaliacao || n.date || new Date().toISOString(),
                };
            });
            console.log('Notas convertidas:', notasConvertidas);

            const notasLocais = storage.getGrades().filter((g) => g.studentId === user.id);
            console.log('Notas locais:', notasLocais);

            const idsExistentes = new Set(notasLocais.map((g) => g.id));
            const notasMescladas = [
                ...notasLocais,
                ...notasConvertidas.filter((n) => !idsExistentes.has(n.id)),
            ];
            console.log('Notas mescladas final:', notasMescladas);

            setNotas(notasMescladas);
        } catch (erro) {
            console.error('Erro ao carregar notas:', erro);
            const notasLocais = storage.getGrades().filter((g) => g.studentId === user.id);
            setNotas(notasLocais);
        }
    };

    const carregarObservacoes = async () => {
        try {
            const observacoesDaAPI = await apiService.getObservacoes();
            const observacoesDoAluno = observacoesDaAPI.filter((o) => o.aluno_id === user.id);

            const observacoesConvertidas = observacoesDoAluno.map((o) => ({
                id: o.id,
                studentId: o.aluno_id,
                professorId: o.professor_id,
                subject: o.professor?.disciplina || o.subject || 'Disciplina',
                professorName: o.professor?.nome || o.professorName || '',
                observation: o.observacao || o.observation || '',
                date: o.data_observacao || o.date || new Date().toISOString(),
            }));

            const observacoesLocais = storage.getComments().filter((c) => c.studentId === user.id);
            const idsExistentes = new Set(observacoesLocais.map((c) => c.id));
            const observacoesMescladas = [
                ...observacoesLocais,
                ...observacoesConvertidas.filter((o) => !idsExistentes.has(o.id)),
            ];

            setObservacoes(observacoesMescladas);
        } catch (erro) {
            const observacoesLocais = storage.getComments().filter((c) => c.studentId === user.id);
            setObservacoes(observacoesLocais);
        }
    };

    const obterNotasPorDisciplina = () => {
        const notasPorDisciplina = {};
        notas.forEach((nota) => {
            if (!notasPorDisciplina[nota.subject]) notasPorDisciplina[nota.subject] = [];
            notasPorDisciplina[nota.subject].push(nota);
        });
        return notasPorDisciplina;
    };

    const calcularMediaDisciplina = (notasDisciplina) => {
        if (notasDisciplina.length === 0) return 0;
        const soma = notasDisciplina.reduce((acc, n) => acc + n.media, 0);
        return (soma / notasDisciplina.length).toFixed(2);
    };

    const calcularMediaGeral = () => {
        if (notas.length === 0) return 0;
        const soma = notas.reduce((acc, n) => acc + n.media, 0);
        return (soma / notas.length).toFixed(2);
    };

    const baixarBoletim = () => {
        const documento = new jsPDF();
        let posicaoY = 20;

        documento.setFillColor(33, 53, 164);
        documento.rect(0, 0, 210, 35, 'F');

        documento.setTextColor(255, 255, 255);
        documento.setFontSize(22);
        documento.setFont('helvetica', 'bold');
        documento.text('BOLETIM ESCOLAR', 105, 15, { align: 'center' });

        documento.setFontSize(10);
        documento.setFont('helvetica', 'normal');
        documento.text('Sistema de Gestão Acadêmica', 105, 23, { align: 'center' });

        posicaoY = 45;
        documento.setTextColor(0, 0, 0);
        documento.setFontSize(12);
        documento.setFont('helvetica', 'bold');
        documento.text('DADOS DO ALUNO', 20, posicaoY);

        posicaoY += 8;
        documento.setFontSize(11);
        documento.setFont('helvetica', 'normal');
        documento.text(`Nome: ${user.name}`, 20, posicaoY);

        posicaoY += 6;
        documento.text(`Matrícula: ${user.matricula}`, 20, posicaoY);

        posicaoY += 6;
        documento.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 20, posicaoY);

        posicaoY += 8;
        documento.setLineWidth(0.5);
        documento.setDrawColor(200, 200, 200);
        documento.line(20, posicaoY, 190, posicaoY);

        posicaoY += 8;
        documento.setFontSize(12);
        documento.setFont('helvetica', 'bold');
        documento.text('DESEMPENHO ACADÊMICO', 20, posicaoY);

        const notasPorDisciplina = obterNotasPorDisciplina();
        const dadosTabela = [];

        Object.keys(notasPorDisciplina).forEach((disciplina) => {
            const notasDisciplina = notasPorDisciplina[disciplina];
            const ultimaNota = notasDisciplina[notasDisciplina.length - 1];
            const media = calcularMediaDisciplina(notasDisciplina);

            dadosTabela.push([
                disciplina,
                ultimaNota.nota1.toFixed(1),
                ultimaNota.nota2.toFixed(1),
                media,
                parseFloat(media) >= 6 ? 'Aprovado' : 'Reprovado',
            ]);
        });

        documento.autoTable({
            startY: posicaoY + 5,
            head: [['Disciplina', 'Nota 1', 'Nota 2', 'Média', 'Status']],
            body: dadosTabela,
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
            didParseCell(dados) {
                if (dados.section === 'body' && dados.column.index === 4) {
                    if (dados.cell.raw === 'Aprovado') {
                        dados.cell.styles.textColor = [40, 167, 69];
                        dados.cell.styles.fontStyle = 'bold';
                    } else {
                        dados.cell.styles.textColor = [220, 53, 69];
                        dados.cell.styles.fontStyle = 'bold';
                    }
                }
            },
        });

        posicaoY = documento.lastAutoTable.finalY + 12;

        documento.setFillColor(245, 245, 245);
        documento.rect(20, posicaoY - 5, 170, 15, 'F');

        documento.setTextColor(0, 0, 0);
        documento.setFontSize(13);
        documento.setFont('helvetica', 'bold');
        documento.text(`MÉDIA GERAL: ${calcularMediaGeral()}`, 25, posicaoY + 4);

        const mediaGeral = parseFloat(calcularMediaGeral());
        documento.setTextColor(
            mediaGeral >= 7 ? 40 : 220,
            mediaGeral >= 7 ? 167 : 53,
            69
        );
        documento.setFontSize(14);
        documento.text(
            mediaGeral >= 7 ? 'APROVADO' : 'REPROVADO',
            185,
            posicaoY + 4,
            { align: 'right' }
        );

        if (observacoes.length > 0) {
            posicaoY += 20;

            if (posicaoY > 250) {
                documento.addPage();
                posicaoY = 20;
            }

            documento.setTextColor(0, 0, 0);
            documento.setFontSize(12);
            documento.setFont('helvetica', 'bold');
            documento.text('OBSERVAÇÕES DOS PROFESSORES', 20, posicaoY);

            posicaoY += 8;
            documento.setFontSize(9);
            documento.setFont('helvetica', 'normal');

            observacoes.slice(0, 5).forEach((observacao) => {
                if (posicaoY > 270) {
                    documento.addPage();
                    posicaoY = 20;
                }

                documento.setFont('helvetica', 'bold');
                documento.text(`${observacao.subject} - ${observacao.professorName}`, 20, posicaoY);

                posicaoY += 5;
                documento.setFont('helvetica', 'italic');
                documento.text(`${new Date(observacao.date).toLocaleDateString('pt-BR')}`, 20, posicaoY);

                posicaoY += 5;
                documento.setFont('helvetica', 'normal');
                const linhas = documento.splitTextToSize(observacao.observation, 170);
                documento.text(linhas, 20, posicaoY);

                posicaoY += (linhas.length * 4) + 6;
            });
        }

        const totalPaginas = documento.internal.getNumberOfPages();
        for (let i = 1; i <= totalPaginas; i++) {
            documento.setPage(i);
            documento.setFontSize(8);
            documento.setTextColor(128, 128, 128);
            documento.setFont('helvetica', 'normal');
            documento.text(
                `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`,
                105,
                285,
                { align: 'center' }
            );
            documento.text(`Página ${i} de ${totalPaginas}`, 105, 290, { align: 'center' });
        }

        documento.save(`boletim_${user.matricula}_${Date.now()}.pdf`);
    };

    return (
        <div className="student-dashboard">
            <div className="dashboard-content">
                <div className="student-welcome">
                    <h1>Bem-vindo, {user.name}!</h1>
                    <p className="student-matricula-info">Sua Matrícula: {user.matricula}</p>
                </div>

                {activeTab === 'notas' && (
                    <div className="student-grades-section">
                        <div className="grades-header-student">
                            <h2>Minhas Notas</h2>
                            {notas.length > 0 && (
                                <button className="btn-download-boletim" onClick={baixarBoletim}>
                                    <FaDownload /> Baixar Boletim
                                </button>
                            )}
                        </div>

                        {notas.length > 0 ? (
                            <>
                                <div className="subjects-grid">
                                    {Object.entries(obterNotasPorDisciplina()).map(([disciplina, notasDisciplina]) => {
                                        const ultimaNota = notasDisciplina[notasDisciplina.length - 1];
                                        const media = calcularMediaDisciplina(notasDisciplina);

                                        return (
                                            <div key={disciplina} className="subject-card">
                                                <h3>{disciplina}</h3>
                                                <div className="grade-info">
                                                    <div className="grade-item">
                                                        <span className="grade-label">Nota 1:</span>
                                                        <span className="grade-value">
                                                            {ultimaNota.nota1.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="grade-item">
                                                        <span className="grade-label">Nota 2:</span>
                                                        <span className="grade-value">
                                                            {ultimaNota.nota2.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="grade-item grade-average">
                                                        <span className="grade-label">Média:</span>
                                                        <span
                                                            className={`grade-value ${parseFloat(media) >= 7 ? 'approved' : 'failed'}`}
                                                        >
                                                            {media}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`status-badge ${parseFloat(media) >= 7 ? 'approved' : 'failed'}`}
                                                >
                                                    {parseFloat(media) >= 7 ? 'Aprovado' : 'Reprovado'}
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
                                                parseFloat(calcularMediaGeral()) >= 7
                                                    ? 'approved'
                                                    : 'failed'
                                            }
                                        >
                                            {calcularMediaGeral()}
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

                {activeTab === 'observacoes' && (
                    <div className="student-observations-section">
                        <h2>Minhas Observações</h2>

                        {observacoes.length > 0 ? (
                            <div className="observations-list-student">
                                {observacoes.map((observacao) => (
                                    <div key={observacao.id} className="observation-card-student">
                                        <div className="observation-header-student">
                                            <span className="observation-subject">{observacao.subject}</span>
                                            <span className="observation-date-student">
                                                {new Date(observacao.date).toLocaleDateString('pt-BR')}
                                            </span>
                                        </div>
                                        <p className="observation-professor">
                                            Professor: {observacao.professorName}
                                        </p>
                                        <p className="observation-text-student">{observacao.observation}</p>
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
