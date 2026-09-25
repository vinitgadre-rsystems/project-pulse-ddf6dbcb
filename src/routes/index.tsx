import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Activity, ArrowRight, Loader2 } from "lucide-react";
import commonLogo from "@/assets/common-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RethinkFirst Pulse – Health & Performance Dashboard | RSI" },
      {
        name: "description",
        content:
          "Executive dashboard comparing team delivery health across sprints and months: ticket readiness, self QA, completion ratio and process hygiene. Sign in to access.",
      },
      { property: "og:title", content: "RethinkFirst Pulse – Health & Performance Dashboard" },
      {
        property: "og:description",
        content:
          "Track team compliance, sprint trends and process hygiene in one leadership view. Sign in to access the dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && session) void navigate({ to: "/dashboard" });
  }, [loading, session, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <img
          src={commonLogo.url}
          alt="RSI and RethinkFirst"
          className="mx-auto h-16 w-64 object-contain"
        />
        <h1 className="mt-6 text-2xl font-semibold leading-tight text-foreground">
          RethinkFirst Pulse – Health & Performance Dashboard
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Delivery compliance and process hygiene across engineering teams. Sign in to
          view delivery reports, sprint trends and team health metrics.
        </p>
        <div className="mt-8">
          {loading ? (
            <Button disabled className="w-full sm:w-auto">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking session…
            </Button>
          ) : (
            <Button asChild className="w-full sm:w-auto">
              <Link to="/auth">
                <Activity className="mr-2 h-4 w-4" />
                Sign in to continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
