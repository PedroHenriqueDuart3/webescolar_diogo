import { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler,
} from 'chart.js';
import { Bar, Doughnut, Line, Scatter } from 'react-chartjs-2';
import * as apiService from '../utils/api';
import '../styles/BIDashboard.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    PointElement,
    LineElement,
    Filler
);

export const BIDashboard = ({ user }) => {
    const [carregando, setCarregando] = useState(true);
    const [estatisticas, setEstatisticas] = useState({
        totalAlunos: 0,
        alunosAprovados: 0,
        alunosReprovados: 0,
        mediaGeral: 0,
        melhoresAlunos: [],
        distribuicaoNotas: { '0-2': 0, '2-4': 0, '4-7': 0, '7-8': 0, '8-10': 0 },
        desempenhoDisciplinas: {},
        tendenciaMensal: {},
        dadosDispersao: [],
        outliers: [],
    });

    useEffect(() => {
        calcularEstatisticas();
    }, []);

    const calcularEstatisticas = async () => {
        setCarregando(true);
        try {
            const [todosAlunos, todasNotas, todasDisciplinas] = await Promise.all([
                apiService.getAlunos(),
                apiService.getNotas(),
                apiService.getDisciplinas(),
            ]);

            const minhaDisciplina = todasDisciplinas.find((d) => {
                const profId = d.professor_id || d.professorId || d.professor;
                return profId == user.id;
            });
            const minhaDisciplinaId = minhaDisciplina?.id;

            const notasParaAnalise = minhaDisciplinaId
                ? todasNotas.filter((n) => {
                    const discId = n.disciplina_id || n.disciplinaId || n.disciplina;
                    return discId == minhaDisciplinaId;
                })
                : [];

            const totalAlunos = todosAlunos.length;

            const mediasAlunos = {};
            notasParaAnalise.forEach((nota) => {
                const idAluno = nota.aluno_id || nota.alunoId;
                const aluno = todosAlunos.find((a) => a.id === idAluno);
                const notaFinal = nota.nota ?? 0;

                if (!mediasAlunos[idAluno]) {
                    mediasAlunos[idAluno] = {
                        id: idAluno,
                        nome: aluno?.nome || aluno?.name || `Aluno ${idAluno}`,
                        somaNotas: notaFinal,
                        quantidadeNotas: 1
                    };
                } else {
                    mediasAlunos[idAluno].somaNotas += notaFinal;
                    mediasAlunos[idAluno].quantidadeNotas++;
                }
            });

            let somaMedias = 0;
            let alunosComNotas = 0;
            const listaAlunos = [];

            Object.values(mediasAlunos).forEach((aluno) => {
                const media = aluno.somaNotas / aluno.quantidadeNotas;
                listaAlunos.push({
                    id: aluno.id,
                    nome: aluno.nome,
                    media: media,
                    quantidadeNotas: aluno.quantidadeNotas
                });
                somaMedias += media;
                alunosComNotas++;
            });

            const mediaGeral = alunosComNotas > 0 ? somaMedias / alunosComNotas : 0;

            const alunosAprovados = listaAlunos.filter((a) => a.media >= 7).length;
            const alunosReprovados = listaAlunos.filter((a) => a.media < 7).length;
            const alunosSemNotas = totalAlunos - alunosComNotas;

            const totalAprovados = alunosAprovados;
            const totalReprovados = alunosReprovados + alunosSemNotas;

            const melhoresAlunos = [...listaAlunos]
                .sort((a, b) => b.media - a.media)
                .slice(0, 5);

            const distribuicaoNotas = { '0-2': 0, '2-4': 0, '4-7': 0, '7-8': 0, '8-10': 0 };
            notasParaAnalise.forEach((nota) => {
                const valor = nota.nota ?? nota.media ?? 0;
                if (valor < 2) distribuicaoNotas['0-2']++;
                else if (valor < 4) distribuicaoNotas['2-4']++;
                else if (valor < 7) distribuicaoNotas['4-7']++;
                else if (valor < 8) distribuicaoNotas['7-8']++;
                else distribuicaoNotas['8-10']++;
            });

            const desempenhoDisciplinas = {};
            todasNotas.forEach((nota) => {
                const disciplina = todasDisciplinas.find((d) => d.id === nota.disciplina_id);
                const nomeDisciplina = disciplina?.nome || `Disciplina ${nota.disciplina_id}`;
                if (!desempenhoDisciplinas[nomeDisciplina]) {
                    desempenhoDisciplinas[nomeDisciplina] = { soma: 0, quantidade: 0 };
                }
                const valor = nota.nota ?? nota.media ?? 0;
                desempenhoDisciplinas[nomeDisciplina].soma += valor;
                desempenhoDisciplinas[nomeDisciplina].quantidade++;
            });

            const tendenciaMensal = {};
            notasParaAnalise.forEach((nota) => {
                const dataAvaliacao = nota.dataAvaliacao || nota.data_avaliacao || nota.date;
                if (!dataAvaliacao) return;
                const mes = new Date(dataAvaliacao).toLocaleDateString('pt-BR', {
                    month: 'short',
                    year: 'numeric',
                });
                if (!tendenciaMensal[mes]) tendenciaMensal[mes] = { soma: 0, quantidade: 0 };
                const valor = nota.nota ?? nota.media ?? 0;
                tendenciaMensal[mes].soma += valor;
                tendenciaMensal[mes].quantidade++;
            });

            const dadosDispersao = listaAlunos.map((aluno, indice) => ({
                x: indice + 1,
                y: aluno.media,
                nome: aluno.nome,
                id: aluno.id
            }));

            const desvioPadrao = calcularDesvioPadrao(listaAlunos.map(a => a.media), mediaGeral);
            const outliers = listaAlunos.filter(aluno => {
                const diferenca = Math.abs(aluno.media - mediaGeral);
                return diferenca > desvioPadrao * 1.5;
            });

            setEstatisticas({
                totalAlunos,
                alunosAprovados: totalAprovados,
                alunosReprovados: totalReprovados,
                mediaGeral: mediaGeral.toFixed(2),
                melhoresAlunos,
                distribuicaoNotas,
                desempenhoDisciplinas,
                tendenciaMensal,
                dadosDispersao,
                outliers,
            });
        } catch (erro) {

        } finally {
            setCarregando(false);
        }
    };

    const calcularDesvioPadrao = (valores, media) => {
        if (valores.length === 0) return 0;
        const diferencasQuadradas = valores.map(valor => Math.pow(valor - media, 2));
        const mediaDiferencas = diferencasQuadradas.reduce((a, b) => a + b, 0) / valores.length;
        return Math.sqrt(mediaDiferencas);
    };

    const dadosDesempenho = {
        labels: ['Aprovados (≥7)', 'Reprovados (<7)'],
        datasets: [
            {
                data: [estatisticas.alunosAprovados, estatisticas.alunosReprovados],
                backgroundColor: ['#28a745', '#dc3545'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 2,
            },
        ],
    };

    const dadosDistribuicao = {
        labels: ['0-2', '2-4', '4-7', '7-8', '8-10'],
        datasets: [
            {
                label: 'Quantidade de Notas',
                data: Object.values(estatisticas.distribuicaoNotas),
                backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#17a2b8'],
                borderColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#17a2b8'],
                borderWidth: 2,
            },
        ],
    };

    const dadosDispersaoGrafico = {
        datasets: [
            {
                label: 'Alunos Regulares',
                data: estatisticas.dadosDispersao.filter(aluno =>
                    !estatisticas.outliers.find(o => o.id === aluno.id)
                ),
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: '#667eea',
                pointRadius: 6,
                pointHoverRadius: 8,
            },
            {
                label: 'Outliers (Atenção Especial)',
                data: estatisticas.dadosDispersao.filter(aluno =>
                    estatisticas.outliers.find(o => o.id === aluno.id)
                ),
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: '#ff6384',
                pointRadius: 10,
                pointHoverRadius: 12,
                pointStyle: 'star',
            },
        ],
    };

    const opcoesDispersao = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 15, font: { size: 12 } },
            },
            tooltip: {
                callbacks: {
                    label: function (contexto) {
                        const ponto = contexto.raw;
                        return `${ponto.nome}: ${ponto.y.toFixed(2)}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 10,
                title: {
                    display: true,
                    text: 'Média do Aluno'
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Alunos'
                }
            }
        }
    };

    const rotulosDisciplinas = Object.keys(estatisticas.desempenhoDisciplinas);
    const mediasDisciplinas = rotulosDisciplinas.map((disciplina) => {
        const desempenho = estatisticas.desempenhoDisciplinas[disciplina];
        return (desempenho.soma / desempenho.quantidade).toFixed(2);
    });

    const dadosDisciplinas = {
        labels: rotulosDisciplinas,
        datasets: [
            {
                label: 'Média por Disciplina',
                data: mediasDisciplinas,
                backgroundColor: rotulosDisciplinas.map((disciplina) =>
                    disciplina === (user.subject || '') ? '#2135A4' : '#9FEEE6'
                ),
                borderColor: rotulosDisciplinas.map((disciplina) =>
                    disciplina === (user.subject || '') ? '#2135A4' : '#9FEEE6'
                ),
                borderWidth: 2,
            },
        ],
    };

    const rotulosMeses = Object.keys(estatisticas.tendenciaMensal);
    const mediasMensais = rotulosMeses.map((mes) => {
        const tendencia = estatisticas.tendenciaMensal[mes];
        return (tendencia.soma / tendencia.quantidade).toFixed(2);
    });

    const dadosTendencia = {
        labels: rotulosMeses,
        datasets: [
            {
                label: 'Média Mensal',
                data: mediasMensais,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const opcoesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 15, font: { size: 12 } },
            },
        },
    };

    if (carregando) {
        return (
            <div className="bi-dashboard">
                <div className="bi-header">
                    <h1>Business Intelligence</h1>
                    <p className="bi-subtitle">Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bi-dashboard">
            <div className="bi-header">
                <h1>Business Intelligence</h1>
                <p className="bi-subtitle">Análise de Desempenho - {user.subject}</p>
            </div>

            <div className="stats-cards">
                <div className="stat-card primary">
                    <div className="stat-content">
                        <h3>Total de Alunos</h3>
                        <p className="stat-value">{estatisticas.totalAlunos}</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-content">
                        <h3>Aprovados</h3>
                        <p className="stat-value">{estatisticas.alunosAprovados}</p>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-content">
                        <h3>Reprovados</h3>
                        <p className="stat-value">{estatisticas.alunosReprovados}</p>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-content">
                        <h3>Média Geral</h3>
                        <p className="stat-value">{estatisticas.mediaGeral}</p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Desempenho dos Alunos</h3>
                    <div className="chart-container">
                        <Doughnut data={dadosDesempenho} options={opcoesGrafico} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Distribuição de Notas</h3>
                    <div className="chart-container">
                        <Bar data={dadosDistribuicao} options={opcoesGrafico} />
                    </div>
                </div>

                <div className="chart-card wide">
                    <h3>Dispersão de Alunos - Identificação de Outliers</h3>
                    <div className="chart-container">
                        <Scatter data={dadosDispersaoGrafico} options={opcoesDispersao} />
                    </div>
                </div>

                <div className="chart-card wide">
                    <h3>Comparação entre Disciplinas</h3>
                    <div className="chart-container">
                        <Bar data={dadosDisciplinas} options={opcoesGrafico} />
                    </div>
                </div>

                <div className="chart-card wide">
                    <h3>Tendência de Desempenho</h3>
                    <div className="chart-container">
                        <Line data={dadosTendencia} options={opcoesGrafico} />
                    </div>
                </div>
            </div>

            {estatisticas.outliers.length > 0 && (
                <div className="outliers-section">
                    <h3>Alunos com Desempenho Atípico</h3>
                    <p className="outliers-description">
                        Estes alunos apresentam desempenho significativamente diferente da média da turma e merecem atenção especial.
                    </p>
                    <div className="outliers-list">
                        {estatisticas.outliers.map((aluno, indice) => (
                            <div key={indice} className="outlier-card">
                                <div className="outlier-info">
                                    <h4>{aluno.nome}</h4>
                                    <p className="outlier-average">
                                        Média: {aluno.media.toFixed(2)}
                                        <span className={aluno.media > parseFloat(estatisticas.mediaGeral) ? 'positive' : 'negative'}>
                                            {aluno.media > parseFloat(estatisticas.mediaGeral)
                                                ? ' (Acima da média)'
                                                : ' (Abaixo da média)'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="top-students-section">
                <h3>Top 5 Melhores Alunos</h3>
                <div className="top-students-list">
                    {estatisticas.melhoresAlunos.map((aluno, indice) => (
                        <div key={indice} className={`top-student-card rank-${indice + 1}`}>
                            <div className="rank-badge">{indice + 1}º</div>
                            <div className="student-info">
                                <h4>{aluno.nome}</h4>
                                <p className="student-average">Média: {aluno.media.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
