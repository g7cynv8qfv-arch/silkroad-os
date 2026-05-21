import { HomeScene } from './_components/home-scene';

export default function HomePage({ params }: { params: { locale: string } }) {
  return <HomeScene locale={params.locale} />;
}
