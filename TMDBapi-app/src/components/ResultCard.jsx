import { useContext } from "react";
import { AppContext } from "../contexts/AppContext";
import { Card, ListGroup, Badge, Image } from "react-bootstrap";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w200";

export default function ResultCard() {
  const { state } = useContext(AppContext);

  if (state.status !== "done" || !state.results || state.results.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4 shadow-lg mx-auto" style={{ maxWidth: '700px' }}>
      <Card.Header as="h3" className="text-center bg-primary text-white">
        Resultados Encontrados ({state.results.length})
      </Card.Header>

      <ListGroup variant="flush">
        {state.results.map((movie) => (
          <ListGroup.Item key={movie.id} className="d-flex align-items-start p-3">

            <Image
              src={movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://placehold.co/80x120/E8E8E8/333?text=Sem+Poster'}
              alt={`Poster de ${movie.title}`}
              rounded
              style={{ width: '80px', height: '120px', objectFit: 'cover' }}
              className="me-3 flex-shrink-0"
            />

            <div className="flex-grow-1">
              <div className="d-flex justify-content-between align-items-start">
                <h5>{movie.title}</h5>
                <Badge bg="success" className="ms-2 p-2">
                  ⭐ {movie.vote_average.toFixed(1)}
                </Badge>
              </div>
              <p className="text-muted mb-1">
                Lançamento: {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
              </p>
              <p className="small">
                {movie.overview || 'Nenhuma descrição disponível.'}
              </p>
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </Card>
  );
}