# Query-Bot 🤖

> An intelligent platform for generating and executing database queries through AI, powered by LLMs and natural language processing.

## Overview

Query-Bot is a full-stack application that bridges the gap between natural language and database queries. Users can describe what data they need in plain English, and the AI system intelligently generates the corresponding SQL queries, executes them, and returns results—all with a user-friendly interface.

**Perfect for:**
- Data analysts without SQL expertise
- Rapid data exploration and reporting
- Learning SQL through AI-assisted examples
- Organizations reducing query-writing overhead

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js/React)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Auth UI    │  │ Query Builder│  │ Schema Mgmt  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (Express.js/TypeScript)          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Auth Routes  │  │ Query Routes │  │ Schema Routes│           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────┐             │
│  │        LLM Service (Query Generation)           │             │
│  │  - Claude/OpenAI Integration                    │             │
│  │  - Query validation & optimization              │             │
│  └──────────────────────────┬──────────────────────┘             │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────┐             │
│  │      Driver API (Python Executor)               │             │
│  │  - Query execution                              │             │
│  │  - Result processing                            │             │
│  └──────────────────────────┬──────────────────────┘             │
└────────────────────────────┬────────────────────────────────────┘
                             │ Database Protocol
                             ▼
                    ┌─────────────────┐
                    │  PostgreSQL/SQL │
                    │    Database     │
                    └─────────────────┘
```

### Component Breakdown

| Layer | Technology | Responsibility |
|-------|-----------|-----------------|
| **Frontend** | Next.js 14, React, TypeScript | User interface, auth, query building |
| **Backend API** | Express.js, TypeScript, Node.js | REST API, business logic, authentication |
| **LLM Service** | Claude/OpenAI API | Natural language → SQL translation |
| **Query Driver** | Python FastAPI | Query execution, result formatting |
| **Database** | PostgreSQL | Data storage, query execution |
| **Database** | MongoDB | User sessions, query history |

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL (data), MongoDB (metadata)
- **Authentication:** JWT-based
- **LLM Integration:** Claude/OpenAI API

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** React 18
- **Language:** TypeScript
- **Styling:** CSS Modules / Tailwind CSS
- **HTTP Client:** Axios

### Query Execution
- **Language:** Python 3.x
- **Framework:** FastAPI (implied from structure)
- **Database Drivers:** psycopg2 (PostgreSQL)

---

## 📋 Features

✅ **Natural Language Query Generation**
- Describe your data needs in plain English
- AI intelligently converts to SQL

✅ **Query Execution & Results**
- Execute generated queries directly
- View formatted results in the UI

✅ **Schema Management**
- Upload database schemas
- Schema-aware query generation
- Query history & analytics

✅ **User Authentication**
- Secure login/signup
- Session management
- API key support

✅ **Query History**
- Track all executed queries
- Re-run previous queries
- Query performance insights

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ and npm/yarn
- **Python** 3.8+
- **PostgreSQL** 12+ (or configured remote instance)
- **MongoDB** 4.4+ (for session storage)
- **OpenAI/Claude API Key** (for LLM service)

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd QueryBot
```

#### 2. Backend Setup

```bash
cd Backend-API

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and API keys

# Initialize database
npm run db:setup

# Start backend server
npm start
# Server runs on http://localhost:5000
```

#### 3. Frontend Setup

```bash
cd ../Frontend-Web

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit with backend API URL

# Start development server
npm run dev
# Access at http://localhost:3000
```

#### 4. Query Driver Setup

```bash
cd ../Driver-API

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env

# Start driver server
python main.py
# Runs on http://localhost:8000
```

---

## 🔐 Environment Variables

### Backend API (`.env`)

```bash
# Server
NODE_ENV=development
PORT=5000

# Database - PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=querybot
DB_USER=postgres
DB_PASSWORD=your_password

# Database - MongoDB (Sessions)
MONGODB_URI=mongodb://localhost:27017/querybot

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here

# LLM Service
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
# OR
CLAUDE_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-sonnet-20240229

# Driver API
DRIVER_API_URL=http://localhost:8000

# CORS
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env.local`)

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Query-Bot
```

### Driver API (`.env`)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/querybot
PORT=8000
LOG_LEVEL=info
```

---

## 📁 Project Structure

```
QueryBot/
├── Backend-API/                  # Express.js backend
│   ├── routes/                   # API endpoints (auth, query, schema)
│   ├── services/                 # Business logic (LLM service)
│   ├── middleware/               # Authentication, error handling
│   ├── database/
│   │   ├── models/               # Data models (User, Query, Schema, Session)
│   │   ├── connection.ts         # DB initialization
│   │   └── setup.ts              # Database migrations
│   ├── types/                    # TypeScript interfaces
│   └── utils/                    # Helpers (schema parser, constants)
│
├── Frontend-Web/                 # Next.js frontend
│   ├── src/
│   │   ├── app/                  # App Router pages
│   │   ├── components/           # React components
│   │   │   ├── auth/             # Login, signup
│   │   │   ├── dashboard/        # Main UI
│   │   │   ├── query/            # Query builder
│   │   │   └── schemas/          # Schema management
│   │   ├── lib/
│   │   │   ├── api/              # API client
│   │   │   └── context/          # React context (Auth, Schemas)
│   │   └── types/                # TypeScript definitions
│   └── public/                   # Static assets
│
└── Driver-API/                   # Python query executor
    ├── main.py                   # FastAPI server
    └── requirements.txt          # Python dependencies
```

---

## 📚 API Documentation

### Authentication Endpoints

**POST** `/api/auth/signup`
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "fullName": "John Doe"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

### Query Endpoints

**POST** `/api/query/generate`
- Generate SQL from natural language
- Requires: `prompt` (string), `schemaId` (string)
- Returns: Generated SQL query

**POST** `/api/query/execute`
- Execute a query and get results
- Requires: `query` (string), `schemaId` (string)
- Returns: Query results

**GET** `/api/query/history`
- Fetch user's query history
- Returns: Array of previous queries

### Schema Endpoints

**POST** `/api/schema/upload`
- Upload database schema
- Requires: file upload (SQL or JSON)

**GET** `/api/schema/list`
- List all user schemas

**GET** `/api/schema/:id`
- Get specific schema details

---

## 🔄 Data Flow Example

1. **User Input** → Types "Show me all users created in the last month"
2. **Frontend** → Sends to `/api/query/generate` with schema context
3. **Backend** → Passes to LLM Service with schema information
4. **LLM Service** → Generates optimized SQL query
5. **Backend** → Validates query, sends to Driver API
6. **Driver** → Executes query against PostgreSQL
7. **Results** → Returned to frontend and displayed to user

---

## 🧪 Testing

```bash
# Backend tests
cd Backend-API
npm run test

# Frontend tests
cd ../Frontend-Web
npm run test
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Port already in use** | Change `PORT` in .env or kill existing process |
| **Database connection failed** | Verify DB credentials and ensure server is running |
| **LLM API errors** | Check API key validity and quota limits |
| **CORS errors** | Verify `FRONTEND_URL` matches your frontend origin |
| **Schema parsing errors** | Ensure uploaded schema is valid SQL/JSON |

---

## 🚀 Deployment

### Using Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up
```

### Cloud Deployment

Deployable to: Vercel (frontend), Render/Railway (backend), AWS Lambda (driver)

---

## 📝 Future Enhancements

- [ ] Support for multiple database types (MySQL, SQLite, MongoDB)
- [ ] Query optimization recommendations
- [ ] Advanced analytics & query performance tracking
- [ ] Team collaboration features
- [ ] Query scheduling & automation
- [ ] Advanced security (encryption, audit logs)

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Submit a pull request

---

## 📧 Support

For issues or questions:
- Open an GitHub issue
- Contact: support@querybot.dev

---

**Made with ❤️ for making data accessible to everyone**
