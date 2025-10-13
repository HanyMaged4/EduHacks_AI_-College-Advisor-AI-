# 🎓 College Advisor AI

An intelligent college advisory platform powered by AI that helps students find the perfect university based on their preferences, academic profile, and career goals. Built with NestJS, React, ChromaDB, and Google's Gemini AI.

## ✨ Features

- **AI-Powered University Search**: Natural language queries to find universities matching your criteria
- **Semantic Search**: Advanced vector-based search using ChromaDB for accurate results
- **Real-time Chat**: Interactive chat interface with streaming responses
- **Comprehensive University Data**: Information on top universities worldwide including MIT, Stanford, Harvard, and more

## 🏗️ Architecture
### Backend (NestJS)
- **Knowledge Service**: Manages university data and embeddings in ChromaDB
- **Gemini AI Integration**: Uses Google's Gemini AI for query parsing and response generation
- **WebSocket Support**: Real-time chat functionality
- **Prisma ORM**: Type-safe database operations

### Frontend (React + TypeScript)
- **Material-UI**: Modern, responsive UI components
- **React Router**: Client-side routing
- **Socket.IO Client**: Real-time communication

### Database & Storage
- **PostgreSQL**: User data and chat history (via Prisma)
- **ChromaDB**: Vector database for university knowledge base
- **Docker**: Containerized ChromaDB deployment

## 📋 Prerequisites

- Node.js (v20 or higher)
- Docker & Docker Compose
- PostgreSQL database
- Google Gemini API key

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/HanyMaged4/EduHacks_AI_-College-Advisor-AI-.git
cd EduHacks_AI_-College-Advisor-AI-
```

### 2. Start ChromaDB

```bash
docker-compose up -d
```

This will start ChromaDB on `http://localhost:8000`

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/college_advisor"
JWT_SECRET="your-super-secret-jwt-key-change-this"
CHROMA_URL="http://localhost:8000"
GEMINI_API_KEY="your-gemini-api-key"
NODE_ENV="development"
REBUILD_CHROMA="true"
EOF

# Run Prisma migrations
npx prisma migrate dev

# Start the backend (this will also rebuild ChromaDB with university data)
npm run start:dev
```

The backend will run on `http://localhost:3000`

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔧 Environment Variables

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `CHROMA_URL` | ChromaDB server URL | `http://localhost:8000` |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `NODE_ENV` | Environment mode | `development` |
| `REBUILD_CHROMA` | Rebuild ChromaDB on startup | `false` |

### Frontend

The frontend uses environment variables prefixed with `VITE_`. Update `vite.config.ts` or create `.env` if needed.

## 📚 API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login and get JWT token

### Chat
- `POST /chat/ask` - Ask a question about universities
- WebSocket endpoint for real-time chat

## 🎯 Usage Examples

### Natural Language Queries

The AI can understand complex queries like:

- "Show me universities in the USA with strong CS programs"
- "What are the top engineering schools in Canada?"
- "Find universities with acceptance rates below 20%"
- "Which universities offer good financial aid for international students?"

### Filtering

The system supports filtering by:
- Location (country, state/province, city)
- Programs (Computer Science, Engineering, Business, etc.)
- Acceptance rates
- Rankings
- Tuition costs
- Application deadlines
- And more...

## 🗂️ Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── auth/          # Authentication module
│   │   ├── chat/          # Chat and WebSocket module
│   │   ├── knowledge/     # ChromaDB & AI services
│   │   ├── users/         # User management
│   │   └── prisma/        # Prisma service
│   ├── data/              # University JSON data
│   ├── prisma/            # Database schema & migrations
│   └── chroma_data/       # ChromaDB persistent storage
├── frontend/
│   ├── src/
│   │   ├── APIs/          # API service functions
│   │   ├── Components/    # React components
│   │   ├── Context/       # React context providers
│   │   ├── Pages/         # Page components
│   │   └── theme/         # MUI theme configuration
└── docker-compose.yml     # ChromaDB container config
```

## 🛠️ Technologies Used

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **ChromaDB** - Vector database
- **Google Gemini AI** - Large language model
- **Socket.IO** - WebSocket communication
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Material-UI (MUI)** - UI components
- **React Router** - Navigation
- **Socket.IO Client** - Real-time communication
- **Vite** - Build tool

### DevOps
- **Docker** - Containerization

## 🔄 Rebuilding ChromaDB

If you add new university data or want to rebuild the vector database:

```bash
cd backend
REBUILD_CHROMA=true npm run start:dev
```

This will delete the existing collection and re-index all university data.

## 📊 University Data Format

University data is stored in JSON files under `backend/data/`. Each file follows this structure:

```json
{
  "summary": "Brief summary of the university",
  "university_name": "University Name",
  "location": {
    "city": "City",
    "state_province": "State/Province",
    "country": "Country"
  },
  "basic_info": {
    "established_year": "Year",
    "student_population": "Population",
    "acceptance_rate": "Rate",
    "ranking_global": "Rank",
    "website": "URL",
    "type": "public/private"
  },
  "admissions": { /* ... */ },
  "costs": { /* ... */ },
  "popular_programs": [ /* ... */ ],
  "special_features": [ /* ... */ ]
}
```

## 🐛 Troubleshooting

### ChromaDB Connection Issues
- Ensure Docker is running: `docker ps`
- Check ChromaDB logs: `docker-compose logs chromadb`
- Verify port 8000 is not in use

### Database Migration Errors
- Reset database: `npx prisma migrate reset`
- Generate Prisma client: `npx prisma generate`

### Frontend Build Errors
- Clear cache: `rm -rf node_modules package-lock.json`
- Reinstall: `npm install`

## 📝 License

This project is licensed under the UNLICENSED license.

## 👥 Contributors

- [HanyMaged4](https://github.com/HanyMaged4)

## 🙏 Acknowledgments

- Google Gemini AI for powering the intelligent query system
- ChromaDB for vector database capabilities
- The open-source community for amazing tools and libraries

## 🔮 Future plans

- Implement Retrieval-Augmented Generation (RAG) for enhanced university retrieval: better retrieval pipelines and refined filtering will be added in a later release. This will allow the system to combine semantic search results from ChromaDB with generative summarization to produce more accurate, source-backed responses.

*Note: RAG/retrieval and authentication features are planned but not included in the current release.*

## � Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ for EduHacks AI Hackathon
