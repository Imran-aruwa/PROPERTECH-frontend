import type { Metadata } from 'next';
import PublicListingClient from './PublicListingClient';

interface Props {
  params: { slug: string };
  searchParams: { ref?: string };
}

// ── generateMetadata for SEO & Open Graph ──────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.BACKEND_URL ||
    'https://propertech-backend-production.up.railway.app';

  try {
    const res = await fetch(
      `${backendUrl}/api/listings/public/${params.slug}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error('Not found');
    const listing = await res.json();

    const title = `${listing.title} – KES ${Number(listing.monthly_rent).toLocaleString()}/mo`;
    const description =
      listing.description?.slice(0, 160) ||
      `${listing.title} available for rent at KES ${Number(listing.monthly_rent).toLocaleString()} per month.`;
    const image = listing.photos?.[0] || '/og-default.jpg';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: image, width: 1200, height: 630 }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'Property Listing | PROPERTECH',
      description: 'Find your next home with PROPERTECH',
    };
  }
}

export default function PublicListingPage({ params, searchParams }: Props) {
  return <PublicListingClient slug={params.slug} ref={searchParams.ref} />;
}
