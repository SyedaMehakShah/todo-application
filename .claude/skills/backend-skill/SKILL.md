---
name: backend-skill
description: Create backend functionality for handling API routes, requests/responses, and database connections. Use when user wants to implement backend logic.
---

# Backend Skill Design

## Instructions
Create backend functionality with these features:

1. **Routing**
   - Define RESTful API routes (`GET`, `POST`, `PUT`, `DELETE`)
   - Organize routes by resource (e.g., `/users`, `/products`)
   - Middleware support for authentication, logging, and error handling

2. **Request/Response Handling**
   - Parse incoming request data (JSON, form-data)
   - Validate request body and query parameters
   - Return consistent responses with proper status codes
   - Error handling for client and server errors

3. **Database Integration**
   - Connect to a database (SQL or NoSQL)
   - Perform CRUD operations
   - Use connection pooling for performance
   - Handle database errors gracefully

4. **Security & Performance**
   - Sanitize inputs to prevent injection attacks
   - Use caching where appropriate
   - Enable proper headers and rate limiting

5. **Testing & Documentation**
   - Write unit and integration tests
   - Document routes and request/response formats

## Example Code
```js
// Express.js example
import express from 'express';
import mongoose from 'mongoose';

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/mydb')
  .then(() => console.log('DB connected'))
  .catch(err => console.error(err));

// Example route
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: 'Bad request' });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
