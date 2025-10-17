# KasmChannelGPT

A Next.js application for managing partner access and document collections with RAG capabilities.

## Features

- Partner Management
  - Create and manage partner accounts
  - Role-based access control (admin/partner)
  - Partner statistics and monitoring

- Collection Management
  - Multiple collections per partner
  - Document upload and processing
  - Configurable search strategies

- Security
  - Authentication with NextAuth.js
  - Password hashing with bcrypt
  - Rate limiting and request validation
  - Automatic database backups

- Health Monitoring
  - System health checks
  - Database connection monitoring
  - Resource usage tracking

## Quick Start

1. Clone the repository:
```bash
git clone https://github.com/roguedev-ai/kasmchannelgpt.git
cd kasmchannelgpt
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- Admin credentials

4. Initialize the database:
```bash
npm run migrate
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Project Structure

```
kasmchannelgpt/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   ├── lib/             # Utilities and helpers
│   └── types/           # TypeScript types
├── scripts/             # Maintenance scripts
├── docs/               # Documentation
└── public/             # Static assets
```

## Key Components

- `PartnerList`: Partner management interface
- `CreatePartnerModal`: New partner creation
- `PartnerDetailsModal`: Partner statistics and details
- Database schema with relations for:
  - Partners
  - Collections
  - Documents
  - Collection Settings

## Development

- Run tests: `npm test`
- Lint code: `npm run lint`
- Format code: `npm run format`
- Build for production: `npm run build`

## Deployment

See [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

## Backup and Recovery

- Create backup: `npm run backup`
- List backups: `npm run list-backups`
- Restore backup: `npm run restore <backup-file>`

## Health Checks

- Check system health: `npm run health-check`
- View logs: `npm run logs`

## Environment Variables

See [.env.example](./.env.example) for all available configuration options.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.
