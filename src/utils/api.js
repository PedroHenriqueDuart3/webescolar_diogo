import axios from 'axios';
import { storage } from './storage';

const BASE_URL = 'https://web-escolar.onrender.com';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

// Adicionar o token JWT em todas as requisições (exceto login)
api.interceptors.request.use(
    (config) => {
        // Não adiciona token para requisições de login
        if (config.url?.includes('/auth/login')) {
            return config;
        }

        const auth = storage.getAuth();

        if (auth && auth.token) {
            config.headers.Authorization = `Bearer ${auth.token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Tratar os erros de resposta
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error('Erro 401: Token inválido ou expirado');
            console.error('Resposta da API:', error.response?.data);
        }
        return Promise.reject(error);
    }
);

//      AUTENTICAÇÃO
export const login = async (identifier, password) => {
    try {
        console.log('=== TENTANDO LOGIN ===');

        // Tenta primeiro como professor (campo usuario)
        const payloadProfessor = {
            usuario: identifier,
            senha: password
        };

        console.log('Tentando login como professor...');

        try {
            const { data } = await api.post('/auth/login', payloadProfessor);

            console.log('Login bem-sucedido!');
            console.log('Resposta da API:', data);

            if (data.token && data.tipo === 'PROFESSOR') {
                const userData = {
                    token: data.token,
                    id: data.id,
                    usuario: data.usuario,
                    name: data.usuario,
                    type: 'professor'
                };

                console.log('Dados do professor preparados');
                return userData;
            }
        } catch (professorError) {
            // Se falhar como professor, tenta como aluno
            console.log('Não é professor, tentando como aluno...');
        }

        // Tenta como aluno (campo matricula)
        const payloadAluno = {
            matricula: identifier,
            senha: password
        };

        console.log('Tentando login como aluno...');

        const { data } = await api.post('/auth/login', payloadAluno);

        console.log('Login bem-sucedido!');
        console.log('Resposta da API:', data);

        if (data.token && data.tipo === 'ALUNO') {
            const userData = {
                token: data.token,
                id: data.id,
                usuario: data.usuario,
                name: data.usuario,
                matricula: identifier,
                type: 'aluno'
            };

            console.log('Dados do aluno preparados');
            return userData;
        }

        return null;
    } catch (error) {
        console.error('=== ERRO NO LOGIN ===');
        console.error('Status:', error.response?.status);
        console.error('Resposta completa:', error.response);
        console.error('Dados da resposta:', error.response?.data);
        console.error('Mensagem:', error.message);

        if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

//      ALUNOS
export const getAlunos = async () => {
    try {
        console.log('Buscando alunos...');
        const { data } = await api.get('/alunos');
        console.log('Alunos carregados:', data.length);

        if (data.length > 0) {
            console.log('Exemplo de aluno da API:', data[0]);
            console.log('Campos do aluno:', Object.keys(data[0]));
        }

        return data.map(aluno => ({
            id: aluno.id,
            name: aluno.nome,
            nome: aluno.nome,
            email: aluno.email,
            matricula: aluno.matricula,
            usuario: aluno.usuario,
            type: 'student'
        }));
    } catch (error) {
        console.error('Erro ao buscar alunos:', error.response?.status, error.message);
        throw error;
    }
};

export const createAluno = async (alunoData) => {
    try {
        const { data } = await api.post('/alunos', {
            nome: alunoData.name,
            email: alunoData.email,
            senha: alunoData.password,
            matricula: alunoData.matricula
        });
        return data;
    } catch (error) {
        console.error('Erro ao criar aluno:', error);
        throw error;
    }
};

//      NOTAS
export const getNotas = async () => {
    try {
        const { data } = await api.get('/notas');
        return data;
    } catch (error) {
        console.error('Erro ao buscar notas:', error);
        throw error;
    }
};

export const getNotasByAluno = async (alunoId) => {
    try {
        const { data } = await api.get('/notas');
        return data.filter(nota => nota.aluno_id === alunoId);
    } catch (error) {
        console.error('Erro ao buscar notas do aluno:', error);
        throw error;
    }
};

export const createNota = async (notaData) => {
    try {
        const payload = {
            nota: notaData.nota || notaData.media,
            dataAvaliacao: notaData.dataAvaliacao || notaData.data_avaliacao || notaData.date || new Date().toISOString().split('T')[0],
            alunoId: notaData.alunoId || notaData.aluno_id || notaData.studentId,
            professorId: notaData.professorId || notaData.professor_id || notaData.professorId,
            disciplinaId: notaData.disciplinaId || notaData.disciplina_id || notaData.disciplinaId
        };

        console.log('   Criando nota...');

        const { data } = await api.post('/notas', payload);

        console.log('Nota criada:', data);
        return data;
    } catch (error) {
        console.error('   Erro ao criar nota:', error.response?.status);
        console.error('   Resposta da API:', error.response?.data);
        console.error('   Mensagem completa:', error.response?.data?.message);
        throw error;
    }
};

//      OBSERVAÇÕES
export const getObservacoes = async () => {
    try {
        const { data } = await api.get('/observacoes');
        return data;
    } catch (error) {
        console.error('Erro ao buscar observações:', error);
        throw error;
    }
};

export const getObservacoesByAluno = async (alunoId) => {
    try {
        const { data } = await api.get('/observacoes');
        return data.filter(obs => obs.aluno_id === alunoId);
    } catch (error) {
        console.error('Erro ao buscar observações do aluno:', error);
        throw error;
    }
};

export const createObservacao = async (observacaoData) => {
    try {
        const payload = {
            observacao: observacaoData.observacao || observacaoData.observation,
            dataObservacao: observacaoData.dataObservacao || observacaoData.data_observacao || observacaoData.date || new Date().toISOString().split('T')[0],
            alunoId: observacaoData.alunoId || observacaoData.aluno_id || observacaoData.studentId,
            professorId: observacaoData.professorId || observacaoData.professor_id || observacaoData.professorId
        };

        const { data } = await api.post('/observacoes', payload);
        return data;
    } catch (error) {
        console.error('Erro ao criar observação:', error);
        throw error;
    }
};

//      DISCIPLINAS
export const getDisciplinas = async () => {
    try {
        console.log('Buscando disciplinas...');
        const { data } = await api.get('/disciplinas');
        console.log('Disciplinas carregadas:', data.length);
        return data;
    } catch (error) {
        console.error('Erro ao buscar disciplinas:', error.response?.status, error.message);
        throw error;
    }
};

export const getDisciplinaByProfessor = async (professorId) => {
    try {
        const { data } = await api.get('/disciplinas');
        return data.find(disc => disc.professor_id === professorId);
    } catch (error) {
        console.error('Erro ao buscar disciplina do professor:', error);
        throw error;
    }
};

export const createDisciplina = async (disciplinaData) => {
    try {
        const { data } = await api.post('/disciplinas', {
            nome: disciplinaData.nome,
            descricao: disciplinaData.descricao,
            professor_id: disciplinaData.professor_id
        });
        return data;
    } catch (error) {
        console.error('Erro ao criar disciplina:', error);
        throw error;
    }
};

//      PROFESSORES
export const getProfessores = async () => {
    try {
        const { data } = await api.get('/professores');
        return data;
    } catch (error) {
        console.error('Erro ao buscar professores:', error);
        throw error;
    }
};
