import { DeskView } from "@/components/desk-view";

// No searchParams: the search and beat live in the URL fragment, so they never reach the server.
export default function Home() {
  return <DeskView />;
}
