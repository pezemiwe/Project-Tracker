import { useState } from 'react';
import { useUsers, useDeleteUser, User } from '../hooks/useUsers';
import { Button } from '../components/ui/button';
import { UserForm } from '../components/admin/UserForm';
import { LoadingState } from '../components/ui/loading-state';
import { EmptyState } from '../components/ui/empty-state';
import { useConfirmDialog } from '../components/ui/confirm-dialog';
import { useToast } from '../hooks/useToast';
import { Users as UsersIcon, Trash2 } from 'lucide-react';

export function UsersPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { data, isLoading, error } = useUsers();
  const deleteUser = useDeleteUser();
  const { toast } = useToast();
  const { confirm, confirmDialog } = useConfirmDialog();

  const handleDeleteUser = async (user: User) => {
    try {
      await deleteUser.mutateAsync(user.id);
      toast({
        title: 'User deleted',
        description: `${user.fullName} has been removed from the system.`,
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete user. Please try again.',
        variant: 'error',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingState size="lg" message="Loading users..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <EmptyState
          variant="error"
          title="Error Loading Users"
          description="Failed toload user data. Please try again."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-2xl text-foreground mb-1">User Management</h1>
              <p className="text-muted-foreground text-sm">Manage system users and their roles</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>Create User</Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">

        {showCreateForm && (
          <div className="mb-8">
            <UserForm onClose={() => setShowCreateForm(false)} />
          </div>
        )}

        <div className="rounded-lg border border-border/40 bg-card overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="border-b border-border/40 bg-muted/30">
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground text-xs">Name</th>
                <th className="p-4 text-left font-medium text-muted-foreground text-xs">Email</th>
                <th className="p-4 text-left font-medium text-muted-foreground text-xs">Role</th>
                <th className="p-4 text-left font-medium text-muted-foreground text-xs">Status</th>
                <th className="p-4 text-left font-medium text-muted-foreground text-xs">Last Login</th>
                <th className="p-4 text-left font-medium text-muted-foreground text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      variant="no-data"
                      icon={UsersIcon}
                      title="No users found"
                      description="Get started by creating your first user"
                      action={{
                        label: "Create User",
                        onClick: () => setShowCreateForm(true)
                      }}
                    />
                  </td>
                </tr>
              ) : (
                data?.users.map((user: User) => (
                <tr key={user.id} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                  <td className="p-4 text-foreground font-medium text-sm">{user.fullName}</td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">{user.email}</td>
                  <td className="p-4 text-foreground text-sm">{user.role}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border ${
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50'
                          : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50'
                      }`}
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {user.lastLoginAt
                      ? new Date(user.lastLoginAt).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={async () => {
                          const confirmed = await confirm({
                            title: 'Delete User',
                            description: `Permanently delete ${user.fullName} (${user.email})? This action cannot be undone.`,
                            confirmLabel: 'Delete User',
                            cancelLabel: 'Cancel',
                            variant: 'danger',
                          });
                          if (confirmed) {
                            await handleDeleteUser(user);
                          }
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )))
              }
            </tbody>
          </table>
        </div>

        {data && data.pagination.total > 0 && (
          <div className="mt-4 text-sm text-muted-foreground font-mono">
            Showing <span className="text-foreground font-medium">{data.users.length}</span> of <span className="text-foreground font-medium">{data.pagination.total}</span> users
          </div>
        )}
      </div>

      {confirmDialog}
    </div>
  );
}
