import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { FormField } from '../ui/form-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useCreateUser, CreateUserData } from '../../hooks/useUsers';
import { UserRole } from '../../stores/authStore';
import { toast } from '../../hooks/useToast';

const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['Admin', 'ProjectManager', 'Finance', 'CommitteeMember', 'Auditor', 'Viewer']),
  temporaryPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one digit')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormProps {
  onClose: () => void;
}

export function UserForm({ onClose }: UserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
  });

  const { mutate: createUser, isPending } = useCreateUser();

  const onSubmit = (data: UserFormData) => {
    createUser(data, {
      onSuccess: () => {
        toast({
          variant: "success",
          title: "USER CREATED",
          description: `Successfully created user ${data.fullName}`,
        });
        onClose();
      },
      onError: (error: any) => {
        toast({
          variant: "error",
          title: "CREATION FAILED",
          description: error.message || 'Failed to create user. Please try again.',
        });
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New User</CardTitle>
        <CardDescription>Add a new user to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Full Name"
            htmlFor="fullName"
            error={errors.fullName?.message}
            required
          >
            <Input
              id="fullName"
              placeholder="John Doe"
              {...register('fullName')}
              disabled={isPending}
              error={errors.fullName?.message}
            />
          </FormField>

          <FormField
            label="Email"
            htmlFor="email"
            error={errors.email?.message}
            required
          >
            <Input
              id="email"
              type="email"
              placeholder="john@example.org"
              {...register('email')}
              disabled={isPending}
              error={errors.email?.message}
            />
          </FormField>

          <FormField
            label="Role"
            htmlFor="role"
            error={errors.role?.message}
            required
          >
            <Select
              id="role"
              {...register('role')}
              disabled={isPending}
              error={errors.role?.message}
            >
              <option value="">Select a role</option>
              <option value="Admin">Admin</option>
              <option value="ProjectManager">Project Manager</option>
              <option value="Finance">Finance</option>
              <option value="CommitteeMember">Committee Member</option>
              <option value="Auditor">Auditor</option>
              <option value="Viewer">Viewer</option>
            </Select>
          </FormField>

          <FormField
            label="Temporary Password"
            htmlFor="temporaryPassword"
            error={errors.temporaryPassword?.message}
            helpText="Min 12 chars, 1 upper, 1 lower, 1 digit, 1 special"
            required
          >
            <Input
              id="temporaryPassword"
              type="password"
              placeholder="Enter secure password"
              {...register('temporaryPassword')}
              disabled={isPending}
              error={errors.temporaryPassword?.message}
            />
          </FormField>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create User'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
