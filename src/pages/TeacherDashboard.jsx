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

  // Real-Time Time Tracking
  const [currentTimeState, setCurrentTimeState] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeState(new Date());
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

  useEffect(() => {
    localStorage.setItem('unitask_oraliq1_scores', JSON.stringify(oraliq1Scores));
  }, [oraliq1Scores]);

  useEffect(() => {
    localStorage.setItem('unitask_oraliq2_scores', JSON.stringify(oraliq2Scores));
  }, [oraliq2Scores]);

  useEffect(() => {
    localStorage.setItem('unitask_yakuniy_scores', JSON.stringify(yakuniyScores));
  }, [yakuniyScores]);

  const handleOraliq1Change = (studentId, value) => {
    let score = value;
    if (value !== '') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (num > 15) score = '15';
        if (num < 0) score = '0';
      }
    }
    setOraliq1Scores(prev => ({
      ...prev,
      [studentId]: score
    }));
  };

  const handleOraliq2Change = (studentId, value) => {
    let score = value;
    if (value !== '') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (num > 15) score = '15';
        if (num < 0) score = '0';
      }
    }
    setOraliq2Scores(prev => ({
      ...prev,
      [studentId]: score
    }));
  };

  const handleYakuniyChange = (studentId, value) => {
    let score = value;
    if (value !== '') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        if (num > 40) score = '40';
        if (num < 0) score = '0';
      }
    }
    setYakuniyScores(prev => ({
      ...prev,
      [studentId]: score
    }));
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

      // 3. Fetch assignments for this subject_id and lesson_type_id = 'Amaliyot'
      const { data: amaliyotType } = await supabase
        .from('lesson_types')
        .select('id')
        .eq('name', 'Amaliyot')
        .maybeSingle();

      const amaliyotTypeId = amaliyotType?.id;

      let assignmentsQuery = supabase
        .from('assignments')
        .select('id, title')
        .eq('subject_id', subjectId);

      if (amaliyotTypeId) {
        assignmentsQuery = assignmentsQuery.eq('lesson_type_id', amaliyotTypeId);
      } else {
        assignmentsQuery = assignmentsQuery.eq('lesson_type_id', lessonTypeId);
      }

      const { data: assignmentsData, error: assignmentsError } = await assignmentsQuery
        .order('created_at', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // 4. Fetch submissions for these assignments
      const loadedAssignments = assignmentsData || [];
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

      setGradebookStudents(studentsData || []);
      setGradebookAssignments(loadedAssignments);
      setGradebookSubmissions(submissionsData);

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
            lesson_type_id: selectedLessonType
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

          {/* Tab Navigation (Premium Capsule Slider) */}
          <div className="bg-slate-900/40 border border-slate-850 p-1.5 rounded-2xl flex gap-1.5 w-fit">
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'assignments'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Vazifalar boshqaruvi
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'attendance'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Davomat jurnali
            </button>
            <button
              onClick={() => setActiveTab('gradebook')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'gradebook'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Baholar jurnali
            </button>
            <button
              onClick={() => setActiveTab('timetable')}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'timetable'
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              Dars jadvali
            </button>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full bg-slate-955 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
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
                      <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4.5 px-6 w-16">#</th>
                        <th className="py-4.5 px-6">Talabaning F.I.Sh.</th>
                        <th className="py-4.5 px-6 text-center w-96">Davomat holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {students.map((student, idx) => {
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Dropdown */}
              <div>
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
                      <tr className="border-b border-slate-800 bg-slate-955/40 text-slate-400 text-xs font-bold uppercase tracking-wider">
                        <th className="py-4.5 px-6 w-16 text-center">#</th>
                        <th className="py-4.5 px-6 min-w-[220px]">Talaba F.I.Sh.</th>
                        <th className="py-4.5 px-6 text-center w-40">Joriy nazorat</th>
                        <th className="py-4.5 px-6 text-center w-44">1-Oraliq (Max 15)</th>
                        <th className="py-4.5 px-6 text-center w-44">2-Oraliq (Max 15)</th>
                        <th className="py-4.5 px-6 text-center w-36 bg-slate-955/20 text-slate-350">Jami</th>
                        <th className="py-4.5 px-6 text-center w-44">Sessiya holati</th>
                        <th className="py-4.5 px-6 text-center w-48">Yakuniy nazorat (Max 40)</th>
                        <th className="py-4.5 px-6 text-center w-36 bg-indigo-950/20 text-indigo-400">Umumiy ball</th>
                        <th className="py-4.5 px-6 text-center w-44">O'zlashtirish</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {gradebookStudents.map((student, idx) => {
                        // Joriy nazorat (Amaliyot) - SUM of assignment scores (raw)
                        const gradedSubmissions = gradebookAssignments.map(assignment => {
                          const sub = gradebookSubmissions.find(s => s.assignment_id === assignment.id && s.student_id === student.id);
                          return (sub && typeof sub.score === 'number') ? sub.score : 0;
                        });
                        const rawJoriy = gradedSubmissions.reduce((a, b) => a + b, 0);
                        const joriy = Math.min(rawJoriy, 30);

                        // Oraliq 1 - Max 15
                        const oraliq1 = oraliq1Scores[student.id] !== undefined ? oraliq1Scores[student.id] : 0;
                        const oraliq1Val = oraliq1 === '' ? 0 : (parseFloat(oraliq1) || 0);

                        // Oraliq 2 - Max 15
                        const oraliq2 = oraliq2Scores[student.id] !== undefined ? oraliq2Scores[student.id] : 0;
                        const oraliq2Val = oraliq2 === '' ? 0 : (parseFloat(oraliq2) || 0);

                        // Jami to'plangan ball (Max 60)
                        const jami = Math.min(joriy + oraliq1Val + oraliq2Val, 60);

                        // Sessiya holati (Status): Allowed if Jami >= 36
                        const isAllowed = jami >= 36;

                        // Yakuniy nazorat (Sessiya) - Max 40
                        const yakuniy = isAllowed && yakuniyScores[student.id] !== undefined ? yakuniyScores[student.id] : 0;
                        const yakuniyVal = yakuniy === '' ? 0 : (parseFloat(yakuniy) || 0);

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
                              <div className="flex justify-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max="15"
                                  placeholder="0"
                                  value={oraliq1Scores[student.id] !== undefined ? oraliq1Scores[student.id] : ''}
                                  onChange={(e) => handleOraliq1Change(student.id, e.target.value)}
                                  className="w-20 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-1.5 px-2.5 text-center text-sm outline-none focus:ring-1 focus:ring-indigo-500/25 transition-all font-semibold"
                                />
                              </div>
                            </td>

                            {/* 2-Oraliq (Input field) */}
                            <td className="py-4 px-6">
                              <div className="flex justify-center">
                                <input 
                                  type="number"
                                  min="0"
                                  max="15"
                                  placeholder="0"
                                  value={oraliq2Scores[student.id] !== undefined ? oraliq2Scores[student.id] : ''}
                                  onChange={(e) => handleOraliq2Change(student.id, e.target.value)}
                                  className="w-20 bg-slate-950/80 border border-slate-800 focus:border-indigo-500 text-white rounded-xl py-1.5 px-2.5 text-center text-sm outline-none focus:ring-1 focus:ring-indigo-500/25 transition-all font-semibold"
                                />
                              </div>
                            </td>

                            {/* Jami */}
                            <td className="py-4 px-6 text-center text-sm font-extrabold text-white bg-slate-955/10">
                              {jami} ball
                            </td>

                            {/* Sessiya holati */}
                            <td className="py-4 px-6 text-center">
                              {isAllowed ? (
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 text-xs font-bold">
                                  Ruxsat berilgan
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-400 text-xs font-bold">
                                  Kiritilmadi
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
                                  value={isAllowed && yakuniyScores[student.id] !== undefined ? yakuniyScores[student.id] : ''}
                                  onChange={(e) => handleYakuniyChange(student.id, e.target.value)}
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
                      className="w-full bg-slate-955 bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium cursor-pointer"
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

        </main>
      )}
    </div>
  );
}
