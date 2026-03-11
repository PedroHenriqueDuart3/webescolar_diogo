export const storage = {
    setAuth: (user) => {
        localStorage.setItem('auth', JSON.stringify(user));
    },

    getAuth: () => {
        const auth = localStorage.getItem('auth');
        return auth ? JSON.parse(auth) : null;
    },

    clearAuth: () => {
        localStorage.removeItem('auth');
    },

    // Students
    getStudents: () => {
        const students = localStorage.getItem('students');
        return students ? JSON.parse(students) : [];
    },

    setStudents: (students) => {
        localStorage.setItem('students', JSON.stringify(students));
    },

    addStudent: (student) => {
        const students = storage.getStudents();
        students.push(student);
        storage.setStudents(students);
    },

    getGrades: () => {
        const grades = localStorage.getItem('grades');
        return grades ? JSON.parse(grades) : [];
    },

    setGrades: (grades) => {
        localStorage.setItem('grades', JSON.stringify(grades));
    },

    addGrade: (grade) => {
        const grades = storage.getGrades();
        grades.push(grade);
        storage.setGrades(grades);
    },

    updateGrade: (gradeId, updatedGrade) => {
        const grades = storage.getGrades();
        const index = grades.findIndex(g => g.id === gradeId);
        if (index !== -1) {
            grades[index] = { ...grades[index], ...updatedGrade };
            storage.setGrades(grades);
        }
    },

    getComments: () => {
        const comments = localStorage.getItem('comments');
        return comments ? JSON.parse(comments) : [];
    },

    setComments: (comments) => {
        localStorage.setItem('comments', JSON.stringify(comments));
    },

    addComment: (comment) => {
        const comments = storage.getComments();
        comments.push(comment);
        storage.setComments(comments);
    },

    updateComment: (commentId, updatedComment) => {
        const comments = storage.getComments();
        const index = comments.findIndex(c => c.id === commentId);
        if (index !== -1) {
            comments[index] = { ...comments[index], ...updatedComment };
            storage.setComments(comments);
        }
    },

    deleteComment: (commentId) => {
        const comments = storage.getComments();
        const filteredComments = comments.filter(c => c.id !== commentId);
        storage.setComments(filteredComments);
    }
};
