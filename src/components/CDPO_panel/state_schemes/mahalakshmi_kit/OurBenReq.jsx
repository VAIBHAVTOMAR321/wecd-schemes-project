import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Form, Badge, Alert, InputGroup, FormControl } from "react-bootstrap";
import { FaSyncAlt, FaSearch, FaInfoCircle } from "react-icons/fa";

import "../../../../assets/css/supervisorleftnav.css";
import CDPOLeftNav from "../../CDPOLeftNav";
import CDPOHeader from "../../CDPOHeader";
import { useAuth } from "../../../all_login/AuthContext";

const OurBenReq = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Filter States
  const [selectedYear, setSelectedYear] = useState("2024-2025");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Data States
  const [beneficiaryData, setBeneficiaryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;
  
  const { api } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
      setIsMobile(mobile);
      setIsTablet(tablet);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const fetchBeneficiaryData = async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/cdpo-beneficiary/");
      let rawData = [];
      if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        rawData = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      }
      setBeneficiaryData(rawData);
    } catch (err) {
      setError("डेटा प्राप्त करने में विफल। कृपया पुनः प्रयास करें।");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaryData();
  }, [api]);

  // Quarter to Month Mapping
  const quarterMap = {
    "Apr-May-Jun": ["April", "May", "June"],
    "Jul-Aug-Sep": ["July", "August", "September"],
    "Oct-Nov-Dec": ["October", "November", "December"],
    "Jan-Feb-Mar": ["January", "February", "March"]
  };

  // Filtering Logic
  const filteredData = beneficiaryData.filter((item) => {
    // Year filter
    const yearMatch = !selectedYear || 
                     item.fin_year === selectedYear || 
                     item.fin_year === selectedYear.replace("-20", "-");
    
    // Quarter filter
    const quarterMatch = !selectedQuarter || 
                        (quarterMap[selectedQuarter] && quarterMap[selectedQuarter].includes(item.month));
    
    // Month filter
    const monthMatch = !selectedMonth || item.month === selectedMonth;

    // Search filter
    const term = searchTerm.toLowerCase();
    const searchMatch = !searchTerm || 
                       (item.name?.toLowerCase().includes(term)) ||
                       (item.adhar_num?.includes(term)) ||
                       (item.adhar?.includes(term)) ||
                       (item.ben_mob?.includes(term)) ||
                       (item.mob?.includes(term)) ||
                       (item.awc_name?.toLowerCase().includes(term));

    return yearMatch && quarterMatch && monthMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="dashboard-container">
      <CDPOLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <CDPOHeader toggleSidebar={toggleSidebar} />
        <Container fluid className="dashboard-box mt-3">
          <div className="main-heading mb-4">
            <h3 className="fw-bold" style={{ color: "#1b4a8f" }}>महालक्ष्मी किट लाभार्थी वितरण लॉग</h3>
          </div>

          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <Row className="g-3 align-items-end">
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">वित्तीय वर्ष</Form.Label>
                    <Form.Select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">त्रैमास (Quarter)</Form.Label>
                    <Form.Select value={selectedQuarter} onChange={(e) => { setSelectedQuarter(e.target.value); setCurrentPage(1); }}>
                      <option value="">सभी (All)</option>
                      {Object.keys(quarterMap).map(q => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">माह चुनें</Form.Label>
                    <Form.Select value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}>
                      <option value="">सभी (All)</option>
                      {["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">खोजें (नाम, आधार, मोबाइल)</Form.Label>
                    <InputGroup size="sm">
                      <InputGroup.Text className="bg-white"><FaSearch className="text-muted" /></InputGroup.Text>
                      <FormControl 
                        placeholder="Search..." 
                        value={searchTerm} 
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Button variant="outline-primary" className="w-100" onClick={fetchBeneficiaryData} disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : <FaSyncAlt className="me-2" />} रिफ्रेश
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="table-responsive shadow-sm rounded border bg-white">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">डेटा लोड हो रहा है...</p>
              </div>
            ) : error ? (
              <Alert variant="danger" className="m-3"><FaInfoCircle className="me-2" />{error}</Alert>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-5 text-muted italic">कोई डेटा उपलब्ध नहीं है।</div>
            ) : (
              <Table bordered hover className="mb-0 align-middle text-center" style={{ fontSize: '12px' }}>
                <thead style={{ backgroundColor: '#e3f2fd' }}>
                  <tr className="fw-bold">
                    <th>क्रम संख्या</th>
                    <th>नाम</th>
                    <th>जन्म तिथि</th>
                    <th>किट तिथि</th>
                    <th>माह</th>
                    <th>जाति</th>
                    <th>मोबाइल</th>
                    <th>आधार</th>
                    <th>AWC कोड</th>
                    <th>बच्चों की संख्या</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr key={item.id || index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa' }}>
                      <td>{startIndex + index + 1}</td>
                      <td className="fw-bold">{item.name || "-"}</td>
                      <td>{item.dob || "-"}</td>
                      <td>{item.kit_date || "-"}</td>
                      <td><Badge bg="info">{item.month || "-"}</Badge></td>
                      <td>{item.caste_category || "-"}</td>
                      <td>{item.ben_mob || item.mob || "-"}</td>
                      <td>{item.adhar_num || item.adhar || "-"}</td>
                      <td>{item.awc_code || "-"}</td>
                      <td>{item.child_born || "0"}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredData.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3 px-2 border-top pt-3">
              <span className="text-muted small">
                कुल रिकॉर्ड: <strong>{filteredData.length}</strong> | दिखा रहा है: {paginatedData.length}
              </span>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  ← पिछला
                </Button>
                <span className="align-self-center small fw-bold px-2">पृष्ठ {currentPage} / {totalPages}</span>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPage >= totalPages} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  अगला →
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
};

export default OurBenReq;