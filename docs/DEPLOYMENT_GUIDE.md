# Deployment Guide

This guide outlines the steps to deploy the KasmChannelGPT application on a new server.

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- Git
- SQLite3

## Setup Steps

1. Clone the repository:
```bash
git clone https://github.com/roguedev-ai/kasmchannelgpt.git
cd kasmchannelgpt
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

Edit the `.env` file and configure:
- `DATABASE_URL`: Path to SQLite database (default: `data/app.db`)
- `NEXTAUTH_URL`: Your application URL
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`

4. Create data directory:
```bash
mkdir -p data
```

5. Run database migrations:
```bash
npm run migrate
```

This will:
- Create the SQLite database
- Set up all required tables
- Create a backup before migration
- Add indexes for performance
- Create default collections for existing partners

6. Build the application:
```bash
npm run build
```

7. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Directory Structure

- `/data`: Contains the SQLite database files
  - `app.db`: Main database file
  - `app.backup.db`: Automatic backup created during migrations

- `/src/lib/database`: Database configuration and schemas
  - `schema.ts`: Database schema definitions
  - `index.ts`: Database client and type exports

- `/src/components/admin`: Admin interface components
  - `PartnerList.tsx`: Partner management table
  - `CreatePartnerModal.tsx`: New partner creation form
  - `PartnerDetailsModal.tsx`: Partner details and statistics

## Backup and Recovery

The migration script automatically creates a backup before making any changes. If something goes wrong:

1. Stop the application
2. Remove the corrupted database:
```bash
rm data/app.db
```

3. Restore from backup:
```bash
cp data/app.backup.db data/app.db
```

4. Restart the application

## Health Check

After deployment, verify the setup:

1. Visit `/api/health` to check API status
2. Log in as an admin user
3. Visit `/admin/partners` to verify partner management
4. Try creating a new partner
5. Check collection creation and document upload

## Troubleshooting

1. Database Issues:
   - Check file permissions on the `data` directory
   - Verify SQLite3 is installed
   - Check database connection in logs

2. Authentication Issues:
   - Verify NEXTAUTH_URL matches your domain
   - Check NEXTAUTH_SECRET is set
   - Review auth provider configuration

3. API Errors:
   - Check server logs for detailed error messages
   - Verify all environment variables are set
   - Check database migrations completed successfully

## Monitoring

Monitor the application using:
```bash
npm run logs
```

For health checks:
```bash
npm run health-check
