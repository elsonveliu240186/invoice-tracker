import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/shared/components/PageHeader';
import { Card, CardContent } from '@/shared/ui/card';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div data-testid="home-page">
      <PageHeader title={t('home.title')} description={t('home.subtitle')} />
      <Card>
        <CardContent className="pt-6">
          <nav>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/clients"
                  className="text-[var(--color-primary)] hover:underline"
                  data-testid="link-clients"
                >
                  {t('home.ctaClients')}
                </Link>
              </li>
            </ul>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
