import React, { useContext } from 'react';
import { Button, Container, Spinner, Alert, Card } from 'react-bootstrap';
import ApiContext from '../contexts/ApiContext';

export default function ApiViewer() {
  const { state, fetchData } = useContext(ApiContext);
  const { loading, error, data } = state;

  return (
    <Container className="py-5">
      <h1 className="mb-4">ILoveAPI com useReducer + Context</h1>

      <Button onClick={fetchData} variant="primary" disabled={loading}>
        {loading ? <Spinner animation="border" size="sm" /> : 'Buscar Dados'}
      </Button>

      <div className="mt-4">
        {error && <Alert variant="danger">{error}</Alert>}
        {data && (
          <Card>
            <Card.Body>
              <Card.Title>Resultado:</Card.Title>
              <pre>{JSON.stringify(data, null, 2)}</pre>
            </Card.Body>
          </Card>
        )}
      </div>
    </Container>
  );
}
