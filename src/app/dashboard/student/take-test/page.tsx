'use client'
export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type TestType = 'vertical_jump' | 'shuttle_run' | 'sit_ups'

/* =======================
   VIDEO UPLOAD COMPONENT
======================= */
function VideoUpload({
  onVideoUrlChange,
  currentVideoUrl
}: {
  onVideoUrlChange: (url: string) => void
  currentVideoUrl?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (!file) return

      if (!file.type.startsWith('video/')) {
        alert('Please select a video file')
        return
      }

      if (file.size > 50 * 1024 * 1024) {
        alert('Video must be under 50MB')
        return
      }

      setUploading(true)
      setUploadProgress(20)

      const ext = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const filePath = `videos/${fileName}`

      const { error } = await supabase.storage
        .from('videos')
        .upload(filePath, file)

      if (error) throw error

      const { data } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath)

      onVideoUrlChange(data.publicUrl)
      setUploadProgress(100)

    } catch (err: any) {
      alert(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      {currentVideoUrl ? (
        <video src={currentVideoUrl} controls className="w-full rounded-lg" />
      ) : (
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          disabled={uploading}
          onChange={handleFileUpload}
        />
      )}

      {uploading && <p>Uploading... {uploadProgress}%</p>}
    </div>
  )
}

/* =======================
   MAIN PAGE
======================= */
export default function TakeTest() {
  const { user } = useAuth()
  const router = useRouter()

  const [selectedTest, setSelectedTest] = useState<TestType | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const [ai, setAi] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  /* 🔥 CLIENT-ONLY AI LOAD */
  useEffect(() => {
    setIsClient(true)

    const loadAI = async () => {
      const mod = await import('@/lib/ai-analysis')
      setAi(mod.fitnessAI)
    }

    loadAI()
  }, [])

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTest || !ai) {
      alert('AI not ready yet. Please wait.')
      return
    }

    setAnalyzing(true)
    setAnalysisProgress(10)

    try {
      const timer = setInterval(() => {
        setAnalysisProgress(p => Math.min(p + 15, 90))
      }, 400)

      let analysis
      switch (selectedTest) {
        case 'vertical_jump':
          analysis = await ai.analyzeVerticalJump(videoUrl)
          break
        case 'shuttle_run':
          analysis = await ai.analyzeShuttleRun(videoUrl)
          break
        case 'sit_ups':
          analysis = await ai.analyzeSitUps(videoUrl)
          break
      }

      clearInterval(timer)
      setAnalysisProgress(100)

      const { error } = await supabase.from('fitness_tests').insert([
        {
          student_id: user.id,
          test_type: selectedTest,
          video_url: videoUrl,
          score: analysis.score,
          ai_suggestions: analysis.suggestions.join('. '),
          ai_metrics: analysis.metrics,
          analysis_type: analysis.analysis_type,
          date: new Date().toISOString()
        }
      ])

      if (error) throw error

      alert('✅ Test submitted successfully')
      router.push('/dashboard/student/results')

    } catch (err: any) {
      alert(err.message || 'Analysis failed')
    } finally {
      setAnalyzing(false)
      setAnalysisProgress(0)
    }
  }

  if (!isClient) return null

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/dashboard/student">← Back</Link>

      {!selectedTest ? (
        <div className="grid grid-cols-3 gap-4 mt-6">
          {(['vertical_jump', 'shuttle_run', 'sit_ups'] as TestType[]).map(t => (
            <button
              key={t}
              onClick={() => setSelectedTest(t)}
              className="border p-4 rounded hover:bg-gray-50"
            >
              {t.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <VideoUpload
            onVideoUrlChange={setVideoUrl}
            currentVideoUrl={videoUrl}
          />

          {analyzing && (
            <div>
              <p>Analyzing... {analysisProgress}%</p>
              <div className="w-full bg-gray-200 h-2">
                <div
                  className="bg-blue-600 h-2"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            disabled={!ai || analyzing}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Submit Test
          </button>
        </form>
      )}
    </div>
  )
}
