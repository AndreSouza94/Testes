# TMDBapi-app

O **TMDBapi-app** é uma aplicação React desenvolvida para a disciplina de **Programação Web Fullstack**.  
O principal objetivo do projeto é demonstrar a integração de uma aplicação front-end com a API externa [The Movie Database (TMDB)](https://www.themoviedb.org/) para buscar e exibir informações sobre filmes.

---

## Componentes Principais

### `App.jsx`
- Componente raiz da aplicação.
- Responsável por renderizar:
  - Título e subtítulo da aplicação.
  - Componentes `UploadForm` e `ResultCard`.
- Utiliza o `AppContext` para acessar o estado global.
- Renderiza o `ResultCard` somente quando a busca é concluída (`state.status === 'done'`).

### `UploadForm.jsx`
- Gerencia o formulário de busca de filmes.
- Controla os campos de entrada:
  - `query` → Título do filme.
  - `releaseYear` → Ano de lançamento.
- Lógica de busca encapsulada na função `handleSubmit`:
  - Faz requisições à API do TMDB usando `axios`.
  - Atualiza o estado global (`dispatch`) com os status:
    - `SEARCH_START`
    - `SUCCESS`
    - `ERROR`
  - Armazena os resultados obtidos.

### `ResultCard.jsx`
- Exibe os resultados da busca em uma lista de cartões (`Card`).
- Cada cartão contém:
  - Pôster do filme.
  - Título.
  - Nota média (`vote_average`).
  - Ano de lançamento.
  - Breve sinopse.

### `Loader.jsx`
- Componente simples para exibir um **spinner de carregamento**.
- Mostra uma mensagem informativa enquanto a busca está em andamento.

---

## Gerenciamento de Estado

O estado global da aplicação é gerenciado utilizando a **Context API do React**.

### `AppContext.js`
- Cria o contexto da aplicação.

### `appReducer.js`
- Define a lógica para gestão do estado.
- Status possíveis:
  - `idle` → Inicial, sem busca realizada.
  - `loading` → Busca em andamento.
  - `done` → Busca concluída com sucesso.
  - `error` → Erro durante a busca.
- Armazena:
  - Termo de busca.
  - Lista de resultados.
  - Mensagens de erro.

### `AppProvider.jsx`
- Componente que envolve toda a aplicação.
- Fornece:
  - Estado global.
  - Função `dispatch` para atualizar o estado.

---

## Configurações e Dependências

- **Bundler**: [Vite](https://vitejs.dev/)
- **Linting**: ESLint configurado para garantir a qualidade do código.
- **Dependências** (conforme `package.json`):
  - `react`
  - `react-dom`
  - `axios`
  - `bootstrap`
  - `react-bootstrap`
  - `gh-pages` (para deploy no GitHub Pages)

---

## Objetivos do Projeto

- Demonstrar o desenvolvimento de uma **Single Page Application (SPA)** em React.
- Cobrir conceitos como:
  - Requisições HTTP assíncronas.
  - Gerenciamento de estado global.
  - Renderização condicional de componentes.
  - Integração com APIs externas.
