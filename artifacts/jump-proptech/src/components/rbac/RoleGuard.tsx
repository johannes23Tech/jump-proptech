import { useState, useEffect } from "react";
import { useWorkspace } from "@/state/app";
import { ShieldAlert } from "lucide-react";

type RoleGuardProps = {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const { userRole, status } = useWorkspace();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "loading") {
    return <div className="h-64 flex items-center justify-center text-[#77746a]">Loading…</div>;
  }

  if (status === "anonymous") {
    return fallback ?? (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
        <ShieldAlert size={48} className="mb-4 text-[#a54c42]" />
        <h2 className="font-display text-[20px] font-bold text-[#252821]">Sign in required</h2>
        <p className="mt-2 text-[#77746a]">Please sign in to access this page.</p>
      </div>
    );
  }

  if (!allowedRoles.includes(userRole ?? "")) {
    return fallback ?? (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
        <ShieldAlert size={48} className="mb-4 text-[#b79850]" />
        <h2 className="font-display text-[20px] font-bold text-[#252821]">Access denied</h2>
        <p className="mt-2 text-[#77746a]">
          You don&rsquo;t have permission to view this page. Your role:{" "}
          <span className="font-semibold">{userRole}</span>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}