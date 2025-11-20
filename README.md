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

1. **Clone and Install**
```bash
git clone https://github.com/roguedev-ai/kasmchannelgpt.git
cd kasmchannelgpt
npm install
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your values (see docs/DEPLOYMENT.md)
```

Required variables:
- `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 32`
- `JWT_SECRET` - Generate: `openssl rand -base64 32`
- `GEMINI_API_KEY` or `OPENAI_API_KEY`

3. **Initialize Database**
```bash
npm run db:setup
```

4. **Create Admin User**
```bash
npm run create:admin
```

5. **Start Qdrant**
```bash
docker-compose up -d qdrant
```

6. **Start Development Server**
```bash
npm run dev
```

Visit http://localhost:3000 and login with your admin credentials.

For production deployment, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

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
