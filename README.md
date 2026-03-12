# Sistema de Gestão Escolar

Sistema web completo para gestão acadêmica, desenvolvido com React + Vite, permitindo o gerenciamento de alunos, professores, notas e observações pedagógicas.

## Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
- [Uso](#uso)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API](#api)
- [Contribuindo](#contribuindo)

## Sobre o Projeto

O Sistema de Gestão Escolar é uma aplicação web moderna que facilita a administração acadêmica, oferecendo interfaces distintas para professores e alunos. O sistema permite o lançamento de notas, registro de observações pedagógicas, visualização de desempenho acadêmico e geração de boletins em PDF.

## Funcionalidades

### Dashboard do Professor

- **Gestão de Alunos**
  - Visualização de lista completa de alunos
  - Busca por nome ou matrícula
  - Acesso rápido às informações de cada aluno

- **Lançamento de Notas**
  - Adicionar notas individuais (N1 e N2)
  - Edição em massa de notas por tabela
  - Cálculo automático de médias
  - Visualização de status de aprovação/reprovação

- **Observações Pedagógicas**
  - Adicionar observações para alunos
  - Editar e excluir observações existentes
  - Histórico completo de observações por aluno

- **Business Intelligence (BI)**
  - Gráficos de desempenho da turma
  - Estatísticas de aprovação/reprovação
  - Análise de médias por disciplina
  - Visualização de tendências acadêmicas

### Dashboard do Aluno

- **Visualização de Notas**
  - Notas organizadas por disciplina
  - Médias calculadas automaticamente
  - Status de aprovação/reprovação
  - Média geral do período

- **Observações dos Professores**
  - Histórico completo de observações
  - Organização por disciplina e data
  - Feedback dos professores

- **Download de Boletim em PDF**
  - Geração automática de boletim personalizado
  - Cabeçalho institucional profissional
  - Tabela completa de notas e médias
  - Inclusão de observações dos professores
  - Rodapé com data/hora de emissão
  - Paginação automática

### Sistema de Autenticação

- Login diferenciado para professores e alunos
- Cadastro de novos usuários
- Autenticação via JWT (JSON Web Token)
- Persistência de sessão com localStorage
- Logout seguro

## Tecnologias

### Frontend

- **React 19.2.0** - Biblioteca JavaScript para interfaces
- **Vite 7.2.4** - Build tool e dev server
- **Axios 1.13.5** - Cliente HTTP para requisições à API
- **React Icons 5.5.0** - Biblioteca de ícones
- **Chart.js 4.5.1** - Gráficos e visualizações
- **React-Chartjs-2 5.3.1** - Wrapper React para Chart.js
- **jsPDF 2.5.2** - Geração de PDFs
- **jsPDF-AutoTable 3.8.4** - Tabelas para PDFs

### Ferramentas de Desenvolvimento

- **ESLint** - Linter para JavaScript
- **Vite Plugin React** - Plugin oficial do React para Vite

## Instalação

### Pré-requisitos

- Node.js (versão 16 ou superior)
- npm ou yarn

### Passos

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd sistema_escolar
```

2. Instale as dependências:
```bash
npm install
```

3. Configure a URL da API:
   - Edite o arquivo `src/utils/api.js`
   - Altere a constante `BASE_URL` se necessário:
```javascript
const BASE_URL = 'https://web-escolar.onrender.com';
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse a aplicação:
```
http://localhost:5173
```

## Uso
### Login como Professor

1. Acesse a página de login
2. Digite seu usuário e senha
3. Clique em "Entrar"
4. Você será redirecionado para o Dashboard do Professor

### Login como Aluno

1. Acesse a página de login
2. Digite sua matrícula e senha
3. Clique em "Entrar"
4. Você será redirecionado para o Dashboard do Aluno

### Cadastro de Novo Usuário

1. Na página de login, clique em "Cadastre-se"
2. Preencha os dados solicitados:
   - Nome completo
   - Email
   - Matrícula (para alunos) ou Usuário (para professores)
   - Senha
   - Tipo de usuário (Aluno ou Professor)
3. Clique em "Cadastrar"
4. Faça login com suas credenciais

### Baixar Boletim (Aluno)

1. Acesse a aba "Notas"
2. Clique no botão "Baixar Boletim" (ícone de download)
3. O PDF será gerado e baixado automaticamente
4. Abra o arquivo para visualizar seu boletim completo

## Estrutura do Projeto

```
sistema_escolar/
├── public/                 # Arquivos públicos estáticos
├── src/
│   ├── assets/            # Imagens e recursos
│   ├── components/        # Componentes reutilizáveis
│   │   ├── AlertModal.jsx
│   │   └── Header.jsx
│   ├── pages/             # Páginas da aplicação
│   │   ├── BIDashboard.jsx
│   │   ├── Login.jsx
│   │   ├── ProfessorDashboard.jsx
│   │   ├── Register.jsx
│   │   └── StudentDashboard.jsx
│   ├── styles/            # Arquivos CSS
│   │   ├── AlertModal.css
│   │   ├── BIDashboard.css
│   │   ├── Header.css
│   │   ├── Login.css
│   │   ├── ProfessorDashboard.css
│   │   ├── Register.css
│   │   └── StudentDashboard.css
│   ├── utils/             # Utilitários e helpers
│   │   ├── api.js         # Configuração da API
│   │   └── storage.js     # Gerenciamento de localStorage
│   ├── App.jsx            # Componente principal
│   ├── App.css            # Estilos globais
│   ├── main.jsx           # Ponto de entrada
│   └── index.css          # Estilos base
├── .gitignore
├── eslint.config.js       # Configuração do ESLint
├── index.html             # HTML principal
├── package.json           # Dependências e scripts
├── vite.config.js         # Configuração do Vite
└── README.md              # Este arquivo
```

## API

O sistema se conecta a uma API REST hospedada em:
```
https://web-escolar.onrender.com
```

### Endpoints Principais

#### Autenticação
- `POST /auth/login` - Login de usuários

#### Alunos
- `GET /alunos` - Lista todos os alunos
- `POST /alunos` - Cria novo aluno

#### Notas
- `GET /notas` - Lista todas as notas
- `POST /notas` - Cria nova nota

#### Observações
- `GET /observacoes` - Lista todas as observações
- `POST /observacoes` - Cria nova observação

#### Disciplinas
- `GET /disciplinas` - Lista todas as disciplinas
- `POST /disciplinas` - Cria nova disciplina

#### Professores
- `GET /professores` - Lista todos os professores

### Autenticação JWT

Todas as requisições (exceto login) requerem um token JWT no header:
```
Authorization: Bearer <token>
```

O token é obtido no login e armazenado automaticamente no localStorage.

## Critérios de Avaliação

### Por Disciplina
- **Aprovado**: Média ≥ 6.0
- **Reprovado**: Média < 6.0

### Média Geral
- **Aprovado**: Média ≥ 7.0
- **Reprovado**: Média < 7.0

## Scripts Disponíveis

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar linter
npm run lint

# Preview da build de produção
npm run preview
```

## Personalização

### Cores Institucionais

As cores principais podem ser alteradas nos arquivos CSS:
- Azul institucional: `#2135A4`
- Verde (aprovado): `#28a745`
- Vermelho (reprovado): `#dc3545`

### Logo e Branding

Para adicionar o logo da instituição:
1. Adicione a imagem em `src/assets/`
2. Importe no componente desejado
3. Atualize o cabeçalho do PDF em `StudentDashboard.jsx`

## Solução de Problemas

### Erro: "doc.autoTable is not a function"

Este erro foi corrigido atualizando as versões do jsPDF. Se persistir:

```bash
npm uninstall jspdf jspdf-autotable
npm install jspdf@^2.5.2 jspdf-autotable@^3.8.4
npm run dev
```

### Erro de CORS

Se encontrar erros de CORS, verifique se a API está configurada corretamente para aceitar requisições do seu domínio.

### Token Expirado

Se receber erro 401, faça logout e login novamente para obter um novo token.

## Licença

Este projeto é de uso educacional.

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## Suporte

Para suporte e dúvidas, entre em contato através dos canais oficiais da instituição.

---

Desenvolvido para facilitar a gestão acadêmica
