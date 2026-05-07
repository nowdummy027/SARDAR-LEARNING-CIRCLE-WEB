import React, { useState, useEffect } from 'react';
import { Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved
        }
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginMethod !== 'phone') return;
    
    const form = e.target as HTMLFormElement;
    const phoneInput = form.querySelector('input[type="tel"]') as HTMLInputElement;
    const phoneNumber = `+91${phoneInput.value}`;

    if (phoneInput.value.length < 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setLoading(true);
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      alert("✅ OTP sent successfully! If you don't receive it, please add your number to 'Phone numbers for testing' in Firebase Console.");
    } catch (error: any) {
      console.error("OTP Error:", error);
      if (error.code === 'auth/operation-not-allowed') {
        alert("Phone Authentication is not enabled. Please go to your Firebase Console -> Authentication -> Sign-in method -> Add Phone provider. Also ensure your region is allowed for SMS in Firebase settings.");
      } else {
        alert("Wait... Failed to send OTP: " + error.message + " (Make sure this domain is added to Authorized Domains in Firebase)");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    
    try {
      setLoading(true);
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) {
        await setDoc(userDocRef, {
          uid: user.uid,
          name: (window as any).signupName || 'Student',
          email: '',
          role: 'student',
          enrolledCourses: [],
          phone: user.phoneNumber || '',
          createdAt: serverTimestamp()
        });
        
        // Clean up
        if ((window as any).signupName) {
           delete (window as any).signupName;
        }
      }
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Verification Error", error);
      if (error.code === 'auth/invalid-verification-code') {
        alert("Invalid OTP entered. Please check and try again. For test numbers, ensure you are using the correct test OTP.");
      } else {
        alert("Verification failed: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      
      if (!docSnap.exists()) {
        // Create new user profile
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || 'Student',
          email: user.email || '',
          role: 'student',
          enrolledCourses: [],
          phone: user.phoneNumber || '',
          createdAt: serverTimestamp()
        });
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, don't show an aggressive alert
        console.log("Sign-in popup closed by user.");
      } else if (error.code === 'auth/network-request-failed') {
        console.error("Authentication Error:", error);
        alert("Network error. Please check your internet connection and try again.");
      } else {
        console.error("Authentication Error:", error);
        alert("Failed to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;

    if (loginMethod === 'phone') {
      if (confirmationResult) {
        handleVerifyOtp(e);
      } else {
        // If it's a sign up, wait for them to fill Name before sending OTP?
        // Actually, name is part of the form, it will just be read during handleVerifyOtp if needed.
        // Let's store the name in state to use during verify OTP.
        const nameInput = form.elements.namedItem('fullName') as HTMLInputElement | null;
        if (!isLogin && !nameInput?.value) {
          alert("Please enter your full name.");
          return;
        }
        
        if (!isLogin && nameInput) {
          // Temporarily attach the typed name to the window or state
          (window as any).signupName = nameInput.value;
        }

        handleSendOtp(e);
      }
    } else {
      // Email/Password login or register
      const emailInput = form.elements.namedItem('email') as HTMLInputElement | null;
      const passwordInput = form.elements.namedItem('password') as HTMLInputElement | null;
      const nameInput = form.elements.namedItem('fullName') as HTMLInputElement | null;

      const email = emailInput?.value;
      const password = passwordInput?.value;

      if (!email || !password) {
        alert("Please enter both email and password.");
        return;
      }

      setLoading(true);
      try {
        if (isLogin) {
          await signInWithEmailAndPassword(auth, email, password);
          navigate('/dashboard');
        } else {
          const name = nameInput?.value;
          if (!name) {
            alert("Please enter your full name.");
            setLoading(false);
            return;
          }

          const result = await createUserWithEmailAndPassword(auth, email, password);
          const user = result.user;
          
          const userDocRef = doc(db, 'users', user.uid);
          await setDoc(userDocRef, {
            uid: user.uid,
            name: name,
            email: email,
            role: 'student',
            enrolledCourses: [],
            phone: '',
            createdAt: serverTimestamp()
          });

          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error("Auth Error:", error);
        if (error.code === 'auth/email-already-in-use') {
          alert("This email is already in use. Switching to sign in...");
          setIsLogin(true);
        } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
          alert("Invalid email or password.");
        } else if (error.code === 'auth/weak-password') {
          alert("Password should be at least 6 characters.");
        } else if (error.code === 'auth/operation-not-allowed') {
          alert("Email/Password Authentication is not enabled. Please go to your Firebase Console -> Authentication -> Sign-in method -> Add Email/Password provider.");
        } else {
          alert("Authentication failed: " + error.message);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0121] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center relative overflow-hidden">
      
      {/* Decorative background circles */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] opacity-70 animate-blob"></div>
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] opacity-70 animate-blob animation-delay-2000"></div>
      
      <div className="bg-[#1A0338] border border-white/10 text-white w-full max-w-md rounded-2xl shadow-2xl p-8 relative z-10">
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black tracking-tighter">
            {isLogin ? 'WELCOME BACK!' : 'CREATE ACCOUNT'}
          </h2>
          <p className="text-gray-400 mt-2 text-sm">
            {isLogin ? 'Sign in to access your courses and notes' : 'Join Sardar Learning Circle today!'}
          </p>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white text-gray-700 hover:bg-gray-100 font-bold py-4 rounded-xl shadow-md border border-gray-300 transition-all text-sm mb-6 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading ? 'WAIT...' : 'Continue with Google'}
        </button>

        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-white/10"></div>
          <span className="px-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold">OR</span>
          <div className="flex-1 border-t border-white/10"></div>
        </div>

        {/* Method Toggle for Login */}
        <div className="flex p-1 bg-[#0F0121] rounded-lg mb-6 border border-white/5">
          <button
            onClick={() => setLoginMethod('email')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
              loginMethod === 'email' ? 'bg-[#2D0B5A] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Email
          </button>
          <button
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all ${
              loginMethod === 'phone' ? 'bg-[#2D0B5A] text-white shadow-sm border border-white/10' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Phone (OTP)
          </button>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {confirmationResult && loginMethod === 'phone' ? (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Enter OTP</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-[#0F0121] border border-white/10 text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600 tracking-[0.5em] text-center"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
            </div>
          ) : (
            <>
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Full Name</label>
                  <div className="relative">
                    <input 
                      name="fullName"
                      type="text" 
                      className="w-full pl-4 pr-10 py-3 bg-[#0F0121] border border-white/10 text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                      placeholder="Rahul Sardar"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {loginMethod === 'email' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Mail size={20} />
                    </div>
                    <input 
                      name="email"
                      type="email" 
                      className="w-full pl-10 pr-4 py-3 bg-[#0F0121] border border-white/10 text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                      placeholder="student@example.com"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Phone Number</label>
                  <div className="relative flex">
                    <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-white/10 bg-[#0F0121] text-gray-400 sm:text-sm font-medium">
                      +91
                    </span>
                    <input 
                      type="tel" 
                      className="flex-1 min-w-0 block w-full px-3 py-3 rounded-none rounded-r-xl bg-[#0F0121] border border-white/10 text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Password only if email login or signup */}
              {loginMethod === 'email' && (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">Password</label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <Lock size={20} />
                    </div>
                    <input 
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-10 pr-10 py-3 bg-[#0F0121] border border-white/10 text-white rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-600"
                      placeholder="••••••••"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-500 hover:text-gray-300" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div id="recaptcha-container"></div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all uppercase text-xs tracking-widest mt-6"
          >
            {loading ? 'PLEASE WAIT...' : (
              confirmationResult && loginMethod === 'phone' ? 'VERIFY OTP' :
              loginMethod === 'phone' ? 'SEND OTP' :
              isLogin ? 'SIGN IN WITH EMAIL' : 'CREATE ACCOUNT WITH EMAIL'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-[10px] uppercase tracking-widest text-gray-400 font-bold">
          {isLogin ? "DON'T HAVE AN ACCOUNT? " : "ALREADY HAVE AN ACCOUNT? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="text-blue-400 hover:text-blue-300 hover:underline inline"
          >
            {isLogin ? 'SIGN UP' : 'SIGN IN'}
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <Link to="/" className="text-[10px] uppercase tracking-widest text-gray-500 hover:text-gray-300 underline">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
