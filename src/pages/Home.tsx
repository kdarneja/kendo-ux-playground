import { Link } from 'react-router-dom';
import { routes } from '../routes';

export default function Home() {
  const launcherRoutes = routes.filter((r) => r.path !== '/');

  return (
    <div className="beghou-page">
      <div className="beghou-launcher-grid">
        {launcherRoutes.map((r) => (
          <Link key={r.path} to={r.path} className="beghou-launcher-card">
            <h2 className="beghou-launcher-card__title">{r.label}</h2>
            <p className="beghou-launcher-card__desc">{r.description}</p>
            <span className="beghou-launcher-card__action">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
