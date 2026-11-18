import { Alert, Card, Chart, Image, Spinner, useAuth, type ChartDatum } from '@innotrec/ui';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { notesApi } from '../api/notes';

export function DashboardPage() {
  const { user, client } = useAuth();
  const api = useMemo(() => notesApi(client), [client]);
  const [stats, setStats] = useState<ChartDatum[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .stats()
      .then(setStats)
      .catch((e: Error) => setError(e.message));
  }, [api]);

  return (
    <>
      <div className="hero">
        <Image src="/logo.svg" alt="" width={56} height={56} rounded />
        <div>
          <h1 className="page-title">Hello {user?.first_name || user?.email} 👋</h1>
          {!user?.two_factor_enabled && (
            <Alert variant="warning">
              Protect your account: <Link to="/profile">enable two-factor authentication</Link>.
            </Alert>
          )}
        </div>
      </div>
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid">
        <Card title="Notes per category">
          {stats ? (
            <Chart type="bar" title="Notes per category" hideTitle data={stats} />
          ) : (
            <Spinner center />
          )}
        </Card>
        <Card title="Distribution">
          {stats ? (
            <Chart type="donut" title="Distribution of notes" hideTitle data={stats} />
          ) : (
            <Spinner center />
          )}
        </Card>
      </div>
    </>
  );
}
