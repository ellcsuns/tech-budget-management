# Design Document: User Authentication and Authorization System

## Overview

Este documento describe el diseño técnico de un sistema completo de autenticación y autorización para una aplicación de gestión presupuestaria existente construida con Node.js, Express, Prisma, PostgreSQL, React y TypeScript. El sistema implementa autenticación basada en credenciales (usuario/contraseña), autorización basada en roles (RBAC), y permisos granulares por menú con dos niveles: visualización y modificación.

El diseño sigue una arquitectura de capas con separación clara entre autenticación (verificación de identidad), autorización (control de acceso), y lógica de negocio. Se integra con la infraestructura existente mediante middleware de Express y React Context, minimizando cambios en el código existente.

### Key Design Decisions

1. **JWT para sesiones**: Tokens stateless que reducen carga en base de datos y facilitan escalabilidad horizontal
2. **Bcrypt para hashing**: Algoritmo probado y seguro con salt automático y configuración de rounds
3. **RBAC con permisos granulares**: Flexibilidad para asignar múltiples roles y combinar permisos
4. **Middleware de autorización**: Validación centralizada y reutilizable en todas las rutas
5. **Preparación para SSO**: Esquema de base de datos extensible sin cambios estructurales futuros

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Login Page   │  │ User Admin   │  │ Role Admin   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         AuthContext (Session Management)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         ProtectedRoute (Permission Checking)         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP + JWT
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express + Prisma)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Authentication Middleware               │   │
│  │         (JWT Validation + User Loading)              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Authorization Middleware                │   │
│  │         (Permission Validation by Menu)              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Auth      │  │    User     │  │    Role     │         │
│  │  Service    │  │  Service    │  │  Service    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Password Service                        │   │
│  │         (Hashing + Validation)                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│  Users │ Roles │ UserRoles │ Permissions │ Sessions         │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User → Login Form → POST /api/auth/login
                         │
                         ▼
                  AuthService.login()
                         │
                         ├─→ Validate credentials
                         ├─→ Hash comparison (bcrypt)
                         ├─→ Load user + roles + permissions
                         ├─→ Generate JWT token
                         │
                         ▼
                  Return { token, user, permissions }
                         │
                         ▼
                  Frontend stores token
                         │
                         ▼
              Subsequent requests include:
              Authorization: Bearer <token>
```

### Authorization Flow

```
Request → Authentication Middleware → Authorization Middleware → Route Handler
            │                              │
            ├─→ Validate JWT               ├─→ Extract menu_code from route
            ├─→ Load user from token       ├─→ Check required permission type
            ├─→ Attach to req.user         ├─→ Query user's roles
            │                              ├─→ Query permissions for roles
            │                              ├─→ Validate permission exists
            │                              │
            │                              ├─→ ALLOW or DENY (403)
            ▼                              ▼
         Continue                       Continue or Reject
```

## Components and Interfaces

### Backend Services

#### AuthService

Responsable de autenticación, generación de tokens y validación de sesiones.

```typescript
interface AuthService {
  // Authenticate user and generate JWT token
  login(username: string, password: string): Promise<LoginResult>
  
  // Validate JWT token and return user data
  validateToken(token: string): Promise<UserSession>
  
  // Invalidate session (logout)
  logout(token: string): Promise<void>
  
  // Refresh token before expiration
  refreshToken(token: string): Promise<string>
  
  // Verify if default admin exists, create if not
  ensureDefaultAdmin(): Promise<void>
}

interface LoginResult {
  token: string
  user: UserDTO
  permissions: PermissionDTO[]
  expiresAt: Date
}

interface UserSession {
  userId: string
  username: string
  roles: string[]
  permissions: Map<string, PermissionType[]>
}
```

#### UserService

Gestión de usuarios: creación, actualización, asignación de roles.

```typescript
interface UserService {
  // Create new user with roles
  createUser(data: CreateUserDTO): Promise<User>
  
  // Update user information (except username)
  updateUser(userId: string, data: UpdateUserDTO): Promise<User>
  
  // Deactivate/activate user
  setUserStatus(userId: string, active: boolean): Promise<User>
  
  // Assign roles to user
  assignRoles(userId: string, roleIds: string[]): Promise<void>
  
  // Get user with roles and permissions
  getUserWithPermissions(userId: string): Promise<UserWithPermissions>
  
  // List all users with filters
  listUsers(filters: UserFilters): Promise<PaginatedUsers>
  
  // Change user password
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
}

interface CreateUserDTO {
  username: string
  password: string
  email: string
  fullName: string
  roleIds: string[]
}

interface UpdateUserDTO {
  email?: string
  fullName?: string
  roleIds?: string[]
}

interface UserFilters {
  search?: string
  status?: 'active' | 'inactive'
  roleId?: string
  page: number
  pageSize: number
}
```

#### RoleService

Gestión de roles y configuración de permisos.

```typescript
interface RoleService {
  // Create new role with permissions
  createRole(data: CreateRoleDTO): Promise<Role>
  
  // Update role information and permissions
  updateRole(roleId: string, data: UpdateRoleDTO): Promise<Role>
  
  // Delete role (only if no users assigned)
  deleteRole(roleId: string): Promise<void>
  
  // Get role with all permissions
  getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions>
  
  // List all roles
  listRoles(): Promise<Role[]>
  
  // Configure permissions for role
  setPermissions(roleId: string, permissions: PermissionConfigDTO[]): Promise<void>
  
  // Get users affected by role
  getUsersWithRole(roleId: string): Promise<User[]>
}

interface CreateRoleDTO {
  name: string
  description: string
  permissions: PermissionConfigDTO[]
}

interface UpdateRoleDTO {
  name?: string
  description?: string
  permissions?: PermissionConfigDTO[]
}

interface PermissionConfigDTO {
  menuCode: string
  permissionType: 'view' | 'modify'
}
```

#### PasswordService

Manejo seguro de contraseñas: hashing, validación, generación.

```typescript
interface PasswordService {
  // Hash password with bcrypt
  hashPassword(plainPassword: string): Promise<string>
  
  // Verify password against hash
  verifyPassword(plainPassword: string, hash: string): Promise<boolean>
  
  // Validate password strength
  validatePasswordStrength(password: string): ValidationResult
  
  // Generate secure random password
  generateRandomPassword(length: number): string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}
```

#### PermissionService

Validación de permisos en tiempo de ejecución.

```typescript
interface PermissionService {
  // Check if user has permission for menu
  hasPermission(userId: string, menuCode: string, permissionType: PermissionType): Promise<boolean>
  
  // Get all permissions for user (aggregated from all roles)
  getUserPermissions(userId: string): Promise<Map<string, PermissionType[]>>
  
  // Validate menu code exists
  validateMenuCode(menuCode: string): boolean
  
  // Get available menu codes
  getAvailableMenuCodes(): string[]
}

enum PermissionType {
  VIEW = 'view',
  MODIFY = 'modify'
}
```

### Backend Middleware

#### authenticateJWT

Middleware para validar JWT y cargar usuario en request.

```typescript
function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const token = extractTokenFromHeader(req)
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await UserService.getUserWithPermissions(decoded.userId)
    
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Invalid or inactive user' })
    }
    
    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' })
  }
}
```

#### requirePermission

Middleware para validar permisos específicos por menú.

```typescript
function requirePermission(menuCode: string, permissionType: PermissionType) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }
    
    const hasPermission = await PermissionService.hasPermission(
      req.user.id,
      menuCode,
      permissionType
    )
    
    if (!hasPermission) {
      await logPermissionDenial(req.user.id, menuCode, permissionType)
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: { menuCode, permissionType }
      })
    }
    
    next()
  }
}

// Usage example:
router.get('/api/expenses', 
  authenticateJWT,
  requirePermission('expenses', PermissionType.VIEW),
  ExpenseController.list
)

router.post('/api/expenses',
  authenticateJWT,
  requirePermission('expenses', PermissionType.MODIFY),
  ExpenseController.create
)
```

### Frontend Components

#### AuthContext

React Context para gestionar estado de autenticación global.

```typescript
interface AuthContextType {
  user: User | null
  permissions: Map<string, PermissionType[]>
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (menuCode: string, permissionType: PermissionType) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<Map<string, PermissionType[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Load user from stored token on mount
    const token = localStorage.getItem('auth_token')
    if (token) {
      validateAndLoadUser(token)
    } else {
      setIsLoading(false)
    }
  }, [])
  
  const login = async (username: string, password: string) => {
    const result = await api.post('/auth/login', { username, password })
    localStorage.setItem('auth_token', result.token)
    setUser(result.user)
    setPermissions(new Map(result.permissions))
  }
  
  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setPermissions(new Map())
  }
  
  const hasPermission = (menuCode: string, permissionType: PermissionType): boolean => {
    const menuPermissions = permissions.get(menuCode)
    return menuPermissions?.includes(permissionType) ?? false
  }
  
  return (
    <AuthContext.Provider value={{ user, permissions, isAuthenticated: !!user, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}
```

#### ProtectedRoute

Componente para proteger rutas que requieren autenticación y permisos.

```typescript
interface ProtectedRouteProps {
  children: ReactNode
  menuCode?: string
  permissionType?: PermissionType
}

function ProtectedRoute({ children, menuCode, permissionType }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth()
  const navigate = useNavigate()
  
  if (isLoading) {
    return <LoadingSpinner />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (menuCode && permissionType && !hasPermission(menuCode, permissionType)) {
    return <AccessDenied requiredPermission={{ menuCode, permissionType }} />
  }
  
  return <>{children}</>
}

// Usage example:
<Route path="/expenses" element={
  <ProtectedRoute menuCode="expenses" permissionType="view">
    <ExpensesPage />
  </ProtectedRoute>
} />
```

#### LoginPage

Página de inicio de sesión.

```typescript
function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid credentials')
    }
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Login
          </button>
        </form>
      </div>
    </div>
  )
}
```

#### UserManagementPage

Interfaz de administración de usuarios.

```typescript
function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const loadUsers = async () => {
    const result = await api.get('/api/users')
    setUsers(result.data)
  }
  
  const handleCreateUser = () => {
    setSelectedUser(null)
    setIsModalOpen(true)
  }
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={handleCreateUser} className="bg-blue-500 text-white px-4 py-2 rounded">
          Create User
        </button>
      </div>
      
      <UserTable users={users} onEdit={handleEditUser} />
      
      {isModalOpen && (
        <UserModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onSave={loadUsers}
        />
      )}
    </div>
  )
}
```

#### RoleManagementPage

Interfaz de administración de roles.

```typescript
function RoleManagementPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const loadRoles = async () => {
    const result = await api.get('/api/roles')
    setRoles(result.data)
  }
  
  const handleCreateRole = () => {
    setSelectedRole(null)
    setIsModalOpen(true)
  }
  
  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setIsModalOpen(true)
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <button onClick={handleCreateRole} className="bg-blue-500 text-white px-4 py-2 rounded">
          Create Role
        </button>
      </div>
      
      <RoleTable roles={roles} onEdit={handleEditRole} />
      
      {isModalOpen && (
        <RoleModal
          role={selectedRole}
          onClose={() => setIsModalOpen(false)}
          onSave={loadRoles}
        />
      )}
    </div>
  )
}
```

## Data Models

### Prisma Schema Extensions

```prisma
// User model
model User {
  id           String      @id @default(uuid())
  username     String      @unique
  passwordHash String
  email        String      @unique
  fullName     String
  active       Boolean     @default(true)
  lastLoginAt  DateTime?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  userRoles    UserRole[]
  
  @@index([username])
  @@index([email])
  @@index([active])
}

// Role model
model Role {
  id          String       @id @default(uuid())
  name        String       @unique
  description String
  isSystem    Boolean      @default(false) // true for "Administrador" role
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  userRoles   UserRole[]
  permissions Permission[]
  
  @@index([name])
}

// UserRole junction table (many-to-many)
model UserRole {
  id         String   @id @default(uuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  roleId     String
  role       Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)
  assignedAt DateTime @default(now())
  
  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
}

// Permission model
model Permission {
  id             String         @id @default(uuid())
  roleId         String
  role           Role           @relation(fields: [roleId], references: [id], onDelete: Cascade)
  menuCode       String
  permissionType PermissionType
  createdAt      DateTime       @default(now())
  
  @@unique([roleId, menuCode, permissionType])
  @@index([roleId])
  @@index([menuCode])
}

enum PermissionType {
  VIEW
  MODIFY
}

// Session model (optional, for token blacklisting)
model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([expiresAt])
}
```

### Menu Codes

Códigos de menú para la aplicación existente:

```typescript
const MENU_CODES = {
  DASHBOARD: 'dashboard',
  BUDGETS: 'budgets',
  EXPENSES: 'expenses',
  TRANSACTIONS: 'transactions',
  PLAN_VALUES: 'plan-values',
  MASTER_DATA: 'master-data',
  TECHNOLOGY_DIRECTIONS: 'technology-directions',
  USER_AREAS: 'user-areas',
  FINANCIAL_COMPANIES: 'financial-companies',
  TAG_DEFINITIONS: 'tag-definitions',
  CONVERSION_RATES: 'conversion-rates',
  USERS: 'users',
  ROLES: 'roles',
  REPORTS: 'reports'
} as const

type MenuCode = typeof MENU_CODES[keyof typeof MENU_CODES]
```

### DTOs (Data Transfer Objects)

```typescript
// User DTOs
interface UserDTO {
  id: string
  username: string
  email: string
  fullName: string
  active: boolean
  lastLoginAt: Date | null
  roles: RoleDTO[]
}

interface UserWithPermissions extends UserDTO {
  permissions: PermissionDTO[]
}

// Role DTOs
interface RoleDTO {
  id: string
  name: string
  description: string
  isSystem: boolean
}

interface RoleWithPermissions extends RoleDTO {
  permissions: PermissionDTO[]
  userCount: number
}

// Permission DTOs
interface PermissionDTO {
  menuCode: string
  permissionType: PermissionType
}
```

## Correctness Properties

*Una propiedad es una característica o comportamiento que debe mantenerse verdadero en todas las ejecuciones válidas de un sistema, esencialmente, una declaración formal sobre lo que el sistema debe hacer. Las propiedades sirven como puente entre las especificaciones legibles por humanos y las garantías de correctitud verificables por máquinas.*


### Property 1: Successful Login Creates Valid Session

*For any* valid user credentials (username and password), when authentication succeeds, the system should return a JWT token that is valid, contains the correct user information, and has an appropriate expiration time set.

**Validates: Requirements 1.1, 1.5**

### Property 2: Invalid Credentials Are Rejected

*For any* invalid credential combination (wrong username, wrong password, or non-existent user), the authentication attempt should be rejected with an appropriate error message and no session token should be generated.

**Validates: Requirements 1.2**

### Property 3: Passwords Are Always Hashed with Bcrypt

*For any* user in the database, the stored password value should be a valid bcrypt hash and should never equal the plain text password. Additionally, all password hashes should follow the bcrypt format pattern.

**Validates: Requirements 1.3, 10.1**

### Property 4: User Creation Stores All Required Fields

*For any* valid user creation request with username, password, email, full name, and roles, the system should persist all fields correctly with the password hashed, and the user should be retrievable with all data intact.

**Validates: Requirements 3.1**

### Property 5: Multiple Roles Can Be Assigned to Users

*For any* user and any set of valid roles, the system should allow assignment of multiple roles simultaneously, and all assigned roles should be retrievable when querying the user.

**Validates: Requirements 3.2**

### Property 6: Username Uniqueness Is Enforced

*For any* user update operation that attempts to change the username to one that already exists, the system should reject the operation and maintain the original username.

**Validates: Requirements 3.3**

### Property 7: Deactivated Users Cannot Login

*For any* user that has been deactivated, any login attempt with that user's valid credentials should be rejected, even though the credentials are correct.

**Validates: Requirements 3.4**

### Property 8: User List Contains Complete Information

*For any* request to list users, the response should include all users with their complete information: username, email, full name, status, assigned roles, and last login date.

**Validates: Requirements 3.5**

### Property 9: Role Names Must Be Unique

*For any* role creation or update operation that attempts to use a name that already exists, the system should reject the operation and return a validation error.

**Validates: Requirements 4.1**

### Property 10: Roles Can Be Created with Permissions

*For any* valid role creation request with a set of menu code permissions, the system should persist the role with all specified permissions, and those permissions should be retrievable when querying the role.

**Validates: Requirements 4.2**

### Property 11: User Permissions Are Union of All Role Permissions

*For any* user with multiple roles, the effective permissions for that user should be the union of all permissions from all assigned roles, with no duplicates and no permissions lost.

**Validates: Requirements 4.3**

### Property 12: Roles with Assigned Users Cannot Be Deleted

*For any* role that has one or more users assigned to it, any deletion attempt should be rejected with an appropriate error indicating the role is in use.

**Validates: Requirements 4.5**

### Property 13: Only Valid Permission Types Are Accepted

*For any* permission creation or update operation, only the permission types "view" and "modify" should be accepted, and any other value should be rejected with a validation error.

**Validates: Requirements 5.2**

### Property 14: Modify Permission Implies View Permission

*For any* role with a "modify" permission for a menu code, the system should automatically ensure that "view" permission also exists for that same menu code, either explicitly or implicitly.

**Validates: Requirements 5.3**

### Property 15: Role Permission Changes Apply Immediately

*For any* role whose permissions are updated, all users with that role should immediately reflect the new permissions when their effective permissions are queried, without requiring re-login.

**Validates: Requirements 5.4**

### Property 16: Invalid Menu Codes Are Rejected

*For any* permission creation attempt with a menu code that doesn't exist in the predefined list of valid menu codes, the system should reject the operation with a validation error.

**Validates: Requirements 5.5**

### Property 17: Permission Validation Enforces Access Control

*For any* user and any menu code, when checking permissions, the system should correctly return true only if the user has the required permission type (view or modify) through at least one of their assigned roles.

**Validates: Requirements 6.1, 6.2**

### Property 18: Unauthorized Access Returns 403

*For any* request to a protected endpoint where the authenticated user lacks the required permission, the system should reject the request with a 403 Forbidden status code and not execute the requested operation.

**Validates: Requirements 6.3**

### Property 19: Permission Failures Are Logged

*For any* permission validation failure, the system should create a log entry containing the user ID, menu code, required permission type, and timestamp for security auditing purposes.

**Validates: Requirements 6.5**

### Property 20: Role List Shows Permission Counts

*For any* request to list roles, each role in the response should include an accurate count of how many permissions are configured for that role.

**Validates: Requirements 7.1**

### Property 21: Roles Must Have At Least One Permission

*For any* role save operation (create or update), if the role has zero permissions configured, the system should reject the operation with a validation error.

**Validates: Requirements 7.3**

### Property 22: User Creation Requires All Mandatory Fields

*For any* user creation attempt that is missing username, password, email, full name, or role assignment, the system should reject the operation with a validation error indicating which fields are missing.

**Validates: Requirements 8.2**

### Property 23: Username Cannot Be Changed

*For any* user update operation that attempts to modify the username field, the system should reject the operation or ignore the username change, keeping the original username intact.

**Validates: Requirements 8.3**

### Property 24: User Search Returns Matching Results

*For any* search query on the user list, the results should include only users whose username, email, or full name contains the search term, and all matching users should be included.

**Validates: Requirements 8.5**

### Property 25: Valid Tokens Extend Session Expiration

*For any* authenticated request with a valid non-expired token, the system should extend the session expiration time, effectively implementing a sliding window expiration.

**Validates: Requirements 9.2**

### Property 26: Expired Tokens Are Rejected

*For any* request with an expired JWT token, the system should reject the request with a 401 Unauthorized status and require re-authentication.

**Validates: Requirements 9.3**

### Property 27: Logout Invalidates Session

*For any* user who logs out, any subsequent request using that session's token should be rejected, even if the token hasn't expired yet.

**Validates: Requirements 9.4**

### Property 28: Concurrent Sessions Are Supported

*For any* user, the system should allow multiple valid session tokens to exist simultaneously, and all tokens should work independently without invalidating each other.

**Validates: Requirements 9.5**

### Property 29: Password Change Requires Current Password

*For any* password change request, if the provided current password doesn't match the user's actual current password, the system should reject the change and keep the original password.

**Validates: Requirements 10.2**

### Property 30: Minimum Password Length Is Enforced

*For any* user creation or password change operation with a password shorter than 8 characters, the system should reject the operation with a validation error.

**Validates: Requirements 10.3**

### Property 31: Password Hashes Never Appear in API Responses

*For any* API endpoint that returns user data (list, get, create, update), the response should never include the password_hash field, ensuring password hashes are never exposed.

**Validates: Requirements 10.4**

### Property 32: Password Reset Generates Secure Token

*For any* password reset request, the system should generate a cryptographically secure random token with an expiration time, and the token should be valid for password reset operations until it expires.

**Validates: Requirements 10.5**

## Error Handling

### Authentication Errors

**Invalid Credentials (401 Unauthorized)**
- Username doesn't exist
- Password doesn't match
- User account is deactivated

```typescript
{
  "error": "Invalid credentials",
  "code": "AUTH_INVALID_CREDENTIALS"
}
```

**Expired Token (401 Unauthorized)**
- JWT token has expired
- Token signature is invalid
- Token format is malformed

```typescript
{
  "error": "Token expired or invalid",
  "code": "AUTH_TOKEN_INVALID"
}
```

**Missing Token (401 Unauthorized)**
- No Authorization header provided
- Authorization header doesn't contain Bearer token

```typescript
{
  "error": "No authentication token provided",
  "code": "AUTH_TOKEN_MISSING"
}
```

### Authorization Errors

**Insufficient Permissions (403 Forbidden)**
- User lacks required permission for menu
- User's roles don't grant necessary access

```typescript
{
  "error": "Insufficient permissions",
  "code": "AUTH_INSUFFICIENT_PERMISSIONS",
  "required": {
    "menuCode": "expenses",
    "permissionType": "modify"
  }
}
```

### Validation Errors

**Duplicate Username (400 Bad Request)**
- Username already exists in database

```typescript
{
  "error": "Username already exists",
  "code": "VALIDATION_DUPLICATE_USERNAME",
  "field": "username"
}
```

**Duplicate Email (400 Bad Request)**
- Email already exists in database

```typescript
{
  "error": "Email already exists",
  "code": "VALIDATION_DUPLICATE_EMAIL",
  "field": "email"
}
```

**Invalid Password (400 Bad Request)**
- Password too short (< 8 characters)
- Password doesn't meet strength requirements

```typescript
{
  "error": "Password must be at least 8 characters",
  "code": "VALIDATION_PASSWORD_TOO_SHORT",
  "field": "password"
}
```

**Missing Required Fields (400 Bad Request)**
- Required fields not provided in request

```typescript
{
  "error": "Missing required fields",
  "code": "VALIDATION_MISSING_FIELDS",
  "fields": ["username", "email"]
}
```

**Invalid Menu Code (400 Bad Request)**
- Menu code doesn't exist in valid menu codes list

```typescript
{
  "error": "Invalid menu code",
  "code": "VALIDATION_INVALID_MENU_CODE",
  "field": "menuCode",
  "value": "invalid-menu"
}
```

**Role In Use (400 Bad Request)**
- Attempting to delete role that has users assigned

```typescript
{
  "error": "Cannot delete role with assigned users",
  "code": "VALIDATION_ROLE_IN_USE",
  "roleId": "uuid",
  "userCount": 5
}
```

### Error Logging

All errors should be logged with appropriate context:

```typescript
interface ErrorLog {
  timestamp: Date
  level: 'error' | 'warn' | 'info'
  code: string
  message: string
  userId?: string
  requestId: string
  metadata?: Record<string, any>
}

// Example: Log permission denial
logger.warn({
  timestamp: new Date(),
  level: 'warn',
  code: 'AUTH_INSUFFICIENT_PERMISSIONS',
  message: 'User attempted unauthorized access',
  userId: req.user.id,
  requestId: req.id,
  metadata: {
    menuCode: 'expenses',
    permissionType: 'modify',
    userRoles: req.user.roles.map(r => r.name)
  }
})
```

## Testing Strategy

### Dual Testing Approach

Este sistema requiere tanto pruebas unitarias como pruebas basadas en propiedades para garantizar correctitud completa:

**Unit Tests**: Verifican ejemplos específicos, casos edge, y condiciones de error
- Inicialización del usuario admin por defecto
- Formato de respuestas de error
- Casos específicos de validación
- Integración entre componentes

**Property-Based Tests**: Verifican propiedades universales a través de todos los inputs
- Todas las 32 propiedades de correctitud definidas arriba
- Generación aleatoria de usuarios, roles, permisos
- Validación de invariantes del sistema
- Cobertura exhaustiva de combinaciones

### Property-Based Testing Configuration

**Framework**: fast-check (para TypeScript/JavaScript)

**Configuración mínima**: 100 iteraciones por prueba de propiedad

**Formato de etiquetas**: Cada prueba debe referenciar su propiedad del documento de diseño

```typescript
// Example property test
import fc from 'fast-check'

describe('Feature: user-authentication-and-authorization, Property 11: User Permissions Are Union of All Role Permissions', () => {
  it('should aggregate permissions from all user roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(roleArbitrary(), { minLength: 1, maxLength: 5 }),
        async (roles) => {
          // Create user with multiple roles
          const user = await createUserWithRoles(roles)
          
          // Get effective permissions
          const permissions = await PermissionService.getUserPermissions(user.id)
          
          // Calculate expected union
          const expectedPermissions = new Set()
          for (const role of roles) {
            for (const perm of role.permissions) {
              expectedPermissions.add(`${perm.menuCode}:${perm.permissionType}`)
            }
          }
          
          // Verify union
          expect(permissions.size).toBe(expectedPermissions.size)
          for (const [menuCode, types] of permissions) {
            for (const type of types) {
              expect(expectedPermissions.has(`${menuCode}:${type}`)).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Test Generators (Arbitraries)

```typescript
// User arbitrary
const userArbitrary = () => fc.record({
  username: fc.string({ minLength: 3, maxLength: 20 }),
  password: fc.string({ minLength: 8, maxLength: 50 }),
  email: fc.emailAddress(),
  fullName: fc.string({ minLength: 3, maxLength: 100 }),
  active: fc.boolean()
})

// Role arbitrary
const roleArbitrary = () => fc.record({
  name: fc.string({ minLength: 3, maxLength: 50 }),
  description: fc.string({ minLength: 10, maxLength: 200 }),
  permissions: fc.array(permissionArbitrary(), { minLength: 1, maxLength: 10 })
})

// Permission arbitrary
const permissionArbitrary = () => fc.record({
  menuCode: fc.constantFrom(...Object.values(MENU_CODES)),
  permissionType: fc.constantFrom('view', 'modify')
})

// Invalid credentials arbitrary
const invalidCredentialsArbitrary = () => fc.oneof(
  fc.record({
    username: fc.string(),
    password: fc.constant('wrong-password')
  }),
  fc.record({
    username: fc.constant('non-existent-user'),
    password: fc.string()
  })
)
```

### Unit Test Examples

```typescript
describe('Default Admin User', () => {
  it('should create admin user on first initialization', async () => {
    await AuthService.ensureDefaultAdmin()
    
    const admin = await UserService.findByUsername('admin')
    expect(admin).toBeDefined()
    expect(admin.username).toBe('admin')
    
    const roles = await admin.roles
    expect(roles.some(r => r.name === 'Administrador')).toBe(true)
  })
  
  it('should allow admin to login with default password', async () => {
    const result = await AuthService.login('admin', 'admin')
    expect(result.token).toBeDefined()
    expect(result.user.username).toBe('admin')
  })
})

describe('Error Responses', () => {
  it('should return 401 for invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'invalid', password: 'wrong' })
    
    expect(response.status).toBe(401)
    expect(response.body.code).toBe('AUTH_INVALID_CREDENTIALS')
  })
  
  it('should return 403 for insufficient permissions', async () => {
    const token = await createUserToken({ roles: [] })
    
    const response = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
    
    expect(response.status).toBe(403)
    expect(response.body.code).toBe('AUTH_INSUFFICIENT_PERMISSIONS')
  })
})
```

### Integration Tests

```typescript
describe('Authentication Flow Integration', () => {
  it('should complete full login to protected resource flow', async () => {
    // Create user with permissions
    const user = await UserService.createUser({
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      fullName: 'Test User',
      roleIds: [viewerRoleId]
    })
    
    // Login
    const loginResult = await AuthService.login('testuser', 'password123')
    expect(loginResult.token).toBeDefined()
    
    // Access protected resource
    const response = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${loginResult.token}`)
    
    expect(response.status).toBe(200)
  })
})
```

### Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Property Tests**: All 32 correctness properties implemented
- **Integration Tests**: All critical user flows covered
- **Edge Cases**: Empty inputs, boundary values, concurrent operations
- **Error Conditions**: All error codes have corresponding tests

### Continuous Testing

```typescript
// package.json scripts
{
  "test": "jest",
  "test:unit": "jest --testPathPattern=unit",
  "test:property": "jest --testPathPattern=property",
  "test:integration": "jest --testPathPattern=integration",
  "test:coverage": "jest --coverage",
  "test:watch": "jest --watch"
}
```
