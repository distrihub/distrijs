# Distri Maps Chat Sample

An interactive Google Maps integration sample for the Distri Framework, showcasing how to build AI-powered location assistants. This sample uses the modern [react-google-maps library from vis.gl](https://visgl.github.io/react-google-maps/) for seamless React integration.

![Maps Chat Demo](https://via.placeholder.com/800x400/1f2937/ffffff?text=Maps+Chat+Demo)

## Features

- 🗺️ **Interactive Google Maps** - Full-featured map with markers, directions, and place search
- 🤖 **AI Assistant** - Intelligent chat interface powered by Distri Framework
- 🧭 **Navigation Tools** - Get directions with multiple travel modes (driving, walking, biking, transit)
- 📍 **Location Search** - Find and mark places on the map
- 🔍 **Place Discovery** - Search for restaurants, gas stations, hotels, and more
- 🎯 **Map Control** - Programmatically control map center and zoom
- 🎨 **Modern UI** - Clean, responsive interface using Tailwind CSS

## Tools Available to the AI

The AI assistant has access to these Google Maps tools:

| Tool | Description | Parameters |
|------|-------------|------------|
| `set_map_center` | Center the map on specific coordinates | `latitude`, `longitude`, `zoom` (optional) |
| `add_marker` | Add a marker with title and description | `latitude`, `longitude`, `title`, `description` (optional) |
| `get_directions` | Get directions between two locations | `origin`, `destination`, `travel_mode` (optional) |
| `search_places` | Search for places near a location | `query`, `latitude`, `longitude`, `radius` (optional) |
| `clear_map` | Clear all markers and directions | None |

## Prerequisites

1. **Google Maps API Key** - Get one from [Google Maps Platform](https://developers.google.com/maps/documentation/javascript/get-api-key)
2. **Node.js** - Version 18 or higher
3. **Distri Backend** - Running on `localhost:8080` (or configure custom URL)

### Required Google APIs

Make sure to enable these APIs in your Google Cloud Console:
- Maps JavaScript API
- Places API
- Directions API

## Quick Start

1. **Clone and navigate to the sample:**
   ```bash
   cd samples/maps-chat
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your API key:**
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_DISTRI_API_URL=http://localhost:8080/api/v1
   ```

5. **Start the development server:**
   ```bash
   pnpm dev
   ```

6. **Open your browser to `http://localhost:3000`**

## Sample Conversations

Try these example conversations with the AI assistant:

### Navigation
> "Get me driving directions from San Francisco to Los Angeles"

### Location Search
> "Show me the Golden Gate Bridge on the map"

### Place Discovery
> "Find coffee shops near Times Square, New York"

### Map Control
> "Center the map on London with a zoom level of 12"

### Multi-step Interactions
> "Show me restaurants near the Eiffel Tower, then give me walking directions to the Louvre Museum"

## Architecture

### Frontend Components

- **`App.tsx`** - Main application with API provider and environment validation
- **`GoogleMapsManager.tsx`** - Modern map component using react-google-maps
- **`definition.yaml`** - Agent configuration and tool definitions

### Key Technologies

- **[react-google-maps](https://visgl.github.io/react-google-maps/)** - Modern React wrapper for Google Maps
- **[@distri/react](../packages/react)** - Distri Framework React components
- **Vite** - Fast development and build tool
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first styling

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GOOGLE_MAPS_API_KEY` | Your Google Maps API key | ✅ Yes |
| `VITE_DISTRI_API_URL` | Distri backend URL | ❌ No (defaults to localhost:8080) |

## Customization

### Map Configuration

Customize the default map settings in `GoogleMapsManager.tsx`:

```tsx
<GoogleMapsManager 
  defaultCenter={{ lat: 40.7128, lng: -74.0060 }} // New York
  defaultZoom={13}
/>
```

### Agent Behavior

Modify the agent's behavior by editing `definition.yaml`:

```yaml
system_prompt: |
  Your custom instructions here...

llm:
  model: "gpt-3.5-turbo"  # Use different model
  temperature: 0.5        # Adjust creativity
```

### UI Styling

The interface uses Tailwind CSS classes. Customize the appearance by modifying:
- `src/App.tsx` - Main layout and panels
- `src/index.css` - Global styles and custom scrollbars
- `tailwind.config.js` - Tailwind configuration

## Troubleshooting

### Common Issues

**"Google Maps API Key Required" Error**
- Ensure you've set `VITE_GOOGLE_MAPS_API_KEY` in your `.env` file
- Verify your API key is valid and has the required APIs enabled

**Map Not Loading**
- Check browser console for API errors
- Verify your Google Cloud Console billing is set up
- Ensure the API key has the correct domain restrictions

**Agent Not Responding**
- Verify the Distri backend is running
- Check that `VITE_DISTRI_API_URL` points to the correct backend URL
- Ensure the `maps-navigator` agent is configured in your backend

**Tools Not Working**
- Verify all required Google APIs are enabled
- Check browser console for JavaScript errors
- Ensure proper tool registration in `useEffect`

### Development

**Enable Debug Mode**
Set `debug: true` in the Distri config to see detailed API logs.

**Hot Reload Issues**
If the map doesn't update properly during development, refresh the browser.

## Contributing

This sample demonstrates:
- Modern Google Maps integration with React
- Environment variable configuration
- External tool registration and execution
- Error handling and user feedback
- Clean component architecture

Feel free to extend this sample with additional features like:
- Geolocation support
- Route optimization
- Custom map styling
- Offline map caching
- Real-time traffic data

## License

This sample is part of the Distri Framework and is licensed under the MIT License.