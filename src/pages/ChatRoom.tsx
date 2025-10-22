import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { sendMessage, getThread } from '@/services/chatService';
import { acceptDeal, cancelDeal } from '@/services/dealService';
import DealProposal from '@/components/DealProposal';
import ReviewForm from '@/components/ReviewForm';
import TemperatureBadge from '@/components/TemperatureBadge';
import ReportModal from '@/components/ReportModal';
import { blockUser, unblockUser, isUserBlocked } from '@/services/reportService';

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt?: any;
};

type Deal = {
  mode: 'meet' | 'delivery';
  price: number;
  place?: string;
  meetAt?: any;
  status: string;
  proposedBy: string;
  acceptedBy?: string;
};

type Thread = {
  id: string;
  members: string[];
  productId: string;
  status: string;
  lastMessage: string;
  lastMessageAt: any;
  createdAt: any;
};

export default function ChatRoom() {
  const { threadId } = useParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;
  const otherUserId = thread?.members?.find(id => id !== currentUserId);

  useEffect(() => {
    if (!threadId || !currentUserId) return;
    
    // ?�레???�보 로드
    const loadThread = async () => {
      try {
        const threadData = await getThread(threadId);
        setThread(threadData as Thread);
      } catch (error) {
        console.error('?�레??로드 ?�패:', error);
        navigate('/chat');
      }
    };
    
    loadThread();
  }, [threadId, currentUserId, navigate]);

  // ??useMemo�?쿼리 ?�정??
  const messagesQuery = useMemo(() => {
    if (!threadId) return null;
    return query(
      collection(db, 'threads', threadId, 'messages'), 
      orderBy('createdAt', 'asc')
    );
  }, [threadId]);

  const threadDocRef = useMemo(() => {
    if (!threadId) return null;
    return doc(db, 'threads', threadId);
  }, [threadId]);

  useEffect(() => {
    if (!messagesQuery || !threadDocRef) return;

    // 메시지 구독
    const unsubMessages = onSnapshot(messagesQuery, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });

    // Deal 구독 - ?�레??문서??deal ?�브?�드 구독
    const unsubDeal = onSnapshot(threadDocRef, snap => {
      const data = snap.data() as any;
      setDeal(data?.deal ?? null);
    });

    return () => {
      unsubMessages();
      unsubDeal();
    };
  }, [messagesQuery, threadDocRef]); // ??쿼리 객체�??�존

  // 차단 ?�태 ?�인
  useEffect(() => {
    if (otherUserId) {
      isUserBlocked(otherUserId).then(setIsBlocked);
    }
  }, [otherUserId]);

  // 거래 ?�료 ??리뷰 ?�성 모달 ?�시
  React.useEffect(() => {
    if (thread?.status === 'done' && !showReviewForm) {
      // 거래가 ?�료?�었?�데 ?�직 리뷰�??�성?��? ?�았?�면 모달 ?�시
      setShowReviewForm(true);
    }
  }, [thread?.status, showReviewForm]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!threadId || !text.trim()) return;
    
    // 차단???�용?�에게는 메시지 ?�송 불�?
    if (isBlocked) {
      alert('차단???�용?�에게는 메시지�?보낼 ???�습?�다.');
      return;
    }
    
    try {
      setLoading(true);
      await sendMessage(threadId, text.trim());
      setText('');
    } catch (error: any) {
      console.error('메시지 ?�송 ?�패:', error);
      alert(error.message || '메시지 ?�송???�패?�습?�다.');
    } finally {
      setLoading(false);
    }
  }

  const handleDealProposed = () => {
    console.log('거래 ?�안???�료?�었?�니??');
  };

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    // 리뷰 ?�성 ?�료 ??추�? ?�업 (?�요??
  };

  // ?�용??차단/?�제
  const handleBlockUser = async () => {
    if (!otherUserId) return;
    
    try {
      if (isBlocked) {
        await unblockUser(otherUserId);
        setIsBlocked(false);
        alert('?�용??차단???�제?�습?�다.');
      } else {
        await blockUser(otherUserId);
        setIsBlocked(true);
        alert('?�용?��? 차단?�습?�다.');
      }
      setShowMenu(false);
    } catch (error: any) {
      console.error('차단 처리 ?�패:', error);
      alert(error.message || '차단 처리???�패?�습?�다.');
    }
  };

  // 빠른 문구
  const quickMessages = ['?�늘 ?�후 7??, '?�일 ?�후 2??, '주말 가?�해??, '직거???�망', '?�배 부?�드?�요'];

  if (!thread) {
    return <div className="p-4 text-center">로딩 �?..</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* ?�더 - ?��?�??�보 */}
      <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            ?��
          </div>
          <div>
            <div className="font-medium">?��?�?/div>
            {otherUserId && (
              <TemperatureBadge
                stats={{ trades: 0, starsSum: 0, pos: 0, neg: 0 }}
                showText={false}
                className="text-xs"
              />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* ?��?�?메뉴 */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ??
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-2 min-w-[150px] z-10">
                <button
                  onClick={handleBlockUser}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  {isBlocked ? '차단 ?�제' : '차단?�기'}
                </button>
                <button
                  onClick={() => {
                    setShowReportModal(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors text-red-600"
                >
                  ?�고?�기
                </button>
              </div>
            )}
          </div>
          
          {/* 거래 ?�료 버튼 */}
          {thread.status === 'booked' && (
            <button
              onClick={async () => {
                try {
                  await acceptDeal(threadId!);
                  alert('거래가 ?�료?�었?�니??');
                } catch (error: any) {
                  console.error('거래 ?�료 ?�패:', error);
                  alert(error.message || '거래 ?�료???�패?�습?�다.');
                }
              }}
              className="px-3 py-1 text-sm border rounded bg-green-500 text-white hover:bg-green-600"
            >
              거래 ?�료
            </button>
          )}
          
          {/* 리뷰 ?�성 버튼 */}
          {thread.status === 'done' && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              리뷰 ?�성
            </button>
          )}
          
          {/* 거래 ?�안 버튼 */}
          {thread.status === 'negotiating' && (
            <button
              className="px-3 py-1 border rounded hover:bg-gray-50"
              onClick={() => {
                // 간단??거래 ?�안 (?�제로는 DealProposal ?�용)
                const quickDeal = {
                  mode: 'meet' as const,
                  price: 0,
                  place: '?��?벅스 강남??��',
                  meetAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
                };
                // ?�제로는 dealService.proposeDeal ?�출
                console.log('빠른 거래 ?�안:', quickDeal);
              }}
            >
              거래 ?�안
            </button>
          )}
        </div>
      </div>

      {/* 차단???�용??경고 */}
      {isBlocked && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-red-600">?�️</span>
            <div>
              <p className="text-red-800 text-sm font-medium">차단???�용?�입?�다</p>
              <p className="text-red-700 text-xs">메시지�?주고받을 ???�습?�다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 ?�성 모달 */}
      {showReviewForm && (
        <ReviewForm
          threadId={threadId!}
          targetId={otherUserId!}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      {/* 거래 ?�안 컴포?�트 */}
      <DealProposal
        threadId={threadId!}
        currentUserId={currentUserId || ''}
        otherUserId={otherUserId || ''}
        isDealCompleted={deal?.status === 'completed'}
        onDealProposed={handleDealProposed}
      />

      {/* Deal ?�태 ?�시 */}
      {deal && (
        <div className="border rounded p-3 mb-3 bg-blue-50">
          <div className="font-medium text-blue-800">거래 ?�태: {deal.status}</div>
          {deal.place && <div className="text-sm text-blue-700">?�소: {deal.place}</div>}
          {deal.meetAt && (
            <div className="text-sm text-blue-700">
              ?�간: {deal.meetAt.seconds ?
                new Date(deal.meetAt.seconds * 1000).toLocaleString() :
                new Date(deal.meetAt).toLocaleString()
              }
            </div>
          )}
          {deal.status === 'proposed' && (
            <div className="mt-2 flex gap-2">
              <button
                className="px-3 py-1 text-sm border rounded bg-green-500 text-white hover:bg-green-600"
                onClick={async () => {
                  try {
                    await acceptDeal(threadId!, currentUserId!);
                    alert('거래�??�락?�습?�다.');
                  } catch (error: any) {
                    console.error('거래 ?�락 ?�패:', error);
                    alert(error.message || '거래 ?�락???�패?�습?�다.');
                  }
                }}
              >
                ?�락
              </button>
              <button
                className="px-3 py-1 text-sm border rounded bg-red-500 text-white hover:bg-red-600"
                onClick={async () => {
                  try {
                    await cancelDeal(threadId!);
                    alert('거래�?취소?�습?�다.');
                  } catch (error: any) {
                    console.error('거래 취소 ?�패:', error);
                    alert(error.message || '거래 취소???�패?�습?�다.');
                  }
                }}
              >
                취소
              </button>
            </div>
          )}
        </div>
      )}

      {/* 메시지 리스??*/}
      <div className="border rounded p-3 h-[50vh] overflow-y-auto mb-3 bg-white/60">
        {messages.map(m => (
          <div key={m.id} className={`mb-2 ${m.senderId === currentUserId ? 'text-right' : ''}`}>
            <div className={`inline-block px-3 py-2 rounded-2xl border ${
              m.senderId === currentUserId ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      {/* 빠른 문구 */}
      <div className="flex gap-2 mb-2 overflow-x-auto">
        {quickMessages.map(msg => (
          <button
            key={msg}
            className={`px-2 py-1 text-sm border rounded whitespace-nowrap transition-colors ${
              isBlocked
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => !isBlocked && setText(prev => prev ? prev + ' ' + msg : msg)}
            disabled={isBlocked}
          >
            {msg}
          </button>
        ))}
      </div>

      {/* 메시지 ?�력 ??*/}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          className={`flex-1 border rounded px-3 py-2 ${
            isBlocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''
          }`}
          placeholder={isBlocked ? "차단???�용?�입?�다" : "메시지 ?�력..."}
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading || isBlocked}
        />
        <button
          type="submit"
          className={`px-4 py-2 rounded text-white hover:bg-gray-800 disabled:opacity-50 ${
            isBlocked ? 'bg-gray-400 cursor-not-allowed' : 'bg-black'
          }`}
          disabled={loading || isBlocked}
        >
          {loading ? '?�송 �?..' : '보내�?}
        </button>
      </form>

      {/* ?�고 모달 */}
      <ReportModal
        targetId={otherUserId || ''}
        targetName="?��?�?
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onReportSubmitted={() => {
          alert('?�고가 ?�수?�었?�니??');
        }}
      />
    </div>
  );
}
