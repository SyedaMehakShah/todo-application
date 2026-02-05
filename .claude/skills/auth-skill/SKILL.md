---
name: auth-skill
description: Implement secure authentication for web apps. Includes signup, signin, password hashing, JWT tokens, and full integration guidance.
---

# Authentication Skill

## Instructions
Implement authentication with these features:

1. **User Registration (Signup)**
   - Collect email/username and password
   - Validate inputs (email format, password strength)
   - Hash passwords securely before storing (e.g., bcrypt)

2. **User Login (Signin)**
   - Verify user credentials
   - Compare hashed password
   - Generate JWT token for session

3. **Password Security**
   - Use strong hashing algorithms (bcrypt, argon2)
   - Implement salt for extra security
   - Avoid storing plaintext passwords

4. **JWT Tokens**
   - Create access tokens on login
   - Use refresh tokens for session renewal
   - Set proper expiration and secure storage (HttpOnly cookies or localStorage)

5. **Integration**
   - Middleware to protect routes
   - Role-based access control (optional)
   - Error handling for invalid/expired tokens
   - Compatible with frontend frameworks (React, Next.js, etc.)

## Example Code

### Node.js + Express + JWT Example
```javascript
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

const users = []; // example user store

// Signup route
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  res.status(201).send('User created');
});

// Signin route
app.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(400).send('Invalid credentials');

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return res.status(400).send('Invalid credentials');

  const token = jwt.sign({ username }, 'secretKey', { expiresIn: '1h' });
  res.json({ token });
});
