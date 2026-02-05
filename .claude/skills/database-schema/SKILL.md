---
name: database-schema
description: Guide for designing database schemas, creating tables, and writing migrations. Use when user wants to structure a database efficiently.
---

# Database Schema & Migrations

## Instructions
Create database structures with these features:

1. **Table Design**
   - Proper naming conventions for tables and columns
   - Define primary keys and unique constraints
   - Include relevant indexes for performance

2. **Column Types**
   - Choose correct data types for each column
   - Use nullable and default values appropriately
   - Consider foreign keys and relationships

3. **Migrations**
   - Create migration scripts for table creation and updates
   - Ensure reversible migrations (up/down)
   - Maintain version control for database changes

4. **Normalization & Relationships**
   - Apply 3NF or suitable normalization
   - Define one-to-one, one-to-many, and many-to-many relationships
   - Include cascading rules for updates/deletes

5. **Documentation & Best Practices**
   - Add comments for tables and columns
   - Maintain a clear ERD (Entity-Relationship Diagram)
   - Ensure scalability and maintainability

## Example Code
```sql
-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create Posts table with foreign key
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Example migration: add column
ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
