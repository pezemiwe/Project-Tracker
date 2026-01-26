# Component Documentation

This document provides a reference for the UI components used in the Donor Investment Oversight Platform.

## Core UI Components (`frontend/src/components/ui`)

These components are the building blocks of the application, built on top of Radix UI and styled with Tailwind CSS (shadcn/ui pattern).

### Button (`button.tsx`)

Standard button component with variants.

- **Props**: `variant` (default, destructive, outline, secondary, ghost, link), `size` (default, sm, lg, icon), `asChild`.
- **Usage**: `<Button variant="destructive" onClick={handleDelete}>Delete</Button>`

### Card (`card.tsx`)

Container for content with header, content, and footer sections.

- **Components**: `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`.
- **Usage**:
  ```tsx
  <Card>
    <CardHeader>
      <CardTitle>Title</CardTitle>
    </CardHeader>
    <CardContent>...</CardContent>
  </Card>
  ```

### FormField (`form-field.tsx`)

Wrapper for form inputs that handles labels, error messages, and accessibility.

- **Props**: `label`, `error` (FieldError), `description`, `required`.
- **Usage**:
  ```tsx
  <FormField label="Email" error={errors.email}>
    <Input {...register("email")} />
  </FormField>
  ```

### Dialog / ConfirmDialog (`dialog.tsx`, `confirm-dialog.tsx`)

Modal dialogs for user interaction. `ConfirmDialog` is a pre-configured version for confirmations.

- **ConfirmDialog Props**: `open`, `onOpenChange`, `title`, `description`, `confirmText`, `cancelText`, `onConfirm`, `variant` (default, destructive).
- **Usage**:
  ```tsx
  <ConfirmDialog
    title="Delete Item?"
    description="This cannot be undone."
    onConfirm={deleteItem}
    variant="destructive"
  />
  ```

### LoadingState (`loading-state.tsx`)

Standardized loading indicator for different scopes.

- **Props**: `variant` (full-page, section, inline, overlay), `text`.
- **Usage**: `<LoadingState variant="section" text="Loading data..." />`

### EmptyState (`empty-state.tsx`)

Placeholder for when no data is available.

- **Props**: `title`, `description`, `icon`, `action` (ReactNode).
- **Usage**:
  ```tsx
  <EmptyState
    title="No Users"
    description="Create a user to get started"
    action={<Button>Create User</Button>}
  />
  ```

### Toast (`toast.tsx`, `toaster.tsx`)

Notification system.

- **Usage**: `const { toast } = useToast(); toast({ title: "Success", description: "Saved" })`

### ThemeToggle (`theme-toggle.tsx`)

Button to toggle between Light, Dark, and System themes.

### ErrorBoundary (`error-boundary.tsx`)

Catches React rendering errors.

- **Props**: `fallback` (component), `children`.
- **Features**: Logs errors, provides user feedback and recovery options.

## Domain Components

### Navigation (`frontend/src/components/navigation`)

- **Sidebar**: Main navigation for desktop.
- **MobileNav**: Drawer navigation for mobile devices.
- **UserNav**: User profile menu and logout.

### Dashboard (`frontend/src/components/dashboard`)

Widgets and charts for the main dashboard.

- **Usage**: Components are assembled in `DashboardPage`.

### Activities (`frontend/src/components/activities`)

- **ActivityTable**: AG Grid implementation for activities.
- **ActivityForm**: Form for creating/editing activities.

### Approvals (`frontend/src/components/approvals`)

- **ApprovalWorkflow**: Visual timeline of approval status.
- **ApprovalAction**: Buttons for Approve/Reject actions.

## Accessibility Features

- **ARIA Attributes**: All interactive elements include appropriate ARIA roles and states.
- **Keyboard Navigation**: Focus management is handled by Radix UI primitives.
- **Screen Readers**: `Announcer` component (if present) or `toast` regions handle live updates.
- **Contrast**: Colors are checked against WCAG AA standards.
