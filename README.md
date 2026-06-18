# Digital Alumni Relationship Management Platform

A comprehensive web application for managing alumni data, engagement, communication, and donations for higher education institutions.

## 🚀 Features

### User Authentication
- Alumni registration and login
- JWT-based authentication
- Role-based access control (Admin, Alumni)
- Password hashing with bcrypt

### Alumni Profile Management
- Complete profile creation and updates
- Fields: Name, Graduation Year, Department, Job Title, Company, Location, Contact Info, Bio
- Profile picture support

### Alumni Directory
- Browse all registered alumni
- Advanced search and filtering
- Filter by graduation year, department, industry, location

### Events Management
- Admin can create and manage events
- Alumni can RSVP to events
- Event capacity management
- Track event participation

### News & Announcements
- Admin can post announcements
- Category-based announcements (General, Event, Achievement, Opportunity, Urgent)
- Pin important announcements
- View tracking

### Donation Module
- Alumni can make donations
- Multiple payment methods support
- Anonymous donation option
- Donation history and analytics
- Admin dashboard for donation tracking

### Messaging System
- Direct messaging between users
- Inbox and sent messages
- Unread message tracking

### Admin Dashboard
- Total alumni statistics
- Donation analytics
- Event participation metrics
- Recent registrations tracking
- Visual statistics and charts

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express**
- **TypeScript** for type safety
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **bcrypt** for password hashing
- **Express Validator** for input validation

### Frontend
- **React 18** with **TypeScript**
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Icons** for UI icons
- **React Toastify** for notifications
- **date-fns** for date formatting
- **Vite** for fast development

## 📁 Project Structure

```
Alumni/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── alumniController.ts
│   │   │   ├── eventController.ts
│   │   │   ├── donationController.ts
│   │   │   ├── announcementController.ts
│   │   │   ├── messageController.ts
│   │   │   └── dashboardController.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   └── errorHandler.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Event.ts
│   │   │   ├── Donation.ts
│   │   │   ├── Announcement.ts
│   │   │   └── Message.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── alumniRoutes.ts
│   │   │   ├── eventRoutes.ts
│   │   │   ├── donationRoutes.ts
│   │   │   ├── announcementRoutes.ts
│   │   │   ├── messageRoutes.ts
│   │   │   └── dashboardRoutes.ts
│   │   ├── utils/
│   │   │   └── response.ts
│   │   └── server.ts
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.tsx
    │   │   ├── Navbar.tsx
    │   │   ├── PrivateRoute.tsx
    │   │   ├── Card.tsx
    │   │   ├── Button.tsx
    │   │   ├── Input.tsx
    │   │   └── Loading.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── Profile.tsx
    │   │   ├── AlumniDirectory.tsx
    │   │   ├── Events.tsx
    │   │   ├── Donations.tsx
    │   │   ├── Announcements.tsx
    │   │   └── Messages.tsx
    │   ├── services/
    │   │   ├── api.ts
    │   │   └── apiService.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── .env
    ├── .gitignore
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── vite.config.ts
```

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update the `.env` file with your configurations:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/alumni_platform
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

5. Make sure MongoDB is running on your system.

6. Start the development server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🔐 Default Admin Account

After setting up the backend, you can create an admin account by registering with:
- Email: admin@example.com
- Password: admin123
- Role: You'll need to manually update the role in MongoDB to 'admin'

Or use MongoDB Compass/Shell:
```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## 🚢 Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Alumni Endpoints
- `GET /api/alumni` - Get all alumni (with filters)
- `GET /api/alumni/:id` - Get alumni by ID
- `GET /api/alumni/stats` - Get alumni statistics (Admin)

### Event Endpoints
- `POST /api/events` - Create event (Admin)
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event (Admin)
- `DELETE /api/events/:id` - Delete event (Admin)
- `POST /api/events/:id/rsvp` - RSVP to event
- `DELETE /api/events/:id/rsvp` - Cancel RSVP

### Donation Endpoints
- `POST /api/donations` - Create donation
- `GET /api/donations` - Get all donations (Admin)
- `GET /api/donations/my-donations` - Get user's donations
- `GET /api/donations/stats` - Get donation statistics (Admin)

### Announcement Endpoints
- `POST /api/announcements` - Create announcement (Admin)
- `GET /api/announcements` - Get all announcements
- `GET /api/announcements/:id` - Get announcement by ID
- `PUT /api/announcements/:id` - Update announcement (Admin)
- `DELETE /api/announcements/:id` - Delete announcement (Admin)

### Message Endpoints
- `POST /api/messages` - Send message
- `GET /api/messages/received` - Get received messages
- `GET /api/messages/sent` - Get sent messages
- `GET /api/messages/:id` - Get message by ID
- `DELETE /api/messages/:id` - Delete message
- `GET /api/messages/unread/count` - Get unread count

### Dashboard Endpoints
- `GET /api/dashboard/stats` - Get dashboard statistics (Admin)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Input validation with express-validator
- CORS protection
- Environment variable management
- Secure HTTP headers

## 🎨 UI Features

- Responsive design (mobile, tablet, desktop)
- Dark mode compatible
- Toast notifications for user feedback
- Loading states
- Form validation
- Modal dialogs
- Card-based layouts

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

Built with ❤️ for higher education institutions

## 🐛 Known Issues

- File upload for profile pictures not yet implemented
- Email notifications are simulated (not actual emails)
- Payment gateway integration pending

## 🔮 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Email integration for notifications
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Alumni job board
- [ ] Mentorship program module
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)
- [ ] Social media integration
- [ ] Calendar integration
- [ ] Export data to PDF/Excel

## 📞 Support

For support, email support@alumni-platform.com or join our Slack channel.

---

**Happy Coding! 🚀**
