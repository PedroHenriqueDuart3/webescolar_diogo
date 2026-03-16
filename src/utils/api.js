import axios from 'axios';
import { storage } from './storage';

const URL_BASE = import.meta.env.DEV ? '/api' : 'https://web-escolar.onrender.com';

const api = axios.create({
    baseURL: URL_BASE,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

api.interceptors.request.use(
    (configuracao) => {
        if (configuracao.url?.includes('/auth/login')) {
            return configuracao;
        }

        const autenticacao = storage.getAuth();

        if (autenticacao && autenticacao.token) {
            configuracao.headers.Authorization = `Bearer ${autenticacao.token}`;
            console.log('Token adicionado:', autenticacao.token.substring(0, 20) + '...');
        } else {
            console.warn('Nenhum token encontrado no storage');
        }

        return configuracao;
    },
    (erro) => {
        return Promise.reject(erro);
    }
);

api.interceptors.response.use(
    (resposta) => resposta,
    (erro) => {
        return Promise.reject(erro);
    }
);

export const login = async (identificador, senha) => {
    try {
        const payloadProfessor = {
            usuario: identificador,
            senha: senha
        };

        try {
            const { data } = await api.post('/auth/login', payloadProfessor);
            console.log('Resposta login professor:', data);

            if (data.token && data.tipo === 'PROFESSOR') {
                const dadosUsuario = {
                    token: data.token,
                    id: data.id,
                    usuario: data.usuario,
                    name: data.usuario,
                    type: 'professor'
                };

                console.log('Salvando dados do professor:', dadosUsuario);
                return dadosUsuario;
            }
        } catch (erroProfessor) {
            console.log('Não é professor, tentando como aluno...');
        }

        const payloadAluno = {
            matricula: identificador,
            senha: senha
        };

        const { data } = await api.post('/auth/login', payloadAluno);
        console.log('Resposta login aluno:', data);

        if (data.token && data.tipo === 'ALUNO') {
            const dadosUsuario = {
                token: data.token,
                id: data.id,
                usuario: data.usuario,
                name: data.usuario,
                matricula: identificador,
                type: 'aluno'
            };

            console.log('Salvando dados do aluno:', dadosUsuario);
            return dadosUsuario;
        }

        return null;
    } catch (erro) {
        console.error('Erro no login:', erro.response?.status, erro.response?.data);
        if (erro.response?.status === 401 || erro.response?.status === 403 || erro.response?.status === 404) {
            return null;
        }
        throw erro;
    }
};

export const getAlunos = async () => {
    try {
        const { data } = await api.get('/alunos');

        return data.map(aluno => ({
            id: aluno.id,
            name: aluno.nome,
            nome: aluno.nome,
            email: aluno.email,
            matricula: aluno.matricula,
            usuario: aluno.usuario,
            type: 'student'
        }));
    } catch (erro) {
        throw erro;
    }
};

export const createAluno = async (dadosAluno) => {
    try {
        const { data } = await api.post('/alunos', {
            nome: dadosAluno.name,
            email: dadosAluno.email,
            senha: dadosAluno.password,
            matricula: dadosAluno.matricula
        });
        return data;
    } catch (erro) {
        throw erro;
    }
};

export const getNotas = async () => {
    try {
        const { data } = await api.get('/notas');
        return data;
    } catch (erro) {
        throw erro;
    }
};

export const getNotasByAluno = async (idAluno) => {
    try {
        const { data } = await api.get('/notas');
        return data.filter(nota => nota.aluno_id === idAluno);
    } catch (erro) {
        throw erro;
    }
};

export const createNota = async (dadosNota) => {
    try {
        const payload = {
            nota: dadosNota.nota || dadosNota.media,
            dataAvaliacao: dadosNota.dataAvaliacao || dadosNota.data_avaliacao || dadosNota.date || new Date().toISOString().split('T')[0],
            alunoId: dadosNota.alunoId || dadosNota.aluno_id || dadosNota.studentId,
            professorId: dadosNota.professorId || dadosNota.professor_id || dadosNota.professorId,
            disciplinaId: dadosNota.disciplinaId || dadosNota.disciplina_id || dadosNota.disciplinaId
        };

        const { data } = await api.post('/notas', payload);
        return data;
    } catch (erro) {
        throw erro;
    }
};

export const getObservacoes = async () => {
    try {
        const { data } = await api.get('/observacoes');
        return data;
    } catch (erro) {
        throw erro;
    }
};

export const getObservacoesByAluno = async (idAluno) => {
    try {
        const { data } = await api.get('/observacoes');
        return data.filter(obs => obs.aluno_id === idAluno);
    } catch (erro) {
        throw erro;
    }
};

export const createObservacao = async (dadosObservacao) => {
    try {
        const payload = {
            observacao: dadosObservacao.observacao || dadosObservacao.observation,
            dataObservacao: dadosObservacao.dataObservacao || dadosObservacao.data_observacao || dadosObservacao.date || new Date().toISOString().split('T')[0],
            alunoId: dadosObservacao.alunoId || dadosObservacao.aluno_id || dadosObservacao.studentId,
            professorId: dadosObservacao.professorId || dadosObservacao.professor_id || dadosObservacao.professorId
        };

        const { data } = await api.post('/observacoes', payload);
        return data;
    } catch (erro) {
        throw erro;
    }
};

export const getDisciplinas = async () => {
    try {
        const { data } = await api.get('/disciplinas');
        return data;
    } catch (erro) {
        throw erro;
    }
};

export const getDisciplinaByProfessor = async (idProfessor) => {
    try {
        const { data } = await api.get('/disciplinas');
        return data.find(disc => disc.professor_id === idProfessor);
    } catch (erro) {
        throw erro;
    }
};

export const createDisciplina = async (dadosDisciplina) => {
    try {
        const { data } = await api.post('/disciplinas', {
            nome: dadosDisciplina.nome,
            descricao: dadosDisciplina.descricao,
            professor_id: dadosDisciplina.professor_id
        });
        return data;
    } catch (erro) {
        throw erro;
    }
};

export const getProfessores = async () => {
    try {
        const { data } = await api.get('/professores');
        return data;
    } catch (erro) {
        throw erro;
    }
};
