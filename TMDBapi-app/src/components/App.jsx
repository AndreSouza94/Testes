import UploadForm from "./UploadForm";
import ResultCard from "./ResultCard";
import { Container } from "react-bootstrap";
import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";

export default function App() {
  const { state } = useContext(AppContext);

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4 text-primary">UTFPR - Projeto Web Fullstack</h1>
      <h3 className="text-center mb-5 text-secondary">Consulta de Filmes (TMDB API)</h3>

      <UploadForm />

      {state.status === 'done' && <ResultCard />}

    </Container>
  );
}
