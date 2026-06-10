import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Form, InputGroup, FormControl, Badge, Alert, Button, Pagination, Modal } from "react-bootstrap";
import { useAuth } from "../../all_login/AuthContext";
import "../../../assets/css/supervisorleftnav.css";
import "../../../assets/css/cdpo.css";
import DPOHeader from "../DPOHeader";
import DPOLeftNav from "../DPOLeftNav";

const DemandMahilaPoshanDistirct = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [demandData, setDemandData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [financialYears, setFinancialYears] = useState([]);
  const [quarters, setQuarters] = useState([]);

  const [selectedFinYear, setSelectedFinYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [fetchKey, setFetchKey] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [remarkText, setRemarkText] = useState("");

  const { user, api, uniqueId, isReady } = useAuth();

  const handleResize = () => {
    const mobile = window.innerWidth <= 768;
    const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
    setIsMobile(mobile);
    setIsTablet(tablet);
    setSidebarOpen(mobile ? false : true);
  };

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    const fetchDropdowns = async () => {
      try {
        const [finRes, qtrRes] = await Promise.all([
          api.get("/fin-year-list/"),
          api.get("/quarter-list/"),
        ]);
        if (cancelled) return;
        setFinancialYears(Array.isArray(finRes.data) ? finRes.data : []);
        setQuarters(Array.isArray(qtrRes.data) ? qtrRes.data : []);
      } catch (err) {
        if (!cancelled) console.error("Failed to fetch dropdowns:", err);
      }
    };
    fetchDropdowns();
    return () => { cancelled = true; };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
      const params = {};
      if (selectedFinYear) params.fin_yr = selectedFinYear;
      if (selectedQuarter) params.qtr = selectedQuarter;
        const response = await api.get("/dpo-mp-demand/", { params });
        if (cancelled) return;
        const payload = response.data;
        if (Array.isArray(payload)) setDemandData(payload);
        else if (payload && Array.isArray(payload.results)) setDemandData(payload.results);
        else setDemandData([]);
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data || err.message || "Request failed";
          setError(String(msg));
          setDemandData([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [selectedFinYear, selectedQuarter, api, fetchKey]);

  const filteredData = demandData.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.district || "").toLowerCase().includes(term) ||
      (item.project_name || "").toLowerCase().includes(term) ||
      (item.sector || "").toLowerCase().includes(term) ||
      (item.fin_yr || "").toLowerCase().includes(term) ||
      (item.qtr_dmd || "").toLowerCase().includes(term)
    );
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFinYear, selectedQuarter, searchTerm]);

  const handleViewClick = () => {
    setCurrentPage(1);
    setFetchKey((prev) => prev + 1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const openModal = (mode, item) => {
    setModalMode(mode);
    setSelectedItem(item);
    setRemarkText("");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setRemarkText("");
  };

  const submitAction = async () => {
    if (!selectedItem || !api) return;
    try {
      const updateData = {
        dir_status: modalMode === "approve" ? "Approve" : "Reject",
        dir_remark: remarkText,
      };
      await api.put(`/dpo-mp-demand/${selectedItem.id}/`, updateData);
      setDemandData((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id ? { ...item, ...updateData } : item
        )
      );
      closeModal();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approve" || s === "approved") return <Badge bg="success">Approve</Badge>;
    if (s === "pending") return <Badge bg="warning">Pending</Badge>;
    if (s === "rejected" || s === "reject") return <Badge bg="danger">Reject</Badge>;
    return <Badge bg="secondary">{status || "-"}</Badge>;
  };

  const renderDemandTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="10" className="text-center py-4">
            <Spinner animation="border" size="sm" /> Loading...
          </td>
        </tr>
      );
    }
    if (paginatedData.length === 0) {
      return (
        <tr>
          <td colSpan="10" className="text-center py-4 text-muted">No data available in table</td>
        </tr>
      );
    }
    return paginatedData.map((item, index) => {
      const actualIndex = startIndex + index + 1;
      return (
        <tr key={item.id ?? actualIndex}>
          <td>{actualIndex}</td>
          <td>{item.district}</td>
          <td>{item.project_name}</td>
          <td>{item.sector}</td>
          <td>{item.fin_yr}</td>
          <td>{item.qtr_dmd}</td>
          <td>{item.khajur_bene ?? "0"}</td>
          <td>{item.egg_bene ?? "0"}</td>
          <td>{item.tot_noteat_egg_bene ?? "0"}</td>
          <td>{getStatusBadge(item.cdpo_status)}</td>
          <td>
            <Button variant="success" size="sm" className="me-1" onClick={() => openModal("approve", item)}>Approve</Button>
            <Button variant="danger" size="sm" onClick={() => openModal("reject", item)}>Reject</Button>
          </td>
        </tr>
      );
    });
  };

  const approvedFilteredData = filteredData.filter((item) => (item.dir_status || "").toLowerCase() === "approve");
  const approvedPaginatedData = approvedFilteredData.slice(startIndex, endIndex);

  const renderApprovalTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="11" className="text-center py-4">
            <Spinner animation="border" size="sm" /> Loading...
          </td>
        </tr>
      );
    }
    if (approvedPaginatedData.length === 0) {
      return (
        <tr>
          <td colSpan="11" className="text-center py-4 text-muted">No data available in table</td>
        </tr>
      );
    }
    return approvedPaginatedData.map((item, index) => {
      const actualIndex = startIndex + index + 1;
      return (
        <tr key={item.id ?? actualIndex}>
          <td>{actualIndex}</td>
          <td>{item.district}</td>
          <td>{item.project_name}</td>
          <td>{item.sector}</td>
          <td>{item.fin_yr}</td>
          <td>{item.qtr_dmd}</td>
          <td>{item.khajur_bene ?? "0"}</td>
          <td>{item.egg_bene ?? "0"}</td>
          <td>{item.tot_noteat_egg_bene ?? "0"}</td>
          <td>{getStatusBadge(item.cdpo_status)}</td>
          <td>{getStatusBadge(item.dir_status || item.dpo_status)}</td>
        </tr>
      );
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      items.push(
        <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
          {i}
        </Pagination.Item>
      );
    }
    return (
      <div className="d-flex justify-content-center mt-3">
        <Pagination>{items}</Pagination>
      </div>
    );
  };

  const renderModal = () => (
    <Modal show={showModal} onHide={closeModal}>
      <Modal.Header closeButton>
        <Modal.Title>{modalMode === "approve" ? "Approve" : "Reject"} Demand</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label>Remark</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            placeholder={modalMode === "approve" ? "Optional remark..." : "Enter remark..."}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={closeModal}>Close</Button>
        <Button variant={modalMode === "approve" ? "success" : "danger"} onClick={submitAction}>
          {modalMode === "approve" ? "Approve" : "Reject"}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <div className="dashboard-container">
      <DPOLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <DPOHeader toggleSidebar={toggleSidebar} />

        {!isReady && (
          <Container fluid className="dashboard-box mt-3">
            <div className="text-center py-5">
              <Spinner animation="border" /> Initializing session...
            </div>
          </Container>
        )}

        {isReady && error && (
          <Container fluid className="dashboard-box mt-3">
            <Alert variant="danger">Error: {error}</Alert>
          </Container>
        )}

        {isReady && (
          <Container fluid className="dashboard-box mt-3">
            <div className="main-heading">
              <h3 className="mb-4 fw-bold">मुख्यमंत्री महिला पोषण योजना अवलोकन(डिमांड पैनल)</h3>
            </div>

            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body>
                <Row className="align-items-center g-3">
                  <Col md={5} sm={6} xs={12}>
                    <Form.Select
                      size="sm"
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                    >
                      <option value="">Select Financial Year</option>
                      <option value="2024-25">2024-25</option>
                      <option value="2025-26">2025-26</option>
                      <option value="2026-27">2026-27</option>
                    </Form.Select>
                  </Col>
                  <Col md={5} sm={6} xs={12}>
                    <Form.Select
                      size="sm"
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                    >
                      <option value="">Select Quarter to view report</option>
                      <option value="All">All Quarters</option>
                      <option value="Apr-May-June">First Quarter(Apr/May/June)</option>
                      <option value="July-Aug-Sept">Second Quarter(July/Aug/Sept)</option>
                      <option value="Oct-Nov-Dec">Third Quarter(Oct/Nov/Dec)</option>
                      <option value="Jan-Feb-March">Fourth Quarter(Jan/Feb/March)</option>
                    </Form.Select>
                  </Col>
                  <Col md={2} sm={12} xs={12}>
                    <Button variant="primary" size="sm" className="w-100" onClick={handleViewClick}>View</Button>
                  </Col>
                </Row>

                {(selectedFinYear || selectedQuarter) && (
                  <Row className="mt-3">
                    <Col>
                      <small className="text-muted">
                        Demand for the year : {selectedFinYear || "..."} and Quarter : {selectedQuarter || "..."}
                      </small>
                    </Col>
                  </Row>
                )}

                <Row className="mt-3">
                  <Col md={6} sm={12}>
                    <InputGroup size="sm">
                      <FormControl
                        placeholder="Search: S.no, District, Project name, Sector name, Financial Year..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button variant="primary">Search</Button>
                    </InputGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <h5 className="mb-3 fw-bold">Demand for the year : {selectedFinYear || "..."} and Quarter : {selectedQuarter || "..."}</h5>
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table striped bordered hover size="sm" className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>S.no</th>
                        <th>District</th>
                        <th>Project name</th>
                        <th>Sector name</th>
                        <th>Financial Year</th>
                        <th>Qtr Demand</th>
                        <th>Khajur Bene</th>
                        <th>Egg Bene</th>
                        <th>Not Cosume Egg Bene</th>
                        <th>CDPO Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>{renderDemandTable()}</tbody>
                  </Table>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white border-0 py-2">
                <small className="text-muted">Showing {totalItems === 0 ? 0 : startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries</small>
              </Card.Footer>
            </Card>
            {renderPagination()}
            {renderModal()}

            <h5 className="mb-3 fw-bold">Approve List By DPO</h5>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table striped bordered hover size="sm" className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>S.no</th>
                        <th>District</th>
                        <th>Project name</th>
                        <th>Sector name</th>
                        <th>Financial Year</th>
                        <th>Qtr Demand</th>
                        <th>Khajur Bene</th>
                        <th>Egg Bene</th>
                        <th>Not Cosume Egg Bene</th>
                        <th>CDPO Status</th>
                        <th>DIR Status (DPO)</th>
                      </tr>
                    </thead>
                    <tbody>{renderApprovalTable()}</tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
            {renderPagination()}
          </Container>
        )}
      </div>
    </div>
  );
};

export default DemandMahilaPoshanDistirct;
