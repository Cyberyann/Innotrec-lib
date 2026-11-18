import { Card } from '@innotrec/ui';
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <Card title="Page not found">
      <p>
        This page does not exist. <Link to="/">Back to the dashboard</Link>
      </p>
    </Card>
  );
}
