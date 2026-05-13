import React from 'react';
import { Review } from '../types';
import { Star, MessageSquare, X } from 'lucide-react';

interface ReviewsModalProps {
  reviews: Review[];
  onClose: () => void;
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({ reviews, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border-4 border-amber-200 flex flex-col max-h-[85vh]">
        <div className="bg-amber-100 p-6 border-b border-amber-200 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-amber-600" />
            本日のお客様の声
          </h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-amber-200 rounded-full transition-colors text-amber-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-gray-400 italic">
              まだ口コミはありません。
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="bg-stone-50 rounded-2xl p-5 border border-stone-200 shadow-sm hover:border-amber-300 transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-stone-800">{review.customerName}</h3>
                    <div className="flex gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-stone-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-stone-400 font-mono">Day {review.date}</span>
                </div>
                
                <p className="text-stone-700 leading-relaxed text-sm mb-3">
                  "{review.comment}"
                </p>
                
                {review.breadType && (
                  <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-amber-100 text-[10px] font-bold text-amber-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    対象: {review.breadType}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95"
          >
            明日の準備を続ける
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
