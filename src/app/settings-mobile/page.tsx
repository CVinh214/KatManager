"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Smartphone, Bell, Zap, Share2, X, Share, Plus, MoreVertical, Download, AlertCircle, Chrome, Globe, ChevronLeft } from 'lucide-react'

// Types
export type BrowserType = 'safari' | 'chrome' | 'firefox' | 'edge' | 'samsung' | 'opera' | 'other'

// Utils
function detectBrowser(): BrowserType {
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent.toLowerCase()

  if (userAgent.includes('samsungbrowser')) {
    return 'samsung'
  }

  if (userAgent.includes('opr/') || userAgent.includes('opera')) {
    return 'opera'
  }

  if (userAgent.includes('edg/')) {
    return 'edge'
  }

  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return 'chrome'
  }

  if (userAgent.includes('firefox')) {
    return 'firefox'
  }

  if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
    return 'safari'
  }

  return 'other'
}

function detectPlatform(): 'ios' | 'android' | 'other' {
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent.toLowerCase()

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios'
  }

  if (/android/.test(userAgent)) {
    return 'android'
  }

  return 'other'
}

// Components
interface BenefitCardProps {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

function BenefitCard({ icon, title, description, color }: BenefitCardProps) {
  return (
    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

interface Browser {
  id: BrowserType
  name: string
  icon: React.ReactNode
}

interface BrowserSelectorProps {
  platform: 'ios' | 'android' | 'other'
  selectedBrowser: BrowserType
  onSelectBrowser: (browser: BrowserType) => void
  detectedBrowser?: BrowserType
}

function BrowserSelector({
  platform,
  selectedBrowser,
  onSelectBrowser,
  detectedBrowser,
}: BrowserSelectorProps) {
  const iosBrowsers: Browser[] = [
    { id: 'safari', name: 'Safari', icon: <Globe className="w-4 h-4" /> },
    { id: 'chrome', name: 'Chrome', icon: <Chrome className="w-4 h-4" /> },
    { id: 'firefox', name: 'Firefox', icon: <Globe className="w-4 h-4" /> },
    { id: 'edge', name: 'Edge', icon: <Globe className="w-4 h-4" /> },
  ]

  const androidBrowsers: Browser[] = [
    { id: 'chrome', name: 'Chrome', icon: <Chrome className="w-4 h-4" /> },
    { id: 'samsung', name: 'Samsung Internet', icon: <Globe className="w-4 h-4" /> },
    { id: 'firefox', name: 'Firefox', icon: <Globe className="w-4 h-4" /> },
    { id: 'edge', name: 'Edge', icon: <Globe className="w-4 h-4" /> },
    { id: 'opera', name: 'Opera', icon: <Globe className="w-4 h-4" /> },
  ]

  const browsers = platform === 'ios' ? iosBrowsers : androidBrowsers

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Chọn trình duyệt của bạn</h3>
        {detectedBrowser && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Đã phát hiện</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {browsers.map((browser) => (
          <button
            key={browser.id}
            onClick={() => onSelectBrowser(browser.id)}
            className={`relative flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
              selectedBrowser === browser.id
                ? 'border-blue-600 bg-blue-50 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {browser.icon}
            <span className="text-sm font-medium">{browser.name}</span>
            {detectedBrowser === browser.id && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

interface Step {
  icon: React.ReactNode
  title: string
  description: string
}

interface InstallGuideProps {
  platform: 'ios' | 'android' | 'other'
  browser: BrowserType
}

function InstallGuide({ platform, browser }: InstallGuideProps) {
  const iosSafariSteps: Step[] = [
    {
      icon: <Share className="w-6 h-6" />,
      title: 'Mở menu Chia sẻ',
      description: 'Nhấn vào nút Chia sẻ (biểu tượng mũi tên hướng lên) ở thanh công cụ dưới cùng',
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: 'Thêm vào Màn hình chính',
      description: 'Cuộn xuống và chọn "Thêm vào Màn hình chính"',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Xác nhận cài đặt',
      description: 'Nhấn "Thêm" ở góc trên bên phải để hoàn tất. Ứng dụng sẽ xuất hiện trên màn hình chính của bạn',
    },
  ]

  const iosChromeSteps: Step[] = [
    {
      icon: <Share className="w-6 h-6" />,
      title: 'Mở menu Chia sẻ',
      description: 'Nhấn vào biểu tượng Chia sẻ (mũi tên hướng lên) ở góc trên bên phải hoặc thanh công cụ dưới',
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: 'Thêm vào Màn hình chính',
      description: 'Cuộn xuống danh sách và chọn "Thêm vào Màn hình chính"',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Hoàn tất',
      description: 'Nhấn "Thêm" để xác nhận. Ứng dụng sẽ xuất hiện trên màn hình chính',
    },
  ]

  const iosOtherSteps: Step[] = [
    {
      icon: <AlertCircle className="w-6 h-6" />,
      title: 'Mở bằng Safari',
      description: 'Để cài đặt tốt nhất trên iOS, vui lòng mở trang web này bằng trình duyệt Safari',
    },
    {
      icon: <Share className="w-6 h-6" />,
      title: 'Sao chép URL',
      description: 'Sao chép địa chỉ trang web và mở lại trong Safari để thực hiện cài đặt',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Làm theo hướng dẫn Safari',
      description: 'Sau khi mở trong Safari, làm theo các bước hướng dẫn cho trình duyệt Safari',
    },
  ]

  const androidChromeSteps: Step[] = [
    {
      icon: <MoreVertical className="w-6 h-6" />,
      title: 'Mở menu trình duyệt',
      description: 'Nhấn vào biểu tượng ba chấm (⋮) ở góc trên bên phải',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Cài đặt ứng dụng',
      description: 'Chọn "Cài đặt ứng dụng" hoặc "Thêm vào Màn hình chính"',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Xác nhận cài đặt',
      description: 'Nhấn "Cài đặt" trong hộp thoại xuất hiện. Ứng dụng sẽ được thêm vào màn hình chính',
    },
  ]

  const androidSamsungSteps: Step[] = [
    {
      icon: <MoreVertical className="w-6 h-6" />,
      title: 'Mở menu',
      description: 'Nhấn vào biểu tượng ba gạch ngang (≡) ở góc dưới bên phải',
    },
    {
      icon: <Plus className="w-6 h-6" />,
      title: 'Thêm trang vào',
      description: 'Chọn "Thêm trang vào" > "Màn hình chính"',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Hoàn tất',
      description: 'Nhấn "Thêm" để xác nhận. Biểu tượng ứng dụng sẽ xuất hiện trên màn hình chính',
    },
  ]

  const androidFirefoxSteps: Step[] = [
    {
      icon: <MoreVertical className="w-6 h-6" />,
      title: 'Mở menu',
      description: 'Nhấn vào biểu tượng ba chấm (⋮) ở góc trên hoặc dưới bên phải',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Cài đặt',
      description: 'Chọn "Cài đặt" hoặc biểu tượng tải xuống với dấu cộng',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Xác nhận',
      description: 'Nhấn "Thêm" hoặc "Cài đặt" trong hộp thoại để hoàn tất',
    },
  ]

  const androidEdgeSteps: Step[] = [
    {
      icon: <MoreVertical className="w-6 h-6" />,
      title: 'Mở menu',
      description: 'Nhấn vào biểu tượng ba chấm (⋮) ở thanh công cụ dưới cùng',
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Thêm vào Màn hình chính',
      description: 'Chọn "Thêm vào Màn hình chính" hoặc biểu tượng cài đặt',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Xác nhận',
      description: 'Nhấn "Thêm" hoặc "Cài đặt" để hoàn tất quá trình',
    },
  ]

  let steps: Step[] = androidChromeSteps
  let browserNote = ''

  if (platform === 'ios') {
    if (browser === 'safari') {
      steps = iosSafariSteps
      browserNote = 'Sử dụng Safari để có trải nghiệm tốt nhất'
    } else if (browser === 'chrome') {
      steps = iosChromeSteps
      browserNote = 'Hướng dẫn cho Chrome trên iOS'
    } else {
      steps = iosOtherSteps
      browserNote = 'Khuyến nghị: Sử dụng Safari để cài đặt trên iOS'
    }
  } else {
    if (browser === 'chrome') {
      steps = androidChromeSteps
      browserNote = 'Hướng dẫn cho Chrome trên Android'
    } else if (browser === 'samsung') {
      steps = androidSamsungSteps
      browserNote = 'Hướng dẫn cho Samsung Internet'
    } else if (browser === 'firefox') {
      steps = androidFirefoxSteps
      browserNote = 'Hướng dẫn cho Firefox trên Android'
    } else if (browser === 'edge' || browser === 'opera') {
      steps = androidEdgeSteps
      browserNote = `Hướng dẫn cho ${browser === 'edge' ? 'Edge' : 'Opera'} trên Android`
    } else {
      steps = androidChromeSteps
      browserNote = 'Hướng dẫn chung cho Android'
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">
          {platform === 'ios' ? 'Hướng dẫn cho iPhone/iPad' : 'Hướng dẫn cho Android'}
        </h2>
        <p className="text-sm text-gray-600">{browserNote}</p>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              {step.icon}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-semibold">
                  {index + 1}
                </span>
                <h3 className="font-semibold">{step.title}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Main Component
export function PWAInstallGuide() {
  const router = useRouter()
  const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other')
  const [browser, setBrowser] = useState<BrowserType>('chrome')
  const [detectedBrowser, setDetectedBrowser] = useState<BrowserType | undefined>()
  const [showBanner, setShowBanner] = useState(true)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    const detectedPlatform = detectPlatform()
    setPlatform(detectedPlatform === 'other' ? 'android' : detectedPlatform)

    const currentBrowser = detectBrowser()
    setBrowser(currentBrowser)
    setDetectedBrowser(currentBrowser)

    const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
    if (isStandalone) {
      setIsInstallable(false)
    } else {
      setIsInstallable(true)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white px-6 pt-4 pb-8">
        <div className="md-full mx-full">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 mb-3 text-white hover:opacity-90"
          >
            <ChevronLeft className="w-5 h-5" />
            <strong className="text-sm">Quay lại</strong>
          </button>

          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Smartphone className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Cài đặt Ứng dụng</h1>
          <p className="text-blue-100 leading-relaxed">
            Vì hạn chế về công nghệ và kiến thức, các bạn vui lòng thực hiện thủ công để cài đặt ứng dụng giúp mình nhé.
          </p>
        </div>
      </div>

      {isInstallable && showBanner && (
        <div className="sticky top-0 z-10 bg-yellow-50 border-b border-yellow-200 px-6 py-3">
          <div className="md-full mx-full flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-yellow-900" />
              </div>
              <p className="text-sm font-medium text-yellow-900">Cài đặt ngay để trải nghiệm tốt hơn</p>
            </div>
            <button onClick={() => setShowBanner(false)} className="text-yellow-600 hover:text-yellow-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="px-6 py-8 md-full mx-full space-y-8 text-gray-900">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Lợi ích khi cài đặt</h2>
          <div className="grid gap-4">
            <BenefitCard icon={<Zap className="w-6 h-6 text-purple-600" />} title="Truy cập nhanh chóng" description="Mở ứng dụng ngay từ màn hình chính, không cần mở trình duyệt" color="bg-purple-100" />
            <BenefitCard icon={<Bell className="w-6 h-6 text-green-600" />} title="Nhận thông báo" description="Cập nhật ngay lập tức các thông báo quan trọng từ quản lý" color="bg-green-100" />
            <BenefitCard icon={<Smartphone className="w-6 h-6 text-blue-600" />} title="Trải nghiệm như app" description="Giao diện toàn màn hình, mượt mà như một ứng dụng thật sự" color="bg-blue-100" />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold">Chọn thiết bị của bạn</h3>
          <div className="flex gap-2">
            <button onClick={() => setPlatform('ios')} className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              platform === 'ios' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            >
              iPhone/iPad
            </button>
            <button onClick={() => setPlatform('android')} className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              platform === 'android' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            >
              Android
            </button>
          </div>
        </div>

        <BrowserSelector platform={platform} selectedBrowser={browser} onSelectBrowser={setBrowser} detectedBrowser={detectedBrowser} />

        <InstallGuide platform={platform} browser={browser} />

        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm text-blue-900 leading-relaxed"><strong>Lưu ý:</strong> Sau khi cài đặt, ứng dụng sẽ hoạt động độc lập và bạn có thể nhận thông báo ngay cả khi không mở trình duyệt.</p>
        </div>
      </div>
    </div>
  )
}

export default function Page() {
  return <PWAInstallGuide />
}
