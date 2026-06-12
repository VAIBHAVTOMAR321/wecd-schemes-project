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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [profileData, setProfileData] = useState({
    district: "Almora",
    sector: "Badechina [01]",
    projectName: "Bhaisiyachana",
    projectCode: "Bhaisiyachana [0506401]",
    sectorInchargeName: "Dimple varma",
    mobile: ""
  });
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleMobileChange = (e) => {
    setProfileData(prev => ({ ...prev, mobile: e.target.value }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (!passwordData.password || !passwordData.confirmPassword) {
      setMessage({ text: "कृपया सभी फ़ील्ड भरें", type: "error" });
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setMessage({ text: "पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते", type: "error" });
      return;
    }

    if (passwordData.password.length < 6) {
      setMessage({ text: "पासवर्ड कम से कम 6 अक्षरों का होना चाहिए", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        new_password: passwordData.password,
        mobile: profileData.mobile
      };
      const response = await api.post('/change-password/', payload);
      if (response.status === 200) {
        setMessage({ text: "पासवर्ड सफलतापूर्वक बदल दिया गया", type: "success" });
        setPasswordData({ password: "", confirmPassword: "" });
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
                  <Row className="g-3">
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>District</Form.Label>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={profileData.district}
                          readOnly
                          className="border-0 bg-light"
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
                          value={profileData.sector}
                          readOnly
                          className="border-0 bg-light"
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
                          value={profileData.projectName}
                          readOnly
                          className="border-0 bg-light"
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
                          value={profileData.projectCode}
                          readOnly
                          className="border-0 bg-light"
                          style={{ fontSize: '12px' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Sector Incharge Name</Form.Label>
                        <Form.Control
                          size="sm"
                          type="text"
                          value={profileData.sectorInchargeName}
                          readOnly
                          className="border-0 bg-light"
                          style={{ fontSize: '12px' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="py-2" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  <h6 className="mb-0 fw-bold"><i className="bi bi-key me-2"></i>पासवर्ड</h6>
                </Card.Header>
                <Card.Body className="p-3">
                  <div className="alert-message warning mb-3" style={{ fontSize: '11px' }}>
                    <i className="bi bi-exclamation-triangle"></i>
                    कृपया अपना डिफ़ॉल्ट पासवर्ड अनिवार्य रूप से परिवर्तित कर नवीन पासवर्ड निर्धारित करें तथा उक्त पासवर्ड को भविष्य में उपयोग हेतु सुरक्षित स्थान पर अंकित/संरक्षित रखना सुनिश्चित करें।
                  </div>
                  <Form onSubmit={handleChangePassword}>
                    <Row className="g-3">
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Password</Form.Label>
                          <div className="input-wrapper">
                            <Form.Control
                              size="sm"
                              type={showPassword ? 'text' : 'password'}
                              name="password"
                              value={passwordData.password}
                              onChange={handlePasswordChange}
                              placeholder="पासवर्ड दर्ज करें"
                              className="border-2"
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
                        </Form.Group>
                      </Col>
                      <Col md={4}>
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
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Mobile</Form.Label>
                          <Form.Control
                            size="sm"
                            type="text"
                            name="mobile"
                            value={profileData.mobile}
                            onChange={handleMobileChange}
                            placeholder="मोबाइल नंबर दर्ज करें"
                            className="border-2"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
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