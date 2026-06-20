import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Badge, Spinner, Alert } from "react-bootstrap";

import "../../../assets/css/supervisorleftnav.css";

import { useAuth } from "../../all_login/AuthContext";
import SectorHeader from "../SectorHeader";
import SectorLeftNav from "../SectorLeftNav";

const DemandanchalAamrit = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  
  const { user, api, uniqueId } = useAuth();

  // Form state for Amrit Aanchal Poshan
  const [formData, setFormData] = useState({
    financialYear: "2026-27",
    remainingMilkPowderKg: "",
    remarkMonth: "",
    beneficiariesCount: "",
    quarter: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const fetchDemandData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/am-demand/'); 
      setTableData(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching Amrit Aanchal demand data:", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for duplicate quarter if not editing
    if (!editingId) {
      const exists = tableData.some(item => 
        item.qtr_dmd?.trim() === formData.quarter.trim() && 
        item.fin_yr?.trim() === formData.financialYear.trim()
      );
      if (exists) {
        alert(`Amrit Aanchal Demand for ${formData.quarter} (${formData.financialYear}) has already been submitted.`);
        return;
      }
    }

    const payload = {
      fin_yr: formData.financialYear,
      qtr_dmd: formData.quarter,
      avl_milk: formData.remainingMilkPowderKg,
      avl_month: formData.remarkMonth,
      milk_bene: formData.beneficiariesCount
    };

    try {
      if (editingId) {
        await api.put('/am-demand/', { ...payload, id: editingId });
        alert("Amrit Aanchal Demand updated successfully!");
      } else {
        await api.post('/am-demand/', payload);
        alert("Amrit Aanchal Demand submitted successfully!");
      }
      resetForm();
      fetchDemandData();
    } catch (err) {
      console.error("Error submitting Amrit Aanchal demand:", err);
      alert("Failed to submit demand. Please try again.");
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setFormData({
      financialYear: row.fin_yr,
      quarter: row.qtr_dmd,
      remainingMilkPowderKg: row.avl_milk,
      remarkMonth: row.avl_month,
      beneficiariesCount: row.milk_bene
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this demand record?")) {
      try {
        await api.delete('/am-demand/', { data: { id } });
        fetchDemandData();
      } catch (err) {
        console.error("Error deleting record:", err);
        alert("Failed to delete record. Please try again.");
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      financialYear: "2026-27",
      remainingMilkPowderKg: "",
      remarkMonth: "",
      beneficiariesCount: "",
      quarter: ""
    });
  };

  // Robust check for existing records using trim
  const existingRecord = formData.quarter && tableData.find(
    item => 
      item.qtr_dmd?.toString().trim() === formData.quarter.trim() && 
      item.fin_yr?.toString().trim() === formData.financialYear.trim()
  );
  const isDuplicate = !editingId && !!existingRecord;

  useEffect(() => {
    fetchDemandData();
  }, [fetchDemandData]);

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

        <Container fluid className="dashboard-box mt-3"> {/* Changed mt-4 to mt-3 for consistency */}
          <div className="main-heading border-bottom pb-2 mb-4">
            <h3 className="fw-bold text-uppercase" style={{ color: "#4e73df", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
              अमृत अंचल योजना हेतु मांग
            </h3>
          </div>

          {isDuplicate && (
            <Alert variant="warning" className="mb-3 py-2 shadow-sm border-0 border-start border-4 border-warning text-center" style={{ fontSize: '13px' }}>
              <div className="d-flex align-items-center justify-content-center">
                <i className="bi bi-info-circle-fill me-2 fs-6"></i>
                <span>
                  सूचना: चयनित वित्तीय वर्ष और त्रैमास के लिए मांग पहले ही दर्ज की जा चुकी है। नया रिकॉर्ड बनाने के लिए कृपया पिछला रिकॉर्ड हटाएँ (यदि लंबित हो) या सहायता हेतु आईटी सेल से संपर्क करें।
                </span>
              </div>
            </Alert>
          )}

          {/* Demand Form Section */}
          <Card className="mb-4 shadow-sm border border-primary" style={{ borderLeft: '4px solid #4e73df' }}>
            <Card.Header className="py-2" style={{ backgroundColor: '#4e73df', color: 'white' }}>
              <h6 className="mb-0 fw-bold"><i className="bi bi-file-earmark-plus me-2"></i>{editingId ? "संपादित करें" : `सैक्टर मांग ${formData.financialYear}`}</h6>
            </Card.Header>
            <Card.Body className="p-3">
              <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group className="mb-1">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>वित्तीय वर्ष</Form.Label>
                      <Form.Select 
                        size="sm"
                        name="financialYear" 
                        value={formData.financialYear} 
                        onChange={handleInputChange}
                      >
                        <option value="2024-25">2024-25</option>
                        <option value="2025-26">2025-26</option>
                        <option value="2026-27">2026-27</option>
                        <option value="2027-28">2027-28</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {/* Move त्रैमासिक मांग (quarter) here, right after वित्तीय वर्ष */}
                  <Col md={4}>
                    <Form.Group className="mb-1">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>त्रैमासिक मांग</Form.Label>
                      <Form.Select 
                        size="sm"
                        name="quarter" 
                        value={formData.quarter} 
                        onChange={handleInputChange}
                        required
                        // The quarter field should not be disabled even if a record exists
                        // disabled={isDuplicate} // Removed this line as per request
                      >
                        <option value="">Select Quarter</option>
                        <option value="Apr-May-June">Apr-May-June</option>
                        <option value="July-Aug-Sept">July-Aug-Sept</option>
                        <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                        <option value="Jan-Feb-March">Jan-Feb-March</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-1">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>अवशेष दूध पाउडर की मात्रा (किलोग्राम में)</Form.Label>
                      <Form.Control 
                        size="sm"
                        name="remainingMilkPowderKg"
                        type="number" 
                        placeholder="Not Applicable"
                        value={formData.remainingMilkPowderKg} 
                        onChange={handleInputChange}
                        disabled
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-1">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>अभ्युक्ति (किस माह तक का दूध पाउडर उपलब्ध है)</Form.Label>
                      <Form.Select 
                        size="sm"
                        name="remarkMonth" 
                        value={formData.remarkMonth} 
                        onChange={handleInputChange}
                        disabled={isDuplicate}
                        required
                      >
                        <option value="">माह चयन करें</option>
                        <option value="January">जनवरी</option>
                        <option value="February">फरवरी</option>
                        <option value="March">मार्च</option>
                        <option value="April">अप्रैल</option>
                        <option value="May">मई</option>
                        <option value="June">जून</option>
                        <option value="July">जुलाई</option>
                        <option value="August">अगस्त</option>
                        <option value="September">सितंबर</option>
                        <option value="October">अक्टूबर</option>
                        <option value="November">नवंबर</option>
                        <option value="December">दिसंबर</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-1">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>दूध पाउडर वितरित हेतु लाभार्थियों की संख्यां (एक माह)</Form.Label>
                      <Form.Control 
                        size="sm"
                        name="beneficiariesCount"
                        type="number" 
                        placeholder="संख्या दर्ज करें" 
                        value={formData.beneficiariesCount} 
                        onChange={handleInputChange} 
                        required 
                        disabled={isDuplicate}
                      />
                      <Form.Text className="text-danger" style={{ fontSize: '10px', display: 'block', textAlign: 'left', marginTop: '5px', fontWeight: '500' }}>
                        *Note-&gt; केवल एक माह के लाभार्थियों की संख्या दर्ज़ करे
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-center mt-3">
                  <Button type="submit" variant={editingId ? "warning" : "primary"} className="px-4 py-1 fw-bold shadow-sm" style={{ fontSize: '14px' }} disabled={isDuplicate}>
                    {editingId ? "Update Demand" : "Submit Demand"}
                  </Button>
                  {editingId && (
                    <Button variant="secondary" className="ms-2 px-3 py-1 fw-bold" style={{ fontSize: '14px' }} onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Data Table Section */}
          <div className="table-responsive shadow-sm rounded">
            <Table striped bordered hover className="mb-0 custom-table">
              <thead className="table-primary text-center">
                <tr className="table-thead">
                  <th>क्रस०</th>
                  <th>वित्तीय वर्ष</th>
                  <th>अवशेष पाउडर (किलोग्राम में)</th>
                  <th>अभ्युक्ति माह</th>
                  <th>त्रैमास</th>
                  <th>लाभार्थियों की सं०</th>
                  <th>CDPO Approval Status</th>
                  <th>DPO Status</th> {/* Changed from Director Approval Status to DPO Status */}
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="text-center align-middle">
                {loading ? (
                  <tr>
                    <td colSpan="9"><Spinner animation="border" size="sm" /> Loading...</td> {/* Colspan adjusted */}
                  </tr>
                ) : tableData.length > 0 ? ( 
                  tableData.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td>{row.fin_yr}</td>
                      <td>{row.avl_milk}</td>
                      <td>{row.avl_month}</td>
                      <td>{row.qtr_dmd}</td>
                      <td>{row.milk_bene}</td>
                      <td>
                        <Badge pill bg={row.cdpo_status === "Approve" ? "success" : row.cdpo_status === "Rejected" ? "danger" : "warning"} className="px-3 py-2">
                          <i className={`bi bi-${row.cdpo_status === "Approve" ? "check" : row.cdpo_status === "Rejected" ? "x-circle" : "clock"} me-1`}></i>
                          {row.cdpo_status}
                        </Badge> 
                      </td>
                      <td>
                        <Badge pill bg={row.dir_status === "Approve" ? "success" : row.dir_status === "Rejected" ? "danger" : "warning"} className="px-3 py-2">
                          <i className={`bi bi-${row.dir_status === "Approve" ? "check" : row.dir_status === "Rejected" ? "x-circle" : "clock"} me-1`}></i>
                          {row.dir_status || "Pending"}
                        </Badge> 
                      </td>
                      <td>
                        {(row.cdpo_status === "Approve" || row.dir_status === "Approve") && row.cdpo_status !== "Rejected" && row.dir_status !== "Rejected" ? (
                           <Badge bg="secondary">Locked</Badge>
                        ) : (
                          <div className="d-flex justify-content-center gap-2">
                            <Button 
                              variant="outline-primary" 
                              size="sm" 
                              onClick={() => handleEdit(row)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDelete(row.id)}
                              title="Delete"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9">No demand data found.</td> {/* Colspan adjusted */}
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

        
        </Container>

        
      </div>
    </div>
  );
};

export default DemandanchalAamrit ;