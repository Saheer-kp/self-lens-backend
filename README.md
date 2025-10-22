# self-lens

Backend Node App for Self Lens project.

## Requirements

- Node.js
- MongoDB
- Redis (optional, for repositories)

## Getting Started

1. Clone the repository and install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file at the root with at least:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/selflens
   JWT_SECRET=your_secret_here
   JWT_EXPIRES_IN=7d
   # Add Google OAuth and Redis env vars as needed
   ```

3. Start the backend:
   ```
   npm start
   ```

The server will be accessible at `http://localhost:5000/` by default.

## Project Structure

- `server.js` - Server entry point, connects to MongoDB and starts Express app.
- `app.js` - Defines express app, middleware, and routes.
- `routes/` - Express route definitions.
- `controllers/` - Request handlers for routes.
- `models/` - Mongoose models.
- `middlewares/` - Express middleware functions.
- `utils/` - Utility modules (error, response, jwt, password etc).
- `config/` - Auth and Redis configuration.

---

For API documentation, see comments in the controllers. Add your Google and Redis credentials as needed.
