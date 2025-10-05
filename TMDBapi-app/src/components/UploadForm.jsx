import { useContext, useState } from "react";
import { Form, Button, Alert, Spinner, Row, Col } from "react-bootstrap";
import { AppContext } from "../contexts/AppContext";
import Loader from "./Loader";
import axios from "axios";

export default function UploadForm() {
  const { state, dispatch } = useContext(AppContext);
  
 
  const TMDB_API_KEY = "918b7457f690598a36b2e7149a395d29"; 
  const API_BASE_URL = "https://api.themoviedb.org/3";
  
  const [query, setQuery] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  
 
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i).sort((a, b) => b - a);

  // Função central para buscar filmes na TMDB
  const fetchMovies = async (endpoint, params) => {
   
    const allParams = {
      ...params,
      api_key: TMDB_API_KEY,
      language: "pt-BR",
    };

    const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
      params: allParams,
    });
    
    // TMDB retorna resultados em response.data.results
    return response.data.results;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedQuery = query.trim();
    const trimmedYear = releaseYear.trim();

    // Verificação de preenchimento de campos obrigatórios na busca.
    // Pelo menos o Título OU o Ano deve ser preenchido.
    if (!trimmedQuery && !trimmedYear) {
      return dispatch({ type: "ERROR", payload: "Por favor, digite um Título ou selecione um Ano para a busca." });
    }

    try {
      dispatch({ type: "UPLOAD_START" }); // Status: uploading -> muda para searching
      let results = [];

      if (trimmedQuery) {
        
        const params = { query: trimmedQuery };
        if (trimmedYear) {
            params.primary_release_year = trimmedYear;
        }
        
        results = await fetchMovies("/search/movie", params);

      } else if (trimmedYear) {
        
        results = await fetchMovies("/discover/movie", {
          primary_release_year: trimmedYear,
          sort_by: "popularity.desc",
        });
      }

      if (results.length === 0) {
        dispatch({ type: "ERROR", payload: "Nenhum filme encontrado com os critérios fornecidos." });
      } else {
        
        dispatch({ type: "SUCCESS", payload: results });
      }

    } catch (err) {
      
      const apiErrorData = err.response?.data;
      const errorMessage = apiErrorData?.status_message || apiErrorData?.message || "Falha na comunicação com a API de filmes.";

      console.error("TMDB API Error Detail:", apiErrorData || err.message);

      dispatch({ type: "ERROR", payload: errorMessage });
    }
  };

  const isSearching = state.status === "uploading" || state.status === "processing";
  const statusMessage = state.status === "uploading" ? "Buscando Títulos..." : "Processando Dados...";

  

  return (
    <Form onSubmit={handleSubmit} className="p-4 border rounded bg-white shadow-lg mx-auto" style={{ maxWidth: '700px' }}>
      
      {/* Ajuste de Margem no Cabeçalho do Formulário */}
      <h2 className="text-center mb-5 text-primary">Consulta de Filmes TMDB</h2>
      
      {/* Mensagem de Erro (Validação ou API) */}
      {state.status === "error" && <Alert variant="danger">{state.error}</Alert>}

      {/* CORREÇÃO DE ALINHAMENTO: Adicionado align-items-start na Row */}
      <Row className="g-3 mb-4 align-items-start"> 
        {/* Campo de Busca por Título */}
        <Col md={8}>
          <Form.Group controlId="formQuery">
            <Form.Label>Título do Filme (Opcional)</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ex: Matrix, Vingadores, Interestelar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
            />
          </Form.Group>
        </Col>

        {/* Campo de Busca por Ano */}
        <Col md={4}>
          <Form.Group controlId="formReleaseYear">
            <Form.Label>Ano de Lançamento (Opcional)</Form.Label>
            <Form.Control
              as="select"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              disabled={isSearching}
            >
              <option value="">Qualquer Ano</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Form.Control>
          </Form.Group>
        </Col>
      </Row>

      {/* Loader */}
      {isSearching && <Loader message={statusMessage} />}

      {/* Botão de Busca */}
      <Button 
        type="submit" 
        variant="primary" 
        // Habilita o botão se a query OU o ano não estiverem vazios
        disabled={isSearching || (!query.trim() && !releaseYear.trim())}
        className="w-100 mt-2" // Ajuste sutil de margem para afastar do Loader/Erros
      >
        {isSearching ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Buscando...
          </>
        ) : (
          "Buscar Filmes"
        )}
      </Button>
    </Form>
  );
}
