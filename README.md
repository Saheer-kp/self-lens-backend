# self-lens

Backend Node App for Self Lens project.

## Requirements

- Node.js
- MongoDB

## Getting Started

1. Clone the repository and install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file at the root with at least:

   ```
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=secret
   JWT_EXPIRES_IN=1d
   JWT_COOKIE_EXPIRES_IN=2
   DB_PASSWORD=
   DATABASE=mongodb+srv://*************@cluster0.mst82at.mongodb.net/self_lens?retryWrites=true&w=majority&appName=Cluster0
   G_CLIENT_ID=
   G_CLIENT_SECRET=
   G_REDIRECT_URI=
   ```

```

3. Start the backend:

```

npm run dev

```

The server will be accessible at `http://localhost:3000/` by default.


```
