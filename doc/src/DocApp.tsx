import { AppLayout, Footer, Header, I18nProvider, Menu, type MenuItem } from '@innotrec/ui';
import { useEffect, type ReactElement } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { BackendPage } from './pages/BackendPage';
import { ComponentsPage } from './pages/ComponentsPage';
import { CreateComponentPage } from './pages/CreateComponentPage';
import { DeploymentPage } from './pages/DeploymentPage';
import { EnvironmentPage } from './pages/EnvironmentPage';
import { FrontendPage } from './pages/FrontendPage';
import { GettingStartedPage } from './pages/GettingStartedPage';
import { OverviewPage } from './pages/OverviewPage';
import { SecurityPage } from './pages/SecurityPage';
import { TestingPage } from './pages/TestingPage';
import { UpdatingPage } from './pages/UpdatingPage';

export const PAGES: Array<MenuItem & { to: string; element: ReactElement }> = [
  { label: 'Overview', to: '/', element: <OverviewPage /> },
  { label: 'Getting started', to: '/getting-started', element: <GettingStartedPage /> },
  { label: 'Backend library', to: '/backend', element: <BackendPage /> },
  { label: 'Frontend library', to: '/frontend', element: <FrontendPage /> },
  { label: 'Components', to: '/components', element: <ComponentsPage /> },
  { label: 'Create a component', to: '/create-component', element: <CreateComponentPage /> },
  { label: 'Environment (.env)', to: '/environment', element: <EnvironmentPage /> },
  { label: 'Security', to: '/security', element: <SecurityPage /> },
  { label: 'Testing', to: '/testing', element: <TestingPage /> },
  { label: 'Deployment', to: '/deployment', element: <DeploymentPage /> },
  { label: 'Updating the libraries', to: '/updating', element: <UpdatingPage /> },
];

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function DocApp() {
  return (
    <I18nProvider>
      <ScrollToTop />
      <AppLayout
        header={
          <Header
            title="Innotrec libraries · docs"
            logoSrc={`${import.meta.env.BASE_URL}logo.svg`}
          />
        }
        sidebar={
          <Menu
            orientation="vertical"
            ariaLabel="Documentation"
            items={PAGES.map(({ label, to }) => ({ label, to }))}
          />
        }
        footer={<Footer owner="Innotrec" />}
        className="doc"
      >
        <Routes>
          {PAGES.map((page) => (
            <Route key={page.to} path={page.to} element={page.element} />
          ))}
          <Route path="*" element={<OverviewPage />} />
        </Routes>
      </AppLayout>
    </I18nProvider>
  );
}
