import React, { useState, useEffect, useCallback } from "react";
import {
  Container, Row, Col, Card, Spinner, Table, Pagination,
  Form, Button, InputGroup,
} from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/awc.css";
import CDPOLeftNav from "./CDPOLeftNav";
import CDPOHeader from "./CDPOHeader";

const SECTOR_API_URL = "/cdpo-sector/";
const RESET_PASSWORD_API_URL = "/cdpo/reset-password/";

// ═══════════════════════════════════════════════════════════
//  PASSWORD VALIDATION CONSTANTS
// ═══════════════════════════════════════════════════════════
const PASSWORD_RULES = {
  minLength: 8,
  maxLength: 30,
  patterns: {
    uppercase: /[A-Z]/,
    lowercase: /[a-z]/,
    number: /[0-9]/,
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/,
  },
};

const PASSWORD_RULE_LABELS = [
  { key: "minLength", label: "कम से कम 8 अक्षर" },
  { key: "uppercase", label: "एक बड़ा अक्षर (A-Z)" },
  { key: "lowercase", label: "एक छोटा अक्षर" },
  { key: "number", label: "एक अंक (0-9)" },
  { key: "special", label: "एक विशेष अक्षर (!@#$%...)" },
];

/** Returns { score: 0-5, label, color, checks: { minLength, uppercase, lowercase, number, special } } */
const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "#94a3b8", checks: {} };

  const checks = {
    minLength: password.length >= PASSWORD_RULES.minLength,
    uppercase: PASSWORD_RULES.patterns.uppercase.test(password),
    lowercase: PASSWORD_RULES.patterns.lowercase.test(password),
    number: PASSWORD_RULES.patterns.number.test(password),
    special: PASSWORD_RULES.patterns.special.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 1) return { score, label: "बहुत कमजोर", color: "#ef4444", checks };
  if (score === 2) return { score, label: "कमजोर", color: "#f97316", checks };
  if (score === 3) return { score, label: "मध्यम", color: "#eab308", checks };
  if (score === 4) return { score, label: "मजबूत", color: "#22c55e", checks };
  return { score, label: "बहुत मजबूत", color: "#16a34a", checks };
};

// ═══════════════════════════════════════════════════════════
//  PASSWORD TOGGLE ICON COMPONENT
// ═══════════════════════════════════════════════════════════
const PasswordToggle = ({ visible, onClick, disabled }) => (
  <Button
    type="button"
    variant="link"
    onClick={onClick}
    disabled={disabled}
    tabIndex={-1}
    style={{
      color: "#64748b",
      textDecoration: "none",
      padding: "0 0.5rem",
      fontSize: "1rem",
      lineHeight: 1,
      cursor: disabled ? "not-allowed" : "pointer",
    }}
    aria-label={visible ? "पासवर्ड छुपाएं" : "पासवर्ड दिखाएं"}
  >
    {visible ? (
      /* Eye-slash icon (hide) */
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      </svg>
    ) : (
      /* Eye icon (show) */
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )}
  </Button>
);

// ═══════════════════════════════════════════════════════════
//  PASSWORD STRENGTH BAR COMPONENT
// ═══════════════════════════════════════════════════════════
const PasswordStrengthBar = ({ strength }) => {
  if (!strength || strength.score === 0) return null;

  return (
    <div style={{ marginTop: "6px" }}>
      {/* Strength bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          height: "4px",
          borderRadius: "2px",
          overflow: "hidden",
          background: "#e2e8f0",
        }}
      >
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            style={{
              flex: 1,
              background: level <= strength.score ? strength.color : "#e2e8f0",
              transition: "background 0.3s ease",
              borderRadius: "2px",
            }}
          />
        ))}
      </div>
      {/* Label */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "3px",
        }}
      >
        <small style={{ color: strength.color, fontWeight: 600, fontSize: "11px" }}>
          {strength.label}
        </small>
        <small style={{ color: "#94a3b8", fontSize: "10px" }}>
          {strength.score}/5
        </small>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
//  RULE CHECKLIST COMPONENT
// ═══════════════════════════════════════════════════════════
const RuleChecklist = ({ checks, visible }) => {
  if (!visible || !checks || Object.keys(checks).length === 0) return null;

  return (
    <ul
      style={{
        listStyle: "none",
        padding: 0,
        margin: "6px 0 0 0",
        display: "flex",
        flexWrap: "wrap",
        gap: "2px 12px",
      }}
    >
      {PASSWORD_RULE_LABELS.map(({ key, label }) => (
        <li
          key={key}
          style={{
            fontSize: "10px",
            color: checks[key] ? "#16a34a" : "#94a3b8",
            display: "flex",
            alignItems: "center",
            gap: "3px",
            transition: "color 0.2s ease",
          }}
        >
          <span style={{ fontSize: "12px", lineHeight: 1 }}>
            {checks[key] ? "✓" : "○"}
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
};

// ═══════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
const OURSector = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [apiError, setApiError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // ── Password visibility toggles ──
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Form-level password errors ──
  const [passwordErrors, setPasswordErrors] = useState({
    password: "",
    confirmPassword: "",
  });

  // ── Resize handler ──
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
      setIsMobile(mobile);
      setIsTablet(tablet);
      setSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Fetch sector data ──
  useEffect(() => {
    if (!api) return;
    const fetchSectorData = async () => {
      setLoading(true);
      setApiError("");
      try {
        const response = await api.get(SECTOR_API_URL);
        if (response.data?.success) {
          const data = response.data.data || [];
          setSectorData(data);
          setProjectName(
            response.data.project_name || response.data.project_code || ""
          );
        } else {
          throw new Error("CDPO sector API response was not successful");
        }
      } catch (err) {
        setApiError(
          err.response?.data?.error ||
            err.response?.data?.message ||
            err.message
        );
        console.error("Failed to fetch sector data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSectorData();
  }, [api]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sectorData]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // ── Sanitizers ──
  const sanitizeValue = (value) => {
    if (!value) return value;
    return value.replace(/<[^>]*>/g, "");
  };

  const cleanSectorIncharge = (value) => {
    if (!value) return value;
    const sanitized = sanitizeValue(value);
    return sanitized
      .replace(/[^a-zA-Z\s.\u0900-\u097F'-]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const cleanInchargeMob = (value) => {
    if (!value) return value;
    return sanitizeValue(value).replace(/\D/g, "").slice(0, 10);
  };

  // ── Validate password ──
  const validatePassword = useCallback((password, confirmPassword) => {
    const errors = { password: "", confirmPassword: "" };

    if (!password) {
      // If password is empty, no error — it's optional
      return errors;
    }

    const strength = getPasswordStrength(password);

    if (password.length < PASSWORD_RULES.minLength) {
      errors.password = `कम से कम ${PASSWORD_RULES.minLength} अक्षर चाहिए`;
    } else if (password.length > PASSWORD_RULES.maxLength) {
      errors.password = `अधिकतम ${PASSWORD_RULES.maxLength} अक्षर हो सकते हैं`;
    } else if (strength.score < 4) {
      errors.password = "पासवर्ड पर्याप्त मजबूत नहीं है। कृपया सभी नियम पूरे करें।";
    }

    // Confirm password check
    if (confirmPassword && password !== confirmPassword) {
      errors.confirmPassword = "पासवर्ड और कन्फर्म पासवर्ड मेल नहीं खा रहे";
    } else if (!confirmPassword && password) {
      errors.confirmPassword = "कृपया कन्फर्म पासवर्ड दर्ज करें";
    }

    return errors;
  }, []);

  // ── Handle edit click ──
  const handleEdit = (row) => {
    setEditingId(row.id);
    setEditForm({
      ...row,
      password: "",
      confirmPassword: "",
      sector_incharge: cleanSectorIncharge(row.sector_incharge),
      incharge_mob: cleanInchargeMob(row.incharge_mob),
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordErrors({ password: "", confirmPassword: "" });
  };

  // ── Handle form change with live password validation ──
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setEditForm((prev) => {
      if (!prev) return null;

      let cleanedValue = value;
      if (name === "sector_incharge") cleanedValue = cleanSectorIncharge(value);
      else if (name === "incharge_mob") cleanedValue = cleanInchargeMob(value);
      // password and confirmPassword: use raw value (no cleaning)

      const updated = { ...prev, [name]: cleanedValue };

      // Live password validation whenever password fields change
      if (name === "password" || name === "confirmPassword") {
        const pw = name === "password" ? cleanedValue : updated.password;
        const cpw = name === "confirmPassword" ? cleanedValue : updated.confirmPassword;
        const errors = validatePassword(pw, cpw);
        setPasswordErrors(errors);
      }

      return updated;
    });
  };

  // ── Handle save with final validation ──
  const handleSave = async () => {
    if (!editForm || !api) return;

    // Final password validation
    const { password, confirmPassword } = editForm;
    const errors = validatePassword(password, confirmPassword);
    setPasswordErrors(errors);

    // If password was entered but has errors, stop
    if (password && (errors.password || errors.confirmPassword)) {
      return;
    }

    // If only confirm is missing but password exists, stop
    if (password && !confirmPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        confirmPassword: "कृपया कन्फर्म पासवर्ड दर्ज करें",
      }));
      return;
    }

    setSaving(true);
    setApiError("");
    try {
      const payload = {
        id: editForm.id,
        sector_incharge: editForm.sector_incharge || "",
        incharge_mob: editForm.incharge_mob || "",
        password: editForm.password || "",
      };
      const response = await api.put(SECTOR_API_URL, payload);
      if (response.data?.success) {
        const responseData = response.data.data;
        if (Array.isArray(responseData)) {
          setSectorData(responseData);
        } else if (responseData && responseData.id) {
          setSectorData((prev) =>
            prev.map((item) =>
              item.id === responseData.id
                ? { ...item, ...responseData }
                : item
            )
          );
        }
        setEditingId(null);
        setEditForm(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
        setPasswordErrors({ password: "", confirmPassword: "" });
      } else {
        throw new Error("CDPO sector update response was not successful");
      }
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message
      );
      console.error("Failed to update sector data:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Handle cancel edit ──
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordErrors({ password: "", confirmPassword: "" });
  };

  // ── Handle reset password ──
  const handleResetPassword = async (username) => {
    if (!username) return;
    const confirmed = window.confirm(
      `क्या आप सच में "${username}" का पासवर्ड रिसेट करना चाहते हैं?`
    );
    if (!confirmed) return;

    setSaving(true);
    setApiError("");
    try {
      const payload = { username };
      const response = await api.put(RESET_PASSWORD_API_URL, payload);
      if (response.status === 200 || response.data?.success) {
        alert(
          `सेक्टर "${username}" का पासवर्ड सफलतापूर्वक रिसेट कर दिया गया है।`
        );
      } else {
        throw new Error("पासवर्ड रिसेट करने में विफल");
      }
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message
      );
      console.error("Failed to reset password:", err);
    } finally {
      setSaving(false);
    }
  };

  // ── Pagination ──
  const totalPages = Math.ceil(sectorData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sectorData.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  // ── Derived values for edit form ──
  const passwordStrength = editForm
    ? getPasswordStrength(editForm.password)
    : null;

  const isPasswordValid =
    editForm?.password &&
    passwordStrength &&
    passwordStrength.score >= 4 &&
    !passwordErrors.password;

  const isConfirmValid =
    editForm?.confirmPassword &&
    editForm.password === editForm.confirmPassword &&
    !passwordErrors.confirmPassword;

  // ═══════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════
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
          {/* ── Heading ── */}
          <div className="d-flex justify-content-between align-items-center awc-heading mb-4">
            <h3
              className="fw-bold text-uppercase mb-0"
              style={{
                color: "#60a5fa",
                fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
              }}
            >
              CDPO सेक्टर सूची
            </h3>
            <h5
              className="fw-bold text-uppercase mb-0"
              style={{
                color: "#93c5fd",
                fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
              }}
            >
              प्रोजेक्ट : {projectName || "Bhaisiyachana"}
            </h5>
          </div>

          {apiError && (
            <div className="alert alert-warning mb-3" role="alert">
              CDPO sector API error: {apiError}
            </div>
          )}

          <Row>
            <Col lg={12}>
              {/* ════════════ TABLE CARD ════════════ */}
              <Card className="border-0 shadow-sm">
                <Card.Header
                  className="bg-white border-0 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2"
                >
                  <h6 className="fw-bold mb-0" style={{ color: "#60a5fa" }}>
                    <i className="bi bi-grid-3x3-gap-fill me-2"></i>
                    सेक्टर सूची
                  </h6>
                  <span className="small fw-bold text-muted">
                    कुल सेक्टर : {sectorData.length}
                  </span>
                </Card.Header>

                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table
                      bordered
                      hover
                      className="mb-0 text-center align-middle"
                      style={{
                        tableLayout: "fixed",
                        fontSize: "11px",
                      }}
                    >
                      <thead className="bg-light text-uppercase">
                        <tr>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>
                            क्रमांक
                          </th>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>
                            जिला
                          </th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>
                            प्रोजेक्ट
                          </th>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>
                            सेक्टर
                          </th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>
                            इनचार्ज
                          </th>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>
                            मोबाइल
                          </th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>
                            अपडेटेड
                          </th>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>
                            एक्शन
                          </th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>
                            पासवर्ड रिसेट
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="9" className="py-4 text-center">
                              <Spinner
                                animation="border"
                                size="sm"
                                className="me-2"
                              />{" "}
                              डेटा लोड हो रहा है...
                            </td>
                          </tr>
                        ) : paginatedData.length > 0 ? (
                          paginatedData.map((row, index) => (
                            <tr key={row.id || index}>
                              <td className="py-2">
                                {startIndex + index + 1}
                              </td>
                              <td>{row.district}</td>
                              <td>{row.project_name}</td>
                              <td>{row.sector}</td>
                              <td>{row.sector_incharge}</td>
                              <td>{row.incharge_mob}</td>
                              <td>{row.updated_on}</td>
                              <td>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handleEdit(row)}
                                >
                                  एडिट
                                </Button>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() =>
                                    handleResetPassword(row.sector)
                                  }
                                  disabled={saving}
                                >
                                  रिसेट
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="9"
                              className="py-4 text-muted small"
                            >
                              कोई सेक्टर डेटा नहीं मिला
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

              {/* ════════════ EDIT FORM CARD ════════════ */}
              {editForm && editingId !== null && (
                <Card className="border-0 shadow-sm mt-3">
                  <Card.Header className="bg-white border-0 py-3">
                    <h6 className="fw-bold mb-0" style={{ color: "#60a5fa" }}>
                      सेक्टर अपडेट करें
                    </h6>
                  </Card.Header>
                  <Card.Body>
                    <Row className="g-3">
                      {/* ── Read-only fields ── */}
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>ID</Form.Label>
                          <Form.Control
                            name="id"
                            value={editForm.id || ""}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>SD Name</Form.Label>
                          <Form.Control
                            name="sdname"
                            value={editForm.sdname || ""}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>District</Form.Label>
                          <Form.Control
                            name="district"
                            value={editForm.district || ""}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Project Code</Form.Label>
                          <Form.Control
                            name="project_code"
                            value={editForm.project_code || ""}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Project Name</Form.Label>
                          <Form.Control
                            name="project_name"
                            value={editForm.project_name || ""}
                            disabled
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Sector</Form.Label>
                          <Form.Control
                            name="sector"
                            value={editForm.sector || ""}
                            disabled
                          />
                        </Form.Group>
                      </Col>

                      {/* ── Editable fields ── */}
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Sector Incharge</Form.Label>
                          <Form.Control
                            name="sector_incharge"
                            value={editForm.sector_incharge || ""}
                            onChange={handleFormChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group>
                          <Form.Label>Incharge Mobile</Form.Label>
                          <Form.Control
                            name="incharge_mob"
                            value={editForm.incharge_mob || ""}
                            onChange={handleFormChange}
                          />
                        </Form.Group>
                      </Col>

                      {/* ════════════════════════════════════
                          PASSWORD FIELD with toggle + strength
                          ════════════════════════════════════ */}
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>
                            नया पासवर्ड{" "}
                            <span
                              style={{
                                color: "#94a3b8",
                                fontWeight: 400,
                                fontSize: "10px",
                              }}
                            >
                              (वैकल्पिक — खाली छोड़ने पर पुराना रहेगा)
                            </span>
                          </Form.Label>
                          <InputGroup size="sm">
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={editForm.password || ""}
                              onChange={handleFormChange}
                              placeholder="नया पासवर्ड दर्ज करें"
                              maxLength={PASSWORD_RULES.maxLength}
                              isInvalid={!!passwordErrors.password}
                              style={{
                                borderColor:
                                  editForm.password && !passwordErrors.password
                                    ? isPasswordValid
                                      ? "#22c55e"
                                      : undefined
                                    : undefined,
                              }}
                              autoComplete="new-password"
                            />
                            <PasswordToggle
                              visible={showPassword}
                              onClick={() => setShowPassword((v) => !v)}
                            />
                          </InputGroup>

                          {/* Password error message */}
                          {passwordErrors.password && (
                            <div
                              style={{
                                color: "#ef4444",
                                fontSize: "11px",
                                marginTop: "4px",
                              }}
                            >
                              ⚠ {passwordErrors.password}
                            </div>
                          )}

                          {/* Strength bar */}
                          <PasswordStrengthBar strength={passwordStrength} />

                          {/* Rule checklist — show only when typing */}
                          <RuleChecklist
                            checks={passwordStrength?.checks}
                            visible={!!editForm.password}
                          />
                        </Form.Group>
                      </Col>

                      {/* ════════════════════════════════════
                          CONFIRM PASSWORD FIELD with toggle
                          ════════════════════════════════════ */}
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>
                            कन्फर्म पासवर्ड
                            {editForm.password && (
                              <span
                                style={{
                                  color: "#94a3b8",
                                  fontWeight: 400,
                                  fontSize: "10px",
                                  marginLeft: "4px",
                                }}
                              >
                                *
                              </span>
                            )}
                          </Form.Label>
                          <InputGroup size="sm">
                            <Form.Control
                              type={
                                showConfirmPassword ? "text" : "password"
                              }
                              name="confirmPassword"
                              value={editForm.confirmPassword || ""}
                              onChange={handleFormChange}
                              placeholder="पासवर्ड दोबारा दर्ज करें"
                              maxLength={PASSWORD_RULES.maxLength}
                              isInvalid={!!passwordErrors.confirmPassword}
                              disabled={!editForm.password}
                              style={{
                                borderColor:
                                  editForm.confirmPassword &&
                                  !passwordErrors.confirmPassword
                                    ? isConfirmValid
                                      ? "#22c55e"
                                      : undefined
                                    : undefined,
                                opacity: editForm.password ? 1 : 0.5,
                              }}
                              autoComplete="new-password"
                            />
                            <PasswordToggle
                              visible={showConfirmPassword}
                              onClick={() =>
                                setShowConfirmPassword((v) => !v)
                              }
                              disabled={!editForm.password}
                            />
                          </InputGroup>

                          {/* Confirm password error */}
                          {passwordErrors.confirmPassword && (
                            <div
                              style={{
                                color: "#ef4444",
                                fontSize: "11px",
                                marginTop: "4px",
                              }}
                            >
                              ⚠ {passwordErrors.confirmPassword}
                            </div>
                          )}

                          {/* Match indicator */}
                          {editForm.confirmPassword &&
                            editForm.password && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  marginTop: "4px",
                                  color:
                                    editForm.password ===
                                    editForm.confirmPassword
                                      ? "#16a34a"
                                      : "#ef4444",
                                  fontWeight: 500,
                                }}
                              >
                                {editForm.password ===
                                editForm.confirmPassword ? (
                                  <>
                                    <span>✓</span> पासवर्ड मेल खा रहे हैं
                                  </>
                                ) : (
                                  <>
                                    <span>✗</span> पासवर्ड मेल नहीं खा
                                    रहे
                                  </>
                                )}
                              </div>
                            )}
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* ── Action buttons ── */}
                    <div className="d-flex gap-2 justify-content-end mt-3">
                      <Button variant="secondary" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={
                          saving ||
                          (editForm.password &&
                            (passwordErrors.password ||
                              passwordErrors.confirmPassword ||
                              !editForm.confirmPassword))
                        }
                      >
                        {saving ? (
                          <>
                            <Spinner
                              animation="border"
                              size="sm"
                              className="me-1"
                            />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* ════════════ PAGINATION ════════════ */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 px-2">
                  <span className="text-muted small">
                    कुल सेक्टर : <strong>{sectorData.length}</strong> |
                    दिखा रहा है : {paginatedData.length}
                  </span>
                  <Pagination size="sm" className="mb-0">
                    <Pagination.Prev
                      disabled={currentPage === 1 || loading}
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                    />
                    {Array.from(
                      { length: totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <Pagination.Item
                        key={page}
                        active={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                        disabled={loading}
                      >
                        {page}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages || loading}
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(prev + 1, totalPages)
                        )
                      }
                    />
                  </Pagination>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default OURSector;