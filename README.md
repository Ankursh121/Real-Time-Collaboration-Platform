# Worksite management system 🚀

I am building a web-based Labour and Worksite Management System for a construction contractor, designed to manage multiple work sites, workers, attendance, wages, and payments in a real-world construction environment. In this system, all users initially register as workers (labour or mistri) through a self-registration process by providing details such as name, photo, worker type (labour, mistri, starting labour, starting mistri), gender, and optional Aadhar information, after which their account remains in a pending state until approved by the owner. The owner (contractor) has full control over the system, including approving workers, assigning them to sites, setting and updating daily rates, assigning admin roles to selected workers, marking attendance for anyone (including admins), and managing payments. Admins are workers with additional permissions assigned only by the owner and can mark attendance for labours and mistris but cannot edit rates, approve workers, or modify admin attendance. Attendance is recorded daily by admins or the owner and is visible to all workers in a read-only format, while wage calculation is handled automatically based on daily rates, standard 8-hour workdays, overtime calculation per hour, and payment status tracking, ensuring transparency. Workers can log in to view their attendance, earnings, overtime, and payment history but cannot modify any data. The application will be built using React.js for the frontend, Node.js and Express.js for the backend, MongoDB for database management, JWT-based authentication with role-based access control for security, and cloud storage for worker photos, following proper Git and environment variable management practices to create a scalable, secure, and practical system that reflects real construction site operations.


backend/
│
├── src/
│   │
│   ├── server.js                 # App entry point (starts server)
│   ├── app.js                    # Express app setup
│   │
│   ├── config/                   # Configuration files
│   │   ├── db.config.js           # MongoDB connection
│   │   ├── env.config.js          # Environment variables loader
│   │   ├── cloudinary.config.js   # Image upload config
│   │   └── cors.config.js
│   │
│   ├── constants/                # Fixed enums & constants
│   │   ├── roles.constants.js     # OWNER, ADMIN, WORKER
│   │   ├── workerTypes.constants.js
│   │   ├── attendance.constants.js
│   │   └── payment.constants.js
│   │
│   ├── models/                   # Database schemas
│   │   ├── User.model.js          # Owner, Admin, Worker
│   │   ├── Site.model.js          # Worksites
│   │   ├── Attendance.model.js    # Daily attendance
│   │   ├── Wage.model.js          # Daily wage calculation
│   │   └── Payment.model.js       # Payment lifecycle
│   │
│   ├── routes/                   # API routes
│   │   ├── auth.routes.js
│   │   ├── owner.routes.js
│   │   ├── admin.routes.js
│   │   ├── worker.routes.js
│   │   ├── site.routes.js
│   │   ├── attendance.routes.js
│   │   └── payment.routes.js
│   │
│   ├── controllers/              # HTTP request handlers
│   │   ├── auth.controller.js
│   │   ├── owner.controller.js
│   │   ├── admin.controller.js
│   │   ├── worker.controller.js
│   │   ├── site.controller.js
│   │   ├── attendance.controller.js
│   │   └── payment.controller.js
│   │
│   ├── services/                 # Business logic (CORE)
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── site.service.js
│   │   ├── attendance.service.js
│   │   ├── wage.service.js        # Rate + overtime logic
│   │   └── payment.service.js
│   │
│   ├── middlewares/              # Security & request guards
│   │   ├── auth.middleware.js     # JWT verification
│   │   ├── role.middleware.js     # Role-based access
│   │   ├── owner.middleware.js    # Owner isolation (multi-tenant)
│   │   ├── error.middleware.js
│   │   └── upload.middleware.js
│   │
│   ├── validations/              # Request validation
│   │   ├── auth.validation.js
│   │   ├── worker.validation.js
│   │   ├── attendance.validation.js
│   │   └── payment.validation.js
│   │
│   ├── utils/                    # Reusable helpers
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── date.utils.js
│   │   └── calculation.utils.js
│   │
│   ├── jobs/                     # Background jobs (future)
│   │   └── paymentReminder.job.js
│   │
│   └── docs/                     # API documentation
│       └── swagger.js
│
├── tests/                        # Unit & integration tests
│
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
