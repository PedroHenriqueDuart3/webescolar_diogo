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
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalStudents: 0,
        studentsAboveAverage: 0,
        studentsBelowAverage: 0,
        averageGrade: 0,
        topStudents: [],
        gradeDistribution: { '0-2': 0, '2-4': 0, '4-7': 0, '7-8': 0, '8-10': 0 },
        subjectPerformance: {},
        monthlyTrend: {},
        scatterData: [],
        outliers: [],
    });

    useEffect(() => {
        calculateStats();
    }, []);

    const calculateStats = async () => {
        setLoading(true);
        try {
            const [allStudents, allNotas, allDisciplinas] = await Promise.all([
                apiService.getAlunos(),
                apiService.getNotas(),
                apiService.getDisciplinas(),
            ]);

            console.log('Dados carregados para BI:');
            console.log('   Alunos:', allStudents.length);
            console.log('   Notas:', allNotas.length);
            console.log('   Disciplinas:', allDisciplinas.length);
            console.log('   User ID:', user.id);

            const minhaDisciplina = allDisciplinas.find((d) => {
                const profId = d.professor_id || d.professorId || d.professor;
                return profId == user.id;
            });
            const minhaDisciplinaId = minhaDisciplina?.id;

            // Filtra apenas as notas da disciplina do professor
            const notasParaAnalise = minhaDisciplinaId
                ? allNotas.filter((n) => {
                    const discId = n.disciplina_id || n.disciplinaId || n.disciplina;
                    return discId == minhaDisciplinaId;
                })
                : [];

            const totalStudents = allStudents.length;

            // Agrupa notas por aluno - calcula a MÉDIA de todas as notas DAS DISCIPLINAS
            const studentAveragesMap = {};
            notasParaAnalise.forEach((nota) => {
                const sid = nota.aluno_id || nota.alunoId;
                const aluno = allStudents.find((a) => a.id === sid);

                const notaFinal = nota.nota ?? 0;

                if (!studentAveragesMap[sid]) {
                    studentAveragesMap[sid] = {
                        id: sid,
                        name: aluno?.nome || aluno?.name || `Aluno ${sid}`,
                        totalNotas: notaFinal,
                        notasCount: 1
                    };
                } else {
                    // Acumula as notas para calcular a média
                    studentAveragesMap[sid].totalNotas += notaFinal;
                    studentAveragesMap[sid].notasCount++;
                }
            });

            let totalAverage = 0;
            let studentsWithGrades = 0;
            const studentsList = [];

            Object.values(studentAveragesMap).forEach((s) => {
                const avg = s.totalNotas / s.notasCount;
                studentsList.push({
                    id: s.id,
                    name: s.name,
                    average: avg,
                    gradesCount: s.notasCount
                });
                totalAverage += avg;
                studentsWithGrades++;
            });

            const overallAverage = studentsWithGrades > 0 ? totalAverage / studentsWithGrades : 0;

            // NOVA MÉDIA: 7
            const studentsAboveAverage = studentsList.filter((s) => s.average >= 7).length;
            const studentsBelowAverage = studentsList.filter((s) => s.average < 7).length;

            // Alunos sem notas = total - alunos com notas
            const studentsWithoutGrades = totalStudents - studentsWithGrades;

            // Considera alunos sem notas como reprovados
            const totalApproved = studentsAboveAverage;
            const totalFailed = studentsBelowAverage + studentsWithoutGrades;

            // Top 5 melhores alunos
            const topStudents = [...studentsList]
                .sort((a, b) => b.average - a.average)
                .slice(0, 5);

            // Distribuição das notas (ajustada para média 7)
            const gradeDistribution = { '0-2': 0, '2-4': 0, '4-7': 0, '7-8': 0, '8-10': 0 };
            notasParaAnalise.forEach((nota) => {
                const v = nota.nota ?? nota.media ?? 0;
                if (v < 2) gradeDistribution['0-2']++;
                else if (v < 4) gradeDistribution['2-4']++;
                else if (v < 7) gradeDistribution['4-7']++;
                else if (v < 8) gradeDistribution['7-8']++;
                else gradeDistribution['8-10']++;
            });

            // Performance por disciplina
            const subjectPerformance = {};
            allNotas.forEach((nota) => {
                const disc = allDisciplinas.find((d) => d.id === nota.disciplina_id);
                const nomeDisciplina = disc?.nome || `Disciplina ${nota.disciplina_id}`;
                if (!subjectPerformance[nomeDisciplina]) {
                    subjectPerformance[nomeDisciplina] = { total: 0, count: 0 };
                }
                const v = nota.nota ?? nota.media ?? 0;
                subjectPerformance[nomeDisciplina].total += v;
                subjectPerformance[nomeDisciplina].count++;
            });

            // Tendência mensal
            const monthlyTrend = {};
            notasParaAnalise.forEach((nota) => {
                const rawDate = nota.dataAvaliacao || nota.data_avaliacao || nota.date;
                if (!rawDate) return;
                const month = new Date(rawDate).toLocaleDateString('pt-BR', {
                    month: 'short',
                    year: 'numeric',
                });
                if (!monthlyTrend[month]) monthlyTrend[month] = { total: 0, count: 0 };
                const v = nota.nota ?? nota.media ?? 0;
                monthlyTrend[month].total += v;
                monthlyTrend[month].count++;
            });

            const scatterData = studentsList.map((s, index) => ({
                x: index + 1,
                y: s.average,
                name: s.name,
                id: s.id
            }));

            const stdDev = calculateStdDev(studentsList.map(s => s.average), overallAverage);
            const outliers = studentsList.filter(s => {
                const diff = Math.abs(s.average - overallAverage);
                return diff > stdDev * 1.5;
            });

            setStats({
                totalStudents,
                studentsAboveAverage: totalApproved,
                studentsBelowAverage: totalFailed,
                averageGrade: overallAverage.toFixed(2),
                topStudents,
                gradeDistribution,
                subjectPerformance,
                monthlyTrend,
                scatterData,
                outliers,
            });
        } catch (error) {
            console.error('Erro ao calcular estatísticas BI:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calcula desvio padrão
    const calculateStdDev = (values, mean) => {
        if (values.length === 0) return 0;
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    };

    // Dados dos gráficos
    const performanceData = {
        labels: ['Aprovados (≥7)', 'Reprovados (<7)'],
        datasets: [
            {
                data: [stats.studentsAboveAverage, stats.studentsBelowAverage],
                backgroundColor: ['#28a745', '#dc3545'],
                borderColor: ['#28a745', '#dc3545'],
                borderWidth: 2,
            },
        ],
    };

    const distributionData = {
        labels: ['0-2', '2-4', '4-7', '7-8', '8-10'],
        datasets: [
            {
                label: 'Quantidade de Notas',
                data: Object.values(stats.gradeDistribution),
                backgroundColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#17a2b8'],
                borderColor: ['#dc3545', '#fd7e14', '#ffc107', '#28a745', '#17a2b8'],
                borderWidth: 2,
            },
        ],
    };

    // Gráfico de dispersão com outliers destacados (SCATTER)
    const scatterChartData = {
        datasets: [
            {
                label: 'Alunos Regulares',
                data: stats.scatterData.filter(s =>
                    !stats.outliers.find(o => o.id === s.id)
                ),
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: '#667eea',
                pointRadius: 6,
                pointHoverRadius: 8,
            },
            {
                label: 'Outliers (Atenção Especial)',
                data: stats.scatterData.filter(s =>
                    stats.outliers.find(o => o.id === s.id)
                ),
                backgroundColor: 'rgba(255, 99, 132, 0.8)',
                borderColor: '#ff6384',
                pointRadius: 10,
                pointHoverRadius: 12,
                pointStyle: 'star',
            },
        ],
    };

    const scatterOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 15, font: { size: 12 } },
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        const point = context.raw;
                        return `${point.name}: ${point.y.toFixed(2)}`;
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

    const subjectLabels = Object.keys(stats.subjectPerformance);
    const subjectAverages = subjectLabels.map((subject) => {
        const perf = stats.subjectPerformance[subject];
        return (perf.total / perf.count).toFixed(2);
    });

    const subjectData = {
        labels: subjectLabels,
        datasets: [
            {
                label: 'Média por Disciplina',
                data: subjectAverages,
                backgroundColor: subjectLabels.map((subject) =>
                    subject === (user.subject || '') ? '#2135A4' : '#9FEEE6'
                ),
                borderColor: subjectLabels.map((subject) =>
                    subject === (user.subject || '') ? '#2135A4' : '#9FEEE6'
                ),
                borderWidth: 2,
            },
        ],
    };

    const monthLabels = Object.keys(stats.monthlyTrend);
    const monthAverages = monthLabels.map((month) => {
        const trend = stats.monthlyTrend[month];
        return (trend.total / trend.count).toFixed(2);
    });

    const trendData = {
        labels: monthLabels,
        datasets: [
            {
                label: 'Média Mensal',
                data: monthAverages,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { padding: 15, font: { size: 12 } },
            },
        },
    };

    if (loading) {
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

            {/* Cards de Resumo */}
            <div className="stats-cards">
                <div className="stat-card primary">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3>Total de Alunos</h3>
                        <p className="stat-value">{stats.totalStudents}</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">✓</div>
                    <div className="stat-content">
                        <h3>Aprovados (≥7)</h3>
                        <p className="stat-value">{stats.studentsAboveAverage}</p>
                    </div>
                </div>
                <div className="stat-card danger">
                    <div className="stat-icon">✕</div>
                    <div className="stat-content">
                        <h3>Reprovados (&lt;7)</h3>
                        <p className="stat-value">{stats.studentsBelowAverage}</p>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>Média Geral</h3>
                        <p className="stat-value">{stats.averageGrade}</p>
                    </div>
                </div>
            </div>

            {/* Gráficos */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Desempenho dos Alunos</h3>
                    <div className="chart-container">
                        <Doughnut data={performanceData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Distribuição de Notas (N1 - N2)</h3>
                    <div className="chart-container">
                        <Bar data={distributionData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card wide">
                    <h3>Dispersão de Alunos - Identificação de Outliers</h3>
                    <div className="chart-container">
                        <Scatter data={scatterChartData} options={scatterOptions} />
                    </div>
                </div>

                <div className="chart-card wide">
                    <h3>Comparação entre Disciplinas</h3>
                    <div className="chart-container">
                        <Bar data={subjectData} options={chartOptions} />
                    </div>
                </div>

                <div className="chart-card wide">
                    <h3>Tendência de Desempenho</h3>
                    <div className="chart-container">
                        <Line data={trendData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* Outliers Detectados */}
            {stats.outliers.length > 0 && (
                <div className="outliers-section">
                    <h3>Alunos com Desempenho Atípico (Outliers)</h3>
                    <p className="outliers-description">
                        Estes alunos apresentam desempenho significativamente diferente da média da turma e merecem atenção especial.
                    </p>
                    <div className="outliers-list">
                        {stats.outliers.map((student, index) => (
                            <div key={index} className="outlier-card">
                                <div className="outlier-info">
                                    <h4>{student.name}</h4>
                                    <p className="outlier-average">
                                        Média: {student.average.toFixed(2)}
                                        <span className={student.average > parseFloat(stats.averageGrade) ? 'positive' : 'negative'}>
                                            {student.average > parseFloat(stats.averageGrade)
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

            {/* Top 5 Alunos */}
            <div className="top-students-section">
                <h3>🏆 Top 5 Melhores Alunos (COM BASE EM TODOS OS RESULTADOS)</h3>
                <div className="top-students-list">
                    {stats.topStudents.map((student, index) => (
                        <div key={index} className={`top-student-card rank-${index + 1}`}>
                            <div className="rank-badge">{index + 1}º</div>
                            <div className="student-info">
                                <h4>{student.name}</h4>
                                <p className="student-average">Média: {student.average.toFixed(2)}</p>
                            </div>
                            <div className="medal">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
