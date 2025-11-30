// /lib/auth.ts
"use client"

// Interface defining the expected structure of a user object from the API
export interface AuthUser {
  availabilityStatus: string;
  availability_status: boolean;
  driver_id: any;
  id: number; // keep if needed (maybe same as stud_id in DB?)
  stud_id?: number; // <-- added
  role: "student" | "driver" | "admin";
  name?: string;
  surname?: string;
  email?: string;
  studentNo?: string; // optional if you’re moving away
  license?: string;
  contact_details?: string;
  res_address?: string;
}

const USER_STORAGE_KEY = "unilift_user"

export class AuthService {
  /**
   * Saves the authenticated user to local storage.
   * This is called after a successful login API response.
   * @param user The user object to save.
   */
  public static saveUser(user: AuthUser): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    }
  }

  /**
   * Retrieves the current authenticated user from local storage.
   * Used by protected pages to check if a user is logged in.
   * @returns The user object or null if no user is found.
   */
  public static getCurrentUser(): AuthUser | null {
    if (typeof window === "undefined") {
      return null
    }
    const user = localStorage.getItem(USER_STORAGE_KEY)
    return user ? JSON.parse(user) : null
  }

  /**
   * Logs out the user by removing their data from local storage.
   * This should be called when the user clicks "Sign Out".
   */
  public static logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  }

  /**
   * A helper method to check if a user is currently logged in.
   * @returns boolean
   */
  public static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null
  }
}