/**
 * PermissionGuard — wraps a route and blocks access when the user
 * lacks the required permission for a module.
 *
 * Admins bypass all guards.
 * Non-permitted access redirects to "/" and shows a toast.
 *
 * Usage (in router):
 *   <PermissionGuard module="finance" action="view">
 *     <FinancePage />
 *   </PermissionGuard>
 */

import React, { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions, PermAction } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PermissionGuardProps {
  module: string;
  action?: PermAction;
  children: React.ReactNode;
}

export function PermissionGuard({
  module,
  action = "view",
  children,
}: PermissionGuardProps) {
  const { loading, can, isAdmin } = usePermissions();
  const toastFired = useRef(false);

  const allowed = isAdmin || can(module, action);

  useEffect(() => {
    if (!loading && !allowed && !toastFired.current) {
      toastFired.current = true;
      toast({
        title: "אין גישה",
        description: "אין לך הרשאה לצפות בעמוד זה.",
        variant: "destructive",
      });
    }
  }, [loading, allowed]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
