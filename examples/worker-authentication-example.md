# Worker Authentication Example

This document provides examples of how to use the new worker authentication functionality.

## Backend API Usage

### 1. Worker Authentication Endpoint

**Endpoint**: `POST /api/workers/auth`

**Request**:
```javascript
const response = await fetch('http://localhost:8787/api/workers/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'jane@aquafresh.com',
    password: 'password123'
  })
});

const result = await response.json();
console.log(result);
```

**Success Response**:
```json
{
  "success": true,
  "message": "Authentication successful",
  "worker": {
    "worker_id": "123e4567-e89b-12d3-a456-426614174000",
    "full_name": "Jane Doe",
    "email": "jane@aquafresh.com",
    "phone_number": "+1-555-0001",
    "id_card_front_url": "https://cloudinary.com/...",
    "id_card_back_url": "https://cloudinary.com/...",
    "monthly_salary": 3000.00,
    "total_revenue_generated": 15000.00,
    "recent_login_history": ["2025-01-21T10:30:00Z"],
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

## Frontend Service Usage

### 1. Using the Worker Service

```typescript
import { authenticateWorker } from '@/services/workerService';

// Example login function
async function handleWorkerLogin(email: string, password: string) {
  try {
    const result = await authenticateWorker({
      email,
      password
    });

    if (result.success && result.worker) {
      console.log('Login successful:', result.worker);
      // Store worker info in state/context
      // Redirect to worker dashboard
    } else {
      console.error('Login failed:', result.error);
      // Show error message to user
    }
  } catch (error) {
    console.error('Authentication error:', error);
  }
}
```

### 2. React Component Example

```tsx
import React, { useState } from 'react';
import { authenticateWorker } from '@/services/workerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

export function WorkerLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authenticateWorker({ email, password });

      if (result.success && result.worker) {
        toast({
          title: "Login Successful",
          description: `Welcome back, ${result.worker.full_name}!`,
        });
        
        // Handle successful login
        // e.g., redirect to worker dashboard
        
      } else {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="worker@example.com"
          required
        />
      </div>
      
      <div>
        <label htmlFor="password">Password</label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </div>
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

## Database Queries

### 1. Check if Worker Exists
```sql
SELECT worker_id, full_name, email 
FROM workers 
WHERE email = 'jane@aquafresh.com';
```

### 2. Verify Password (Backend Only)
```sql
SELECT worker_id, full_name, email, password 
FROM workers 
WHERE email = 'jane@aquafresh.com';
```

### 3. Update Login History
```sql
UPDATE workers 
SET recent_login_history = jsonb_build_array('2025-01-21T10:30:00Z') || 
    COALESCE(recent_login_history, '[]'::jsonb)
WHERE worker_id = '123e4567-e89b-12d3-a456-426614174000';
```

## Testing with cURL

### 1. Test Authentication
```bash
curl -X POST http://localhost:8787/api/workers/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@aquafresh.com",
    "password": "password123"
  }'
```

### 2. Test Invalid Credentials
```bash
curl -X POST http://localhost:8787/api/workers/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@aquafresh.com",
    "password": "wrongpassword"
  }'
```

## Security Notes

1. **Password Hashing**: Passwords are hashed using bcrypt with 10 salt rounds
2. **No Password Exposure**: The password field is never returned in API responses
3. **Rate Limiting**: The authentication endpoint has rate limiting applied
4. **Login Tracking**: Recent login timestamps are tracked for audit purposes

## Default Credentials (Development)

For testing purposes, the sample workers have the following credentials:

- **Email**: `jane@aquafresh.com`
- **Password**: `password123`

- **Email**: `mike@aquafresh.com`
- **Password**: `password123`

**Important**: Change these default passwords in production!
