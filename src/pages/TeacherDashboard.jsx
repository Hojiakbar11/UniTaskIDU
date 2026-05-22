import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  LogOut, GraduationCap, Plus, Users, Calendar, 
  FileText, CheckCircle, Clock, AlertCircle, Loader2, X, BookOpen, User,
  Check, ArrowRight, CornerDownRight, MessageSquare, ExternalLink
} from 'lucide-react';

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('unitask_user') || '{}');

  // Page Data States
  const [groups, setGroups] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  // Loading & Error States
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form States (Yangi vazifa)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDeadline, setAssignmentDeadline] = useState('');
  const [selectedGroups, setSelectedGroups] = useState([]);

  // Review Modal States (Baholash)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewScore, setReviewScore] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewSaving, setIsReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Fetch all initial data
  const loadDashboardData = async () => {
    try {
      setIsLoadingPage(true);
      setErrorMsg('');

      // 1. Fetch all groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .order('name');
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // 2. Fetch assignments for this teacher
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_groups (
            group_id,
            groups (
              name
            )
          )
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });
      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);

      // 3. Fetch submissions for this teacher's assignments
      if (assignmentsData && assignmentsData.length > 0) {
        const assignmentIds = assignmentsData.map(a => a.id);
        const { data: submissionsData, error: submissionsError } = await supabase
          .from('submissions')
          .select(`
            *,
            users (
              full_name
            ),
            assignments (
              title
            )
          `)
          .in('assignment_id', assignmentIds)
          .order('submitted_at', { ascending: false });
        if (submissionsError) throw submissionsError;
        setSubmissions(submissionsData || []);
      } else {
        setSubmissions([]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setErrorMsg('Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setIsLoadingPage(false);
    }
  };

  useEffect(() => {
    if (!user.id || user.role !== 'teacher') {
      navigate('/');
      return;
    }
    loadDashboardData();
  }, []);

  // Logout Handler
  const handleLogout = () => {
    localStorage.removeItem('unitask_user');
    navigate('/');
  };

  // Checkbox select toggle
  const handleGroupToggle = (groupId) => {
    if (selectedGroups.includes(groupId)) {
      setSelectedGroups(selectedGroups.filter(id => id !== groupId));
    } else {
      setSelectedGroups([...selectedGroups, groupId]);
    }
  };

  // Submit new assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentTitle.trim() || !assignmentDescription.trim() || !assignmentDeadline) {
      setErrorMsg('Iltimos, barcha majburiy maydonlarni to\'ldiring.');
      return;
    }
    if (selectedGroups.length === 0) {
      setErrorMsg('Kamida bitta guruhni tanlashingiz kerak.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Insert into assignments table
      const { data: newAssignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert([
          {
            title: assignmentTitle.trim(),
            description: assignmentDescription.trim(),
            deadline: new Date(assignmentDeadline).toISOString(),
            teacher_id: user.id
          }
        ])
        .select();

      if (assignmentError) throw assignmentError;
      if (!newAssignment || newAssignment.length === 0) {
        throw new Error('Vazifa yaratilmadi.');
      }

      const createdAssignmentId = newAssignment[0].id;

      // 2. Insert link records into assignment_groups table
      const linkRecords = selectedGroups.map(groupId => ({
        assignment_id: createdAssignmentId,
        group_id: groupId
      }));

      const { error: linkError } = await supabase
        .from('assignment_groups')
        .insert(linkRecords);

      if (linkError) throw linkError;

      setSuccessMsg('Vazifa muvaffaqiyatli yuborildi!');
      
      // Reset Form
      setAssignmentTitle('');
      setAssignmentDescription('');
      setAssignmentDeadline('');
      setSelectedGroups([]);
      setIsModalOpen(false);

      // Reload Data
      await loadDashboardData();

    } catch (err) {
      console.error('Error creating assignment:', err);
      setErrorMsg('Vazifa yaratishda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Open Review Form
  const handleOpenReview = (submission) => {
    setSelectedSubmission(submission);
    setReviewScore(submission.score !== null ? submission.score.toString() : '');
    setReviewComment(submission.teacher_comment || '');
    setReviewError('');
    setIsReviewModalOpen(true);
  };

  // Submit Review (Accept or Reject)
  const handleReviewAction = async (newStatus) => {
    if (reviewScore !== '' && (isNaN(reviewScore) || reviewScore < 0 || reviewScore > 100)) {
      setReviewError('Baho 0 va 100 oralig\'ida bo\'lishi kerak.');
      return;
    }

    setIsReviewSaving(true);
    setReviewError('');

    try {
      const scoreVal = reviewScore === '' ? null : parseInt(reviewScore, 10);
      const { error } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          score: scoreVal,
          teacher_comment: reviewComment.trim()
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      setIsReviewModalOpen(false);
      setSelectedSubmission(null);
      setReviewScore('');
      setReviewComment('');
      
      // Reload page data
      await loadDashboardData();
      setSuccessMsg(newStatus === 'accepted' ? 'Topshiriq qabul qilindi!' : 'Topshiriq talabaga qaytarildi.');
      
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);

    } catch (err) {
      console.error('Error reviewing submission:', err);
      setReviewError('Baholashda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsReviewSaving(false);
    }
  };

  // Date formatter helpers
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeadlineStatus = (deadlineString) => {
    if (!deadlineString) return { text: 'Muddatsiz', isOverdue: false, colorClass: 'text-slate-400 border-slate-800 bg-slate-900/30' };
    const deadline = new Date(deadlineString);
    const now = new Date();
    const diffTime = deadline - now;
    
    if (diffTime < 0) {
      return { 
        text: "Muddati o'tgan", 
        isOverdue: true, 
        colorClass: 'text-red-400 border-red-900/30 bg-red-950/20' 
      };
    }
    
    const diffHours = diffTime / (1000 * 60 * 60);
    if (diffHours <= 24) {
      return { 
        text: 'Tez orada tugaydi', 
        isOverdue: false, 
        isUrgent: true, 
        colorClass: 'text-amber-400 border-amber-900/30 bg-amber-955/20 bg-amber-950/20' 
      };
    }
    
    const diffDays = Math.ceil(diffHours / 24);
    return { 
      text: `${diffDays} kun qoldi`, 
      isOverdue: false, 
      colorClass: 'text-emerald-400 border-emerald-900/30 bg-emerald-950/20' 
    };
  };

  // Helper to render student solutions cleanly
  const renderSolutionText = (text) => {
    if (!text) return '-';
    const isUrl = text.startsWith('http://') || text.startsWith('https://');
    if (isUrl) {
      return (
        <a 
          href={text} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 underline font-bold text-sm bg-indigo-950/20 border border-indigo-900/30 px-4 py-2 rounded-xl"
        >
          <span>Havolani ochish (GitHub/External)</span>
          <ExternalLink className="h-4 w-4" />
        </a>
      );
    }
    return (
      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl font-mono text-xs text-slate-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
        {text}
      </div>
    );
  };

  // Submissions Separation
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const checkedSubmissions = submissions.filter(s => s.status === 'accepted' || s.status === 'rejected' || s.status === 'graded' || s.status === 'returned');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Top Header */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">UniTask</h1>
            <p className="text-xs text-slate-500">Teacher Workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-350 text-sm">
            <User className="h-4 w-4 text-indigo-400" />
            <span>{user.full_name}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-sm font-semibold border border-slate-800 hover:border-slate-700"
          >
            <LogOut className="h-4 w-4" />
            Chiqish
          </button>
        </div>
      </header>

      {/* Loading Overlay */}
      {isLoadingPage ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Ma'lumotlar yuklanmoqda...</p>
        </div>
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 animate-fadeIn">
          
          {/* Dashboard Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                Salom, {user.full_name || "Hurmatli O'qituvchi"}!
              </h2>
              <p className="text-slate-400 text-sm md:text-base">
                Bugun yangi topshiriqlar yarating yoki talabalar yuborgan javoblarni baholang.
              </p>
            </div>
            <div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                Yangi vazifa yaratish
              </button>
            </div>
          </div>

          {/* General Messages */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 text-sm">
              <p className="font-semibold">{successMsg}</p>
            </div>
          )}

          {/* Statistics Widgets Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Stat 1: Groups */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jami guruhlar</span>
                <p className="text-3xl font-extrabold text-white">{groups.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="h-6 w-6" />
              </div>
            </div>

            {/* Stat 2: Active Assignments */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Faol vazifalar</span>
                <p className="text-3xl font-extrabold text-white">{assignments.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>

            {/* Stat 3: Unchecked Submissions */}
            <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:border-slate-800">
              <div className="space-y-1">
                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tekshirilmaganlar</span>
                <p className="text-3xl font-extrabold text-amber-400">{pendingSubmissions.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
            </div>

          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Assignments List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-xl font-bold text-white">Yuborilgan Vazifalar ({assignments.length})</h3>
              </div>

              {assignments.length === 0 ? (
                /* Empty State */
                <div className="border border-dashed border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-600">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-300 mb-1">Hozircha vazifalar yo'q</h4>
                    <p className="text-slate-500 text-sm max-w-xs">
                      Talabalar uchun yangi vazifalar yaratib, ularni guruhlar bo'yicha yuboring.
                    </p>
                  </div>
                </div>
              ) : (
                /* Assignments Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignments.map((assignment) => {
                    const status = getDeadlineStatus(assignment.deadline);
                    return (
                      <div 
                        key={assignment.id} 
                        className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-black/25 relative overflow-hidden group"
                      >
                        <div className="space-y-4">
                          {/* Header of Card */}
                          <div className="flex items-start justify-between gap-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${status.colorClass}`}>
                              {status.text}
                            </span>
                            <span className="text-slate-500 text-xs flex items-center gap-1 font-medium">
                              <Calendar className="h-3 w-3" />
                              {formatDateTime(assignment.created_at)}
                            </span>
                          </div>

                          {/* Body of Card */}
                          <div>
                            <h4 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {assignment.title}
                            </h4>
                            <p className="text-slate-400 text-sm line-clamp-3 mt-1.5 leading-relaxed font-medium">
                              {assignment.description}
                            </p>
                          </div>
                        </div>

                        {/* Footer of Card */}
                        <div className="border-t border-slate-900/60 pt-4 mt-5 space-y-3">
                          {/* Targets Groups */}
                          <div className="flex flex-wrap gap-1.5 items-center">
                            <span className="text-xs text-slate-500 flex items-center gap-1 mr-1 font-semibold">
                              <Users className="h-3 w-3" /> Guruhlar:
                            </span>
                            {assignment.assignment_groups && assignment.assignment_groups.length > 0 ? (
                              assignment.assignment_groups.map((ag, idx) => (
                                <span 
                                  key={idx} 
                                  className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-850 text-slate-300 text-xs font-semibold"
                                >
                                  {ag.groups?.name || 'Guruh'}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-600 font-medium">Topilmadi</span>
                            )}
                          </div>

                          {/* Deadline detail */}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <Clock className="h-3.5 w-3.5 text-slate-650" />
                            <span>Muddati:</span>
                            <span className="text-slate-350 font-semibold">{formatDateTime(assignment.deadline)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Submissions Tracker (Baholash) */}
            <div className="space-y-8">
              
              {/* Section 1: Pending Submissions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Clock className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Kutilayotgan javoblar ({pendingSubmissions.length})</h3>
                </div>

                {pendingSubmissions.length === 0 ? (
                  <div className="border border-slate-900 rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-3 bg-slate-900/10">
                    <Check className="h-5 w-5 text-slate-600" />
                    <p className="text-slate-500 text-xs font-medium">Kutilayotgan javoblar yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingSubmissions.map((sub) => (
                      <div 
                        key={sub.id} 
                        onClick={() => handleOpenReview(sub)}
                        className="bg-slate-900/30 border border-slate-900 hover:border-slate-800 rounded-2xl p-5 transition-all cursor-pointer hover:scale-[1.01] group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">
                            {sub.users?.full_name || 'Noma\'lum talaba'}
                          </div>
                          <span className="px-2.5 py-0.5 rounded bg-amber-950/20 border border-amber-900/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                            Kutilmoqda
                          </span>
                        </div>
                        <div className="text-slate-400 text-xs font-semibold mb-3 truncate">
                          Topshiriq: {sub.assignments?.title}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900/50 pt-2.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-slate-600" />
                            {formatDateTime(sub.submitted_at)}
                          </span>
                          <span className="text-indigo-400 font-bold flex items-center gap-0.5">
                            Tekshirish <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Checked Submissions */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Tekshirilganlar ({checkedSubmissions.length})</h3>
                </div>

                {checkedSubmissions.length === 0 ? (
                  <div className="border border-slate-900 rounded-3xl p-6 text-center flex flex-col items-center justify-center gap-3 bg-slate-900/10">
                    <BookOpen className="h-5 w-5 text-slate-600" />
                    <p className="text-slate-500 text-xs font-medium">Hozircha tekshirilgan topshiriqlar yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {checkedSubmissions.map((sub) => {
                      const isAccepted = sub.status === 'accepted' || sub.status === 'graded';
                      return (
                        <div 
                          key={sub.id} 
                          onClick={() => handleOpenReview(sub)}
                          className="bg-slate-900/10 border border-slate-900 hover:border-slate-850 rounded-2xl p-5 transition-all cursor-pointer hover:scale-[1.01] group"
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="font-bold text-slate-300 text-sm group-hover:text-indigo-400 transition-colors">
                              {sub.users?.full_name}
                            </div>
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                              isAccepted 
                                ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' 
                                : 'bg-rose-950/20 border-rose-900/30 text-rose-450 text-rose-400'
                            }`}>
                              {isAccepted ? 'Qabul qilindi' : 'Qaytarildi'}
                            </span>
                          </div>
                          <div className="text-slate-500 text-xs font-semibold mb-3 truncate">
                            {sub.assignments?.title}
                          </div>
                          
                          {sub.teacher_comment && (
                            <div className="mb-3 text-[11px] text-slate-450 bg-slate-950/40 p-2 rounded-lg border border-slate-900/80 flex gap-1 items-start text-slate-400">
                              <MessageSquare className="h-3.5 w-3.5 text-slate-550 shrink-0 mt-0.5" />
                              <span className="italic line-clamp-1">"{sub.teacher_comment}"</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-900/60 pt-2.5">
                            <span className="font-medium">{formatDateTime(sub.submitted_at)}</span>
                            {sub.score !== null && (
                              <span className="font-extrabold text-indigo-400">
                                Ball: {sub.score} / 100
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Yangi Vazifa Yaratish Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={() => !isSaving && setIsModalOpen(false)}
              ></div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 relative z-10 shadow-2xl animate-modalIn max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <h3 className="text-xl font-extrabold text-white">Yangi vazifa yaratish</h3>
                  <button 
                    onClick={() => !isSaving && setIsModalOpen(false)}
                    disabled={isSaving}
                    className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateAssignment} className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
                  {errorMsg && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm">
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                      <p className="font-semibold">{errorMsg}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="modal-title">
                      Vazifa sarlavhasi *
                    </label>
                    <input
                      id="modal-title"
                      type="text"
                      placeholder="Mavzu nomi..."
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                      disabled={isSaving}
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="modal-desc">
                      Vazifa tavsifi (Batafsil ma'lumot) *
                    </label>
                    <textarea
                      id="modal-desc"
                      rows="4"
                      placeholder="Topshiriq shartlari va talablarini yozing..."
                      value={assignmentDescription}
                      onChange={(e) => setAssignmentDescription(e.target.value)}
                      disabled={isSaving}
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium resize-none"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="modal-deadline">
                      Tugash muddati (Deadline) *
                    </label>
                    <input
                      id="modal-deadline"
                      type="datetime-local"
                      value={assignmentDeadline}
                      onChange={(e) => setAssignmentDeadline(e.target.value)}
                      disabled={isSaving}
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1">
                      Yuboriladigan guruhlar (Multi-select) *
                    </label>
                    
                    {groups.length === 0 ? (
                      <p className="text-slate-500 text-xs italic ml-1">Guruhlar mavjud emas.</p>
                    ) : (
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                        {groups.map((g) => {
                          const isChecked = selectedGroups.includes(g.id);
                          return (
                            <label 
                              key={g.id} 
                              className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isChecked 
                                  ? 'bg-indigo-950/20 border-indigo-500/50 text-white' 
                                  : 'bg-slate-900/30 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleGroupToggle(g.id)}
                                disabled={isSaving}
                                className="h-4 w-4 rounded border-slate-800 text-indigo-600 bg-slate-900 focus:ring-indigo-500 focus:ring-offset-0"
                              />
                              <span className="text-xs font-bold">{g.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-sm transition-all border border-slate-750"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75"
                    >
                      {isSaving ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saqlanmoqda...
                        </span>
                      ) : (
                        'Vazifani yuborish'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Baholash va Tekshirish (Review Modal) */}
          {isReviewModalOpen && selectedSubmission && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={() => !isReviewSaving && setIsReviewModalOpen(false)}
              ></div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 relative z-10 shadow-2xl animate-modalIn flex flex-col max-h-[90vh]">
                
                {/* Header (Sticky) */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
                  <div>
                    <h3 className="text-lg font-extrabold text-white">Topshiriqni Tekshirish</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Talaba: {selectedSubmission.users?.full_name} | Mavzu: {selectedSubmission.assignments?.title}
                    </p>
                  </div>
                  <button 
                    onClick={() => !isReviewSaving && setIsReviewModalOpen(false)}
                    disabled={isReviewSaving}
                    className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
                  
                  {/* Student Response */}
                  <div className="space-y-2">
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Talaba Javobi:</span>
                    {renderSolutionText(selectedSubmission.solution_text)}
                  </div>

                  {/* Submission date details */}
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 bg-slate-950/30 p-2 rounded-lg border border-slate-900 w-fit">
                    <Clock className="h-3.5 w-3.5 text-slate-600" />
                    Topshirilgan vaqti: {formatDateTime(selectedSubmission.submitted_at)}
                  </div>

                  {/* Errors */}
                  {reviewError && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm font-semibold">
                      <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
                      <p>{reviewError}</p>
                    </div>
                  )}

                  {/* Score input */}
                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="review-score">
                      Baho (Score: 0 - 100)
                    </label>
                    <input
                      id="review-score"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="Masalan: 85"
                      value={reviewScore}
                      onChange={(e) => setReviewScore(e.target.value)}
                      disabled={isReviewSaving}
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                    />
                  </div>

                  {/* Comment input */}
                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="review-comment">
                      O'qituvchi izohi / Fidbek
                    </label>
                    <textarea
                      id="review-comment"
                      rows="3"
                      placeholder="Kamchiliklar yoki yaxshi ishlangan tomonlarini yozing..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      disabled={isReviewSaving}
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium resize-none"
                    ></textarea>
                  </div>
                </div>

                {/* Footer Actions (Sticky) */}
                <div className="border-t border-slate-800 pt-5 flex items-center justify-end gap-3 flex-wrap shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsReviewModalOpen(false)}
                    disabled={isReviewSaving}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-sm transition-all border border-slate-750"
                  >
                    Yopish
                  </button>
                  
                  {/* Reject Button */}
                  <button
                    type="button"
                    onClick={() => handleReviewAction('rejected')}
                    disabled={isReviewSaving}
                    className="px-5 py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-955/40 text-rose-400 font-bold text-sm border border-rose-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isReviewSaving ? 'Yuklanmoqda...' : 'Qaytarish (Reject)'}
                  </button>

                  {/* Accept Button */}
                  <button
                    type="button"
                    onClick={() => handleReviewAction('accepted')}
                    disabled={isReviewSaving}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-650 text-white font-bold text-sm shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isReviewSaving ? 'Saqlanmoqda...' : 'Qabul qilish (Accept)'}
                  </button>
                </div>

              </div>
            </div>
          )}

        </main>
      )}
    </div>
  );
}
