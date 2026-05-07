import { Share2, MessageCircle, Facebook, Twitter, Linkedin, Link2, Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@/lib/i18n'

interface SocialShareProps {
  title: string
  text: string
  url?: string
  variant?: 'buttons' | 'compact'
}

export default function SocialShare({ title, text, url, variant = 'buttons' }: SocialShareProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n\n${shareUrl}`)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const handleLinkedInShare = () => {
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    window.open(linkedinUrl, '_blank', 'width=600,height=400')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy link', err)
    }
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 font-medium">
          {t('growth.share', 'Share')}:
        </span>
        <button
          onClick={handleWhatsAppShare}
          className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors"
          title="Share on WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </button>
        <button
          onClick={handleFacebookShare}
          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
          title="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
        </button>
        <button
          onClick={handleTwitterShare}
          className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors"
          title="Share on Twitter"
        >
          <Twitter className="w-4 h-4" />
        </button>
        <button
          onClick={handleCopyLink}
          className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors"
          title="Copy link"
        >
          {copied ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  // Full buttons variant
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="w-5 h-5 text-imboni-blue" />
        <h3 className="font-semibold text-slate-800">
          {t('growth.share_title', 'Share ImboniServe')}
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* WhatsApp */}
        <button
          onClick={handleWhatsAppShare}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-medium"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp
        </button>

        {/* Facebook */}
        <button
          onClick={handleFacebookShare}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium"
        >
          <Facebook className="w-5 h-5" />
          Facebook
        </button>

        {/* Twitter */}
        <button
          onClick={handleTwitterShare}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl transition-colors font-medium"
        >
          <Twitter className="w-5 h-5" />
          Twitter
        </button>

        {/* LinkedIn */}
        <button
          onClick={handleLinkedInShare}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-colors font-medium"
        >
          <Linkedin className="w-5 h-5" />
          LinkedIn
        </button>
      </div>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium"
      >
        {copied ? (
          <>
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-600">{t('growth.link_copied', 'Link Copied!')}</span>
          </>
        ) : (
          <>
            <Link2 className="w-5 h-5" />
            {t('growth.copy_link', 'Copy Link')}
          </>
        )}
      </button>
    </div>
  )
}
