import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://hrgov.gioiliop.eu"
    : "http://localhost:3000";

export async function generateMetadata(props: Props): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const orgId = searchParams.org;

  let pageTitle = "The Greek Extended Registry";
  let description = "Προβολή στοιχείων δημόσιου φορέα.";

  if (orgId) {
    try {
      const response = await fetch(`${BASE_URL}/api/organizations/${orgId}`, {
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.data?.preferredLabel) {
          pageTitle = `${data.data.preferredLabel} | The Greek Extended Registry`;
          description = `Δείτε το οργανόγραμμα και τα στοιχεία για: ${data.data.preferredLabel}`;
        } else {
          pageTitle = `Οργανισμός ${orgId} | The Greek Extended Registry`;
        }
      }
    } catch (error) {
      console.error("Metadata fetch error:", error);
      pageTitle = `Οργανισμός ${orgId} | The Greek Extended Registry`;
    }
  }

  const params = new URLSearchParams();
  if (orgId) {
    params.set("org", orgId as string);
  }
  const ogImageUrl = `${BASE_URL}/api/og?${params.toString()}`;

  return {
    title: pageTitle,
    description: description,
    openGraph: {
      title: pageTitle,
      description: description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: pageTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: description,
      images: [ogImageUrl],
    },
  };
}

export default function Page() {
  return <HomeClient />;
}
