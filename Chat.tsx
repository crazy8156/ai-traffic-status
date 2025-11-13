import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileSpreadsheet, Loader2, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: files, isLoading: filesLoading } = trpc.files.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: history } = trpc.chat.getHistory.useQuery(
    { fileId: selectedFileId ? parseInt(selectedFileId) : undefined },
    { enabled: !!user && !!selectedFileId }
  );

  const chatMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      setIsLoading(false);
      scrollToBottom();
    },
    onError: (error) => {
      toast.error(`AI 回應失敗: ${error.message}`);
      setIsLoading(false);
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (history && history.length > 0) {
      const formattedHistory = history.reverse().map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
      setMessages(formattedHistory);
    }
  }, [history]);

  useEffect(() => {
    if (files && files.length > 0 && !selectedFileId) {
      setSelectedFileId(files[0].id.toString());
    }
  }, [files, selectedFileId]);

  const handleSend = () => {
    if (!input.trim()) return;
    if (!selectedFileId) {
      toast.error("請先選擇檔案");
      return;
    }

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    chatMutation.mutate({
      fileId: parseInt(selectedFileId),
      message: input,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const completedFiles = files?.filter((f) => f.status === "completed") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">AI 智能分析對話</h1>
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            返回首頁
          </Button>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>選擇報表</CardTitle>
              <CardDescription>選擇要分析的檔案</CardDescription>
            </CardHeader>
            <CardContent>
              {filesLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : completedFiles.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  <FileSpreadsheet className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>尚未上傳檔案</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.location.href = "/admin/files"}
                  >
                    前往上傳
                  </Button>
                </div>
              ) : (
                <Select value={selectedFileId} onValueChange={setSelectedFileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇檔案" />
                  </SelectTrigger>
                  <SelectContent>
                    {completedFiles.map((file) => (
                      <SelectItem key={file.id} value={file.id.toString()}>
                        {file.fileName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card className="flex flex-col h-[calc(100vh-12rem)]">
            <CardHeader>
              <CardTitle>對話視窗</CardTitle>
              <CardDescription>
                與 AI 對話分析您的財務報表
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>開始與 AI 對話,分析您的財務報表</p>
                    <p className="text-sm mt-2">
                      例如:「這份報表的主要支出項目是什麼?」
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <Streamdown>{msg.content}</Streamdown>
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="輸入訊息... (Enter 發送, Shift+Enter 換行)"
                  className="resize-none"
                  rows={3}
                  disabled={isLoading || !selectedFileId}
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim() || !selectedFileId}
                  size="icon"
                  className="h-full aspect-square"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
