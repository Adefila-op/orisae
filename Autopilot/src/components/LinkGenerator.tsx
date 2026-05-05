'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Zap, AlertCircle, Loader } from 'lucide-react'
import axios from 'axios'
import { getAuthHeaderValue } from '@/lib/api-client'
import { detectPlatform, getPlatformInfo, isValidUrl } from '@/lib/platform-detector'

interface GeneratedLink {
  id: string
  code: string
  short_url: string
  target_url: string
  platform: string
  platform_name: string
  platform_icon: string
  platform_color: string
  offer_type: string
  offer_value: number
  created_at: string
}

interface SupportedPlatform {
  value: string
  label: string
  icon: string
}

export default function LinkGenerator() {
  const [productUrl, setProductUrl] = useState('')
  const [offerType, setOfferType] = useState('recovery')
  const [offerValue, setOfferValue] = useState(10)
  const [loading, setLoading] = useState(false)
  const [generatedLink, setGeneratedLink] = useState<GeneratedLink | null>(null)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [platforms, setPlatforms] = useState<SupportedPlatform[]>([])
  const [detectedPlatform, setDetectedPlatform] = useState('')

  useEffect(() => {
    fetchPlatforms()
  }, [])

  async function fetchPlatforms() {
    try {
      const response = await axios.get('/api/links/platforms')
      setPlatforms(response.data.platforms)
    } catch (error) {
      console.error('Error fetching platforms:', error)
    }
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const url = e.target.value
    setProductUrl(url)
    setError('')

    // Detect platform in real-time
    if (url.trim()) {
      const detection = detectPlatform(url)
      setDetectedPlatform(detection.platform)
    }
  }

  async function generateLink() {
    if (!productUrl.trim()) {
      setError('Please paste a product URL')
      return
    }

    if (!isValidUrl(productUrl)) {
      setError('Invalid URL format. Please enter a valid product URL.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/api/links/generate', {
        product_url: productUrl,
        offer_type: offerType,
        offer_value: offerValue,
      }, {
        headers: {
          Authorization: getAuthHeaderValue(),
        },
      })

      setGeneratedLink(response.data.link)
      setProductUrl('')
      setDetectedPlatform('')
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'Failed to generate link')
      } else {
        setError('Failed to generate link')
      }
      console.error('Error generating link:', error)
    } finally {
      setLoading(false)
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const platformInfo = detectedPlatform ? getPlatformInfo(detectedPlatform as any) : null

  return (
    <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/30 border border-slate-700 rounded-2xl p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg flex items-center justify-center">
          <Zap size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Link Generator</h2>
          <p className="text-slate-400 text-sm">Convert any product link into a trackable smart link</p>
        </div>
      </div>

      {/* Main Form */}
      <div className="space-y-6">
        {/* URL Input Section */}
        <div>
          <label className="block text-sm font-semibold text-white mb-3">Product URL</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Paste your Gumroad, Stripe, Shopify link here..."
              value={productUrl}
              onChange={handleUrlChange}
              className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 hover:border-slate-500 focus:border-blue-500 focus:outline-none text-white placeholder-slate-500 transition"
            />
            {detectedPlatform && platformInfo && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2 bg-slate-700 px-3 py-1 rounded-full">
                <span className="text-lg">{platformInfo.icon}</span>
                <span className="text-sm font-medium text-slate-200">{platformInfo.name}</span>
              </div>
            )}
          </div>
          {platformInfo && (
            <p className="text-xs text-slate-400 mt-2">
              ✓ Platform detected: {platformInfo.name}
            </p>
          )}
        </div>

        {/* Offer Settings */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Offer Type</label>
            <select
              value={offerType}
              onChange={(e) => setOfferType(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 hover:border-slate-500 focus:border-blue-500 focus:outline-none text-white transition"
            >
              <option value="recovery">Recovery Offer</option>
              <option value="upsell">Upsell</option>
              <option value="discount">Discount</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-white mb-2">Offer Value (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={offerValue}
              onChange={(e) => setOfferValue(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 hover:border-slate-500 focus:border-blue-500 focus:outline-none text-white transition"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generateLink}
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-700 px-6 py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 transform hover:scale-105 disabled:scale-100"
        >
          {loading ? (
            <>
              <Loader size={18} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap size={18} />
              Generate Smart Link
            </>
          )}
        </button>
      </div>

      {/* Generated Link Display */}
      {generatedLink && (
        <div className="mt-8 pt-8 border-t border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">{generatedLink.platform_icon}</span>
            <h3 className="text-lg font-bold text-white">Your Trackable Link</h3>
          </div>

          <div className="space-y-3">
            {/* Short URL */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2 block">
                Trackable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink.short_url}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(generatedLink.short_url, 'short_url')}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-white"
                >
                  {copiedId === 'short_url' ? (
                    <Check size={18} className="text-green-400" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Link Code */}
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-2 block">
                Link Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={generatedLink.code}
                  className="flex-1 px-4 py-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm font-mono"
                />
                <button
                  onClick={() => copyToClipboard(generatedLink.code, 'code')}
                  className="px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition text-white"
                >
                  {copiedId === 'code' ? (
                    <Check size={18} className="text-green-400" />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Platform & Offer Info */}
            <div className="grid md:grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Platform</p>
                <p className="text-white font-semibold mt-1">{generatedLink.platform_name}</p>
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Offer</p>
                <p className="text-white font-semibold mt-1">
                  {generatedLink.offer_type} ({generatedLink.offer_value}%)
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-300 font-semibold mb-2">💡 Tips for using your link:</p>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• Share the trackable link wherever you promote your product</li>
                <li>• Track all clicks and conversions automatically</li>
                <li>• Monitor intent scores in your dashboard</li>
                <li>• Offers are triggered automatically based on user behavior</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Supported Platforms List */}
      {!generatedLink && (
        <div className="mt-8 pt-8 border-t border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wide">Supported Platforms</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {platforms.map((platform) => (
              <div
                key={platform.value}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition"
              >
                <span className="text-lg">{platform.icon}</span>
                <span className="text-sm text-slate-300">{platform.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
