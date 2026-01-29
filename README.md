# Simple Inventory Management System

A clean, responsive React-based inventory management web application with authentication, CRUD operations, and a modern user interface.

## Features

- 🔐 **User Authentication**: Login system with session management
- 📦 **Inventory Management**: Add, edit, delete, and view inventory items
- 📊 **Dashboard**: View inventory statistics and low stock alerts
- 🔍 **Search & Filter**: Search items by name and filter by category
- 📱 **Responsive Design**: Mobile-friendly layout
- 🎨 **Clean UI**: Modern, minimal design with smooth interactions

## Tech Stack

- **React 18** with functional components and hooks
- **React Router DOM** for navigation
- **Vite** for fast development and building
- **CSS3** for styling with CSS variables
- **Local Storage** for data persistence (placeholder for Supabase)

## Project Structure

```
simple-inventory/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   │   ├── Navbar.jsx      # Top navigation bar
│   │   ├── Navbar.css      # Navbar styles
│   │   ├── ItemCard.jsx    # Individual item display card
│   │   └── ItemCard.css    # Item card styles
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.jsx # Authentication state management
│   │   └── InventoryContext.jsx # Inventory state management
│   ├── pages/              # Page components
│   │   ├── Login.jsx       # Login page
│   │   ├── Login.css       # Login page styles
│   │   ├── InventoryDashboard.jsx # Main dashboard
│   │   ├── InventoryDashboard.css # Dashboard styles
│   │   ├── AddItem.jsx     # Add new item page
│   │   ├── AddItem.css     # Add item styles
│   │   ├── EditItem.jsx    # Edit existing item page
│   │   └── EditItem.css    # Edit item styles
│   ├── services/           # API service layer
│   │   └── inventoryService.js # Inventory API calls (placeholder for Supabase)
│   ├── styles/             # Global styles
│   │   └── index.css       # Global CSS variables and base styles
│   ├── App.jsx             # Main app component with routing
│   └── main.jsx            # React app entry point
├── index.html              # HTML template
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. **Extract the ZIP file** to your desired location

2. **Navigate to the project directory:**
   ```bash
   cd simple-inventory
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000`

### Demo Credentials

The app uses a fake authentication system for demonstration purposes:

- **Email**: Any valid email format (e.g., `user@example.com`)
- **Password**: Any password will work

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Key Files and Responsibilities

### 🗂️ Core Application Files

- **`src/App.jsx`** - Main routing logic and protected routes
- **`src/main.jsx`** - React app initialization with context providers
- **`src/index.html`** - HTML template for the React app

### 🔐 Authentication System

- **`src/contexts/AuthContext.jsx`** - Handles login/logout logic and session management
  - **Current**: Fake authentication with localStorage
  - **Future**: Replace with Supabase authentication calls

### 📦 Inventory Logic

- **`src/services/inventoryService.js`** - All inventory API operations
  - **Current**: Mock data with localStorage persistence
  - **Future**: Replace with Supabase client calls
  
- **`src/contexts/InventoryContext.jsx`** - Inventory state management
  - Centralizes all inventory operations
  - Provides data to components

### 🎨 User Interface

- **`src/pages/Login.jsx`** - Authentication form
- **`src/pages/InventoryDashboard.jsx`** - Main inventory view with stats and filters
- **`src/pages/AddItem.jsx`** - Form to add new inventory items
- **`src/pages/EditItem.jsx`** - Form to edit existing items
- **`src/components/ItemCard.jsx`** - Individual item display component
- **`src/components/Navbar.jsx`** - Top navigation with logout

## Connecting to Supabase

The app is designed to easily integrate with Supabase. Here's where to make changes:

### 1. Authentication (`src/contexts/AuthContext.jsx`)

Replace the fake login/logout functions with Supabase auth:

```javascript
// TODO: Replace with actual Supabase authentication
const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  // Handle response...
}

const logout = async () => {
  await supabase.auth.signOut()
  // Handle response...
}
```

### 2. Database Operations (`src/services/inventoryService.js`)

Replace the localStorage operations with Supabase calls:

```javascript
// TODO: Replace with actual Supabase call:
const { data, error } = await supabase
  .from('inventory')
  .select('*')
  .order('created_at', { ascending: false })
```

### 3. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 4. Initialize Supabase

Create a new file `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Features in Detail

### 🔐 Authentication
- Login form with email/password validation
- Session persistence using localStorage
- Protected routes for authenticated users only
- Logout functionality

### 📊 Dashboard
- **Statistics**: Total items, total quantity, low stock alerts
- **Search**: Real-time search by item name and description
- **Filter**: Filter by category
- **Low Stock Alerts**: Items with quantity < 5 are highlighted
- **Refresh**: Manual refresh button to reload data

### 📦 Item Management
- **Add Items**: Form with validation (name, quantity, category, description)
- **Edit Items**: Pre-populated form for existing items
- **Delete Items**: Confirmation dialog before deletion
- **Quantity Validation**: Prevents negative quantities
- **Category System**: Organize items by category

### 🎨 User Experience
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Visual feedback during operations
- **Error Handling**: User-friendly error messages
- **Smooth Animations**: Hover effects and transitions
- **Clean Layout**: Minimal, modern design

## Design System

The app uses CSS variables for consistent styling:

- **Colors**: Primary blue, success green, warning orange, danger red
- **Spacing**: Consistent padding and margins
- **Typography**: Clean font stack with proper hierarchy
- **Shadows**: Layered shadow system for depth
- **Borders**: Subtle borders with consistent radius

## Mobile Responsiveness

The app is fully responsive with breakpoints at:
- **Desktop**: 1200px+ (full layout)
- **Tablet**: 768px-1199px (adjusted grid)
- **Mobile**: <768px (single column, stacked elements)

## Security Considerations

⚠️ **Current Implementation**: This is a demo app with fake authentication. For production use:

1. Implement real authentication with JWT tokens
2. Add input validation and sanitization
3. Use HTTPS for all API calls
4. Implement proper authorization checks
5. Add rate limiting for API endpoints

## Performance Optimizations

- **Code Splitting**: Each page is a separate component
- **Context API**: Efficient state management
- **CSS Modules**: Scoped styling to prevent conflicts
- **Optimized Images**: SVG icons and compressed assets

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
1. Check the documentation above
2. Review the code comments
3. Test with the demo credentials
4. Check browser console for errors

---

**Built with ❤️ using React, Vite, and modern web technologies**