This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## API Integration Structure

The frontend now includes a clean API mapping layer under `lib/api`.

### Folder layout

- `lib/api/config.ts`: resolves backend base URLs from environment variables.
- `lib/api/http.ts`: shared `fetch` wrapper with typed JSON handling and API errors.
- `lib/api/types.ts`: shared DTO and view-model types.
- `lib/api/modules/*`: endpoint-level API modules grouped by domain.
- `lib/api/mappers/*`: transforms backend DTOs into UI-friendly models.
- `app/hooks/useBerthAllocation.ts`: page-level hook that consumes API modules.

### Environment variables

Copy `.env.example` into `.env.local` and adjust values for your services.

- `NEXT_PUBLIC_VESSEL_TRACKING_API_URL` default: `http://localhost:8080/api`
- `NEXT_PUBLIC_NEST_API_URL` default: `http://localhost:3001`

### Backend mapping currently implemented

Vessel Tracking Service (Go backend):

- `GET /api/health` -> `healthApi.vesselService()`
- `GET /api/vessels` -> `vesselsApi.getAll()`
- `GET /api/vessels/:mmsi` -> `vesselsApi.getByMmsi(mmsi)`
- `GET /api/vessels/ais` -> `vesselsApi.getAisFeed()`

Berth page mapping:

- `berthAllocationApi.getOverview()` pulls vessel data and maps it into berth-slot UI records through `mapVesselsToBerthAllocations`.

Auth mapping (Nest backend):

- `POST /auth/login` -> `authApi.login({ email, password })`
- `POST /users` -> `authApi.register({ name, email, role, password })`
- Login page stores `access_token` and user profile in localStorage through `lib/auth/session.ts`
- Register page now submits directly to users create endpoint for signup.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
