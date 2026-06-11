import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Form, InputGroup, FormControl, Badge, Alert, Button, Pagination } from "react-bootstrap";
import { useAuth } from "../../all_login/AuthContext";
import "../../../assets/css/supervisorleftnav.css";
import "../../../assets/css/cdpo.css";
import DPOHeader from "../DPOHeader";
import DPOLeftNav from "../DPOLeftNav";

const DemandAmritAnchalDistrict = () => {
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

  const [editingId, setEditingId] = useState(null);
  const [editRemark, setEditRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

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
        const response = await api.get("/dpo-am-demand/", { params });
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
      (item.qtr_dmd || "").toLowerCase().includes(term) ||
      (item.sdname || "").toLowerCase().includes(term) ||
      (item.sec_status || "").toLowerCase().includes(term) ||
      (item.avl_month || "").toLowerCase().includes(term)
    );
  });

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const pendingFilteredData = filteredData.filter((item) => {
    const s = (item.dir_status || "").toLowerCase();
    return s !== "approve" && s !== "approved" && s !== "rejected" && s !== "reject";
  });
  const pendingPaginatedData = pendingFilteredData.slice(startIndex, endIndex);

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

  const toggleActionInput = (mode, item) => {
    setPendingAction(mode);
    setEditingId(item.id);
    setEditRemark("");
  };

  const handleActionSubmit = async (mode, item) => {
    if (!api) return;
    if (mode === "Reject" && !editRemark.trim()) {
      alert("Please enter a remark for rejection");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/dpo-am-demand/`, {
        id: item.id,
        dir_status: mode === "approve" ? "Approve" : "Reject",
        dir_remark: editRemark.trim(),
      });
      setEditingId(null);
      setPendingAction(null);
      setEditRemark("");
      setFetchKey((prev) => prev + 1);
      alert(mode === "approve" ? "Approved successfully" : "Rejected successfully");
    } catch (err) {
      console.error("Action failed:", err);
      alert("Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setPendingAction(null);
    setEditRemark("");
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approve" || s === "approved") return <Badge bg="success">Approved</Badge>;
    if (s === "pending") return <Badge bg="warning">Pending</Badge>;
    if (s === "rejected" || s === "reject") return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="secondary">{status || "-"}</Badge>;
  };

  const renderDemandTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="11" className="text-center py-4">
            <Spinner animation="border" size="sm" /> Loading...
          </td>
        </tr>
      );
    }
    if (pendingPaginatedData.length === 0) {
      return (
        <tr>
          <td colSpan="11" className="text-center py-4 text-muted">No data available in table</td>
        </tr>
      );
    }
    return pendingPaginatedData.map((item, index) => {
      const actualIndex = startIndex + index + 1;
      return (
        <tr key={item.id ?? actualIndex}>
          <td>{actualIndex}</td>
          <td>{item.district}</td>
          <td>{item.project_name}</td>
          <td>{item.sector}</td>
          <td>{item.fin_yr}</td>
          <td>{item.qtr_dmd}</td>
          <td>{item.avl_month || "-"}</td>
          <td>{item.milk_bene ?? "0"}</td>
          <td>{item.avl_milk ?? "0"}</td>
          <td>{getStatusBadge(item.cdpo_status)}</td>
          <td>
            {editingId === item.id ? (
              <div className="d-flex flex-column gap-1">
                <FormControl
                  size="sm"
                  placeholder="Enter remark"
                  value={editRemark}
                  onChange={(e) => setEditRemark(e.target.value)}
                />
                <div className="d-flex gap-1">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => handleActionSubmit(pendingAction, item)}
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={handleCancel} disabled={submitting}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="d-flex gap-1">
                <Button
                  size="sm"
                  variant="outline-success"
                  onClick={() => toggleActionInput("approve", item)}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => toggleActionInput("reject", item)}
                >
                  Reject
                </Button>
              </div>
            )}
          </td>
        </tr>
      );
    });
  };

  const statusFilteredData = filteredData.filter((item) => {
    const s = (item.dir_status || "").toLowerCase();
    return s === "approve" || s === "approved" || s === "rejected" || s === "reject";
  });
  const statusPaginatedData = statusFilteredData.slice(startIndex, endIndex);

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
    if (statusPaginatedData.length === 0) {
      return (
        <tr>
          <td colSpan="11" className="text-center py-4 text-muted">No data available in table</td>
        </tr>
      );
    }
    return statusPaginatedData.map((item, index) => {
      const actualIndex = startIndex + index + 1;
      return (
        <tr key={item.id ?? actualIndex}>
          <td>{actualIndex}</td>
          <td>{item.district}</td>
          <td>{item.project_name}</td>
          <td>{item.sector}</td>
          <td>{item.fin_yr}</td>
          <td>{item.qtr_dmd}</td>
          <td>{item.avl_month || "-"}</td>
          <td>{item.milk_bene ?? "0"}</td>
          <td>{item.avl_milk ?? "0"}</td>
          <td>{getStatusBadge(item.cdpo_status)}</td>
          <td>{getStatusBadge(item.dir_status || item.dpo_status)}</td>
        </tr>
      );
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const items = [];
    items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1} />);
    items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />);
    items.push(<Pagination.Item key={1} active={1 === currentPage} onClick={() => handlePageChange(1)}>1</Pagination.Item>);
    if (totalPages > 1) {
      items.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <Pagination.Item key={i} active={i === currentPage} onClick={() => handlePageChange(i)}>
            {i}
          </Pagination.Item>
        );
      }
      if (totalPages > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
      }
      items.push(<Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => handlePageChange(totalPages)}>{totalPages}</Pagination.Item>);
    }
    items.push(<Pagination.Next key="next" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />);
    items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />);
    return (
      <div className="d-flex justify-content-center mt-3">
        <Pagination>{items}</Pagination>
      </div>
    );
  };

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

            <h5 className="mb-3 fw-bold">Demand List</h5>
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
                        <th>Avl Month</th>
                        <th>Milk Bene</th>
                        <th>Avl Milk</th>
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

            <h5 className="mb-3 fw-bold">Approved and Rejected</h5>
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
                        <th>Kela Chips Bene</th>
                        <th>Egg Bene</th>
                        <th>Not Eat Egg Bene</th>
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

export default DemandAmritAnchalDistrict;
