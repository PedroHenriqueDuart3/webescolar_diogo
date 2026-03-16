export const storage = {
    setAuth: (usuario) => {
        localStorage.setItem('auth', JSON.stringify(usuario));
    },

    getAuth: () => {
        const autenticacao = localStorage.getItem('auth');
        return autenticacao ? JSON.parse(autenticacao) : null;
    },

    clearAuth: () => {
        localStorage.removeItem('auth');
    },

    getStudents: () => {
        const alunos = localStorage.getItem('students');
        return alunos ? JSON.parse(alunos) : [];
    },

    setStudents: (alunos) => {
        localStorage.setItem('students', JSON.stringify(alunos));
    },

    addStudent: (aluno) => {
        const alunos = storage.getStudents();
        alunos.push(aluno);
        storage.setStudents(alunos);
    },

    getGrades: () => {
        const notas = localStorage.getItem('grades');
        return notas ? JSON.parse(notas) : [];
    },

    setGrades: (notas) => {
        localStorage.setItem('grades', JSON.stringify(notas));
    },

    addGrade: (nota) => {
        const notas = storage.getGrades();
        notas.push(nota);
        storage.setGrades(notas);
    },

    updateGrade: (idNota, notaAtualizada) => {
        const notas = storage.getGrades();
        const indice = notas.findIndex(n => n.id === idNota);
        if (indice !== -1) {
            notas[indice] = { ...notas[indice], ...notaAtualizada };
            storage.setGrades(notas);
        }
    },

    getComments: () => {
        const comentarios = localStorage.getItem('comments');
        return comentarios ? JSON.parse(comentarios) : [];
    },

    setComments: (comentarios) => {
        localStorage.setItem('comments', JSON.stringify(comentarios));
    },

    addComment: (comentario) => {
        const comentarios = storage.getComments();
        comentarios.push(comentario);
        storage.setComments(comentarios);
    },

    updateComment: (idComentario, comentarioAtualizado) => {
        const comentarios = storage.getComments();
        const indice = comentarios.findIndex(c => c.id === idComentario);
        if (indice !== -1) {
            comentarios[indice] = { ...comentarios[indice], ...comentarioAtualizado };
            storage.setComments(comentarios);
        }
    },

    deleteComment: (idComentario) => {
        const comentarios = storage.getComments();
        const comentariosFiltrados = comentarios.filter(c => c.id !== idComentario);
        storage.setComments(comentariosFiltrados);
    }
};
