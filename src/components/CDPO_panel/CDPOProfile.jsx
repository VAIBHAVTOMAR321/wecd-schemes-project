import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Button, Form } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/dashboard.css";
import CDPOHeader from "./CDPOHeader";
import CDPOLeftNav from "./CDPOLeftNav";

const CDPOProfile = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [strengthMessage, setStrengthMessage] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [profileData, setProfileData] = useState({
    id: "",
    district: "",
    bill_use: "",
    project_code: "",
    project_name: "",
    project_show: "",
    stat_fin: "",
    ang_pur: "",
    adhar_stat: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  const [message, setMessage] = useState({ text: "", type: "" });

  const profileFields = [
  
    { label: "District", key: "district" },
    // { label: "Bill Use", key: "bill_use" },
    { label: "Project Code", key: "project_code" },
    { label: "Project Name", key: "project_name" },
    { label: "Project Show", key: "project_show" },
    { label: "Status", key: "stat_fin" },
    { label: "Anganwadi Purchase Year", key: "ang_pur" },
    { label: "Aadhar Status", key: "adhar_stat" },
  ];

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

    const fetchProfile = async () => {
      setProfileLoading(true);
      try {
        const response = await api.get("/cdpo/profile/");
        setProfileData(response.data?.data || {});
      } catch (err) {
        console.error("Failed to fetch CDPO profile:", err);
        setProfileData({});
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [api]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ text: "", type: "" });
    setProfileSaving(true);

    try {
      const payload = {
        id: profileData.id,
        district: profileData.district,
        bill_use: profileData.bill_use,
        project_code: profileData.project_code,
        project_name: profileData.project_name,
        project_show: profileData.project_show,
        stat_fin: profileData.stat_fin,
        ang_pur: profileData.ang_pur,
        adhar_stat: profileData.adhar_stat,
      };

      const response = await api.put("/cdpo/profile/", payload);
      if (response.status === 200) {
        setProfileMessage({ text: "प्रोफ़ाइल सफलतापूर्वक अपडेट कर दी गई", type: "success" });
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "प्रोफ़ाइल अपडेट करने में विफल";
      setProfileMessage({ text: errorMsg, type: "error" });
    } finally {
      setProfileSaving(false);
    }
  };

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;

    let strength = 0;

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    if (!/(.)\1{2,}/.test(password)) strength++;

    const normalizedStrength = Math.min(Math.floor((strength / 7) * 4), 4);
    return normalizedStrength;
  };

  const getStrengthLabel = (strength) => {
    switch (strength) {
      case 0: return "";
      case 1: return "बहुत कमजोर - कम से कम 8 अक्षरों का पासवर्ड उपयोग करें";
      case 2: return "कमजोर - अंक, विशेष वर्ण जोड़ें";
      case 3: return "मध्यम - अपने पासवर्ड को और अधिक जटिल बनाएं";
      case 4: return "मजबूत";
      default: return "";
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case 1: return "#dc2626";
      case 2: return "#f97316";
      case 3: return "#facc15";
      case 4: return "#16a34a";
      default: return "#e5e7eb";
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    
    if (!password) {
      return { isValid: false, errors: ["पासवर्ड आवश्यक है"] };
    }
    
    if (password.length < 8) {
      errors.push("कम से कम 8 अक्षरों का होना चाहिए");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("कम से कम एक बड़ा अक्षर (A-Z) होना चाहिए");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("कम से कम एक छोटा अक्षर (a-z) होना चाहिए");
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push("कम से कम एक अंक (0-9) होना चाहिए");
    }
    
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push("कम से कम एक विशेष वर्ण (!@#$%^&*) होना चाहिए");
    }
    
    if (/(.)\1{2,}/.test(password)) {
      errors.push("लगातार 3 या अधिक समान वर्ण नहीं हो सकते (जैसे aaa, 111)");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if (name === "password") {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
      setStrengthMessage(getStrengthLabel(strength));
      
      const validation = validatePassword(value);
      setPasswordErrors(validation.errors);
      setIsPasswordValid(validation.isValid);

      if (passwordData.confirmPassword && value !== passwordData.confirmPassword) {
        setConfirmPasswordError("पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते");
      } else if (passwordData.confirmPassword && value === passwordData.confirmPassword) {
        setConfirmPasswordError("");
      }
    } else if (name === "confirmPassword") {
      const validation = validatePassword(passwordData.password);
      setPasswordErrors(validation.errors);
      setIsPasswordValid(validation.isValid);

      if (value.length > 0 && value !== passwordData.password) {
        setConfirmPasswordError("पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते");
      } else if (value.length > 0 && value === passwordData.password) {
        setConfirmPasswordError("");
      } else {
        setConfirmPasswordError("");
      }
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!passwordData.password || !passwordData.confirmPassword) {
      setMessage({ text: "कृपया सभी फ़ील्ड भरें", type: "error" });
      return;
    }

    const validation = validatePassword(passwordData.password);
    if (!validation.isValid) {
      setMessage({ text: validation.errors[0], type: "error" });
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setMessage({ text: "पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        password: passwordData.password
      };
      const response = await api.put('/cdpo/profile/', payload);
      if (response.status === 200) {
        setMessage({ text: "पासवर्ड सफलतापूर्वक बदल दिया गया", type: "success" });
        setPasswordData({ password: "", confirmPassword: "" });
        setPasswordStrength(0);
        setStrengthMessage("");
        setPasswordErrors([]);
        setConfirmPasswordError("");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || "पासवर्ड बदलने में विफल";
      setMessage({ text: errorMsg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <CDPOLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <CDPOHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="text-center">
              
              <h5 className="fw-bold text-uppercase mb-0" style={{ color: "#93c5fd", fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}>व्यक्तिगत जानकारी</h5>
            </div>
          </div>

          <Row className="g-4">
            <Col lg={12}>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="py-2" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  <h6 className="mb-0 fw-bold"><i className="bi bi-info-circle me-2"></i>जानकारी</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <Form onSubmit={handleUpdateProfile}>
                    <Row className="g-3">
                      {profileFields.map((field) => (
                        <Col md={4} key={field.key}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>{field.label}</Form.Label>
                            <Form.Control
                              size="sm"
                              type="text"
                              name={field.key}
                              value={profileLoading ? "Loading..." : profileData[field.key] || ""}
                              onChange={handleProfileChange}
                              className="border-2"
                              style={{ fontSize: '12px' }}
                              disabled
                            />
                          </Form.Group>
                        </Col>
                      ))}
                    </Row>

                    {profileMessage.text && (
                      <div className={`alert-message ${profileMessage.type === "success" ? "success" : "error"}`} style={{ marginTop: '15px' }}>
                        <i className={`bi ${profileMessage.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"}`}></i>
                        {profileMessage.text}
                      </div>
                    )}

                    
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="py-2" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  <h6 className="mb-0 fw-bold"><i className="bi bi-key me-2"></i>पासवर्ड</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <Form onSubmit={handleChangePassword}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Password</Form.Label>
                          <div className="input-wrapper">
                              <Form.Control
                                size="sm"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={passwordData.password}
                                onChange={handlePasswordChange}
                                placeholder="कृपया नया पासवर्ड दर्ज करें"
                                className="border-2"
                                style={{ borderColor: passwordData.password ? getStrengthColor(passwordStrength) : undefined }}
                                minLength={8}
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
                          {passwordData.password && (
                            <div className="mt-2">
                              <div className="progress" style={{ height: '6px', backgroundColor: '#e5e7eb' }}>
                                <div
                                  className="progress-bar"
                                  role="progressbar"
                                  style={{
                                    width: `${(passwordStrength / 4) * 100}%`,
                                    backgroundColor: getStrengthColor(passwordStrength),
                                    transition: 'width 0.3s ease'
                                  }}
                                ></div>
                              </div>
                              <small className="text-muted" style={{ fontSize: '10px' }}>
                                {strengthMessage}
                              </small>
                              {passwordErrors.length > 0 && (
                                <div className="mt-1" style={{ fontSize: '10px' }}>
                                  {passwordErrors.map((error, index) => (
                                    <div key={index} style={{ color: '#dc2626' }}>
                                      <i className="bi bi-x-circle me-1"></i>
                                      {error}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Confirm Password</Form.Label>
                          <div className="input-wrapper">
                            <Form.Control
                              size="sm"
                              type={showConfirmPassword ? 'text' : 'password'}
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="पुष्टि पासवर्ड दर्ज करें"
                              className="border-2"
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
                          {confirmPasswordError && (
                            <div className="text-danger mt-1" style={{ fontSize: '10px' }}>
                              <i className="bi bi-exclamation-circle me-1"></i>
                              {confirmPasswordError}
                            </div>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                    <div className="alert alert-info py-2 px-3 mt-2" style={{ fontSize: '11px', backgroundColor: '#dbeafe', borderColor: '#93c5fd', color: '#1e40af' }}>
                      <i className="bi bi-info-circle me-1"></i>
                      पासवर्ड कम से कम 8 अक्षरों का होना चाहिए, उसमें बड़े और छोटे अक्षर, अंक और विशेष वर्ण होने चाहिए
                    </div>
                    {message.text && (
                      <div className={`alert-message ${message.type === "success" ? "success" : "error"}`} style={{ marginTop: '15px' }}>
                        <i className={`bi ${message.type === "success" ? "bi-check-circle" : "bi-exclamation-circle"}`}></i>
                        {message.text}
                      </div>
                    )}
                    <div className="text-center mt-4">
                      <Button
                        type="submit"
                        variant="light"
                        className="px-4 py-1 fw-bold shadow-sm text-white"
                        style={{ fontSize: '13px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }}
                        disabled={loading || !isPasswordValid}
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


export default CDPOProfile;