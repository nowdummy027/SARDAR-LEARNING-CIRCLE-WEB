export default function Footer() {
  return (
    <footer className="bg-[#0F0121] px-4 sm:px-10 py-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
        
        {/* Left Side: Stats */}
        <div className="flex flex-wrap gap-8 md:gap-16">
          <div>
            <span className="block text-3xl font-black text-white leading-none mb-1">98%</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Pass Rate</span>
          </div>
          <div>
            <span className="block text-3xl font-black text-white leading-none mb-1">500+</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Video Lectures</span>
          </div>
          <div>
            <span className="block text-3xl font-black text-white leading-none mb-1">24/7</span>
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Doubt Solving</span>
          </div>
        </div>

        {/* Right Side: Partners / Links */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-16">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Official Partners</span>
            <div className="flex gap-3">
              <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded border border-white/10 text-white font-bold text-xs">P</div>
              <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded border border-white/10 text-white font-bold text-xs">A</div>
              <div className="w-8 h-8 flex items-center justify-center bg-white/5 rounded border border-white/10 text-white font-bold text-xs">Y</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Sardar Learning Circle.
          </div>
        </div>
      </div>
    </footer>
  );
}
