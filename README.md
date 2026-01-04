# 🏛️ HRMS (ΣΔΑΔ) Explorer

An application for exploring **organizational charts and job positions** from the **Human Resources Management System (ΣΔΑΔ)** of the Greek public sector.

---

## 🚀 Features

✅ Organization search with autocomplete  
✅ Hierarchical Tree View with expand / collapse  
✅ Interactive Flow Diagram with draggable & zoomable nodes  
✅ Organizational Unit details with breadcrumbs  
✅ Job Positions with downloadable **PDF Job Descriptions (ΕΠΘ)**  
✅ CORS bypass using **Next.js API Routes (proxy)**  
✅ Fully responsive (mobile & desktop)  
✅ Modern UI built with **Tailwind CSS**

---

## 📋 Prerequisites

- Node.js **18.x** or newer
- npm or yarn

---

## 🔧 Installation

### Clone the repository (or create a new folder)

`git clone repo`

### Install dependencies

`npm install # or yarn install`

### Start the development server

`npm run dev # or yarn dev`

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🎯 Usage

### 1. Organization Search

- Type in the search bar (e.g. _"Ministry of Education"_)
- Select an organization from the autocomplete results

### 2. Organization Chart View

- **Tree View**: Hierarchical list with expand / collapse
- **Flow Diagram**: Interactive flow chart with drag & zoom

### 3. Unit Selection

- Click on any organizational unit
- View unit details and breadcrumb navigation

---

## 🏗️ Production Build

`npm run build
npm start`

---

## 📦 Deployment

### Vercel (Recommended)

`npm install -g vercel
vercel`

### Docker

`FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]`

---

## 🐛 Troubleshooting

### “Module not found” errors

`rm -rf node_modules package-lock.json
npm install`

### React Flow rendering issues

Make sure you have imported the CSS:

`import  'reactflow/dist/style.css';`

### CORS errors

- The API is public, but if issues occur:

  - Use **Next.js API Routes** as a proxy
  - Or enable CORS on the backend server

---

## 📝 License

MIT

---

## 👨‍💻 Author

Created with ❤️ for exploring **Greek Government organizations** from **Gioiliop**
