# Hind Social Network Frontend

A modern, production-ready frontend for the Hind Social Network, built with Next.js (App Router), TypeScript, TailwindCSS, and React Query.

## 🚀 Tech Stack

-   **Framework:** Next.js 14+ (App Router)
-   **Language:** TypeScript
-   **Styling:** TailwindCSS (v4)
-   **State Management & Data Fetching:** TanStack Query (React Query)
-   **Icons:** Lucide React
-   **Animations:** Framer Motion
-   **Notifications:** React Hot Toast
-   **HTTP Client:** Axios

## 🛠 Project Structure

```
src/
 ├── app/               # App Router pages and layouts
 │    ├── layout.tsx    # Root layout with Providers
 │    ├── page.tsx      # Main Feed page
 │    └── providers.tsx # React Query & Toaster wrappers
 ├── components/        # Reusable UI components
 │    ├── feed/         # Feed logic
 │    ├── post/         # Post cards and interactions
 │    ├── comment/      # Comment section
 │    ├── layout/       # Navbar, Sidebar
 │    └── common/       # Generic components (Modal, Button)
 ├── hooks/             # Custom hooks (useFeed, etc.)
 ├── services/          # API integration (Axios)
 ├── types/             # TypeScript interfaces
 └── lib/               # Utilities
```

## 🏁 Getting Started

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ✨ Features

-   **Infinite Scroll Feed:** Optimized feed with cursor-based pagination.
-   **Create Post:** Modal with optimistic updates for instant feedback.
-   **Interactions:** Like, Comment, and Share functionality.
-   **Optimistic Updates:** UI updates immediately for likes and comments.
-   **Responsive Design:** Fully responsive layout for mobile and desktop.
-   **Clean UI:** Professional, whitespace-oriented design.

## 🧩 Scripts

-   `npm run dev`: Start development server
-   `npm run build`: Build for production
-   `npm start`: Start production server
-   `npm run lint`: Run ESLint
