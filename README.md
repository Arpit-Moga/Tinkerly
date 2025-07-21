# LLM Code Generator

A powerful web application that generates complete, production-ready code for React, Vue, Svelte, Angular, and Node.js projects using AI. Features live preview with WebContainers for instant code execution without Docker.

## 🚀 Features

- **Multi-Framework Support**: Generate code for React, Vue, Svelte, Angular, and Node.js
- **Live Preview**: Instant code execution and preview using WebContainers
- **AI-Powered**: Uses Gemini 2.5 Flash for intelligent code generation
- **Real-time Editing**: Monaco Editor with syntax highlighting and IntelliSense
- **Conversational Interface**: Iterate on your code through natural language
- **Production-Ready**: Generated code follows best practices and includes proper error handling
- **TypeScript Support**: Full TypeScript support across all frameworks
- **Tailwind CSS**: Beautiful, responsive designs out of the box

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **WebContainers** for live code execution
- **Zustand** for state management

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Gemini 2.5 Flash** for AI code generation
- **Zod** for request validation
- **CORS** enabled for cross-origin requests

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Gemini API key from Google AI Studio

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd llm-code-generator
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 🔑 Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `.env` file

## 📖 Usage

1. **Select a Framework**: Choose from React, Vue, Svelte, Angular, or Node.js
2. **Describe Your Project**: Tell the AI what you want to build in natural language
3. **Generate Code**: The AI will create a complete, working project
4. **Live Preview**: See your application running instantly in the preview panel
5. **Edit and Iterate**: Modify the code or ask for changes through the chat interface

### Example Prompts

- "Create a todo app with add, delete, and mark complete features"
- "Build a weather dashboard that shows current weather and 5-day forecast"
- "Make a simple blog with posts, comments, and search functionality"
- "Create a REST API for a book library with CRUD operations"

## 🏗️ Project Structure

```
llm-code-generator/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API and WebContainer services
│   │   ├── store/          # Zustand state management
│   │   └── ...
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Express middleware
│   │   └── ...
│   └── package.json
└── README.md
```

## 🔧 Development

### Frontend Development
```bash
cd frontend
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Building for Production
```bash
npm run build
```

## 🌐 Deployment

### Frontend (Vercel/Netlify)
1. Build the frontend: `cd frontend && npm run build`
2. Deploy the `dist` folder to your hosting platform
3. Set environment variables in your hosting platform

### Backend (Railway/Render)
1. Deploy the backend folder to your hosting platform
2. Set the `GEMINI_API_KEY` environment variable
3. Ensure the frontend URL is correctly configured in CORS settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### WebContainer Issues
- Ensure you're using a modern browser (Chrome, Firefox, Safari)
- Check that your browser supports WebAssembly
- Disable browser extensions that might interfere with WebContainers

### API Issues
- Verify your Gemini API key is correct
- Check that the backend server is running
- Ensure CORS is properly configured

### Build Issues
- Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check Node.js version compatibility
- Verify all environment variables are set correctly

## 📞 Support

If you encounter any issues or have questions, please:
1. Check the troubleshooting section above
2. Search existing GitHub issues
3. Create a new issue with detailed information about your problem

## 🙏 Acknowledgments

- [WebContainers](https://webcontainers.io/) for enabling in-browser code execution
- [Google AI](https://ai.google.dev/) for the Gemini API
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the code editing experience
- [Tailwind CSS](https://tailwindcss.com/) for the beautiful styling system