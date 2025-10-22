import { useState } from "react";

interface LocationPermissionRequestProps {
  onPermissionGranted: () => void;
  onPermissionDenied: () => void;
}

export default function LocationPermissionRequest({ 
  onPermissionGranted, 
  onPermissionDenied 
}: LocationPermissionRequestProps) {
  const [requesting, setRequesting] = useState(false);

  const handleRequestPermission = () => {
    setRequesting(true);

    if (!navigator.geolocation) {
      alert("??브라?��????�치 ?�비?��? 지?�하지 ?�습?�다.");
      onPermissionDenied();
      setRequesting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("?�치 권한 ?�용??", position.coords);
        onPermissionGranted();
        setRequesting(false);
      },
      (error) => {
        console.error("?�치 권한 거�???", error);
        onPermissionDenied();
        setRequesting(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="text-center">
        <div className="text-4xl mb-4">?��</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ???�네 ?�품??찾아보세??
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          ?�재 ?�치�?기반?�로 ??근처 ?�품???�동?�로 보여?�립?�다.
          <br />
          ?�근마켓처럼 ?�리??지??기반 거래�?경험?�보?�요.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleRequestPermission}
            disabled={requesting}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {requesting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ?�치 감�? �?..
              </div>
            ) : (
              "?�� ???�치�??�네 찾기"
            )}
          </button>
          
          <button
            onClick={onPermissionDenied}
            className="w-full bg-gray-200 text-gray-700 py-2 px-6 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            ?�중???�정?�기
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <span className="mr-2">?��</span>
            <span>?�치 ?�보???�정???�위로만 ?�?�되�? 개인?�보??보호?�니??</span>
          </div>
        </div>
      </div>
    </div>
  );
}
