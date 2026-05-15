# Requirements for Nilgiri House Website

## Prerequisites
- Node.js (version 18 or higher)
- npm package manager
- Supabase account (for database and authentication)

## Installation Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd nilgiri
   ```

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Install API dependencies:
   ```
   cd api
   npm install
   cd ..
   ```

4. Install backend dependencies:
   ```
   cd backend
   npm install
   cd ..
   ```

5. Set up environment variables:
   - Copy .env.example to .env (if available)
   - Configure Supabase credentials
   - Set up other required environment variables

6. Run the application:
   - Frontend: `npm run dev`
   - Backend: `cd backend && npm run dev`
   - API functions will be deployed to Vercel

## Additional Notes
- Ensure Node.js version is compatible (18+)
- Supabase project must be set up with the required tables and policies
- For production deployment, use the provided Vercel configuration
