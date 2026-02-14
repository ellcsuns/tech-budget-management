# Implementation Plan: User Authentication and Authorization System

## Overview

Este plan implementa un sistema completo de autenticación y autorización basado en roles (RBAC) para una aplicación existente de gestión presupuestaria. La implementación se realizará en TypeScript usando Node.js, Express, Prisma y PostgreSQL en el backend, y React con TypeScript en el frontend.

El enfoque es incremental: primero se establece la infraestructura de base de datos y servicios core, luego se implementan los servicios de autenticación y autorización, después se agregan los endpoints de API, y finalmente se construyen las interfaces de usuario. Cada paso incluye pruebas de propiedades para validar correctitud.

## Tasks

- [ ] 1. Setup database schema and core infrastructure
  - [ ] 1.1 Extend Prisma schema with authentication and authorization models
    - Add User, Role, UserRole, Permission, and Session models to schema.prisma
    - Define enums for PermissionType (VIEW, MODIFY)
    - Add indexes for performance optimization
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 1.2 Create and run database migration
    - Generate Prisma migration for new models
    - Run migration against PostgreSQL database
    - Verify tables and indexes are created correctly
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 1.3 Define menu codes constants
    - Create constants file with all application menu codes
    - Export MenuCode type for type safety
    - Document each menu code's purpose
    - _Requirements: 5.5, 6.1, 6.2_

- [ ] 2. Implement password service
  - [ ] 2.1 Create PasswordService with bcrypt hashing
    - Implement hashPassword() using bcrypt with 10 salt rounds
    - Implement verifyPassword() for hash comparison
    - Implement validatePasswordStrength() with minimum 8 characters
    - Implement generateRandomPassword() for password resets
    - _Requirements: 1.3, 10.1, 10.3, 10.5_
  
  - [ ]*  2.2 Write property test for password hashing
    - **Property 3: Passwords Are Always Hashed with Bcrypt**
    - **Validates: Requirements 1.3, 10.1**
  
  - [ ]* 2.3 Write property test for password length validation
    - **Property 30: Minimum Password Length Is Enforced**
    - **Validates: Requirements 10.3**

- [ ] 3. Implement user service
  - [ ] 3.1 Create UserService with CRUD operations
    - Implement createUser() with password hashing and role assignment
    - Implement updateUser() preventing username changes
    - Implement setUserStatus() for activation/deactivation
    - Implement assignRoles() for role management
    - Implement getUserWithPermissions() loading user with roles and permissions
    - Implement listUsers() with pagination and filters
    - Implement changePassword() with current password verification
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 8.2, 8.3, 8.5, 10.2_
  
  - [ ]* 3.2 Write property test for user creation
    - **Property 4: User Creation Stores All Required Fields**
    - **Validates: Requirements 3.1**
  
  - [ ]* 3.3 Write property test for multiple role assignment
    - **Property 5: Multiple Roles Can Be Assigned to Users**
    - **Validates: Requirements 3.2**
  
  - [ ]* 3.4 Write property test for username uniqueness
    - **Property 6: Username Uniqueness Is Enforced**
    - **Validates: Requirements 3.3**
  
  - [ ]* 3.5 Write property test for deactivated user login prevention
    - **Property 7: Deactivated Users Cannot Login**
    - **Validates: Requirements 3.4**
  
  - [ ]* 3.6 Write property test for username immutability
    - **Property 23: Username Cannot Be Changed**
    - **Validates: Requirements 8.3**
  
  - [ ]* 3.7 Write property test for required fields validation
    - **Property 22: User Creation Requires All Mandatory Fields**
    - **Validates: Requirements 8.2**
  
  - [ ]* 3.8 Write property test for password change validation
    - **Property 29: Password Change Requires Current Password**
    - **Validates: Requirements 10.2**

- [ ] 4. Implement role service
  - [ ] 4.1 Create RoleService with role management operations
    - Implement createRole() with permission configuration
    - Implement updateRole() for role and permission updates
    - Implement deleteRole() with user assignment validation
    - Implement getRoleWithPermissions() loading role with all permissions
    - Implement listRoles() returning all roles with permission counts
    - Implement setPermissions() for configuring role permissions
    - Implement getUsersWithRole() for impact analysis
    - _Requirements: 4.1, 4.2, 4.5, 5.1, 5.2, 5.3, 7.1, 7.3_
  
  - [ ]* 4.2 Write property test for role name uniqueness
    - **Property 9: Role Names Must Be Unique**
    - **Validates: Requirements 4.1**
  
  - [ ]* 4.3 Write property test for role creation with permissions
    - **Property 10: Roles Can Be Created with Permissions**
    - **Validates: Requirements 4.2**
  
  - [ ]* 4.4 Write property test for role deletion prevention
    - **Property 12: Roles with Assigned Users Cannot Be Deleted**
    - **Validates: Requirements 4.5**
  
  - [ ]* 4.5 Write property test for permission type validation
    - **Property 13: Only Valid Permission Types Are Accepted**
    - **Validates: Requirements 5.2**
  
  - [ ]* 4.6 Write property test for modify implies view
    - **Property 14: Modify Permission Implies View Permission**
    - **Validates: Requirements 5.3**
  
  - [ ]* 4.7 Write property test for menu code validation
    - **Property 16: Invalid Menu Codes Are Rejected**
    - **Validates: Requirements 5.5**
  
  - [ ]* 4.8 Write property test for role minimum permissions
    - **Property 21: Roles Must Have At Least One Permission**
    - **Validates: Requirements 7.3**

- [ ] 5. Implement permission service
  - [ ] 5.1 Create PermissionService for runtime permission validation
    - Implement hasPermission() checking user access to menu code
    - Implement getUserPermissions() aggregating permissions from all roles
    - Implement validateMenuCode() verifying menu code exists
    - Implement getAvailableMenuCodes() returning valid menu codes
    - _Requirements: 4.3, 5.4, 6.1, 6.2_
  
  - [ ]* 5.2 Write property test for permission union
    - **Property 11: User Permissions Are Union of All Role Permissions**
    - **Validates: Requirements 4.3**
  
  - [ ]* 5.3 Write property test for immediate permission updates
    - **Property 15: Role Permission Changes Apply Immediately**
    - **Validates: Requirements 5.4**
  
  - [ ]* 5.4 Write property test for permission validation
    - **Property 17: Permission Validation Enforces Access Control**
    - **Validates: Requirements 6.1, 6.2**

- [ ] 6. Implement authentication service and JWT handling
  - [ ] 6.1 Create AuthService with JWT token management
    - Implement login() validating credentials and generating JWT
    - Implement validateToken() verifying JWT and loading user session
    - Implement logout() invalidating session tokens
    - Implement refreshToken() extending session expiration
    - Implement ensureDefaultAdmin() creating default admin user
    - Configure JWT with secret, expiration, and signing algorithm
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.2, 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 6.2 Write property test for successful login
    - **Property 1: Successful Login Creates Valid Session**
    - **Validates: Requirements 1.1, 1.5**
  
  - [ ]* 6.3 Write property test for invalid credentials rejection
    - **Property 2: Invalid Credentials Are Rejected**
    - **Validates: Requirements 1.2**
  
  - [ ]* 6.4 Write property test for session expiration extension
    - **Property 25: Valid Tokens Extend Session Expiration**
    - **Validates: Requirements 9.2**
  
  - [ ]* 6.5 Write property test for expired token rejection
    - **Property 26: Expired Tokens Are Rejected**
    - **Validates: Requirements 9.3**
  
  - [ ]* 6.6 Write property test for logout invalidation
    - **Property 27: Logout Invalidates Session**
    - **Validates: Requirements 9.4**
  
  - [ ]* 6.7 Write property test for concurrent sessions
    - **Property 28: Concurrent Sessions Are Supported**
    - **Validates: Requirements 9.5**
  
  - [ ] 6.8 Write unit test for default admin creation
    - Test ensureDefaultAdmin() creates admin user with correct credentials
    - Test admin user has "Administrador" role assigned
    - _Requirements: 2.1, 2.2, 4.4_

- [ ] 7. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Express middleware for authentication and authorization
  - [ ] 8.1 Create authenticateJWT middleware
    - Extract JWT token from Authorization header
    - Validate token signature and expiration
    - Load user with roles and permissions
    - Attach user to request object
    - Return 401 for invalid/missing tokens
    - _Requirements: 1.1, 1.5, 9.3, 11.1_
  
  - [ ] 8.2 Create requirePermission middleware factory
    - Accept menuCode and permissionType parameters
    - Check user has required permission through PermissionService
    - Return 403 for insufficient permissions
    - Log permission denial for security auditing
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 11.1_
  
  - [ ]* 8.3 Write property test for unauthorized access rejection
    - **Property 18: Unauthorized Access Returns 403**
    - **Validates: Requirements 6.3**
  
  - [ ]* 8.4 Write property test for permission failure logging
    - **Property 19: Permission Failures Are Logged**
    - **Validates: Requirements 6.5**

- [ ] 9. Implement authentication API endpoints
  - [ ] 9.1 Create POST /api/auth/login endpoint
    - Accept username and password in request body
    - Call AuthService.login() to authenticate
    - Return token, user data, and permissions
    - Handle invalid credentials with 401 error
    - _Requirements: 1.1, 1.2_
  
  - [ ] 9.2 Create POST /api/auth/logout endpoint
    - Require authentication via authenticateJWT middleware
    - Call AuthService.logout() to invalidate token
    - Return success response
    - _Requirements: 9.4_
  
  - [ ] 9.3 Create POST /api/auth/refresh endpoint
    - Require authentication via authenticateJWT middleware
    - Call AuthService.refreshToken() to generate new token
    - Return new token with extended expiration
    - _Requirements: 9.2_
  
  - [ ] 9.4 Create GET /api/auth/me endpoint
    - Require authentication via authenticateJWT middleware
    - Return current user with roles and permissions
    - _Requirements: 3.5_

- [ ] 10. Implement user management API endpoints
  - [ ] 10.1 Create GET /api/users endpoint
    - Require authentication and "users" view permission
    - Accept pagination and filter query parameters
    - Call UserService.listUsers() to retrieve users
    - Return paginated user list with roles and status
    - _Requirements: 3.5, 8.5_
  
  - [ ] 10.2 Create GET /api/users/:id endpoint
    - Require authentication and "users" view permission
    - Call UserService.getUserWithPermissions() to retrieve user
    - Return user with complete information
    - Return 404 if user not found
    - _Requirements: 3.5_
  
  - [ ] 10.3 Create POST /api/users endpoint
    - Require authentication and "users" modify permission
    - Validate required fields in request body
    - Call UserService.createUser() to create user
    - Return created user with 201 status
    - Handle validation errors with 400 status
    - _Requirements: 3.1, 8.2_
  
  - [ ] 10.4 Create PUT /api/users/:id endpoint
    - Require authentication and "users" modify permission
    - Validate request body
    - Call UserService.updateUser() to update user
    - Return updated user
    - Handle validation errors with 400 status
    - _Requirements: 3.3, 8.3_
  
  - [ ] 10.5 Create PUT /api/users/:id/status endpoint
    - Require authentication and "users" modify permission
    - Accept active boolean in request body
    - Call UserService.setUserStatus() to change status
    - Return updated user
    - _Requirements: 3.4_
  
  - [ ] 10.6 Create PUT /api/users/:id/password endpoint
    - Require authentication (user can change own password)
    - Accept currentPassword and newPassword in request body
    - Call UserService.changePassword() to update password
    - Return success response
    - Handle validation errors with 400 status
    - _Requirements: 10.2, 10.3_
  
  - [ ]* 10.7 Write property test for password hash exclusion from responses
    - **Property 31: Password Hashes Never Appear in API Responses**
    - **Validates: Requirements 10.4**
  
  - [ ]* 10.8 Write property test for user list completeness
    - **Property 8: User List Contains Complete Information**
    - **Validates: Requirements 3.5**
  
  - [ ]* 10.9 Write property test for user search functionality
    - **Property 24: User Search Returns Matching Results**
    - **Validates: Requirements 8.5**

- [ ] 11. Implement role management API endpoints
  - [ ] 11.1 Create GET /api/roles endpoint
    - Require authentication and "roles" view permission
    - Call RoleService.listRoles() to retrieve all roles
    - Return roles with permission counts
    - _Requirements: 7.1_
  
  - [ ] 11.2 Create GET /api/roles/:id endpoint
    - Require authentication and "roles" view permission
    - Call RoleService.getRoleWithPermissions() to retrieve role
    - Return role with all permissions
    - Return 404 if role not found
    - _Requirements: 4.2_
  
  - [ ] 11.3 Create POST /api/roles endpoint
    - Require authentication and "roles" modify permission
    - Validate required fields and permissions in request body
    - Call RoleService.createRole() to create role
    - Return created role with 201 status
    - Handle validation errors with 400 status
    - _Requirements: 4.1, 4.2, 5.1, 7.3_
  
  - [ ] 11.4 Create PUT /api/roles/:id endpoint
    - Require authentication and "roles" modify permission
    - Validate request body
    - Call RoleService.updateRole() to update role
    - Return updated role
    - Handle validation errors with 400 status
    - _Requirements: 4.1, 5.4_
  
  - [ ] 11.5 Create DELETE /api/roles/:id endpoint
    - Require authentication and "roles" modify permission
    - Call RoleService.deleteRole() to delete role
    - Return 204 No Content on success
    - Return 400 if role has assigned users
    - _Requirements: 4.5_
  
  - [ ] 11.6 Create GET /api/roles/:id/users endpoint
    - Require authentication and "roles" view permission
    - Call RoleService.getUsersWithRole() to get affected users
    - Return list of users with this role
    - _Requirements: 7.5_
  
  - [ ]* 11.7 Write property test for role permission counts
    - **Property 20: Role List Shows Permission Counts**
    - **Validates: Requirements 7.1**

- [ ] 12. Checkpoint - Ensure all API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Create database seed with default admin and roles
  - [ ] 13.1 Update seed script to create default data
    - Create "Administrador" role with all menu permissions
    - Create default admin user (username: admin, password: admin)
    - Assign "Administrador" role to admin user
    - Create additional example roles (Viewer, Editor)
    - _Requirements: 2.1, 2.2, 4.4_
  
  - [ ] 13.2 Write unit test for admin role permissions
    - Test "Administrador" role has all menu codes with modify permission
    - _Requirements: 4.4_

- [ ] 14. Implement frontend AuthContext
  - [ ] 14.1 Create AuthContext with authentication state management
    - Implement AuthProvider component with user and permissions state
    - Implement login() function calling API and storing token
    - Implement logout() function clearing token and state
    - Implement hasPermission() helper for permission checking
    - Load user from stored token on mount
    - Handle token expiration and auto-logout
    - _Requirements: 1.1, 9.4, 11.3_
  
  - [ ] 14.2 Create useAuth hook for consuming AuthContext
    - Export hook for easy access to auth state and functions
    - _Requirements: 11.3_

- [ ] 15. Implement frontend ProtectedRoute component
  - [ ] 15.1 Create ProtectedRoute wrapper component
    - Check authentication status before rendering children
    - Redirect to login if not authenticated
    - Check required permissions if menuCode and permissionType provided
    - Show AccessDenied component if insufficient permissions
    - Show loading spinner while checking authentication
    - _Requirements: 6.1, 6.2, 6.3, 11.4_

- [ ] 16. Implement LoginPage component
  - [ ] 16.1 Create login form UI with Tailwind CSS
    - Create form with username and password inputs
    - Add submit button and error message display
    - Style with Tailwind CSS for clean, professional look
    - _Requirements: 1.1, 1.2_
  
  - [ ] 16.2 Implement login form logic
    - Handle form submission calling AuthContext.login()
    - Display error messages for invalid credentials
    - Redirect to dashboard on successful login
    - Show loading state during authentication
    - _Requirements: 1.1, 1.2_
  
  - [ ] 16.3 Add default password change warning
    - Show warning banner if user is admin with default password
    - Provide link to password change page
    - _Requirements: 2.3_

- [ ] 17. Implement UserManagementPage component
  - [ ] 17.1 Create user list table UI
    - Display users in table with columns: username, email, full name, status, roles, last login
    - Add search and filter controls
    - Add "Create User" button
    - Style with Tailwind CSS
    - _Requirements: 3.5, 8.5_
  
  - [ ] 17.2 Implement user list data fetching
    - Fetch users from GET /api/users on component mount
    - Implement search and filter functionality
    - Handle pagination
    - _Requirements: 3.5, 8.5_
  
  - [ ] 17.3 Create UserModal component for create/edit
    - Create modal form with fields: username, password, email, full name, roles
    - Add role multi-select dropdown
    - Implement form validation
    - Handle create and update operations
    - _Requirements: 3.1, 3.3, 8.2, 8.3_
  
  - [ ] 17.4 Implement user actions (edit, deactivate, delete)
    - Add action buttons to each table row
    - Implement edit user opening UserModal
    - Implement activate/deactivate toggle
    - Add confirmation dialogs for destructive actions
    - _Requirements: 3.3, 3.4_

- [ ] 18. Implement RoleManagementPage component
  - [ ] 18.1 Create role list table UI
    - Display roles in table with columns: name, description, permission count, user count
    - Add "Create Role" button
    - Style with Tailwind CSS
    - _Requirements: 7.1_
  
  - [ ] 18.2 Implement role list data fetching
    - Fetch roles from GET /api/roles on component mount
    - Display permission counts for each role
    - _Requirements: 7.1_
  
  - [ ] 18.3 Create RoleModal component for create/edit
    - Create modal form with fields: name, description
    - Add permission configuration section with menu codes
    - Display checkboxes for view and modify permissions per menu
    - Implement form validation
    - Handle create and update operations
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 7.3_
  
  - [ ] 18.4 Implement role actions (edit, delete, view users)
    - Add action buttons to each table row
    - Implement edit role opening RoleModal
    - Implement delete with confirmation and user check
    - Add "View Users" action showing affected users
    - _Requirements: 4.5, 7.5_

- [ ] 19. Integrate authentication with existing application routes
  - [ ] 19.1 Wrap App component with AuthProvider
    - Import and wrap root App component with AuthProvider
    - Ensure all components have access to auth context
    - _Requirements: 11.3_
  
  - [ ] 19.2 Protect existing routes with ProtectedRoute
    - Wrap budget routes with ProtectedRoute and "budgets" menu code
    - Wrap expense routes with ProtectedRoute and "expenses" menu code
    - Wrap transaction routes with ProtectedRoute and "transactions" menu code
    - Wrap master data routes with ProtectedRoute and "master-data" menu code
    - Specify view or modify permission based on route action
    - _Requirements: 6.1, 6.2, 11.2_
  
  - [ ] 19.3 Add authentication routes to router
    - Add /login route rendering LoginPage
    - Add /users route rendering UserManagementPage with "users" permission
    - Add /roles route rendering RoleManagementPage with "roles" permission
    - _Requirements: 1.1, 3.5, 7.1_
  
  - [ ] 19.4 Update navigation menu with permission-based visibility
    - Show/hide menu items based on user permissions
    - Use AuthContext.hasPermission() to check visibility
    - Add "Users" and "Roles" menu items for admin
    - Add "Logout" button calling AuthContext.logout()
    - _Requirements: 6.1, 11.4_

- [ ] 20. Implement API client interceptor for authentication
  - [ ] 20.1 Add request interceptor to include JWT token
    - Modify api.ts to add Authorization header to all requests
    - Read token from localStorage
    - _Requirements: 1.5_
  
  - [ ] 20.2 Add response interceptor for token expiration handling
    - Intercept 401 responses indicating expired token
    - Clear auth state and redirect to login
    - _Requirements: 9.3_

- [ ] 21. Final checkpoint - End-to-end testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Create password reset functionality (optional enhancement)
  - [ ] 22.1 Implement password reset token generation
    - Add generatePasswordResetToken() to AuthService
    - Store reset tokens with expiration in database
    - _Requirements: 10.5_
  
  - [ ]* 22.2 Write property test for password reset tokens
    - **Property 32: Password Reset Generates Secure Token**
    - **Validates: Requirements 10.5**
  
  - [ ] 22.3 Create POST /api/auth/forgot-password endpoint
    - Accept email in request body
    - Generate reset token and send email
    - Return success response
    - _Requirements: 10.5_
  
  - [ ] 22.4 Create POST /api/auth/reset-password endpoint
    - Accept token and new password in request body
    - Validate token and expiration
    - Update user password
    - Return success response
    - _Requirements: 10.5_
  
  - [ ] 22.5 Create ForgotPasswordPage component
    - Create form for email input
    - Call forgot-password endpoint
    - Show success message
    - _Requirements: 10.5_
  
  - [ ] 22.6 Create ResetPasswordPage component
    - Create form for new password input
    - Extract token from URL query parameter
    - Call reset-password endpoint
    - Redirect to login on success
    - _Requirements: 10.5_

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows a bottom-up approach: database → services → API → UI
- All passwords are hashed with bcrypt before storage
- JWT tokens are used for stateless session management
- Permission validation occurs at both middleware and service layers
- Frontend uses React Context for global authentication state
- All protected routes require authentication and appropriate permissions
