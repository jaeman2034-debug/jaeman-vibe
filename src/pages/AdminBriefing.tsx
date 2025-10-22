import { useEffect, useState, useRef } from "react";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Play, Pause, Volume2, Clock, Calendar, Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

interface BriefingReport {
  id: string;
  title: string;
  audioUrl: string;
  pdfUrl: string;
  date: string;
  summary?: string;
  totalCount?: number;
  totalValue?: number;
  topArea?: string;
  duration?: number;
}

export default function AdminBriefing() {
  const [reports, setReports] = useState<BriefingReport[]>([]);
  const [current, setCurrent] = useState<BriefingReport | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ?�� Firestore?�서 최신 리포??10�??�시�?구독
  useEffect(() => {
    const q = query(
      collection(db, "ai_voice_reports"), 
      orderBy("createdAt", "desc"), 
      limit(10)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const list: BriefingReport[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          title: data.summary?.slice(0, 50) + "..." || "AI ?�성 리포??,
          audioUrl: data.audioUrl || "",
          pdfUrl: data.pdfUrl || "",
          date: data.reportDate || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          summary: data.ttsSummary || "",
          totalCount: data.stats?.totalCount || 0,
          totalValue: data.stats?.totalValue || 0,
          topArea: data.stats?.topArea || "?�보 ?�음",
          duration: data.duration || 0
        });
      });
      setReports(list);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore 구독 ?�류:", error);
      setIsLoading(false);
    });
    
    return () => unsub();
  }, []);

  // ?�� ?�디???�벤???�들??  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (autoPlayNext) {
        playNextReport();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [autoPlayNext]);

  const togglePlay = (report: BriefingReport) => {
    if (!audioRef.current) return;
    
    if (current?.id === report.id && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setCurrent(report);
      audioRef.current.src = report.audioUrl;
      audioRef.current.load();
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((error) => {
        console.error("?�성 ?�생 ?�패:", error);
        alert("?�성 ?�일???�생?????�습?�다. ?�일 URL???�인?�주?�요.");
      });
    }
  };

  const playNextReport = () => {
    if (!current) return;
    const currentIndex = reports.findIndex(r => r.id === current.id);
    const nextReport = reports[currentIndex + 1];
    if (nextReport) {
      togglePlay(nextReport);
    }
  };

  const playPreviousReport = () => {
    if (!current) return;
    const currentIndex = reports.findIndex(r => r.id === current.id);
    const prevReport = reports[currentIndex - 1];
    if (prevReport) {
      togglePlay(prevReport);
    }
  };

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* ?�더 */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
            ?�� ?�고 브리??          </h1>
          <p className="text-lg text-gray-600">
            AI ?�성 리포???�시�????�레?�어
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <Badge className="bg-green-100 text-green-800">
              ?�� ?�시�??�데?�트
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              ?�� 고품�?TTS
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              ?�� AI 분석
            </Badge>
          </div>
        </motion.div>
      </div>

      {/* 리포??목록 */}
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">?�성 리포?��? 불러?�는 �?..</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <Volume2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">?�직 ?�성???�성 리포?��? ?�습?�다.</p>
            <p className="text-sm text-gray-400">매일 00:00???�동?�로 ?�성?�니??</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {reports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  <Card 
                    className={`h-full transition-all duration-300 hover:shadow-xl ${
                      current?.id === report.id 
                        ? 'ring-2 ring-blue-500 shadow-xl' 
                        : 'hover:shadow-lg'
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-sm font-semibold text-gray-800 line-clamp-2">
                            {report.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {format(new Date(report.date), "MM-dd HH:mm")}
                            </span>
                          </div>
                        </div>
                        {current?.id === report.id && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"
                          />
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* ?�계 ?�보 */}
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-semibold text-blue-800">{report.totalCount}�?/div>
                          <div className="text-blue-600">거래</div>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <div className="font-semibold text-green-800">
                            {(report.totalValue / 10000).toFixed(0)}만원
                          </div>
                          <div className="text-green-600">거래??/div>
                        </div>
                      </div>

                      {/* 컨트�?버튼 */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => togglePlay(report)}
                          className={`flex-1 ${
                            current?.id === report.id && isPlaying
                              ? 'bg-red-500 hover:bg-red-600'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {current?.id === report.id && isPlaying ? (
                            <>
                              <Pause size={16} className="mr-1" />
                              ?��?
                            </>
                          ) : (
                            <>
                              <Play size={16} className="mr-1" />
                              ?�생
                            </>
                          )}
                        </Button>
                        
                        {report.pdfUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(report.pdfUrl, '_blank')}
                            className="px-3"
                          >
                            <FileText size={16} />
                          </Button>
                        )}
                      </div>

                      {/* 지???�보 */}
                      <div className="mt-3 text-xs text-gray-500">
                        ?�� 주요 지?? {report.topArea}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 고정 ?�레?�어 */}
      <AnimatePresence>
        {current && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-blue-900 text-white shadow-2xl"
          >
            <div className="max-w-7xl mx-auto p-4">
              <div className="flex items-center gap-4">
                {/* ?�전/?�음 버튼 */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={playPreviousReport}
                    className="text-white hover:bg-white/20"
                  >
                    ??��
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={playNextReport}
                    className="text-white hover:bg-white/20"
                  >
                    ??��
                  </Button>
                </div>

                {/* ?�생/?��? 버튼 */}
                <Button
                  size="lg"
                  onClick={() => togglePlay(current)}
                  className={`${
                    isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white shadow-lg`}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </Button>

                {/* ?�보 */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">
                    {current.title}
                  </h3>
                  <p className="text-sm text-gray-300 truncate">
                    {format(new Date(current.date), "yyyy??MM??dd??)} ??
                    {current.totalCount}�???{(current.totalValue / 10000).toFixed(0)}만원
                  </p>
                </div>

                {/* ?�동 ?�생 ?��? */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-300">?�동 ?�생</label>
                  <Button
                    size="sm"
                    variant={autoPlayNext ? "default" : "outline"}
                    onClick={() => setAutoPlayNext(!autoPlayNext)}
                    className="text-white"
                  >
                    {autoPlayNext ? "ON" : "OFF"}
                  </Button>
                </div>
              </div>

              {/* 진행�?*/}
              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm text-gray-300 min-w-[40px]">
                  {formatTime(currentTime)}
                </span>
                <div 
                  className="flex-1 bg-gray-700 rounded-full h-2 cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const percentage = clickX / rect.width;
                    seekTo(percentage * duration);
                  }}
                >
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm text-gray-300 min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ?�디???�리먼트 */}
      <audio 
        ref={audioRef} 
        preload="metadata"
        onError={(e) => {
          console.error("?�디??로드 ?�류:", e);
          alert("?�성 ?�일??불러?????�습?�다.");
        }}
      />

      {/* ?�시�??�데?�트 ?�시 */}
      <div className="fixed top-4 right-4">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">?�� ?�시�?브리??/span>
        </motion.div>
      </div>
    </div>
  );
}
