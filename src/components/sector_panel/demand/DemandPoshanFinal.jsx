import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Table, Button, Form, Badge } from "react-bootstrap";

import "../../../assets/css/supervisorleftnav.css";

import { useAuth } from "../../all_login/AuthContext";
import SectorHeader from "../SectorHeader";
import SectorLeftNav from "../SectorLeftNav";

const DemandPoshanFinal = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    financialYear: "2026-27",
    quarter: "",
    prevBalance: "5000",
    dates: "",
    eggs: "",
    nonEggs: ""
  });

  // Mock data for the table
  const tableData = [
    { id: 1, year: "2026-27", quarter: "Q1", dates: 120, eggs: 450, nonEggs: 300, cdpoStatus: "Approve", dpoStatus: "Pending" },
    { id: 2, year: "2026-27", quarter: "Q2", dates: 110, eggs: 420, nonEggs: 310, cdpoStatus: "Pending", dpoStatus: "Approve" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Demand Submitted:", formData);
  };
  
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

        <Container fluid className="dashboard-box mt-3">
          <div className="main-heading border-bottom pb-2 mb-4">
            <h3 className="fw-bold text-uppercase" style={{ color: "#2c3e50", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
              मुख्यमंत्री महिला पोषण योजना हेतु मांग
            </h3>
          </div>

          {/* Demand Form Section */}
          <Card className="mb-5 shadow-sm border border-info">
            <Card.Header className="bg-info text-white py-3">
              <h6 className="mb-0 fw-bold"><i className="bi bi-file-earmark-plus me-2"></i>सैक्टर डिमांड 2026-27</h6>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row className="g-4">
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>वित्तीय वर्ष</Form.Label>
                      <Form.Select 
                        size="sm"
                        name="financialYear" 
                        value={formData.financialYear} 
                        onChange={handleInputChange}
                      >
                        <option value="2026-27">2026-27</option>
                        <option value="2027-28">2027-28</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>त्रैमासिक मांग</Form.Label>
                      <Form.Select 
                        size="sm"
                        name="quarter" 
                        value={formData.quarter} 
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Quarter</option>
                        <option value="Q1">Quarter 1 (Apr-Jun)</option>
                        <option value="Q2">Quarter 2 (Jul-Sep)</option>
                        <option value="Q3">Quarter 3 (Oct-Dec)</option>
                        <option value="Q4">Quarter 4 (Jan-Mar)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>पिछला अवशेष</Form.Label>
                      <Form.Control size="sm" type="text" value={formData.prevBalance} disabled className="bg-light" />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>खजूर खाने वाले लाभार्थियों की सं0</Form.Label>
                      <Form.Control size="sm" name="dates" type="number" placeholder="संख्या दर्ज करें" value={formData.dates} onChange={handleInputChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>अण्डे खाने वाले लाभार्थियों की सं0</Form.Label>
                      <Form.Control size="sm" name="eggs" type="number" placeholder="संख्या दर्ज करें" value={formData.eggs} onChange={handleInputChange} required />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-2">
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px' }}>अण्डा ना खाने वाले लाभार्थियों की सं0</Form.Label>
                      <Form.Control size="sm" name="nonEggs" type="number" placeholder="संख्या दर्ज करें" value={formData.nonEggs} onChange={handleInputChange} required />
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-center mt-4">
                  <Button type="submit" variant="primary" className="px-5 py-2 fw-bold shadow-sm">
                    Submit Demand
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Data Table Section */}
          <div className="table-responsive shadow-sm rounded">
            <Table striped bordered hover className="mb-0 custom-table">
              <thead className="table-primary text-center">
                <tr className="table-thead">
                  <th>क्रस0</th>
                  <th>वित्तीय वर्ष</th>
                  <th>त्रैमास</th>
                  <th>खजूर खाने वाल लाभार्थी</th>
                  <th>अण्डा खाने वाले लाभार्थी</th>
                  <th>अण्डा ना खाने वाले लाभार्थी</th>
                  <th>CDPO Approval Status</th>
                  <th>DPO Approval Status</th>
                </tr>
              </thead>
              <tbody className="text-center align-middle">
                {tableData.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{row.year}</td> 
                    <td>{row.quarter}</td>
                    <td>{row.dates}</td>
                    <td>{row.eggs}</td>
                    <td>{row.nonEggs}</td>
                    <td>
                      <Badge pill bg={row.cdpoStatus === "Approve" ? "success" : "warning"} className="px-3 py-2">
                        <i className={`bi bi-${row.cdpoStatus === "Approve" ? "check" : "clock"} me-1`}></i>
                        {row.cdpoStatus}
                      </Badge> 
                    </td>
                    <td>
                      <Badge pill bg={row.dpoStatus === "Approve" ? "success" : "warning"} className="px-3 py-2">
                        <i className={`bi bi-${row.dpoStatus === "Approve" ? "check" : "clock"} me-1`}></i>
                        {row.dpoStatus}
                      </Badge> 
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        
        </Container>

        
      </div>
    </div>
  );
};

export default DemandPoshanFinal;