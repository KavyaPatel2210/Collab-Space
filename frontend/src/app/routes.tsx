import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/landing-page";
import { LoginPage } from "./pages/login-page";
import { DashboardPage } from "./pages/dashboard-page";
import { EditorPage } from "./pages/editor-page";
import { TeamsPage } from "./pages/teams-page";
import { TeamWorkspacePage } from "./pages/team-workspace-page";
import { RootLayout } from "./components/layout/root-layout";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        index: true,
        Component: LandingPage,
      },
      {
        path: "login",
        Component: LoginPage,
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
          <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "editor/:id",
        element: (
          <ProtectedRoute>
          <EditorPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "teams",
        element: (
          <ProtectedRoute>
          <TeamsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "teams/:id",
        element: (
          <ProtectedRoute>
          <TeamWorkspacePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
