import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, MessageSquare, Send, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AdminChat() {
  const { user, loading } = useAuth();
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  const { data: files, isLoading: filesLoading } = trpc.files.list.useQuery(undefined, {
    enabled: !!user,
  });

  const chatMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      setIsSending(false);
    },
    onError: (error) => {
      toast.error(`AI 回應失敗: ${error.message}`);
      setIsSending(false);
    },
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    if (!selectedFileId) {
      toast.error("請先選擇檔案");
      return;
    }

    const userMessage = inputMessage.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInputMessage("");
    setIsSending(true);

    chatMutation.mutate({
      message: userMessage,
      fileId: selectedFileId,
    });
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI 問題對話</h1>
        <p className="text-muted-foreground mt-2">
          選擇報表檔案並向 AI 提問分析問題
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 檔案選擇 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>選擇檔案</CardTitle>
            <CardDescription>選擇要分析的 Excel 檔案</CardDescription>
          </CardHeader>
          <CardContent>
            {filesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : files && files.length > 0 ? (
              <div className="space-y-2">
                <Label>選擇檔案</Label>
                <Select
                  value={selectedFileId?.toString()}
                  onValueChange={(value) => {
                    setSelectedFileId(Number(value));
                    setMessages([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="請選擇檔案" />
                  </SelectTrigger>
                  <SelectContent>
                    {files.map((file) => (
                      <SelectItem key={file.id} value={file.id.toString()}>
                        {file.fileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">尚未上傳任何檔案</p>
                  <p className="text-sm text-muted-foreground mt-2">請先上傳 Excel 檔案</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右側: 對話區域 */}
        <Card className="lg:col-span-2 flex flex-col h-[calc(100vh-16rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI 智能分析對話
            </CardTitle>
            <CardDescription>
              詢問關於報表的任何問題
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
            <ScrollArea className="flex-1 pr-4">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">選擇檔案後,可以開始提問</p>
                  <p className="text-xs mt-2">例如:「這份報表的主要支出項目是什麼?」</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Streamdown>{msg.content}</Streamdown>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="輸入您的問題..."
                className="resize-none"
                rows={2}
                disabled={!selectedFileId || isSending}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!selectedFileId || !inputMessage.trim() || isSending}
                size="icon"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
