import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthContext';
import '../../assets/css/login.css';
import UkLogo from '../../assets/images/new_logo_uk.png';
import ResetPasswordModal from './ResetPasswordModal';
import Womenlogo from '../../assets/images/women_logo.jpeg';

const Login = () => {
const [formData, setFormData] = useState({
     role: 'director',
     email_or_phone: 'Directorate',
     password: '',
   });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // New state for password reset modal
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordUsername, setResetPasswordUsername] = useState('');
  const [resetPasswordRole, setResetPasswordRole] = useState('');

// New state for dropdowns
   const [districts, setDistricts] = useState([]);
   const [projects, setProjects] = useState([]);
   const [sectors, setSectors] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [SectorProjectsData, setSectorProjectsData] = useState([]);

  const navigate = useNavigate();
  const { login } = useAuth();

// Content for Government Portal Style (consistent with Home.jsx)
   const content = {
     brandSubtitle: "Women Empowerment & Child Development Department",
     roleLabel: "Select Your Role",
    userIdLabel: "Login Type",
    userIdPlaceholder: "Enter Login Type",
    passwordLabel: "Password",
    districtLabel: "Select District",
    projectLabel: "Select Project",
    sectorLabel: "Select Sector",
    anganwadiLabel: "Select Center Login",
    passwordPlaceholder: "Enter Password",
    rememberMe: "Remember Me",
    signIn: "Sign In",
    signingIn: "Signing In...",
    
    learnTitle: "Learn",
    learnDesc: "Access quality education and new curricula",
    growTitle: "Grow",
    growDesc: "Track your educational progress",
    succeedTitle: "Succeed",
    succeedDesc: "Build your career from class 9 to 12",
    welcomeTitle: "Welcome",
    welcomeSubtitle: "Sign in to continue to your dashboard",
    
    needAccess: "Need access? ",
    contactAdmin: "Contact Admin",
    errors: {
      userIdRequired: "User ID / Phone is required",
      passwordRequired: "Password is required",
      loginFailed: "Login failed. Please try again.",
      loginSuccess: "Login Successful!",
      invalidCredentials: "Invalid credentials. Please try again.",
      userNotFound: "User not found.",
      defaultPasswordNotAllowed: "Default password not allowed. Please reset your password."
    },
    resetPassword: {
      title: "Reset Password",
      newPasswordLabel: "New Password",
      confirmPasswordLabel: "Confirm Password",
      resetButton: "Reset Password",
      resettingButton: "Resetting...",
      passwordMismatch: "Passwords do not match.",
      resetSuccess: "Password reset successfully.",
      resetFailed: "Password reset failed. Please try again."
    }
  };

  const roleOptions = useMemo(() => {
    return [
      { value: 'director', label: 'Directorate', icon: 'bi-person-workspace' },
      { value: 'dpo', label: 'DPO', icon: 'bi-briefcase' },
      { value: 'cdpo', label: 'CDPO', icon: 'bi-person-badge' },
      { value: 'supervisor', label: 'Sector', icon: 'bi-person-check' },
    ];
  }, []);

  const loginTitle = useMemo(() => {
    const selectedRole = roleOptions.find(r => r.value === formData.role);
    return selectedRole ? selectedRole.label : 'Login';
  }, [formData.role, roleOptions]);

  useEffect(() => {
    if (roleOptions.length > 0 && !formData.role) {
      setFormData(prev => ({ ...prev, role: roleOptions[0].value }));
    }
  }, [roleOptions]);

const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      setError('');

// Reset dropdown selections and dependent data when role changes
       if (name === 'role') {
         setSelectedDistrict('');
         setSelectedProject('');
         setSelectedSector('');
         setFormData(prev => ({ ...prev, email_or_phone: '' }));
         const emailValue = value === 'director' ? 'Directorate' : '';
         setFormData(prev => ({ ...prev, email_or_phone: emailValue }));
         setDistricts([]);
         setProjects([]);
         setSectors([]);
         setSectorProjectsData([]);
       }
    };

// Fetching logic for dropdowns
    useEffect(() => {
      if (['supervisor', 'cdpo', 'dpo'].includes(formData.role)) {
        fetchDistricts();
      }
    }, [formData.role]);

    const fetchDistricts = async () => {
      let url = '';
      if (formData.role === 'supervisor') {
        url = 'https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/sector-dropdown/';
      } else if (formData.role === 'cdpo') {
        url = 'https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/cdpo-dropdown/';
      } else if (formData.role === 'dpo') {
        url = 'https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/district-list/';
      }
      try {
        const res = await axios.get(url || '');
        if (res.data.success) setDistricts(res.data.data);
      } catch (err) { console.error("Error fetching districts", err); }
    };

const handleDistrictChange = async (e) => {
      const district = e.target.value;
      setSelectedDistrict(district);
      setSelectedProject('');
      setSelectedSector('');
      setFormData(prev => ({ ...prev, email_or_phone: '' }));
      setProjects([]); setSectors([]);
      setSectorProjectsData([]);

      if (district) {
        if (formData.role === 'dpo') {
          const selectedObj = districts.find(d => d.district === district);
          if (selectedObj) {
            setFormData(prev => ({ ...prev, email_or_phone: selectedObj.sdname }));
          }
          return;
        }

        let url = '';
        if (formData.role === 'supervisor') {
          url = `https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/sector-dropdown/?district=${district}`;
        } else if (formData.role === 'cdpo') {
          url = `https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/cdpo-dropdown/?district=${district}`;
        }

        try {
          const res = await axios.get(url);
          if (res.data.success) {
            if (formData.role === 'supervisor') {
              setSectorProjectsData(res.data.data);
              setProjects(res.data.data.map(item => ({ project: item.project_code })));
            } else if (formData.role === 'cdpo') {
              setProjects(res.data.data.map(item => ({ project: item.project_name })));
            } else {
              setProjects(res.data.data);
            }
          }
        } catch (err) { console.error("Error fetching projects", err); }
      }
    };

const handleProjectChange = async (e) => {
      const project = e.target.value;
      setSelectedProject(project);
      setSelectedSector('');
      setSectors([]);

      if (project) {
        if (formData.role === 'supervisor') {
          setFormData(prev => ({ ...prev, email_or_phone: '' }));
          const projData = SectorProjectsData.find(p => p.project_code === project);
          if (projData) setSectors(projData.sectors);
        } else if (formData.role === 'cdpo') {
          setFormData(prev => ({ ...prev, email_or_phone: project }));
        } else {
          setFormData(prev => ({ ...prev, email_or_phone: '' }));
        }
      } else {
        setFormData(prev => ({ ...prev, email_or_phone: '' }));
      }
    };

const handleSectorChange = async (e) => {
      const sector = e.target.value;
      setSelectedSector(sector);

      if (formData.role === 'supervisor') {
        // For supervisor, the selected sector name is the username
        setFormData(prev => ({ ...prev, email_or_phone: sector }));
      } else {
        setFormData(prev => ({ ...prev, email_or_phone: '' }));
      }
    };

const handleLoginSuccess = (data) => {
     login({
       access: data.access,
       refresh: data.refresh,
       role: data.role,
       unique_id: data.unique_id,
       user: data.user || null,
     });
     alert(content.errors.loginSuccess);

     // Role-based redirection to specific dashboards
     const userRole = data.role;
     switch (userRole) {
       case 'director':
         navigate('/DirectorDashboard');
         break;
       case 'dpo':
         navigate('/DPODashboard');
         break;
       case 'cdpo':
         navigate('/CDPODashboard');
         break;
       case 'supervisor':
         navigate('/SectorDashBoard');
         break;
       default:
         navigate('/UserDashboard');
     }
   };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email_or_phone) {
      setError(content.errors.userIdRequired);
      return;
    }
    if (!formData.password) {
      setError(content.errors.passwordRequired);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        username: formData.email_or_phone,
        password: formData.password,
        role: formData.role,
      };

      const response = await axios.post(
        'https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/login/',
        payload
      );

      if (response.data.access) {
        handleLoginSuccess(response.data);
      }
    } catch (err) {
      const responseData = err.response?.data;
      if (responseData?.action === 'FORGOT_PASSWORD_REQUIRED') {
        setError(responseData.error || content.errors.defaultPasswordNotAllowed);
      } else if (responseData?.error === 'Invalid credentials') {
        setError(content.errors.invalidCredentials);
      } else if (responseData?.error === 'User not found') {
        setError(content.errors.userNotFound);
      } else if (responseData?.error) {
        setError(responseData.error);
      } else {
        setError(responseData?.message || content.errors.loginFailed);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetSuccess = async (newPassword) => {
    setShowResetPasswordModal(false);
    // After successful password reset, attempt to log in with the new password
    setLoading(true);
    try {
      const payload = { username: resetPasswordUsername, password: newPassword, role: resetPasswordRole };
      const response = await axios.post('https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/login/', payload);
      if (response.data.access) {
        handleLoginSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || content.errors.loginFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-pattern"></div>
      <div className="login-container">
          <div className="login-right">
          <div className="uttarakhand-section">
            <img src={UkLogo} alt="Uttarakhand Logo" className="uttarakhand-logo" />
            <h2 className="uttarakhand-title">Women Empowerment & Child Development Department<br/><span className="state-portal">WECD Uttarakhand | State Portal</span></h2>
            
          </div>

         
        </div>
        <div className="login-left">
          <div className="login-content">
            <div className="login-header">
              <div className="brand-logo">
                <img src={Womenlogo} alt="Brand Logo" />
              </div>
              <h1>{loginTitle}</h1>
              <p>{content.brandSubtitle}</p>
            </div>

           

            {/* Radio Button Selection */}
            <div className="role-selector">
              <label className="role-selector-title">{content.roleLabel}</label>
              <div className="radio-selection">
                {roleOptions.map((option) => (
                  <label key={option.value} className="radio-option">
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={formData.role === option.value}
                      onChange={handleChange}
                    />
                    <span className="radio-label">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="alert-message error">
                  <i className="bi bi-exclamation-circle"></i>
                  {error}
                </div>
              )}

{['supervisor', 'cdpo', 'dpo'].includes(formData.role) ? (
                <>
                  <div className="form-group">
                    <label>{content.districtLabel}</label>
                    <select className="form-select custom-login-select" value={selectedDistrict} onChange={handleDistrictChange}>
                      <option value="">{content.districtLabel}</option>
                      {districts.map((d, i) => (
                        <option key={i} value={d.district}>{d.district}</option>
                      ))}
                    </select>
                  </div>

                  {formData.role !== 'dpo' && (
                    <div className="form-group">
                      <label>{content.projectLabel}</label>
                      <select 
                        className="form-select custom-login-select" 
                        value={selectedProject} 
                        onChange={handleProjectChange} 
                        disabled={!selectedDistrict}
                      >
                        <option value="">{content.projectLabel}</option>
                        {projects.map((p, i) => (
                          <option key={i} value={p.project}>{p.project}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!['cdpo', 'dpo'].includes(formData.role) && (
                    <div className="form-group">
                      <label>{content.sectorLabel}</label>
                      <select 
                        className="form-select custom-login-select" 
                        value={selectedSector} 
                        onChange={handleSectorChange} 
                        disabled={!selectedProject}
                      >
                        <option value="">{content.sectorLabel}</option>
                        {sectors.map((s, i) => (
                          <option key={i} value={s.sector}>{s.sector}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
               ) : (
                 <div className="form-group">
                   <label>{content.userIdLabel}</label>
                   <div className="input-wrapper">
                     <i className="bi bi-person"></i>
                     <input
                       type="text"
                       name="email_or_phone"
                       value={formData.email_or_phone}
                       onChange={handleChange}
                       placeholder={content.userIdPlaceholder}
                       readOnly={['director'].includes(formData.role)}
                     />
                   </div>
                 </div>
               )}

              <div className="form-group">
                <label>{content.passwordLabel}</label>
                <div className="input-wrapper">
                  <i className="bi bi-lock"></i>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder={content.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'}></i>
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" />
                  <span>{content.rememberMe}</span>
                </label>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    {content.signingIn}
                  </>
                ) : (
                  content.signIn
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>{content.needAccess}<Link to="/contact">{content.contactAdmin}</Link></p>
            </div>
          </div>
        </div>

      
      </div>

      {showResetPasswordModal && (
        <ResetPasswordModal
          isOpen={showResetPasswordModal}
          onClose={() => setShowResetPasswordModal(false)}
          username={resetPasswordUsername}
          role={resetPasswordRole}
          onPasswordResetSuccess={handlePasswordResetSuccess}
          content={content.resetPassword}
        />
      )}
    </div>
  );
};

export default Login;