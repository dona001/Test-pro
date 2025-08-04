import { Endpoint } from './bddCodeGenerator';

export const sampleEndpoints: Endpoint[] = [
  {
    method: 'POST',
    path: '/api/users',
    name: 'create_user',
    description: 'Create a new user',
    requestBody: {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    },
    responseBody: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      createdAt: '2024-01-01T00:00:00Z'
    }
  },
  {
    method: 'GET',
    path: '/api/users/{id}',
    name: 'get_user_by_id',
    description: 'Get user by ID',
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'User ID'
      }
    ],
    responseBody: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      createdAt: '2024-01-01T00:00:00Z'
    }
  },
  {
    method: 'PUT',
    path: '/api/users/{id}',
    name: 'update_user',
    description: 'Update user by ID',
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'User ID'
      }
    ],
    requestBody: {
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 25
    },
    responseBody: {
      id: 1,
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 25,
      updatedAt: '2024-01-02T00:00:00Z'
    }
  },
  {
    method: 'DELETE',
    path: '/api/users/{id}',
    name: 'delete_user',
    description: 'Delete user by ID',
    parameters: [
      {
        name: 'id',
        type: 'integer',
        required: true,
        description: 'User ID'
      }
    ],
    responseBody: {
      success: true,
      message: 'User deleted successfully'
    }
  }
]; 