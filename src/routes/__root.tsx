import { Outlet, Link, createRootRoute, HeadContent, Scripts, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/store/auth-context";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Auth guard — redirects to /register or /login based on auth state */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isRegistered, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Navigation guard — all hooks MUST come before any early returns
  useEffect(() => {
    if (isLoading) return;
    const path = window.location.pathname;
    if (!isRegistered && path !== "/register") {
      navigate({ to: "/register" });
    } else if (isRegistered && !isAuthenticated && path !== "/login" && path !== "/register") {
      navigate({ to: "/login" });
    } else if (isAuthenticated && (path === "/login" || path === "/register")) {
      navigate({ to: "/" });
    }
  }, [isRegistered, isAuthenticated, isLoading, navigate]);

  // Global error handler — MUST be before the early return for isLoading
  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      console.error("[global] Unhandled rejection:", e.reason);
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  // Early return is AFTER all hooks — this is the correct pattern
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin" />
          <p className="text-[13px] text-stone">Loading vault…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Vaultly — Secure Password Vault" },
      { name: "description", content: "A warm, calm password manager for passwords, notes, cards, and 2FA codes." },
      { name: "author", content: "Vaultly" },
      { property: "og:title", content: "Vaultly — Secure Password Vault" },
      { property: "og:description", content: "A warm, calm password manager for passwords, notes, cards, and 2FA codes." },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Outlet />
      </AuthGuard>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: "var(--font-sans, sans-serif)",
            fontSize: "13px",
          },
        }}
      />
    </AuthProvider>
  );
}
