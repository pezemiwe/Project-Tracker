# Developer Guide

Welcome to the development team! This guide will help you understand our standards and workflows.

## Development Setup

1. **Install Prerequisites**: Node 20+, Docker, pnpm.
2. **Setup Env**: Copy `.env.example` to `.env`.
3. **Start Services**: `docker-compose up -d postgres redis minio clamav`.
4. **Seed DB**: `pnpm db:seed` in `/backend`.
5. **Run Dev**: `pnpm dev` in both `/backend` and `/frontend`.

## Code Style & Standards

### TypeScript

- Use **strict mode** (enabled by default).
- Avoid `any`. Use `unknown` if type is truly uncertain, or define specific interfaces.
- Prefer `interface` over `type` for object definitions.
- Use explicit return types for critical functions.

### React Components

- Use **Functional Components** with Hooks.
- **File Naming**: Kebab-case for files (e.g., `user-profile.tsx`), PascalCase for components.
- **Props**: Define props interface immediately above the component.
- **Composition**: Prefer composition over complex prop drilling.

### Styling

- Use **Tailwind CSS**.
- Avoid custom CSS files unless absolutely necessary (animations, complex overrides).
- Use `cn()` utility to merge classes conditionally.
  ```tsx
  <div className={cn("base-class", isActive && "active-class")}>
  ```

### State Management

- **Server Data**: Always use `useQuery` / `useMutation`. Do not store server data in `useState` unless for temporary editing before save.
- **Form State**: Use `react-hook-form`.

## Workflows

### Creating a New Component

1. **Identify Scope**: Is it generic (`/components/ui`) or domain-specific (`/components/[domain]`)?
2. **Create File**: `my-component.tsx`.
3. **Implement**:
   - Define Props.
   - Implement Logic.
   - Apply Styles.
4. **Export**: Export matching the filename.
5. **Story/Test**: (Optional) Add tests if complex.

### Creating a New API Endpoint

1. **Define Route**: Add to `/backend/src/routes`.
2. **Validation**: Create Zod schema for input.
3. **Service**: Implement logic in a Service class.
4. **Connect**: Call service from route handler.
5. **Test**: Use Postman or write an integration test.

### Database Changes

1. Modify `schema.prisma`.
2. Run `pnpm exec prisma migrate dev --name <descriptive-name>`.
3. Update `seed.ts` if model changes affect initial data.

## Testing Strategy

- **Unit Tests**: For utility functions and complex logic.
- **Integration Tests**: For API endpoints.
- **Manual Testing**: Mandatory before PR. Use the **Testing Plan** checklist.

## Common Operations

### Resetting Database

```bash
cd backend
pnpm exec prisma migrate reset
```

_Warning: Deletes all data!_

### Running Linters

```bash
pnpm lint
pnpm format
```

## Git Workflow

- Create feature branch: `feature/my-feature` or `fix/issue-id`.
- Commit messages: "feat: add user login", "fix: resolve rendering error".
- Open PR -> Review -> Merge.
