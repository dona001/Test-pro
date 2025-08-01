
# Sample API Files for Testing

This directory contains sample files to test the Smart Import feature of your API automation tool.

## Files Included

### 1. Swagger/OpenAPI Files
- **sample-swagger.json** - OpenAPI 3.0 specification in JSON format
- **sample-swagger.yaml** - OpenAPI 3.0 specification in YAML format

### 2. Postman Collection
- **sample-postman-collection.json** - Postman Collection v2.1 format

## How to Test

### Testing Swagger/OpenAPI Import
1. Open your API automation tool
2. Go to the Smart Import section
3. Select "Swagger/OpenAPI" as the import type
4. Upload either `sample-swagger.json` or `sample-swagger.yaml`
5. You should see endpoints like:
   - GET /users
   - POST /users
   - GET /users/{id}
   - PUT /users/{id}
   - DELETE /users/{id}
   - GET /posts
   - POST /posts

### Testing Postman Import
1. Open your API automation tool
2. Go to the Smart Import section
3. Select "Postman Collection" as the import type
4. Upload `sample-postman-collection.json`
5. You should see organized endpoints under folders:
   - User Management (5 endpoints)
   - Posts Management (3 endpoints)
   - Comments Management (2 endpoints)
   - Authentication Examples (2 endpoints)

## Sample API Details

The sample files use JSONPlaceholder (https://jsonplaceholder.typicode.com) as the test API, which provides:
- Realistic REST endpoints
- JSON responses
- No authentication required for basic testing
- Common HTTP methods (GET, POST, PUT, DELETE)

## What to Validate

After importing, you can test validation rules for:
- **Status codes**: 200, 201, 404
- **Response fields**: id, name, email, title, body, userId
- **Field existence**: Check if specific fields are present
- **Value matching**: Validate specific field values

## Example Test Scenarios

1. **GET /users/1**
   - Validate status code = 200
   - Validate field "id" exists
   - Validate field "name" exists

2. **POST /posts**
   - Validate status code = 201
   - Validate response contains "id" field
   - Validate "title" matches input

3. **GET /posts?userId=1**
   - Validate status code = 200
   - Validate response is array
   - Validate each item has "userId" = 1
