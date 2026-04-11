/** Session-safe user representation — never contains credentials */
export interface SafeUser {
  userId?: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

/** Full user with credentials — use only for login/registration payloads */
export default interface User {
  userId?: number;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}
