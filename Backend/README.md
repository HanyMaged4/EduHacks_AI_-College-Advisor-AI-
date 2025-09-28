# NestJS Backend Application

This is a basic backend application built with NestJS and Prisma. It serves as a starting point for developing RESTful APIs with authentication and user management features.

## Features

- User authentication and registration
- User management (CRUD operations)
- Prisma ORM for database interactions
- Modular architecture for scalability

## Technologies Used

- NestJS
- Prisma
- TypeScript
- Jest (for testing)

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- A PostgreSQL or MySQL database (or any other supported by Prisma)

### Installation

1. Clone the repository:

   ```
   git clone <repository-url>
   cd nestjs-backend-app
   ```

2. Install the dependencies:

   ```
   npm install
   ```

   or

   ```
   yarn install
   ```

3. Set up your database and update the `DATABASE_URL` in the `.env` file.

4. Run the Prisma migrations to set up the database schema:

   ```
   npx prisma migrate dev --name init
   ```

### Running the Application

To start the application, run:

```
npm run start
```

or for development mode with hot-reload:

```
npm run start:dev
```

### Running Tests

To run the end-to-end tests, use:

```
npm run test:e2e
```

## API Endpoints

- **Authentication**
  - `POST /auth/login` - Login a user
  - `POST /auth/register` - Register a new user

- **Users**
  - `GET /users` - Get all users
  - `GET /users/:id` - Get a user by ID

## License

This project is licensed under the MIT License. See the LICENSE file for details.