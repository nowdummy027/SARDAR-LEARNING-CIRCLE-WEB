import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../lib/firebase';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ArrowLeft, Upload, FileText, Image as ImageIcon, Video, Trash2, Database, Link as LinkIcon, UserCircle } from 'lucide-react';
import { MOCK_COURSES } from '../data/courses';

export default function Admin() {
  const { user, userData, loading } = useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'payments'>('courses');
  const [isLoadingData, setIsLoadingData] = useState(false);

  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [courseFormData, setCourseFormData] = useState({ title: '', description: '', price: '', category: '', duration: '', image: '' });

  // Material Management State
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [materialType, setMaterialType] = useState<'video' | 'link' | 'pdf' | 'photo'>('video');
  const [materialTitle, setMaterialTitle] = useState('');

  // Enrollment Management
  const [enrollUser, setEnrollUser] = useState<any | null>(null);
  const [userEnrollments, setUserEnrollments] = useState<string[]>([]);
  const [allCourses, setAllCourses] = useState<any[]>([]);

  const [message, setMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);

  const showMessage = (text: string, type: 'error' | 'success' = 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (!loading && (!user || userData?.role !== 'admin')) {
      navigate('/dashboard');
    }
  }, [user, userData, loading, navigate]);

  useEffect(() => {
    if (userData?.role === 'admin') {
      fetchData();
    }
  }, [userData, activeTab]);

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      if (activeTab === 'courses') {
        const querySnapshot = await getDocs(collection(db, 'courses'));
        const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesData);
      } else if (activeTab === 'users' || activeTab === 'payments') {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      showMessage(`Failed to fetch data: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const fetchMaterials = async (courseId: string) => {
    try {
      const querySnapshot = await getDocs(collection(db, `courses/${courseId}/materials`));
      const materialsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMaterials(materialsData);
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const importMockCourses = async () => {
    setIsLoadingData(true);
    showMessage("Importing default courses...", "success");
    try {
      for (const course of MOCK_COURSES) {
        await setDoc(doc(db, 'courses', course.id), {
          title: course.title,
          description: course.description,
          price: course.price,
          originalPrice: course.originalPrice,
          category: course.category,
          image: course.thumbnail,
          features: course.features,
          createdAt: serverTimestamp(),
        });
      }
      showMessage("Default courses imported successfully!", "success");
      fetchData();
    } catch (error) {
      console.error("Error importing courses:", error);
      showMessage(`Failed to import courses: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCourseId) {
        await updateDoc(doc(db, 'courses', editingCourseId), {
          ...courseFormData,
          price: Number(courseFormData.price) || 0,
        });
        setEditingCourseId(null);
        showMessage("Course updated successfully!", "success");
      } else {
        await addDoc(collection(db, 'courses'), {
          ...courseFormData,
          price: Number(courseFormData.price) || 0,
          createdAt: serverTimestamp(),
        });
        showMessage("Course created successfully!", "success");
      }
      setIsAddingCourse(false);
      setCourseFormData({ title: '', description: '', price: '', category: '', duration: '', image: '' });
      fetchData();
    } catch (error) {
      console.error("Error creating/updating course:", error);
      showMessage(`Failed to save course: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const startEditCourse = (course: any) => {
    setCourseFormData({
      title: course.title || '',
      description: course.description || '',
      price: course.price?.toString() || '',
      category: course.category || '',
      duration: course.duration || '',
      image: course.image || ''
    });
    setEditingCourseId(course.id);
    setIsAddingCourse(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    // window.confirm blocked in iframe, skipping confirmation
    try {
      await deleteDoc(doc(db, 'courses', courseId));
      fetchData();
      showMessage("Course deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting course:", error);
      showMessage("Failed to delete course", "error");
    }
  };

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    // window.confirm blocked in iframe
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      fetchData();
      showMessage("User role updated successfully!", "success");
    } catch (error) {
      console.error("Error updating user role:", error);
      showMessage("Failed to update user role", "error");
    }
  };

  const startEnrollUser = async (u: any) => {
    setEnrollUser(u);
    setUserEnrollments(u.enrolledCourses || []);
    // Fetch all courses to show checkboxes
    try {
      const querySnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses for enrollment:", error);
    }
  };

  const saveEnrollments = async () => {
    if (!enrollUser) return;
    try {
      await updateDoc(doc(db, 'users', enrollUser.id), {
        enrolledCourses: userEnrollments
      });
      showMessage("Enrollments updated successfully!", "success");
      setEnrollUser(null);
      fetchData();
    } catch (error) {
      console.error("Error updating enrollments:", error);
      showMessage("Failed to update enrollments", "error");
    }
  };

  const handleApprovePayment = async (userId: string, req: any, userDoc: any) => {
    try {
      // Add course to enrolledCourses
      const currentEnrolled = userDoc.enrolledCourses || [];
      if (!currentEnrolled.includes(req.courseId)) {
        currentEnrolled.push(req.courseId);
      }
      
      // Update the specific request status to 'approved'
      const updatedRequests = (userDoc.paymentRequests || []).map((r: any) => 
        r.utrCode === req.utrCode && r.courseId === req.courseId ? { ...r, status: 'approved' } : r
      );

      await updateDoc(doc(db, 'users', userId), {
        enrolledCourses: currentEnrolled,
        paymentRequests: updatedRequests
      });

      showMessage(`Payment approved and user enrolled in course!`, "success");
      fetchData();
    } catch (error) {
      console.error("Error approving payment:", error);
      showMessage("Failed to approve payment", "error");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCourse || !materialTitle) {
      showMessage("Please provide a title and select a file.", "error");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload to Firebase Storage
      const storageRef = ref(storage, `courses/${selectedCourse.id}/materials/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload error:", error);
          let errorMessage = "Failed to upload file.";
          if (error.code === 'storage/unauthorized') {
             errorMessage = "Upload denied. Please check Firebase Storage Rules in your Firebase Console. Set them to allow read/write.";
          } else if (error.code === 'storage/unknown') {
             errorMessage = "Upload failed. Please ensure Firebase Storage is initialized (Build > Storage > Get Started) and you are on the Blaze plan.";
          } else {
             errorMessage = `Upload failed: ${error.message}. Ensure Storage is active and you are on the Blaze plan if required.`;
          }
          showMessage(errorMessage, "error");
          setUploading(false);
        }, 
        async () => {
          // 2. Get Download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // 3. Save to Firestore
          await addDoc(collection(db, `courses/${selectedCourse.id}/materials`), {
            title: materialTitle,
            type: materialType,
            url: downloadURL,
            createdAt: serverTimestamp()
          });

          showMessage("Material uploaded successfully!", "success");
          setMaterialTitle('');
          if (fileInputRef.current) fileInputRef.current.value = '';
          setUploading(false);
          fetchMaterials(selectedCourse.id);
        }
      );
    } catch (error) {
      console.error("Error in upload process:", error);
      showMessage(`Error occurred during upload: ${error instanceof Error ? error.message : ''}`, "error");
      setUploading(false);
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!selectedCourse) return;
    // window.confirm blocked in iframe
    try {
      await deleteDoc(doc(db, `courses/${selectedCourse.id}/materials`, materialId));
      fetchMaterials(selectedCourse.id);
      showMessage("Material deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting material:", error);
      showMessage("Failed to delete material", "error");
    }
  };

  if (loading || isLoadingData) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (userData?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen p-8 bg-[#0F0121] text-white">
      {enrollUser ? (
        <div>
           <button 
            onClick={() => setEnrollUser(null)}
            className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} /> Back to Administration
          </button>
          <h1 className="text-3xl font-black mb-2">Manage Enrollments</h1>
          <h2 className="text-xl text-gray-400 mb-8 mt-2">Student: {enrollUser.name || 'Unnamed User'} / {enrollUser.phone}</h2>
          
          <div className="bg-[#1A0338] p-6 rounded-xl border border-white/10 mb-8">
            <h3 className="text-xl font-bold mb-4">Select Courses for {enrollUser.name || 'Student'}</h3>
            <div className="grid grid-cols-1 gap-4 mb-6">
              {allCourses.length === 0 ? <p>No courses available</p> : allCourses.map(course => (
                <label key={course.id} className="flex items-center gap-3 p-3 border border-white/10 rounded cursor-pointer hover:bg-white/5">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    checked={userEnrollments.includes(course.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setUserEnrollments([...userEnrollments, course.id]);
                      } else {
                        setUserEnrollments(userEnrollments.filter(id => id !== course.id));
                      }
                    }}
                  />
                  <div>
                    <p className="font-bold">{course.title}</p>
                    <p className="text-xs text-gray-400">{course.category}</p>
                  </div>
                </label>
              ))}
            </div>
            <button 
              onClick={saveEnrollments}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded"
            >
              Save Enrollments
            </button>
          </div>
        </div>
      ) : selectedCourse ? (
        <div>
          <button 
            onClick={() => setSelectedCourse(null)}
            className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} /> Back to Administration
          </button>
          
          <h1 className="text-3xl font-black mb-2">Manage Materials</h1>
          <h2 className="text-xl text-gray-400 mb-8 mt-2">Course: {selectedCourse.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Upload form */}
            <div className="bg-[#1A0338] p-6 rounded-xl border border-white/10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Upload size={20} /> Upload New Material</h3>
              
              <div className="mb-6 p-4 bg-blue-900/40 border border-blue-500/50 rounded-lg">
                <p className="text-sm text-blue-200">
                  <strong className="text-white">Note on Uploads:</strong> To upload files (photos, videos, PDFs), you must first initialize <strong>Firebase Storage</strong> in your Firebase Console. <br/>
                  1. Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline">Firebase Console</a>.<br/>
                  2. Navigate to <strong>Build &gt; Storage</strong> and click <strong>Get Started</strong>.<br/>
                  3. If prompted to upgrade, choose the <strong>Blaze (pay-as-you-go)</strong> plan. It includes a generous free tier which is enough for most start-up needs!
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Title</label>
                  <input 
                    type="text" 
                    value={materialTitle}
                    onChange={(e) => setMaterialTitle(e.target.value)}
                    className="w-full bg-[#0F0121] border border-white/20 rounded p-2 text-white"
                    placeholder="E.g., Chapter 1 Video"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Material Type</label>
                  <select 
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value as any)}
                    className="w-full bg-[#0F0121] border border-white/20 rounded p-2 text-white"
                  >
                    <option value="video">Video</option>
                    <option value="link">Video/File Link (URL)</option>
                    <option value="pdf">PDF</option>
                    <option value="photo">Photo</option>
                  </select>
                </div>

                {materialType === 'link' ? (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Media URL (YouTube, Drive, etc)</label>
                    <input 
                      type="url" 
                      id="materialLinkInput"
                      className="w-full bg-[#0F0121] border border-white/20 rounded p-2 text-white mb-4"
                      placeholder="https://..."
                    />
                    <button 
                      onClick={async () => {
                        const urlInput = document.getElementById('materialLinkInput') as HTMLInputElement;
                        if (!materialTitle || !urlInput.value) {
                          showMessage("Please provide both Title and URL", "error");
                          return;
                        }
                        setUploading(true);
                        try {
                          await addDoc(collection(db, `courses/${selectedCourse.id}/materials`), {
                            title: materialTitle,
                            type: 'link', // default display type for links
                            url: urlInput.value,
                            createdAt: serverTimestamp()
                          });
                          showMessage("Material link added successfully!", "success");
                          setMaterialTitle('');
                          urlInput.value = '';
                          setUploading(false);
                          fetchMaterials(selectedCourse.id);
                        } catch (error) {
                          console.error("Error adding material link:", error);
                          showMessage("Failed to add material link", "error");
                          setUploading(false);
                        }
                      }}
                      disabled={uploading}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded"
                    >
                      {uploading ? 'Adding...' : 'Add Link Material'}
                    </button>
                    {!materialTitle && <p className="text-xs text-yellow-500 mt-2">Please enter a title before saving.</p>}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Select File to Upload</label>
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      disabled={uploading || !materialTitle}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                      accept={
                        materialType === 'video' ? 'video/*' : 
                        materialType === 'pdf' ? '.pdf' : 
                        'image/*'
                      }
                    />
                    {!materialTitle && <p className="text-xs text-yellow-500 mt-2">Please enter a title before selecting a file.</p>}
                    <p className="text-xs text-blue-400 mt-4 bg-blue-900/40 p-2 rounded border border-blue-500/20">
                      <strong>Note:</strong> Direct file uploads require 'Firebase Storage' to be enabled in your Firebase Console. If uploads fail, please use the 'Video/File Link (URL)' option instead.
                    </p>
                  </div>
                )}
                
                {uploading && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                    <p className="text-xs text-center mt-2 text-gray-400">Uploading: {Math.round(uploadProgress)}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* List of materials */}
            <div className="bg-[#1A0338] p-6 rounded-xl border border-white/10">
              <h3 className="text-xl font-bold mb-4">Current Materials</h3>
              <div className="space-y-3">
                {materials.map(mat => (
                  <div key={mat.id} className="flex justify-between items-center p-3 bg-[#0F0121] rounded border border-white/5">
                    <div className="flex items-center gap-3">
                      {mat.type === 'video' && <Video size={20} className="text-blue-400" />}
                      {mat.type === 'pdf' && <FileText size={20} className="text-red-400" />}
                      {mat.type === 'photo' && <ImageIcon size={20} className="text-green-400" />}
                      {mat.type === 'link' && <LinkIcon size={20} className="text-purple-400" />}
                      <div>
                        <p className="font-bold text-sm">{mat.title}</p>
                        <p className="text-xs text-gray-500 uppercase">{mat.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                     <a href={mat.url} target="_blank" rel="noreferrer" className="text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors">
                        View
                      </a>
                      <button onClick={() => deleteMaterial(mat.id)} className="text-red-400 hover:text-red-300 p-1">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {materials.length === 0 && <p className="text-sm text-gray-400">No materials added yet.</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-black mb-8">Admin Dashboard</h1>

          {message && (
            <div className={`p-4 mb-6 rounded border ${message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
              {message.text}
            </div>
          )}

          <div className="flex space-x-4 mb-8">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 font-bold rounded ${activeTab === 'courses' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Manage Courses
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 font-bold rounded ${activeTab === 'users' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Manage Users
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 font-bold rounded ${activeTab === 'payments' ? 'bg-blue-600' : 'bg-gray-700'}`}
            >
              Payment Requests
            </button>
          </div>

          {activeTab === 'courses' && (
            <div>
              {isAddingCourse ? (
                <div className="bg-[#1A0338] p-6 rounded-xl border border-white/10 mb-8">
                  <h3 className="text-xl font-bold mb-4">{editingCourseId ? 'Edit Course' : 'Add New Course'}</h3>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                    <input type="text" placeholder="Course Title" required className="w-full bg-[#0F0121] border border-white/20 p-2 rounded text-white" value={courseFormData.title} onChange={e => setCourseFormData({...courseFormData, title: e.target.value})} />
                    <textarea placeholder="Description" required className="w-full bg-[#0F0121] border border-white/20 p-2 rounded text-white" value={courseFormData.description} onChange={e => setCourseFormData({...courseFormData, description: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                      <input type="number" placeholder="Price" required className="w-full bg-[#0F0121] border border-white/20 p-2 rounded text-white" value={courseFormData.price} onChange={e => setCourseFormData({...courseFormData, price: e.target.value})} />
                      <input type="text" placeholder="Category" required className="w-full bg-[#0F0121] border border-white/20 p-2 rounded text-white" value={courseFormData.category} onChange={e => setCourseFormData({...courseFormData, category: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="text" placeholder="Duration (e.g. 6 Months)" required className="w-full bg-[#0F0121] border border-white/20 p-2 rounded text-white" value={courseFormData.duration} onChange={e => setCourseFormData({...courseFormData, duration: e.target.value})} />
                      <input type="text" placeholder="Image URL (optional)" className="w-full bg-[#0F0121] border border-white/20 p-2 rounded text-white" value={courseFormData.image} onChange={e => setCourseFormData({...courseFormData, image: e.target.value})} />
                    </div>
                    <div className="flex gap-4">
                      <button type="submit" className="bg-green-600 hover:bg-green-500 px-6 py-2 rounded font-bold">{editingCourseId ? 'Save Changes' : 'Create'}</button>
                      <button type="button" onClick={() => { setIsAddingCourse(false); setEditingCourseId(null); setCourseFormData({ title: '', description: '', price: '', category: '', duration: '', image: '' }); }} className="bg-gray-600 hover:bg-gray-500 px-6 py-2 rounded font-bold">Cancel</button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mb-4 flex flex-wrap gap-4">
                  <button onClick={() => setIsAddingCourse(true)} className="bg-green-600 hover:bg-green-500 px-4 py-2 font-bold rounded flex items-center gap-2 text-sm">
                    <Upload size={18}/> Add New Course
                  </button>
                  {courses.length === 0 && (
                    <button onClick={importMockCourses} className="bg-purple-600 hover:bg-purple-500 px-4 py-2 font-bold rounded flex items-center gap-2 text-sm" disabled={isLoadingData}>
                      <Database size={18}/> Import Default Courses
                    </button>
                  )}
                </div>
              )}
              <div className="grid gap-4">
                {courses.map(course => (
                  <div key={course.id} className="p-4 border border-white/20 rounded bg-[#1A0338] flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-xl">{course.title}</h3>
                      <p className="text-sm text-gray-400">Price: ${course.price} | Category: {course.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedCourse(course)}
                        className="text-sm bg-purple-600 hover:bg-purple-500 transition-colors px-3 py-1 rounded flex items-center gap-2"
                      >
                       <FileText size={16}/> Materials
                      </button>
                      <button 
                        onClick={() => startEditCourse(course)}
                        className="text-sm bg-blue-600 hover:bg-blue-500 transition-colors px-3 py-1 rounded flex items-center gap-2"
                      >
                        Edit
                      </button>
                      <button onClick={() => handleDeleteCourse(course.id)} className="text-sm bg-red-600 hover:bg-red-500 px-3 py-1 rounded flex items-center gap-2">
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {courses.length === 0 && <p>No courses found.</p>}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div className="grid gap-4">
                {users.map(u => (
                  <div key={u.id} className="p-4 border border-white/20 rounded bg-[#1A0338] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-white/20" />
                      ) : (
                        <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <UserCircle size={24} className="text-blue-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-xl">{u.name || 'Unnamed User'}</h3>
                        <p className="text-sm text-gray-400">Role: {u.role} | UID: {u.id}</p>
                        <p className="text-sm text-gray-400">Phone: {u.phone || 'N/A'} | Status: Active</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => startEnrollUser(u)} 
                        className="px-4 py-2 rounded text-sm font-bold bg-green-600 hover:bg-green-500"
                      >
                        Enroll User
                      </button>
                      <button 
                        onClick={() => handleUpdateRole(u.id, u.role)} 
                        className={`px-4 py-2 rounded text-sm font-bold ${u.id === user?.uid ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}
                        disabled={u.id === user?.uid}
                      >
                        {u.role === 'admin' ? 'Make Student' : 'Make Admin'}
                      </button>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <p>No users found.</p>}
              </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Pending Payment Requests (UPI)</h2>
              <div className="grid gap-4">
                {users.flatMap(u => 
                  (u.paymentRequests || [])
                    .map((req: any) => ({ ...req, user: u }))
                )
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((req, idx) => (
                  <div key={`${req.user.id}-${idx}`} className="p-4 border border-white/20 rounded bg-[#1A0338] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-bold text-lg text-white">Course: {req.courseTitle}</h3>
                      <p className="text-sm text-gray-400">User: {req.user.name || 'Unknown'} ({req.user.email || req.user.phone})</p>
                      <p className="text-sm font-mono text-blue-300 mt-2">UTR/Ref: {req.utrCode}</p>
                      <p className="text-xs text-gray-500 mt-1">Date: {new Date(req.date).toLocaleString()}</p>
                    </div>
                    <div>
                      {req.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApprovePayment(req.user.id, req, req.user)}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded text-sm transition-colors"
                          >
                            Verify & Approve
                          </button>
                        </div>
                      ) : (
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                          Approved
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {users.flatMap(u => u.paymentRequests || []).length === 0 && (
                  <p className="text-gray-400">No payment requests found.</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
