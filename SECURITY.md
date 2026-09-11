# Security

- Real API keys, service-role keys, passwords, tokens and private certificates must never be committed.
- Use local .env files for development secrets and platform secret stores for CI/deployment.
- Supabase service_role keys must never be used in the client app.
- If a secret is committed accidentally, rotate it immediately and remove it from repository history where appropriate.
