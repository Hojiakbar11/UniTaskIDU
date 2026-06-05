import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  LogOut, 
  Users, 
  BookOpen, 
  Save, 
  Search, 
  Loader2, 
  ShieldAlert, 
  GraduationCap,
  Check,
  AlertCircle,
  DollarSign,
  Edit,
  X,
  Bell,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminUser = JSON.parse(localStorage.getItem('unitask_user') || '{}');

  // Sidebar Collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('unitask_sidebar_collapsed') === 'true');
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('unitask_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Navigation Tab
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'gradebook' | 'finance'

  // Tab 1: User Management States
  const [usersList, setUsersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUserId, setEditingUserId] = useState(null);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userErrors, setUserErrors] = useState({});
  const [userSaving, setUserSaving] = useState({});
  const [userSuccess, setUserSuccess] = useState({});

  // User input states (tracked per user id to prevent cross-inputs)
  const [editLogins, setEditLogins] = useState({});
  const [editPasswords, setEditPasswords] = useState({});

  // Notifications states
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNotifOpen]);

  const loadNotifications = async () => {
    if (!adminUser || !adminUser.id) return;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', adminUser.id)
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
          .eq('user_id', adminUser.id)
          .eq('is_read', false);
        if (error) throw error;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } catch (err) {
        console.error('Error marking notifications as read:', err);
      }
    }
  };

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(() => {
      loadNotifications();
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Tab 2: Global Gradebook States
  const [relations, setRelations] = useState([]);
  const [selectedRelationId, setSelectedRelationId] = useState('');
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [isGradebookLoading, setIsGradebookLoading] = useState(false);
  const [isSavingGrade, setIsSavingGrade] = useState({});
  const [saveGradeSuccess, setSaveGradeSuccess] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [tempGrades, setTempGrades] = useState({ Amaliyot: '', '1-Oraliq': '', '2-Oraliq': '', Yakuniy: '' });
  const [contractsList, setContractsList] = useState([]); // Contracts for gradebook

  // Tab 3: Finance States
  const [financeStudents, setFinanceStudents] = useState([]);
  const [financeContracts, setFinanceContracts] = useState([]);
  const [isFinanceLoading, setIsFinanceLoading] = useState(false);
  const [financeSaving, setFinanceSaving] = useState({});
  const [financeSuccess, setFinanceSuccess] = useState({});
  const [financeErrors, setFinanceErrors] = useState({});

  const [editDiscounts, setEditDiscounts] = useState({});
  const [editPaids, setEditPaids] = useState({});
  const [editDeadlines, setEditDeadlines] = useState({});

  // Sort Config States
  const [usersSortConfig, setUsersSortConfig] = useState({ key: null, direction: 'asc' });
  const [gradebookSortConfig, setGradebookSortConfig] = useState({ key: null, direction: 'asc' });
  const [financeSortConfig, setFinanceSortConfig] = useState({ key: null, direction: 'asc' });

  // Users Sort Helper
  const handleUsersSort = (key) => {
    let direction = 'asc';
    if (usersSortConfig.key === key && usersSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setUsersSortConfig({ key, direction });
  };

  const sortedUsersList = React.useMemo(() => {
    const sortable = [...usersList];
    if (usersSortConfig.key !== null) {
      sortable.sort((a, b) => {
        let aVal = (a[usersSortConfig.key] || '').toString();
        let bVal = (b[usersSortConfig.key] || '').toString();
        const comp = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        return usersSortConfig.direction === 'asc' ? comp : -comp;
      });
    }
    return sortable;
  }, [usersList, usersSortConfig]);

  // Gradebook Sort Helper
  const handleGradebookSort = (key) => {
    let direction = 'asc';
    if (gradebookSortConfig.key === key && gradebookSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setGradebookSortConfig({ key, direction });
  };

  const getStudentComputedStats = React.useCallback((student) => {
    const getExamScore = (title) => {
      const ass = assignments.find(a => a.title === title);
      if (!ass) return 0;
      const sub = submissions.find(s => s.assignment_id === ass.id && s.student_id === student.id);
      return (sub && typeof sub.score === 'number') ? sub.score : 0;
    };
    const joriyAssignments = assignments.filter(a => a.title !== '1-Oraliq' && a.title !== '2-Oraliq' && a.title !== 'Yakuniy');
    const rawJoriy = joriyAssignments.reduce((acc, a) => {
      const sub = submissions.find(s => s.assignment_id === a.id && s.student_id === student.id);
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
  }, [assignments, submissions, contractsList]);

  const sortedStudentsList = React.useMemo(() => {
    const sortable = [...students];
    if (gradebookSortConfig.key !== null) {
      sortable.sort((a, b) => {
        const aStats = getStudentComputedStats(a);
        const bStats = getStudentComputedStats(b);
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
    return sortable;
  }, [students, gradebookSortConfig, getStudentComputedStats]);

  // Finance Sort Helper
  const handleFinanceSort = (key) => {
    let direction = 'asc';
    if (financeSortConfig.key === key && financeSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setFinanceSortConfig({ key, direction });
  };

  const getFinanceComputedStats = React.useCallback((student) => {
    const discount = editDiscounts[student.id] ?? 0;
    const paid = editPaids[student.id] ?? 0;
    const base = 16000000;
    const debt = Math.max(0, base - discount - paid);
    const deadline = editDeadlines[student.id] || '';

    return {
      full_name: student.full_name || '',
      group_name: student.groups?.name || '',
      base_amount: base,
      discount_amount: Number(discount),
      paid_amount: Number(paid),
      debt: debt,
      deadline: deadline
    };
  }, [editDiscounts, editPaids, editDeadlines]);

  const sortedFinanceList = React.useMemo(() => {
    const sortable = [...financeStudents];
    if (financeSortConfig.key !== null) {
      sortable.sort((a, b) => {
        const aStats = getFinanceComputedStats(a);
        const bStats = getFinanceComputedStats(b);
        const aVal = aStats[financeSortConfig.key];
        const bVal = bStats[financeSortConfig.key];
        if (typeof aVal === 'string') {
          const comp = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
          return financeSortConfig.direction === 'asc' ? comp : -comp;
        } else {
          if (aVal < bVal) return financeSortConfig.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return financeSortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return sortable;
  }, [financeStudents, financeSortConfig, getFinanceComputedStats]);

  // Load Admin Data
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'gradebook') {
      fetchRelations();
    } else if (activeTab === 'finance') {
      fetchFinanceData();
    }
  }, [activeTab]);

  // Fetch Users for Tab 1
  const fetchUsers = async () => {
    setIsUsersLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, groups(name)')
        .order('role', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsersList(data || []);

      // Initialize inputs
      const logins = {};
      const passwords = {};
      data.forEach(u => {
        logins[u.id] = u.login || '';
        passwords[u.id] = u.password || '';
      });
      setEditLogins(logins);
      setEditPasswords(passwords);
    } catch (err) {
      console.error('Error fetching users:', err);
      showToast('Foydalanuvchilarni yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setIsUsersLoading(false);
    }
  };

  // Save User Login/Password
  const handleSaveUser = async (userId) => {
    const loginVal = editLogins[userId]?.trim();
    const passwordVal = editPasswords[userId]?.trim();

    if (!loginVal || !passwordVal) {
      setUserErrors(prev => ({ ...prev, [userId]: 'Login va parol bo\'sh bo\'lmasligi kerak' }));
      return;
    }

    setUserSaving(prev => ({ ...prev, [userId]: true }));
    setUserErrors(prev => ({ ...prev, [userId]: null }));

    try {
      const { error } = await supabase
        .from('users')
        .update({ login: loginVal, password: passwordVal })
        .eq('id', userId);

      if (error) throw error;

      // Update local user state
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, login: loginVal, password: passwordVal } : u));
      setUserSuccess(prev => ({ ...prev, [userId]: true }));
      setEditingUserId(null); // Clear editing mode
      setTimeout(() => {
        setUserSuccess(prev => ({ ...prev, [userId]: false }));
      }, 3000);
      showToast('Foydalanuvchi ma\'lumotlari muvaffaqiyatli saqlandi!');
    } catch (err) {
      console.error('Error updating user:', err);
      setUserErrors(prev => ({ ...prev, [userId]: err.message || 'Xatolik yuz berdi' }));
    } finally {
      setUserSaving(prev => ({ ...prev, [userId]: false }));
    }
  };

  // Currency formatting helper
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '0';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Fetch Finance Data
  const fetchFinanceData = async () => {
    setIsFinanceLoading(true);
    try {
      // 1. Fetch all students
      const { data: stdData, error: stdErr } = await supabase
        .from('users')
        .select('*, groups(name)')
        .eq('role', 'student')
        .order('full_name', { ascending: true });

      if (stdErr) throw stdErr;

      // 2. Fetch all contracts
      const { data: contractData, error: conErr } = await supabase
        .from('contracts')
        .select('*');

      if (conErr) throw conErr;

      setFinanceStudents(stdData || []);
      setFinanceContracts(contractData || []);

      // Initialize inputs
      const discounts = {};
      const paids = {};
      const deadlines = {};

      stdData.forEach(s => {
        const contract = (contractData || []).find(c => c.student_id === s.id);
        discounts[s.id] = contract ? (contract.discount_amount ?? 0) : 0;
        paids[s.id] = contract ? (contract.paid_amount ?? 0) : 0;
        deadlines[s.id] = contract ? (contract.deadline ?? '') : '';
      });

      setEditDiscounts(discounts);
      setEditPaids(paids);
      setEditDeadlines(deadlines);

    } catch (err) {
      console.error('Error fetching finance data:', err);
      showToast('Moliya ma\'lumotlarini yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setIsFinanceLoading(false);
    }
  };

  // Save Contract Finance Info
  const handleSaveFinance = async (studentId) => {
    const discountVal = parseFloat(editDiscounts[studentId]) || 0;
    const paidVal = parseFloat(editPaids[studentId]) || 0;
    const deadlineVal = editDeadlines[studentId] || null;

    if (discountVal < 0 || paidVal < 0) {
      setFinanceErrors(prev => ({ ...prev, [studentId]: 'Salbiy summa kiritish mumkin emas' }));
      return;
    }

    setFinanceSaving(prev => ({ ...prev, [studentId]: true }));
    setFinanceErrors(prev => ({ ...prev, [studentId]: null }));

    try {
      // Check if existing record exists
      const existing = financeContracts.find(c => c.student_id === studentId);
      
      let resData;
      if (existing) {
        // Update
        const { data, error } = await supabase
          .from('contracts')
          .update({
            discount_amount: discountVal,
            paid_amount: paidVal,
            deadline: deadlineVal
          })
          .eq('id', existing.id)
          .select();

        if (error) throw error;
        resData = data;
      } else {
        // Insert
        const { data, error } = await supabase
          .from('contracts')
          .insert({
            student_id: studentId,
            base_amount: 16000000,
            discount_amount: discountVal,
            paid_amount: paidVal,
            deadline: deadlineVal
          })
          .select();

        if (error) throw error;
        resData = data;
      }

      if (resData && resData.length > 0) {
        // Update local contracts state
        setFinanceContracts(prev => {
          const filtered = prev.filter(c => c.student_id !== studentId);
          return [...filtered, resData[0]];
        });
      }

      setFinanceSuccess(prev => ({ ...prev, [studentId]: true }));
      setTimeout(() => {
        setFinanceSuccess(prev => ({ ...prev, [studentId]: false }));
      }, 3000);
      showToast('Shartnoma ma\'lumotlari muvaffaqiyatli saqlandi!');
    } catch (err) {
      console.error('Error updating finance:', err);
      setFinanceErrors(prev => ({ ...prev, [studentId]: err.message || 'Xatolik yuz berdi' }));
      showToast('Saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setFinanceSaving(prev => ({ ...prev, [studentId]: false }));
    }
  };

  // Fetch all teacher-subjects for Admin Dropdown
  const fetchRelations = async () => {
    setIsGradebookLoading(true);
    try {
      const { data, error } = await supabase
        .from('teacher_subjects')
        .select(`
          id,
          teacher_id,
          subject_id,
          lesson_type_id,
          group_id,
          subjects(id, name),
          lesson_types(id, name),
          groups(id, name),
          users!teacher_subjects_teacher_id_fkey(id, full_name)
        `);

      if (error) throw error;
      setRelations(data || []);
      if (data && data.length > 0) {
        setSelectedRelationId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching relations:', err);
      showToast('Fanlar ro\'yxatini yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setIsGradebookLoading(false);
    }
  };

  // Load details for selected relation
  useEffect(() => {
    if (selectedRelationId) {
      loadRelationDetails();
    }
  }, [selectedRelationId]);

  const loadRelationDetails = async () => {
    const rel = relations.find(r => r.id === selectedRelationId);
    if (!rel) return;

    setIsGradebookLoading(true);
    try {
      // 1. Fetch students in the group
      const { data: studentsData, error: stdError } = await supabase
        .from('users')
        .select('id, full_name, role, group_id')
        .eq('role', 'student')
        .eq('group_id', rel.group_id)
        .order('full_name', { ascending: true });

      if (stdError) throw stdError;
      setStudents(studentsData || []);

      // 2. Fetch assignments
      const { data: assignmentsData, error: assError } = await supabase
        .from('assignments')
        .select('*')
        .eq('subject_id', rel.subject_id)
        .eq('lesson_type_id', rel.lesson_type_id);

      if (assError) throw assError;

      // 3. Set assignments (no auto-creation)
      let currentAssignments = assignmentsData || [];
      setAssignments(currentAssignments);

      // 4. Fetch submissions
      const { data: subsData, error: subsError } = await supabase
        .from('submissions')
        .select('*');

      if (subsError) throw subsError;
      setSubmissions(subsData || []);

      // 5. Fetch contracts
      const { data: contractsData, error: conError } = await supabase
        .from('contracts')
        .select('*');

      if (conError) throw conError;
      setContractsList(contractsData || []);

    } catch (err) {
      console.error('Error loading relation details:', err);
      showToast('Ma\'lumotlarni yuklashda xatolik yuz berdi.', 'error');
    } finally {
      setIsGradebookLoading(false);
    }
  };

  const handleSaveAllStudentGrades = async (studentId) => {
    const rel = relations.find(r => r.id === selectedRelationId);
    if (!rel) return;

    const amaliyotVal = tempGrades.Amaliyot;
    const oraliq1Val = tempGrades['1-Oraliq'];
    const oraliq2Val = tempGrades['2-Oraliq'];
    const yakuniyVal = tempGrades.Yakuniy;

    const parseScore = (v) => {
      if (v === '' || v === undefined || v === null) return 0;
      let scoreNum = parseFloat(v);
      return isNaN(scoreNum) ? 0 : scoreNum;
    };

    const sAmaliyot = parseScore(amaliyotVal);
    const sOraliq1 = parseScore(oraliq1Val);
    const sOraliq2 = parseScore(oraliq2Val);
    const sYakuniy = parseScore(yakuniyVal);

    if (sAmaliyot < 0 || sAmaliyot > 30) {
      showToast('Joriy nazorat bali 0 va 30 oralig\'ida bo\'lishi shart.', 'error');
      return;
    }
    if (sOraliq1 < 0 || sOraliq1 > 15) {
      showToast('1-Oraliq nazorat bali 0 va 15 oralig\'ida bo\'lishi shart.', 'error');
      return;
    }
    if (sOraliq2 < 0 || sOraliq2 > 15) {
      showToast('2-Oraliq nazorat bali 0 va 15 oralig\'ida bo\'lishi shart.', 'error');
      return;
    }
    if (sYakuniy < 0 || sYakuniy > 40) {
      showToast('Yakuniy nazorat bali 0 va 40 oralig\'ida bo\'lishi shart.', 'error');
      return;
    }

    const key = `${studentId}-save-all`;
    setIsSavingGrade(prev => ({ ...prev, [key]: true }));

    try {
      const amaliyotAss = assignments.find(a => a.title === 'Amaliyot topshirig\'i') || assignments.find(a => a.title !== '1-Oraliq' && a.title !== '2-Oraliq' && a.title !== 'Yakuniy');
      const oraliq1Ass = assignments.find(a => a.title === '1-Oraliq');
      const oraliq2Ass = assignments.find(a => a.title === '2-Oraliq');
      const yakuniyAss = assignments.find(a => a.title === 'Yakuniy');

      const updates = [];
      const notificationsToInsert = [];
      const addedAssignmentIds = new Set();

      const addUpdate = (ass, score, title) => {
        if (ass && !addedAssignmentIds.has(ass.id)) {
          addedAssignmentIds.add(ass.id);
          updates.push({
            assignment_id: ass.id,
            student_id: studentId,
            score: score,
            status: 'accepted',
            solution_text: 'Admin tomonidan baholandi',
            teacher_comment: 'Admin kiritdi',
            submitted_at: new Date().toISOString()
          });
          notificationsToInsert.push({
            user_id: studentId,
            title: 'Bahongiz o\'zgartirildi',
            message: `${rel.subjects?.name} fanidan sizning ${title} ballingiz Admin tomonidan ${score} ballga o'zgartirildi.`,
            is_read: false,
            created_at: new Date().toISOString()
          });
        }
      };

      addUpdate(amaliyotAss, sAmaliyot, 'Amaliyot');
      addUpdate(oraliq1Ass, sOraliq1, '1-Oraliq');
      addUpdate(oraliq2Ass, sOraliq2, '2-Oraliq');
      addUpdate(yakuniyAss, sYakuniy, 'Yakuniy');

      if (updates.length > 0) {
        const { data: newSubs, error } = await supabase
          .from('submissions')
          .upsert(updates, { onConflict: 'assignment_id,student_id' })
          .select();

        if (error) throw error;

        if (newSubs && newSubs.length > 0) {
          setSubmissions(prev => {
            const assignmentIds = updates.map(u => u.assignment_id);
            const filtered = prev.filter(s => !(s.student_id === studentId && assignmentIds.includes(s.assignment_id)));
            return [...filtered, ...newSubs];
          });
        }

        if (notificationsToInsert.length > 0) {
          await supabase.from('notifications').insert(notificationsToInsert);
        }

        showToast('Baholar muvaffaqiyatli saqlandi.', 'success');
        setEditingStudentId(null);
      }
    } catch (err) {
      console.error('Error saving student grades:', err);
      showToast('Baholarni saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setIsSavingGrade(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleStartEdit = (student) => {
    const getExamScore = (title) => {
      const ass = assignments.find(a => a.title === title);
      if (!ass) return '';
      const sub = submissions.find(s => s.assignment_id === ass.id && s.student_id === student.id);
      return (sub && typeof sub.score === 'number') ? sub.score.toString() : '';
    };

    const getJoriyScore = () => {
      const joriyAssignments = assignments.filter(a => a.title !== '1-Oraliq' && a.title !== '2-Oraliq' && a.title !== 'Yakuniy');
      const rawJoriy = joriyAssignments.reduce((acc, a) => {
        const sub = submissions.find(s => s.assignment_id === a.id && s.student_id === student.id);
        return acc + ((sub && typeof sub.score === 'number') ? sub.score : 0);
      }, 0);
      return rawJoriy;
    };

    setTempGrades({
      Amaliyot: getJoriyScore().toString(),
      '1-Oraliq': getExamScore('1-Oraliq'),
      '2-Oraliq': getExamScore('2-Oraliq'),
      Yakuniy: getExamScore('Yakuniy')
    });
    setEditingStudentId(student.id);
  };

  // Inline Grade Save Logic
  const handleSaveGrade = async (studentId, examTitle, val) => {
    const rel = relations.find(r => r.id === selectedRelationId);
    if (!rel) return;

    let scoreNum = parseFloat(val);
    if (isNaN(scoreNum) || val === '') {
      scoreNum = 0;
    }

    // Validation limits
    if (examTitle === '1-Oraliq' || examTitle === '2-Oraliq') {
      if (scoreNum < 0 || scoreNum > 15) {
        showToast('Oraliq nazorat ballari 0 va 15 oralig\'ida bo\'lishi shart.', 'error');
        return;
      }
    } else if (examTitle === 'Yakuniy') {
      if (scoreNum < 0 || scoreNum > 40) {
        showToast('Yakuniy nazorat bali 0 va 40 oralig\'ida bo\'lishi shart.', 'error');
        return;
      }
    } else if (examTitle === 'Amaliyot') {
      if (scoreNum < 0 || scoreNum > 30) {
        showToast('Joriy nazorat bali 0 va 30 oralig\'ida bo\'lishi shart.', 'error');
        return;
      }
    }

    const key = `${studentId}-${examTitle}`;
    setIsSavingGrade(prev => ({ ...prev, [key]: true }));

    try {
      // Find assignment
      let targetTitle = examTitle;
      if (examTitle === 'Amaliyot') {
        const amaliyotAss = assignments.find(a => a.title === 'Amaliyot topshirig\'i') || assignments.find(a => a.title !== '1-Oraliq' && a.title !== '2-Oraliq' && a.title !== 'Yakuniy');
        targetTitle = amaliyotAss ? amaliyotAss.title : 'Amaliyot topshirig\'i';
      }

      let assignment = assignments.find(a => a.title === targetTitle);
      
      if (!assignment) {
        showToast('Ushbu topshiriq bazada mavjud emas.', 'error');
        setIsSavingGrade(prev => ({ ...prev, [key]: false }));
        return;
      }

      // Atomic database upsert
      const { data: newSub, error } = await supabase
        .from('submissions')
        .upsert({
          assignment_id: assignment.id,
          student_id: studentId,
          score: scoreNum,
          status: 'accepted',
          solution_text: 'Admin tomonidan baholandi',
          teacher_comment: 'Admin kiritdi',
          submitted_at: new Date().toISOString()
        }, { onConflict: 'assignment_id,student_id' })
        .select();

      if (error) throw error;
      if (newSub && newSub.length > 0) {
        setSubmissions(prev => {
          const filtered = prev.filter(s => !(s.assignment_id === assignment.id && s.student_id === studentId));
          return [...filtered, newSub[0]];
        });
      }

      // Trigger student notification
      await supabase
        .from('notifications')
        .insert({
          user_id: studentId,
          title: 'Bahongiz o\'zgartirildi',
          message: `${rel.subjects?.name} fanidan sizning ${examTitle} ballingiz Admin tomonidan ${scoreNum} ballga o'zgartirildi.`,
          is_read: false,
          created_at: new Date().toISOString()
        });

      setSaveGradeSuccess(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setSaveGradeSuccess(prev => ({ ...prev, [key]: false }));
      }, 2000);
      showToast('Baho muvaffaqiyatli saqlandi!');
    } catch (err) {
      console.error('Error saving grade:', err);
      showToast('Bahoni saqlashda xatolik yuz berdi.', 'error');
    } finally {
      setIsSavingGrade(prev => ({ ...prev, [key]: false }));
    }
  };

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter users by search box query & role
  const filteredUsers = sortedUsersList.filter(u => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.login || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q)
    );
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Logout Flow
  const handleLogout = () => {
    localStorage.removeItem('unitask_user');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 py-3.5 px-5 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-slideIn ${
          toastMessage.type === 'error' 
            ? 'bg-red-950/80 border-red-900/60 text-red-200 shadow-red-950/20' 
            : 'bg-emerald-950/80 border-emerald-900/60 text-emerald-200 shadow-emerald-950/20'
        }`}>
          {toastMessage.type === 'error' ? <AlertCircle className="h-5 w-5 text-red-400" /> : <Check className="h-5 w-5 text-emerald-400" />}
          <span className="text-sm font-semibold">{toastMessage.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-80'} bg-slate-900/40 border-r border-slate-900 flex flex-col justify-between backdrop-blur-xl shrink-0 overflow-hidden`}>
        <div>
          {/* Logo */}
          {isSidebarCollapsed ? (
            <div className="p-6 border-b border-slate-900 flex items-center justify-center">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-slate-900 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap className="h-5.5 w-5.5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">UniTask</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">O'quv bo'limi paneli</p>
              </div>
            </div>
          )}

          {/* User Profile */}
          {isSidebarCollapsed ? (
            <div className="p-5 border-b border-slate-900 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-indigo-400 uppercase">
                {adminUser.full_name ? adminUser.full_name.substring(0, 2) : 'AD'}
              </div>
            </div>
          ) : (
            <div className="p-5 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700/60 flex items-center justify-center font-bold text-indigo-400 uppercase">
                  {adminUser.full_name ? adminUser.full_name.substring(0, 2) : 'AD'}
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">{adminUser.full_name || 'Admin'}</h3>
                  <p className="text-xs text-indigo-400 font-semibold mt-0.5 capitalize">{adminUser.role || 'Admin'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-2.5">
            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'users' 
                  ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <Users className={`h-4.5 w-4.5 ${activeTab === 'users' ? 'text-indigo-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Foydalanuvchilar</span>}
            </button>
            <button
              onClick={() => setActiveTab('gradebook')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'gradebook' 
                  ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <BookOpen className={`h-4.5 w-4.5 ${activeTab === 'gradebook' ? 'text-indigo-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Global Jurnal</span>}
            </button>
            <button
              onClick={() => setActiveTab('finance')}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3.5 px-4.5'} py-3 rounded-2xl text-sm font-bold transition-all ${
                activeTab === 'finance' 
                  ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/5 border border-indigo-500/20 text-white' 
                  : 'border border-transparent text-slate-400 hover:text-white hover:bg-slate-900/30'
              }`}
            >
              <DollarSign className={`h-4.5 w-4.5 ${activeTab === 'finance' ? 'text-indigo-400' : 'text-slate-500'}`} />
              {!isSidebarCollapsed && <span>Moliya (Kontrakt)</span>}
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
              {activeTab === 'users' ? 'Foydalanuvchilar boshqaruvi' : activeTab === 'gradebook' ? 'Global Baholar Jurnali' : 'Talabalar Kontrakt Boshqaruvi'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-indigo-400 font-extrabold tracking-wide uppercase">
              <ShieldAlert className="h-3.5 w-3.5" />
              Super-Huquqlar
            </div>

            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
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
                <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn space-y-3">
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
              )}
            </div>

            {/* User display & logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <span className="text-slate-350 font-bold text-xs capitalize">{adminUser.full_name || 'Admin'}</span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-rose-400 bg-slate-900/30 hover:bg-rose-950/10 transition-all text-xs font-bold cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Chiqish</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Content Body */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* TAB 1: USER MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-900/20 border border-slate-900 p-3 rounded-2xl backdrop-blur-sm">
                <div>
                  <h2 className="text-sm font-bold text-white font-sans">Tizim Foydalanuvchilari</h2>
                  <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Barcha ustoz, talaba va admin ma'lumotlarini boshqarish</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Role Dropdown */}
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-900 rounded-xl py-2 px-3 text-xs font-bold text-slate-350 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 outline-none transition-all cursor-pointer"
                  >
                    <option value="all">Barchasi (Rollar)</option>
                    <option value="student">Talaba</option>
                    <option value="teacher">O'qituvchi</option>
                    <option value="admin">Admin</option>
                  </select>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Ism, login bo'yicha..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Table */}
              {isUsersLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 bg-slate-900/10 rounded-3xl border border-slate-900">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-slate-400 text-sm font-semibold">Foydalanuvchilar ro'yxati yuklanmoqda...</p>
                </div>
              ) : (
                <div className="bg-slate-900/10 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider select-none">
                          <th className="py-4.5 px-6 text-center w-16">#</th>
                          <th 
                            onClick={() => handleUsersSort('full_name')}
                            className="py-4.5 px-6 min-w-[200px] cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-1">
                              <span>Ism, Familiya</span>
                              {usersSortConfig.key === 'full_name' ? (
                                usersSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleUsersSort('role')}
                            className="py-4.5 px-6 w-36 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-1">
                              <span>Rol</span>
                              {usersSortConfig.key === 'role' ? (
                                usersSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleUsersSort('group')}
                            className="py-4.5 px-6 w-44 text-center cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Guruh</span>
                              {usersSortConfig.key === 'group' ? (
                                usersSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleUsersSort('login')}
                            className="py-4.5 px-6 min-w-[200px] cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-1">
                              <span>Login</span>
                              {usersSortConfig.key === 'login' ? (
                                usersSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleUsersSort('password')}
                            className="py-4.5 px-6 min-w-[200px] cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-1">
                              <span>Parol</span>
                              {usersSortConfig.key === 'password' ? (
                                usersSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th className="py-4.5 px-6 text-center w-40">Amal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {filteredUsers.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-16 text-center text-slate-500 text-sm font-medium italic">
                              Hech qanday foydalanuvchi topilmadi
                            </td>
                          </tr>
                        ) : (
                          filteredUsers.map((user, idx) => {
                            const isSaving = userSaving[user.id];
                            const isSuccess = userSuccess[user.id];
                            const error = userErrors[user.id];
                            const isEditing = editingUserId === user.id;

                            return (
                              <tr key={user.id} className="hover:bg-slate-900/10 transition-all duration-200">
                                <td className="py-4 px-6 text-center text-xs font-bold text-slate-600">{idx + 1}</td>
                                <td className="py-4 px-6">
                                  <div className="text-xs font-bold text-white font-sans">{user.full_name || 'Noma\'lum'}</div>
                                  <div className="text-[10px] text-slate-500 font-bold tracking-tight mt-0.5 truncate max-w-[220px]">ID: {user.id}</div>
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`inline-block px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase border ${
                                    user.role === 'admin' 
                                      ? 'bg-rose-950/20 border-rose-500/20 text-rose-450' 
                                      : user.role === 'teacher' 
                                        ? 'bg-amber-950/20 border-amber-500/20 text-amber-450' 
                                        : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-450'
                                  }`}>
                                    {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'O\'qituvchi' : 'Talaba'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-center text-xs font-semibold text-slate-400">
                                  {user.groups?.name || '-'}
                                </td>
                                <td className="py-4 px-6">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editLogins[user.id] ?? ''}
                                      onChange={(e) => setEditLogins({ ...editLogins, [user.id]: e.target.value })}
                                      disabled={isSaving}
                                      className="w-full bg-slate-950/60 border border-slate-900/60 hover:border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2 px-3 text-xs outline-none font-semibold transition-all"
                                    />
                                  ) : (
                                    <span className="text-xs font-semibold text-slate-300">{user.login || 'Kiritilmagan'}</span>
                                  )}
                                </td>
                                <td className="py-4 px-6">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editPasswords[user.id] ?? ''}
                                      onChange={(e) => setEditPasswords({ ...editPasswords, [user.id]: e.target.value })}
                                      disabled={isSaving}
                                      className="w-full bg-slate-950/60 border border-slate-900/60 hover:border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2 px-3 text-xs outline-none font-mono transition-all"
                                    />
                                  ) : (
                                    <span className="text-xs font-mono text-slate-450">{user.password || 'Kiritilmagan'}</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-center">
                                  {isEditing ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleSaveUser(user.id)}
                                        disabled={isSaving}
                                        className={`inline-flex items-center gap-1 justify-center py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                                          isSuccess 
                                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/5' 
                                            : 'bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer active:scale-95 disabled:opacity-50'
                                        }`}
                                      >
                                        {isSaving ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : isSuccess ? (
                                          <Check className="h-3.5 w-3.5" />
                                        ) : (
                                          <Save className="h-3.5 w-3.5" />
                                        )}
                                        <span>{isSaving ? 'Saqlanmoqda...' : isSuccess ? 'Saqlandi' : 'Saqlash'}</span>
                                      </button>
                                      <button
                                        onClick={() => setEditingUserId(null)}
                                        disabled={isSaving}
                                        className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
                                        title="Bekor qilish"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setEditingUserId(user.id)}
                                      className="inline-flex items-center gap-1.5 justify-center py-2 px-3.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-850 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                      <span>Tahrirlash</span>
                                    </button>
                                  )}
                                  {error && <div className="text-[10px] text-red-400 font-semibold mt-1 max-w-[120px] mx-auto text-left leading-tight">{error}</div>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GLOBAL GRADEBOOK */}
          {activeTab === 'gradebook' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Select relation controls */}
              <div className="bg-slate-900/20 border border-slate-900 p-6 rounded-3xl backdrop-blur-sm space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Fanning Global Jurnali</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Tizimdagi barcha fanlar, guruhlar va ularga tegishli talabalar baholarini boshqarish</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-end justify-between">
                  <div className="w-full max-w-xl">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2 ml-1">Dars & Guruhni tanlang</label>
                    <select
                      value={selectedRelationId}
                      onChange={(e) => setSelectedRelationId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-2xl py-3.5 px-4 text-xs font-bold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 transition-all cursor-pointer"
                    >
                      {relations.map(rel => (
                        <option key={rel.id} value={rel.id}>
                          {rel.subjects?.name} ({rel.lesson_types?.name}) — Guruh: {rel.groups?.name} — Ustoz: {rel.users?.full_name || 'Noma\'lum'}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Search Bar for Gradebook */}
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Talabani qidirish (Ism)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-900 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-650 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Gradebook table */}
              {isGradebookLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 bg-slate-900/10 rounded-3xl border border-slate-900">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-slate-400 text-sm font-semibold">Baholar jurnali yuklanmoqda...</p>
                </div>
              ) : selectedRelationId ? (
                <div className="bg-slate-900/10 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider select-none">
                          <th className="py-4.5 px-6 text-center w-16">#</th>
                          <th 
                            onClick={() => handleGradebookSort('full_name')}
                            className="py-4.5 px-6 min-w-[200px] cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
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
                              <span>Joriy nazorat (Max 30)</span>
                              {gradebookSortConfig.key === 'Amaliyot' ? (
                                gradebookSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleGradebookSort('1-Oraliq')}
                            className="py-4.5 px-6 text-center w-40 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
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
                            className="py-4.5 px-6 text-center w-40 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
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
                            className="py-4.5 px-6 text-center w-36 bg-slate-950/20 text-slate-350 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
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
                            className="py-4.5 px-6 text-center w-40 cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
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
                          <th className="py-4.5 px-6 text-center w-40">O'zlashtirish</th>
                          <th className="py-4.5 px-6 text-center w-40">Amal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {(() => {
                          const filtered = sortedStudentsList.filter(student => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return (student.full_name || '').toLowerCase().includes(q);
                          });
                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan="11" className="py-16 text-center text-slate-500 text-sm font-medium italic">
                                  Ushbu guruhda talabalar topilmadi
                                </td>
                              </tr>
                            );
                          }
                          return filtered.map((student, idx) => {
                            // Find exam scores
                            const getExamScore = (title) => {
                              const ass = assignments.find(a => a.title === title);
                              if (!ass) return '';
                              const sub = submissions.find(s => s.assignment_id === ass.id && s.student_id === student.id);
                              return (sub && typeof sub.score === 'number') ? sub.score.toString() : '';
                            };

                            const getJoriyScore = () => {
                              const joriyAssignments = assignments.filter(a => a.title !== '1-Oraliq' && a.title !== '2-Oraliq' && a.title !== 'Yakuniy');
                              const rawJoriy = joriyAssignments.reduce((acc, a) => {
                                const sub = submissions.find(s => s.assignment_id === a.id && s.student_id === student.id);
                                return acc + ((sub && typeof sub.score === 'number') ? sub.score : 0);
                              }, 0);
                              return rawJoriy;
                            };

                            const rawJoriyVal = getJoriyScore();
                            const joriyVal = Math.min(rawJoriyVal, 30);

                            const oraliq1ScoreStr = getExamScore('1-Oraliq');
                            const oraliq2ScoreStr = getExamScore('2-Oraliq');
                            const yakuniyScoreStr = getExamScore('Yakuniy');

                            const oraliq1Val = oraliq1ScoreStr === '' ? 0 : parseFloat(oraliq1ScoreStr) || 0;
                            const oraliq2Val = oraliq2ScoreStr === '' ? 0 : parseFloat(oraliq2ScoreStr) || 0;
                            const yakuniyVal = yakuniyScoreStr === '' ? 0 : parseFloat(yakuniyScoreStr) || 0;

                            const jami = joriyVal + oraliq1Val + oraliq2Val;
                            
                            // Find student's contract
                            const contract = contractsList.find(c => c.student_id === student.id);
                            const baseAmount = contract ? (contract.base_amount ?? 16000000) : 16000000;
                            const discountAmount = contract ? (contract.discount_amount ?? 0) : 0;
                            const paidAmount = contract ? (contract.paid_amount ?? 0) : 0;
                            const debt = Math.max(0, baseAmount - discountAmount - paidAmount);

                            const isAllowed = jami >= 36 && debt <= 0;
                            const totalBall = jami + (isAllowed ? yakuniyVal : 0);

                            // Status tags
                            let statusLabel = "";
                            let statusClass = "";
                            if (debt > 0) {
                              statusLabel = "Kiritilmadi (Qarz)";
                              statusClass = "bg-rose-950/20 border-rose-500/20 text-rose-450 text-red-400";
                            } else if (jami < 36) {
                              statusLabel = "Kiritilmadi (Past ball)";
                              statusClass = "bg-rose-950/20 border-rose-500/20 text-rose-450 text-red-400";
                            } else {
                              statusLabel = "Ruxsat berilgan";
                              statusClass = "bg-emerald-950/20 border-emerald-500/20 text-emerald-450 text-emerald-400";
                            }

                            let ozlashtirishLabel = "Qarzdor";
                            let ozlashtirishClass = "bg-red-950/20 border-red-500/20 text-red-400";

                            if (isAllowed && totalBall >= 60) {
                              ozlashtirishLabel = "O'tdi";
                              ozlashtirishClass = "bg-emerald-950/20 border-emerald-500/20 text-emerald-450 text-emerald-400";
                            }

                            // Dynamic calculations if row is currently edited
                            const isRowEditing = editingStudentId === student.id;
                            const tempJoriyVal = Math.min(tempGrades.Amaliyot === '' ? 0 : parseFloat(tempGrades.Amaliyot) || 0, 30);
                            const tempOraliq1Val = tempGrades['1-Oraliq'] === '' ? 0 : parseFloat(tempGrades['1-Oraliq']) || 0;
                            const tempOraliq2Val = tempGrades['2-Oraliq'] === '' ? 0 : parseFloat(tempGrades['2-Oraliq']) || 0;
                            const tempJami = tempJoriyVal + tempOraliq1Val + tempOraliq2Val;
                            const tempIsAllowed = tempJami >= 36 && debt <= 0;
                            const tempYakuniyVal = tempIsAllowed ? (tempGrades.Yakuniy === '' ? 0 : parseFloat(tempGrades.Yakuniy) || 0) : 0;
                            const tempTotalBall = tempJami + tempYakuniyVal;

                            let tempStatusLabel = "";
                            let tempStatusClass = "";
                            if (debt > 0) {
                              tempStatusLabel = "Kiritilmadi (Qarz)";
                              tempStatusClass = "bg-rose-950/20 border-rose-500/20 text-red-400 text-xs";
                            } else if (tempJami < 36) {
                              tempStatusLabel = "Kiritilmadi (Past ball)";
                              tempStatusClass = "bg-rose-950/20 border-rose-500/20 text-red-400 text-xs";
                            } else {
                              tempStatusLabel = "Ruxsat berilgan";
                              tempStatusClass = "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 text-xs";
                            }

                            let tempOzlashtirishLabel = "Qarzdor";
                            let tempOzlashtirishClass = "bg-red-950/20 border-red-500/20 text-red-400 text-xs";
                            if (tempIsAllowed && tempTotalBall >= 60) {
                              tempOzlashtirishLabel = "O'tdi";
                              tempOzlashtirishClass = "bg-emerald-950/20 border-emerald-500/20 text-emerald-400 text-xs";
                            }

                            return (
                              <tr key={student.id} className="hover:bg-slate-900/10 transition-colors duration-150">
                                <td className="py-4 px-6 text-center text-xs font-bold text-slate-650">{idx + 1}</td>
                                <td className="py-4 px-6 text-xs font-bold text-white">{student.full_name}</td>
                                
                                {/* Joriy nazorat */}
                                <td className="py-3 px-4 text-center">
                                  {isRowEditing ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        value={tempGrades.Amaliyot}
                                        onChange={(e) => setTempGrades(prev => ({ ...prev, Amaliyot: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveAllStudentGrades(student.id)}
                                        className="w-20 bg-slate-950/60 border border-slate-900 text-center py-1.5 px-2 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-xs font-semibold text-slate-300">{rawJoriyVal}</span>
                                  )}
                                </td>

                                {/* 1-Oraliq */}
                                <td className="py-3 px-4 text-center">
                                  {isRowEditing ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        value={tempGrades['1-Oraliq']}
                                        onChange={(e) => setTempGrades(prev => ({ ...prev, '1-Oraliq': e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveAllStudentGrades(student.id)}
                                        className="w-20 bg-slate-950/60 border border-slate-900 text-center py-1.5 px-2 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-xs font-semibold text-slate-300">{oraliq1ScoreStr || '0'}</span>
                                  )}
                                </td>

                                {/* 2-Oraliq */}
                                <td className="py-3 px-4 text-center">
                                  {isRowEditing ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        value={tempGrades['2-Oraliq']}
                                        onChange={(e) => setTempGrades(prev => ({ ...prev, '2-Oraliq': e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveAllStudentGrades(student.id)}
                                        className="w-20 bg-slate-950/60 border border-slate-900 text-center py-1.5 px-2 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-xs font-semibold text-slate-300">{oraliq2ScoreStr || '0'}</span>
                                  )}
                                </td>

                                {/* Jami */}
                                <td className="py-4 px-6 text-center text-xs font-extrabold text-slate-350 bg-slate-955/20">
                                  {isRowEditing ? tempJami : jami} ball
                                </td>

                                {/* Sessiya holati */}
                                <td className="py-4 px-6 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase border ${isRowEditing ? tempStatusClass : statusClass}`}>
                                    {isRowEditing ? tempStatusLabel : statusLabel}
                                  </span>
                                </td>

                                {/* Yakuniy nazorat */}
                                <td className="py-3 px-4 text-center">
                                  {isRowEditing ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <input
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        value={tempGrades.Yakuniy}
                                        disabled={!tempIsAllowed}
                                        onChange={(e) => setTempGrades(prev => ({ ...prev, Yakuniy: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveAllStudentGrades(student.id)}
                                        className="w-20 bg-slate-950/60 border border-slate-900 text-center py-1.5 px-2 rounded-xl text-xs font-semibold text-white outline-none focus:border-indigo-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                    </div>
                                  ) : (
                                    <span className="text-xs font-semibold text-slate-300">{yakuniyScoreStr || '0'}</span>
                                  )}
                                </td>

                                {/* Umumiy ball */}
                                <td className="py-4 px-6 text-center text-xs font-extrabold text-indigo-400 bg-indigo-950/10">
                                  {isRowEditing ? tempTotalBall : totalBall} ball
                                </td>

                                {/* O'zlashtirish */}
                                <td className="py-4 px-6 text-center">
                                  <span className={`inline-block px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase border ${isRowEditing ? tempOzlashtirishClass : ozlashtirishClass}`}>
                                    {isRowEditing ? tempOzlashtirishLabel : ozlashtirishLabel}
                                  </span>
                                </td>

                                {/* Amal */}
                                <td className="py-3 px-4 text-center">
                                  {isRowEditing ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => handleSaveAllStudentGrades(student.id)}
                                        disabled={isSavingGrade[`${student.id}-save-all`]}
                                        className={`inline-flex items-center gap-1.5 justify-center py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                                          isSavingGrade[`${student.id}-save-all`]
                                            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                            : 'bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer active:scale-95 disabled:opacity-50'
                                        }`}
                                      >
                                        {isSavingGrade[`${student.id}-save-all`] ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Save className="h-3.5 w-3.5" />
                                        )}
                                        <span>{isSavingGrade[`${student.id}-save-all`] ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                                      </button>
                                      <button
                                        onClick={() => setEditingStudentId(null)}
                                        disabled={isSavingGrade[`${student.id}-save-all`]}
                                        className="inline-flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:bg-slate-800 transition-all cursor-pointer"
                                        title="Bekor qilish"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleStartEdit(student)}
                                      className="inline-flex items-center gap-1.5 justify-center py-2 px-3.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 border border-slate-850 text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                      <span>Tahrirlash</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 italic font-semibold bg-slate-900/10 border border-slate-900 rounded-3xl">
                  Yuklash uchun dars/guruhni tanlang.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-900/20 border border-slate-900 p-5 rounded-3xl backdrop-blur-sm">
                <div>
                  <h2 className="text-lg font-bold text-white">Talabalar Kontrakt Boshqaruvi</h2>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Shartnoma to'lovlari, chegirmalar va muddatlarni nazorat qilish</p>
                </div>
                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-4.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Talabani qidirish (Ism, Guruh)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-900 rounded-2xl py-3 pl-11 pr-4 text-xs font-semibold text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 placeholder:text-slate-650 transition-all"
                  />
                </div>
              </div>

              {/* Table */}
              {isFinanceLoading ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 bg-slate-900/10 rounded-3xl border border-slate-900">
                  <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                  <p className="text-slate-400 text-sm font-semibold">Moliya ma'lumotlari yuklanmoqda...</p>
                </div>
              ) : (
                <div className="bg-slate-900/10 border border-slate-900 rounded-3xl overflow-hidden backdrop-blur-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-400 text-[10px] font-extrabold uppercase tracking-wider select-none">
                          <th className="py-4.5 px-6 text-center w-16">#</th>
                          <th 
                            onClick={() => handleFinanceSort('full_name')}
                            className="py-4.5 px-6 min-w-[200px] cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center gap-1">
                              <span>Talaba F.I.Sh.</span>
                              {financeSortConfig.key === 'full_name' ? (
                                financeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleFinanceSort('group_name')}
                            className="py-4.5 px-6 w-36 text-center cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Guruh</span>
                              {financeSortConfig.key === 'group_name' ? (
                                financeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleFinanceSort('base_amount')}
                            className="py-4.5 px-6 w-40 text-center cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Asosiy shartnoma</span>
                              {financeSortConfig.key === 'base_amount' ? (
                                financeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleFinanceSort('discount_amount')}
                            className="py-4.5 px-6 min-w-[160px] text-center cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Chegirma (UZS)</span>
                              {financeSortConfig.key === 'discount_amount' ? (
                                financeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleFinanceSort('paid_amount')}
                            className="py-4.5 px-6 min-w-[160px] text-center cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>To'langan (UZS)</span>
                              {financeSortConfig.key === 'paid_amount' ? (
                                financeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleFinanceSort('debt')}
                            className="py-4.5 px-6 w-40 text-center cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Qoldiq qarz</span>
                              {financeSortConfig.key === 'debt' ? (
                                financeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th 
                            onClick={() => handleFinanceSort('deadline')}
                            className="py-4.5 px-6 min-w-[180px] text-center cursor-pointer hover:bg-slate-900/40 hover:text-white transition-colors group"
                          >
                            <div className="flex items-center justify-center gap-1">
                              <span>Oxirgi muddat</span>
                              {financeSortConfig.key === 'deadline' ? (
                                financeSortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                              ) : (
                                <ArrowUpDown className="h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </div>
                          </th>
                          <th className="py-4.5 px-6 text-center w-32">Amal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {sortedFinanceList.filter(s => {
                          const q = searchQuery.toLowerCase();
                          return (s.full_name || '').toLowerCase().includes(q) || (s.groups?.name || '').toLowerCase().includes(q);
                        }).length === 0 ? (
                          <tr>
                            <td colSpan="9" className="py-16 text-center text-slate-500 text-sm font-medium italic">
                              Talabalar topilmadi
                            </td>
                          </tr>
                        ) : (
                          sortedFinanceList.filter(s => {
                            const q = searchQuery.toLowerCase();
                            return (s.full_name || '').toLowerCase().includes(q) || (s.groups?.name || '').toLowerCase().includes(q);
                          }).map((student, idx) => {
                            const isSaving = financeSaving[student.id];
                            const isSuccess = financeSuccess[student.id];
                            const error = financeErrors[student.id];

                            const discount = editDiscounts[student.id] ?? 0;
                            const paid = editPaids[student.id] ?? 0;
                            const base = 16000000;
                            const debt = Math.max(0, base - discount - paid);

                            return (
                              <tr key={student.id} className="hover:bg-slate-900/10 transition-all duration-200">
                                <td className="py-4 px-6 text-center text-xs font-bold text-slate-600">{idx + 1}</td>
                                <td className="py-4 px-6">
                                  <div className="text-xs font-bold text-white">{student.full_name || 'Noma\'lum'}</div>
                                  <div className="text-[10px] text-slate-500 font-bold tracking-tight mt-0.5 truncate max-w-[200px]">ID: {student.id}</div>
                                </td>
                                <td className="py-4 px-6 text-center text-xs font-semibold text-slate-400">
                                  {student.groups?.name || '-'}
                                </td>
                                <td className="py-4 px-6 text-center text-xs font-bold text-slate-350">
                                  {formatCurrency(base)} UZS
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="number"
                                    value={editDiscounts[student.id] ?? ''}
                                    onChange={(e) => setEditDiscounts({ ...editDiscounts, [student.id]: e.target.value })}
                                    disabled={isSaving}
                                    className="w-36 bg-slate-950/60 border border-slate-900/60 hover:border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2 px-3 text-center text-xs outline-none font-semibold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="number"
                                    value={editPaids[student.id] ?? ''}
                                    onChange={(e) => setEditPaids({ ...editPaids, [student.id]: e.target.value })}
                                    disabled={isSaving}
                                    className="w-36 bg-slate-950/60 border border-slate-900/60 hover:border-slate-800 focus:border-indigo-500 text-white rounded-xl py-2 px-3 text-center text-xs outline-none font-semibold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <span className={`text-xs font-bold ${debt > 0 ? 'text-rose-400 font-extrabold' : 'text-emerald-450 font-extrabold'}`}>
                                    {formatCurrency(debt)} UZS
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <input
                                    type="date"
                                    value={editDeadlines[student.id] ?? ''}
                                    onChange={(e) => setEditDeadlines({ ...editDeadlines, [student.id]: e.target.value })}
                                    disabled={isSaving}
                                    className="bg-slate-950/65 border border-slate-900 text-white rounded-xl py-2 px-3 text-center text-xs outline-none font-semibold transition-all cursor-pointer"
                                  />
                                </td>
                                <td className="py-4 px-6 text-center">
                                  <button
                                    onClick={() => handleSaveFinance(student.id)}
                                    disabled={isSaving}
                                    className={`inline-flex items-center gap-1.5 justify-center py-2 px-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                                      isSuccess 
                                        ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/5' 
                                        : 'bg-indigo-500 hover:bg-indigo-400 text-white cursor-pointer active:scale-95 disabled:opacity-50'
                                    }`}
                                  >
                                    {isSaving ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : isSuccess ? (
                                      <Check className="h-3.5 w-3.5" />
                                    ) : (
                                      <Save className="h-3.5 w-3.5" />
                                    )}
                                    <span>{isSaving ? 'Saqlanmoqda...' : isSuccess ? 'Saqlandi' : 'Saqlash'}</span>
                                  </button>
                                  {error && <div className="text-[10px] text-red-400 font-semibold mt-1 max-w-[120px] mx-auto text-left leading-tight">{error}</div>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
