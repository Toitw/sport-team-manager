import { Layout } from "../components/Layout";
import { useUser } from "../hooks/use-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type User = {
  id: number;
  email: string;
  role: string;
};

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      return response.json();
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: number; newRole: string }) => {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to update role");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Success",
        description: `User role updated to ${variables.newRole} successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <Layout>
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-8">Access Denied</h1>
          <p>You need to be an admin to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : !users?.length ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((currentUser) => (
                  <TableRow key={currentUser.id}>
                    <TableCell>{currentUser.email}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset">
                        {currentUser.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {currentUser.id === user.id ? (
                        <span className="text-sm text-muted-foreground">Cannot modify own role</span>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <AlertDialog>
                              <div className="flex items-center gap-2">
                                <select
                                  className="w-[180px] rounded-md border bg-background px-3 py-2 text-sm ring-offset-background"
                                  value={currentUser.role}
                                  onChange={(e) => {
                                    const newRole = e.target.value;
                                    if (newRole !== currentUser.role) {
                                      const dialog = document.getElementById(`role-trigger-${currentUser.id}`);
                                      if (dialog) {
                                        (dialog as HTMLButtonElement).click();
                                      }
                                    }
                                  }}
                                >
                                  <option value="reader">Reader</option>
                                  <option value="manager">Manager</option>
                                  <option value="admin">Admin</option>
                                </select>
                                <AlertDialogTrigger id={`role-trigger-${currentUser.id}`} className="hidden" />
                              </div>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Change User Role</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to change this user's role? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => {
                                    const select = document.querySelector(`select[value="${currentUser.role}"]`) as HTMLSelectElement;
                                    if (select) select.value = currentUser.role;
                                  }}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => {
                                    updateRole.mutate({
                                      userId: currentUser.id,
                                      newRole: document.querySelector(`select[value="${currentUser.role}"]`)?.value || currentUser.role
                                    });
                                  }}>Continue</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}