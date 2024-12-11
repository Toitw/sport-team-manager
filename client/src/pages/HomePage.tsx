import { useUser } from "../hooks/use-user";
import { useTeams } from "../hooks/use-teams";
import { Button } from "@/components/ui/button";
import { CreateTeamDialog } from "../components/CreateTeamDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function HomePage() {
  const { user, logout } = useUser();
  const { teams, isLoading } = useTeams();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.username}</h1>
        <Button variant="outline" onClick={() => logout()}>Logout</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teams?.map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle>{team.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Link href={`/team/${team.id}/players`}>
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Players
                  </Button>
                </Link>
                <Link href={`/team/${team.id}/matches`}>
                  <Button variant="outline" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Matches
                  </Button>
                </Link>
                <Link href={`/team/${team.id}/events`}>
                  <Button variant="outline" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Events
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
  );
}
