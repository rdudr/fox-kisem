import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Pre-defined users — add more here as needed
// Passwords are stored as plain text for offline use (no server)
const OFFLINE_USERS: Record<string, { displayName: string; password: string }> = {
  "IIGN1": { displayName: "Admin",    password: "IIGN1"  },
  "IIGN2": { displayName: "User 2",   password: "IIGN2"  },
  "IIGN3": { displayName: "User 3",   password: "IIGN3"  },
  "IIGN4": { displayName: "User 4",   password: "IIGN4"  },
  "IIGN5": { displayName: "Faizan",   password: "IIGN5"  },
};

type AuthState = {
  userId: string | null;
  displayName: string | null;
  loggedInAt: number | null;

  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      userId: null,
      displayName: null,
      loggedInAt: null,

      login: (username, password) => {
        const user = OFFLINE_USERS[username.trim().toUpperCase()];
        if (!user || user.password !== password.trim()) return false;
        set({ userId: username, displayName: user.displayName, loggedInAt: Date.now() });
        return true;
      },

      logout: () => set({ userId: null, displayName: null, loggedInAt: null }),

      isAuthenticated: () => {
        const { userId, loggedInAt } = get();
        if (!userId || !loggedInAt) return false;
        // 8-hour session expiry
        const eightHours = 8 * 60 * 60 * 1000;
        return Date.now() - loggedInAt < eightHours;
      },
    }),
    {
      name: "fox-kisen-auth",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
