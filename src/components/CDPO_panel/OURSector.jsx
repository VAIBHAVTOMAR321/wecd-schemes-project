import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Pagination, Form, Button } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import "../../assets/css/awc.css";
import CDPOLeftNav from "./CDPOLeftNav";
import CDPOHeader from "./CDPOHeader";

const SECTOR_API_URL = "https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/cdpo-sector/";

const OURSector = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { api, accessToken } = useAuth();
  const [sectorData, setSectorData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [apiError, setApiError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
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
    const fetchSectorData = async () => {
      setLoading(true);
      setApiError("");
      try {
        const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
        const response = await api.get(SECTOR_API_URL, { headers });
        if (response.data?.success) {
          const data = response.data.data || [];
          setSectorData(data);
          setProjectName(response.data.project_name || response.data.project_code || "");
        } else {
          throw new Error("CDPO sector API response was not successful");
        }
      } catch (err) {
        setApiError(err.response?.data?.error || err.response?.data?.message || err.message);
        console.error("Failed to fetch sector data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSectorData();
  }, [api, accessToken]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sectorData]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setEditForm({ ...row, password: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => prev ? { ...prev, [name]: value } : null);
  };

  const handleSave = async () => {
    if (!editForm || !api) return;
    setSaving(true);
    setApiError("");
    try {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const payload = {
        id: editForm.id,
        sdname: editForm.sdname || "",
        district: editForm.district || "",
        project_code: editForm.project_code || "",
        project_name: editForm.project_name || "",
        sector: editForm.sector || "",
        sector_incharge: editForm.sector_incharge || "",
        incharge_mob: editForm.incharge_mob || "",
        password: editForm.password || "",
      };
      const response = await api.put(SECTOR_API_URL, payload, { headers });
      if (response.data?.success) {
        const responseData = response.data.data;
        if (Array.isArray(responseData)) {
          setSectorData(responseData);
        } else if (responseData) {
          setSectorData((prev) => prev.map((item) => item.id === responseData.id ? responseData : item));
        }
        setEditingId(null);
        setEditForm(null);
      } else {
        throw new Error("CDPO sector update response was not successful");
      }
    } catch (err) {
      setApiError(err.response?.data?.error || err.response?.data?.message || err.message);
      console.error("Failed to update sector data:", err);
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(sectorData.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = sectorData.slice(startIndex, startIndex + rowsPerPage);

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
          <div className="d-flex justify-content-between align-items-center awc-heading mb-4">
            <h3 className="fw-bold text-uppercase mb-0" style={{ color: "#60a5fa", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
              CDPO सेक्टर सूची
            </h3>
            <h5 className="fw-bold text-uppercase mb-0" style={{ color: "#93c5fd", fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}>
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
              <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                  <h6 className="fw-bold mb-0" style={{ color: "#60a5fa" }}>
                    <i className="bi bi-grid-3x3-gap-fill me-2"></i>सेक्टर सूची
                  </h6>
                  <span className="small fw-bold text-muted">कुल आंगनवाड़ी केंद्र : {sectorData.length}</span>
                </Card.Header>

                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table bordered hover className="mb-0 text-center align-middle" style={{ tableLayout: "fixed", fontSize: "11px" }}>
                      <thead className="bg-light text-uppercase">
                        <tr>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>क्रम संख्या</th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>आईडी</th>
                          <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>सेक्टर</th>
                          <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>सेक्टर प्रकार</th>
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
                            <td colSpan="8" className="py-4 text-muted small">कोई सेक्टर केंद्र नहीं मिला</td>
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
                    कुल सेक्टर : <strong>{sectorData.length}</strong> | दिखा रहा है : {paginatedData.length}
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

export default OURSector;