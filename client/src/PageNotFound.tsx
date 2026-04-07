import { Link } from 'react-router';
import ErrorMessage from './ErrorMessage';

export default function PageNotFound() {
  return (
    <>
      <ErrorMessage>Page not found</ErrorMessage>

      <Link to="/">Home</Link>
    </>
  );
}
