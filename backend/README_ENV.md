Using .env in backend (development)

1) Install the Nest config package (dev machine):

   npm install @nestjs/config

2) Copy `.env.example` to `.env` and fill values:

   copy .env.example .env

3) Start the dev server (Nest will load `.env` automatically via ConfigModule):

   npm run start:dev

Notes:
- `ConfigModule.forRoot({ isGlobal: true })` is already added to `AppModule`.
- You can inject `ConfigService` anywhere to access values: `configService.get('PORT')`.
- For production, prefer setting real environment variables instead of a `.env` file.
