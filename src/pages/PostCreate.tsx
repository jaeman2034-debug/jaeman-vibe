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
    // ?��?지 ?�일�??�용
    if (!file.type.startsWith('image/')) {
      alert(`${file.name}?�(?? ?��?지 ?�일???�닙?�다.`);
      return;
    }
    
    // ?�일 ?�기 검�?(10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert(`${file.name}?�(?? ?�일 ?�기가 ?�무 ?�니?? (최�? 10MB)`);
      return;
    }
    
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const validateAndSetFiles = (files: File[]) => {
    const validFiles: File[] = [];
    const validPreviews: string[] = [];
    
    for (const file of files) {
      // ?�일 ?�??검�?(?��?지 ?�는 ?�영??
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        alert(`${file.name}?�(?? ?��?지 ?�는 ?�영???�일???�닙?�다.`);
        continue;
      }
      
      // ?�일 ?�기 검�?(?��?지: 10MB, ?�영?? 50MB)
      const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeMB = isImage ? '10MB' : '50MB';
        alert(`${file.name}?�(?? ${maxSizeMB}�?초과?�니??`);
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
      // ?�일 ?�기 검�?(문서: 20MB)
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`${file.name}?�(?? 20MB�?초과?�니??`);
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
      case 'pdf': return '?��';
      case 'doc':
      case 'docx': return '?��';
      case 'xls':
      case 'xlsx': return '?��';
      case 'ppt':
      case 'pptx': return '?��';
      case 'txt': return '?��';
      case 'zip':
      case 'rar': return '?���?;
      default: return '?��';
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
    if (!title) return alert("?�목???�력?�세??");

    setIsUploading(true);
    try {
      let thumbnailUrl = "";
      const mediaUrls: { url: string; type: string }[] = [];
      const fileUrls: { url: string; name: string }[] = [];

      // ?�네???��?지 ?�로??      if (thumbnailFile) {
        console.log("?�� ?�네???��?지 ?�로???�작:", thumbnailFile.name);
        const thumbnailRef = ref(storage, `teams/${teamId}/posts/thumbnails/${Date.now()}_${thumbnailFile.name}`);
        await uploadBytes(thumbnailRef, thumbnailFile);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
        console.log("???�네???��?지 ?�로???�료:", thumbnailUrl);
      }

      // 미디???�일 ?�로??(?��?지 + ?�영??
      for (const file of mediaFiles) {
        const ext = file.name.split(".").pop()?.toLowerCase();
        const type = file.type.startsWith('video/') ? "video" : "image";

        const storageRef = ref(storage, `teams/${teamId}/posts/${Date.now()}-${file.name}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);

        mediaUrls.push({ url, type });
      }

      // 첨�? ?�일 ?�로??(문서, PDF ??
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

      // ??초기??      setTitle("");
      setContent("");
      setThumbnailFile(null);
      setThumbnailPreview("");
      setMediaFiles([]);
      setFileAttachments([]);
      setPreviews([]);

      alert("게시글???�록?�었?�니??");
      onPostCreated?.();
    } catch (error) {
      console.error("게시글 ?�록 ?�패:", error);
      alert("게시글 ?�록???�패?�습?�다. ?�시 ?�도?�주?�요.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 mb-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex items-center gap-2">
        ?�� ??게시글 ?�성
      </h2>

      <div className="space-y-4">
        {/* ?�목 ?�력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?�목 *
          </label>
          <input
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="게시글 ?�목???�력?�세??
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* ?�용 ?�력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?�용
          </label>
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
            placeholder="게시글 ?�용???�력?�세??
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* ?�네???��?지 ?�로??*/}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?�???��?지 (?�네??
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
                  alt="?�네??미리보기"
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
                  ?�거
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-4xl text-gray-400">?��</div>
                <p className="text-gray-600 dark:text-gray-400">
                  ?�???��?지�??�래�????�롭?�거???�릭?�여 ?�택?�세??                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  ?��?지 ?�일�??�로??가??(최�? 10MB)
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

            {/* 미디???�일 ?�래�????�롭 (?��?지 + ?�영?? */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                미디??첨�? ({previews.length}�? - ?��?지/?�영??              </label>
          
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
                              alt={`미리보기 ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-white dark:border-gray-700 shadow-md"
                            />
                          )}
                          <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {mediaFiles[idx].type.startsWith('video/') ? '?��' : '?��'}
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
                        {mediaFiles.length}개의 미디?��? ?�택?�었?�니??                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMediaFiles([]);
                          setPreviews([]);
                        }}
                        className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        ??모두 ?�거
                      </button>
                    </div>
                  </div>
            ) : (
              <div className="space-y-3">
                <div className="text-3xl text-gray-400 dark:text-gray-500">
                  ?��?��
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    ?�기�??��?지 ?�는 ?�영?�을 ?�래�????�롭?�세??                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    ?�는 ?�릭?�여 ?�일 ?�택 (?��?지: 10MB, ?�영?? 50MB ?�하)
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
                  ?��?�� 미디???�택
                </label>
              </div>
            )}
          </div>
        </div>

        {/* ?�일 첨�? ?�션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ?�� ?�일 첨�? ({fileAttachments.length}�? - 문서, PDF, ?��? ??          </label>
          
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
              ?�� ?�일 ?�택
            </label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              PDF, DOC, XLS, PPT, TXT, ZIP ??(20MB ?�하)
            </p>
          </div>

          {/* 첨�????�일 목록 */}
          {fileAttachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                첨�????�일:
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
                ??모든 ?�일 ?�거
              </button>
            </div>
          )}
        </div>

        {/* ?�록 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isUploading || !title}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
        >
          {isUploading ? "게시글 ?�록 �?.." : "?�� 게시글 ?�록"}
        </button>
      </div>
    </div>
  );
}
