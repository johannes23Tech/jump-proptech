import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Workspace } from "@workspace/contracts";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type Status = "loading" | "anonymous" | "ready" | "error";

type SignUpInput = {
  fullName: string;
  email: string;
  password: string;
  company: string;
};

type AppContextValue = {
  status: Status;
  workspace: Workspace | null;
  pending: boolean;
  startupError: string | null;
  userRole: string | null;
  userTenantId: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (input: SignUpInput) => Promise<string | null>;
  signOut: () => Promise<void>;
  reload: () => Promise<void>;
  run: (
    path: string,
    method?: "GET" | "POST" | "PATCH" | "DELETE",
    body?: unknown,
  ) => Promise<string | null>;
};

const AppContext = createContext<AppContextValue | null>(null);

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [startupError, setStartupError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userTenantId, setUserTenantId] = useState<string | null>(null);

  const applyWorkspace = useCallback((next: Workspace) => {
    setWorkspace(next);
    setStartupError(null);
    setStatus("ready");
    if (next.user.role) setUserRole(next.user.role);
    setUserTenantId(next.user.tenantId ?? null);
  }, []);

  const reload = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await api<Workspace>("/auth/me");
      applyWorkspace(result);
      setUserRole(result.user.role);
      setUserTenantId(result.user.tenantId ?? null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setWorkspace(null);
        setUserRole(null);
        setUserTenantId(null);
        setStatus("anonymous");
        return;
      }
      setStartupError(
        errorMessage(error, "Could not reach the API server. Is it running?"),
      );
      setStatus("error");
    }
  }, [applyWorkspace]);

  useEffect(() => {
    void reload();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setWorkspace(null);
        setUserRole(null);
        setUserTenantId(null);
        setStatus("anonymous");
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void reload();
      }
    });

    return () => {
      sub?.subscription.unsubscribe();
    };
  }, [reload]);

  const run = useCallback<AppContextValue["run"]>(
    async (path, method = "POST", body) => {
      setPending(true);
      try {
        applyWorkspace(await api<Workspace>(path, { method, body }));
        return null;
      } catch (error) {
        return errorMessage(error, "Could not save your changes.");
      } finally {
        setPending(false);
      }
    },
    [applyWorkspace],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      setPending(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data?.session?.access_token) {
          return errorMessage(error, "Could not sign in.");
        }

        applyWorkspace(await api<Workspace>("/auth/me"));
        setUserRole(data.user.user_metadata?.role ?? "landlord");
        setUserTenantId(data.user.user_metadata?.tenant_id ?? null);
        return null;
      } catch (error) {
        return errorMessage(error, "Could not sign in.");
      } finally {
        setPending(false);
      }
    },
    [applyWorkspace],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      setPending(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              full_name: input.fullName,
              company: input.company,
              role: "landlord",
            },
          },
        });

        if (error || !data?.user) {
          return errorMessage(error, "Could not create your account.");
        }

        return null;
      } catch (error) {
        return errorMessage(error, "Could not create your account.");
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign out errors
    }
    setWorkspace(null);
    setUserRole(null);
    setUserTenantId(null);
    setStartupError(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      status,
      workspace,
      pending,
      startupError,
      userRole,
      userTenantId,
      signIn,
      signUp,
      signOut,
      reload,
      run,
    }),
    [status, workspace, pending, startupError, userRole, userTenantId, signIn, signUp, signOut, reload, run],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("App state is unavailable.");
  return context;
}

export function useWorkspace(): { data: Workspace } & AppContextValue {
  const context = useApp();
  if (!context.workspace) throw new Error("Workspace is not loaded yet.");
  return { ...context, data: context.workspace };
}
