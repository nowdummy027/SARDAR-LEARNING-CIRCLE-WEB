import { MessageCircle, Mail } from 'lucide-react';
import { useState } from 'react';

export default function SupportButton() {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmail = () => {
    const email = "sardarswapan219@gmail.com";
    const subject = encodeURIComponent("Help needed on Sardar Learning Circle");
    window.open(`mailto:${email}?subject=${subject}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 bg-[#1a0b2e] border border-white/10 rounded-xl p-4 shadow-2xl w-64 animate-in slide-in-from-bottom-5">
          <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-2 pb-2 border-b border-white/10">Help / Support</h3>
          <p className="text-xs text-gray-400 mb-4 tracking-wide leading-relaxed">
            Need help? Contact us via Email and we'll get back to you shortly.
          </p>
          <div className="flex flex-col gap-2">
            <button 
              onClick={handleEmail}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Email Us
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_rgba(37,99,235,0.8)] transition-all hover:-translate-y-1"
        title="Get Help"
      >
        <MessageCircle size={28} />
      </button>
    </div>
  );
}
