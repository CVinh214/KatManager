'use client';

import { useState, useRef } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface BackgroundSettingsProps {
  onClose: () => void;
  userId: string;
}

export function BackgroundSettings({ onClose, userId }: BackgroundSettingsProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current background
  useState(() => {
    const currentBg = localStorage.getItem(`background_${userId}`);
    if (currentBg) {
      setPreview(currentBg);
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('❌ Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Ảnh quá lớn. Vui lòng chọn ảnh dưới 5MB');
      return;
    }

    setIsLoading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreview(result);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert('❌ Lỗi khi đọc file');
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!preview) {
      return;
    }

    // Save to localStorage with user-specific key
    localStorage.setItem(`background_${userId}`, preview);
    
    // Trigger custom event to update background
    window.dispatchEvent(new CustomEvent('backgroundChanged', { detail: preview }));
    
    onClose();
  };

  const handleRemove = () => {
    if (confirm('Bạn có chắc muốn xóa hình nền?')) {
      localStorage.removeItem(`background_${userId}`);
      setPreview(null);
      
      // Trigger custom event to remove background
      window.dispatchEvent(new CustomEvent('backgroundChanged', { detail: null }));
      
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ImageIcon size={20} className="text-indigo-600" />
            Đổi hình nền
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Xem trước
            </label>
            <div className="relative aspect-video rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-gray-50">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ImageIcon size={48} className="mb-2" />
                  <p className="text-sm">Chưa có hình nền</p>
                </div>
              )}
            </div>
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload size={18} />
              {isLoading ? 'Đang tải...' : 'Chọn ảnh từ thiết bị'}
            </button>

            {preview && (
              <>
                <button
                  onClick={handleSave}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  ✅ Lưu hình nền
                </button>

                <button
                  onClick={handleRemove}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Xóa hình nền
                </button>
              </>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">💡 Lưu ý:</span>
              <br />
              • Ảnh tối đa 5MB
              <br />
              • Hình nền chỉ hiển thị cho tài khoản của bạn
              <br />
              • Ảnh được lưu trên thiết bị này
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
