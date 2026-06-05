import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  LogOut, GraduationCap, Plus, Users, Calendar, 
  FileText, CheckCircle, Clock, AlertCircle, Loader2, X, BookOpen, User,
  Check, ArrowRight, CornerDownRight, MessageSquare, ExternalLink, Bell,
  ChevronLeft, ChevronRight, DollarSign, ArrowUpDown, ArrowUp, ArrowDown,
  Search, Paperclip
} from 'lucide-react';

export default function TeacherDashboard() {
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

  // Subjects, Lesson Types, & Teacher Permissions States
  const [teacherRelations, setTeacherRelations] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLessonType, setSelectedLessonType] = useState('');

  // Local helper to get local date string YYYY-MM-DD
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Tab State Management ('assignments' | 'attendance' | 'gradebook')
  const [activeTab, setActiveTab] = useState('assignments');

  // Attendance states
  const [attendanceDate, setAttendanceDate] = useState(getLocalDateString());
  const [selectedRelationId, setSelectedRelationId] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState('');

  // Gradebook states
  const [gradebookRelationId, setGradebookRelationId] = useState('');
  const [gradebookStudents, setGradebookStudents] = useState([]);
  const [gradebookAssignments, setGradebookAssignments] = useState([]);
  const [gradebookSubmissions, setGradebookSubmissions] = useState([]);
  const [isLoadingGradebook, setIsLoadingGradebook] = useState(false);
  const [gradebookError, setGradebookError] = useState('');
  const [contractsList, setContractsList] = useState([]);

  // Interactive Gradebook scores (HEMIS)
  const [oraliq1Scores, setOraliq1Scores] = useState(() => {
    try {
      const saved = localStorage.getItem('unitask_oraliq1_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [oraliq2Scores, setOraliq2Scores] = useState(() => {
    try {
      const saved = localStorage.getItem('unitask_oraliq2_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [yakuniyScores, setYakuniyScores] = useState(() => {
    try {
      const saved = localStorage.getItem('unitask_yakuniy_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Timetable states
  const [timetableData, setTimetableData] = useState([]);
  const [isLoadingTimetable, setIsLoadingTimetable] = useState(false);
  const [timetableError, setTimetableError] = useState('');

  // Search query states
  const [assignmentsSearchQuery, setAssignmentsSearchQuery] = useState('');
  const [gradebookSearchQuery, setGradebookSearchQuery] = useState('');
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Sorting Config States
  const [gradebookSortConfig, setGradebookSortConfig] = useState({ key: null, direction: 'asc' });
  const [attendanceSortConfig, setAttendanceSortConfig] = useState({ key: null, direction: 'asc' });

  // Sort helpers
  const handleGradebookSort = (key) => {
    let direction = 'asc';
    if (gradebookSortConfig.key === key && gradebookSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setGradebookSortConfig({ key, direction });
  };

  const handleAttendanceSort = (key) => {
    let direction = 'asc';
    if (attendanceSortConfig.key === key && attendanceSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setAttendanceSortConfig({ key, direction });
  };

  // Gradebook helper to compute student stats for sorting
  const getGradebookStudentStats = React.useCallback((student) => {
    const getExamScore = (title) => {
      const ass = gradebookAssignments.find(a => a.title === title);
      if (!ass) return 0;
      const sub = gradebookSubmissions.find(s => s.assignment_id === ass.id && s.student_id === student.id);
      return (sub && typeof sub.score === 'number') ? sub.score : 0;
    };

    const joriyAssignments = gradebookAssignments.filter(a => a.title !== '1-Oraliq' && a.title !== '2-Oraliq' && a.title !== 'Yakuniy');
    const rawJoriy = joriyAssignments.reduce((acc, a) => {
      const sub = gradebookSubmissions.find(s => s.assignment_id === a.id && s.student_id === student.id);
      return acc + ((sub && typeof sub.score === 'number') ? sub.score : 0);
    }, 0);
    const joriy = Math.min(rawJoriy, 30);

    const oraliq1 = getExamScore('1-Oraliq');
    const oraliq2 = getExamScore('2-Oraliq');
    const yakuniy = getExamScore('Yakuniy');

    const jami = joriy + oraliq1 + oraliq2;

    const contract = contractsList.find(c => c.student_id === student.id);
    const baseAmount = contract ? (contract.base_amount ?? 16000000) : 16000000;
    const discountAmount = contract ? (contract.discount_amount ?? 0) : 0;
    const paidAmount = contract ? (contract.paid_amount ?? 0) : 0;
    const debt = Math.max(0, baseAmount - discountAmount - paidAmount);

    const isAllowed = jami >= 36 && debt <= 0;
    const totalBall = jami + (isAllowed ? yakuniy : 0);

    return {
      full_name: student.full_name || '',
      Amaliyot: joriy,
      '1-Oraliq': oraliq1,
      '2-Oraliq': oraliq2,
      Jami: jami,
      Yakuniy: yakuniy,
      totalBall: totalBall
    };
  }, [gradebookAssignments, gradebookSubmissions, contractsList]);

  const sortedGradebookStudents = React.useMemo(() => {
    let result = [...gradebookStudents];
    if (gradebookSearchQuery) {
      const q = gradebookSearchQuery.toLowerCase();
      result = result.filter(s => (s.full_name || '').toLowerCase().includes(q));
    }
    if (gradebookSortConfig.key !== null) {
      result.sort((a, b) => {
        const aStats = getGradebookStudentStats(a);
        const bStats = getGradebookStudentStats(b);
        const aVal = aStats[gradebookSortConfig.key];
        const bVal = bStats[gradebookSortConfig.key];
        if (typeof aVal === 'string') {
          const comp = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
          return gradebookSortConfig.direction === 'asc' ? comp : -comp;
        } else {
          if (aVal < bVal) return gradebookSortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return gradebookSortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return result;
  }, [gradebookStudents, gradebookSortConfig, gradebookSearchQuery, getGradebookStudentStats]);

  // Attendance helper to compute student stats for sorting
  const getAttendanceStudentStats = React.useCallback((student) => {
    const record = attendanceRecords[student.id] || { status: 'absent' };
    return {
      full_name: student.full_name || '',
      status: record.status || 'absent'
    };
  }, [attendanceRecords]);

  const sortedAttendanceStudents = React.useMemo(() => {
    let result = [...students];
    if (attendanceSearchQuery) {
      const q = attendanceSearchQuery.toLowerCase();
      result = result.filter(s => (s.full_name || '').toLowerCase().includes(q));
    }
    if (attendanceSortConfig.key !== null) {
      result.sort((a, b) => {
        const aStats = getAttendanceStudentStats(a);
        const bStats = getAttendanceStudentStats(b);
        const aVal = aStats[attendanceSortConfig.key];
        const bVal = bStats[attendanceSortConfig.key];
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
    return result;
  }, [students, attendanceSortConfig, attendanceSearchQuery, getAttendanceStudentStats]);

  const filteredAssignments = React.useMemo(() => {
    let result = [...assignments];
    if (assignmentsSearchQuery) {
      const q = assignmentsSearchQuery.toLowerCase();
      result = result.filter(a => 
        (a.title || '').toLowerCase().includes(q) || 
        (a.description || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [assignments, assignmentsSearchQuery]);

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Review Modal States (Baholash)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewScore, setReviewScore] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isReviewSaving, setIsReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const notifRef = useRef(null);
  const assignmentModalRef = useRef(null);
  const reviewModalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (isModalOpen && assignmentModalRef.current && !assignmentModalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
      if (isReviewModalOpen && reviewModalRef.current && !reviewModalRef.current.contains(event.target)) {
        setIsReviewModalOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
        setIsModalOpen(false);
        setIsReviewModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isNotifOpen, isModalOpen, isReviewModalOpen]);

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

  const handleSaveGrade = async (studentId, examTitle, val) => {
    let scoreNum = parseFloat(val);
    if (isNaN(scoreNum) || val === '') {
      scoreNum = 0;
    }

    // Validation limits
    if (examTitle === '1-Oraliq' || examTitle === '2-Oraliq') {
      if (scoreNum < 0 || scoreNum > 15) scoreNum = Math.max(0, Math.min(15, scoreNum));
    } else if (examTitle === 'Yakuniy') {
      if (scoreNum < 0 || scoreNum > 40) scoreNum = Math.max(0, Math.min(40, scoreNum));
    }

    // Optimistically update local state immediately so typing is lag-free
    const assignment = gradebookAssignments.find(a => a.title === examTitle);
    if (!assignment) return;

    const existingSub = gradebookSubmissions.find(s => s.assignment_id === assignment.id && s.student_id === studentId);
    
    if (existingSub) {
      setGradebookSubmissions(prev => prev.map(s => s.id === existingSub.id ? { ...s, score: scoreNum } : s));
    } else {
      // Create a temporary local submission to show the value immediately
      const tempId = `temp-${Date.now()}`;
      setGradebookSubmissions(prev => [...prev, {
        id: tempId,
        assignment_id: assignment.id,
        student_id: studentId,
        score: scoreNum,
        status: 'accepted'
      }]);
    }

    // Perform database operations in background using atomic upsert
    try {
      const { data: newSub, error } = await supabase
        .from('submissions')
        .upsert({
          assignment_id: assignment.id,
          student_id: studentId,
          score: scoreNum,
          status: 'accepted',
          solution_text: 'Ustoz tomonidan baholandi',
          teacher_comment: 'Ustoz kiritdi',
          submitted_at: new Date().toISOString()
        }, { onConflict: 'assignment_id,student_id' })
        .select();
        
      if (error) throw error;
      if (newSub && newSub.length > 0) {
        setGradebookSubmissions(prev => {
          const filtered = prev.filter(s => !(s.assignment_id === assignment.id && s.student_id === studentId));
          return [...filtered, newSub[0]];
        });

        // Insert notification for student
        const selectedRelation = teacherRelations.find(rel => rel.id === gradebookRelationId);
        const subjectName = selectedRelation?.subjects?.name || 'Fan';
        await supabase
          .from('notifications')
          .insert({
            user_id: studentId,
            title: `Yangi baho: ${subjectName}`,
            message: `${examTitle} nazorati uchun bahongiz: ${scoreNum} ball`,
            is_read: false
          });
      }
    } catch (err) {
      console.error('Error saving grade:', err);
    }
  };

  // Fetch group students and loaded attendance records
  const loadStudentsForAttendance = async () => {
    if (!selectedRelationId) {
      setStudents([]);
      setAttendanceRecords({});
      return;
    }

    setIsLoadingStudents(true);
    setAttendanceError('');
    setAttendanceSuccess('');

    try {
      // Find the group_id from teacher_subjects using selectedRelationId (UUID string)
      const { data: lessonData, error: lessonError } = await supabase
        .from('teacher_subjects')
        .select('group_id')
        .eq('id', selectedRelationId)
        .single();

      if (lessonError || !lessonData || !lessonData.group_id) {
        throw new Error('Guruh topilmadi.');
      }

      const groupId = lessonData.group_id;

      // 1. Fetch students in the group ordered by full_name ascending
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('group_id', groupId)
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      const loadedStudents = studentsData || [];
      setStudents(loadedStudents);

      // 2. Fetch existing attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('lesson_date', attendanceDate)
        .eq('teacher_subject_id', selectedRelationId);

      if (attendanceError) throw attendanceError;

      const initialStatus = {};
      loadedStudents.forEach(student => {
        initialStatus[student.id] = 'present';
      });

      if (attendanceData && attendanceData.length > 0) {
        attendanceData.forEach(record => {
          if (record.student_id in initialStatus || loadedStudents.some(s => s.id === record.student_id)) {
            initialStatus[record.student_id] = record.status;
          }
        });
      }

      setAttendanceRecords(initialStatus);

    } catch (err) {
      console.error('Error loading students for attendance:', err);
      setAttendanceError('Talabalar ro\'yxatini yuklashda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // Trigger loading students when filters change
  useEffect(() => {
    if (activeTab === 'attendance' && selectedRelationId) {
      loadStudentsForAttendance();
    }
  }, [selectedRelationId, attendanceDate, activeTab]);

  // Fetch Gradebook data
  const loadGradebookData = async () => {
    if (!gradebookRelationId) {
      setGradebookStudents([]);
      setGradebookAssignments([]);
      setGradebookSubmissions([]);
      return;
    }

    setIsLoadingGradebook(true);
    setGradebookError('');

    try {
      // 1. Fetch group_id, subject_id, lesson_type_id from teacher_subjects using gradebookRelationId
      const { data: lessonData, error: lessonError } = await supabase
        .from('teacher_subjects')
        .select('group_id, subject_id, lesson_type_id')
        .eq('id', gradebookRelationId)
        .single();

      if (lessonError || !lessonData || !lessonData.group_id) {
        throw new Error('Guruh/dars topilmadi.');
      }

      const groupId = lessonData.group_id;
      const subjectId = lessonData.subject_id;
      const lessonTypeId = lessonData.lesson_type_id;

      // 2. Fetch all students in that group ordered by full_name ASC
      const { data: studentsData, error: studentsError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'student')
        .eq('group_id', groupId)
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      // 3. Fetch all assignments for this subject_id
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          title,
          lesson_type_id,
          lesson_types (
            id,
            name
          )
        `)
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      let currentAssignments = assignmentsData || [];

      // 4. Fetch submissions for these assignments
      const loadedAssignments = currentAssignments;
      const assignmentIds = loadedAssignments.map(a => a.id);
      
      let submissionsData = [];
      if (assignmentIds.length > 0) {
        const { data: subsData, error: subsError } = await supabase
          .from('submissions')
          .select('assignment_id, student_id, score, status')
          .in('assignment_id', assignmentIds);

        if (subsError) throw subsError;
        submissionsData = subsData || [];
      }

      // 5. Fetch contracts
      const { data: contractsData, error: conError } = await supabase
        .from('contracts')
        .select('*');

      if (conError) throw conError;

      setGradebookStudents(studentsData || []);
      setGradebookAssignments(loadedAssignments);
      setGradebookSubmissions(submissionsData);
      setContractsList(contractsData || []);

    } catch (err) {
      console.error('Error loading gradebook data:', err);
      setGradebookError('Baholar jurnalini yuklashda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsLoadingGradebook(false);
    }
  };

  // Trigger loading Gradebook data when activeTab or selected relation changes
  useEffect(() => {
    if (activeTab === 'gradebook' && gradebookRelationId) {
      loadGradebookData();
    }
  }, [gradebookRelationId, activeTab]);

  // Save/Upsert attendance log
  const handleSaveAttendance = async () => {
    if (!selectedRelationId) {
      setAttendanceError('Iltimos, avval darsni tanlang.');
      return;
    }
    if (students.length === 0) {
      setAttendanceError('Bu guruhda talabalar topilmadi.');
      return;
    }

    setIsSavingAttendance(true);
    setAttendanceError('');
    setAttendanceSuccess('');

    try {
      const records = students.map(student => ({
        lesson_date: attendanceDate,
        teacher_subject_id: selectedRelationId,
        student_id: student.id,
        status: attendanceRecords[student.id] || 'present'
      }));

      // Attempt upsert (requires unique index or conflict resolution)
      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'lesson_date,teacher_subject_id,student_id' });

      if (error) {
        console.warn('Upsert failed, trying delete & insert fallback...', error);
        
        // Fallback: Delete existing for date & lesson combination
        const { error: deleteError } = await supabase
          .from('attendance')
          .delete()
          .eq('lesson_date', attendanceDate)
          .eq('teacher_subject_id', selectedRelationId);

        if (deleteError) throw deleteError;

        // Insert new ones
        const { error: insertError } = await supabase
          .from('attendance')
          .insert(records);

        if (insertError) throw insertError;
      }

      setAttendanceSuccess('Davomat muvaffaqiyatli saqlandi!');
      
      setTimeout(() => {
        setAttendanceSuccess('');
      }, 4000);

    } catch (err) {
      console.error('Error saving attendance:', err);
      setAttendanceError('Davomatni saqlashda xatolik yuz berdi: ' + err.message);
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Compute cascade selections dynamically
  const uniqueSubjects = [];
  const subjectIds = new Set();
  teacherRelations.forEach(rel => {
    if (rel.subjects && rel.subjects.id && !subjectIds.has(rel.subjects.id)) {
      subjectIds.add(rel.subjects.id);
      uniqueSubjects.push(rel.subjects);
    }
  });
  uniqueSubjects.sort((a, b) => a.name.localeCompare(b.name));

  const uniqueLessonTypes = [];
  const lessonTypeIds = new Set();
  if (selectedSubject) {
    teacherRelations.forEach(rel => {
      if (rel.subjects && rel.subjects.id === selectedSubject && rel.lesson_types && rel.lesson_types.id && !lessonTypeIds.has(rel.lesson_types.id)) {
        lessonTypeIds.add(rel.lesson_types.id);
        uniqueLessonTypes.push(rel.lesson_types);
      }
    });
  }
  uniqueLessonTypes.sort((a, b) => a.name.localeCompare(b.name));

  const filteredGroupsForAssignment = [];
  const groupIds = new Set();
  if (selectedSubject && selectedLessonType) {
    teacherRelations.forEach(rel => {
      if (rel.subjects && rel.subjects.id === selectedSubject && 
          rel.lesson_types && rel.lesson_types.id === selectedLessonType && 
          rel.groups && rel.groups.id && 
          !groupIds.has(rel.groups.id)) {
        groupIds.add(rel.groups.id);
        filteredGroupsForAssignment.push(rel.groups);
      }
    });
  }
  filteredGroupsForAssignment.sort((a, b) => a.name.localeCompare(b.name));

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

      // Fetch teacher permissions (teacher_subjects)
      const { data: relationsData, error: relationsError } = await supabase
        .from('teacher_subjects')
        .select('id, subjects(id, name), lesson_types(id, name), groups(id, name)')
        .eq('teacher_id', user.id);
      if (relationsError) throw relationsError;
      setTeacherRelations(relationsData || []);

      // 2. Fetch assignments for this teacher
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          subjects (
            id,
            name
          ),
          lesson_types (
            id,
            name
          ),
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
              title,
              subjects (
                name
              ),
              lesson_types (
                name
              )
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

  // Fetch Timetable data
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
            teacher_id,
            subjects ( name ),
            lesson_types ( name ),
            groups ( name )
          )
        `)
        .eq('teacher_subjects.teacher_id', user.id);
      
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
      loadTimetableData();
    }
  }, [activeTab]);

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
    if (!assignmentTitle.trim() || !assignmentDescription.trim() || !assignmentDeadline || !selectedSubject || !selectedLessonType) {
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
      let fileUrl = null;
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

      // 1. Insert into assignments table
      const { data: newAssignment, error: assignmentError } = await supabase
        .from('assignments')
        .insert([
          {
            title: assignmentTitle.trim(),
            description: assignmentDescription.trim(),
            deadline: new Date(assignmentDeadline).toISOString(),
            teacher_id: user.id,
            subject_id: selectedSubject,
            lesson_type_id: selectedLessonType,
            file_url: fileUrl
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
      setSelectedSubject('');
      setSelectedLessonType('');
      setSelectedGroups([]);
      setSelectedFile(null);
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

  // Helper to determine grading limits based on lesson type
  const getGradingLimits = (submission) => {
    if (!submission || !submission.assignments || !submission.assignments.lesson_types) {
      return { min: 0, max: 15, step: 1 };
    }
    const name = submission.assignments.lesson_types.name;
    if (name === 'Amaliyot' || name === 'Laboratoriya') {
      return { min: 0, max: 3, step: 0.5 };
    }
    return { min: 0, max: 15, step: 1 };
  };

  // Submit Review (Accept or Reject)
  const handleReviewAction = async (newStatus) => {
    const limits = getGradingLimits(selectedSubmission);
    const cleanedScore = reviewScore.replace(',', '.');
    const parsedScore = parseFloat(cleanedScore);
    if (reviewScore !== '') {
      if (isNaN(parsedScore) || parsedScore < limits.min || parsedScore > limits.max) {
        setReviewError(`Baho ${limits.min} va ${limits.max} oralig'ida bo'lishi kerak.`);
        return;
      }
      const remainder = (parsedScore - limits.min) % limits.step;
      if (Math.min(remainder, limits.step - remainder) > 0.0001) {
        setReviewError(`Baho faqat ${limits.step} qadam bilan kiritilishi mumkin.`);
        return;
      }
    }

    setIsReviewSaving(true);
    setReviewError('');

    try {
      const scoreVal = reviewScore === '' ? null : parseFloat(cleanedScore);
      const { error } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          score: scoreVal,
          teacher_comment: reviewComment.trim()
        })
        .eq('id', selectedSubmission.id);

      if (error) throw error;

      // Create notification for the student
      try {
        const assignmentTitle = selectedSubmission.assignments?.title || 'topshiriq';
        const displayScore = scoreVal !== null ? scoreVal : 0;
        await supabase
          .from('notifications')
          .insert([
            {
              user_id: selectedSubmission.student_id,
              title: 'Yangi baho qo\'yildi',
              message: `Sizning ${assignmentTitle} topshirig'ingizga ${displayScore} ball qo'yildi.`,
              is_read: false
            }
          ]);
      } catch (notifErr) {
        console.error('Error creating notification:', notifErr);
      }

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
      alert('Baholashda xatolik yuz berdi: ' + err.message);
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

    const urlRegex = /((?:https?:\/\/|www\.|[a-zA-Z0-9-]+\.[a-zA-Z0-9-]{2,})[^\s]*)/g;
    const parts = text.split(urlRegex);

    return (
      <div className="bg-slate-950 border border-slate-850 p-4 rounded-2xl font-sans text-sm text-slate-300 whitespace-pre-wrap break-all max-h-40 overflow-y-auto leading-relaxed">
        {parts.map((part, index) => {
          if (part.match(urlRegex)) {
            let href = part;
            if (!href.startsWith('http://') && !href.startsWith('https://')) {
              href = 'https://' + href;
            }
            return (
              <a 
                key={index}
                href={href} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:underline font-semibold"
              >
                Link
              </a>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  // CSV Export for Gradebook Table
  const exportToCSV = () => {
    if (!gradebookStudents || gradebookStudents.length === 0) return;

    // 1. Prepare CSV headers
    const headers = [
      "Talaba F.I.Sh.",
      "Joriy nazorat",
      "1-Oraliq",
      "2-Oraliq",
      "Jami",
      "Sessiya holati",
      "Yakuniy nazorat",
      "Umumiy ball"
    ];

    // 2. Prepare CSV rows
    const rows = gradebookStudents.map(student => {
      // Find exam scores
      const getExamScore = (title) => {
        const ass = gradebookAssignments.find(a => a.title === title);
        if (!ass) return '';
        const sub = gradebookSubmissions.find(s => s.assignment_id === ass.id && s.student_id === student.id);
        return (sub && typeof sub.score === 'number') ? sub.score.toString() : '';
      };

      // Joriy nazorat (Amaliyot yoki Laboratoriya) - SUM of assignment scores (raw)
      const joriySubmissions = gradebookAssignments
        .filter(assignment => {
          const typeName = assignment.lesson_types?.name;
          return (typeName === 'Amaliyot' || typeName === 'Laboratoriya') && assignment.title !== '1-Oraliq' && assignment.title !== '2-Oraliq' && assignment.title !== 'Yakuniy';
        })
        .map(assignment => {
          const sub = gradebookSubmissions.find(s => s.assignment_id === assignment.id && s.student_id === student.id);
          return (sub && typeof sub.score === 'number') ? sub.score : 0;
        });
      const rawJoriy = joriySubmissions.reduce((a, b) => a + b, 0);
      const joriy = Math.min(rawJoriy, 30);

      // Ma'ruza online assignments sum for this student
      const lectureSubmissions = gradebookAssignments
        .filter(assignment => assignment.lesson_types?.name === 'Ma\'ruza' && assignment.title !== '1-Oraliq' && assignment.title !== '2-Oraliq' && assignment.title !== 'Yakuniy')
        .map(assignment => {
          const sub = gradebookSubmissions.find(s => s.assignment_id === assignment.id && s.student_id === student.id);
          return (sub && typeof sub.score === 'number') ? sub.score : 0;
        });
      const onlineMaruzaSum = lectureSubmissions.reduce((a, b) => a + b, 0);

      // Oraliq 1 - Max 15 (Combined online Ma'ruza sum + database grade)
      const oraliq1ScoreStr = getExamScore('1-Oraliq');
      const oraliq1ManualVal = oraliq1ScoreStr === '' ? 0 : (parseFloat(oraliq1ScoreStr) || 0);
      const oraliq1Val = onlineMaruzaSum > 0 ? Math.min(onlineMaruzaSum, 15) : Math.min(oraliq1ManualVal, 15);

      // Oraliq 2 - Max 15
      const oraliq2ScoreStr = getExamScore('2-Oraliq');
      const oraliq2ManualVal = oraliq2ScoreStr === '' ? 0 : (parseFloat(oraliq2ScoreStr) || 0);
      const oraliq2Val = Math.min(oraliq2ManualVal, 15);

      // Jami to'plangan ball (Max 60)
      const jami = Math.min(joriy + oraliq1Val + oraliq2Val, 60);

      // Find student's contract
      const contract = contractsList.find(c => c.student_id === student.id);
      const baseAmount = contract ? (contract.base_amount ?? 16000000) : 16000000;
      const discountAmount = contract ? (contract.discount_amount ?? 0) : 0;
      const paidAmount = contract ? (contract.paid_amount ?? 0) : 0;
      const debt = Math.max(0, baseAmount - discountAmount - paidAmount);

      // Sessiya holati (Status): Allowed if Jami >= 36 and no debt
      const isAllowed = jami >= 36 && debt <= 0;

      // Yakuniy nazorat (Sessiya) - Max 40
      const yakuniyScoreStr = getExamScore('Yakuniy');
      const yakuniyVal = isAllowed && yakuniyScoreStr !== '' ? (parseFloat(yakuniyScoreStr) || 0) : 0;

      // Umumiy ball (Max 100)
      const umumiy = jami + (isAllowed ? yakuniyVal : 0);

      const sessiyaStatus = debt > 0 
        ? "Kiritilmadi (Qarz)" 
        : jami < 36 
          ? "Kiritilmadi (Past ball)" 
          : "Ruxsat berilgan";

      return [
        `"${student.full_name.replace(/"/g, '""')}"`,
        `"${joriy} ball"`,
        `"${oraliq1Val} ball"`,
        `"${oraliq2Val} ball"`,
        `"${jami} ball"`,
        `"${sessiyaStatus}"`,
        `"${isAllowed ? (yakuniyScoreStr || '0') : '0'} ball"`,
        `"${umumiy} ball"`
      ];
    });

    // 3. Build CSV content with UTF-8 BOM
    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");

    // 4. Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `gradebook_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submissions Separation
  const pendingSubmissions = submissions.filter(s => s.status === 'pending');
  const checkedSubmissions = submissions.filter(s => s.status === 'accepted' || s.status === 'rejected' || s.status === 'graded' || s.status === 'returned');

  const selectedRelation = teacherRelations.find(rel => rel.id === gradebookRelationId);
  const isLectureSelected = selectedRelation?.lesson_types?.name === 'Ma\'ruza';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Sidebar Navigation */}
      <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-80'} bg-slate-900/40 border-r border-slate-900 flex flex-col justify-between backdrop-blur-xl shrink-0 overflow-hidden`}>
        <div>
          {/* Logo */}
          {isSidebarCollapsed ? (
            <div className="p-6 border-b border-slate-900 flex items-center justify-center">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-650 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-slate-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-650 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">UniTask</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Teacher Workspace</p>
              </div>
            </div>
          )}

          {/* User Profile */}
          {isSidebarCollapsed ? (
            <div className="p-5 border-b border-slate-900 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-indigo-400 uppercase">
                {user.full_name ? user.full_name.substring(0, 2) : 'T'}
              </div>
            </div>
          ) : (
            <div className="p-5 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-indigo-400 uppercase">
                  {user.full_name ? user.full_name.substring(0, 2) : 'T'}
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">{user.full_name || 'O\'qituvchi'}</h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-0.5">O'qituvchi</p>
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
                  ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <FileText className={`h-4.5 w-4.5 ${activeTab === 'assignments' ? 'text-indigo-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Vazifalar boshqaruvi</span>}
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'attendance' 
                  ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Calendar className={`h-4.5 w-4.5 ${activeTab === 'attendance' ? 'text-indigo-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Davomat jurnali</span>}
            </button>
            <button
              onClick={() => setActiveTab('gradebook')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'gradebook' 
                  ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Users className={`h-4.5 w-4.5 ${activeTab === 'gradebook' ? 'text-indigo-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Baholar jurnali</span>}
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'timetable' 
                  ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Calendar className={`h-4.5 w-4.5 ${activeTab === 'timetable' ? 'text-indigo-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Dars jadvali</span>}
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
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-900 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-bold text-xs">Workspace</span>
            <span className="text-slate-700 text-xs">/</span>
            <span className="text-white font-extrabold text-xs capitalize">
              {activeTab === 'assignments' ? 'Vazifalar boshqaruvi' : activeTab === 'attendance' ? 'Davomat jurnali' : activeTab === 'gradebook' ? 'Baholar jurnali' : 'Dars jadvali'}
            </span>
          </div>
          <div className="flex items-center gap-4">
        {/* User display & logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-350 text-xs font-semibold">
            <User className="h-3.5 w-3.5 text-indigo-400" />
            <span>{user.full_name}</span>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem('unitask_user');
              localStorage.removeItem('user');
              navigate('/');
            }}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-455 bg-slate-900/30 hover:bg-rose-950/10 transition-all text-xs font-bold cursor-pointer"
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
                              <span className={`font-bold text-xs ${notif.is_read ? 'text-slate-400' : 'text-indigo-400'}`}>
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
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-slate-400 text-sm">Ma'lumotlar yuklanmoqda...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Welcome Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/20 border border-slate-900 rounded-2xl p-3 md:p-4 backdrop-blur-sm">
                <div>
                  <h2 className="text-lg md:text-xl font-extrabold text-white">
                    Salom, {user.full_name || "Hurmatli O'qituvchi"}!
                  </h2>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">
                    Bugun yangi topshiriqlar yarating yoki talabalar yuborgan javoblarni baholang.
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => { setSelectedFile(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
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

          {activeTab === 'assignments' ? (
            <>
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
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Yuborilgan Vazifalar ({filteredAssignments.length})</h3>
                </div>
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Vazifalarni qidirish..."
                    value={assignmentsSearchQuery}
                    onChange={(e) => setAssignmentsSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-900 rounded-xl py-2 pl-9 pr-4 text-xs font-semibold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-650 transition-all"
                  />
                </div>
              </div>

              {filteredAssignments.length === 0 ? (
                /* Empty State */
                <div className="border border-dashed border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-600">
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-300 mb-1">Hozircha vazifalar yo'q</h4>
                    <p className="text-slate-500 text-sm max-w-xs font-medium">
                      {assignmentsSearchQuery ? "Qidiruv bo'yicha hech qanday vazifa topilmadi." : "Talabalar uchun yangi vazifalar yaratib, ularni guruhlar bo'yicha yuboring."}
                    </p>
                  </div>
                </div>
              ) : (
                /* Assignments Grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredAssignments.map((assignment) => {
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
                            {assignment.subjects && assignment.lesson_types && (
                              <div className="inline-flex items-center mb-2.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-bold text-indigo-300">
                                {assignment.subjects.name} | {assignment.lesson_types.name}
                              </div>
                            )}
                            <h4 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {assignment.title}
                            </h4>
                            <p className="text-slate-400 text-sm line-clamp-3 mt-1.5 leading-relaxed font-medium">
                              {assignment.description}
                            </p>
                            {assignment.file_url && (
                              <div className="mt-2.5">
                                <a
                                  href={assignment.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-350 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                                >
                                  <Paperclip className="h-3 w-3 text-indigo-400" />
                                  <span>Biriktirilgan fayl</span>
                                </a>
                              </div>
                            )}
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
            <div className="space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              
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
                        <div className="text-slate-400 text-xs font-semibold mb-1.5 truncate">
                          Topshiriq: {sub.assignments?.title}
                        </div>
                        {sub.assignments?.subjects && sub.assignments?.lesson_types && (
                          <div className="inline-flex items-center mb-3 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300">
                            {sub.assignments.subjects.name} | {sub.assignments.lesson_types.name}
                          </div>
                        )}
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
                          <div className="text-slate-550 text-slate-500 text-xs font-semibold mb-1.5 truncate">
                            {sub.assignments?.title}
                          </div>
                          {sub.assignments?.subjects && sub.assignments?.lesson_types && (
                            <div className="inline-flex items-center mb-3 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-300">
                              {sub.assignments.subjects.name} | {sub.assignments.lesson_types.name}
                            </div>
                          )}
                          
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
        </>
      ) : activeTab === 'attendance' ? (
        /* Attendance Tab Content */
        <div className="space-y-8 animate-fadeIn">
          {/* Filters Form */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-sm space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Davomat Filtrlar</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Date Picker */}
              <div>
                <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="attendance-date">
                  Dars sanasi
                </label>
                <input
                  id="attendance-date"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="[color-scheme:dark] w-full bg-slate-955 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
                />
              </div>

              {/* Class Dropdown */}
              <div>
                <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="attendance-relation">
                  Darsni tanlang
                </label>
                <div className="relative">
                  <select
                    id="attendance-relation"
                    value={selectedRelationId}
                    onChange={(e) => setSelectedRelationId(e.target.value)}
                    className="w-full bg-slate-955 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 pl-4 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-500">Darsni tanlang...</option>
                    {teacherRelations.map((rel) => {
                      const subjectName = rel.subjects?.name || 'Noma\'lum fan';
                      const typeName = rel.lesson_types?.name || 'Noma\'lum tur';
                      const groupName = rel.groups?.name || 'Noma\'lum guruh';
                      return (
                        <option key={rel.id} value={rel.id} className="bg-slate-900 text-white">
                          {`${subjectName} | ${typeName} | ${groupName}`}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search Bar for Attendance */}
              <div>
                <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1">
                  Talabani qidirish
                </label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    disabled={!selectedRelationId}
                    placeholder={selectedRelationId ? "Ism bo'yicha qidirish..." : "Dars tanlanmagan"}
                    value={attendanceSearchQuery}
                    onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                    className="w-full bg-slate-955 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 pl-10 pr-4 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-650 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Journal Section */}
          {!selectedRelationId ? (
            <div className="border border-dashed border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-600">
                <Users className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-350 mb-1">Dars tanlanmagan</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Davomat jurnalini ochish va yo'qlama qilish uchun yuqoridagi ro'yxatdan tegishli darsni tanlang.
                </p>
              </div>
            </div>
          ) : isLoadingStudents ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Talabalar ro'yxati yuklanmoqda...</p>
            </div>
          ) : (!students || students.length === 0) ? (
            <div className="border border-slate-900 rounded-3xl p-12 text-center bg-slate-900/10">
              <p className="text-slate-500 text-sm">Ushbu guruhda talabalar topilmadi.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Alert Messages */}
              {attendanceSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-900/50 text-emerald-200 text-sm">
                  <p className="font-semibold">{attendanceSuccess}</p>
                </div>
              )}
              {attendanceError && (
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm">
                  <p className="font-semibold">{attendanceError}</p>
                </div>
              )}

              {/* Journal Table Card */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
                        <th className="py-4.5 px-6 w-16">#</th>
                        <th 
                          onClick={() => handleAttendanceSort('full_name')}
                          className="py-4.5 px-6 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center gap-1">
                            <span>Talabaning F.I.Sh.</span>
                            {attendanceSortConfig.key === 'full_name' ? (
                              attendanceSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleAttendanceSort('status')}
                          className="py-4.5 px-6 text-center w-96 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Davomat holati</span>
                            {attendanceSortConfig.key === 'status' ? (
                              attendanceSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {sortedAttendanceStudents.map((student, idx) => {
                        const currentStatus = attendanceRecords[student.id] || 'present';
                        return (
                          <tr key={student.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-4 px-6 text-sm font-semibold text-slate-500">{idx + 1}</td>
                            <td className="py-4 px-6 text-sm font-bold text-white">{student.full_name}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-center gap-2">
                                {/* Keldi (Present) */}
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'present' }))}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    currentStatus === 'present'
                                      ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-400 shadow-md shadow-emerald-500/5'
                                      : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:text-slate-400 hover:border-slate-800'
                                  }`}
                                >
                                  Keldi
                                </button>
                                {/* Kelmadi (Absent) */}
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'absent' }))}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    currentStatus === 'absent'
                                      ? 'bg-rose-950/30 border-rose-500/50 text-rose-450 text-rose-400 shadow-md shadow-rose-500/5'
                                      : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:text-rose-400 hover:border-slate-800'
                                  }`}
                                >
                                  Kelmadi
                                </button>
                                {/* Sababli (Excused) */}
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'excused' }))}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                    currentStatus === 'excused'
                                      ? 'bg-amber-950/30 border-amber-500/50 text-amber-400 shadow-md shadow-amber-500/5'
                                      : 'bg-slate-950/40 border-slate-850 text-slate-500 hover:text-amber-400 hover:border-slate-800'
                                  }`}
                                >
                                  Sababli
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={isSavingAttendance}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSavingAttendance ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Davomatni saqlash
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'gradebook' ? (
        /* Gradebook Tab Content */
        <div className="space-y-8 animate-fadeIn">
          {/* Filters Form */}
          <div className="bg-slate-900/20 border border-slate-900 rounded-3xl p-6 md:p-8 backdrop-blur-sm space-y-6">
            <h3 className="text-xl font-bold text-white mb-4">Baholar Jurnali Filtrlar</h3>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              {/* Class Dropdown */}
              <div className="flex-1 max-w-md">
                <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="gradebook-relation">
                  Darsni tanlang
                </label>
                <div className="relative">
                  <select
                    id="gradebook-relation"
                    value={gradebookRelationId}
                    onChange={(e) => setGradebookRelationId(e.target.value)}
                    className="w-full bg-slate-950 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 pl-4 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="" className="bg-slate-900 text-slate-500">Darsni tanlang...</option>
                    {teacherRelations.map((rel) => {
                      const subjectName = rel.subjects?.name || 'Noma\'lum fan';
                      const typeName = rel.lesson_types?.name || 'Noma\'lum tur';
                      const groupName = rel.groups?.name || 'Noma\'lum guruh';
                      return (
                        <option key={rel.id} value={rel.id} className="bg-slate-900 text-white">
                          {`${subjectName} | ${typeName} | ${groupName}`}
                        </option>
                      );
                    })}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Search Bar for Gradebook */}
              {gradebookRelationId && (
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Talabani qidirish..."
                    value={gradebookSearchQuery}
                    onChange={(e) => setGradebookSearchQuery(e.target.value)}
                    className="w-full bg-slate-955 bg-slate-950/60 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-semibold text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-slate-650 transition-all"
                  />
                </div>
              )}

              {/* CSV Download Button */}
              {gradebookRelationId && gradebookStudents && gradebookStudents.length > 0 && (
                <button
                  type="button"
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-650 hover:to-violet-750 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer animate-fadeIn"
                >
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Jadvalni yuklab olish (CSV)
                </button>
              )}
            </div>
          </div>

          {/* Gradebook Grid Table */}
          {!gradebookRelationId ? (
            <div className="border border-dashed border-slate-800/80 rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-850 flex items-center justify-center text-slate-600">
                <Users className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-350 mb-1">Dars tanlanmagan</h4>
                <p className="text-slate-500 text-sm max-w-xs mx-auto">
                  Baholar jurnalini ochish uchun yuqoridagi ro'yxatdan tegishli darsni tanlang.
                </p>
              </div>
            </div>
          ) : isLoadingGradebook ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              <p className="text-slate-400 text-sm font-medium">Baholar jurnali yuklanmoqda...</p>
            </div>
          ) : (!gradebookStudents || gradebookStudents.length === 0) ? (
            <div className="border border-slate-900 rounded-3xl p-12 text-center bg-slate-900/10">
              <p className="text-slate-500 text-sm">Ushbu guruhda talabalar topilmadi.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {gradebookError && (
                <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm">
                  <p className="font-semibold">{gradebookError}</p>
                </div>
              )}

              {/* Table wrapper with overflow-x-auto */}
              <div className="bg-slate-900/30 border border-slate-900 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-955/40 text-slate-400 text-xs font-bold uppercase tracking-wider select-none">
                        <th className="py-4.5 px-6 w-16 text-center">#</th>
                        <th 
                          onClick={() => handleGradebookSort('full_name')}
                          className="py-4.5 px-6 min-w-[220px] cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center gap-1">
                            <span>Talaba F.I.Sh.</span>
                            {gradebookSortConfig.key === 'full_name' ? (
                              gradebookSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleGradebookSort('Amaliyot')}
                          className="py-4.5 px-6 text-center w-40 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Joriy nazorat</span>
                            {gradebookSortConfig.key === 'Amaliyot' ? (
                              gradebookSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleGradebookSort('1-Oraliq')}
                          className="py-4.5 px-6 text-center w-44 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>1-Oraliq (Max 15)</span>
                            {gradebookSortConfig.key === '1-Oraliq' ? (
                              gradebookSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleGradebookSort('2-Oraliq')}
                          className="py-4.5 px-6 text-center w-44 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>2-Oraliq (Max 15)</span>
                            {gradebookSortConfig.key === '2-Oraliq' ? (
                              gradebookSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleGradebookSort('Jami')}
                          className="py-4.5 px-6 text-center w-36 bg-slate-955/20 text-slate-355 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Jami</span>
                            {gradebookSortConfig.key === 'Jami' ? (
                              gradebookSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="py-4.5 px-6 text-center w-44 text-slate-400">Sessiya holati</th>
                        <th 
                          onClick={() => handleGradebookSort('Yakuniy')}
                          className="py-4.5 px-6 text-center w-48 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Yakuniy nazorat (Max 40)</span>
                            {gradebookSortConfig.key === 'Yakuniy' ? (
                              gradebookSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleGradebookSort('totalBall')}
                          className="py-4.5 px-6 text-center w-36 bg-indigo-950/20 text-indigo-400 cursor-pointer hover:bg-indigo-950/40 hover:text-white transition-colors group"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>Umumiy ball</span>
                            {gradebookSortConfig.key === 'totalBall' ? (
                              gradebookSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        </th>
                        <th className="py-4.5 px-6 text-center w-44">O'zlashtirish</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {sortedGradebookStudents.map((student, idx) => {
                        // Find exam scores
                        const getExamScore = (title) => {
                          const ass = gradebookAssignments.find(a => a.title === title);
                          if (!ass) return '';
                          const sub = gradebookSubmissions.find(s => s.assignment_id === ass.id && s.student_id === student.id);
                          return (sub && typeof sub.score === 'number') ? sub.score.toString() : '';
                        };

                        // Joriy nazorat (Amaliyot yoki Laboratoriya) - SUM of assignment scores (raw)
                        const joriySubmissions = gradebookAssignments
                          .filter(assignment => {
                            const typeName = assignment.lesson_types?.name;
                            return (typeName === 'Amaliyot' || typeName === 'Laboratoriya') && assignment.title !== '1-Oraliq' && assignment.title !== '2-Oraliq' && assignment.title !== 'Yakuniy';
                          })
                          .map(assignment => {
                            const sub = gradebookSubmissions.find(s => s.assignment_id === assignment.id && s.student_id === student.id);
                            return (sub && typeof sub.score === 'number') ? sub.score : 0;
                          });
                        const rawJoriy = joriySubmissions.reduce((a, b) => a + b, 0);
                        const joriy = Math.min(rawJoriy, 30);

                        // Ma'ruza online assignments sum for this student
                        const lectureSubmissions = gradebookAssignments
                          .filter(assignment => assignment.lesson_types?.name === 'Ma\'ruza' && assignment.title !== '1-Oraliq' && assignment.title !== '2-Oraliq' && assignment.title !== 'Yakuniy')
                          .map(assignment => {
                            const sub = gradebookSubmissions.find(s => s.assignment_id === assignment.id && s.student_id === student.id);
                            return (sub && typeof sub.score === 'number') ? sub.score : 0;
                          });
                        const onlineMaruzaSum = lectureSubmissions.reduce((a, b) => a + b, 0);

                        // Oraliq 1 - Max 15 (Directly online sum if exists, otherwise database grade)
                        const oraliq1ScoreStr = getExamScore('1-Oraliq');
                        const oraliq1ManualVal = oraliq1ScoreStr === '' ? 0 : (parseFloat(oraliq1ScoreStr) || 0);
                        const oraliq1Val = onlineMaruzaSum > 0 ? Math.min(onlineMaruzaSum, 15) : Math.min(oraliq1ManualVal, 15);

                        // Oraliq 2 - Max 15
                        const oraliq2ScoreStr = getExamScore('2-Oraliq');
                        const oraliq2ManualVal = oraliq2ScoreStr === '' ? 0 : (parseFloat(oraliq2ScoreStr) || 0);
                        const oraliq2Val = Math.min(oraliq2ManualVal, 15);

                        // Jami to'plangan ball (Max 60)
                        const jami = Math.min(joriy + oraliq1Val + oraliq2Val, 60);

                        // Find student's contract
                        const contract = contractsList.find(c => c.student_id === student.id);
                        const baseAmount = contract ? (contract.base_amount ?? 16000000) : 16000000;
                        const discountAmount = contract ? (contract.discount_amount ?? 0) : 0;
                        const paidAmount = contract ? (contract.paid_amount ?? 0) : 0;
                        const debt = Math.max(0, baseAmount - discountAmount - paidAmount);

                        // Sessiya holati (Status): Allowed if Jami >= 36 and no debt
                        const isAllowed = jami >= 36 && debt <= 0;

                        // Yakuniy nazorat (Sessiya) - Max 40
                        const yakuniyScoreStr = getExamScore('Yakuniy');
                        const yakuniyVal = isAllowed && yakuniyScoreStr !== '' ? (parseFloat(yakuniyScoreStr) || 0) : 0;

                        // Umumiy ball (Max 100)
                        const umumiy = jami + (isAllowed ? yakuniyVal : 0);

                        // O'zlashtirish (Yopildi / Qayta topshirish): Allowed if Jami + Yakuniy >= 60
                        const isPassed = (jami + (isAllowed ? yakuniyVal : 0)) >= 60;

                        return (
                          <tr key={student.id} className="hover:bg-slate-900/20 transition-colors">
                            <td className="py-4 px-6 text-sm font-semibold text-slate-500 text-center">{idx + 1}</td>
                            <td className="py-4 px-6 text-sm font-bold text-white">{student.full_name}</td>
                            
                            {/* Joriy */}
                            <td className="py-4 px-6 text-center text-sm font-semibold text-slate-300">
                              {joriy} ball
                            </td>

                             {/* 1-Oraliq (Input field) */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col items-center justify-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max="15"
                                  placeholder="0"
                                  value={onlineMaruzaSum > 0 ? onlineMaruzaSum : oraliq1ScoreStr}
                                  onChange={(e) => handleSaveGrade(student.id, '1-Oraliq', e.target.value)}
                                  disabled={onlineMaruzaSum > 0 || !isLectureSelected}
                                  className="w-20 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-1.5 px-2.5 text-center text-sm outline-none focus:ring-1 focus:ring-indigo-500/25 transition-all font-semibold disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-slate-900/50"
                                />
                              </div>
                            </td>

                            {/* 2-Oraliq (Input field) */}
                            <td className="py-4 px-6">
                              <div className="flex flex-col items-center justify-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max="15"
                                  placeholder="0"
                                  value={oraliq2ScoreStr}
                                  onChange={(e) => handleSaveGrade(student.id, '2-Oraliq', e.target.value)}
                                  disabled={!isLectureSelected}
                                  className="w-20 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-1.5 px-2.5 text-center text-sm outline-none focus:ring-1 focus:ring-indigo-500/25 transition-all font-semibold disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-slate-900/50"
                                />
                              </div>
                            </td>

                            {/* Jami */}
                            <td className="py-4 px-6 text-center text-sm font-extrabold text-white bg-slate-955/10">
                              {jami} ball
                            </td>

                            {/* Sessiya holati */}
                            <td className="py-4 px-6 text-center">
                              {debt > 0 ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs font-extrabold uppercase">
                                  Kiritilmadi (Qarz)
                                </span>
                              ) : jami < 36 ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs font-extrabold uppercase">
                                  Kiritilmadi (Past ball)
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-extrabold uppercase">
                                  Ruxsat berilgan
                                </span>
                              )}
                            </td>

                            {/* Yakuniy (Input field - disabled if not allowed) */}
                            <td className="py-4 px-6">
                              <div className="flex justify-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max="40"
                                  placeholder="0"
                                  value={isAllowed ? yakuniyScoreStr : ''}
                                  onChange={(e) => handleSaveGrade(student.id, 'Yakuniy', e.target.value)}
                                  disabled={!isAllowed}
                                  className="w-20 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-1.5 px-2.5 text-center text-sm outline-none focus:ring-1 focus:ring-indigo-500/25 transition-all font-semibold disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                              </div>
                            </td>

                            {/* Umumiy */}
                            <td className="py-4 px-6 text-center text-sm font-extrabold text-indigo-400 bg-indigo-950/10">
                              {umumiy} ball
                            </td>

                            {/* O'zlashtirish */}
                            <td className="py-4 px-6 text-center">
                              {isPassed ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-bold">
                                  O'tdi
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs font-bold">
                                  Qayta topshirish
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Timetable Tab Content */
        <div className="space-y-8 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-xl font-bold text-white">Dars jadvali</h3>
          </div>

          {isLoadingTimetable ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
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
                                <div className={`flex items-center gap-1.5 text-xs font-bold ${isCurrent ? 'text-emerald-400' : 'text-indigo-400'}`}>
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
                              <div className={`inline-flex items-center mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                isCurrent 
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                              }`}>
                                {item.teacher_subjects?.lesson_types?.name}
                              </div>
                            </div>
                            <div className="border-t border-slate-900/60 pt-3 mt-3 space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                                <span>📍 Xona:</span>
                                <span className="text-slate-200 font-bold">{item.room_number || "Noma'lum"}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                                <span>👥 Guruh:</span>
                                <span className="text-slate-200 font-bold">{item.teacher_subjects?.groups?.name || "Noma'lum"}</span>
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
      )}

          {/* Yangi Vazifa Yaratish Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
                onClick={() => !isSaving && setIsModalOpen(false)}
              ></div>

              <div ref={assignmentModalRef} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 relative z-10 shadow-2xl animate-modalIn max-h-[90vh] flex flex-col">
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
                      className="[color-scheme:dark] w-full bg-slate-955 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="modal-subject">
                      Fanni tanlang *
                    </label>
                    <div className="relative">
                      <select
                        id="modal-subject"
                        value={selectedSubject}
                        onChange={(e) => {
                          setSelectedSubject(e.target.value);
                          setSelectedLessonType('');
                          setSelectedGroups([]);
                        }}
                        disabled={isSaving}
                        required
                        className="w-full bg-slate-955 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-slate-900 text-slate-500">Fanni tanlang...</option>
                        {uniqueSubjects.map((sub) => (
                          <option key={sub.id} value={sub.id} className="bg-slate-900 text-white">
                            {sub.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-355 text-slate-350 text-sm font-semibold mb-2 ml-1" htmlFor="modal-lesson-type">
                      Dars turi *
                    </label>
                    <div className="relative">
                      <select
                        id="modal-lesson-type"
                        value={selectedLessonType}
                        onChange={(e) => {
                          setSelectedLessonType(e.target.value);
                          setSelectedGroups([]);
                        }}
                        disabled={isSaving || !selectedSubject}
                        required
                        className="w-full bg-slate-955 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="" className="bg-slate-900 text-slate-500">
                          {!selectedSubject ? 'Fanni tanlang...' : 'Dars turini tanlang...'}
                        </option>
                        {uniqueLessonTypes.map((lt) => (
                          <option key={lt.id} value={lt.id} className="bg-slate-900 text-white">
                            {lt.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1">
                      Yuboriladigan guruhlar (Multi-select) *
                    </label>
                    
                    {!selectedSubject || !selectedLessonType ? (
                      <p className="text-slate-500 text-xs italic ml-1 bg-slate-950/40 p-3 rounded-2xl border border-slate-900/60">
                        Guruhlarni ko'rish uchun avval Fan va Dars turini tanlang.
                      </p>
                    ) : filteredGroupsForAssignment.length === 0 ? (
                      <p className="text-slate-500 text-xs italic ml-1 bg-slate-950/40 p-3 rounded-2xl border border-slate-900/60">
                        Ushbu fan va dars turi bo'yicha guruhlar biriktirilmagan.
                      </p>
                    ) : (
                      <div className="bg-slate-955 bg-slate-950/60 border border-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                        {filteredGroupsForAssignment.map((g) => {
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

                  <div>
                    <label className="block text-slate-350 text-sm font-semibold mb-2 ml-1">
                      Fayl biriktirish (Tanlovga ko'ra)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files[0] || null)}
                      disabled={isSaving}
                      className="w-full bg-slate-950/60 border border-slate-800 text-slate-300 rounded-2xl py-3 px-4 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                    />
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

              <div ref={reviewModalRef} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 relative z-10 shadow-2xl animate-modalIn flex flex-col max-h-[90vh]">
                
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
                    {selectedSubmission.assignments?.lesson_types?.name && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-300">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        Dars turi: {selectedSubmission.assignments.lesson_types.name}
                      </div>
                    )}
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Talaba Javobi:</span>
                    {renderSolutionText(selectedSubmission.solution_text)}
                    {selectedSubmission.file_url && (
                      <div className="mt-2.5 p-3 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-350">
                          <Paperclip className="h-4 w-4 text-indigo-400" />
                          <span>Yuborilgan fayl:</span>
                        </div>
                        <a
                          href={selectedSubmission.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-white transition-all text-xs font-bold cursor-pointer"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Faylni ko'rish/Yuklash</span>
                        </a>
                      </div>
                    )}
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
                      Baho (Score: {getGradingLimits(selectedSubmission).min} - {getGradingLimits(selectedSubmission).max})
                    </label>
                    <input
                      id="review-score"
                      type="number"
                      step={getGradingLimits(selectedSubmission).step}
                      min={getGradingLimits(selectedSubmission).min}
                      max={getGradingLimits(selectedSubmission).max}
                      placeholder={`Masalan: ${getGradingLimits(selectedSubmission).max}`}
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
          </>
        )}
        </div>
      </main>
    </div>
  );
}
