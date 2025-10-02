import React, { useContext, useState } from 'react';
import { Form, Button, Alert, Card, Spinner, Container } from 'react-bootstrap';
import CepContext from '../contexts/CepContext';

export default function CepSearch() {
  const [cepInput, setCepInput] = useState('');
  const { state, fetchCep } = useContext(CepContext);
  const { loading, error, data } = state;

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchCep(cepInput.trim());
  };

  return (
    <Container className="py-5">
      <h2>Buscar CEP</h2>

      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="cep">
          <Form.Label>CEP *</Form.Label>
          <Form.Control
            type="text"
            placeholder="Digite o CEP (ex: 01001000)"
            value={cepInput}
            onChange={(e) => setCepInput(e.target.value)}
            required
          />
        </Form.Group>

        <Button type="submit" variant="primary" className="mt-3" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Buscar'}
        </Button>
      </Form>

      {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

      {data && (
        <Card className="mt-3">
          <Card.Body>
            <Card.Title>Resultado do CEP</Card.Title>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
}
