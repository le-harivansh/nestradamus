/**
 * This interface should be implemented by any entity that can be logged-in to
 * the application.
 */
export interface Authenticatable {
  username: string;
  password: string;
}
