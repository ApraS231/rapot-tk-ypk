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

  const { student, assessment, school_name } = data;

  // Inline stylesheet for printable layout print-only CSS
  const printStyles = `
    @media print {
      body, html, #root {
        background-color: white !important;
        background: white !important;
        color: #000 !important;
      }
      .print-outer-wrapper {
        background-color: white !important;
        background: white !important;
        padding: 0 !important;
        margin: 0 !important;
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
        background-color: white !important;
        background: white !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
      tr {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .page-break-inside-avoid {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        size: A4;
        margin: 1.2cm 1.5cm;
      }
    }
  `;

  return (
    <div className={`min-h-screen print-outer-wrapper ${isEmbed ? 'p-0 space-y-6' : 'bg-neutral-100 py-8 px-4 flex flex-col items-center'}`}>
      <style>{printStyles}</style>

      {/* Control Panel (Hidden on Print) */}
      {isEmbed ? (
        // EMBED VIEW HEADER PANEL
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-neutral-200/60 rounded-2xl p-4 shadow-sm no-print max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/reports')}
              className="p-2 hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer"
              title="Kembali ke Daftar Laporan"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <div>
              <h3 className="font-bold text-neutral-800 text-sm">Pratinjau Raport: {student.name}</h3>
              <p className="text-neutral-400 text-xs font-semibold">Tinjau isi dokumen kualitatif dan kuantitatif sebelum mencetak</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              to={`/reports/${student.id}/print`}
              target="_blank"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold rounded-xl text-xs transition cursor-pointer"
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200 rounded-xl shadow-sm text-sm font-semibold transition cursor-pointer"
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
      <div className={`print-container bg-white w-full max-w-4xl rounded-xl border border-neutral-200/80 shadow-xl p-8 sm:p-12 mx-auto ${isEmbed ? 'print-shadow-none border-neutral-100 my-0' : 'my-4 animate-in fade-in duration-300'}`}>
        
        {/* Document Header (Kop Surat Resmi) */}
        <div className="text-center border-b-4 border-double border-black pb-5 mb-8">
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-900 tracking-tight uppercase">{school_name}</h1>
          <p className="text-neutral-500 font-bold text-xs sm:text-sm uppercase tracking-wider mt-1.5">Laporan Perkembangan Kualitatif Anak Berkebutuhan Khusus</p>
          {assessment && (
            <p className="text-neutral-800 font-extrabold text-xs sm:text-sm mt-2 bg-neutral-100 inline-block px-4 py-1 rounded-full border border-neutral-200/60 no-print">
              Tahun Ajaran / Periode: {assessment.period}
            </p>
          )}
          {assessment && (
            <p className="text-neutral-900 font-bold text-xs hidden print:block mt-1">
              Tahun Ajaran / Periode: {assessment.period}
            </p>
          )}
        </div>

        {/* Student Biodata Information (Formal Table Layout) */}
        <div className="mb-8 border border-neutral-200 rounded-xl p-6 bg-neutral-50/50">
          <table className="w-full text-xs sm:text-sm border-none leading-relaxed">
            <tbody>
              <tr>
                <td className="py-2 font-bold text-neutral-400 uppercase tracking-wider text-[10px] w-1/4">Nama Anak Didik</td>
                <td className="py-2 text-neutral-800 w-4 font-bold">:</td>
                <td className="py-2 text-neutral-900 font-black text-base w-1/4">{student.name}</td>
                <td className="py-2 font-bold text-neutral-400 uppercase tracking-wider text-[10px] w-1/4 pl-8">Kelas</td>
                <td className="py-2 text-neutral-800 w-4 font-bold">:</td>
                <td className="py-2 text-neutral-800 font-bold">{student.class_name || '—'}</td>
              </tr>
              <tr>
                <td className="py-2 font-bold text-neutral-400 uppercase tracking-wider text-[10px]">Usia Perkembangan</td>
                <td className="py-2 text-neutral-800 font-bold">:</td>
                <td className="py-2 text-neutral-800 font-bold">{student.age} Tahun</td>
                <td className="py-2 font-bold text-neutral-400 uppercase tracking-wider text-[10px] pl-8">Kekhususan / Diagnosis</td>
                <td className="py-2 text-neutral-800 font-bold">:</td>
                <td className="py-2 text-neutral-800 font-bold">
                  <span className="inline-block bg-amber-50 text-amber-800 border border-amber-200/60 rounded px-2.5 py-0.5 text-xs font-extrabold uppercase">
                    {student.special_needs || '—'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {assessment ? (
          <div className="space-y-6">
            
            {/* Core Qualitative Assessment Aspects (Official Table Grid) */}
            <div className="border border-neutral-250 rounded-xl overflow-hidden shadow-sm bg-white">
              <table className="w-full border-collapse text-xs sm:text-sm text-left">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-250 text-neutral-700 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-3.5 text-center w-12 border-r border-neutral-200">No</th>
                    <th className="px-5 py-3.5 w-64 border-r border-neutral-200">Aspek Perkembangan</th>
                    <th className="px-6 py-3.5">Uraian Kemajuan Perkembangan Kualitatif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-800 leading-relaxed font-semibold">
                  
                  {/* Motoric */}
                  <tr className="align-top hover:bg-neutral-50/20 transition-colors">
                    <td className="px-4 py-4 text-center font-bold border-r border-neutral-200 text-neutral-500">1</td>
                    <td className="px-5 py-4 border-r border-neutral-200">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-neutral-700 shrink-0" />
                        <div className="font-extrabold text-neutral-900 text-xs sm:text-sm">Perkembangan Motorik</div>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium mt-1 block pl-6">Motorik halus & kasar, koordinasi gerak fisik</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 text-xs sm:text-sm whitespace-pre-wrap">{assessment.motoric || 'Belum dievaluasi.'}</td>
                  </tr>

                  {/* Language */}
                  <tr className="align-top hover:bg-neutral-50/20 transition-colors">
                    <td className="px-4 py-4 text-center font-bold border-r border-neutral-200 text-neutral-500">2</td>
                    <td className="px-5 py-4 border-r border-neutral-200">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-neutral-700 shrink-0" />
                        <div className="font-extrabold text-neutral-900 text-xs sm:text-sm">Bahasa & Komunikasi</div>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium mt-1 block pl-6">Kemampuan reseptif, ekspresif, verbal/non-verbal</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 text-xs sm:text-sm whitespace-pre-wrap">{assessment.language || 'Belum dievaluasi.'}</td>
                  </tr>

                  {/* Social */}
                  <tr className="align-top hover:bg-neutral-50/20 transition-colors">
                    <td className="px-4 py-4 text-center font-bold border-r border-neutral-200 text-neutral-500">3</td>
                    <td className="px-5 py-4 border-r border-neutral-200">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-neutral-700 shrink-0" />
                        <div className="font-extrabold text-neutral-900 text-xs sm:text-sm">Sosial & Emosional</div>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium mt-1 block pl-6">Hubungan sebaya, kontrol emosi, kemandirian sosial</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 text-xs sm:text-sm whitespace-pre-wrap">{assessment.social || 'Belum dievaluasi.'}</td>
                  </tr>

                  {/* Cognitive */}
                  <tr className="align-top hover:bg-neutral-50/20 transition-colors">
                    <td className="px-4 py-4 text-center font-bold border-r border-neutral-200 text-neutral-500">4</td>
                    <td className="px-5 py-4 border-r border-neutral-200">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-neutral-700 shrink-0" />
                        <div className="font-extrabold text-neutral-900 text-xs sm:text-sm">Intelektual (Kognitif)</div>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium mt-1 block pl-6">Konsentrasi, pemahaman konsep, nalar logis</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 text-xs sm:text-sm whitespace-pre-wrap">{assessment.cognitive || 'Belum dievaluasi.'}</td>
                  </tr>

                  {/* Independence */}
                  <tr className="align-top hover:bg-neutral-50/20 transition-colors">
                    <td className="px-4 py-4 text-center font-bold border-r border-neutral-200 text-neutral-500">5</td>
                    <td className="px-5 py-4 border-r border-neutral-200">
                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-neutral-700 shrink-0" />
                        <div className="font-extrabold text-neutral-900 text-xs sm:text-sm">Perkembangan Kemandirian</div>
                      </div>
                      <span className="text-[10px] text-neutral-400 font-medium mt-1 block pl-6">Aktivitas sehari-hari (ADL), bina diri, toilet training</span>
                    </td>
                    <td className="px-6 py-4 text-neutral-700 text-xs sm:text-sm whitespace-pre-wrap">{assessment.independence || 'Belum dievaluasi.'}</td>
                  </tr>

                </tbody>
              </table>
            </div>

            {/* Summary & Recommendations (Full Width Box) */}
            <div className="border border-neutral-250 rounded-xl overflow-hidden shadow-sm page-break bg-white">
              <div className="bg-neutral-50 border-b border-neutral-250 px-5 py-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-neutral-700 shrink-0" />
                <h3 className="font-extrabold text-neutral-900 text-xs sm:text-sm uppercase tracking-wider">Kesimpulan & Rekomendasi</h3>
              </div>
              <div className="p-6 text-neutral-800 text-xs sm:text-sm font-semibold leading-relaxed whitespace-pre-wrap">
                {assessment.summary || 'Belum ada kesimpulan.'}
              </div>
            </div>

            {/* Signatures Area (Formal Transcripts Layout) */}
            <div className="mt-8 pt-4 flex justify-between text-xs sm:text-sm text-neutral-800 font-semibold gap-6 page-break-inside-avoid">
              <div className="text-center w-1/3">
                <p className="mb-16 text-neutral-500 uppercase tracking-wider text-[10px] font-bold">Orang Tua / Wali Murid</p>
                <div className="w-full max-w-[180px] border-b border-neutral-400 mx-auto"></div>
              </div>
              <div className="text-center w-1/3">
                <p className="mb-16 text-neutral-500 uppercase tracking-wider text-[10px] font-bold">Kepala Sekolah</p>
                <div className="w-full max-w-[180px] border-b border-neutral-400 mx-auto"></div>
              </div>
              <div className="text-center w-1/3">
                <p className="mb-16 text-neutral-500 uppercase tracking-wider text-[10px] font-bold">
                  Tanggal: {assessment.created_at ? new Date(assessment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}<br />
                  Guru Pendamping / Shadow Teacher
                </p>
                <div className="w-full max-w-[180px] border-b border-neutral-400 mx-auto font-bold text-neutral-900 pb-1">
                  {student.teacher_name}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed border-neutral-200 rounded-xl bg-neutral-50/50">
            <FileCheck2 className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-neutral-500">Belum ada Raport yang dibuat untuk siswa ini.</h3>
            <p className="text-neutral-400 text-xs mt-1">Silakan buat assemen kualitatif di modul Raport Kualitatif terlebih dahulu.</p>
          </div>
        )}

      </div>
    </div>
  );
};
export default ReportPrint;
