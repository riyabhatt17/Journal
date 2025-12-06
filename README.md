📔 My-Journal | A Cloud-Based Personal Journaling Platform

A modern, secure, and aesthetic journaling application built for the web. It combines a "Glassmorphism" UI with robust cloud features to create a distraction-free space for thoughts, memories, and mood tracking.

🚀 View Live Demo (Replace this link with your Vercel URL after deployment)

✨ Features

Core Functionality

🔐 Secure Authentication: Private Google Login ensures every user has their own isolated database.

☁️ Real-Time Sync: Entries save automatically to the cloud (Firestore) as you type—never lose a word.

📸 Photo Memories: Upload "Polaroid-style" images to accompany your daily entries using Firebase Storage.

📅 Calendar Dashboard: Visual streak tracking with colored indicators based on your mood history.

The "Warm Aesthetic"

🎨 Dynamic Themes: Toggle between a pastel "Morning Mode" and a cozy "Night Mode."

😊 Mood Analytics: Track your emotional journey with an interactive "Sticker Dock" that color-codes your calendar.

🔍 Smart Search: Instantly filter through years of memories with a client-side search engine.

🕰️ On This Day: A nostalgic time capsule feature that surfaces entries from exactly one year ago.

🛠️ Tech Stack

Frontend: Next.js 14 (App Router), React, TypeScript

Styling: Tailwind CSS (Custom Glassmorphism Design System)

Backend / Database: Firebase Firestore (NoSQL)

Authentication: Firebase Auth (Google OAuth)

Storage: Firebase Cloud Storage (Image handling)

Deployment: Vercel

📸 Screenshots

Light Mode

Dark Mode

(Add a screenshot of your app here)

(Add a dark mode screenshot here)

🚀 Getting Started Locally

Follow these steps to run the project on your machine:

1. Clone the repository

git clone [https://github.com/your-username/my-journal.git](https://github.com/your-username/my-journal.git)
cd my-journal


2. Install dependencies

npm install


3. Configure Environment Variables

Create a .env.local file in the root directory and add your Firebase credentials:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id


4. Run the development server

npm run dev


Open http://localhost:3000 with your browser to see the result.

📂 Project Structure

src/
├── app/
│   ├── layout.tsx      # Global font and style wrapping
│   ├── page.tsx        # Main application logic (Dashboard + Editor)
│   ├── firebase.js     # Database connection & config
│   └── globals.css     # Tailwind imports & Custom Animations
├── components/
│   └── Editor.tsx      # Rich text editor with Photo Upload logic
└── public/             # Static assets


🔮 Future Improvements

Export to PDF: Allow users to download their journal as a printable book.

Voice Notes: Add audio recording support for quick thoughts.

Mobile App: Convert the PWA into a React Native application.

👤 Author
Riya Bhatt
LinkedIn: https://www.linkedin.com/in/riya-bhatt17082004/
GitHub: riyabhatt17
Made with ❤️ and TypeScript.
