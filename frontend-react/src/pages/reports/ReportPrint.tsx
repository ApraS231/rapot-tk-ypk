import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  Printer, 
  ArrowLeft, 
  Loader2, 
  Activity, 
  MessageSquare, 
  Heart, 
  Brain, 
  Home, 
  Star,
  Award,
  CheckCircle,
  FileCheck2,
  ExternalLink
} from 'lucide-react';

interface ReportPrintProps {
  isEmbed?: boolean;
}

interface StudentData {
  id: number;
  name: string;
  age: number;
  birth_date: string;
  special_needs: string | null;
  class_name: string | null;
  teacher_name: string;
}

interface AssessmentData {
  id: number;
  period: string;
  motoric: string;
  language: string;
  social: string;
  cognitive: string;
  independence: string;
  summary: string;
  created_at: string | null;
}

interface EvaluationData {
  id: number;
  date: string | null;
  composite_index: number;
  index_percentage: number;
  predicate: 'BSB' | 'BSH' | 'MB' | 'BB';
  avg_cognitive: number;
  avg_motoric: number;
  avg_language: number;
  avg_social: number;
  avg_independence: number;
}

interface ReportDetails {
  student: StudentData;
  assessment: AssessmentData | null;
  evaluation: EvaluationData | null;
  school_name: string;
}

export const ReportPrint: React.FC<ReportPrintProps> = ({ isEmbed = false }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [data, setData] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportDetails = async () => {
      try {
        const res = await fetch(`/api/reports/${id}`);
        if (res.ok) {
          const reportData = await res.json();
          setData(reportData);
        } else {
          showToast('Laporan tidak ditemukan.', 'error');
          navigate('/reports');
        }
      } catch (err) {
        showToast('Koneksi internet bermasalah.', 'error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReportDetails();
    }
  }, [id, navigate, showToast]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Memproses dokumen raport...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { student, assessment, evaluation, school_name } = data;

  // Inline stylesheet for printable layout print-only CSS
  const printStyles = `
    @media print {
      body {
        background-color: white !important;
        color: #000 !important;
      }
      .no-print {
        display: none !important;
      }
      .print-shadow-none {
        box-shadow: none !important;
        border: none !important;
      }
      .print-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
      }
      .page-break {
        page-break-before: always;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        margin: 1.5cm;
      }
    }
  `;

  return (
    <div className={`min-h-screen ${isEmbed ? 'p-0 space-y-6' : 'bg-slate-100 py-8 px-4 flex flex-col items-center'}`}>
      <style>{printStyles}</style>

      {/* Control Panel (Hidden on Print) */}
      {isEmbed ? (
        // EMBED VIEW HEADER PANEL
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reports')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Kembali ke Daftar Laporan"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Pratinjau Raport: {student.name}</h3>
              <p className="text-slate-400 text-xs font-semibold">Tinjau isi dokumen kualitatif dan kuantitatif sebelum mencetak</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              to={`/reports/${student.id}/print`}
              target="_blank"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka Halaman Cetak</span>
            </Link>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-xs shadow-md shadow-primary-500/10 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Raport</span>
            </button>
          </div>
        </div>
      ) : (
        // FULL SCREEN PRINT VIEW FLOATING CONTROLS
        <div className="w-full max-w-4xl flex justify-between items-center mb-6 no-print">
          <button
            onClick={() => navigate(`/reports/${student.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pratinjau</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <Printer className="w-4.5 h-4.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
      )}

      {/* Main Report A4 Sheet Container */}
      <div className={`print-container bg-white w-full max-w-4xl rounded-sm border border-slate-200/80 shadow-lg p-6 sm:p-10 ${isEmbed ? 'print-shadow-none border-slate-100 my-0' : 'my-4'}`}>
        
        {/* Document Header Logo & Title */}
        <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase">{school_name}</h1>
          <p className="text-slate-500 font-semibold text-xs sm:text-sm mt-1">Laporan Perkembangan Kualitatif Anak Berkebutuhan Khusus</p>
          {assessment && (
            <p className="text-slate-700 font-bold text-xs sm:text-sm mt-2">Periode Asesmen: {assessment.period}</p>
          )}
        </div>

        {/* Student Biodata Information Box */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-xs sm:text-sm">
          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Nama Lengkap</div>
            <div className="font-extrabold text-slate-900 text-base">{student.name}</div>
          </div>
          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Usia</div>
            <div className="font-bold text-slate-800 text-base">{student.age} Tahun</div>
          </div>
          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Kelas</div>
            <div className="font-bold text-slate-800 text-base">{student.class_name || '—'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mb-1">Kekhususan</div>
            <div className="font-bold text-slate-800 text-base">{student.special_needs || '—'}</div>
          </div>
        </div>

        {assessment ? (
          <div className="space-y-6">
            
            {/* Core Qualitative Assessment Aspects */}
            <div className="space-y-6">
              
              {/* Motoric & Language Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Motoric */}
                <div className="border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600 shrink-0" />
                    <h3 className="font-extrabold text-indigo-900 text-sm uppercase tracking-wide">Perkembangan Motorik</h3>
                  </div>
                  <div className="p-4 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {assessment.motoric || 'Belum dievaluasi.'}
                  </div>
                </div>

                {/* Language */}
                <div className="border border-emerald-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                    <h3 className="font-extrabold text-emerald-900 text-sm uppercase tracking-wide">Bahasa & Komunikasi</h3>
                  </div>
                  <div className="p-4 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {assessment.language || 'Belum dievaluasi.'}
                  </div>
                </div>

              </div>

              {/* Social & Cognitive Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Social */}
                <div className="border border-amber-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-amber-600 shrink-0" />
                    <h3 className="font-extrabold text-amber-900 text-sm uppercase tracking-wide">Sosial & Emosional</h3>
                  </div>
                  <div className="p-4 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {assessment.social || 'Belum dievaluasi.'}
                  </div>
                </div>

                {/* Cognitive */}
                <div className="border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-blue-600 shrink-0" />
                    <h3 className="font-extrabold text-blue-900 text-sm uppercase tracking-wide">Intelektual (Kognitif)</h3>
                  </div>
                  <div className="p-4 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                    {assessment.cognitive || 'Belum dievaluasi.'}
                  </div>
                </div>

              </div>

              {/* Independence (Full Width) */}
              <div className="border border-violet-100 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-violet-50/50 border-b border-violet-150 px-4 py-3 flex items-center gap-2">
                  <Home className="w-5 h-5 text-violet-600 shrink-0" />
                  <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wide">Perkembangan Kemandirian</h3>
                </div>
                <div className="p-4 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {assessment.independence || 'Belum dievaluasi.'}
                </div>
              </div>

            </div>

            {/* Quantitative BK Score Summary Section */}
            {evaluation && (
              <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
                
                <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-sm uppercase tracking-wider">Indeks Hasil Penilaian Kuantitatif BK</h3>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-500 text-white rounded-md text-[10px] font-bold">
                    Tanggal: {formatDate(evaluation.date)}
                  </span>
                </div>

                <div className="p-5 bg-indigo-50/10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 border-b border-indigo-100">
                  
                  {/* Composite Index Card */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Skor Komposit</div>
                    <div className="text-3xl font-black text-slate-800">{evaluation.composite_index.toFixed(2)}</div>
                    <div className="text-[9px] text-slate-400 mt-1">Skala 1.00 - 4.00</div>
                  </div>

                  {/* Percentage Index Card */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Persentase Indeks</div>
                    <div className="text-3xl font-black text-primary-600">{evaluation.index_percentage}%</div>
                    <div className="text-[9px] text-slate-400 mt-1">Skala 0% - 100%</div>
                  </div>

                  {/* Predicate Score Card */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm text-center flex flex-col justify-between items-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 w-full">Hasil Predikat</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      evaluation.predicate === 'BSB' ? 'bg-green-150 text-green-800' :
                      evaluation.predicate === 'BSH' ? 'bg-blue-150 text-blue-800' :
                      evaluation.predicate === 'MB' ? 'bg-amber-150 text-amber-800' :
                      'bg-rose-150 text-rose-800'
                    }`}>
                      {evaluation.predicate}
                    </span>
                    <div className="text-[9px] text-slate-400 font-bold mt-1">
                      {evaluation.predicate === 'BSB' ? 'Berkembang Sangat Baik' :
                       evaluation.predicate === 'BSH' ? 'Berkembang Sesuai Harapan' :
                       evaluation.predicate === 'MB' ? 'Mulai Berkembang' : 'Belum Berkembang'}
                    </div>
                  </div>

                  {/* Domain Breakdown list */}
                  <div className="bg-white p-4 rounded-xl border border-indigo-50 shadow-sm text-xs font-semibold">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 text-center">Detail Nilai Domain</div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-normal">Kognitif:</span>
                        <span className="text-slate-800">{evaluation.avg_cognitive.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-normal">Motorik:</span>
                        <span className="text-slate-800">{evaluation.avg_motoric.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-normal">Bahasa:</span>
                        <span className="text-slate-800">{evaluation.avg_language.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-normal">Sosial:</span>
                        <span className="text-slate-800">{evaluation.avg_social.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-normal">Mandiri:</span>
                        <span className="text-slate-800">{evaluation.avg_independence.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* Summary & Recommendations (Full Width) */}
            <div className="border border-purple-150 rounded-xl overflow-hidden shadow-sm page-break">
              <div className="bg-purple-50/50 border-b border-purple-150 px-4 py-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-600 shrink-0" />
                <h3 className="font-extrabold text-purple-950 text-sm uppercase tracking-wide">Kesimpulan & Rekomendasi</h3>
              </div>
              <div className="p-5 text-slate-800 text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                {assessment.summary || 'Belum ada kesimpulan.'}
              </div>
            </div>

            {/* Signatures Area */}
            <div className="mt-16 pt-8 flex justify-between text-xs sm:text-sm text-slate-800 font-semibold gap-4">
              <div className="text-center w-1/3">
                <p className="mb-20">Mengetahui,<br />Orang Tua / Wali</p>
                <div className="w-32 sm:w-44 border-b border-slate-400 mx-auto"></div>
              </div>
              <div className="text-center w-1/3">
                <p className="mb-20">Kepala Sekolah<br />&nbsp;</p>
                <div className="w-32 sm:w-44 border-b border-slate-400 mx-auto"></div>
              </div>
              <div className="text-center w-1/3">
                <p className="mb-20">Guru Pendamping / Shadow Teacher<br />&nbsp;</p>
                <div className="w-32 sm:w-44 border-b border-slate-400 mx-auto text-slate-800 truncate">
                  {student.teacher_name}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-xl">
            <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-500">Belum ada Raport yang dibuat untuk siswa ini.</h3>
            <p className="text-slate-400 text-xs mt-1">Silakan buat assemen kualitatif di modul Raport Kualitatif terlebih dahulu.</p>
          </div>
        )}

      </div>
    </div>
  );
};
export default ReportPrint;
