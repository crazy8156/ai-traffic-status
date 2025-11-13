import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { FileSpreadsheet, Loader2, MessageSquare, Send, LogIn, Download, Filter } from "lucide-react";
import { PieChart, Pie, BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { APP_TITLE } from "@/const";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF6B6B", "#4ECDC4", "#45B7D1"];

type ChartType = "pie" | "bar" | "line" | "area";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function Reports() {
  const [selectedFileId, setSelectedFileId] = useState<number | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<number | null>(null);
  const [xAxisColumn, setXAxisColumn] = useState<number>(0);
  const [yAxisColumn, setYAxisColumn] = useState<number>(6);
  const [chartType, setChartType] = useState<ChartType>("pie");
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
  const [sheetInfo, setSheetInfo] = useState<{ sheetName: string; headers: string[]; totalRows: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // 篩選器狀態
  const [filterText, setFilterText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // AI 對話狀態
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data: files, isLoading: filesLoading } = trpc.files.list.useQuery();

  const { data: sheets } = trpc.reports.getSheets.useQuery(
    { fileId: selectedFileId! },
    { enabled: !!selectedFileId }
  );

  const analyzeFileMutation = trpc.reports.analyzeFile.useMutation({
    onSuccess: (data) => {
      setChartData(data.chartData);
      setSheetInfo({
        sheetName: data.sheetName,
        headers: data.headers,
        totalRows: data.totalRows,
      });
      setIsAnalyzing(false);
      toast.success("報表分析完成");
    },
    onError: (error) => {
      toast.error(`分析失敗: ${error.message}`);
      setIsAnalyzing(false);
    },
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

  // 智能欄位預設: 自動識別「達麗報表」格式
  const handleFileSelect = (fileId: string) => {
    const id = Number(fileId);
    setSelectedFileId(id);
    setSelectedSheet(null);
    setChartData([]);
    setSheetInfo(null);
    setMessages([]);
    
    // 智能預設: 達麗報表格式通常是 X軸=類型(第0欄), Y軸=前日帳載(第6欄)
    const selectedFile = files?.find(f => f.id === id);
    if (selectedFile?.fileName.includes("達麗") || selectedFile?.fileName.includes("資金")) {
      setXAxisColumn(0); // 類型
      setYAxisColumn(6); // 前日帳載
      toast.info("已自動設定欄位: X軸=類型, Y軸=前日帳載");
    }
  };

  const handleAnalyze = () => {
    if (!selectedFileId) {
      toast.error("請先選擇檔案");
      return;
    }

    setIsAnalyzing(true);
    analyzeFileMutation.mutate({ 
      fileId: selectedFileId,
      sheetIndex: selectedSheet ?? undefined,
      xAxisColumn,
      yAxisColumn,
    });
  };

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

  // 圖表匯出功能
  const handleExportPNG = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current);
      const link = document.createElement("a");
      link.download = `報表_${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("圖表已匯出為 PNG");
    } catch (error) {
      toast.error("匯出失敗");
    }
  };

  const handleExportPDF = async () => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`報表_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("圖表已匯出為 PDF");
    } catch (error) {
      toast.error("匯出失敗");
    }
  };

  // 篩選後的圖表數據
  const filteredChartData = filterText
    ? chartData.filter(item => 
        item.name.toLowerCase().includes(filterText.toLowerCase())
      )
    : chartData;

  const renderChart = () => {
    if (filteredChartData.length === 0) return null;

    const commonProps = {
      width: 500,
      height: 400,
      data: filteredChartData,
    };

    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={filteredChartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {filteredChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0088FE" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#0088FE" />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="#0088FE" fill="#0088FE" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold">{APP_TITLE}</h1>
          <Button variant="outline" onClick={() => window.location.href = "/login"}>
            <LogIn className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">管理者登入</span>
            <span className="sm:hidden">登入</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* 左側: 報表選擇與視覺化 */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <FileSpreadsheet className="h-5 w-5" />
                      選擇報表檔案
                    </CardTitle>
                    <CardDescription className="text-sm">選擇要分析的 Excel 檔案並生成視覺化圖表</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : files && files.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>選擇檔案</Label>
                        <Select
                          value={selectedFileId?.toString()}
                          onValueChange={handleFileSelect}
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

                      <div className="space-y-2">
                        <Label>圖表類型</Label>
                        <Select
                          value={chartType}
                          onValueChange={(value) => setChartType(value as ChartType)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pie">圓餅圖</SelectItem>
                            <SelectItem value="bar">柱狀圖</SelectItem>
                            <SelectItem value="line">折線圖</SelectItem>
                            <SelectItem value="area">面積圖</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 進階設定: 欄位選擇 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>X 軸欄位索引</Label>
                        <Input
                          type="number"
                          value={xAxisColumn}
                          onChange={(e) => setXAxisColumn(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Y 軸欄位索引</Label>
                        <Input
                          type="number"
                          value={yAxisColumn}
                          onChange={(e) => setYAxisColumn(Number(e.target.value))}
                          min={0}
                        />
                      </div>
                    </div>

                    <Button 
                      onClick={handleAnalyze} 
                      disabled={!selectedFileId || isAnalyzing}
                      className="w-full"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          分析中...
                        </>
                      ) : (
                        "快速分析"
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <FileSpreadsheet className="h-16 w-16 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">尚未上傳任何檔案</p>
                      <p className="text-sm text-muted-foreground mt-2">請聯繫管理員上傳 Excel 檔案</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 圖表顯示區域 */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg md:text-xl">報表視覺化</CardTitle>
                      {sheetInfo && (
                        <CardDescription className="text-sm">
                          工作表: {sheetInfo.sheetName} | 總列數: {sheetInfo.totalRows}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="mr-2 h-4 w-4" />
                        篩選
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPNG}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PNG
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPDF}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                    </div>
                  </div>
                  {showFilters && (
                    <div className="mt-4 space-y-2">
                      <Label>資料篩選 (輸入關鍵字)</Label>
                      <Input
                        placeholder="例如: A、銀行、支出..."
                        value={filterText}
                        onChange={(e) => setFilterText(e.target.value)}
                      />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div ref={chartRef} className="bg-white p-4 rounded-lg">
                    {renderChart()}
                  </div>
                  {filteredChartData.length === 0 && filterText && (
                    <p className="text-center text-muted-foreground mt-4">
                      沒有符合篩選條件的資料
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側: AI 智能分析 */}
          <Card className="flex flex-col h-[calc(100vh-12rem)] lg:h-[calc(100vh-8rem)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <MessageSquare className="h-5 w-5" />
                AI 智能分析
              </CardTitle>
              <CardDescription className="text-sm">詢問關於報表的任何問題</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
              <ScrollArea className="flex-1 pr-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 md:py-12 text-muted-foreground">
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
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.role === "assistant" ? (
                            <Streamdown>{msg.content}</Streamdown>
                          ) : (
                            <p>{msg.content}</p>
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
                  className="resize-none text-sm"
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
      </main>
    </div>
  );
}
