/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  FileText, 
  LayoutDashboard, 
  LogOut, 
  Plus, 
  Search, 
  MapPin, 
  Layers,
  ChevronRight,
  CheckCircle2,
  Clock,
  Menu,
  X,
  CreditCard,
  AlertTriangle,
  ShieldAlert,
  UserPlus,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { initializeApp } from 'firebase/app';
import { 
  auth,
  db,
  firebaseConfig
} from './lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getAuth,
  signOut as secondarySignOut
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc 
} from 'firebase/firestore';
import { officeService } from './services/officeService';
import type { Building, Office, Tenant } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  disabled,
  type = 'button'
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline',
  className?: string,
  disabled?: boolean,
  type?: 'button' | 'submit'
}) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className }: { children: React.ReactNode; className?: string; key?: string | number }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm', className)}>
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    info: 'bg-blue-50 text-blue-700'
  };

  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', styles[variant])}>
      {children}
    </span>
  );
};

// --- Modules ---

const Dashboard = ({ stats }: { stats: any }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-5 flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
          <Building2 size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Tòa nhà</p>
          <p className="text-2xl font-bold text-slate-900">{stats.buildings}</p>
        </div>
      </Card>
      <Card className="p-5 flex items-center gap-4">
        <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
          <CheckCircle2 size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Trống</p>
          <p className="text-2xl font-bold text-slate-900">{stats.availableOffices}</p>
        </div>
      </Card>
      <Card className="p-5 flex items-center gap-4">
        <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
          <Users size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Khách thuê</p>
          <p className="text-2xl font-bold text-slate-900">{stats.tenants}</p>
        </div>
      </Card>
      <Card className="p-5 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
          <FileText size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Hợp đồng</p>
          <p className="text-2xl font-bold text-slate-900">{stats.contracts}</p>
        </div>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Văn phòng mới trống</h3>
        <div className="space-y-4">
          {stats.availableOfficesList?.length > 0 ? (
            stats.availableOfficesList.slice(0, 5).map((office: any) => (
              <div key={office.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 border border-slate-100">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Phòng {office.roomNumber}, Tầng {office.floor}</p>
                    <p className="text-xs text-slate-500">{office.area} m² • {office.pricePerMonth.toLocaleString()} VNĐ/tháng</p>
                  </div>
                </div>
                <Badge variant="success">Trống</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">Không có văn phòng trống nào</p>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 text-slate-900">Hoạt động gần đây</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 items-start pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-900">Hợp đồng mới được ký kết</p>
                <p className="text-xs text-slate-500 mb-1">Dành cho Công ty {i === 1 ? 'Công nghệ X' : i === 2 ? 'May mặc Y' : 'Thực phẩm Z'}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">2 giờ trước</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// --- Main App Logic ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Data State
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    buildings: 0,
    offices: 0,
    availableOffices: 0,
    tenants: 0,
    contracts: 0,
    availableOfficesList: [] as Office[]
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'building' | 'office' | 'tenant' | 'contract'>('building');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [contractFilter, setContractFilter] = useState<'all' | 'active' | 'history'>('active');
  const [officeFilter, setOfficeFilter] = useState<'active' | 'trash'>('active');

  // Confirmation state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => Promise<void> | void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
  } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    // Keep it simple and clear existing timeout
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<'admin' | 'manager' | 'staff'>("staff");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // User Profile Role
  const [userProfile, setUserProfile] = useState<{
    uid: string;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'staff';
  } | null>(null);

  const [usersList, setUsersList] = useState<any[]>([]);

  // Admin User Creation & Management state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'staff'>("staff");
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDocRef = doc(db, 'users', u.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const profileData = userDocSnap.data() as any;
            setUserProfile({
              uid: u.uid,
              email: u.email || '',
              name: profileData.name || u.displayName || 'Người dùng',
              role: profileData.role || 'staff'
            });
          } else {
            const newProfile = {
              uid: u.uid,
              email: u.email || '',
              name: u.displayName || 'Người dùng Google',
              role: 'admin',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', u.uid), newProfile);
            setUserProfile({
              uid: u.uid,
              email: u.email || '',
              name: newProfile.name,
              role: 'admin'
            });
          }
        } catch (err: any) {
          console.error("Lỗi khi tải thông tin phân quyền", err);
          setUserProfile({
            uid: u.uid,
            email: u.email || '',
            name: u.displayName || 'Người dùng',
            role: 'admin'
          });
        }
        await loadData();
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    const b = await officeService.getBuildings();
    const o = await officeService.getOffices();
    const t = await officeService.getTenants();
    const c = await officeService.getContracts();

    setBuildings(b || []);
    setOffices(o || []);
    setTenants(t || []);
    setContracts(c || []);

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const uDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (uDoc.exists() && uDoc.data().role === 'admin') {
          const fetchedUsers = await officeService.getUsers();
          setUsersList(fetchedUsers || []);
        }
      } catch (err) {
        console.error("Không thể tải danh sách tài khoản", err);
      }
    }

    const activeOffices = ((o as Office[]) || []).filter(off => !off.isDeleted);
    const available = activeOffices.filter(off => off.status === 'available');
    setStats({
      buildings: b?.length || 0,
      offices: activeOffices.length,
      availableOffices: available.length,
      tenants: t?.length || 0,
      contracts: c?.length || 0,
      availableOfficesList: available as Office[]
    });
  };

  const handleGoogleLogin = async () => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google authentication failed", error);
      setAuthError(error.message || "Đăng nhập Google không thành công.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setAuthError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      showToast("Đăng nhập thành công!", "success");
    } catch (err: any) {
      console.error(err);
      let msg = "Tên đăng nhập hoặc mật khẩu không đúng.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = "Email hoặc mật khẩu không chính xác.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Địa chỉ email không hợp lệ.";
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput || !emailInput || !passwordInput) {
      setAuthError("Vui lòng điền đầy đủ tất cả các trường.");
      return;
    }
    if (passwordInput.length < 6) {
      setAuthError("Mật khẩu phải có độ dài ít nhất 6 ký tự.");
      return;
    }
    setAuthError("");
    setAuthLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
      const u = userCredential.user;
      
      const newProfile = {
        uid: u.uid,
        email: u.email || '',
        name: nameInput,
        role: roleInput,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', u.uid), newProfile);
      setUserProfile({
        uid: u.uid,
        email: u.email || '',
        name: newProfile.name,
        role: newProfile.role as 'admin' | 'manager' | 'staff'
      });
      
      showToast("Đăng ký tài khoản và phân quyền thành công!", "success");
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Không thể đăng ký tài khoản.";
      if (err.code === 'auth/email-already-in-use') {
        msg = "Email này đã được sử dụng.";
      } else if (err.code === 'auth/weak-password') {
        msg = "Mật khẩu yếu. Vui lòng sử dụng mật khẩu mạnh hơn.";
      } else if (err.code === 'auth/invalid-email') {
        msg = "Địa chỉ email không hợp lệ.";
      }
      setAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      showToast("Đăng xuất thành công", "info");
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) {
      showToast("Vui lòng điền đầy đủ thông tin tài khoản.", "error");
      return;
    }
    if (newUserPassword.length < 6) {
      showToast("Mật khẩu phải dài ít nhất 6 ký tự.", "error");
      return;
    }
    setActionLoading(true);
    try {
      const { getApp, getApps } = await import('firebase/app');
      let secondaryApp;
      if (getApps().some(app => app.name === 'SecondaryCreateApp')) {
        secondaryApp = getApp('SecondaryCreateApp');
      } else {
        secondaryApp = initializeApp(firebaseConfig, 'SecondaryCreateApp');
      }
      
      const secondaryAuth = getAuth(secondaryApp);
      const res = await createUserWithEmailAndPassword(secondaryAuth, newUserEmail, newUserPassword);
      const newUid = res.user.uid;
      
      await secondarySignOut(secondaryAuth);
      
      const newProfile = {
        uid: newUid,
        email: newUserEmail,
        name: newUserName,
        role: newUserRole,
        createdAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', newUid), newProfile);
      
      showToast(`Tạo thành công [ ${newUserEmail} ] với vai trò [ ${newUserRole === 'admin' ? 'Quản trị viên' : newUserRole === 'manager' ? 'Quản lý' : 'Nhân viên'} ]`, "success");
      
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("staff");
      setIsUserModalOpen(false);
      
      await loadData();
    } catch (err: any) {
      console.error("Lỗi khi tạo user:", err);
      let errMsg = err.message || "Không thể tạo tài khoản.";
      if (err.code === 'auth/email-already-in-use') {
        errMsg = "Địa chỉ email ngày đã tồn tại trên hệ thống Authentication.";
      } else if (err.code === 'auth/invalid-email') {
        errMsg = "Địa chỉ email không hợp lệ.";
      } else if (err.code === 'auth/weak-password') {
        errMsg = "Mật khẩu yếu.";
      }
      showToast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminUpdateUserRole = async (userUid: string, updatedRole: 'admin' | 'manager' | 'staff') => {
    if (userUid === user?.uid) {
      showToast("Bạn không thể tự cập nhật vai trò của chính mình!", "error");
      return;
    }
    setActionLoading(true);
    try {
      await officeService.updateUser(userUid, { role: updatedRole });
      showToast("Cập nhật vai trò thành công!", "success");
      setEditingUser(null);
      await loadData();
    } catch (err: any) {
      showToast("Cập nhật thất bại: " + err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminDeleteUser = async (userUid: string, userEmail: string) => {
    if (userUid === user?.uid) {
      showToast("Không thể tự xoá tài khoản của chính mình!", "error");
      return;
    }
    setConfirmDialog({
      title: 'Xóa & vô hiệu hóa quyền truy cập',
      message: `Xác nhận xóa quyền truy cập của người dùng "${userEmail}"? Tài khoản này sẽ không thể đọc hoặc chỉnh sửa dữ liệu hệ thống.`,
      type: 'danger',
      confirmText: 'Xóa quyền',
      cancelText: 'Hủy bỏ',
      onConfirm: async () => {
        try {
          await officeService.deleteUser(userUid);
          showToast("Đã xóa tài khoản khỏi cơ sở dữ liệu phân quyền.", "success");
          await loadData();
        } catch (err: any) {
          showToast("Xóa thất bại: " + err.message, "error");
        }
      }
    });
  };

  const renderContent = () => {
    const isManagerOrAdmin = userProfile?.role === 'manager' || userProfile?.role === 'admin';
    const isAdmin = userProfile?.role === 'admin';

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} />;
      case 'buildings':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Danh sách Tòa nhà</h2>
              {isManagerOrAdmin && (
                <Button onClick={() => { setModalType('building'); setIsModalOpen(true); }}>
                  <Plus size={18} className="mr-2" /> Thêm Tòa nhà
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {buildings.map((b) => (
                <Card key={b.id} className="group hover:shadow-md transition-all">
                  <div className="h-32 bg-slate-100 flex items-center justify-center text-slate-300 relative overflow-hidden">
                    <Building2 size={48} className="relative z-10" />
                    <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg text-slate-900">{b.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-1 mb-4">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{b.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-400">
                      <span>{b.totalFloors} Tầng</span>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'offices':
        const filteredOffices = offices.filter((office) => {
          if (officeFilter === 'active') {
            return !office.isDeleted;
          } else {
            return office.isDeleted === true;
          }
        });
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center sm:flex-row flex-col gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">
                  {officeFilter === 'active' ? 'Danh sách Văn phòng' : 'Bản tạm / Thùng rác'}
                </h2>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button 
                    onClick={() => setOfficeFilter('active')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200", 
                      officeFilter === 'active' ? "bg-white shadow-sm text-blue-600 font-semibold" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Hoạt động
                  </button>
                  <button 
                    onClick={() => setOfficeFilter('trash')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200", 
                      officeFilter === 'trash' ? "bg-white shadow-sm text-red-600 font-semibold" : "text-slate-500 hover:text-red-500"
                    )}
                  >
                    Thùng rác ({offices.filter(o => o.isDeleted).length})
                  </button>
                </div>
              </div>
              {officeFilter === 'active' && isManagerOrAdmin && (
                <Button onClick={() => { setModalType('office'); setSelectedItem(null); setIsModalOpen(true); }}>
                  <Plus size={18} className="mr-2" /> Thêm Văn phòng
                </Button>
              )}
            </div>
            <Card className="overflow-x-auto">
              {filteredOffices.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  {officeFilter === 'active' ? 'Chưa có văn phòng hoạt động nào.' : 'Bản tạm trống.'}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Số phòng</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Tòa nhà</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Tầng</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Diện tích</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Giá thuê (VNĐ)</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Trạng thái</th>
                      <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOffices.map((office) => {
                      const b = buildings.find(build => build.id === office.buildingId);
                      return (
                        <tr key={office.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-900">#{office.roomNumber}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{b?.name || 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{office.floor}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{office.area} m²</td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">{office.pricePerMonth.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <Badge variant={office.status === 'available' ? 'success' : office.status === 'maintenance' ? 'warning' : 'danger'}>
                              {office.status === 'available' ? 'Trống' : office.status === 'maintenance' ? 'Bảo trì' : 'Đã thuê'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 space-x-3">
                            {officeFilter === 'active' ? (
                              isManagerOrAdmin ? (
                                <>
                                  <button 
                                    onClick={() => {
                                      setSelectedItem(office);
                                      setModalType('office');
                                      setIsModalOpen(true);
                                    }}
                                    className="text-xs text-blue-600 font-medium hover:underline"
                                  >
                                    Sửa
                                  </button>
                                  <button 
                                    onClick={() => {
                                      const isRented = office.status === 'rented';
                                      const msg = isRented 
                                        ? `Văn phòng #${office.roomNumber} đang ở trạng thái 'Đã thuê'. Bạn muốn đưa văn phòng này vào Bản tạm?`
                                        : `Bạn có chắc chắn muốn đưa văn phòng #${office.roomNumber} vào Bản tạm?`;
                                      
                                      setConfirmDialog({
                                        title: 'Đưa vào bản tạm',
                                        message: msg,
                                        type: isRented ? 'danger' : 'warning',
                                        confirmText: 'Đưa vào bản tạm',
                                        cancelText: 'Quay lại',
                                        onConfirm: async () => {
                                          try {
                                            await officeService.softDeleteOffice(office.id);
                                            showToast("Đã đưa văn phòng vào Bản tạm.", "success");
                                            await loadData();
                                          } catch (err: any) {
                                            showToast("Lỗi khi đưa vào Bản tạm: " + err.message, "error");
                                          }
                                        }
                                      });
                                    }}
                                    className="text-xs text-red-500 font-medium hover:underline"
                                  >
                                    Xóa
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-400">Không có quyền</span>
                              )
                            ) : (
                              <>
                                {isManagerOrAdmin && (
                                  <button 
                                    onClick={() => {
                                      setConfirmDialog({
                                        title: 'Khôi phục văn phòng',
                                        message: `Bạn có chắc chắn muốn khôi phục văn phòng #${office.roomNumber}?`,
                                        type: 'info',
                                        confirmText: 'Khôi phục',
                                        cancelText: 'Quay lại',
                                        onConfirm: async () => {
                                          try {
                                            await officeService.restoreOffice(office.id);
                                            showToast("Đã khôi phục văn phòng thành công.", "success");
                                            await loadData();
                                          } catch (err: any) {
                                            showToast("Lỗi khi khôi phục văn phòng: " + err.message, "error");
                                          }
                                        }
                                      });
                                    }}
                                    className="text-xs text-emerald-600 font-medium hover:underline mr-2"
                                  >
                                    Khôi phục
                                  </button>
                                )}
                                {isAdmin ? (
                                  <button 
                                    onClick={() => {
                                      setConfirmDialog({
                                        title: 'Xóa vĩnh viễn',
                                        message: `CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN văn phòng #${office.roomNumber}?\nHành động này KHÔNG THỂ khôi phục.`,
                                        type: 'danger',
                                        confirmText: 'Xóa vĩnh viễn',
                                        cancelText: 'Quay lại',
                                        onConfirm: async () => {
                                          try {
                                            await officeService.deleteOffice(office.id);
                                            showToast("Đã xóa vĩnh viễn văn phòng thành công.", "success");
                                            await loadData();
                                          } catch (err: any) {
                                            showToast("Lỗi khi xóa vĩnh viễn: " + err.message, "error");
                                          }
                                        }
                                      });
                                    }}
                                    className="text-xs text-red-600 font-semibold hover:underline"
                                  >
                                    Xóa vĩnh viễn
                                  </button>
                                ) : (
                                  !isManagerOrAdmin && <span className="text-xs text-slate-400">Không có quyền</span>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        );
      case 'tenants':
        return (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Danh sách Khách thuê</h2>
              {isManagerOrAdmin && (
                <Button onClick={() => { setModalType('tenant'); setSelectedItem(null); setIsModalOpen(true); }}>
                  <Plus size={18} className="mr-2" /> Thêm Khách thuê
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map(tenant => (
                <Card key={tenant.id} className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Users size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{tenant.name}</h3>
                      <p className="text-xs text-slate-500">{tenant.companyName || 'Cá nhân'}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                       <Clock size={14} className="text-slate-400" />
                       <span>{tenant.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <MapPin size={14} className="text-slate-400" />
                       <span>{tenant.phone}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                    {isManagerOrAdmin && (
                      <Button variant="outline" className="text-xs" onClick={() => {
                          setSelectedItem(tenant);
                          setModalType('tenant');
                          setIsModalOpen(true);
                      }}>Sửa</Button>
                    )}
                    <Button variant="ghost" className="text-xs">Chi tiết</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 'contracts':
        const filteredContracts = contracts.filter(c => {
            if (contractFilter === 'active') return c.status === 'active';
            if (contractFilter === 'history') return c.status !== 'active';
            return true;
        });

        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Danh sách Hợp đồng</h2>
              <div className="flex gap-2">
                <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                    <button 
                        onClick={() => setContractFilter('active')}
                        className={cn("px-3 py-1 text-xs font-medium rounded-md", contractFilter === 'active' ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
                    >Hiện tại</button>
                    <button 
                        onClick={() => setContractFilter('history')}
                        className={cn("px-3 py-1 text-xs font-medium rounded-md", contractFilter === 'history' ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
                    >Lịch sử</button>
                    <button 
                        onClick={() => setContractFilter('all')}
                        className={cn("px-3 py-1 text-xs font-medium rounded-md", contractFilter === 'all' ? "bg-white shadow-sm text-blue-600" : "text-slate-500")}
                    >Tất cả</button>
                </div>
                {isManagerOrAdmin && (
                  <Button onClick={() => { setModalType('contract'); setSelectedItem(null); setIsModalOpen(true); }}>
                      <Plus size={18} className="mr-2" /> Tạo Hợp đồng
                  </Button>
                )}
              </div>
            </div>
            <Card className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Ngày ký</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Khách thuê</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Văn phòng</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Giá hợp đồng</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Thời hạn</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Trạng thái</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContracts.map((contract: any) => {
                    const t = tenants.find(ten => ten.id === contract.tenantId);
                    const o = offices.find(off => off.id === contract.officeId);
                    return (
                      <tr key={contract.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{t?.name || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{o?.roomNumber || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900">{contract.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</td>
                        <td className="px-6 py-4">
                          <Badge variant={contract.status === 'active' ? 'success' : contract.status === 'expired' ? 'warning' : 'danger'}>
                            {contract.status === 'active' ? 'Hiệu lực' : contract.status === 'expired' ? 'Hết hạn' : 'Đã chấm dứt'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                            {contract.status === 'active' ? (
                              isManagerOrAdmin ? (
                                <button 
                                    onClick={() => {
                                        setConfirmDialog({
                                            title: 'Chấm dứt hợp đồng sớm',
                                            message: 'Xác nhận chấm dứt hợp đồng này trước thời hạn? Trạng thái văn phòng liên quan sẽ tự động chuyển về hoạt động (Trống).',
                                            type: 'danger',
                                            confirmText: 'Chấm dứt sớm',
                                            cancelText: 'Quay lại',
                                            onConfirm: async () => {
                                                try {
                                                    await officeService.terminateContract(contract.id, contract.officeId);
                                                    showToast("Hợp đồng đã được chấm dứt và phòng đã được giải phóng.", "success");
                                                    loadData();
                                                } catch (err: any) {
                                                    showToast("Lỗi: " + err.message, "error");
                                                }
                                            }
                                        });
                                    }}
                                    className="text-xs text-red-500 font-medium hover:underline"
                                >
                                    Chấm dứt sớm
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">Không có quyền</span>
                              )
                            ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </div>
        );
      case 'users':
        if (userProfile?.role !== 'admin') {
          return (
            <div className="p-8 text-center space-y-4">
              <AlertTriangle className="mx-auto text-amber-500" size={48} />
              <h3 className="text-lg font-bold text-slate-800">Không có quyền truy cập</h3>
              <p className="text-sm text-slate-500">Khu vực này chỉ dành riêng cho tài khoản có vai trò Quản trị viên.</p>
            </div>
          );
        }
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Quản trị và Phân quyền nội bộ</h2>
                <p className="text-xs text-slate-500 mt-1">Quản lý tài khoản, mật khẩu, và gán quyền nhân viên hoặc quản lý truy cập hệ thống.</p>
              </div>
              <Button onClick={() => { setIsUserModalOpen(true); }} className="shadow-lg shadow-blue-100 flex items-center gap-2 py-2 px-4 rounded-xl">
                <UserPlus size={16} /> Thêm người dùng mới
              </Button>
            </div>

            {/* Bảng danh sách */}
            <Card className="overflow-hidden border border-slate-200 shadow-sm bg-white rounded-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Người dùng</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-sm text-slate-400">
                          Chưa có tài khoản nào được phân quyền hoặc đang tải...
                        </td>
                      </tr>
                    ) : (
                      usersList.map((usr) => {
                        const isSelf = usr.uid === user?.uid;
                        return (
                          <tr key={usr.uid} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-sm border border-slate-200">
                                  {(usr.name || usr.email || 'U').charAt(0).toUpperCase()}
                               </div>
                                <div>
                                  <span className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                                    {usr.name || 'N/A'}
                                    {isSelf && (
                                      <span className="bg-blue-50 text-blue-600 text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border border-blue-100">
                                        Bạn
                                      </span>
                                    )}
                                  </span>
                                  <span className="text-[11px] text-slate-400 block">{usr.uid}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-slate-600">
                              {usr.email}
                            </td>
                            <td className="px-6 py-4">
                              {editingUser?.uid === usr.uid ? (
                                <div className="flex items-center gap-2">
                                  <select
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                                    className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="staff">Nhân viên (Staff)</option>
                                    <option value="manager">Quản lý (Manager)</option>
                                    <option value="admin">Quản trị viên (Admin)</option>
                                  </select>
                                  <button
                                    onClick={() => handleAdminUpdateUserRole(usr.uid, editingUser.role)}
                                    className="bg-blue-600 text-white rounded-lg p-1 hover:bg-blue-700 transition-colors"
                                    title="Lưu"
                                  >
                                    <CheckCircle2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => setEditingUser(null)}
                                    className="bg-slate-200 text-slate-600 rounded-lg p-1 hover:bg-slate-300 transition-colors"
                                    title="Huỷ"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              ) : (
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border",
                                  usr.role === 'admin' 
                                    ? "bg-rose-50 text-rose-700 border-rose-100" 
                                    : usr.role === 'manager' 
                                    ? "bg-blue-50 text-blue-700 border-blue-100" 
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                )}>
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    usr.role === 'admin' ? "bg-rose-500" : usr.role === 'manager' ? "bg-blue-500" : "bg-slate-400"
                                  )} />
                                  {usr.role === 'admin' ? "Quản trị" : usr.role === 'manager' ? "Quản lý" : "Nhân viên"}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500 font-mono">
                              {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Không rõ'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {!isSelf ? (
                                <div className="flex items-center justify-end gap-3">
                                  {editingUser?.uid !== usr.uid && (
                                    <button
                                      onClick={() => setEditingUser({ uid: usr.uid, role: usr.role })}
                                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                                    >
                                      Sửa quyền
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleAdminDeleteUser(usr.uid, usr.email)}
                                    className="text-xs text-red-500 hover:text-red-700 font-semibold hover:underline"
                                  >
                                    Xóa quyền
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 font-medium">Đang đăng nhập</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Thông tin giải thích phân quyền */}
            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100 flex items-start gap-3">
              <ShieldAlert className="text-blue-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-blue-950">Nguyên lý phân quyền truy cập hệ thống:</h4>
                <ul className="text-xs text-blue-900/95 list-disc pl-4 space-y-1">
                  <li><strong>Nhân viên (Staff)</strong>: Chỉ có quyền xem thông tin tòa nhà, văn phòng, khách thuê, hóa đơn và hợp đồng. Hoàn toàn không được thêm, sửa, xóa bất kỳ dữ liệu nào.</li>
                  <li><strong>Quản lý (Manager)</strong>: Có quyền Thêm mới & Cập nhật thông tin Tòa nhà, Văn phòng, Khách thuê, và Tạo hợp đồng. Tuy nhiên, không có thẩm quyền Xóa vĩnh viễn dữ liệu hoặc quản lý tài khoản.</li>
                  <li><strong>Quản trị viên (Admin)</strong>: Có toàn bộ quyền hạn cao nhất. Được phép thực hiện các thao tác Xóa vĩnh viễn (bypass thùng rác mềm), Quản lý và Phân quyền tất cả các tài khoản hệ thống.</li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return <Dashboard stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
           <p className="text-slate-500 font-medium">Đang tải hệ thống...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100/60 px-4 py-12">
        <Card className="max-w-md w-full p-8 space-y-6 border border-slate-200 shadow-xl relative overflow-hidden bg-white rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600" />
          
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-1">
              <Building2 size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Office Rental Pro</h1>
            <p className="text-sm text-slate-500">Hệ thống quản lý văn phòng cho thuê chuyên nghiệp</p>
          </div>

          {/* Tab Button Toggles */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => { setIsSignUp(false); setAuthError(""); }}
              className={cn(
                "flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-all outline-none",
                !isSignUp ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Đăng nhập
            </button>
            <button
              onClick={() => { setIsSignUp(true); setAuthError(""); }}
              className={cn(
                "flex-1 pb-3 text-center text-sm font-semibold border-b-2 transition-all outline-none",
                isSignUp ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Đăng ký tài khoản
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-lg flex items-center gap-2 border border-red-100">
              <AlertTriangle size={14} className="shrink-0 text-red-500" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          <form className="space-y-4" onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn}>
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Địa chỉ Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mật khẩu</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vai trò truy cập (Phân quyền)</label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                >
                  <option value="staff">Nhân viên (Chỉ xem dữ liệu)</option>
                  <option value="manager">Quản lý (Thêm/Sửa phòng, khách, hợp đồng)</option>
                  <option value="admin">Quản trị viên (Toàn quyền hệ thống + Xóa vĩnh viễn)</option>
                </select>
                <p className="mt-1 text-[11px] text-slate-400">Chọn vai trò để kiểm tra chức năng phân quyền dữ liệu tương ứng.</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-center"
            >
              {authLoading ? "Đang xử lý..." : isSignUp ? "Đăng ký tài khoản" : "Đăng nhập"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs font-medium">Hoặc</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            disabled={authLoading}
            variant="outline"
            className="w-full py-2.5 rounded-xl flex items-center justify-center gap-3 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5 shrink-0" alt="Google" />
            Đăng nhập nhanh Google
          </Button>

          <p className="text-center text-xs text-slate-400 pt-2 border-t border-slate-100/80">
            &copy; {new Date().getFullYear()} Office Rental Pro. Hệ thống nội bộ &amp; Bảo mật.
          </p>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'buildings', label: 'Tòa nhà', icon: Building2 },
    { id: 'offices', label: 'Văn phòng', icon: Layers },
    { id: 'tenants', label: 'Khách thuê', icon: Users },
    { id: 'contracts', label: 'Hợp đồng', icon: FileText },
    { id: 'invoices', label: 'Hoá đơn', icon: CreditCard },
    ...(userProfile?.role === 'admin' ? [{ id: 'users', label: 'Quản trị phân quyền', icon: ShieldAlert }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Overlay */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 h-screen",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                 <Building2 size={20} />
               </div>
               <span className="text-lg font-bold text-slate-900 uppercase tracking-tight">Rental Pro</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                    activeTab === item.id 
                      ? "bg-blue-50 text-blue-600 border-blue-100 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon size={20} className={cn(
                    "transition-colors",
                    activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                  )} />
                  {item.label}
                  {activeTab === item.id && <motion.div layoutId="active" className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-start gap-3 px-2">
              {user.photoURL ? (
                <img src={user.photoURL} className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0" alt={userProfile?.name || ''} />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-200 shrink-0 text-sm">
                  {(userProfile?.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{userProfile?.name || user.displayName || 'Người dùng'}</p>
                <p className="text-[11px] text-slate-500 truncate mb-1">{user.email}</p>
                {userProfile && (
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border",
                    userProfile.role === 'admin' 
                      ? "bg-rose-50 text-rose-700 border-rose-100" 
                      : userProfile.role === 'manager' 
                      ? "bg-blue-50 text-blue-700 border-blue-100" 
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  )}>
                    {userProfile.role === 'admin' ? "Quản trị" : userProfile.role === 'manager' ? "Quản lý" : "Nhân viên"}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-y-auto pb-12">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
               <Menu size={20} />
             </button>
             <h1 className="text-xl font-bold text-slate-900">
               {menuItems.find(i => i.id === activeTab)?.label}
             </h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm..." 
                  className="bg-slate-100 border border-slate-200 rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-300 w-64 transition-all outline-none"
                />
             </div>
             <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Clock size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden"
            >
               <div className="p-6 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedItem ? 'Chỉnh sửa' : 'Thêm'} {
                     modalType === 'building' ? 'Tòa nhà' : 
                     modalType === 'office' ? 'Văn phòng' : 
                     modalType === 'tenant' ? 'Khách thuê' : 'Hợp đồng'
                    }
                  </h3>
               </div>
               <form className="p-6 space-y-4" onSubmit={async (e) => {
                 e.preventDefault();
                 const formData = new FormData(e.currentTarget);
                 const data = Object.fromEntries(formData.entries());
                 
                 try {
                   if (modalType === 'building') {
                     await officeService.addBuilding({
                       ...data,
                       totalFloors: Number(data.totalFloors),
                       createdAt: new Date()
                     });
                   } else if (modalType === 'office') {
                     if (selectedItem) {
                        await officeService.updateOffice(selectedItem.id, {
                          ...data,
                          floor: Number(data.floor),
                          area: Number(data.area),
                          pricePerMonth: Number(data.pricePerMonth),
                          status: data.status || selectedItem.status || 'available'
                        });
                      } else {
                        await officeService.addOffice({
                       ...data,
                       floor: Number(data.floor),
                       area: Number(data.area),
                       pricePerMonth: Number(data.pricePerMonth),
                       status: 'available'
                     });
                     }
                   } else if (modalType === 'tenant') {
                     if (selectedItem) {
                        await officeService.updateTenant(selectedItem.id, data);
                     } else {
                        await officeService.addTenant(data);
                     }
                   } else if (modalType === 'contract') {
                     await officeService.addContract({
                       ...data,
                       price: Number(data.price),
                       deposit: Number(data.deposit),
                       startDate: data.startDate,
                       endDate: data.endDate,
                       status: 'active'
                     });
                   }
                   
                   setIsModalOpen(false);
                   setSelectedItem(null);
                   showToast("Lưu thông tin thành công!", "success");
                   loadData();
                 } catch (err: any) {
                   console.error(err);
                   showToast("Có lỗi xảy ra khi lưu dữ liệu: " + (err.message || "Lỗi không xác định"), "error");
                 }
               }}>
                 {modalType === 'building' && (
                   <>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên Tòa nhà</label>
                       <input name="name" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Địa chỉ</label>
                       <input name="address" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tổng số tầng</label>
                       <input name="totalFloors" type="number" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                     </div>
                   </>
                 )}

                 {modalType === 'office' && (
                   <>
                     <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tòa nhà</label>
                       <select name="buildingId" defaultValue={selectedItem?.buildingId} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                         {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                       </select>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số phòng</label>
                         <input name="roomNumber" defaultValue={selectedItem?.roomNumber} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tầng</label>
                         <input name="floor" type="number" defaultValue={selectedItem?.floor} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diện tích (m²)</label>
                         <input name="area" type="number" defaultValue={selectedItem?.area} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                       </div>
                       <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giá thuê/Tháng</label>
                         <input name="pricePerMonth" type="number" defaultValue={selectedItem?.pricePerMonth} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Trạng thái (Status)</label>
                        <select name="status" defaultValue={selectedItem?.status || 'available'} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                          <option value="available">Trống (Sẵn sàng cho thuê)</option>
                          <option value="rented">Đã thuê</option>
                          <option value="maintenance">Bảo trì</option>
                        </select>
                      </div>
                      <div className="hidden">
                        <div className="hidden">
                       </div>
                     </div>
                   </>
                 )}

                 {modalType === 'tenant' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Họ tên</label>
                        <input name="name" defaultValue={selectedItem?.name} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                        <input name="email" type="email" defaultValue={selectedItem?.email} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số điện thoại</label>
                        <input name="phone" defaultValue={selectedItem?.phone} required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Công ty</label>
                        <input name="companyName" defaultValue={selectedItem?.companyName} className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                      </div>
                    </>
                 )}

                 {modalType === 'contract' && (
                   <>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Khách thuê</label>
                        <select name="tenantId" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                          {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Văn phòng (Trống)</label>
                        <select name="officeId" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                          {offices.filter(o => o.status === 'available').map(o => <option key={o.id} value={o.id}>Phòng {o.roomNumber} - Tầng {o.floor}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày bắt đầu</label>
                          <input name="startDate" type="date" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày kết thúc</label>
                          <input name="endDate" type="date" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giá thuê</label>
                          <input name="price" type="number" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tiền cọc</label>
                          <input name="deposit" type="number" required className="w-full rounded-lg border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                        </div>
                      </div>
                   </>
                 )}

                 <div className="pt-6 flex gap-3">
                   <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                   <Button type="submit" className="flex-1">Lưu thông tin</Button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={cn(
              "fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border min-w-[300px] max-w-md",
              toast.type === 'success' 
                ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                : toast.type === 'error'
                ? "bg-rose-50 border-rose-100 text-rose-800"
                : "bg-blue-50 border-blue-100 text-blue-800"
            )}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-500" />
            ) : (
               <AlertTriangle size={18} className="text-rose-500" />
            )}
            <span className="text-sm font-semibold flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </motion.div>
        )}

        {isUserModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsUserModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800">
                  <UserPlus className="text-blue-600" size={20} />
                  <h3 className="text-base font-extrabold tracking-tight">Thêm thành viên mới</h3>
                </div>
                <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdminCreateUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Hải"
                    className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Địa chỉ Email</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="email@company.com"
                    className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mật khẩu khởi tạo</label>
                  <input
                    type="password"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cấp độ phân quyền (Role)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 bg-white text-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="staff">Nhân viên (Staff) - Chỉ xem dữ liệu</option>
                    <option value="manager">Quản lý (Manager) - Thêm/Sửa Tòa nhà, Văn phòng, Hợp đồng</option>
                    <option value="admin">Quản trị viên (Admin) - Toàn quyền hệ thống & tài khoản</option>
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
                    Hủy bỏ
                  </Button>
                  <Button type="submit" disabled={actionLoading} className="py-2.5 px-5 font-bold text-sm">
                    {actionLoading ? "Đang xử lý..." : "Xác nhận tạo"}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-slate-100 space-y-4"
            >
              <div className="flex items-start gap-4">
                <div className={cn(
                  "p-3 rounded-full flex-shrink-0",
                  confirmDialog.type === 'danger' ? "bg-red-50 text-red-600" : confirmDialog.type === 'warning' ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                )}>
                  {confirmDialog.type === 'danger' ? (
                    <AlertTriangle size={24} />
                  ) : confirmDialog.type === 'warning' ? (
                    <AlertTriangle size={24} />
                  ) : (
                    <Building2 size={24} />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">{confirmDialog.title}</h3>
                  <p className="text-sm text-slate-500 whitespace-pre-line leading-relaxed">{confirmDialog.message}</p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => setConfirmDialog(null)}
                >
                  {confirmDialog.cancelText || 'Hủy'}
                </Button>
                <Button 
                  variant={confirmDialog.type === 'danger' ? 'danger' : 'primary'}
                  className={cn(
                    "flex-1 font-semibold",
                    confirmDialog.type === 'danger' ? "bg-red-600 text-white hover:bg-red-700" : confirmDialog.type === 'warning' ? "bg-amber-600 text-white hover:bg-amber-700" : ""
                  )}
                  onClick={async () => {
                    const handler = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    await handler();
                  }}
                >
                  {confirmDialog.confirmText || 'Xác nhận'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
