// Authentication utilities and functions

// User roles
export type UserRole = "user" | "admin" | "lab_manager"

// User interface
export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
}

export interface Permission {
  admin: boolean
  lab_manager: boolean
  user: boolean
}

// Mock function to check if a user exists (replace with real implementation)
export async function checkUserExists(email: string): Promise<User | null> {
  // This is a placeholder - replace with your actual authentication logic
  if (email === "admin@admin.com") {
    return {
      id: "admin-123",
      name: "Admin User",
      email: "admin@admin.com",
      role: "admin",
      department: "System Administration",
    }
  }

  return null
}

// Mock function to check if a user has a specific permission
export function hasPermission(user: User, permission: keyof Permission): boolean {
  // This is a placeholder - replace with your actual permission logic
  if (user.role === "admin") return true // Admins have all permissions

  // Define a mapping of roles to permissions
  const rolePermissions: { [key in UserRole]: (keyof Permission)[] } = {
    user: ["user"],
    admin: ["admin", "user", "lab_manager"],
    lab_manager: ["lab_manager", "user"],
  }

  return rolePermissions[user.role].includes(permission)
}

