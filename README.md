# Toronto Data - Maps Web App

A responsive maps-focused web application built with Next.js, Mapbox GL JS, and Tailwind CSS. Features different UI layouts for desktop and mobile devices.

## Features

- **Desktop UI**: Sidebar with brand list, filters, and search + full-screen map
- **Mobile UI**: Full-screen map with bottom filters and search overlay
- **Responsive Design**: Automatically switches between desktop and mobile layouts
- **Dark Theme**: Modern dark mode interface
- **Interactive Map**: Custom markers for brands and points of interest
- **Filtering & Search**: Filter by category, open status, and search functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

**Note**: No API keys or tokens required! The app uses Leaflet with free OpenStreetMap tiles.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Leaflet** - Free, open-source interactive maps (no API key required!)
- **Zustand** - State management
- **React Icons** - Icon library

## Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
│   ├── desktop/     # Desktop-specific components
│   ├── mobile/      # Mobile-specific components
│   └── map/         # Map components
├── lib/             # Utilities and dummy data
├── store/           # Zustand state management
├── hooks/           # Custom React hooks
└── types/           # TypeScript type definitions
```

## Notes

- Currently uses dummy data for brands and POIs
- Uses free Leaflet maps with OpenStreetMap tiles (no API key needed!)
- Dark theme map tiles provided by CartoDB
- Responsive breakpoint is set at 1024px (lg breakpoint)

