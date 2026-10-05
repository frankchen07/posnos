import { CateringApp } from "@/components/catering-app";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { event } = await searchParams;
  return <CateringApp initialEventId={typeof event === "string" ? event : null} />;
}
