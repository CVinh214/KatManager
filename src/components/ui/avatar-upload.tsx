/**
 * Avatar Upload Component
 * Allows users to upload and change their profile avatar
 */

'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, User as UserIcon } from 'lucide-react';
import { useSubmitHandler } from '@/hooks/use-submit';
import { LoadingSpinner } from './loading-button';

interface AvatarUploadProps {
  userId: string;
  employeeId?: string;
  currentAvatar?: string;
  userName?: string;
  onAvatarChange?: (newAvatarUrl: string) => void;
}

export function AvatarUpload({ 
  userId, 
  employeeId,
  currentAvatar, 
  userName = 'User',
  onAvatarChange 
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);
  const [isHovered, setIsHovered] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, handleUpload] = useSubmitHandler(async (file: File) => {
    // Convert to base64
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        setPreview(base64String);

        try {
          // Save to database via User API
          const response = await fetch('/api/users/avatar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: userId,
              avatar: base64String,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to save avatar');
          }

          const updated = await response.json();
          onAvatarChange?.(base64String);
          resolve(updated);
        } catch (error) {
          setPreview(currentAvatar || null);
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Vui lòng chọn file ảnh (JPG, PNG, ...)');
      return;
    }

    // Validate file size (max 2MB for avatar)
    if (file.size > 2 * 1024 * 1024) {
      alert('❌ Ảnh quá lớn. Vui lòng chọn ảnh dưới 2MB');
      return;
    }

    try {
      await handleUpload(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('❌ Lỗi khi tải ảnh lên. Vui lòng thử lại.');
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[parts.length - 1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <div className="flex flex-col items-center">
      {/* Photobooth Frame */}
      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Outer Frame - Photobooth Style */}
        <div className="relative p-3 sm:p-4 md:p-5 lg:p-6 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-3xl shadow-2xl border-4 sm:border-[5px] md:border-[6px] border-white">
          {/* Inner Shadow Frame */}
          <div className="relative p-2 sm:p-2.5 md:p-3 lg:p-3.5 bg-gradient-to-br from-gray-100 to-white rounded-2xl shadow-inner">
            {/* Avatar Container */}
            <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105">
              {preview ? (
                <img
                  src={preview}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold">
                    {getInitials(userName)}
                  </span>
                </div>
              )}

              {/* Hover Overlay */}
              <div
                className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
                  isHovered || isUploading ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {isUploading ? (
                  <LoadingSpinner size="lg" className="text-white" />
                ) : (
                  <Camera className="text-white" size={40} />
                )}
              </div>
            </div>
          </div>

          {/* Decorative Corner Elements */}
          {/* <div className="absolute top-0 left-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 border-b-4 border-r-4 border-indigo-400 rounded-br-lg"></div> */}

          {/* Upload Badge */}
          {/* <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-3 sm:p-3.5 md:p-4 rounded-full shadow-lg border-3 sm:border-4 border-white group-hover:scale-110 transition-transform duration-300">
            <Camera size={18} className="sm:w-6 sm:h-6 md:w-7 md:h-7" />
          </div> */}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Hint Text */}
      <div className="mt-3 text-center">
        {!preview && (
          <p className="text-sm text-gray-500 flex items-center gap-1">
            Thích đổi avatar gì thì đổi
          </p>
        )}
        {isUploading && (
          <p className="text-xs text-indigo-600">Đang tải lên...</p>
        )}
        {!isUploading && preview && (
          <p className="text-xs text-gray-400">Click để thay đổi avatar</p>
        )}
      </div>
    </div>
  );
}
