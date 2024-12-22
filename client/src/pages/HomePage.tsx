import { useUser } from "../hooks/use-user";
import { useTeams } from "../hooks/use-teams";
import { Button } from "@/components/ui/button";
import { CreateTeamDialog } from "../components/CreateTeamDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layout } from "../components/Layout";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logout } = useUser();
  const { teams, isLoading } = useTeams();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.email}</h1>
          <Button variant="outline" onClick={() => logout()}>Logout</Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams?.map((team) => (
              <div key={team.id} className="block">
                <Link to={`/team/${team.id}/news`}>
                  <Card className="transition-colors hover:bg-accent cursor-pointer">
                    <CardHeader>
                      <CardTitle>{team.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Click to manage players, matches, and events.
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            ))}

          {user?.role === "admin" && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Team</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateTeamDialog />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}