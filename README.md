# GitaGPT - AI-Powered Spiritual Companion

An emotionally intelligent spiritual companion that provides personalized guidance from the Bhagavad Gita using advanced AI technologies.

## 🌟 Features

- **Emotion Detection**: Advanced emotion recognition using RoBERTa models
- **Semantic Verse Search**: Find relevant Bhagavad Gita verses using vector similarity
- **Personalized Reflections**: AI-generated spiritual guidance tailored to your emotional state
- **Multiple Interaction Modes**: Wisdom, Socratic questioning, and Story-based guidance
- **Beautiful UI**: Modern, responsive interface with dark/light themes
- **User Authentication**: Secure Firebase authentication
- **Conversation History**: Track your spiritual journey over time

## 🏗️ Architecture

### Backend (FastAPI)
- **Emotion Detection**: SamLowe/roberta-base-go_emotions-onnx
- **Intent Classification**: typeform/distilbert-base-uncased-mnli  
- **Vector Search**: ChromaDB with all-mpnet-base-v2 embeddings
- **AI Generation**: Google Gemini 2.5 Flash
- **Database**: Supabase (PostgreSQL)

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **State Management**: React Context
- **Markdown Rendering**: ReactMarkdown

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL (or Supabase account)
- Google Gemini API key
- Firebase project

### Backend Setup

1. **Clone and navigate to server directory**
   ```bash
   git clone <repository-url>
   cd gitagpt/server
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and database credentials
   ```

5. **Initialize database**
   ```bash
   python setup_supabase.py
   ```

6. **Start the server**
   ```bash
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd gitagpt/client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Firebase configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## 📝 Environment Variables

### Server (.env)
```env
# Required
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
FIREBASE_CREDENTIALS_PATH=path_to_firebase_service_account.json

# Optional (with defaults)
LLM_MODEL=gemini-2.5-flash
INTENT_CONFIDENCE_THRESHOLD=0.4
EMOTION_CONFIDENCE_THRESHOLD=0.3
```

### Client (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 🎯 Usage

1. **Sign up/Login** using Google authentication
2. **Choose interaction mode**:
   - **Wisdom**: Direct teachings and insights
   - **Socratic**: Self-discovery through questions  
   - **Story**: Narrative context from Mahabharata
3. **Share your thoughts** - the AI will detect your emotions and find relevant verses
4. **Receive personalized guidance** with Sanskrit verses, practical steps, and Krishna's wisdom

## 🛠️ Development

### Project Structure
```
gitagpt/
├── server/                 # FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── models/        # Database models
│   │   └── core/          # Configuration
│   └── requirements.txt
├── client/                # Next.js frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities
│   └── package.json
└── README.md
```

### Key Technologies
- **AI/ML**: Transformers, ChromaDB, Google Gemini
- **Backend**: FastAPI, SQLAlchemy, Supabase
- **Frontend**: Next.js, Tailwind CSS, Firebase
- **Database**: PostgreSQL via Supabase

## 📊 API Endpoints

- `POST /api/v1/chat/` - Main chat endpoint
- `GET /api/v1/verses/random` - Get random verse
- `POST /api/v1/verses/search` - Search verses
- `GET /api/v1/conversations/history` - Get chat history
- `GET /api/v1/analytics/spiritual-progress` - Get progress analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bhagavad Gita** - The eternal source of wisdom
- **Google Gemini** - For advanced AI capabilities
- **Hugging Face** - For emotion detection models
- **Supabase** - For database and authentication
- **Firebase** - For frontend authentication

## 📞 Support

For support, email ayushbhatbagar8011@gmail.com or mishrabhavya2873@gmail.com or create an issue in this repository.

---

*"You have a right to perform your prescribed duty, but not to the fruits of action."* - Bhagavad Gita 2.47
