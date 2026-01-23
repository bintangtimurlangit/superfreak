# Superfreak Studio Main App

## Description

This is the main application for Superfreak Studio, hosting the landing page and service pages for 3D printing services.

## Architecture

The application consists of three main components:

1. **Main App** - Payload CMS with Next.js frontend
2. **Redis** - Session storage and caching
3. **MongoDB** - Primary database

## Tech Stack

- **Framework**: Next.js 15.4 with React 19
- **CMS**: Payload CMS 3.69
- **Database**: MongoDB
- **Cache**: Redis (ioredis)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Resend
- **Authentication**: Better Auth with passkey support
- **Payment**: Midtrans
- **Styling**: Tailwind CSS 4.1
- **3D Graphics**: Three.js with React Three Fiber

## Prerequisites

- Node.js 18.20.2 or >= 20.9.0
- pnpm 9 or 10
- MongoDB instance
- Redis instance

## Environment Variables

Copy `.env.example` to `.env` and configure the following:

### Core
- `PAYLOAD_AUTH_SECRET` - Payload authentication secret
- `PAYLOAD_SECRET` - Payload encryption secret
- `BETTER_AUTH_SECRET` - Better Auth secret
- `DATABASE_URL` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `NEXT_PUBLIC_SERVER_URL` - Application URL

### Authentication
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret

### Email
- `RESEND_API_KEY` - Resend API key
- `RESEND_FROM_EMAIL` - Sender email address
- `RESEND_FROM_NAME` - Sender name

### Storage
- `R2_ACCOUNT_ID` - Cloudflare account ID
- `R2_ACCESS_KEY` - R2 access key
- `R2_SECRET_ACCESS_KEY` - R2 secret key
- `R2_BUCKET_NAME` - R2 bucket name

### Payment
- `MIDTRANS_CLIENT_KEY` - Midtrans client key
- `MIDTRANS_SERVER_KEY` - Midtrans server key
- `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` - Midtrans public client key

### Shipping
- `RAJAONGKIR_SHIPPING_COST_API` - RajaOngkir cost API key
- `RAJAONGKIR_SHIPPING_DELIVERY_API` - RajaOngkir delivery API key

## Installation

```bash
pnpm install
```

## Development

```bash
# Start development server
pnpm dev

# Clean start (removes .next cache)
pnpm devsafe
```

The application will be available at `http://localhost:3000`.

## Build

```bash
pnpm build
```

## Production

```bash
pnpm start
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run all tests
- `pnpm test:int` - Run integration tests (Vitest)
- `pnpm test:e2e` - Run end-to-end tests (Playwright)
- `pnpm generate:types` - Generate TypeScript types from Payload schema
- `pnpm generate:importmap` - Generate import map for Payload admin

## Docker

A `docker-compose.yml` file is provided for local development with MongoDB.

```bash
docker-compose up -d
```

Update `DATABASE_URL` in `.env` to match the Docker MongoDB instance.

## Project Structure

```
src/
├── app/              # Next.js app directory
├── collections/      # Payload collections
├── globals/          # Payload globals
├── components/       # React components
├── hooks/            # Custom hooks
├── access/           # Access control functions
└── payload.config.ts # Payload configuration
```

## License

UNLICENSED - Proprietary software owned by Superfreak Studio
