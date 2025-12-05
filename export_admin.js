import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_DIR = path.join(__dirname, 'src');
const EXPORT_DIR = path.join(__dirname, 'admin-export');

// Files to copy (relative to src)
const FILES_TO_COPY = [
  // Pages
  'pages/admin/AdminDashboard.jsx',
  'pages/admin/AdminUsersPanel.jsx',
  'pages/admin/AdminUsersPanel.css',
  'pages/admin/ManageOrders.jsx',
  'pages/admin/DiscountCodes.jsx',
  'pages/admin/FinancialReports.jsx',
  'pages/admin/AdminBanners.jsx',
  'pages/admin/PaymentMonitor.jsx',
  'pages/admin/ReportsPanel.jsx',
  'pages/AdminLogin.jsx',
  
  // Components (Shared but needed)
  'components/HeaderNav.jsx', // Will need cleanup later
  'components/Footer.jsx',
  'components/ProtectedRoute.jsx',
  'components/EventStyleEditor.jsx',
  
  // Services & Hooks
  'services/apiService.js',
  'hooks/useAuth.jsx',
  'utils/imageUtils.js',
  'contexts/LoginModalContext.jsx', // Dependencies
  'contexts/RegisterModalContext.jsx'
];

// Ensure export directory exists
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR);
}

// Create src structure in export
const EXPORT_SRC = path.join(EXPORT_DIR, 'src');
if (!fs.existsSync(EXPORT_SRC)) {
  fs.mkdirSync(EXPORT_SRC);
}

FILES_TO_COPY.forEach(file => {
  const sourcePath = path.join(SOURCE_DIR, file);
  const destPath = path.join(EXPORT_SRC, file);
  
  if (fs.existsSync(sourcePath)) {
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(sourcePath, destPath);
    console.log(`Copied: ${file}`);
  } else {
    console.warn(`Warning: Source file not found: ${file}`);
  }
});

// Create a basic package.json for the new app
const packageJson = {
  "name": "ticketera-admin",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ant-design/icons": "^5.3.0",
    "antd": "^5.14.0",
    "axios": "^1.6.7",
    "date-fns": "^3.3.1",
    "lucide-react": "^0.330.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.1",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.56",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vite": "^5.1.4"
  }
};

fs.writeFileSync(path.join(EXPORT_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));
console.log('Created package.json');

// Create a basic README
const readmeContent = `# Ticketera Admin Panel

This project was decoupled from the main frontend.

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Migration Notes
- Check \`src/services/apiService.js\` for API URL configuration.
- Update \`src/components/HeaderNav.jsx\` to remove public links.
`;

fs.writeFileSync(path.join(EXPORT_DIR, 'README.md'), readmeContent);
console.log('Created README.md');

console.log('Export complete! Files are in admin-export folder.');
