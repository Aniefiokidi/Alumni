# Quick Start Guide

## Prerequisites
✅ Node.js (v18+)  
✅ MongoDB (v5+)  
✅ npm or yarn

## 🚀 Quick Setup (Windows)

### Option 1: Automated Setup (Recommended)
```powershell
.\setup.ps1
```

### Option 2: Manual Setup

#### Step 1: Install Backend Dependencies
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` and update your configurations.

#### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### Step 3: Start MongoDB
Make sure MongoDB is running on your system:
```bash
mongod
```

#### Step 4: Start Backend Server
```bash
cd backend
npm run dev
```
Backend will run on: http://localhost:5000

#### Step 5: Start Frontend (New Terminal)
```bash
cd frontend
npm run dev
```
Frontend will run on: http://localhost:3000

## 📝 First Time Setup

### 1. Register an Account
- Go to http://localhost:3000/register
- Create your account

### 2. Create Admin User
To access admin features, update your user role in MongoDB:

**Using MongoDB Shell:**
```javascript
use alumni_platform
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin" } }
)
```

**Using MongoDB Compass:**
1. Connect to localhost:27017
2. Navigate to `alumni_platform` > `users`
3. Find your user document
4. Edit the `role` field to `"admin"`
5. Save changes

### 3. Start Exploring!
- **Dashboard**: View statistics and recent activity
- **Alumni Directory**: Search and browse alumni
- **Events**: Create and RSVP to events
- **Donations**: Make and track donations
- **Announcements**: Post and read announcements
- **Messages**: Send direct messages

## 🎯 Key Features to Test

### As Alumni User:
- ✅ Update your profile
- ✅ Browse alumni directory
- ✅ RSVP to events
- ✅ Make donations
- ✅ View announcements
- ✅ Send messages

### As Admin User:
- ✅ View dashboard statistics
- ✅ Create events
- ✅ Post announcements
- ✅ View all donations
- ✅ Access alumni statistics

## 🔧 Troubleshooting

### Backend won't start
- Check if MongoDB is running
- Verify `.env` file exists and has correct values
- Check if port 5000 is available

### Frontend won't start
- Check if backend is running
- Verify `.env` file has correct API URL
- Check if port 3000 is available

### Can't login
- Verify MongoDB is running
- Check backend console for errors
- Make sure you registered an account

### CORS errors
- Ensure backend and frontend are running on correct ports
- Check CORS configuration in `backend/src/server.ts`

## 📚 API Testing

You can test the API using tools like Postman or Thunder Client:

### Example: Register User
```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "graduationYear": 2020,
  "department": "Computer Science"
}
```

### Example: Login
```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Use the returned token in Authorization header:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## 🎨 Technology Stack Quick Reference

**Backend:**
- Express.js - Web framework
- TypeScript - Type safety
- MongoDB - Database
- Mongoose - ODM
- JWT - Authentication
- bcrypt - Password hashing

**Frontend:**
- React 18 - UI framework
- TypeScript - Type safety
- Tailwind CSS - Styling
- Vite - Build tool
- React Router - Routing
- Axios - HTTP client

## 📞 Need Help?

Check the main [README.md](README.md) for detailed documentation.

---

**Happy Building! 🎉**
