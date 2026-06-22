import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Table, Form, InputGroup, FormControl, Badge, Alert, Button, Pagination, Modal } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns } from "react-icons/fa";
import { useAuth } from "../../all_login/AuthContext";
import "../../../assets/css/supervisorleftnav.css";
import "../../../assets/css/cdpo.css";
import DPOHeader from "../DPOHeader";
import DPOLeftNav from "../DPOLeftNav";

const DEMAND_API = "dpo/mahalaxmi-demand/";
const ITEMS_PER_PAGE = 10;

const DemandMahalakshmi = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFinYear, setSelectedFinYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("");
  const [fetchKey, setFetchKey] = useState(1);
  const [demandData, setDemandData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [currentPendingPage, setCurrentPendingPage] = useState(1);
  const [currentApprovedPage, setCurrentApprovedPage] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    fin_year: true,
    bene: true,
    req_kit: true,
    quarter: true,
    demand_date: true,
    dpo_status: true,
  });

  const columns = [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "project", label: "Project name" },
    { key: "fin_year", label: "Financial Year" },
    { key: "bene", label: "Bene" },
    { key: "req_kit", label: "Req Kit" },
    { key: "quarter", label: "Quarter" },
    { key: "demand_date", label: "Demand Date" },
    { key: "dpo_status", label: "DPO Status" },
  ];

  const { api, isReady } = useAuth();

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
    if (!api || !isReady) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {};
        if (selectedFinYear) params.fin_year = selectedFinYear;
        if (selectedQuarter && selectedQuarter !== "All") params.quarter = selectedQuarter;

        const response = await api.get(DEMAND_API, { params });
        if (cancelled) return;

        const payload = response.data;
        let data = [];

        if (Array.isArray(payload?.[0])) {
          data = payload[0];
        } else if (Array.isArray(payload)) {
          data = payload;
        } else if (payload?.results) {
          data = Array.isArray(payload.results?.[0]) ? payload.results[0] : payload.results;
        }

        setDemandData(Array.isArray(data) ? data : []);
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
    return () => {
      cancelled = true;
    };
  }, [api, isReady, selectedFinYear, selectedQuarter, fetchKey]);

  const filteredData = demandData.filter((item) => {
    if (selectedFinYear && item.fin_year !== selectedFinYear) return false;
    if (selectedQuarter && selectedQuarter !== "All" && item.quarter !== selectedQuarter) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.district || "").toLowerCase().includes(term) ||
      (item.project || "").toLowerCase().includes(term) ||
      (item.fin_year || "").toLowerCase().includes(term) ||
      (item.bene || "").toLowerCase().includes(term) ||
      (item.req_kit || "").toLowerCase().includes(term) ||
      (item.quarter || "").toLowerCase().includes(term) ||
      (item.dpo_status || "").toLowerCase().includes(term)
    );
  });

  const isPendingStatus = (status) => {
    const s = (status || "").toLowerCase();
    return s !== "approve" && s !== "approved" && s !== "reject" && s !== "rejected";
  };

  const isApprovedOrRejected = (status) => {
    const s = (status || "").toLowerCase();
    return s === "approve" || s === "approved" || s === "reject" || s === "rejected";
  };

  const pendingFilteredData = filteredData.filter((item) => isPendingStatus(item.dpo_status));
  const approvedFilteredData = filteredData.filter((item) => isApprovedOrRejected(item.dpo_status));

  const pendingTotalItems = pendingFilteredData.length;
  const approvedTotalItems = approvedFilteredData.length;
  const pendingTotalPages = Math.ceil(pendingTotalItems / ITEMS_PER_PAGE);
  const approvedTotalPages = Math.ceil(approvedTotalItems / ITEMS_PER_PAGE);

  const pendingStartIndex = (currentPendingPage - 1) * ITEMS_PER_PAGE;
  const pendingEndIndex = pendingStartIndex + ITEMS_PER_PAGE;
  const pendingPaginatedData = pendingFilteredData.slice(pendingStartIndex, pendingEndIndex);

  const approvedStartIndex = (currentApprovedPage - 1) * ITEMS_PER_PAGE;
  const approvedEndIndex = approvedStartIndex + ITEMS_PER_PAGE;
  const approvedPaginatedData = approvedFilteredData.slice(approvedStartIndex, approvedEndIndex);

  useEffect(() => {
    setCurrentPendingPage(1);
    setCurrentApprovedPage(1);
  }, [searchTerm, selectedFinYear, selectedQuarter]);

  useEffect(() => {
    if (currentPendingPage > pendingTotalPages && pendingTotalPages > 0) {
      setCurrentPendingPage(pendingTotalPages);
    }
  }, [currentPendingPage, pendingTotalPages]);

  useEffect(() => {
    if (currentApprovedPage > approvedTotalPages && approvedTotalPages > 0) {
      setCurrentApprovedPage(approvedTotalPages);
    }
  }, [currentApprovedPage, approvedTotalPages]);

  const handleViewClick = () => {
    setCurrentPendingPage(1);
    setCurrentApprovedPage(1);
    setFetchKey((prev) => prev + 1);
  };

  const toggleActionInput = (mode, item) => {
    setPendingAction(mode);
    setEditingId(item.id);
  };

  const handleActionSubmit = async (mode, item) => {
    if (!api) return;

    setSubmitting(true);
    try {
      await api.put(DEMAND_API, {
        id: item.id,
        dpo_status: mode === "approve" ? "Approve" : "Reject",
      });
      setEditingId(null);
      setPendingAction(null);
      const updatedStatus = mode === "approve" ? "Approve" : "Reject";
      const updatedData = demandData.map((row) =>
        row.id === item.id
          ? { ...row, dpo_status: updatedStatus, dpo_date: row.dpo_date || new Date().toISOString().slice(0, 19).replace("T", " ") }
          : row
      );

      setDemandData(updatedData);
      alert(mode === "approve" ? "Approved successfully" : "Rejected successfully");
    } catch (err) {
      console.error("Action failed:", err);
      alert("Action failed. Please try again.");
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approve" || s === "approved") return <Badge bg="success">Approved</Badge>;
    if (s === "pending") return <Badge bg="warning">Pending</Badge>;
    if (s === "rejected" || s === "reject") return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="secondary">{status || "-"}</Badge>;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("en-IN");
  };

  const handleCopy = async () => {
    if (filteredData.length === 0) return;
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    const mRows = filteredData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(item.district || "-");
      if (visibleColumns.project) row.push(item.project || "-");
      if (visibleColumns.fin_year) row.push(item.fin_year || "-");
      if (visibleColumns.bene) row.push(item.bene ?? "0");
      if (visibleColumns.req_kit) row.push(item.req_kit ?? "0");
      if (visibleColumns.quarter) row.push(item.quarter || "-");
      if (visibleColumns.demand_date) row.push(formatDate(item.demand_date));
      if (visibleColumns.dpo_status) row.push(item.dpo_status || "-");
      return row.join("\t");
    });
    const text = "Mahalakshmi Kit Demand Report\n" + [mHeaders.join("\t"), ...mRows].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) { console.error(err); }
  };

  const handleExcel = () => {
    if (filteredData.length === 0) return;
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    let csv = "Mahalakshmi Kit Demand Report\n" + mHeaders.join(",") + "\n";
    filteredData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(`"${item.district || "-"}"`);
      if (visibleColumns.project) row.push(`"${item.project || "-"}"`);
      if (visibleColumns.fin_year) row.push(`"${item.fin_year || "-"}"`);
      if (visibleColumns.bene) row.push(item.bene ?? 0);
      if (visibleColumns.req_kit) row.push(item.req_kit ?? 0);
      if (visibleColumns.quarter) row.push(`"${item.quarter || "-"}"`);
      if (visibleColumns.demand_date) row.push(`"${formatDate(item.demand_date)}"`);
      if (visibleColumns.dpo_status) row.push(`"${item.dpo_status || "-"}"`);
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Mahalakshmi_Kit_Demand_Report.csv";
    link.click();
  };

  const handlePDF = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => `<th>${c.label}</th>`).join("");
    const mRows = filteredData.map((item, idx) => {
      let row = "<tr>";
      if (visibleColumns.sno) row += `<td>${idx + 1}</td>`;
      if (visibleColumns.district) row += `<td>${item.district || "-"}</td>`;
      if (visibleColumns.project) row += `<td>${item.project || "-"}</td>`;
      if (visibleColumns.fin_year) row += `<td>${item.fin_year || "-"}</td>`;
      if (visibleColumns.bene) row += `<td>${item.bene ?? 0}</td>`;
      if (visibleColumns.req_kit) row += `<td>${item.req_kit ?? 0}</td>`;
      if (visibleColumns.quarter) row += `<td>${item.quarter || "-"}</td>`;
      if (visibleColumns.demand_date) row += `<td>${formatDate(item.demand_date)}</td>`;
      if (visibleColumns.dpo_status) row += `<td>${item.dpo_status || "-"}</td>`;
      row += "</tr>";
      return row;
    }).join("");
    printWindow.document.write(`
      <html>
        <head><title>Report</title><style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
          h2, h4 { text-align: center; font-family: sans-serif; }
        </style></head>
        <body>
          <h2>Mahalakshmi Kit Demand Report</h2>
          <h4>FY: ${selectedFinYear || "All"} | Quarter: ${selectedQuarter || "All"}</h4>
          <table><thead><tr>${mHeaders}</tr></thead><tbody>${mRows}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
    if (pendingPaginatedData.length === 0) {
      return (
        <tr>
          <td colSpan="10" className="text-center py-4 text-muted">No data available in table</td>
        </tr>
      );
    }
    return pendingPaginatedData.map((item, index) => {
      const actualIndex = pendingStartIndex + index + 1;
      return (
        <tr key={item.id ?? actualIndex}>
          {visibleColumns.sno && <td>{actualIndex}</td>}
          {visibleColumns.district && <td>{item.district}</td>}
          {visibleColumns.project && <td>{item.project}</td>}
          {visibleColumns.fin_year && <td>{item.fin_year}</td>}
          {visibleColumns.bene && <td>{item.bene ?? "0"}</td>}
          {visibleColumns.req_kit && <td>{item.req_kit ?? "0"}</td>}
          {visibleColumns.quarter && <td>{item.quarter}</td>}
          {visibleColumns.demand_date && <td>{formatDate(item.demand_date)}</td>}
          {visibleColumns.dpo_status && <td>{getStatusBadge(item.dpo_status)}</td>}
          <td>
            {editingId === item.id ? (
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
            ) : (
              <div className="d-flex gap-1">
                <Button size="sm" variant="outline-success" onClick={() => toggleActionInput("approve", item)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline-danger" onClick={() => toggleActionInput("reject", item)}>
                  Reject
                </Button>
              </div>
            )}
          </td>
        </tr>
      );
    });
  };

  const renderApprovalTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="9" className="text-center py-4">
            <Spinner animation="border" size="sm" /> Loading...
          </td>
        </tr>
      );
    }
    if (approvedPaginatedData.length === 0) {
      return (
        <tr>
          <td colSpan="9" className="text-center py-4 text-muted">No data available in table</td>
        </tr>
      );
    }
    return approvedPaginatedData.map((item, index) => {
      const actualIndex = approvedStartIndex + index + 1;
      return (
        <tr key={item.id ?? actualIndex}>
          {visibleColumns.sno && <td>{actualIndex}</td>}
          {visibleColumns.district && <td>{item.district}</td>}
          {visibleColumns.project && <td>{item.project}</td>}
          {visibleColumns.fin_year && <td>{item.fin_year}</td>}
          {visibleColumns.bene && <td>{item.bene ?? "0"}</td>}
          {visibleColumns.req_kit && <td>{item.req_kit ?? "0"}</td>}
          {visibleColumns.quarter && <td>{item.quarter}</td>}
          {visibleColumns.demand_date && <td>{formatDate(item.dpo_date || item.update_on)}</td>}
          {visibleColumns.dpo_status && <td>{getStatusBadge(item.dpo_status)}</td>}
        </tr>
      );
    });
  };

  const renderPagination = (currentPage, totalPages, setCurrentPage) => {
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-center mt-3">
        <Pagination>
          <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
          <Pagination.Prev onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
          {Array.from({ length: totalPages }, (_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => setCurrentPage(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          />
          <Pagination.Last
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
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
              <h3 className="mb-4 fw-bold">मुख्यमंत्री महालक्ष्मी किट योजना अवलोकन(डिमांड पेनल)</h3>
            </div>

            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body>
                <Row className="align-items-center g-3">
                  <Col md={3} sm={6} xs={12}>
                    <Form.Select
                      size="sm"
                      value={selectedFinYear}
                      onChange={(e) => setSelectedFinYear(e.target.value)}
                    >
                      <option value="">Select Financial Year</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2025-2026">2025-2026</option>
                      <option value="2026-2027">2026-2027</option>
                    </Form.Select>
                  </Col>
                  <Col md={3} sm={6} xs={12}>
                    <Form.Select
                      size="sm"
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                    >
                      <option value="">Select Quarter</option>
                      <option value="All">All Quarters</option>
                      <option value="Apr-May-Jun">Apr-May-Jun</option>
                      <option value="Jul-Aug-Sep">Jul-Aug-Sep</option>
                      <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                      <option value="Jan-Feb-Mar">Jan-Feb-Mar</option>
                    </Form.Select>
                  </Col>
                  <Col md={2} sm={12} xs={12}>
                    <Button variant="primary" size="sm" className="w-100" onClick={handleViewClick}>
                      View
                    </Button>
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
                        placeholder="Search: S.no, District, Project name, Financial Year, Quarter..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <Button variant="primary">Search</Button>
                    </InputGroup>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Row className="mb-3 align-items-center">
              <Col md={6} className="d-flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleCopy}>{copySuccess ? <Badge bg="success">Copied!</Badge> : <><FaCopy className="me-1" /> Copy</>}</Button>
                <Button variant="secondary" size="sm" onClick={handleExcel}><FaFileExcel className="me-1" /> Excel</Button>
                <Button variant="secondary" size="sm" onClick={handlePDF}><FaFilePdf className="me-1" /> PDF</Button>
                <Button variant="secondary" size="sm" onClick={() => setShowColumnModal(true)}><FaColumns className="me-1" /> Column visibility</Button>
              </Col>
            </Row>

            <h5 className="mb-3 fw-bold">Demand List</h5>
            <Card className="mb-4 border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table striped bordered hover size="sm" className="mb-0" ref={tableRef}>
                    <thead className="table-light">
                      <tr>
                        {visibleColumns.sno && <th>S.no</th>}
                        {visibleColumns.district && <th>District</th>}
                        {visibleColumns.project && <th>Project name</th>}
                        {visibleColumns.fin_year && <th>Financial Year</th>}
                        {visibleColumns.bene && <th>Bene</th>}
                        {visibleColumns.req_kit && <th>Req Kit</th>}
                        {visibleColumns.quarter && <th>Quarter</th>}
                        {visibleColumns.demand_date && <th>Demand Date</th>}
                        {visibleColumns.dpo_status && <th>DPO Status</th>}
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>{renderDemandTable()}</tbody>
                  </Table>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white border-0 py-2">
                <small className="text-muted">
                  Showing {pendingTotalItems === 0 ? 0 : pendingStartIndex + 1} to {Math.min(pendingEndIndex, pendingTotalItems)} of {pendingTotalItems} entries
                </small>
              </Card.Footer>
            </Card>
            {renderPagination(currentPendingPage, pendingTotalPages, setCurrentPendingPage)}

            <h5 className="mb-3 fw-bold">Approved and Rejected</h5>
            <Card className="border-0 shadow-sm">
              <Card.Body className="p-0">
                <div className="table-responsive">
                  <Table striped bordered hover size="sm" className="mb-0">
                    <thead className="table-light">
                      <tr>
                        {visibleColumns.sno && <th>S.no</th>}
                        {visibleColumns.district && <th>District</th>}
                        {visibleColumns.project && <th>Project name</th>}
                        {visibleColumns.fin_year && <th>Financial Year</th>}
                        {visibleColumns.bene && <th>Bene</th>}
                        {visibleColumns.req_kit && <th>Req Kit</th>}
                        {visibleColumns.quarter && <th>Quarter</th>}
                        {visibleColumns.demand_date && <th>DPO Date</th>}
                        {visibleColumns.dpo_status && <th>DPO Status</th>}
                      </tr>
                    </thead>
                    <tbody>{renderApprovalTable()}</tbody>
                  </Table>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white border-0 py-2">
                <small className="text-muted">
                  Showing {approvedTotalItems === 0 ? 0 : approvedStartIndex + 1} to {Math.min(approvedEndIndex, approvedTotalItems)} of {approvedTotalItems} entries
                </small>
              </Card.Footer>
            </Card>
            {renderPagination(currentApprovedPage, approvedTotalPages, setCurrentApprovedPage)}
          </Container>
        )}
      </div>

      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '16px' }}>Column Visibility</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Check 
            type="checkbox" 
            label="Select All" 
            className="mb-2 fw-bold border-bottom pb-2"
            checked={Object.values(visibleColumns).every(val => val)}
            onChange={(e) => {
              const isChecked = e.target.checked;
              const newVisibility = {};
              columns.forEach(col => {
                newVisibility[col.key] = isChecked;
              });
              setVisibleColumns(newVisibility);
            }}
          />
          {columns.map(col => (
            <Form.Check 
              key={col.key} type="checkbox" label={col.label}
              checked={visibleColumns[col.key]}
              onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
            />
          ))}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DemandMahalakshmi;
