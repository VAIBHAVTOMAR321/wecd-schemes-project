import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Pagination } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/awc.css";
import SectorHeader from "./SectorHeader";
import SectorLeftNav from "./SectorLeftNav";

const OurAwc = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { user, api } = useAuth();
  const [awcData, setAwcData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sectorName, setSectorName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

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
    const fetchAwcData = async () => {
      setLoading(true);
      try {
        const response = await api.get("/sector-awc-dropdown/");
        if (response.data?.success) {
          setAwcData(response.data.data || []);
          setSectorName(response.data.sector || "");
        }
      } catch (err) {
        console.error("Failed to fetch AWC data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAwcData();
  }, [api]);

  useEffect(() => {
    setCurrentPage(1);
  }, [awcData]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const totalPages = Math.ceil(awcData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = awcData.slice(startIndex, startIndex + rowsPerPage);

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
          <div className="d-flex justify-content-between align-items-center awc-heading mb-4">
            <h3 className="fw-bold text-uppercase mb-0" style={{ color: "#60a5fa", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
              आंगनवाड़ी केंद्र
            </h3>
            <h5 className="fw-bold text-uppercase mb-0" style={{ color: "#93c5fd", fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}>
              सेक्टर के केंद्र : {sectorName || "Almora"}
            </h5>
          </div>

          <Row>
            <Col lg={12}>
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                  <h6 className="fw-bold mb-0" style={{ color: "#60a5fa" }}>
                    <i className="bi bi-house-door-fill me-2"></i>आंगनवाड़ी केंद्र सूची
                  </h6>
                  <span className="small fw-bold text-muted">कुल आंगनवाड़ी केंद्र : {awcData.length}</span>
                </Card.Header>

                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table bordered hover className="mb-0 text-center align-middle" style={{ tableLayout: "fixed", fontSize: "11px" }}>
                      <thead className="bg-light text-uppercase">
                        <tr>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>क्रम संख्या</th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>आंगनवाड़ी केंद्र कोड</th>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>आंगनवाड़ी</th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>आंगनवाड़ी प्रकार</th>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>अनुदान</th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>सेक्टर का नाम</th>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>प्रोजेक्ट का नाम</th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>जिला</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan="8" className="py-4 text-center">
                              <Spinner animation="border" size="sm" className="me-2" /> डेटा लोड हो रहा है...
                            </td>
                          </tr>
                        ) : paginatedData.length > 0 ? (
                          paginatedData.map((row, index) => (
                            <tr key={row.awc_code || index}>
                              <td className="py-2">{startIndex + index + 1}</td>
                              <td>{row.awc_code}</td>
                              <td>{row.awc_name}</td>
                              <td>{row.awc_type}</td>
                              <td>{row.code1}</td>
                              <td>{row.sector}</td>
                              <td>{row.project}</td>
                              <td>{row.district_name}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="py-4 text-muted small">कोई आंगनवाड़ी केंद्र नहीं मिला</td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3 px-2">
                  <span className="text-muted small">
                    कुल आंगनवाड़ी केंद्र : <strong>{awcData.length}</strong> | दिखा रहा है : {paginatedData.length}
                  </span>
                  <Pagination size="sm" className="mb-0">
                    <Pagination.Prev 
                      disabled={currentPage === 1 || loading} 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    />
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

export default OurAwc;