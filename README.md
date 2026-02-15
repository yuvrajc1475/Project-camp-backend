🚀 Project Camp Backend
Welcome to the engine room of Project Camp! This is a robust, production-ready RESTful API designed to power collaborative project management. Whether you're managing a small team or a large organization, this backend handles the heavy lifting of authentication, role-based permissions, and task tracking.

✨ What's Inside?
I built this project to solve the common mess of project management. It’s not just about CRUD; it’s about security and workflow.

🔐 Auth & Security (The Serious Stuff)
*JWT Everywhere: Uses Access and Refresh tokens for a seamless but secure login experience.

*Role-Based Access (RBAC): Not everyone should delete a project. I've implemented a 3-tier system: Admin, Project Admin, and Member.

*Email Verification: Built-in verification via Mailgen to ensure you're dealing with real users.

*Secure Cookies: Tokens are stored in httpOnly cookies to keep them safe from XSS attacks.

📊 Project & Task Management
*Hierarchical Tasks: Tasks can have multiple subtasks that team members can mark as complete.

*File Attachments: Support for uploading multiple files to tasks (stored locally via Multer).

*Project Notes: A dedicated space for Admins to leave high-level project documentation.

*Status Tracking: Real-time tracking through Todo, In Progress, and Done.

🛠 Tech Stack
Runtime: Node.js

Framework: Express.js

Database: MongoDB (via Mongoose)

Validation: Express-Validator

Email: Nodemailer + Mailgen

Security: Bcrypt, JWT, CORS, Helmet

🚀 Getting Started
To get a local copy up and running, follow these simple steps.

1. Prerequisites
Make sure you have Node.js and MongoDB installed on your machine.

2. Installation
Clone the repo and install dependencies:git clone https://github.com/yuvrajc1475/Project-camp-backend.git
cd project-camp-backend
npm install

3. Environment Variables
Create a .env file in the root directory and add the following:


PORT=8000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=10d

Mail Settings
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass

4. Run the Server

Development mode with nodemon
npm run dev

Production mode
npm start

🛤 API Roadmap
The API is structured under /api/v1/. Here’s a quick glance at the main entry points:

Route,Functionality
/auth,"Register, Login, Logout, Refresh Tokens, Password Resets"
/projects,"Create, List, Delete, and Member Management"
/tasks,"Task CRUD, Subtasks, and File Uploads"
/notes,Admin-only project documentation
/healthcheck,Simple 200 OK to check if the server is alive

💡 Key Implementation Details
In this project, I prioritized clean code and separation of concerns:

*Custom Middlewares: I used a global asyncHandler to keep controllers clean of try-catch blocks and a custom ApiError class for consistent error responses.

*Validation: Every single request body is validated before it hits the database.

*File Security: Files are tracked with metadata (size, MIME type) to ensure only valid attachments are saved.

🤝 Contributing
This is an ongoing project! If you have ideas on how to improve the permission matrix or want to add more features, feel free to fork the repo and open a Pull Request.
