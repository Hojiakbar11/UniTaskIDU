import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  LogOut, GraduationCap, Calendar, FileText, CheckCircle, 
  Clock, AlertCircle, Loader2, X, BookOpen, User, ClipboardList, Send, Bell, DollarSign,
  ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Paperclip, ExternalLink
} from 'lucide-react';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('unitask_user') || '{}');

  // Sidebar Collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('unitask_sidebar_collapsed') === 'true');
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('unitask_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Modal / Submit States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [solutionText, setSolutionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  // Page States
  const [groupName, setGroupName] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [assignmentsSearchQuery, setAssignmentsSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filteredAssignments = React.useMemo(() => {
    let result = [...assignments];
    if (assignmentsSearchQuery) {
      const q = assignmentsSearchQuery.toLowerCase();
      result = result.filter(a => 
        (a.title || '').toLowerCase().includes(q) || 
        (a.description || '').toLowerCase().includes(q) ||
        (a.subjects?.name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [assignments, assignmentsSearchQuery]);

  // Tab State
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'attendance' | 'timetable' | 'contract'
  const [attendance, setAttendance] = useState([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');

  // Timetable States
  const [timetableData, setTimetableData] = useState([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [timetableError, setTimetableError] = useState('');

  // Contract States
  const [contractInfo, setContractInfo] = useState(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [contractError, setContractError] = useState('');

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const notifRef = useRef(null);
  const submitModalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (isModalOpen && submitModalRef.current && !submitModalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
        setIsModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotifOpen, isModalOpen]);

  // Attendance Sorting States & Memo
  const [attendanceSortConfig, setAttendanceSortConfig] = useState({ key: null, direction: 'asc' });

  const handleAttendanceSort = (key) => {
    let direction = 'asc';
    if (attendanceSortConfig.key === key && attendanceSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setAttendanceSortConfig({ key, direction });
  };

  const sortedAttendance = React.useMemo(() => {
    const sortable = [...attendance];
    if (attendanceSortConfig.key !== null) {
      sortable.sort((a, b) => {
        let aVal = a[attendanceSortConfig.key];
        let bVal = b[attendanceSortConfig.key];
        
        if (attendanceSortConfig.key === 'subject_name') {
          aVal = a.subjectName || '';
          bVal = b.subjectName || '';
        } else if (attendanceSortConfig.key === 'lesson_type') {
          aVal = a.lessonTypeName || '';
          bVal = b.lessonTypeName || '';
        }

        if (typeof aVal === 'string') {
          const comp = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
          return attendanceSortConfig.direction === 'asc' ? comp : -comp;
        } else {
          if (aVal < bVal) return attendanceSortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return attendanceSortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return sortable;
  }, [attendance, attendanceSortConfig]);

  const loadNotifications = async () => {
    if (!user || !user.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleBellClick = async () => {
    setIsNotifOpen(!isNotifOpen);
    if (!isNotifOpen && unreadCount > 0) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        if (error) throw error;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } catch (err) {
        console.error('Error marking notifications as read:', err);
      }
    }
  };

  // Real-Time Time Tracking
  const [currentTimeState, setCurrentTimeState] = useState(new Date());

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(() => {
      setCurrentTimeState(new Date());
      loadNotifications();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const isClassCurrent = (day, startTime, endTime) => {
    const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const now = currentTimeState;
    const currentDay = days[now.getDay()];
    
    if (day !== currentDay) return false;
    
    const pad = (num) => String(num).padStart(2, '0');
    const nowTimeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    
    const normalizeTime = (timeStr) => {
      if (!timeStr) return '';
      const parts = timeStr.split(':');
      while (parts.length < 3) {
        parts.push('00');
      }
      return parts.map(p => p.padStart(2, '0')).join(':');
    };

    const startNorm = normalizeTime(startTime);
    const endNorm = normalizeTime(endTime);
    
    return nowTimeStr >= startNorm && nowTimeStr <= endNorm;
  };



  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      setIsLoadingPage(true);
      setErrorMsg('');

      if (!user.group_id) {
        setGroupName('Biriktirilmagan');
        setAssignments([]);
        setIsLoadingPage(false);
        return;
      }

      // 1. Fetch group details
      const { data: groupData, error: groupErr } = await supabase
        .from('groups')
        .select('name')
        .eq('id', user.group_id);
      if (groupErr) throw groupErr;
      if (groupData && groupData.length > 0) {
        setGroupName(groupData[0].name);
      }

      // 2. Fetch assignments for this group (joining subjects and lesson types)
      const { data: assGroups, error: assError } = await supabase
        .from('assignment_groups')
        .select(`
          assignment_id,
          assignments (
            id,
            title,
            description,
            deadline,
            created_at,
            users (
              full_name
            ),
            subjects (
              name
            ),
            lesson_types (
              name
            )
          )
        `)
        .eq('group_id', user.group_id);
      if (assError) throw assError;

      // 3. Fetch submissions by this student
      const { data: subsData, error: subsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user.id);
      if (subsError) throw subsError;

      // 4. Stitch in memory
      if (assGroups) {
        const merged = assGroups
          .filter(ag => ag.assignments !== null)
          .map(ag => {
            const assignment = ag.assignments;
            const submission = (subsData || []).find(s => s.assignment_id === assignment.id);
            return {
              ...assignment,
              submission: submission || null
            };
          })
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAssignments(merged);
      }

    } catch (err) {
      console.error('Error loading student dashboard data:', err);
      setErrorMsg('Ma\'lumotlarni yuklashda xatolik yuz berdi.');
    } finally {
      setIsLoadingPage(false);
    }
  };

  // Load student's attendance records
  const loadAttendanceData = async () => {
    try {
      setIsLoadingAttendance(true);
      setAttendanceError('');

      // 1. Fetch attendance records for this student
      const { data: attData, error: attError } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user.id)
        .order('lesson_date', { ascending: false });

      if (attError) throw attError;

      if (!attData || attData.length === 0) {
        setAttendance([]);
        return;
      }

      // 2. Fetch all teacher subjects relations to join with subjects and lesson types in memory
      const { data: relsData, error: relsError } = await supabase
        .from('teacher_subjects')
        .select(`
          id,
          subjects ( name ),
          lesson_types ( name )
        `);

      if (relsError) throw relsError;

      // 3. Stitch in memory
      const stitched = attData.map(record => {
        const rel = (relsData || []).find(r => r.id === record.teacher_subject_id);
        return {
          ...record,
          subjectName: rel?.subjects?.name || 'Noma\'lum fan',
          lessonTypeName: rel?.lesson_types?.name || 'Noma\'lum tur'
        };
      });

      setAttendance(stitched);

    } catch (err) {
      console.error('Error loading student attendance:', err);
      setAttendanceError('Davomat ma\'lumotlarini yuklashda xatolik yuz berdi.');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (!user.id || user.role !== 'student') {
      navigate('/');
      return;
    }
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      loadAttendanceData();
    }
  }, [activeTab]);

  // Load Timetable Data
  const loadTimetableData = async () => {
    setIsLoadingTimetable(true);
    setTimetableError('');
    try {
      const { data, error } = await supabase
        .from('timetable')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          room_number,
          teacher_subjects!inner (
            id,
            group_id,
            subjects ( name ),
            lesson_types ( name ),
            users ( full_name )
          )
        `)
        .eq('teacher_subjects.group_id', user.group_id);
      
      if (error) throw error;
      setTimetableData(data || []);
    } catch (err) {
      console.error('Error loading timetable:', err);
      setTimetableError('Dars jadvalini yuklashda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsLoadingTimetable(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'timetable') {
      if (!user.group_id) {
        setTimetableData([]);
        return;
      }
      loadTimetableData();
    }
  }, [activeTab]);

  // Load Contract Data
  const loadContractData = async () => {
    setIsLoadingContract(true);
    setContractError('');
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      if (data && data.length > 0) {
        setContractInfo(data[0]);
      } else {
        setContractInfo({
          base_amount: 16000000,
          discount_amount: 0,
          paid_amount: 0,
          deadline: null
        });
      }
    } catch (err) {
      console.error('Error loading contract:', err);
      setContractError('Shartnoma ma\'lumotlarini yuklashda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsLoadingContract(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'contract') {
      loadContractData();
    }
  }, [activeTab]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('unitask_user');
    navigate('/');
  };

  // Open submission form
  const handleOpenSubmit = (assignment) => {
    setSelectedAssignment(assignment);
    setSolutionText(assignment.submission?.solution_text || '');
    setSelectedFile(null);
    setModalError('');
    setIsModalOpen(true);
  };

  // Submit solution
  const handleSubmitSolution = async (e) => {
    e.preventDefault();
    if (!solutionText.trim()) {
      setModalError('Iltimos, topshiriq javobini kiriting.');
      return;
    }

    const isOverdue = new Date(selectedAssignment.deadline) < new Date();
    if (isOverdue) {
      setModalError('Muddati o\'tgan topshiriqlar uchun javob yuborib bo\'lmaydi.');
      return;
    }

    setIsSaving(true);
    setModalError('');

    try {
      let fileUrl = selectedAssignment.submission?.file_url || null;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assignments')
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('assignments')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      if (selectedAssignment.submission) {
        // UPDATE existing submission (e.g. if resubmitting returned assignment)
        const { error } = await supabase
          .from('submissions')
          .update({
            solution_text: solutionText.trim(),
            status: 'pending',
            score: null,
            teacher_comment: null,
            submitted_at: new Date().toISOString(),
            file_url: fileUrl
          })
          .eq('id', selectedAssignment.submission.id);
        if (error) throw error;
      } else {
        // INSERT new submission
        const { error } = await supabase
          .from('submissions')
          .insert([
            {
              assignment_id: selectedAssignment.id,
              student_id: user.id,
              solution_text: solutionText.trim(),
              status: 'pending',
              file_url: fileUrl
            }
          ]);
        if (error) throw error;
      }

      setSelectedFile(null);

      setSuccessMsg('Topshiriq muvaffaqiyatli yuborildi!');
      setIsModalOpen(false);
      await loadDashboardData();
      
      // Auto clear success message after 4s
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);

    } catch (err) {
      console.error('Error submitting assignment:', err);
      setModalError('Topshiriqni yuborishda xatolik: ' + err.message);
    } finally {
      setIsSaving(false);
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

  // Status mapping helper
  const getSubmissionStatus = (assignment) => {
    const sub = assignment.submission;
    if (!sub) {
      const isOverdue = new Date(assignment.deadline) < new Date();
      if (isOverdue) {
        return {
          text: 'Topshirilmagan (Muddati o\'tgan)',
          badgeClass: 'bg-red-950/20 border-red-900/30 text-red-400',
          canSubmit: false
        };
      }
      return {
        text: 'Topshirilmagan',
        badgeClass: 'bg-slate-900/40 border-slate-800 text-slate-400',
        canSubmit: true
      };
    }

    if (sub.status === 'pending') {
      return {
        text: 'Kutilmoqda (Pending)',
        badgeClass: 'bg-amber-950/20 border-amber-900/30 text-amber-400',
        canSubmit: true // Can edit/resubmit while pending
      };
    }

    if (sub.status === 'graded' || sub.status === 'accepted') {
      return {
        text: `Qabul qilindi (Ball: ${sub.score || '-'})`,
        badgeClass: 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400',
        canSubmit: false // Graded cannot be changed
      };
    }

    if (sub.status === 'returned' || sub.status === 'rejected') {
      return {
        text: 'Qaytarildi (Rad etildi)',
        badgeClass: 'bg-rose-950/20 border-rose-900/30 text-rose-400',
        canSubmit: true // Returned can be resubmitted
      };
    }

    return {
      text: 'Noma\'lum',
      badgeClass: 'bg-slate-900 border-slate-800 text-slate-450',
      canSubmit: false
    };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* Sidebar Navigation */}
      <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-80'} bg-slate-900/40 border-r border-slate-900 flex flex-col justify-between backdrop-blur-xl shrink-0 overflow-hidden`}>
        <div>
          {/* Logo */}
          {isSidebarCollapsed ? (
            <div className="p-6 border-b border-slate-900 flex items-center justify-center">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-650 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-slate-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-650 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">UniTask</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Talaba Workspace</p>
              </div>
            </div>
          )}

          {/* User Profile */}
          {isSidebarCollapsed ? (
            <div className="p-5 border-b border-slate-900 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-emerald-400 uppercase">
                {user.full_name ? user.full_name.substring(0, 2) : 'ST'}
              </div>
            </div>
          ) : (
            <div className="p-5 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-emerald-400 uppercase">
                  {user.full_name ? user.full_name.substring(0, 2) : 'ST'}
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">{user.full_name || 'Talaba'}</h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5 capitalize">{groupName || 'Guruhsiz'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-2.5">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'assignments' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <FileText className={`h-4.5 w-4.5 ${activeTab === 'assignments' ? 'text-emerald-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Mening Vazifalarim</span>}
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'attendance' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Calendar className={`h-4.5 w-4.5 ${activeTab === 'attendance' ? 'text-emerald-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Mening Davomatim</span>}
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'timetable' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Calendar className={`h-4.5 w-4.5 ${activeTab === 'timetable' ? 'text-emerald-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Dars jadvali</span>}
            </button>
            <button
              onClick={() => setActiveTab('contract')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'contract' 
                  ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <DollarSign className={`h-4.5 w-4.5 ${activeTab === 'contract' ? 'text-emerald-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Mening Shartnomam</span>}
            </button>
          </nav>

          {/* Collapse Sidebar Button */}
          <div className="px-4 py-2 border-t border-slate-900/50">
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-900 hover:border-slate-800 text-slate-500 hover:text-slate-350 transition-all text-xs font-bold cursor-pointer"
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <span className="flex items-center gap-1.5"><ChevronLeft className="h-4 w-4" /> Sidebar Yopish</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col animate-fadeIn">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold text-xs">Workspace</span>
            <span className="text-slate-700 text-xs">/</span>
            <span className="text-white font-extrabold text-xs capitalize">
              {activeTab === 'assignments' ? 'Mening vazifalarim' : activeTab === 'attendance' ? 'Mening davomatim' : activeTab === 'timetable' ? 'Dars jadvali' : 'Mening shartnomam'}
            </span>
          </div>
          <div className="flex items-center gap-4">
        {/* User display & logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-350 text-xs font-semibold">
            <User className="h-3.5 w-3.5 text-emerald-400" />
            <span>{user.full_name}</span>
            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-950/30 border border-emerald-900/40 text-emerald-400">
              {groupName}
            </span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('unitask_user');
              localStorage.removeItem('user');
              navigate('/');
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-450 bg-slate-900/30 hover:bg-rose-950/10 transition-all text-xs font-bold cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Chiqish</span>
          </button>
        </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all hover:bg-slate-800 cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-slate-950 flex items-center justify-center text-[9px] font-extrabold text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                  <div ref={notifRef} className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                      <h4 className="font-bold text-sm text-white">Bildirishnomalar</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 font-semibold border border-slate-850">
                        {notifications.length} ta
                      </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto divide-y divide-slate-850/65 pr-1 space-y-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-500 font-medium">
                          Hozircha bildirishnomalar yo'q
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div key={notif.id} className="py-2.5 space-y-1 text-left">
                            <div className="flex items-center justify-between">
                              <span className={`font-bold text-xs ${notif.is_read ? 'text-slate-400' : 'text-emerald-400'}`}>
                                {notif.title}
                              </span>
                              <span className="text-[9px] text-slate-550 text-slate-500 font-medium">
                                {new Date(notif.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-slate-350 text-xs leading-relaxed font-medium">
                              {notif.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Content Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
          {isLoadingPage ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Topshiriqlar yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Header Banner */}
              <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-3 md:p-4 backdrop-blur-sm">
                <h2 className="text-lg md:text-xl font-extrabold text-white">
                  Salom, {user.full_name}!
                </h2>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">
                  Guruh: <span className="text-emerald-400 font-extrabold">{groupName}</span>. O'quv jarayoni va topshiriqlaringizni boshqaring.
                </p>
              </div>

              {activeTab === 'assignments' ? (
            <>
              {/* Student Statistics Widgets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                
                {/* Stat 1: Total Assignments */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:border-slate-850">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Jami topshiriqlar</span>
                    <p className="text-3xl font-extrabold text-white">{assignments.length}</p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                </div>

                {/* Stat 2: Successfully Submitted */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:border-slate-850">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Muvaffaqiyatli topshirilgan</span>
                    <p className="text-3xl font-extrabold text-white">
                      {assignments.filter(a => a.submission && (a.submission.status === 'accepted' || a.submission.status === 'graded')).length}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                </div>

                {/* Stat 3: Average Score */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 flex items-center justify-between transition-all duration-300 hover:border-slate-850">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">O'rtacha ball</span>
                    <p className="text-3xl font-extrabold text-emerald-400">
                      {(() => {
                        const graded = assignments.filter(a => a.submission && (a.submission.status === 'accepted' || a.submission.status === 'graded') && a.submission.score !== null);
                        return graded.length > 0
                          ? Math.round(graded.reduce((acc, c) => acc + c.submission.score, 0) / graded.length) + ' ball'
                          : '-';
                      })()}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-teal-650/10 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                </div>

              </div>

              {/* Success messages */}
              {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 text-sm animate-fadeIn">
                  <p className="font-semibold">{successMsg}</p>
                </div>
              )}

              {/* Error messages */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm">
                  <p className="font-semibold">{errorMsg}</p>
                </div>
              )}

              {/* Assignments Block */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <FileText className="h-4.5 w-4.5" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Sizga Biriktirilgan Vazifalar ({filteredAssignments.length})</h3>
                  </div>
                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Vazifalarni qidirish..."
                      value={assignmentsSearchQuery}
                      onChange={(e) => setAssignmentsSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-slate-650 transition-all"
                    />
                  </div>
                </div>

                {filteredAssignments.length === 0 ? (
                  /* Empty state */
                  <div className="border border-dashed border-slate-800/80 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-600">
                      <BookOpen className="h-8 w-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-300 mb-1">Hozircha vazifalar yo'q</h4>
                      <p className="text-slate-500 text-sm max-w-xs font-medium">
                        {assignmentsSearchQuery ? "Qidiruv bo'yicha hech qanday vazifa topilmadi." : "Hozircha sizning guruhingizga hech qanday topshiriq biriktirilmagan."}
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Assignments Grid */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAssignments.map((assignment) => {
                      const statusInfo = getSubmissionStatus(assignment);
                      const isOverdue = new Date(assignment.deadline) < new Date();
                      
                      return (
                        <div 
                          key={assignment.id} 
                          className="bg-slate-900/30 border border-slate-900 hover:border-slate-850 rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-black/30 group"
                        >
                          <div className="space-y-4">
                            {/* Header details */}
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border tracking-wide ${statusInfo.badgeClass}`}>
                                {statusInfo.text}
                              </span>
                              <span className="text-slate-500 text-[11px] font-semibold flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDateTime(assignment.created_at)}
                              </span>
                            </div>

                            {/* Title & Desc */}
                            <div>
                              {/* Subject & Lesson Type Badges */}
                              {assignment.subjects && assignment.lesson_types && (
                                <div className="inline-flex items-center mb-2 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-300">
                                  {assignment.subjects.name} | {assignment.lesson_types.name}
                                </div>
                              )}
                              <h4 className="font-extrabold text-lg text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                                {assignment.title}
                              </h4>
                              <p className="text-slate-400 text-sm line-clamp-3 mt-2 leading-relaxed font-medium">
                                {assignment.description}
                              </p>
                              {assignment.file_url && (
                                <div className="mt-3">
                                  <a
                                    href={assignment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-350 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                                  >
                                    <Paperclip className="h-3 w-3 text-emerald-400" />
                                    <span>Vazifaga biriktirilgan fayl</span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Returned Comment Box */}
                          {assignment.submission?.status === 'returned' && assignment.submission?.teacher_comment && (
                            <div className="mt-4 p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-355 text-xs font-medium leading-relaxed">
                              <strong>O'qituvchi izohi:</strong> "{assignment.submission.teacher_comment}"
                            </div>
                          )}

                          {/* Footer Details */}
                          <div className="border-t border-slate-900/60 pt-4 mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="space-y-1.5 text-xs text-slate-500 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-slate-600" />
                                <span>Ustoz:</span>
                                <span className="text-slate-350 font-bold">{assignment.users?.full_name || 'Noma\'lum'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-slate-650" />
                                <span>Deadline:</span>
                                <span className="text-slate-350 font-bold">{formatDateTime(assignment.deadline)}</span>
                              </div>
                            </div>

                            {/* Submit Button */}
                            {statusInfo.canSubmit && (
                              <button
                                onClick={() => handleOpenSubmit(assignment)}
                                className="flex items-center justify-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all self-end sm:self-auto cursor-pointer"
                              >
                                <Send className="h-3.5 w-3.5" />
                                {assignment.submission ? 'Qayta topshirish' : 'Topshirish'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : activeTab === 'attendance' ? (
            /* Attendance Tab Content */
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Calendar className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-xl font-bold text-white">Mening Davomatim</h3>
              </div>

              {isLoadingAttendance ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
                  <p className="text-slate-400 text-sm font-medium">Davomat ma'lumotlari yuklanmoqda...</p>
                </div>
              ) : attendanceError ? (
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm">
                  <p className="font-semibold">{attendanceError}</p>
                </div>
              ) : attendance.length === 0 ? (
                <div className="border border-dashed border-slate-800/80 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-650">
                    <Calendar className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-300 mb-1">Davomat topilmadi</h4>
                    <p className="text-slate-500 text-sm max-w-xs font-medium">
                      Siz uchun hali davomat yozilmagan.
                    </p>
                  </div>
                </div>
              ) : (
                /* Attendance Table */
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
                          <th className="py-4.5 px-6 w-16">#</th>
                          <th 
                            onClick={() => handleAttendanceSort('lesson_date')}
                            className="py-4.5 px-6 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-1">
                              <span>Sana</span>
                              {attendanceSortConfig.key === 'lesson_date' ? (
                                attendanceSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-400" /> : <ArrowDown className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleAttendanceSort('subject_name')}
                            className="py-4.5 px-6 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-1">
                              <span>Fan va Dars turi</span>
                              {attendanceSortConfig.key === 'subject_name' ? (
                                attendanceSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-400" /> : <ArrowDown className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleAttendanceSort('status')}
                            className="py-4.5 px-6 text-center w-40 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Status</span>
                              {attendanceSortConfig.key === 'status' ? (
                                attendanceSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-emerald-400" /> : <ArrowDown className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {sortedAttendance.map((record, idx) => {
                          let badgeStyle = '';
                          let statusLabel = '';

                          if (record.status === 'present') {
                            badgeStyle = 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400';
                            statusLabel = 'Keldi';
                          } else if (record.status === 'absent') {
                            badgeStyle = 'bg-rose-950/30 border-rose-500/30 text-rose-450 text-rose-400';
                            statusLabel = 'Kelmadi';
                          } else if (record.status === 'excused') {
                            badgeStyle = 'bg-amber-950/30 border-amber-500/30 text-amber-400';
                            statusLabel = 'Sababli';
                          } else {
                            badgeStyle = 'bg-slate-900 border-slate-800 text-slate-400';
                            statusLabel = record.status || "Noma'lum";
                          }

                          const formattedDate = (() => {
                            if (!record.lesson_date) return '-';
                            const [year, month, day] = record.lesson_date.split('-');
                            return `${day}.${month}.${year}`;
                          })();

                          return (
                            <tr key={record.id} className="hover:bg-slate-900/20 transition-colors">
                              <td className="py-4 px-6 text-sm font-semibold text-slate-500">{idx + 1}</td>
                              <td className="py-4 px-6 text-sm font-bold text-white">{formattedDate}</td>
                              <td className="py-4 px-6 text-sm font-semibold text-slate-350">
                                <span className="text-slate-200">{record.subjectName}</span>
                                <span className="text-slate-600 mx-2">|</span>
                                <span className="text-slate-400 text-xs px-2 py-0.5 rounded bg-slate-900 border border-slate-800/60">
                                  {record.lessonTypeName}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-block px-3.5 py-1.5 rounded-xl text-xs font-extrabold border ${badgeStyle}`}>
                                  {statusLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'timetable' ? (
        /* Timetable Tab Content */
        <div className="space-y-8 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl font-bold text-white">Dars jadvali</h3>
          </div>

          {isLoadingTimetable ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Dars jadvali yuklanmoqda...</p>
            </div>
          ) : timetableError ? (
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm font-semibold">
              <p>{timetableError}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
              {['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'].map((day) => {
                const classesForDay = timetableData
                  .filter((item) => item.day_of_week === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return (
                  <div 
                    key={day} 
                    className="bg-slate-900/20 border border-slate-900 rounded-3xl p-5 backdrop-blur-sm flex flex-col gap-4 min-h-[250px]"
                  >
                    <div className="text-sm font-extrabold text-white border-b border-slate-900 pb-3 mb-1 flex items-center justify-between">
                      <span>{day}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-950 text-slate-400 font-bold">
                        {classesForDay.length}
                      </span>
                    </div>

                    {classesForDay.length === 0 ? (
                      <div className="text-slate-500 text-xs font-semibold italic text-center py-12">
                        Dars yo'q
                      </div>
                    ) : (
                      classesForDay.map((item) => {
                        const formatTime = (timeStr) => {
                          if (!timeStr) return '';
                          const parts = timeStr.split(':');
                          return parts.slice(0, 2).join(':');
                        };

                        const isCurrent = isClassCurrent(item.day_of_week, item.start_time, item.end_time);

                        return (
                          <div 
                            key={item.id}
                            className={`bg-slate-900/30 rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-black/30 backdrop-blur-md cursor-default flex flex-col justify-between border ${
                              isCurrent 
                                ? 'border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20' 
                                : 'border-slate-900 hover:border-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>{formatTime(item.start_time)} - {formatTime(item.end_time)}</span>
                                </div>
                                {isCurrent && (
                                  <span className="flex items-center gap-1 text-[9px] font-extrabold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md animate-pulse">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    Hozir
                                  </span>
                                )}
                              </div>
                              <div className="font-bold text-sm text-white mt-2 leading-snug">
                                {item.teacher_subjects?.subjects?.name}
                              </div>
                              <div className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                                {item.teacher_subjects?.lesson_types?.name}
                              </div>
                            </div>
                            <div className="border-t border-slate-900/60 pt-3 mt-3 space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                                <span>📍 Xona:</span>
                                <span className="text-slate-200 font-bold">{item.room_number || "Noma'lum"}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                                <span>👨‍🏫 Ustoz:</span>
                                <span className="text-slate-200 font-bold">{item.teacher_subjects?.users?.full_name || "Noma'lum"}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Contract Tab Content */
        <div className="space-y-8 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl font-bold text-white">Mening Shartnomam</h3>
          </div>

          {isLoadingContract ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 bg-slate-900/10 rounded-3xl border border-slate-900">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Shartnoma ma'lumotlari yuklanmoqda...</p>
            </div>
          ) : contractError ? (
            <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm font-semibold">
              <p>{contractError}</p>
            </div>
          ) : contractInfo ? (() => {
            const base = contractInfo.base_amount ?? 16000000;
            const discount = contractInfo.discount_amount ?? 0;
            const paid = contractInfo.paid_amount ?? 0;
            const totalPayable = base - discount;
            const debt = Math.max(0, totalPayable - paid);
            const deadline = contractInfo.deadline;

            const formatVal = (val) => val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
                {/* Main Premium Contract Card */}
                <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[350px]">
                  {/* Decorative background glow */}
                  <div className="absolute -right-24 -top-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
                  
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-850 pb-5 mb-6">
                      <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-widest text-slate-500">Shartnoma holati</span>
                        <h4 className="text-lg font-bold text-white mt-1">Bakalavriat kontrakt shartnomasi</h4>
                      </div>
                      <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase border ${
                        debt > 0 
                          ? 'bg-rose-950/20 border-rose-500/20 text-rose-450' 
                          : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-450'
                      }`}>
                        {debt > 0 ? 'Qarzdorlik mavjud' : 'To\'liq to\'langan'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Asosiy shartnoma summasi</span>
                        <p className="text-lg font-extrabold text-white">{formatVal(base)} UZS</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Chegirma</span>
                        <p className={`text-lg font-extrabold ${discount > 0 ? 'text-emerald-450' : 'text-slate-405 text-slate-400'}`}>
                          {discount > 0 ? `+${formatVal(discount)} UZS` : '0 UZS'}
                        </p>
                      </div>
                      <div className="space-y-1 col-span-2 md:col-span-1">
                        <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider font-extrabold text-indigo-400">Jami to'lanishi kerak</span>
                        <p className="text-lg font-extrabold text-indigo-400">{formatVal(totalPayable)} UZS</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-850 pt-6 mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-450 border border-emerald-500/20">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">To'langan summa</span>
                        <span className="text-base font-extrabold text-white">{formatVal(paid)} UZS</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                        debt > 0 
                          ? 'bg-rose-500/10 text-rose-450 border-rose-500/25' 
                          : 'bg-emerald-500/10 text-emerald-450 border-emerald-500/25'
                      }`}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide block">Qoldiq qarz</span>
                        <span className={`text-base font-extrabold ${debt > 0 ? 'text-rose-450' : 'text-emerald-450'}`}>
                          {formatVal(debt)} UZS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sidebar Info/Block Alerts Card */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-sm flex flex-col justify-between">
                  <div className="space-y-5">
                    <h5 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3">
                      Moliyaviy Cheklovlar & Muddat
                    </h5>
                    
                    <div className="space-y-1.5">
                      <span className="text-slate-500 text-[10px] font-bold uppercase block tracking-wider">To'lov muddati (Deadline)</span>
                      <div className="flex items-center gap-2 text-slate-200">
                        <Calendar className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-extrabold">
                          {deadline ? new Date(deadline).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }) : "Kiritilmagan"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-slate-900/60 pt-4">
                      {debt > 0 ? (
                        <div className="bg-rose-950/20 border border-rose-900/40 p-4.5 rounded-2xl flex gap-3 text-rose-350">
                          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-450" />
                          <div className="text-xs space-y-1 leading-relaxed">
                            <strong className="text-rose-400 block font-extrabold uppercase tracking-wide text-[10px]">Sessiya Bloklangan!</strong>
                            <p className="font-semibold text-rose-300">Shartnoma qarzdorligi aniqlanganligi sababli yakuniy nazoratlarga ruxsat berilmaydi. Iltimos, to'lovni amalga oshiring.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-950/20 border border-emerald-900/40 p-4.5 rounded-2xl flex gap-3 text-emerald-350">
                          <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-450" />
                          <div className="text-xs space-y-1 leading-relaxed">
                            <strong className="text-emerald-400 block font-extrabold uppercase tracking-wide text-[10px]">Tizim Faol</strong>
                            <p className="font-semibold text-emerald-300">Sizda kontrakt qarzdorligi mavjud emas. Yakuniy imtihonlar uchun moliyaviy bloklar yo'q.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 font-bold leading-relaxed border-t border-slate-900/60 pt-4 mt-6">
                    Moliya va kontrakt masalalari bo'yicha o'quv va buxgalteriya bo'limiga murojaat qiling.
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="p-8 text-center text-slate-500 italic font-semibold bg-slate-900/10 border border-slate-900 rounded-3xl">
              Shartnoma ma'lumotlari kiritilmagan.
            </div>
          )}
        </div>
      )}

          {/* Submission Modal */}
          {isModalOpen && selectedAssignment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Overlay */}
              <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={() => !isSaving && setIsModalOpen(false)}
              ></div>

              {/* Modal Container */}
              <div ref={submitModalRef} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 relative z-10 shadow-2xl animate-modalIn flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-extrabold text-white line-clamp-1">
                      {selectedAssignment.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Ustoz: {selectedAssignment.users?.full_name} | Deadline: {formatDateTime(selectedAssignment.deadline)}
                    </p>
                  </div>
                  <button 
                    onClick={() => !isSaving && setIsModalOpen(false)}
                    disabled={isSaving}
                    className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmitSolution} className="flex-1 overflow-y-auto pr-1 py-4 space-y-5">
                  {/* Task specifications preview */}
                  <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl text-slate-400 text-xs leading-relaxed font-medium">
                    <strong className="text-slate-300 block mb-1">Vazifa talabi:</strong>
                    {selectedAssignment.description}
                    {selectedAssignment.file_url && (
                      <div className="mt-3 pt-3 border-t border-slate-900 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-500">Ilova qilingan fayl:</span>
                        <a
                          href={selectedAssignment.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 py-1 px-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-all text-[10px] font-bold cursor-pointer"
                        >
                          <Paperclip className="h-3 w-3 text-indigo-400" />
                          <span>Faylni yuklab olish</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Errors */}
                  {modalError && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm font-semibold">
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
                      <p>{modalError}</p>
                    </div>
                  )}

                  {/* Input area */}
                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="solution-input">
                      Sizning javobingiz *
                    </label>
                    <textarea
                      id="solution-input"
                      rows="6"
                      placeholder="Ushbu yerga kodingizni, GitHub linkini yoki batafsil javobingizni yozing..."
                      value={solutionText}
                      onChange={(e) => setSolutionText(e.target.value)}
                      disabled={isSaving || (new Date(selectedAssignment.deadline) < new Date())}
                      required
                      className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 px-4 text-sm outline-none placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium resize-none"
                    ></textarea>
                  </div>

                  {/* File Upload Input */}
                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1">
                      Fayl biriktirish (Tanlovga ko'ra)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                      disabled={isSaving || (new Date(selectedAssignment.deadline) < new Date())}
                      className="w-full bg-slate-955 bg-slate-955/65 border border-slate-800 text-slate-305 rounded-2xl py-3 px-4 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {selectedAssignment.submission?.file_url && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-350">
                          <Paperclip className="h-4 w-4 text-emerald-450" />
                          <span className="line-clamp-1">Mavjud yuklangan fayl</span>
                        </div>
                        <a
                          href={selectedAssignment.submission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 hover:text-white transition-all text-xs font-bold cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Ko'rish</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Deadline control message */}
                  {new Date(selectedAssignment.deadline) < new Date() && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs font-bold">
                      <AlertCircle className="h-4.5 w-4.5" />
                      <span>Topshiriq muddati o'tgan! Qayta yuborish imkoni mavjud emas.</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="border-t border-slate-800 pt-5 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSaving}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold text-sm transition-all border border-slate-750"
                    >
                      Bekor qilish
                    </button>
                    {!(new Date(selectedAssignment.deadline) < new Date()) && (
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-650 text-white font-bold text-sm shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Yuborilmoqda...
                          </span>
                        ) : (
                          'Vazifani topshirish'
                        )}
                      </button>
                    )}
                  </div>
                </form>

              </div>
            </div>
          )}

          </>
        )}
        </div>
      </main>
    </div>
  );
}
