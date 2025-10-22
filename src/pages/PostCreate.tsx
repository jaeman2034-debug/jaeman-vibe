import { useState } from "react";
import { storage, db } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface PostCreateProps {
  teamId: string;
  onPostCreated?: () => void;
}

export default function PostCreate({ teamId, onPostCreated }: PostCreateProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [fileAttachments, setFileAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isThumbnailDragging, setIsThumbnailDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateAndSetThumbnail = (file: File) => {
    // ?´ë?ì§€ ?Œì¼ë§??ˆìš©
    if (!file.type.startsWith('image/')) {
      alert(`${file.name}?€(?? ?´ë?ì§€ ?Œì¼???„ë‹™?ˆë‹¤.`);
      return;
    }
    
    // ?Œì¼ ?¬ê¸° ê²€ì¦?(10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name}?€(?? ?Œì¼ ?¬ê¸°ê°€ ?ˆë¬´ ?½ë‹ˆ?? (ìµœë? 10MB)`);
      return;
    }
    
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const validateAndSetFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const validPreviews: string[] = [];
    
    for (const file of files) {
      // ?Œì¼ ?€??ê²€ì¦?(?´ë?ì§€ ?ëŠ” ?™ì˜??
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert(`${file.name}?€(?? ?´ë?ì§€ ?ëŠ” ?™ì˜???Œì¼???„ë‹™?ˆë‹¤.`);
        continue;
      }
      
      // ?Œì¼ ?¬ê¸° ê²€ì¦?(?´ë?ì§€: 10MB, ?™ì˜?? 50MB)
      const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = isImage ? '10MB' : '50MB';
        alert(`${file.name}?€(?? ${maxSizeMB}ë¥?ì´ˆê³¼?©ë‹ˆ??`);
        continue;
      }
      
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }
    
    if (validFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...validPreviews]);
    }
  };

  const validateAndSetFileAttachments = (files: File[]) => {
    const validFiles: File[] = [];
    
    for (const file of files) {
      // ?Œì¼ ?¬ê¸° ê²€ì¦?(ë¬¸ì„œ: 20MB)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`${file.name}?€(?? 20MBë¥?ì´ˆê³¼?©ë‹ˆ??`);
        continue;
      }
      
      validFiles.push(file);
    }
    
    if (validFiles.length > 0) {
      setFileAttachments(prev => [...prev, ...validFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      validateAndSetFiles(files);
    }
  };

  const handleFileAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      validateAndSetFileAttachments(files);
    }
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return '?“„';
      case 'doc':
      case 'docx': return '?“';
      case 'xls':
      case 'xlsx': return '?“Š';
      case 'ppt':
      case 'pptx': return '?“‹';
      case 'txt': return '?“ƒ';
      case 'zip':
      case 'rar': return '?—œï¸?;
      default: return '?“';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      validateAndSetFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async () => {
    if (!title) return alert("?œëª©???…ë ¥?˜ì„¸??");

    setIsUploading(true);
    try {
      let thumbnailUrl = "";
      const mediaUrls: { url: string; type: string }[] = [];
      const fileUrls: { url: string; name: string }[] = [];

      // ?¸ë„¤???´ë?ì§€ ?…ë¡œ??      if (thumbnailFile) {
        console.log("?“¸ ?¸ë„¤???´ë?ì§€ ?…ë¡œ???œì‘:", thumbnailFile.name);
        const thumbnailRef = ref(storage, `teams/${teamId}/posts/thumbnails/${Date.now()}_${thumbnailFile.name}`);
        await uploadBytes(thumbnailRef, thumbnailFile);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
        console.log("???¸ë„¤???´ë?ì§€ ?…ë¡œ???„ë£Œ:", thumbnailUrl);
      }

      // ë¯¸ë””???Œì¼ ?…ë¡œ??(?´ë?ì§€ + ?™ì˜??
      for (const file of mediaFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const type = file.type.startsWith('video/') ? "video" : "image";

        const storageRef = ref(storage, `teams/${teamId}/posts/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        mediaUrls.push({ url, type });
      }

      // ì²¨ë? ?Œì¼ ?…ë¡œ??(ë¬¸ì„œ, PDF ??
      for (const file of fileAttachments) {
        const storageRef = ref(storage, `teams/${teamId}/posts/files/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        fileUrls.push({ url, name: file.name });
      }

      await addDoc(collection(db, "teams", teamId, "posts"), {
        title,
        content,
        thumbnailUrl,
        mediaUrls,
        fileUrls,
        createdAt: serverTimestamp(),
      });

      // ??ì´ˆê¸°??      setTitle("");
      setContent("");
      setThumbnailFile(null);
      setThumbnailPreview("");
      setMediaFiles([]);
      setFileAttachments([]);
      setPreviews([]);

      alert("ê²Œì‹œê¸€???±ë¡?˜ì—ˆ?µë‹ˆ??");
      onPostCreated?.();
    } catch (error) {
      console.error("ê²Œì‹œê¸€ ?±ë¡ ?¤íŒ¨:", error);
      alert("ê²Œì‹œê¸€ ?±ë¡???¤íŒ¨?ˆìŠµ?ˆë‹¤. ?¤ì‹œ ?œë„?´ì£¼?¸ìš”.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        ?“ ??ê²Œì‹œê¸€ ?‘ì„±
      </h2>

      <div className="space-y-4">
        {/* ?œëª© ?…ë ¥ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?œëª© *
          </label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ê²Œì‹œê¸€ ?œëª©???…ë ¥?˜ì„¸??
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* ?´ìš© ?…ë ¥ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?´ìš©
          </label>
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
            placeholder="ê²Œì‹œê¸€ ?´ìš©???…ë ¥?˜ì„¸??
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* ?¸ë„¤???´ë?ì§€ ?…ë¡œ??*/}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?€???´ë?ì§€ (?¸ë„¤??
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
              isThumbnailDragging 
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsThumbnailDragging(true);
            }}
            onDragLeave={() => setIsThumbnailDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsThumbnailDragging(false);
              if (e.dataTransfer.files.length > 0) {
                validateAndSetThumbnail(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => document.getElementById('thumbnail-upload')?.click()}
          >
            {thumbnailPreview ? (
              <div className="space-y-3">
                <img
                  src={thumbnailPreview}
                  alt="?¸ë„¤??ë¯¸ë¦¬ë³´ê¸°"
                  className="w-full h-48 object-cover rounded-lg border-2 border-white dark:border-gray-700 shadow-md mx-auto"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {thumbnailFile?.name} ({(thumbnailFile?.size! / 1024 / 1024).toFixed(2)}MB)
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setThumbnailFile(null);
                    setThumbnailPreview("");
                  }}
                  className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                >
                  ?œê±°
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl text-gray-400">?“¸</div>
                <p className="text-gray-600 dark:text-gray-400">
                  ?€???´ë?ì§€ë¥??œë˜ê·????œë¡­?˜ê±°???´ë¦­?˜ì—¬ ? íƒ?˜ì„¸??                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  ?´ë?ì§€ ?Œì¼ë§??…ë¡œ??ê°€??(ìµœë? 10MB)
                </p>
              </div>
            )}
          </div>
          <input
            id="thumbnail-upload"
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                validateAndSetThumbnail(e.target.files[0]);
              }
            }}
            className="hidden"
          />
        </div>

            {/* ë¯¸ë””???Œì¼ ?œë˜ê·????œë¡­ (?´ë?ì§€ + ?™ì˜?? */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ë¯¸ë””??ì²¨ë? ({previews.length}ê°? - ?´ë?ì§€/?™ì˜??              </label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
              isDragging 
                ? "border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-400" 
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('post-image-upload')?.click()}
          >
                {previews.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {previews.map((src, idx) => (
                        <div key={idx} className="relative group">
                          {mediaFiles[idx].type.startsWith('video/') ? (
                            <video
                              src={src}
                              className="w-full h-24 object-cover rounded-lg border-2 border-white dark:border-gray-700 shadow-md"
                              controls
                            />
                          ) : (
                            <img
                              src={src}
                              alt={`ë¯¸ë¦¬ë³´ê¸° ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-white dark:border-gray-700 shadow-md"
                            />
                          )}
                          <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {mediaFiles[idx].type.startsWith('video/') ? '?¬' : '?“·'}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMediaFiles(prev => prev.filter((_, i) => i !== idx));
                              setPreviews(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ??                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {mediaFiles.length}ê°œì˜ ë¯¸ë””?´ê? ? íƒ?˜ì—ˆ?µë‹ˆ??                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMediaFiles([]);
                          setPreviews([]);
                        }}
                        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ??ëª¨ë‘ ?œê±°
                      </button>
                    </div>
                  </div>
            ) : (
              <div className="space-y-3">
                <div className="text-3xl text-gray-400 dark:text-gray-500">
                  ?¬?“·
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    ?¬ê¸°ë¡??´ë?ì§€ ?ëŠ” ?™ì˜?ì„ ?œë˜ê·????œë¡­?˜ì„¸??                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ?ëŠ” ?´ë¦­?˜ì—¬ ?Œì¼ ? íƒ (?´ë?ì§€: 10MB, ?™ì˜?? 50MB ?´í•˜)
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="post-image-upload"
                />
                <label
                  htmlFor="post-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg cursor-pointer transition-colors"
                >
                  ?¬?“· ë¯¸ë””??? íƒ
                </label>
              </div>
            )}
          </div>
        </div>

        {/* ?Œì¼ ì²¨ë? ?¹ì…˜ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?“ ?Œì¼ ì²¨ë? ({fileAttachments.length}ê°? - ë¬¸ì„œ, PDF, ?‘ì? ??          </label>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
            <input
              type="file"
              multiple
              onChange={handleFileAttachmentChange}
              className="hidden"
              id="file-attachment-upload"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
            />
            <label
              htmlFor="file-attachment-upload"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg cursor-pointer transition-colors"
            >
              ?“ ?Œì¼ ? íƒ
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              PDF, DOC, XLS, PPT, TXT, ZIP ??(20MB ?´í•˜)
            </p>
          </div>

          {/* ì²¨ë????Œì¼ ëª©ë¡ */}
          {fileAttachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ì²¨ë????Œì¼:
              </h4>
              <div className="space-y-1">
                {fileAttachments.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {getFileIcon(file.name)}
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({(file.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setFileAttachments(prev => prev.filter((_, i) => i !== idx));
                      }}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      ??                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setFileAttachments([])}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                ??ëª¨ë“  ?Œì¼ ?œê±°
              </button>
            </div>
          )}
        </div>

        {/* ?±ë¡ ë²„íŠ¼ */}
        <button
          onClick={handleSubmit}
          disabled={isUploading || !title}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
        >
          {isUploading ? "ê²Œì‹œê¸€ ?±ë¡ ì¤?.." : "?“ ê²Œì‹œê¸€ ?±ë¡"}
        </button>
      </div>
    </div>
  );
}
