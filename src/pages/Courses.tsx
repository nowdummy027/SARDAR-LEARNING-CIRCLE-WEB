import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_COURSES, CourseCategory } from '../data/courses';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { collection, doc, getDocs, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export default function Courses() {
  const [activeTab, setActiveTab] = useState<CourseCategory | 'All'>('All');
  const [enrollingMap, setEnrollingMap] = useState<{[key: string]: boolean}>({});
  const [dbCourses, setDbCourses] = useState<any[]>([]);
  const [paymentMethodCourse, setPaymentMethodCourse] = useState<any>(null);
  const [payingCourse, setPayingCourse] = useState<any>(null);
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const snap = await getDocs(collection(db, 'courses'));
        const fCourses = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDbCourses(fCourses);
      } catch (err) {
        console.error("Failed to fetch db courses:", err);
      }
    };
    fetchCourses();
  }, []);

  const categories: (CourseCategory | 'All')[] = ['All', 'Class 1-10', 'Class 11-12', 'AI & Digital'];

  const dbCourseIds = new Set(dbCourses.map(c => c.id));
  const uniqueMockCourses = MOCK_COURSES.filter(c => !dbCourseIds.has(c.id));
  const allCourses = [...dbCourses, ...uniqueMockCourses];

  const filteredCourses = activeTab === 'All' 
    ? allCourses 
    : allCourses.filter(c => c.category === activeTab);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleEnrollClick = (course: any) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if already enrolled
    if (userData?.enrolledCourses?.includes(course.id)) {
      navigate('/dashboard');
      return;
    }

    setPaymentMethodCourse(course);
  };

  const handleEmailNotify = () => {
    if (!payingCourse) return;
    const email = "sardarswapan219@gmail.com";
    const subject = encodeURIComponent(`Enrollment Request: ${payingCourse.title}`);
    const message = encodeURIComponent(`Hello! I have paid ₹${payingCourse.price} for the course "${payingCourse.title}".\nMy email is: ${user?.email || userData?.phone || '...'}\nMy name is: ${userData?.name || '...'}\nPlease approve my enrollment.`);
    window.open(`mailto:${email}?subject=${subject}&body=${message}`, '_blank', 'noopener,noreferrer');
    setPayingCourse(null);
  };

  const handleRazorpayClick = async (course: any) => {

    const res = await loadRazorpay();
    if (!res) {
      alert("Failed to load Razorpay SDK. Please check your connection.");
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_dummykey', // Update in .env
      amount: course.price * 100, // paise
      currency: "INR",
      name: "Sardar Learning Circle",
      description: `Enrollment: ${course.title}`,
      handler: async function (response: any) {
        try {
          setEnrollingMap(prev => ({ ...prev, [course.id]: true }));
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, {
            enrolledCourses: arrayUnion(course.id),
            updatedAt: serverTimestamp(),
          });
          alert(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`);
          navigate('/dashboard');
        } catch (error) {
          console.error("Enrollment error after payment:", error);
          alert("Payment received, but course connection delayed. Please contact support.");
        } finally {
          setEnrollingMap(prev => ({ ...prev, [course.id]: false }));
        }
      },
      prefill: {
        name: userData?.name || user.displayName || "",
        email: user.email || "",
        contact: userData?.phone || ""
      },
      theme: {
        color: "#2563EB"
      }
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.on('payment.failed', function (response: any) {
      alert("Payment failed: " + response.error.description);
    });
    paymentObject.open();
  };

  return (
    <div className="min-h-screen bg-[#0F0121] py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">OUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">COURSES</span></h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Browse our specially curated batches for West Bengal Board students and dive into futuristic AI and Digital skills.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-200 border ${
                activeTab === cat
                  ? 'bg-white text-[#0F0121] border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                  : 'bg-[#1A0338] text-gray-400 border-white/5 hover:border-white/20 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map(course => (
            <div key={course.id} className="bg-[#1A0338] rounded-2xl overflow-hidden border border-white/5 flex flex-col group hover:border-white/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="relative h-56 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A0338] to-transparent z-10"></div>
                <img 
                  src={course.thumbnail || course.image || 'https://images.unsplash.com/photo-1546410531-ea4cea9b711c?w=600&auto=format&fit=crop&q=80'} 
                  alt={course.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 opacity-50" 
                />
                <div className="absolute top-4 left-4 z-20 bg-white/10 backdrop-blur-md px-3 py-1 rounded border border-white/10 text-[10px] font-black text-white shadow-sm uppercase tracking-wider">
                  {course.category}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-grow relative z-20 -mt-10">
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{course.title}</h3>
                <p className="text-gray-400 text-sm mb-6 line-clamp-3 flex-grow">{course.description}</p>
                
                <div className="flex flex-col gap-3 mb-8 text-sm text-gray-300">
                  {(course.features || []).map((feat: string, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
                      <span className="font-medium text-xs tracking-wide uppercase">{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t border-white/5 mt-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-3xl font-black text-white">₹{course.price}</span>
                      {course.originalPrice && (
                        <span className="text-gray-500 text-sm line-through ml-2">₹{course.originalPrice}</span>
                      )}
                    </div>
                    {course.originalPrice && (
                      <div className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                        {Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100)}% OFF
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleEnrollClick(course)}
                    disabled={enrollingMap[course.id]}
                    className={`w-full font-black py-4 rounded-xl shadow-lg transition-all uppercase text-[10px] tracking-widest ${
                      userData?.enrolledCourses?.includes(course.id)
                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-500/20 hover:scale-[1.02]'
                    } ${enrollingMap[course.id] ? 'opacity-70 cursor-not-allowed' : ''}`}>
                    {enrollingMap[course.id] 
                      ? 'Enrolling...' 
                      : userData?.enrolledCourses?.includes(course.id) 
                        ? 'Go to Dashboard' 
                        : 'Enroll Now'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {paymentMethodCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A0338] border border-white/10 rounded-2xl p-8 max-w-md w-full relative animate-in zoom-in-95 shadow-2xl">
            <button 
              onClick={() => setPaymentMethodCourse(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-xl font-black text-white mb-6 text-center tracking-tight">HOW WOULD YOU LIKE TO PAY?</h2>
            
            <button 
              onClick={() => {
                const c = paymentMethodCourse;
                setPaymentMethodCourse(null);
                setPayingCourse(c);
              }}
              className="w-full bg-[#0F0121] hover:bg-[#1A0338] border border-white/20 hover:border-white/50 text-white font-bold py-4 rounded-xl transition-all uppercase text-xs tracking-widest mb-4"
            >
              Pay via UPI QR Code directly
            </button>
            
            <button 
              onClick={() => {
                const c = paymentMethodCourse;
                setPaymentMethodCourse(null);
                handleRazorpayClick(c);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20"
            >
              Pay via Razorpay API 
            </button>
            {import.meta.env.VITE_RAZORPAY_KEY_ID?.includes('dummy') && (
              <p className="text-yellow-500/70 text-[10px] text-center mt-4">API Key in .env is dummy. Razorpay may reject.</p>
            )}
          </div>
        </div>
      )}

      {payingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A0338] border border-white/10 rounded-2xl p-8 max-w-md w-full relative animate-in zoom-in-95">
            <button 
              onClick={() => setPayingCourse(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black text-white mb-2 text-center">PAY VIA UPI</h2>
            <p className="text-gray-400 text-sm text-center mb-6">Course: {payingCourse.title}</p>
            
            <div className="bg-white p-4 rounded-xl max-w-[200px] mx-auto mb-6">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=sardarswapan219@okhdfcbank&pn=SWAPAN%20SARDAR&am=${payingCourse.price}&cu=INR`}
                alt="UPI QR Code"
                className="w-full h-auto"
              />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
              <p className="text-3xl font-black text-white">₹{payingCourse.price}</p>
            </div>

            <div className="bg-[#0F0121] rounded-xl p-4 text-center mb-6 border border-white/5">
              <p className="text-xs text-gray-400 mb-1">UPI ID</p>
              <p className="font-mono text-sm text-white select-all">sardarswapan219@okhdfcbank</p>
              <p className="font-mono text-sm text-white select-all mt-1">Name: SWAPAN SARDAR</p>
            </div>

            <p className="text-xs text-gray-400 text-center mb-6 leading-relaxed">
              After successful payment, please click below to send a screenshot via Email. The admin will verify and approve your enrollment shortly.
            </p>

            <button 
              onClick={handleEmailNotify}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20"
            >
              I HAVE PAID (NOTIFY ADMIN)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
