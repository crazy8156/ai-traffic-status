import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileSpreadsheet, MessageSquare, TrendingUp } from "lucide-react";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: FileSpreadsheet,
      title: "Excel 檔案管理",
      description: "輕鬆上傳、管理您的財務報表 Excel 檔案",
      action: () => setLocation("/admin/files"),
      color: "text-green-600",
    },
    {
      icon: BarChart3,
      title: "資料視覺化",
      description: "將財務數據轉換為直觀的圖表與報表",
      action: () => setLocation("/reports"),
      color: "text-blue-600",
    },
    {
      icon: MessageSquare,
      title: "AI 智能分析",
      description: "使用 ChatGPT 進行即時對話與報表分析",
      action: () => setLocation("/chat"),
      color: "text-purple-600",
    },
    {
      icon: TrendingUp,
      title: "AI 狀態監控",
      description: "追蹤 API 使用量與系統運作狀態",
      action: () => setLocation("/admin/ai-status"),
      color: "text-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-8 rounded-md" />
            <h1 className="text-xl font-bold tracking-tight">{APP_TITLE}</h1>
          </div>
          {isAuthenticated ? (
            <Button onClick={() => setLocation("/admin/files")}>
              進入後台
            </Button>
          ) : (
            <Button onClick={() => window.location.href = getLoginUrl()}>
              登入
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            智能財務報表分析平台
          </h2>
          <p className="text-xl text-muted-foreground">
            結合 Excel 管理、資料視覺化與 AI 智能分析，讓財務數據分析更簡單、更智能
          </p>
          {!isAuthenticated && (
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="mt-4"
            >
              立即開始
            </Button>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
              onClick={isAuthenticated ? feature.action : undefined}
            >
              <CardHeader>
                <div className={`mb-2 ${feature.color}`}>
                  <feature.icon className="h-10 w-10" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {isAuthenticated ? (
                  <Button variant="outline" className="w-full" onClick={feature.action}>
                    前往使用
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.location.href = getLoginUrl()}
                  >
                    登入使用
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 {APP_TITLE}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
