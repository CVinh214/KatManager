'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { LogIn, Heart, X } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsHydrated(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', email);
      const success = await login(email, password);
      console.log('Login result:', success);

      if (success) {
        console.log('Login successful, redirecting...');
        // Navigate immediately to dashboard; use replace to avoid extra history entry
        router.replace('/dashboard');
      }
      else {
        setError('Email/SĐT hoặc mật khẩu không đúng');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Có lỗi xảy ra, vui lòng thử lại');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-indigo-600 rounded-full mb-3 sm:mb-4">
              <LogIn className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Đăng nhập</h1>
            <p className="text-gray-600 mt-1.5 sm:mt-2 text-sm sm:text-base">Quản lý nhân viên và lịch làm việc</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
                Email hoặc SĐT
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                placeholder="Nhập email hoặc số điện thoại"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-1.5 sm:mb-2">
                Mật khẩu
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2.5 sm:py-2 px-4 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          {/* Donate Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setShowDonate(true)}
              className="w-full flex items-center justify-center gap-2 text-pink-600 hover:text-pink-700 font-medium text-sm transition-colors"
            >
              <Heart size={18} className="fill-pink-600" />
              Dự án nuôi tôi ☕
            </button>
          </div>
        </div>

        {/* Donate Modal */}
        {showDonate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowDonate(false)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Heart size={24} className="fill-pink-600 text-pink-600" />
                  Dự án nuôi tôi
                </h2>
                <button
                  onClick={() => setShowDonate(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6">
                <p className="text-gray-600 mb-6 text-center">
                  Nếu bạn thấy dự án này hữu ích, hãy mua cho tôi một ly cà phê ☕
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* MBBank */}
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg mb-3">
                      <img 
                        src="/donate/MBBank.jpg" 
                        alt="MBBank QR Code" 
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                    </div>
                    <p className="font-semibold text-gray-900">MBBank</p>
                  </div>

                  {/* Momo */}
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-lg mb-3">
                      <img 
                        src="/donate/Momo.jpg" 
                        alt="Momo QR Code" 
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                    </div>
                    <p className="font-semibold text-gray-900">Momo</p>
                  </div>

                  {/* Viettinbank */}
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg mb-3">
                      <img 
                        src="/donate/Viettinbank.jpg" 
                        alt="Viettinbank QR Code" 
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                    </div>
                    <p className="font-semibold text-gray-900">Viettinbank</p>
                  </div>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                  Cảm ơn bạn đã ủng hộ! 🙏💝
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
