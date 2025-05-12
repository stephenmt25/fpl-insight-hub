
# FPL Analytics Dashboard

A comprehensive Fantasy Premier League analytics application that helps managers make data-driven decisions for their FPL teams.

![FPL Analytics Dashboard](public/screencapture-preview-fpl-insight-hub-lovable-app-2025-05-12-23_29_03.png)

## 🌟 Features

### Dashboard Overview

- **FPL Season Summary**: View the current FPL season statistics at a glance
- **Gameweek Navigation**: Browse through all gameweeks using the paginator
- **Live Stats**: See real-time statistics for the current gameweek
- **Visual Reports**: Interactive charts and visualizations of FPL data
- **League Standings**: View standings for the official FPL leagues

### Performance Analytics

- **Personal Performance**: Track your team's performance across all gameweeks
- **Player Stats**: Detailed breakdown of your players' performances
- **Historical Trends**: View your performance trends over time
- **League Comparison**: Compare your team against others in your mini-leagues
- **Transfer Analysis**: Analyze the impact of your transfer decisions

### Insights & Strategy

- **Player Insights**: In-depth analysis of players' form and fixtures
- **Fixture Difficulty**: Visual representation of upcoming fixture difficulty
- **Transfer Suggestions**: Data-driven transfer recommendations
- **Historical Trends**: League-wide trends and patterns across the season

### League Standings

- **League Tables**: View standings for any league you're a part of
- **League Insights**: Statistical breakdown of league performance
- **Detailed Trends**: Analyze performance trends within your leagues

## 🔒 User Authentication

- **FPL ID Integration**: Sign in using your official FPL ID
- **Personalized Experience**: Access your team data and league information
- **Data Persistence**: Your FPL ID is securely stored for future visits
- **Guest Experience**: Try the app with a demo account using the "Try as Guest" feature

## 📱 Mobile & Desktop Support

- **Responsive Design**: Fully optimized for both desktop and mobile devices
- **Mobile Navigation**: Easy tab-based navigation on mobile devices
- **Desktop Experience**: Enhanced visualization and data display on larger screens

## 🛠️ Technical Implementation

### Frontend
- Built with React and TypeScript for a robust, type-safe application
- Styled with Tailwind CSS for responsive and modern UI design
- Using shadcn/ui components for consistent and accessible UI elements
- Interactive data visualization with Recharts

### Backend Integration
- Connects to the official Fantasy Premier League API via Supabase Edge Functions
- Utilizes Supabase for data storage and retrieval
- Implements real-time updates for live gameweek data

### Supabase Integration
- **Database Storage**: FPL data is stored in Supabase tables for improved performance and reduced API calls
- **Edge Functions**: Custom serverless functions to proxy API requests to the FPL API
- **Data Synchronization**: Regular updates to keep database in sync with the latest FPL data
- **Tables Structure**:
  - `fploveralldata`: Stores gameweek information and overall statistics
  - `plplayerdata`: Contains detailed player statistics and attributes
  - `plteams`: Holds information about Premier League teams

### Data Flow Architecture
1. **Data Fetching**: Edge function `sync-fpl-data` periodically retrieves data from the official FPL API
2. **Data Processing**: The fetched data is processed and transformed for storage
3. **Database Storage**: Processed data is stored in Supabase tables with appropriate schema
4. **API Proxy**: Additional edge function `fpl-api-proxy` handles real-time requests that need fresh data
5. **Client Access**: React application fetches data from Supabase tables and processes it for display
6. **User-Specific Data**: User authentication enables personalized data retrieval (team info, leagues)

### Data Analysis
- Historical performance tracking
- Comparative player analysis
- League performance metrics
- Trend identification and visualization

## 🚀 Getting Started

1. **Sign In**: Use the "Sign In with FPL ID" button on the dashboard
2. **Navigate**: Use the tabs to explore different sections of the application
3. **Analyze**: Dive deep into your FPL performance data
4. **Strategize**: Make informed decisions based on insights and recommendations

## 💡 How to Find Your FPL ID

1. Log in to the official [Fantasy Premier League website](https://fantasy.premierleague.com/)
2. Go to the "Points" tab
3. Your FPL ID is the number in the URL after "/entry/" (e.g., fantasy.premierleague.com/entry/1234567/event/1)
4. For mobile users: Select "Request Desktop Site" from your browser options to see the full URL

## 📊 Data Privacy

- We only use your FPL ID to fetch public data from the Fantasy Premier League API
- Your FPL account credentials are never stored or accessed
- All data processing happens on the client side for maximum privacy
