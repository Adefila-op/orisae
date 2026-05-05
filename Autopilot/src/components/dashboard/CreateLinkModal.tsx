'use client'

import { X, Plus, Minus } from 'lucide-react'
import { useState } from 'react'
import { linksAPI } from '@/lib/api-client'

interface CreateLinkModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function CreateLinkModal({ onClose, onSuccess }: CreateLinkModalProps) {
  const [formData, setFormData] = useState({
    target_url: '',
    offer_type: 'recovery',
    offer_value: 15,
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await linksAPI.create({
        target_url: formData.target_url,
        offer_type: formData.offer_type,
        offer_value: formData.offer_value,
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error creating link:', error.response?.data?.error || error.message)
      alert('Failed to create link: ' + (error.response?.data?.error || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Create Smart Link</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-700 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target URL */}
          <div>
            <label className="block text-sm font-semibold mb-2">Product URL</label>
            <input
              type="url"
              placeholder="https://example.com/product"
              value={formData.target_url}
              onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          {/* Offer Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">Offer Type</label>
            <select
              value={formData.offer_type}
              onChange={(e) => setFormData({ ...formData, offer_type: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="recovery">Recovery (High Intent)</option>
              <option value="discount">Discount (Medium Intent)</option>
              <option value="upsell">Upsell (Low Intent)</option>
              <option value="bundle">Bundle (Testing)</option>
            </select>
          </div>

          {/* Offer Value */}
          <div>
            <label className="block text-sm font-semibold mb-2">Offer Value (%)</label>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    offer_value: Math.max(0, formData.offer_value - 5),
                  })
                }
                className="p-2 hover:bg-slate-700 rounded-lg transition"
              >
                <Minus size={20} />
              </button>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.offer_value}
                onChange={(e) =>
                  setFormData({ ...formData, offer_value: parseInt(e.target.value) })
                }
                className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-center focus:border-blue-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    offer_value: Math.min(100, formData.offer_value + 5),
                  })
                }
                className="p-2 hover:bg-slate-700 rounded-lg transition"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-600 hover:border-slate-400 rounded-lg py-2 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg py-2 font-semibold transition"
            >
              {loading ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
