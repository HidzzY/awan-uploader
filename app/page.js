"use client"
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [fileUrl, setFileUrl] = useState('')

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)

    try {
      // --- LOGIKA AUTO DELETE (BERSIH-BERSIH OTOMATIS) ---
      // Mengambil daftar file, diurutkan dari yang paling lama
      const { data: listFiles } = await supabase.storage
        .from('files')
        .list('', { sortBy: { column: 'created_at', order: 'asc' } })

      if (listFiles) {
        // Hitung total ukuran file yang ada dalam bytes
        const currentSize = listFiles.reduce((acc, f) => acc + (f.metadata?.size || 0), 0)
        
        // Batas 50MB (50 * 1024 * 1024 bytes)
        const limitSize = 50 * 1024 * 1024 

        if (currentSize > limitSize) {
          // Ambil 5 file teratas (paling lama) untuk dihapus
          const filesToDelete = listFiles.slice(0, 5).map(f => f.name)
          await supabase.storage.from('files').remove(filesToDelete)
          console.log("Penyimpanan penuh, sistem otomatis menghapus file lama.")
        }
      }

      // --- PROSES UPLOAD FILE BARU ---
      const fileExt = file.name.split('.').pop()
      // Membuat nama file acak agar tidak bentrok
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`

      const { data, error: uploadError } = await supabase.storage
        .from('files') 
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Ambil link publik untuk ditampilkan
      const { data: linkData } = supabase.storage.from('files').getPublicUrl(fileName)
      setFileUrl(linkData.publicUrl)

    } catch (error) {
      alert("Gagal: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6 font-sans">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Hidz Cloud
        </h1>
        <p className="text-zinc-500 text-center text-sm mb-8">Upload gambar, video, atau mp3 gratis</p>
        
        <div className="relative group border-2 border-dashed border-zinc-700 hover:border-blue-500 p-10 rounded-2xl transition-all duration-300 bg-zinc-800/50 flex flex-col items-center cursor-pointer">
          <input 
            type="file" 
            onChange={handleUpload} 
            disabled={loading}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="text-4xl mb-4">☁️</div>
          <p className="text-sm font-medium text-zinc-300">
            {loading ? "Sedang Mengirim..." : "Klik atau Tarik File Ke Sini"}
          </p>
          <p className="text-[10px] text-zinc-500 mt-2">Auto-Purge Aktif: Max 50MB</p>
        </div>

        {fileUrl && (
          <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-4 bg-zinc-800 border border-emerald-500/50 rounded-xl">
              <p className="text-xs text-emerald-400 font-bold mb-2 uppercase tracking-widest">Berhasil di-upload!</p>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={fileUrl} 
                  className="flex-1 p-2 bg-black border border-zinc-700 rounded-lg text-[10px] text-blue-300 focus:outline-none"
                  onClick={(e) => {
                    e.target.select();
                    navigator.clipboard.writeText(fileUrl);
                    alert("Link disalin!");
                  }}
                />
                <a href={fileUrl} target="_blank" rel="noreferrer" className="bg-zinc-700 px-3 py-2 rounded-lg text-xs hover:bg-zinc-600 transition-colors">Buka</a>
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="mt-8 text-zinc-600 text-[10px]">Powered by Next.js & Supabase</p>
    </main>
  )
}