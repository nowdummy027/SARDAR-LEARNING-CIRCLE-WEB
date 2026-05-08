import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, FileText, MessageCircle, MonitorPlay, ArrowRight } from 'lucide-react';
import { MOCK_COURSES } from '../data/courses';
import { collection, getDocs, query, limit, getCountFromServer } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Home() {
  const featuredCourses = MOCK_COURSES.slice(0, 3); // Just show top 3 for home
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let count = 15000; // Fallback
        try {
          const countSnap = await getCountFromServer(collection(db, 'users'));
          count = countSnap.data().count;
        } catch (e) {
          console.warn("Could not fetch user count from server, using fallback.", e);
        }
        setActiveUsersCount(count);

        try {
          const q = query(collection(db, 'users'), limit(30));
          const snapshot = await getDocs(q);
          const users = snapshot.docs
            .map(doc => doc.data())
            .filter(user => user.photoURL);
          setActiveUsers(users.slice(0, 3));
        } catch (e) {
           console.warn("Could not fetch active users list from server.", e);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col md:flex-row items-center relative overflow-hidden py-12 md:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col md:flex-row gap-12 lg:gap-20 items-center justify-between">
          <div className="w-full md:w-3/5 space-y-8 z-10">
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-xs font-bold uppercase tracking-widest">
              Future Mission: WB Board Excellence & Digital Thinking
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tighter">
              BENGAL'S <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">LEARN WITH</span> <br/>
              DIGITAL WAY
            </h1>
            <p className="text-gray-400 text-lg md:text-xl max-w-lg leading-relaxed">
              Quality education from Class 1-12 & AI Skills. Expert mentors, Live classes, and structured notes starting from only <span className="text-white font-bold">₹199</span>.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-10 pt-4">
              <Link to="/courses" className="bg-white text-[#0F0121] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors inline-block text-center shadow-lg">
                Explore Courses
              </Link>
              <div className="flex gap-4 items-center">
                <div className="flex -space-x-3">
                  {activeUsers.length > 0 ? (
                    activeUsers.map((user, idx) => (
                      <div key={idx} className="w-10 h-10 rounded-full border-2 border-[#0F0121] bg-gray-600 flex items-center justify-center overflow-hidden">
                        <img src={user.photoURL} alt={user.name || "Student"} className="object-cover w-full h-full" />
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full border-2 border-[#0F0121] bg-gray-600 flex items-center justify-center overflow-hidden"><img src="https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=100&auto=format&fit=crop" alt="" className="object-cover w-full h-full" /></div>
                      <div className="w-10 h-10 rounded-full border-2 border-[#0F0121] bg-blue-500 flex items-center justify-center overflow-hidden"><img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=100&auto=format&fit=crop" alt="" className="object-cover w-full h-full" /></div>
                      <div className="w-10 h-10 rounded-full border-2 border-[#0F0121] bg-purple-500 flex items-center justify-center overflow-hidden"><img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop" alt="" className="object-cover w-full h-full" /></div>
                    </>
                  )}
                  <div className="w-10 h-10 rounded-full border-2 border-[#0F0121] bg-gray-400 flex items-center justify-center text-[10px] font-bold text-gray-900">
                    {activeUsersCount > 1000 ? `${(activeUsersCount / 1000).toFixed(1)}k+` : `${activeUsersCount}+`}
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  <span className="text-white block font-bold text-sm">Active Students</span>
                  Learning daily
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-2/5 relative z-10 mt-12 md:mt-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-96 h-64 md:h-96 bg-blue-600/20 blur-[100px] rounded-full"></div>
            <div className="absolute top-0 right-10 w-40 h-40 bg-purple-600/30 blur-[80px] rounded-full"></div>
            
            <div className="flex flex-col gap-6 relative">
              {/* Card 1 */}
              <div className="bg-[#2D0B5A] p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 text-[10px] font-black uppercase rounded">Best Seller</span>
                  <span className="text-xl font-bold text-white">₹499</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">Madhyamik 2026 Batch</h3>
                <p className="text-sm text-gray-400 mb-6">All Subjects (Class 10) + PDF Notes + PYQs</p>
                <Link to="/login" className="block text-center w-full py-4 bg-white text-[#0F0121] font-black text-xs uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors">Enroll Now</Link>
              </div>

              {/* Card 2 */}
              <div className="bg-[#1A0338] p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300 lg:-ml-12 lg:mr-12">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-[10px] font-black uppercase rounded">Trending</span>
                  <span className="text-xl font-bold text-white">₹1999</span>
                </div>
                <h3 className="text-2xl font-bold mb-2 text-white">AI & Web Development</h3>
                <p className="text-sm text-gray-400 mb-6">Master ChatGPT, React & Digital Marketing</p>
                <Link to="/login" className="block text-center w-full py-4 border border-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white/5 transition-colors">View Details</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-t border-white/5 relative z-10 bg-[#0F0121]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">WHY CHOOSE US?</h2>
            <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">Get the best learning experience with our structured features tailored for WB-Board and Skill development.</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-[#1A0338] p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors group">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MonitorPlay className="text-blue-400" size={28} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-white">Live & Recorded</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Missed a class? Watch the recorded video anytime, anywhere.</p>
            </div>
            <div className="bg-[#1A0338] p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors group">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileText className="text-purple-400" size={28} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-white">PDF Study Notes</h3>
              <p className="text-gray-400 text-sm leading-relaxed">High-quality, chapter-wise notes available for download.</p>
            </div>
            <div className="bg-[#1A0338] p-8 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-colors group">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle className="text-blue-400" size={28} />
              </div>
              <h3 className="font-bold text-xl mb-3 text-white">Doubt Solving</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Dedicated forum to clear your doubts from expert teachers.</p>
            </div>
            <div className="bg-[#1A0338] p-8 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-colors group">
              <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform font-black text-3xl text-purple-400">
                ₹
              </div>
              <h3 className="font-bold text-xl mb-3 text-white">Affordable Pricing</h3>
              <p className="text-gray-400 text-sm leading-relaxed">Quality education starting at just ₹199. UPI payment enabled.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20 border-t border-white/5 bg-[#0a001a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">POPULAR BATCHES</h2>
              <p className="text-gray-400 mt-2 text-lg">Start your learning journey today</p>
            </div>
            <Link to="/courses" className="text-blue-400 font-bold hover:text-blue-300 hidden sm:block uppercase tracking-widest text-sm text-right">
              View All Courses &rarr;
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredCourses.map(course => (
              <div key={course.id} className="bg-[#1A0338] rounded-2xl overflow-hidden border border-white/5 flex flex-col group hover:border-white/20 transition-colors">
                <div className="relative h-56 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A0338] to-transparent z-10"></div>
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-60" />
                  <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-white/10 backdrop-blur-md rounded border border-white/10 text-[10px] font-black text-white uppercase tracking-wider">
                    {course.category}
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow relative z-20 -mt-10">
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{course.title}</h3>
                  <p className="text-gray-400 text-sm mb-6 line-clamp-2 leading-relaxed flex-grow">{course.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-8">
                    {course.features.slice(0,2).map((feat, i) => (
                      <span key={i} className="bg-[#2D0B5A] text-gray-300 text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded border border-white/5">
                        {feat}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <div>
                      <span className="text-2xl font-black text-white">₹{course.price}</span>
                      <span className="text-gray-500 text-sm line-through ml-2">₹{course.originalPrice}</span>
                    </div>
                    <Link to={`/courses`} className="bg-white hover:bg-gray-200 text-[#0F0121] px-5 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest transition-colors">
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center sm:hidden">
            <Link to="/courses" className="bg-[#2D0B5A] text-white w-full block py-4 rounded-xl font-black uppercase text-xs tracking-widest">
              View All Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
