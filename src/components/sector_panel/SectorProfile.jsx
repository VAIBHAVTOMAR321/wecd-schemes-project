import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Button, Form } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/dashboard.css";
import SectorHeader from "./SectorHeader";
import SectorLeftNav from "./SectorLeftNav";

const SectorProfile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { user, api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: "",
    color: "",
    checks: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false
    }
  });
  const [profileData, setProfileData] = useState({
    district: "",
    projectCode: "",
    projectName: "",
    sector: "",
    sectorIncharge: "",
    inchargeMob: ""
  });
  const [errors, setErrors] = useState({
    sectorIncharge: "",
    inchargeMob: "",
    password: "",
    confirmPassword: ""
  });
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!api) return;
    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        const response = await api.get("/sector-profile/");
        if (response.data?.success) {
          const data = response.data.data || {};
          setProfileData({
            district: data.district || "",
            projectCode: data.project_code || "",
            projectName: data.project_name || "",
            sector: data.sector || "",
            sectorIncharge: data.sector_incharge || "",
            inchargeMob: data.incharge_mob || ""
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
        setProfileMessage({ text: "प्रोफ़ाइल डेटा प्राप्त करने में विफल", type: "error" });
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfileData();
  }, [api]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    let label = "";
    let color = "";

    if (password.length === 0) {
      label = "";
      color = "";
    } else if (score <= 2) {
      label = "कमज़ोर";
      color = "#ef4444";
    } else if (score === 3) {
      label = "मध्यम";
      color = "#f59e0b";
    } else if (score === 4) {
      label = "मजबूत";
      color = "#3b82f6";
    } else if (score === 5) {
      label = "बहुत मजबूत";
      color = "#22c55e";
    }

    setPasswordStrength({ score, label, color, checks });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;

    if (name === "inchargeMob") {
      // Allow only numbers and max 10 digits
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 10);
      setProfileData(prev => ({ ...prev, [name]: numericValue }));
      
      // Validate mobile number
      if (numericValue.length > 0 && numericValue.length !== 10) {
        setErrors(prev => ({ ...prev, inchargeMob: "मोबाइल नंबर 10 अंकों का होना चाहिए" }));
      } else if (numericValue.length === 10) {
        // Check if starts with valid Indian mobile prefix (6,7,8,9)
        if (!/^[6-9]/.test(numericValue)) {
          setErrors(prev => ({ ...prev, inchargeMob: "मोबाइल नंबर 6,7,8,9 से शुरू होना चाहिए" }));
        } else {
          setErrors(prev => ({ ...prev, inchargeMob: "" }));
        }
      } else {
        setErrors(prev => ({ ...prev, inchargeMob: "" }));
      }
    } else if (name === "sectorIncharge") {
      // Block special characters like {7} and other special symbols
      // Allow only letters (Hindi + English), spaces, dots, and hyphens
      const blockedPattern = /[\{\}\[\]\\\/\^~`@#$%&*!+=|<>?;:_0-9]/;
      if (blockedPattern.test(value)) {
        setErrors(prev => ({ ...prev, sectorIncharge: "विशेष वर्ण और संख्याएँ अनुमत नहीं हैं" }));
        return;
      }
      setProfileData(prev => ({ ...prev, [name]: value }));
      
      // Validate name - minimum 2 characters
      if (value.length > 0 && value.length < 2) {
        setErrors(prev => ({ ...prev, sectorIncharge: "नाम कम से कम 2 अक्षरों का होना चाहिए" }));
      } else if (value.length >= 2) {
        setErrors(prev => ({ ...prev, sectorIncharge: "" }));
      } else {
        setErrors(prev => ({ ...prev, sectorIncharge: "" }));
      }
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if (name === "password") {
      // Block spaces in password
      if (/\s/.test(value)) {
        setErrors(prev => ({ ...prev, password: "पासवर्ड में रिक्त स्थान की अनुमति नहीं है" }));
        return;
      }
      
      checkPasswordStrength(value);
      
      if (value.length > 0 && value.length < 8) {
        setErrors(prev => ({ ...prev, password: "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए" }));
      } else if (value.length >= 8) {
        setErrors(prev => ({ ...prev, password: "" }));
      } else {
        setErrors(prev => ({ ...prev, password: "" }));
      }

      // Check if confirm password matches
      if (passwordData.confirmPassword && value !== passwordData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: "पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते" }));
      } else if (passwordData.confirmPassword && value === passwordData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }

    if (name === "confirmPassword") {
      // Block spaces in confirm password
      if (/\s/.test(value)) {
        setErrors(prev => ({ ...prev, confirmPassword: "पासवर्ड में रिक्त स्थान की अनुमति नहीं है" }));
        return;
      }

      if (value.length > 0 && value !== passwordData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: "पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते" }));
      } else if (value.length > 0 && value === passwordData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: "" }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const validateProfileForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // Validate Sector Incharge
    if (!profileData.sectorIncharge.trim()) {
      newErrors.sectorIncharge = "सेक्टर इनचार्ज का नाम आवश्यक है";
      isValid = false;
    } else if (profileData.sectorIncharge.trim().length < 2) {
      newErrors.sectorIncharge = "नाम कम से कम 2 अक्षरों का होना चाहिए";
      isValid = false;
    } else {
      const blockedPattern = /[\{\}\[\]\\\/\^~`@#$%&*!+=|<>?;:_0-9]/;
      if (blockedPattern.test(profileData.sectorIncharge)) {
        newErrors.sectorIncharge = "विशेष वर्ण और संख्याएँ अनुमत नहीं हैं";
        isValid = false;
      } else {
        newErrors.sectorIncharge = "";
      }
    }

    // Validate Mobile Number
    if (!profileData.inchargeMob) {
      newErrors.inchargeMob = "मोबाइल नंबर आवश्यक है";
      isValid = false;
    } else if (profileData.inchargeMob.length !== 10) {
      newErrors.inchargeMob = "मोबाइल नंबर 10 अंकों का होना चाहिए";
      isValid = false;
    } else if (!/^[6-9]/.test(profileData.inchargeMob)) {
      newErrors.inchargeMob = "मोबाइल नंबर 6,7,8,9 से शुरू होना चाहिए";
      isValid = false;
    } else {
      newErrors.inchargeMob = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  const validatePasswordForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    if (!passwordData.password) {
      newErrors.password = "कृपया नया पासवर्ड दर्ज करें";
      isValid = false;
    } else if (passwordData.password.length < 8) {
      newErrors.password = "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए";
      isValid = false;
    } else if (!/[A-Z]/.test(passwordData.password)) {
      newErrors.password = "पासवर्ड में कम से कम एक बड़ा अक्षर (A-Z) होना चाहिए";
      isValid = false;
    } else if (!/[a-z]/.test(passwordData.password)) {
      newErrors.password = "पासवर्ड में कम से कम एक छोटा अक्षर (a-z) होना चाहिए";
      isValid = false;
    } else if (!/[0-9]/.test(passwordData.password)) {
      newErrors.password = "पासवर्ड में कम से कम एक संख्या (0-9) होनी चाहिए";
      isValid = false;
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(passwordData.password)) {
      newErrors.password = "पासवर्ड में कम से कम एक विशेष वर्ण (!@#$%...) होना चाहिए";
      isValid = false;
    } else if (/\s/.test(passwordData.password)) {
      newErrors.password = "पासवर्ड में रिक्त स्थान की अनुमति नहीं है";
      isValid = false;
    } else {
      newErrors.password = "";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "कृपया पुष्टि पासवर्ड दर्ज करें";
      isValid = false;
    } else if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते";
      isValid = false;
    } else {
      newErrors.confirmPassword = "";
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: "", type: "" });

    if (!validateProfileForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        district: profileData.district,
        project_code: profileData.projectCode,
        project_name: profileData.projectName,
        sector: profileData.sector,
        sector_incharge: profileData.sectorIncharge.trim(),
        incharge_mob: profileData.inchargeMob
      };
      const response = await api.put("/sector-profile/", payload);
      if (response.status === 200) {
        setProfileMessage({ text: "प्रोफ़ाइल सफलतापूर्वक अपडेट किया गया", type: "success" });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "प्रोफ़ाइल अपडेट करने में विफल";
      setProfileMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!validatePasswordForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        password: passwordData.password
      };
      const response = await api.put("/sector-profile/", payload);
      if (response.status === 200) {
        setMessage({ text: "पासवर्ड सफलतापूर्वक बदल दिया गया", type: "success" });
        setPasswordData({ password: "", confirmPassword: "" });
        setPasswordStrength({
          score: 0,
          label: "",
          color: "",
          checks: {
            length: false,
            uppercase: false,
            lowercase: false,
            number: false,
            special: false
          }
        });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "पासवर्ड बदलने में विफल";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordStrengthBar = () => {
    if (passwordData.password.length === 0) return null;

    const strengthPercent = (passwordStrength.score / 5) * 100;

    return (
      <div className="mt-2">
        <div 
          className="password-strength-bar" 
          style={{ 
            height: '4px', 
            backgroundColor: '#e5e7eb', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{ 
              width: `${strengthPercent}%`, 
              height: '100%', 
              backgroundColor: passwordStrength.color,
              transition: 'all 0.3s ease',
              borderRadius: '2px'
            }}
          />
        </div>
        <div className="d-flex justify-content-between align-items-center mt-1">
          <small style={{ fontSize: '10px', color: passwordStrength.color, fontWeight: '600' }}>
            {passwordStrength.label}
          </small>
        </div>
        <div className="mt-1" style={{ fontSize: '10px' }}>
          <div className={`d-flex align-items-center mb-1 ${passwordStrength.checks.length ? 'text-success' : 'text-muted'}`}>
            <i className={`bi ${passwordStrength.checks.length ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} style={{ fontSize: '10px' }}></i>
            कम से कम 8 अक्षर
          </div>
          <div className={`d-flex align-items-center mb-1 ${passwordStrength.checks.uppercase ? 'text-success' : 'text-muted'}`}>
            <i className={`bi ${passwordStrength.checks.uppercase ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} style={{ fontSize: '10px' }}></i>
            एक बड़ा अक्षर (A-Z)
          </div>
          <div className={`d-flex align-items-center mb-1 ${passwordStrength.checks.lowercase ? 'text-success' : 'text-muted'}`}>
            <i className={`bi ${passwordStrength.checks.lowercase ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} style={{ fontSize: '10px' }}></i>
            एक छोटा अक्षर (a-z)
          </div>
          <div className={`d-flex align-items-center mb-1 ${passwordStrength.checks.number ? 'text-success' : 'text-muted'}`}>
            <i className={`bi ${passwordStrength.checks.number ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} style={{ fontSize: '10px' }}></i>
            एक संख्या (0-9)
          </div>
          <div className={`d-flex align-items-center ${passwordStrength.checks.special ? 'text-success' : 'text-muted'}`}>
            <i className={`bi ${passwordStrength.checks.special ? 'bi-check-circle-fill' : 'bi-circle'} me-1`} style={{ fontSize: '10px' }}></i>
            एक विशेष वर्ण (!@#$%...)
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <SectorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <SectorHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="fw-bold text-uppercase mb-0" style={{ color: "#60a5fa", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
              सेक्टर प्रोफ़ाइल
            </h3>
            <h5 className="fw-bold text-uppercase mb-0" style={{ color: "#93c5fd", fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}>
              व्यक्तिगत जानकारी
            </h5>
          </div>

          {message.text && (
            <div className={`alert-message ${message.type === "success" ? "success" : "error"} mb-3`} style={{ fontSize: '11px' }}>
              <i className={`bi ${message.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"}`}></i>
              {message.text}
            </div>
          )}

          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="py-2" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  <h6 className="mb-0 fw-bold"><i className="bi bi-person-circle me-2"></i>उपयोगकर्ता की जानकारी</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  {profileLoading ? (
                    <div className="text-center py-4">
                      <Spinner animation="border" size="sm" className="me-2" /> प्रोफ़ाइल लोड हो रहा है...
                    </div>
                  ) : (
                    <Form onSubmit={handleUpdateProfile} noValidate>
                      <Row className="g-3">
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>District</Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="district"
                              value={profileData.district}
                              onChange={handleProfileChange}
                              placeholder="जिला दर्ज करें"
                              className="border-2"
                              disabled
                              style={{ fontSize: '12px' }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Sector</Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="sector"
                              value={profileData.sector}
                              onChange={handleProfileChange}
                              placeholder="सेक्टर दर्ज करें"
                              className="border-2"
                              disabled
                              style={{ fontSize: '12px' }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Project Name</Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="projectName"
                              value={profileData.projectName}
                              onChange={handleProfileChange}
                              placeholder="प्रोजेक्ट नाम दर्ज करें"
                              className="border-2"
                              disabled
                              style={{ fontSize: '12px' }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Project Code</Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="projectCode"
                              value={profileData.projectCode}
                              onChange={handleProfileChange}
                              placeholder="प्रोजेक्ट कोड दर्ज करें"
                              className="border-2"
                              disabled
                              style={{ fontSize: '12px' }}
                            />
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>
                              Sector Incharge <span style={{ color: '#ef4444' }}>*</span>
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="sectorIncharge"
                              value={profileData.sectorIncharge}
                              onChange={handleProfileChange}
                              placeholder="सेक्टर इनचार्ज दर्ज करें"
                              className={`border-2 ${errors.sectorIncharge ? 'is-invalid' : ''}`}
                              style={{ fontSize: '12px' }}
                              maxLength={100}
                            />
                            {errors.sectorIncharge && (
                              <div className="invalid-feedback d-flex align-items-center" style={{ fontSize: '10px' }}>
                                <i className="bi bi-exclamation-circle me-1"></i>
                                {errors.sectorIncharge}
                              </div>
                            )}
                            <small style={{ fontSize: '9px', color: '#9ca3af' }}>
                              केवल अक्षर और रिक्त स्थान अनुमत हैं
                            </small>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>
                              Incharge Mobile <span style={{ color: '#ef4444' }}>*</span>
                            </Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name="inchargeMob"
                              value={profileData.inchargeMob}
                              onChange={handleProfileChange}
                              placeholder="मोबाइल नंबर दर्ज करें"
                              className={`border-2 ${errors.inchargeMob ? 'is-invalid' : ''}`}
                              style={{ fontSize: '12px' }}
                              maxLength={10}
                              inputMode="numeric"
                            />
                            {errors.inchargeMob && (
                              <div className="invalid-feedback d-flex align-items-center" style={{ fontSize: '10px' }}>
                                <i className="bi bi-exclamation-circle me-1"></i>
                                {errors.inchargeMob}
                              </div>
                            )}
                            <small style={{ fontSize: '9px', color: '#9ca3af' }}>
                              केवल 10 अंकों का मोबाइल नंबर (6,7,8,9 से शुरू)
                            </small>
                          </Form.Group>
                        </Col>
                      </Row>
                      {profileMessage.text && (
                        <div className={`alert-message ${profileMessage.type === "success" ? "success" : "error"}`} style={{ marginTop: '15px' }}>
                          <i className={`bi ${profileMessage.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"}`}></i>
                          {profileMessage.text}
                        </div>
                      )}
                      <div className="text-center mt-4">
                        <Button
                          type="submit"
                          variant="light"
                          className="px-4 py-1 fw-bold shadow-sm text-white"
                          style={{ fontSize: '13px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }}
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              अपडेट हो रहा है...
                            </>
                          ) : (
                            "प्रोफ़ाइल अपडेट करें"
                          )}
                        </Button>
                      </div>
                    </Form>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="py-2" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  <h6 className="mb-0 fw-bold"><i className="bi bi-key me-2"></i>पासवर्ड बदलें</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="alert-message warning mb-3" style={{ fontSize: '11px' }}>
                    <i className="bi bi-exclamation-triangle"></i>
                    कृपया अपना डिफ़ॉल्ट पासवर्ड अनिवार्य रूप से परिवर्तित कर नवीन पासवर्ड निर्धारित करें तथा उक्त पासवर्ड को भविष्य में उपयोग हेतु सुरक्षित स्थान पर अंकित/संरक्षित रखना सुनिश्चित करें।
                  </div>
                  <Form onSubmit={handleChangePassword} noValidate>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>
                            Password <span style={{ color: '#ef4444' }}>*</span>
                          </Form.Label>
                          <div className="input-wrapper">
                            <Form.Control
                              size="sm"
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={passwordData.password}
                              onChange={handlePasswordChange}
                              placeholder="कृपया नया पासवर्ड दर्ज करें"
                              className={`border-2 ${errors.password ? 'is-invalid' : ''}`}
                              style={{ fontSize: '12px' }}
                              autoComplete="new-password"
                            />
                            <Button
                              type="button"
                              variant="link"
                              className="password-toggle p-0"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </Button>
                          </div>
                          {errors.password && (
                            <div className="invalid-feedback d-flex align-items-center" style={{ fontSize: '10px' }}>
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {errors.password}
                            </div>
                          )}
                          {renderPasswordStrengthBar()}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>
                            Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                          </Form.Label>
                          <div className="input-wrapper">
                            <Form.Control
                              size="sm"
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="पुष्टि पासवर्ड दर्ज करें"
                              className={`border-2 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                              style={{ fontSize: '12px' }}
                              autoComplete="new-password"
                            />
                            <Button
                              type="button"
                              variant="link"
                              className="password-toggle p-0"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              <i className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                            </Button>
                          </div>
                          {errors.confirmPassword && (
                            <div className="invalid-feedback d-flex align-items-center" style={{ fontSize: '10px' }}>
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {errors.confirmPassword}
                            </div>
                          )}
                          {passwordData.confirmPassword && !errors.confirmPassword && passwordData.password === passwordData.confirmPassword && (
                            <div className="d-flex align-items-center mt-1" style={{ fontSize: '10px', color: '#22c55e' }}>
                              <i className="bi bi-check-circle-fill me-1"></i>
                              पासवर्ड मेल खाता है
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="text-center mt-4">
                      <Button
                        type="submit"
                        variant="light"
                        className="px-4 py-1 fw-bold shadow-sm text-white"
                        style={{ fontSize: '13px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            बदल रहा है...
                          </>
                        ) : (
                          "पासवर्ड बदलें"
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default SectorProfile;