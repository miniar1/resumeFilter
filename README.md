# Resume Filter

An intelligent AI-powered resume screening and ranking application that helps recruiters efficiently evaluate and rank job applicants based on their CVs and job requirements.

## 🚀 Features

- **AI-Powered CV Screening**: Automatically analyzes and scores resumes using advanced AI algorithms
- **Smart Ranking**: Ranks candidates based on job description matching
- **PDF & DOCX Support**: Upload resumes in PDF or Word format
- **User Authentication**: Secure JWT-based authentication system
- **Real-time Processing**: Fast resume analysis with instant results
- **Modern UI**: Clean and intuitive React-based interface
- **RESTful API**: Well-structured backend API with Fastify

## 📋 Prerequisites

Before installation, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Python** (v3.8 or higher)
- **MongoDB** (local or cloud instance)
- **Git**

## 📦 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/miniar1/resumeFilter.git
cd resumeFilter
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
PORT=3000
HOST=0.0.0.0

# MongoDB
MONGODB_URI=mongodb://localhost:27017/resumeFilter

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_key_here

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd ../frontend
npm install
```

#### Configure Frontend Environment (Optional)

Create a `.env` file in the `frontend` directory if needed:

```env
VITE_API_URL=http://localhost:3000
```

### 4. Python AI Setup

Install required Python packages for the AI screening module:

```bash
cd ../backend/AI
pip install python-docx PyPDF2 openai anthropic
```

> **Note**: You may need to configure API keys for AI services (OpenAI, Anthropic, etc.) in the backend `.env` file

## 🚀 Running the Application

### Start MongoDB

Make sure MongoDB is running on your system:

```bash
# For local MongoDB
mongod
```

Or use MongoDB Atlas (cloud) by updating the `MONGODB_URI` in your `.env` file.

### Start the Backend Server

```bash
cd backend
npm start
```

The backend server will start on `http://localhost:3000`

### Start the Frontend Development Server

Open a new terminal window:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173` (default Vite port)

## 📖 Usage

### 1. User Registration/Login

- Navigate to the application in your browser
- Register a new account or log in with existing credentials
- You'll receive a JWT token for authenticated requests

### 2. Upload Resume and Job Description

- Navigate to the screening page
- Upload one or multiple CVs (PDF or DOCX format)
- Enter or upload the job description
- Click "Analyze" to start the screening process

### 3. View Results

- The system will process the resumes using AI
- View ranked candidates with matching scores
- Review detailed analysis for each candidate
- Export results if needed

## 🏗️ Project Structure

```
resumeFilter/
├── backend/
│   ├── AI/                    # AI screening scripts
│   │   ├── ai.py             # AI processing module
│   │   ├── ai2.py            # Alternative AI implementation
│   │   └── ai3.py            # Latest AI implementation
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── controllers/      # Request handlers
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   └── services/         # Business logic
│   ├── index.js              # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── Rank/        # Ranking components
│   │   │   └── ...
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service calls
│   │   └── App.jsx          # Main app component
│   ├── index.html
│   └── package.json
│
├── resultats_cv/            # Processed CV results
├── utils/                   # Utility functions
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### CV Screening
- `POST /api/posts` - Create new job posting
- `POST /api/posts/:id/screen` - Screen CVs for a job posting
- `GET /api/posts/:id/results` - Get screening results

## 🛠️ Built With

### Backend
- **Fastify** - Fast and low overhead web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Python** - AI processing scripts

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## 📝 Development

### Building for Production

#### Backend
```bash
cd backend
npm start
```

#### Frontend
```bash
cd frontend
npm run build
```

The production build will be in the `frontend/dist` directory.

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the `MONGODB_URI` in your `.env` file

2. **Port Already in Use**
   - Change the `PORT` in backend `.env`
   - Update the API URL in frontend `.env`

3. **File Upload Errors**
   - Check `MAX_FILE_SIZE` setting
   - Ensure upload directory has write permissions

4. **Python Dependencies**
   - Make sure Python is in your PATH
   - Install all required packages: `pip install -r requirements.txt`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- OpenAI for AI model integration
- Fastify team for excellent documentation
- React and Vite communities
