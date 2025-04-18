# LiveOne Forum

## Overview
LiveOne Forum is a modern, feature-rich discussion platform built with React and Supabase. This repository contains a public version of the codebase with sensitive information removed.

## Features
- **User Achievements**: Reward system for active participation
- **Real-time Chat**: Communicate with other forum members instantly
- **Reactions**: Express yourself with various reaction options
- **Voice Messages**: Voice communication support (in development)
- **Multi-language Support**: Available in English, Ukrainian, Russian, German, and Belarusian
- **Dark Mode**: Comfortable viewing experience in low-light environments
- **Responsive Design**: Works on desktop and mobile devices

## Important Notice
This is a public version of the LiveOne Forum codebase. All sensitive information has been removed or obfuscated, including:
- API keys
- Authentication tokens
- Supabase credentials
- Environment variables
- Private endpoints

## Setup for Development
To run this project locally, you'll need to:

1. Create your own Supabase project and configure the following:
   - Authentication (Email, OAuth providers)
   - Database tables (profiles, posts, comments, etc.)
   - Storage buckets for user content
   - Edge functions for server-side operations

2. Create a `.env` file in the root directory with your own credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Install dependencies and start the development server:
   ```
   npm install
   npm run dev
   ```

## Code Structure
The codebase follows a modular structure:
- `/src/components`: UI components organized by feature
- `/src/hooks`: Custom React hooks for state management
- `/src/pages`: Main application pages
- `/src/utils`: Utility functions
- `/src/integrations`: Third-party service integrations
- `/supabase`: Supabase configuration and functions

## License
This project is open source and available under the MIT License.

## Credits
Developed by Liveone-two Baneronetwo