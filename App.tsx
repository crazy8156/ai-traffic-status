import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Login from "./pages/Login";

import DashboardLayout from "./components/DashboardLayout";
import AdminFiles from "./pages/AdminFiles";
import AdminAIStatus from "./pages/AdminAIStatus";
import AdminChat from "./pages/AdminChat";
import Reports from "./pages/Reports";

function Router() {
  return (
    <Switch>
      {/* 登入頁面 */}
      <Route path={"/login"} component={Login} />
      
      {/* 前台 - 單一報表視覺化功能 (公開) */}
      <Route path={"/"} component={Reports} />
      
      {/* 後台管理路由 */}
      <Route path={"/admin/files"}>
        <DashboardLayout>
          <AdminFiles />
        </DashboardLayout>
      </Route>
      <Route path={"/admin/ai-status"}>
        <DashboardLayout>
          <AdminAIStatus />
        </DashboardLayout>
      </Route>
      <Route path={"/admin/chat"}>
        <DashboardLayout>
          <AdminChat />
        </DashboardLayout>
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
