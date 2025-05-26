
# FinTrack Flow 💸

**Take Control of Your Finances Effortlessly**

FinTrack Flow is a modern, intuitive web application designed to help you manage your personal finances with ease. Track your income and expenses, create budgets, set financial goals, and gain valuable insights into your spending habits, all powered by a clean interface and smart AI assistance.

## Why FinTrack Flow?

In today's fast-paced world, keeping track of your finances can be challenging. FinTrack Flow aims to simplify this by providing:

*   **Clarity:** Understand where your money is going and how it aligns with your income.
*   **Control:** Make informed financial decisions by setting budgets and tracking your spending against them.
*   **Motivation:** Set and achieve your financial goals, whether it's saving for a vacation, a new gadget, or paying off debt.
*   **Efficiency:** Leverage AI to automate tasks like transaction categorization and get smart suggestions.
*   **Accessibility:** Manage your finances from anywhere with a web browser.

## ✨ Core Features

*   **📊 Interactive Dashboard:** Get a clear financial overview at a glance. Visualize your balance, income vs. expenses, savings progress, and spending by category.
*   **🔁 Transactions Manager:** A comprehensive system for tracking all your income and expenses. Easily add, edit, and delete transactions. Filter and sort your transaction history to find exactly what you need.
*   **🎯 Financial Goals Setter:** Define your financial aspirations, track your progress with visual indicators, and stay motivated to reach your targets.
*   **📝 Budget Planner:** Create and manage budgets for different spending categories (e.g., groceries, entertainment, utilities). Visualize your spending against your allocated amounts and identify areas for improvement. Includes support for recurring bills and subscriptions.
*   **🤖 Smart Financial Assistant (AI-Powered):**
    *   **Smart Transaction Categorization:** Let AI automatically suggest categories for your transactions.
    *   **AI-Powered Budget Suggestions:** Get personalized budget recommendations based on your income and spending habits.
    *   **Identify Potential Savings:** Discover areas where you can cut costs and save more money.

## 🛠️ Tech Stack

FinTrack Flow is built with a modern and robust technology stack:

*   **Frontend:**
    *   [Next.js](https://nextjs.org/) (App Router)
    *   [React](https://reactjs.org/)
    *   [TypeScript](https://www.typescriptlang.org/)
*   **UI & Styling:**
    *   [ShadCN UI](https://ui.shadcn.com/) (Reusable components)
    *   [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
    *   [Lucide React](https://lucide.dev/) (Icons)
    *   [Recharts](https://recharts.org/) (Charting library)
*   **Backend & Database:**
    *   [Firebase](https://firebase.google.com/)
        *   Firebase Authentication (Email/Password, Google Sign-In)
        *   Firestore (NoSQL Database)
*   **Artificial Intelligence:**
    *   [Genkit (by Firebase)](https://firebase.google.com/docs/genkit) - For AI flow orchestration.
    *   Google AI (e.g., Gemini models) - For generative AI capabilities.
*   **Development Tools:**
    *   `concurrently` (To run multiple scripts simultaneously)

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   `npm` or `yarn` or `pnpm`

### Installation & Setup

1.  **Clone the repository (if you haven't):**
    ```bash
    git clone <your-repository-url>
    cd fintrack-flow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    # or
    # pnpm install
    ```

3.  **Set up Environment Variables:**
    *   Create a `.env` file in the root of your project by copying the example:
        ```bash
        cp .env.example .env
        ```
        *(Note: If `.env.example` doesn't exist, create `.env` manually based on the required variables below).*
    *   You will need to populate this file with your Firebase project credentials and any necessary API keys for Google AI (Genkit).

    **Required `.env` variables:**
    ```env
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=YOUR_FIREBASE_AUTH_DOMAIN
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=YOUR_FIREBASE_PROJECT_ID
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=YOUR_FIREBASE_STORAGE_BUCKET
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=YOUR_FIREBASE_MESSAGING_SENDER_ID
    NEXT_PUBLIC_FIREBASE_APP_ID=YOUR_FIREBASE_APP_ID
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=YOUR_FIREBASE_MEASUREMENT_ID

    # Google AI API Key (for Genkit if using Google AI models)
    GOOGLE_API_KEY=YOUR_GOOGLE_AI_API_KEY
    ```

4.  **Firebase Project Setup:**
    *   Create a project on [Firebase Console](https://console.firebase.google.com/).
    *   Add a Web app to your Firebase project and copy the configuration details into your `.env` file.
    *   **Enable Authentication:** Go to the "Authentication" section, then "Sign-in method" tab. Enable "Email/Password" and "Google" providers. Make sure to add `localhost` to the list of "Authorized domains" for Google Sign-In to work during local development.
    *   **Enable Firestore:** Go to the "Firestore Database" section and create a database. Start in **test mode** for initial development (allows all reads/writes) or immediately set up security rules.
    *   **Firestore Security Rules:** For proper data security, configure Firestore security rules to ensure users can only access their own data. An example:
        ```json
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Match any collection where documents have a 'userId' field
            match /{collection}/{docId} {
              allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
              allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
            }
          }
        }
        ```
        *Replace `/{collection}/{docId}` with specific rules for your `transactions`, `budgets`, and `goals` collections for more fine-grained control.*

5.  **Genkit (Google AI) Setup:**
    *   If you are using Google AI models with Genkit (like Gemini), ensure you have an API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and have enabled the necessary APIs in your Google Cloud project. Add this key to your `.env` file as `GOOGLE_API_KEY`.

6.  **Run the development server:**
    The `dev` script uses `concurrently` to start both the Next.js app and the Genkit development server.
    ```bash
    npm run dev
    ```
    *   The Next.js application will typically be available at `http://localhost:9002`.
    *   The Genkit server (and its Dev UI) will typically be available at `http://localhost:4000`.

    Check your terminal output for the exact ports.

## 📜 Available Scripts

In the project directory, you can run:

*   `npm run dev`: Runs the app in development mode with Next.js and Genkit servers.
*   `npm run build`: Builds the app for production.
*   `npm run start`: Starts the production server (after building).
*   `npm run lint`: Lints the codebase.
*   `npm run typecheck`: Checks for TypeScript errors.
*   `npm run genkit:dev`: Starts only the Genkit development server.
*   `npm run genkit:watch`: Starts only the Genkit development server with file watching.

## 🤝 Contributing

Contributions are welcome! If you have suggestions or want to improve FinTrack Flow, please feel free to:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the `LICENSE.md` file for details (if one exists, otherwise assume MIT or specify).

---

Happy Tracking! We hope FinTrack Flow helps you achieve your financial wellness.
