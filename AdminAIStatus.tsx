import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, AlertCircle, CheckCircle2, Loader2, MessageSquare, Zap } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminAIStatus() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const { data: stats, isLoading: statsLoading } = trpc.ai.getUsageStats.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: errors, isLoading: errorsLoading } = trpc.ai.getErrorLogs.useQuery(undefined, {
    enabled: !!user,
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalStats = stats?.reduce(
    (acc, stat) => ({
      requests: acc.requests + (stat.requestCount || 0),
      tokens: acc.tokens + (stat.totalTokens || 0),
      success: acc.success + (stat.successCount || 0),
      errors: acc.errors + (stat.errorCount || 0),
    }),
    { requests: 0, tokens: 0, success: 0, errors: 0 }
  );

  const successRate = totalStats && totalStats.requests > 0
    ? ((totalStats.success / totalStats.requests) * 100).toFixed(1)
    : "0";

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI 狀態監控</h1>
        <p className="text-muted-foreground mt-2">
          追蹤 ChatGPT API 使用量與系統狀態
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">總請求次數</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalStats?.requests || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token 用量</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (totalStats?.tokens || 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功率</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${successRate}%`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">錯誤次數</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalStats?.errors || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API 使用統計</CardTitle>
          <CardDescription>各端點的詳細使用情況</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stats && stats.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>端點</TableHead>
                    <TableHead>請求次數</TableHead>
                    <TableHead>總 Tokens</TableHead>
                    <TableHead>成功</TableHead>
                    <TableHead>失敗</TableHead>
                    <TableHead>最後使用</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.map((stat) => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.endpoint}</TableCell>
                      <TableCell>{stat.requestCount}</TableCell>
                      <TableCell>{(stat.totalTokens || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-green-600">{stat.successCount}</TableCell>
                      <TableCell className="text-red-600">{stat.errorCount}</TableCell>
                      <TableCell>{formatDate(stat.lastUsedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>尚無 API 使用記錄</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>錯誤日誌</CardTitle>
          <CardDescription>最近的 API 錯誤記錄</CardDescription>
        </CardHeader>
        <CardContent>
          {errorsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : errors && errors.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>時間</TableHead>
                    <TableHead>端點</TableHead>
                    <TableHead>錯誤代碼</TableHead>
                    <TableHead>錯誤訊息</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.slice(0, 20).map((error) => (
                    <TableRow key={error.id}>
                      <TableCell>{formatDate(error.createdAt)}</TableCell>
                      <TableCell className="font-medium">{error.endpoint}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          {error.errorCode || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-md truncate">{error.errorMessage}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="mx-auto h-12 w-12 mb-4 opacity-50 text-green-500" />
              <p>沒有錯誤記錄 - 系統運作正常</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
