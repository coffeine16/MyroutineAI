import React, { useState } from 'react';
import { Eye, EyeOff, Sparkles, Target, TrendingUp } from 'lucide-react';
import { auth, googleProvider } from '../../lib/firebase.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

const AuthForm = ({ onAuthSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoginMode && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      let result;
      if (isLoginMode) {
        result = await signInWithEmailAndPassword(auth, email, password);
      } else {
        result = await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess(result.user);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      localStorage.setItem("googleAccessToken", token);
      onAuthSuccess(result.user);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 overflow-auto">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="min-h-full flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center relative z-10 p-8 xl:p-12">
          <div className="text-center max-w-lg">
            {/* Logo with animation */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 blur-2xl opacity-30 rounded-full"></div>
              <div className="relative bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 text-transparent bg-clip-text">
                <Target className="w-16 h-16 xl:w-20 xl:h-20 mx-auto mb-4 text-emerald-400 animate-pulse" />
                <h1 className="text-4xl xl:text-6xl font-bold mb-2">MyRoutineAI</h1>
              </div>
            </div>
            
            <h2 className="text-2xl xl:text-3xl font-bold text-white mb-4">
              Turn Tasks Into <span className="text-emerald-400">Victories</span>
            </h2>
            <p className="text-lg xl:text-xl text-zinc-300 mb-8 leading-relaxed">
              Your AI-powered productivity companion that transforms chaos into organized success
            </p>

            {/* Feature highlights */}
            <div className="space-y-4 text-left">
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 xl:w-12 xl:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                  <Sparkles className="w-5 h-5 xl:w-6 xl:h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm xl:text-base">AI Task Scheduling</h3>
                  <p className="text-zinc-400 text-xs xl:text-sm">Smart scheduling that adapts to your workflow</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 xl:w-12 xl:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <TrendingUp className="w-5 h-5 xl:w-6 xl:h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm xl:text-base">Progress Tracking</h3>
                  <p className="text-zinc-400 text-xs xl:text-sm">Visualize your productivity journey</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 group">
                <div className="w-10 h-10 xl:w-12 xl:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                  <Target className="w-5 h-5 xl:w-6 xl:h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm xl:text-base">Goal Achievement</h3>
                  <p className="text-zinc-400 text-xs xl:text-sm">Break down big goals into achievable steps</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-zinc-800/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-2xl border border-zinc-700/50 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 rounded-3xl"></div>
              
              <div className="relative z-10">
                {/* Mobile Logo */}
                <div className="lg:hidden text-center mb-6 sm:mb-8">
                  <div className="relative">
                    <Target className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-emerald-400" />
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-blue-400 text-transparent bg-clip-text mb-2">
                      Daily Tasks
                    </h1>
                  </div>
                </div>

                <div className="text-center mb-6 sm:mb-8">
                  <p className="text-sm sm:text-base text-zinc-400">
                    {isLoginMode ? 'Continue your productivity journey' : 'Start your productivity transformation'}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-900/30 border border-red-700/50 rounded-xl backdrop-blur-sm">
                    <p className="text-red-300 text-xs sm:text-sm font-medium text-center">{error}</p>
                  </div>
                )}

                {/* Google Sign In */}
                <button 
                  type="button" 
                  onClick={handleGoogleSignIn} 
                  className="w-full flex items-center justify-center py-3 sm:py-4 px-4 sm:px-6 mb-4 sm:mb-6 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl shadow-lg group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 relative z-10" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"></path>
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"></path>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"></path>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.012 36.49 44 30.638 44 24c0-1.341-.138-2.65-.389-3.917z"></path>
                  </svg>
                  <span className="relative z-10 text-sm sm:text-base">Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative flex py-3 sm:py-4 items-center">
                  <div className="flex-grow border-t border-zinc-600"></div>
                  <span className="flex-shrink mx-3 sm:mx-4 text-zinc-400 text-xs sm:text-sm font-medium bg-zinc-800 px-2">or</span>
                  <div className="flex-grow border-t border-zinc-600"></div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-zinc-200">Email Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-zinc-700/70" 
                      placeholder="your@email.com" 
                      required 
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-zinc-200">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-zinc-700/70 pr-12" 
                        placeholder="Enter your password" 
                        required 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                      </button>
                    </div>
                  </div>

                  {!isLoginMode && (
                    <div className="space-y-1 sm:space-y-2">
                      <label className="block text-xs sm:text-sm font-semibold text-zinc-200">Confirm Password</label>
                      <div className="relative">
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          className="w-full bg-zinc-700/50 border border-zinc-600 rounded-xl p-3 sm:p-4 text-sm sm:text-base text-white placeholder-zinc-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm hover:bg-zinc-700/70 pr-12" 
                          placeholder="Confirm your password" 
                          required 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                          className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-emerald-400 transition-colors duration-200"
                        >
                          {showConfirmPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25 relative overflow-hidden group"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3"></div>
                        <span className="text-sm sm:text-base">
                          {isLoginMode ? 'Signing In...' : 'Creating Account...'}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-200"></div>
                        <span className="relative z-10 text-sm sm:text-base">
                          {isLoginMode ? 'Sign In' : 'Start Your Journey'}
                        </span>
                      </>
                    )}
                  </button>
                </form>

                {/* Switch Mode */}
                <div className="text-center mt-6 sm:mt-8">
                  <p className="text-zinc-400 text-sm sm:text-base">
                    <span>{isLoginMode ? "New to MyRoutineAI?" : "Already a user?"}</span>
                    <button 
                      type="button" 
                      onClick={() => setIsLoginMode(!isLoginMode)} 
                      className="font-semibold text-emerald-400 hover:text-emerald-300 ml-2 transition-colors duration-200 hover:underline"
                    >
                      {isLoginMode ? 'Create Account' : 'Sign In'}
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;