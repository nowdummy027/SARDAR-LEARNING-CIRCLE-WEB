import { Link, useNavigate } from 'react-router-dom';
import { PlayCircle, Download, Award, UserCircle, LogOut, Video, FileText, Image as ImageIcon, X, Link as LinkIcon, ExternalLink, MessageCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useEffect, useState, useRef } from 'react';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db, storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ReactPlayer from 'react-player';
import { MOCK_COURSES } from '../data/courses';

interface CourseExt {
  id: string;
  title: string;
  description: string;
  category: string;
  materials: any[];
}

export default function Dashboard() {
  const { user, userData, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [coursesData, setCoursesData] = useState<CourseExt[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [activeVideo, setActiveVideo] = useState<{ url: string, title: string, courseTitle: string } | null>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState<'classes' | 'materials' | 'tests'>('classes');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        () => {}, 
        (error) => {
          console.error("Avatar upload error:", error);
          if (error.code === 'storage/unauthorized') {
            alert('Upload denied. Please go to Firebase Console -> Storage -> Rules, and set them to allow read/write.');
          } else if (error.code === 'storage/unknown') {
            alert('Upload failed. Note: To upload files, you must first initialize Firebase Storage in your Firebase Console (Build > Storage > Get Started). If prompted, upgrade to the Blaze plan (it has a free tier).');
          } else {
            alert(`Failed to upload avatar. Error: ${error.message}. Ensure Firebase Storage is initialized and you are on the Blaze plan if required.`);
          }
          setUploadingAvatar(false);
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            await updateDoc(doc(db, 'users', user.uid), {
              photoURL: downloadURL
            });
          } catch (e) {
            console.error("Firestore update error:", e);
            alert("Failed to update profile with new photo.");
          } finally {
            setUploadingAvatar(false);
          }
        }
      );
    } catch (error) {
      console.error("Error initiating upload:", error);
      alert('Failed to upload avatar.');
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!userData?.enrolledCourses || userData.enrolledCourses.length === 0) {
        setLoadingCourses(false);
        return;
      }
      
      try {
        const fetchPromises = userData.enrolledCourses.map(async (courseId) => {
          const courseRef = doc(db, 'courses', courseId);
          const courseSnap = await getDoc(courseRef);
          
          let courseInfo: any = null;
          let materials: any[] = [];

          if (courseSnap.exists()) {
            courseInfo = { id: courseSnap.id, ...courseSnap.data() };
            // Fetch materials for this course
            const materialsRef = collection(db, `courses/${courseId}/materials`);
            const materialsSnap = await getDocs(materialsRef);
            materials = materialsSnap.docs.map(m => ({ id: m.id, ...m.data() }));
          } else {
            // Fallback to mock courses
            const mockCourse = MOCK_COURSES.find(c => c.id === courseId);
            if (mockCourse) {
              courseInfo = mockCourse;
            }
          }
          
          if (courseInfo) {
            return {
              ...courseInfo,
              materials
            } as CourseExt;
          }
          return null;
        });

        const results = await Promise.all(fetchPromises);
        setCoursesData(results.filter(Boolean) as CourseExt[]);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (userData && !loading) {
      fetchEnrolledCourses();
    }
  }, [userData, loading]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-80px)] bg-[#0F0121] items-center justify-center">
        <div className="text-white font-black tracking-widest text-xl animate-pulse">LOADING PROFILE...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-[calc(100vh-80px)] bg-[#0F0121]">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex w-64 bg-[#1A0338] border-r border-white/5 flex-col fixed h-[calc(100vh-80px)] z-10">
        <div className="p-6 flex flex-col items-center border-b border-white/5 relative">
          <div 
            className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 relative group cursor-pointer overflow-hidden border border-white/10 shadow-lg shadow-blue-500/10"
            onClick={() => fileInputRef.current?.click()}
          >
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={48} className="text-blue-400 group-hover:scale-110 transition-transform" />
            )}
            
            {/* Hover overlay */}
            <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {uploadingAvatar ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-[9px] font-black tracking-widest text-white uppercase">Upload</span>
              )}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <h2 className="font-bold text-white tracking-widest uppercase text-sm text-center line-clamp-1">{userData?.name || user.displayName || 'Student Profile'}</h2>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">SARDAR LEARNING CIRCLE</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors border ${
              activeTab === 'classes' 
                ? 'bg-[#2D0B5A] text-white shadow-sm border-white/5' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <PlayCircle size={18} className={activeTab === 'classes' ? "text-blue-400" : ""} /> My Classes
          </button>
          <button 
            onClick={() => setActiveTab('materials')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors border ${
              activeTab === 'materials' 
                ? 'bg-[#2D0B5A] text-white shadow-sm border-white/5' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <Download size={18} className={activeTab === 'materials' ? "text-blue-400" : ""} /> Study Materials
          </button>
          <button 
            onClick={() => setActiveTab('tests')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors border ${
              activeTab === 'tests' 
                ? 'bg-[#2D0B5A] text-white shadow-sm border-white/5' 
                : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
            }`}
          >
            <Award size={18} className={activeTab === 'tests' ? "text-blue-400" : ""} /> Test Results
          </button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full px-4 py-3 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-4 md:p-8 w-full max-w-[100vw]">
        
        {/* Mobile Header & Profile */}
        <div className="md:hidden mb-6 flex flex-col items-center bg-[#1A0338] rounded-2xl p-6 border border-white/5">
          <div 
            className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 relative group cursor-pointer overflow-hidden border border-white/10 shadow-lg shadow-blue-500/10"
            onClick={() => fileInputRef.current?.click()}
          >
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserCircle size={48} className="text-blue-400" />
            )}
            <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${uploadingAvatar ? 'opacity-100' : 'opacity-0'}`}>
              {uploadingAvatar ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <span className="text-[9px] font-black tracking-widest text-white uppercase">Upload</span>
              )}
            </div>
          </div>
          <h2 className="font-bold text-white tracking-widest uppercase text-sm text-center line-clamp-1">{userData?.name || user.displayName || 'Student Profile'}</h2>
          
          {/* Mobile Tabs */}
          <div className="flex overflow-x-auto w-full gap-2 mt-6 pb-2 snap-x">
            <button 
              onClick={() => setActiveTab('classes')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors border snap-start ${
                activeTab === 'classes' ? 'bg-[#2D0B5A] text-white border-white/20' : 'text-gray-400 border-white/5 bg-white/5'
              }`}
            >
              <PlayCircle size={16} /> Classes
            </button>
            <button 
              onClick={() => setActiveTab('materials')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors border snap-start ${
                activeTab === 'materials' ? 'bg-[#2D0B5A] text-white border-white/20' : 'text-gray-400 border-white/5 bg-white/5'
              }`}
            >
              <Download size={16} /> Materials
            </button>
            <button 
              onClick={() => setActiveTab('tests')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-colors border snap-start ${
                activeTab === 'tests' ? 'bg-[#2D0B5A] text-white border-white/20' : 'text-gray-400 border-white/5 bg-white/5'
              }`}
            >
              <Award size={16} /> Tests
            </button>
            <button 
              onClick={() => { logout(); navigate('/login'); }}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-[10px] text-red-400 border border-red-500/20 bg-red-500/5 snap-start"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tighter uppercase">
            {activeTab === 'classes' && "My Enrolled Batches"}
            {activeTab === 'materials' && "Study Materials"}
            {activeTab === 'tests' && "Test Results"}
          </h1>
        </div>

        {activeVideo && (
          <div ref={playerRef} className="mb-8 bg-[#1A0338] rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0F0121]">
              <div>
                <h3 className="font-bold text-white tracking-tight">{activeVideo.title}</h3>
                <p className="text-xs text-gray-400 uppercase tracking-widest">{activeVideo.courseTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 flex items-center gap-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 transition-colors text-xs font-bold uppercase tracking-wider"
                  title="Open Link Directly"
                >
                  <ExternalLink size={14} /> Open
                </a>
                <button 
                  onClick={() => {
                    setIsPlaying(false);
                    setTimeout(() => setActiveVideo(null), 100);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Close Video"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="aspect-video bg-black relative">
              <ReactPlayer 
                url={activeVideo.url} 
                width="100%" 
                height="100%" 
                controls={true}
                playing={isPlaying}
                onReady={() => setIsPlaying(true)}
                // @ts-ignore
                config={{
                  // @ts-ignore
                  file: {
                    attributes: {
                      controlsList: 'nodownload'
                    }
                  }
                }}
              />
            </div>
          </div>
        )}
        
        {loadingCourses ? (
          <div className="text-center text-gray-400 py-12 animate-pulse">Loading courses...</div>
        ) : activeTab === 'tests' ? (
          <div className="bg-[#1A0338] rounded-2xl p-12 border border-white/5 text-center">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award size={32} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">TEST RESULTS</h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm">
              Your test results will appear here once they are published by the admin.
            </p>
          </div>
        ) : coursesData.length > 0 ? (
          <div className="space-y-6">
            {coursesData.map((course) => {
              const filteredMaterials = course.materials?.filter(mat => {
                if (activeTab === 'classes') return true;
                if (activeTab === 'materials') return mat.type !== 'video';
                return false;
              }) || [];

              // For materials tab, hide course entirely if no non-video materials are available?
              // Let's just show it, but it will say 'No materials uploaded yet' 

              return (
              <div key={course.id} className="bg-[#1A0338] rounded-2xl p-6 border border-white/5 hover:border-white/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{course.title}</h2>
                    <p className="text-sm text-gray-400">{course.category}</p>
                  </div>
                  <span className="bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.3)] text-green-400 px-3 py-1 rounded text-[10px] uppercase tracking-widest font-black">Active</span>
                </div>
                
                <p className="text-gray-300 mb-6 text-sm">{course.description}</p>
                
                <div className="border-t border-white/10 pt-4 mt-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h3 className="text-lg font-bold text-white">
                      {activeTab === 'classes' ? 'Course Contents (Videos & Materials)' : 'Study Materials (PDFs, Images, Links)'}
                    </h3>
                    <button 
                      onClick={() => {
                        const email = "sardarswapan219@gmail.com";
                        const subject = encodeURIComponent(`Doubt regarding course: ${course.title}`);
                        const msg = encodeURIComponent(`Hello! I am an enrolled student of "${course.title}".\n\nI have a doubt: `);
                        window.open(`mailto:${email}?subject=${subject}&body=${msg}`, "_blank");
                      }}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all text-xs uppercase tracking-wider shadow-lg shadow-blue-600/20"
                    >
                      <MessageCircle size={16} />
                      Ask a Doubt (Email)
                    </button>
                  </div>
                  
                  {filteredMaterials.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredMaterials.map(mat => {
                        const isVideo = mat.type === 'video';
                        return (
                          <div 
                            key={mat.id}
                            onClick={(e) => {
                              if (isVideo) {
                                setIsPlaying(false);
                                setTimeout(() => {
                                  setActiveVideo({ url: mat.url, title: mat.title, courseTitle: course.title });
                                  setTimeout(() => {
                                    playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }, 100);
                                }, 50);
                              } else {
                                // If inside an iframe, anchor tags are sometimes more reliable, so we also provide an explicit href.
                                window.open(mat.url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="flex items-center p-3 bg-[#0F0121] rounded-xl border border-white/5 hover:border-blue-500/30 hover:bg-blue-900/20 transition-all group cursor-pointer relative"
                          >
                            {!isVideo && (
                              <a href={mat.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-10" aria-label={`Open ${mat.title}`}></a>
                            )}
                            <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-colors z-0">
                              {mat.type === 'video' && <Video size={20} className="text-blue-400" />}
                              {mat.type === 'pdf' && <FileText size={20} className="text-red-400" />}
                              {mat.type === 'photo' && <ImageIcon size={20} className="text-green-400" />}
                              {mat.type === 'link' && <LinkIcon size={20} className="text-purple-400" />}
                            </div>
                            <div className="z-0">
                              <p className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors">{mat.title}</p>
                              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{mat.type}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-[#0F0121] p-4 rounded-xl border border-white/5">
                      {activeTab === 'materials' ? 'No PDF/Image materials have been uploaded for this course yet.' : 'No contents have been uploaded for this course yet.'}
                    </p>
                  )}
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="bg-[#1A0338] rounded-2xl p-12 border border-white/5 text-center">
            <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award size={32} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-3">No Courses Found</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto text-sm">
              You haven't enrolled in any batches yet. Head over to the courses page to explore our offerings.
            </p>
            <Link to="/courses" className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black px-8 py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all uppercase text-[10px] tracking-widest">
              Explore Courses
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

