import Spinner from "react-bootstrap/Spinner";

export default function Loader({ message }) {
  return (
    <div className="text-center my-4">
      <Spinner animation="border" role="status" variant="primary" />
      <p className="mt-2 text-primary">{message}</p>
    </div>
  );
}
