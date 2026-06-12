import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Badge, Form, InputGroup, FormControl, Alert, Modal } from "react-bootstrap";
import { FaPlus, FaListAlt, FaArrowLeft, FaCopy, FaFileExcel, FaFilePdf, FaEye, FaSearch, FaPencilAlt, FaTrashAlt, FaInfoCircle, FaSyncAlt, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../../../../assets/css/supervisorleftnav.css";
import CDPOLeftNav from "../../CDPOLeftNav";
import CDPOHeader from "../../CDPOHeader";
import { useAuth } from "../../../all_login/AuthContext";


const MahalaxmiYear = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [isYearSelected, setIsYearSelected] = useState(false);
  const [showDemandRegistration, setShowDemandRegistration] = useState(false);

  // State for Demand Registration Form
  const [beneficiaryCount, setBeneficiaryCount] = useState("");
  const [kitDemandCount, setKitDemandCount] = useState("");
  const [demandQuarter, setDemandQuarter] = useState("");
  const [demandLogData, setDemandLogData] = useState([]);
  const [kitSummaryData, setKitSummaryData] = useState([]);
  const [kitSummaryLoading, setKitSummaryLoading] = useState(true);
  const [kitSummaryError, setKitSummaryError] = useState(null);
  const [demandLoading, setDemandLoading] = useState(false);
  const [demandError, setDemandError] = useState(null);
  // State for Allotment (Prapt Kit)
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [allotmentFormData, setAllotmentFormData] = useState({ date: "", kits: "", quarter: "" });
  const [allotmentLogData, setAllotmentLogData] = useState([]);
  const [allotmentLoading, setAllotmentLoading] = useState(false);
  const [editingAllotmentId, setEditingAllotmentId] = useState(null);
  const [uniqueProjects, setUniqueProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("All");
  const [editingDemandId, setEditingDemandId] = useState(null);
  
  const { user, api, uniqueId } = useAuth();

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

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Fetch Mahalaxmi Demand Data
  const fetchDemandLogData = async () => {
    if (!selectedYear) return;
    setDemandLoading(true);
    setDemandError(null);
    try {
      const response = await api.get("/cdpo/mahalaxmi-demand/");
      
      let rawData = [];
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else {
        setDemandError("Failed to fetch demand data.");
        return;
      }

      // Filter data by selected year
      const filteredByYear = rawData.filter(
        (item) => item.fin_year === selectedYear
      );
      setDemandLogData(filteredByYear);

      // Extract unique project names for the filter
      const projects = [...new Set(filteredByYear.map(item => item.project))];
      setUniqueProjects(projects);
      setSelectedProject("All"); // Reset project filter when year changes
    } catch (err) {
      setDemandError("An error occurred while fetching demand data.");
      console.error(err);
    } finally {
      setDemandLoading(false);
    }
  };

  // Fetch Mahalaxmi Kit Summary Data
  const fetchKitSummaryData = async () => {
    if (!selectedYear) return;
    setKitSummaryLoading(true);
    setKitSummaryError(null);
    try {
      const response = await api.get("/cdpo/maha-kit-summary/");
      if (response.data.success && Array.isArray(response.data.data)) {
        const filteredByYear = response.data.data.filter(
          (item) => item.financial_year === selectedYear
        );
        setKitSummaryData(filteredByYear);
      } else {
        setKitSummaryError("Failed to fetch kit summary data.");
      }
    } catch (err) {
      setKitSummaryError("An error occurred while fetching kit summary data.");
      console.error(err);
    } finally {
      setKitSummaryLoading(false);
    }
  };

  // Effect to fetch kit summary when year is selected and not in demand registration view
  useEffect(() => {
    if (isYearSelected && !showDemandRegistration) {
      fetchKitSummaryData();
    }
  }, [isYearSelected, showDemandRegistration, selectedYear]);

  useEffect(() => {
    if (isYearSelected && showDemandRegistration) {
      fetchDemandLogData();
    }
  }, [isYearSelected, showDemandRegistration, selectedYear]); // Re-fetch when year or view changes

  const handleDemandSubmit = async (e) => {
    e.preventDefault();
    if (!beneficiaryCount || !kitDemandCount || !demandQuarter) {
      alert("Please fill all demand fields.");
      return;
    }

    const payload = {
      fin_year: selectedYear,
      bene: beneficiaryCount,
      req_kit: kitDemandCount,
      quarter: demandQuarter,
    };

    setDemandLoading(true);
    try {
      if (editingDemandId) {
        await api.put("/cdpo/mahalaxmi-demand/", { ...payload, id: editingDemandId });
        alert("Demand updated successfully!");
      } else {
        await api.post("/cdpo/mahalaxmi-demand/", payload);
        alert("Demand submitted successfully!");
      }
      resetDemandForm();
      fetchDemandLogData();
    } catch (err) {
      console.error("Error submitting demand:", err);
      alert("Failed to submit demand. Please try again.");
    } finally {
      setDemandLoading(false);
    }
  };

  const handleEditDemand = (item) => {
    setEditingDemandId(item.id);
    setBeneficiaryCount(item.bene);
    setKitDemandCount(item.req_kit);
    setDemandQuarter(item.quarter);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll to form
  };

  const handleDeleteDemand = async (id) => {
    if (!window.confirm("Are you sure you want to delete this demand record?")) {
      return;
    }
    setDemandLoading(true);
    try {
      await api.delete("/cdpo/mahalaxmi-demand/", { data: { id } });
      alert("Demand deleted successfully!");
      fetchDemandLogData();
    } catch (err) {
      console.error("Error deleting demand:", err);
      alert("Failed to delete demand. Please try again.");
    } finally {
      setDemandLoading(false);
    }
  };

  const resetDemandForm = () => {
    setEditingDemandId(null);
    setBeneficiaryCount("");
    setKitDemandCount("");
    setDemandQuarter("");
  };

  // Allotment (Prapt Kit) Handlers
  const fetchAllotmentLogData = async () => {
    setAllotmentLoading(true);
    try {
      const response = await api.get("/cdpo/maha-allotment/");
      let rawData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      // Filter by selected year (handling both YYYY-YYYY and YYYY-YY formats if present)
      const filtered = rawData.filter(item => 
        item.fin_year === selectedYear || item.fin_year === selectedYear.replace("-20", "-")
      );
      setAllotmentLogData(filtered);
    } catch (err) {
      console.error("Error fetching allotment log:", err);
    } finally {
      setAllotmentLoading(false);
    }
  };

  const handleAllotmentInputChange = (e) => {
    const { name, value } = e.target;
    setAllotmentFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAllotmentSubmit = async (e) => {
    e.preventDefault();
    setAllotmentLoading(true);
    const apiYear = selectedYear.replace("-20", "-");
    const payload = {
      ...allotmentFormData,
      fin_year: apiYear,
      kits: parseInt(allotmentFormData.kits)
    };

    try {
      if (editingAllotmentId) {
        await api.put("/cdpo/maha-allotment/", { ...payload, id: editingAllotmentId });
        alert("Allotment updated successfully!");
      } else {
        await api.post("/cdpo/maha-allotment/", payload);
        alert("Allotment submitted successfully!");
      }
      setShowAllotmentModal(false);
      setEditingAllotmentId(null);
      setAllotmentFormData({ date: "", kits: "", quarter: "" });
      if (showLogModal) fetchAllotmentLogData();
    } catch (err) {
      console.error("Submit allotment error:", err);
      alert("Failed to submit allotment.");
    } finally {
      setAllotmentLoading(false);
    }
  };

  const handleEditAllotment = (item) => {
    setEditingAllotmentId(item.id);
    setAllotmentFormData({
      date: item.date || "",
      kits: item.kits.toString(),
      quarter: item.quarter || ""
    });
    setShowLogModal(false);
    setShowAllotmentModal(true);
  };

  const handleDeleteAllotment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this allotment?")) return;
    try {
      await api.delete("/cdpo/maha-allotment/", { data: { id } });
      alert("Deleted successfully!");
      fetchAllotmentLogData();
    } catch (err) {
      console.error("Delete allotment error:", err);
      alert("Failed to delete.");
    }
  };

  // Filter demand log data by selected project
  const filteredDemandLogData = selectedProject === "All"
    ? demandLogData
    : demandLogData.filter(item => item.project === selectedProject);




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

        <Container fluid className="dashboard-box mt-3">
          {!isYearSelected ? (
            <Row className="justify-content-center py-5">
              <Col md={6} lg={4}>
                <Card className="shadow-sm border-0">
                  <Card.Body className="text-center p-4">
                    <h4 className="mb-4 fw-bold" style={{ color: "#1b4a8f" }}>वित्तीय वर्ष चुनें</h4>
                    <Form.Group className="mb-4 text-start">
                      <Form.Label className="small fw-bold text-muted text-uppercase">वित्तीय वर्ष (Financial Year)</Form.Label>
                      <Form.Select 
                        value={selectedYear} 
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="border-2"
                      >
                        <option value="">-- चयन करें --</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                        <option value="2027-2028">2027-2028</option>
                      </Form.Select>
                    </Form.Group>
                    <Button 
                      variant="primary" 
                      className="w-100 fw-bold py-2 shadow-sm" 
                      onClick={() => selectedYear && setIsYearSelected(true)}
                      disabled={!selectedYear}
                      style={{ backgroundColor: "#1b4a8f", borderColor: "#1b4a8f" }}
                    >
                      आगे बढ़ें
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          ) : (
            <>
              {!showDemandRegistration ? (
                <>
                <div className="main-heading">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="flex-grow-1">
                    <h3 className="mb-0 fw-bold text-center" style={{ color: "#343a40" }}>
                      महालक्ष्मी स्टॉक उपलब्धता {selectedYear}
                    </h3>
                    <h5 className="text-center mb-0" style={{ color: "#dc3545" }}>परियोजना वर्तमान शेष राशि</h5>
                  </div>
                  <Button size="sm" variant="outline-secondary" onClick={() => setIsYearSelected(false)}>वर्ष बदलें</Button>
                </div>
              </div>

              <Row className="justify-content-center mb-4">
            <Col xs={12} md={6} lg={4} className="text-center">
              <h6 className="fw-bold text-primary mb-2">उपलब्ध किट</h6>
              <Badge pill bg="warning" className="p-3 fs-3 fw-bold shadow-sm" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '15px', backgroundColor: '#ffc107 !important', color: '#343a40' }}>
                {kitSummaryData.reduce((sum, item) => sum + (parseInt(item.total_available_kits) || 0), 0)}
              </Badge>
            </Col>
          </Row>

          <Row className="mb-5 justify-content-center">
            <Col xs={12} md={10} lg={8}>
              <div className="d-flex flex-wrap justify-content-center gap-3">
                <Button 
                  variant="info" 
                  className="flex-grow-1 flex-md-grow-0 rounded-pill px-4 py-2 fw-bold shadow-sm" 
                  style={{ backgroundColor: '#17a2b8', borderColor: '#17a2b8', color: 'white' }}
                  onClick={() => { setShowDemandRegistration(true); fetchDemandLogData(); }}
                >
                  डिमांड किट
                </Button>
                <Button 
                  variant="success" 
                  className="flex-grow-1 flex-md-grow-0 rounded-pill px-4 py-2 fw-bold shadow-sm" 
                  style={{ backgroundColor: '#28a745', borderColor: '#28a745', color: 'white' }}
                  onClick={() => { setEditingAllotmentId(null); setAllotmentFormData({date: "", kits: "", quarter: ""}); setShowAllotmentModal(true); }}
                >
                  <FaPlus className="me-2" /> + प्राप्त किट प्रविष्टि
                </Button>
                <Button 
                  variant="success" 
                  className="flex-grow-1 flex-md-grow-0 rounded-pill px-4 py-2 fw-bold shadow-sm" 
                  style={{ backgroundColor: '#20c997', borderColor: '#20c997', color: 'white' }}
                  onClick={() => { fetchAllotmentLogData(); setShowLogModal(true); }} // Open log modal
                >
                  <FaListAlt className="me-2" /> प्राप्त लॉग
                </Button>
                <Button variant="danger" className="flex-grow-1 flex-md-grow-0 rounded-pill px-4 py-2 fw-bold shadow-sm" style={{ backgroundColor: '#dc3545', borderColor: '#dc3545', color: 'white' }}>
                  <FaListAlt className="me-2" /> वितरित लॉग
                </Button>
              </div>
            </Col>
          </Row>

          <div className="table-responsive shadow-sm rounded border bg-white">
            <Table hover bordered className="align-middle text-center mb-0" style={{ fontSize: '11px' }}>
              <thead className="table-light">
                <tr>
                  <th rowSpan="2">S.no</th>
                  <th rowSpan="2">ज़िला</th>
                  <th rowSpan="2">परियोजना</th>
                  <th rowSpan="2">तिमाही ({selectedYear})</th>
                  <th colSpan="6" className="bg-secondary text-white">किट विवरण</th>
                </tr>
                <tr className="small font-weight-bold">
                  <th className="bg-secondary-subtle text-dark">अनुमानित लाभार्थी</th>
                  <th className="bg-secondary-subtle text-dark">कुल डिमांड किट</th>
                  <th className="bg-secondary-subtle text-dark">पिछला अवशेष</th>
                  <th className="bg-secondary-subtle text-dark">कुल प्राप्त किट</th>
                  <th className="bg-secondary-subtle text-dark">कुल उपलब्ध किट</th>
                  <th className="bg-secondary-subtle text-dark">वितरित किट</th>
                </tr>
                <tr>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th>a</th>
                  <th>b</th>
                  <th>c</th>
                  <th>d</th>
                  <th>e(c+d)</th>
                  <th>f</th>
                </tr>
              </thead>
              <tbody>
                {kitSummaryLoading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4">
                      <Spinner animation="border" size="sm" /> डेटा लोड हो रहा है...
                    </td>
                  </tr>
                ) : kitSummaryError ? (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-danger">{kitSummaryError}</td>
                  </tr>
                ) : kitSummaryData.length > 0 ? (
                  kitSummaryData.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? "table-row-white" : "table-row-offwhite"}>
                      <td>{index + 1}</td>
                      <td>{item.district}</td>
                      <td>{item.project}</td>
                      <td>{item.quarter}</td>
                      <td>{item.estimated_beneficiary}</td>
                      <td>{item.total_demand_kits}</td>
                      <td>{item.previous_balance}</td>
                      <td>{item.total_received_kits}</td>
                      <td>{item.total_available_kits}</td>
                      <td>{item.distributed_kits}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-muted">कोई डेटा उपलब्ध नहीं है।</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
                </>
              ) : (
                /* Demand Registration Interface */
                <div className="animate-in fade-in duration-500">
                  <div className="mb-4">
                    <Button variant="primary" size="sm" onClick={() => setShowDemandRegistration(false)} className="d-flex align-items-center shadow-sm px-3 py-2">
                      <FaArrowLeft className="me-2" /> Back
                    </Button>
                  </div>

                  <div className="text-center mb-4">
                    <h3 className="fw-bold mb-1" style={{ color: "#495057" }}>Mahalaxmi Kit Demand {selectedYear}</h3>
                    <h5 className="fw-bold mb-3" style={{ color: "#dc3545" }}>Mahalaxmi Current Demand by Project</h5>
                    <div className="d-flex justify-content-center align-items-center gap-4">
                      <div className="text-center">
                        <span className="d-block small fw-bold text-muted">लाभार्थियों की सं०</span>
                        <h4 className="fw-bold" style={{ color: "#1b4a8f" }}>{demandLogData.reduce((acc, item) => acc + (parseInt(item.bene) || 0), 0)}</h4>
                      </div>
                      <Button variant="outline-primary" size="sm" onClick={fetchDemandLogData} disabled={demandLoading} className="d-flex align-items-center">
                        {demandLoading ? <Spinner animation="border" size="sm" className="me-2" /> : <FaSyncAlt className="me-2" />}
                        Refresh
                      </Button>
                      <div className="text-center">
                        <span className="d-block small fw-bold text-muted">किटो की संख्या</span>
                        <h4 className="fw-bold" style={{ color: "#1b4a8f" }}>{demandLogData.reduce((acc, item) => acc + (parseInt(item.req_kit) || 0), 0)}</h4>
                      </div>
                    </div>
                  </div>

                  <Card className="mb-5 border-0 shadow-sm" style={{ border: '1px solid #dee2e6', borderTop: '3px solid #007bff' }}>
                    <Card.Body className="p-4">
                      <Form onSubmit={handleDemandSubmit}>
                        <Row className="g-3 align-items-end">
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="small fw-bold text-muted text-uppercase">अनुमानित लाभार्थियों की सं०</Form.Label>
                              <Form.Control 
                                type="number" 
                                placeholder="Enter Beneficiary no." 
                                className="bg-light border-0" 
                                value={beneficiaryCount}
                                onChange={(e) => setBeneficiaryCount(e.target.value)}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="small fw-bold text-muted text-uppercase">अनुमानित किटो की संख्या</Form.Label>
                              <Form.Control 
                                type="number" 
                                placeholder="Enter no. of kit Demand" 
                                className="bg-light border-0" 
                                value={kitDemandCount}
                                onChange={(e) => setKitDemandCount(e.target.value)}
                                required
                              />
                            </Form.Group>
                          </Col>
                          <Col md={4}>
                            <Form.Group>
                              <Form.Label className="small fw-bold text-muted text-uppercase">Demand Quarter</Form.Label>
                              <Form.Select 
                                className="bg-light border-0"
                                value={demandQuarter}
                                onChange={(e) => setDemandQuarter(e.target.value)}
                                required
                              >
                                <option value="">Select Any One</option>
                                {["Apr-May-Jun", "Jul-Aug-Sep", "Oct-Nov-Dec", "Jan-Feb-Mar"].map(q => {
                                  const isAlreadyPresent = filteredDemandLogData.some(item => item.quarter === q);
                                  const isEditingThis = editingDemandId && demandLogData.find(i => i.id === editingDemandId)?.quarter === q;

                                  // Hide the quarter if it already exists in the log table,
                                  // unless it is the one currently being edited.
                                  if (isAlreadyPresent && !isEditingThis) return null;
                                  return <option key={q} value={q}>{q}</option>;
                                })}
                              </Form.Select>
                            </Form.Group>
                          </Col>
                        </Row>
                        <div className="text-center mt-4">
                          <p className="text-danger fw-bold mb-3 small">
                            नोट: वित्तीय वर्ष {selectedYear} की डिमांड किट एवं लाभार्थियों की सख्यां दर्ज करें !!!
                          </p>
                          <Button variant="primary" type="submit" className="px-5 py-2 fw-bold shadow-sm" disabled={demandLoading}>
                            {demandLoading && <Spinner animation="border" size="sm" className="me-2" />}
                            {editingDemandId ? "Update" : "Submit"}
                          </Button>
                        </div>
                      </Form>
                    </Card.Body>
                  </Card>

                  <div className="mb-4">
                    <h5 className="fw-bold mb-3" style={{ color: "#8b0000" }}>Mahalaxmi Kits Demand Log for {selectedProject === "All" ? "All Projects" : selectedProject} - {selectedYear}</h5>
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mb-3">
                      <div className="d-flex gap-1">
                        <Button variant="outline-secondary" size="sm" className="px-3">Copy</Button>
                        <Button variant="outline-secondary" size="sm" className="px-3">Excel</Button>
                        <Button variant="outline-secondary" size="sm" className="px-3">PDF</Button>
                        <Button variant="outline-secondary" size="sm" className="px-3">Column visibility</Button>
                      </div>
                      <div style={{ width: '250px' }}>
                        <InputGroup size="sm">
                          <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                          <FormControl placeholder="Search:" className="border-start-0 ps-0" />
                        </InputGroup>
                      </div>
                      <Form.Group controlId="projectFilter" className="mb-0">
                        <Form.Select
                          value={selectedProject}
                          onChange={(e) => setSelectedProject(e.target.value)}
                          size="sm"
                          className="border-2"
                        >
                          <option value="All">All Projects</option>
                          {uniqueProjects.map(project => (
                            <option key={project} value={project}>{project}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </div>

                    <div className="table-responsive shadow-sm rounded border bg-white">
                      {demandError && <Alert variant="danger" className="m-3"><FaInfoCircle className="me-2" />{demandError}</Alert>}
                      {demandLoading ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2">Loading demand log...</p>
                        </div>
                      ) : (
                        filteredDemandLogData.length === 0 ? (
                          <div className="text-center py-5 text-muted">No demand records found for {selectedYear}.</div>
                        ) : (
                          <Table bordered hover className="mb-0 align-middle text-center" style={{ fontSize: '12px' }}>
                            <thead className="table-light">
                              <tr className="text-muted">
                                <th>S.no</th>
                                <th>Project</th>
                                <th>Financial Year</th>
                                <th>Quarter</th>
                                <th>Beneficiary(in No.)</th>
                                <th>Kits(in No.)</th>
                                <th>Status</th>
                                <th>Edit</th>
                                <th>Delete</th>
                              </tr>
                            </thead>
                            <tbody className="text-center align-middle">
                              {filteredDemandLogData.map((item, idx) => (
                                <tr key={item.id} className={idx % 2 === 0 ? "bg-white" : "bg-light"}>
                                  <td>{idx + 1}</td>
                                  <td>{item.project}</td>
                                  <td>{item.fin_year}</td>
                                  <td>{item.quarter}</td>
                                  <td className="fw-bold">{item.bene}</td>
                                  <td className="fw-bold">{item.req_kit}</td>
                                  <td>
                                    <Badge bg={item.dpo_status === "Approved" ? "success" : "warning"} text={item.dpo_status === "Pending" ? "dark" : "white"}>
                                      {item.dpo_status}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Button 
                                      variant="link" 
                                      className="text-success p-0" 
                                      title="Edit"
                                      onClick={() => handleEditDemand(item)}
                                    >
                                      <FaPencilAlt />
                                    </Button>
                                  </td>
                                  <td>
                                    <Button 
                                      variant="link" 
                                      className="text-danger p-0" 
                                      title="Delete"
                                      onClick={() => handleDeleteDemand(item.id)}
                                    >
                                      <FaTrashAlt />
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </Container>

        {/* Modal for Prapt Kit (Allotment) Entry */}
        <Modal show={showAllotmentModal} onHide={() => { setShowAllotmentModal(false); setEditingAllotmentId(null); setAllotmentFormData({date:"", kits:"", quarter:""}); }} centered>
          <Modal.Header closeButton className="border-0 pb-0"></Modal.Header>
          <Modal.Body className="px-4 pb-4">
            <div className="text-center mb-4">
              <h4 className="fw-bold mb-1" style={{ color: "#495057" }}>महालक्ष्मी किट प्राप्त प्रविष्टि</h4>
              <h6 className="fw-bold" style={{ color: "#008080" }}>आवंटन किट प्रविष्टि</h6>
            </div>
            <Form onSubmit={handleAllotmentSubmit}>
              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold small">1.) किट आवंटन तिथि</Form.Label>
                <Form.Control 
                  type="date" 
                  name="date"
                  value={allotmentFormData.date}
                  onChange={handleAllotmentInputChange}
                  placeholder="dd-mm-yyyy"
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold small">2.) आवंटित किट संख्या</Form.Label>
                <Form.Control 
                  type="number" 
                  name="kits"
                  placeholder="उपलब्ध आवंटित मात्रा दर्ज करें*"
                  value={allotmentFormData.kits}
                  onChange={handleAllotmentInputChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-4 text-start">
                <Form.Label className="fw-bold small">3.) त्रैमास चुनें</Form.Label>
                <Form.Select 
                  name="quarter"
                  value={allotmentFormData.quarter}
                  onChange={handleAllotmentInputChange}
                  required
                >
                  <option value="">--त्रैमास चुनें--</option>
                  <option value="Apr-May-Jun">Apr-May-Jun</option>
                  <option value="Jul-Aug-Sep">Jul-Aug-Sep</option>
                  <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                  <option value="Jan-Feb-Mar">Jan-Feb-Mar</option>
                </Form.Select>
              </Form.Group>
              <div className="text-center">
                <Button variant="primary" type="submit" className="rounded-pill px-5 py-2 fw-bold shadow-sm" disabled={allotmentLoading}>
                  {allotmentLoading ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                  {editingAllotmentId ? "संशोधन जमा करें" : "आवंटन जमा करें"}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        {/* Modal for Received Kit Log */}
        <Modal show={showLogModal} onHide={() => setShowLogModal(false)} size="xl" centered scrollable>
          <Modal.Header closeButton className="bg-light">
            <Modal.Title className="w-100 text-center fw-bold h5 mb-0" style={{ color: "#343a40" }}>
              महालक्ष्मी किट लॉग प्राप्त किट लॉग
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
            <div className="table-responsive">
              <Table bordered className="mb-0 text-center align-middle" style={{ fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#e3f2fd" }}>
                    <th className="py-3">क्रम संख्या</th>
                    <th>सेक्टर</th>
                    <th>प्राप्ति की तारीख</th>
                    <th>प्राप्त किट</th>
                    <th>तिमाही के लिए प्राप्त हुआ</th>
                    <th>स्टेटस</th>
                    <th>संशोधन करे</th>
                    <th>डिलीट करे</th>
                  </tr>
                </thead>
                <tbody>
                  {allotmentLoading ? (
                    <tr><td colSpan="8" className="py-5"><Spinner animation="border" variant="primary" /></td></tr>
                  ) : allotmentLogData.length === 0 ? (
                    <tr><td colSpan="8" className="py-4 text-muted italic">कोई लॉग डेटा उपलब्ध नहीं है</td></tr>
                  ) : (
                    allotmentLogData.map((item, idx) => (
                      <tr key={item.id} style={{ backgroundColor: idx % 2 !== 0 ? "#e8f5e9" : "#fff" }}>
                        <td>{idx + 1}</td>
                        <td>{item.project || "N/A"}</td>
                        <td>{item.date || "-"}</td>
                        <td className="fw-bold">+{item.kits}</td>
                        <td>{item.quarter || "-"}</td>
                        <td><Badge bg={item.status === 'balance' ? 'secondary' : 'info'} className="text-uppercase">{item.status}</Badge></td>
                        <td>
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="p-1 text-white shadow-sm border-0"
                            style={{ backgroundColor: "#ff9800", minWidth: "30px", borderRadius: "4px" }}
                            onClick={() => handleEditAllotment(item)}
                          >
                            <FaPencilAlt size={12} />
                          </Button>
                        </td>
                        <td>
                          {item.status === "balance" ? (
                            <span className="text-muted small fw-bold opacity-50">Can't Delete</span>
                          ) : (
                            <Button variant="link" className="text-danger p-0 small fw-bold text-decoration-none" onClick={() => handleDeleteAllotment(item.id)}>
                              Delete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default MahalaxmiYear;