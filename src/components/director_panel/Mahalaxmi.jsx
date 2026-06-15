import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, InputGroup, Table, Pagination, Badge, Alert } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns, FaSearch, FaCheck } from "react-icons/fa";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/dashboard.css";
import DirectorHeader from "./DirectorHeader";
import DirectorLeftNav from "./DirectorLeftNav";

const quarter_month_map = {
  "Q1": "Apr-May-June",
  "Q2": "July-Aug-Sept",
  "Q3": "Oct-Nov-Dec",
  "Q4": "Jan-Feb-March",
};

const Mahalaxmi = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const { api } = useAuth();

  // State for filters and pagination
  const [financialYear, setFinancialYear] = useState("2024-2025");
  const [quarter, setQuarter] = useState("Q1");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [error, setError] = useState(null);

  const entriesPerPage = 10;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  const fetchBeneficiaryData = useCallback(async (page = 1) => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`director/beneficiary-summary/`, {
        params: {
          fin_year: financialYear,
          quarter: quarter,
          page: page
        }
      });
      // API response structure: response.data.results.data
      setTableData(response.data?.results?.data || []);
      setTotalEntries(response.data?.count || 0);
    } catch (err) {
      console.error("Error fetching beneficiary data:", err);
      setError("Failed to fetch beneficiary records. Please try again.");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [api, financialYear, quarter]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchBeneficiaryData(currentPage);
  }, [api, currentPage]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFilter = () => {
    setCurrentPage(1);
    fetchBeneficiaryData(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="dashboard-container">
      <DirectorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <DirectorHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3">
          {/* Optimized Header Section */}
          <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
            <div>
              <h4 className="fw-bold mb-0" style={{ color: "#1b4a8f", fontSize: "1.25rem" }}>
                Beneficiary Report: Mahalaxmi Kit
              </h4>
              <p className="text-muted small mb-0">WECD Uttarakhand | State Scheme Portal</p>
            </div>
            <div className="text-end">
              <Badge bg="warning" text="dark" className="p-2 shadow-sm" style={{ fontSize: '0.9rem' }}>
                Total Kits Distributed: <strong>147,825</strong>
              </Badge>
              <div className="text-danger" style={{ fontSize: '10px', marginTop: '2px' }}>*Data as of {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Compact Filtering Row */}
          <Card className="border-0 shadow-sm mb-3 bg-light">
            <Card.Body className="p-2">
              <Row className="g-2 align-items-center">
                <Col md={3}>
                  <Form.Select size="sm" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                    <option value="2024-2025">FY 2024-2025</option>
                    <option value="2025-2026">FY 2025-2026</option>
                    <option value="2026-2027">FY 2026-2027</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select size="sm" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                    <option value="Q1">Quarter: Apr-May-June (Q1)</option>
                    <option value="Q2">Quarter: July-Aug-Sept (Q2)</option>
                    <option value="Q3">Quarter: Oct-Nov-Dec (Q3)</option>
                    <option value="Q4">Quarter: Jan-Feb-March (Q4)</option>
                  </Form.Select>
                </Col>
                <Col md="auto">
                  <Button 
                    size="sm" 
                    variant="warning" 
                    className="fw-bold text-white px-3" 
                    style={{ backgroundColor: '#fd7e14', borderColor: '#fd7e14' }}
                    onClick={handleFilter}
                    disabled={loading}
                  >
                    Filter Now
                  </Button>
                </Col>
                <Col className="text-end">
                  <span className="fw-bold text-dark small">Current View: {financialYear} | {quarter_month_map[quarter]}</span>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Datatable Toolbar */}
          <Row className="mb-2 align-items-center">
            <Col md={6} className="d-flex gap-2">
              <Button variant="secondary" size="sm"><FaCopy className="me-1" /> Copy</Button>
              <Button variant="secondary" size="sm"><FaFileExcel className="me-1" /> Excel</Button>
              <Button variant="secondary" size="sm"><FaFilePdf className="me-1" /> PDF</Button>
              <Button variant="secondary" size="sm"><FaColumns className="me-1" /> Column visibility</Button>
            </Col>
            <Col md={6}>
              <InputGroup size="sm" className="justify-content-end">
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Search..."
                  aria-label="Search"
                  size="sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ maxWidth: '200px' }}
                />
              </InputGroup>
            </Col>
          </Row>

          {/* Data Table */}
          <div className="table-responsive shadow-sm rounded">
            {error && <Alert variant="danger" className="m-2">{error}</Alert>}
            
            <Table striped bordered hover size="sm" className="mb-0 custom-table">
              <thead style={{ backgroundColor: "#f1f4f9" }}>
                <tr>
                  <th className="text-center py-2">S.no</th>
                  <th className="text-center py-2">District</th>
                  <th className="text-center py-2">Project</th>
                  <th className="text-center py-2">Sector</th>
                  <th className="text-center py-2">AWC Name</th>
                  <th className="text-center py-2">Name</th>
                  <th className="text-center py-2">DOB</th>
                  <th className="text-center py-2">Mobile</th>
                  <th className="text-center py-2">Adhar Num</th>
                  <th className="text-center py-2">Delivery Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2 mb-0">Loading beneficiary data...</p>
                    </td>
                  </tr>
                ) : tableData.length > 0 ? (
                  tableData.map((row, index) => (
                    <tr key={row.id || index}>
                      <td className="text-center">{(currentPage - 1) * entriesPerPage + index + 1}</td>
                      <td>{row.district}</td>
                      <td>{row.project}</td>
                      <td>{row.sector}</td>
                      <td>{row.awc_name}</td>
                      <td>{row.name}</td>
                      <td className="text-center">{row.dob}</td>
                      <td className="text-center">{row.ben_mob}</td>
                      <td className="text-center">{row.adhar_num}</td>
                      <td className="text-center">{row.del_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-muted">No beneficiary records found for the selected criteria.</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <Row className="mt-3 align-items-center">
            <Col md={6}>
              <div className="text-muted small">
                Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, totalEntries)} of {totalEntries} entries
              </div>
            </Col>
            <Col md={6} className="d-flex justify-content-end">
              <Pagination>
                <Pagination.Prev onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
                {[...Array(Math.min(5, totalPages))].map((_, i) => (
                  <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => handlePageChange(i + 1)}>
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
              </Pagination>
            </Col>
          </Row>
        </Container>
      </div>
    </div>
  );
};

export default Mahalaxmi;