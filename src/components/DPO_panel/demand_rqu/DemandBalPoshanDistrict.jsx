import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Table, Form, InputGroup, FormControl, Badge, Alert, Button, Pagination, Modal } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns, FaSearch, FaCheck } from "react-icons/fa";
import { useAuth } from "../../all_login/AuthContext";
import "../../../assets/css/supervisorleftnav.css";
import "../../../assets/css/cdpo.css";
import DPOHeader from "../DPOHeader";
import DPOLeftNav from "../DPOLeftNav";

const DemandBalPoshanDistrict = () => {
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

  const [currentPendingPage, setCurrentPendingPage] = useState(1);
  const [currentApprovedPage, setCurrentApprovedPage] = useState(1);
  const itemsPerPage = 10;

  const [editingId, setEditingId] = useState(null);
  const [editRemark, setEditRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    sector: true,
    fin_yr: true,
    qtr: true,
    kela: true,
    egg: true,
    non_egg: true,
    cdpo_status: true,
    dir_status: true,
  });

  const columns = [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "project", label: "Project name" },
    { key: "sector", label: "Sector name" },
    { key: "fin_yr", label: "Financial Year" },
    { key: "qtr", label: "Qtr Demand" },
    { key: "kela", label: "Kela Chips Bene" },
    { key: "egg", label: "Egg Bene" },
    { key: "non_egg", label: "Not Eat Egg Bene" },
    { key: "cdpo_status", label: "CDPO Status" },
    { key: "dir_status", label: "DIR Status (DPO)" },
  ];

  const handleCopy = async () => {
    if (filteredData.length === 0) return;
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    const mRows = filteredData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(item.district || "-");
      if (visibleColumns.project) row.push(item.project_name || "-");
      if (visibleColumns.sector) row.push(item.sector || "-");
      if (visibleColumns.fin_yr) row.push(item.fin_yr || "-");
      if (visibleColumns.qtr) row.push(item.qtr_dmd || "-");
      if (visibleColumns.kela) row.push(item.kela_chips_bene ?? "0");
      if (visibleColumns.egg) row.push(item.egg_bene ?? "0");
      if (visibleColumns.non_egg) row.push(item.not_eat_egg_bene ?? "0");
      if (visibleColumns.cdpo_status) row.push(item.cdpo_status || "-");
      if (visibleColumns.dir_status) row.push(item.dir_status || item.dpo_status || "-");
      return row.join("\t");
    });
    const text = "Bal Poshan District Demand Report\n" + [mHeaders.join("\t"), ...mRows].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) { console.error(err); }
  };

  const handleExcel = () => {
    if (filteredData.length === 0) return;
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    let csv = "Bal Poshan District Demand Report\n" + mHeaders.join(",") + "\n";
    filteredData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(`"${item.district || "-"}"`);
      if (visibleColumns.project) row.push(`"${item.project_name || "-"}"`);
      if (visibleColumns.sector) row.push(`"${item.sector || "-"}"`);
      if (visibleColumns.fin_yr) row.push(`"${item.fin_yr || "-"}"`);
      if (visibleColumns.qtr) row.push(`"${item.qtr_dmd || "-"}"`);
      if (visibleColumns.kela) row.push(item.kela_chips_bene ?? 0);
      if (visibleColumns.egg) row.push(item.egg_bene ?? 0);
      if (visibleColumns.non_egg) row.push(item.not_eat_egg_bene ?? 0);
      if (visibleColumns.cdpo_status) row.push(`"${item.cdpo_status || "-"}"`);
      if (visibleColumns.dir_status) row.push(`"${item.dir_status || item.dpo_status || "-"}"`);
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Bal_Poshan_District_Demand_Report.csv";
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
      if (visibleColumns.project) row += `<td>${item.project_name || "-"}</td>`;
      if (visibleColumns.sector) row += `<td>${item.sector || "-"}</td>`;
      if (visibleColumns.fin_yr) row += `<td>${item.fin_yr || "-"}</td>`;
      if (visibleColumns.qtr) row += `<td>${item.qtr_dmd || "-"}</td>`;
      if (visibleColumns.kela) row += `<td>${item.kela_chips_bene ?? 0}</td>`;
      if (visibleColumns.egg) row += `<td>${item.egg_bene ?? 0}</td>`;
      if (visibleColumns.non_egg) row += `<td>${item.not_eat_egg_bene ?? 0}</td>`;
      if (visibleColumns.cdpo_status) row += `<td>${item.cdpo_status || "-"}</td>`;
      if (visibleColumns.dir_status) row += `<td>${item.dir_status || item.dpo_status || "-"}</td>`;
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
          <h2>Bal Poshan District Demand Report</h2>
          <h4>FY: ${selectedFinYear || "All"} | Quarter: ${selectedQuarter || "All"}</h4>
          <table><thead><tr>${mHeaders}</tr></thead><tbody>${mRows}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
        const response = await api.get("/dpo-bp-demand/", { params });
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
      (item.sec_status || "").toLowerCase().includes(term)
    );
  });

  const pendingFilteredData = filteredData.filter((item) => {
    const s = (item.dir_status || "").toLowerCase();
    return s !== "approve" && s !== "approved" && s !== "rejected" && s !== "reject";
  });

  const statusFilteredData = filteredData.filter((item) => {
    const s = (item.dir_status || "").toLowerCase();
    return s === "approve" || s === "approved" || s === "rejected" || s === "reject";
  });

  const pendingTotalPages = Math.ceil(pendingFilteredData.length / itemsPerPage);
  const approvedTotalPages = Math.ceil(statusFilteredData.length / itemsPerPage);

  const pendingStartIndex = (currentPendingPage - 1) * itemsPerPage;
  const pendingPaginatedData = pendingFilteredData.slice(pendingStartIndex, pendingStartIndex + itemsPerPage);

  const approvedStartIndex = (currentApprovedPage - 1) * itemsPerPage;
  const statusPaginatedData = statusFilteredData.slice(approvedStartIndex, approvedStartIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPendingPage(1);
    setCurrentApprovedPage(1);
  }, [selectedFinYear, selectedQuarter, searchTerm]);

  const handleViewClick = () => {
    setCurrentPendingPage(1);
    setCurrentApprovedPage(1);
    setFetchKey((prev) => prev + 1);
  };

  const toggleActionInput = (mode, item) => {
    setPendingAction(mode);
    setEditingId(item.id);
    setEditRemark("");
  };

  const handleActionSubmit = async (mode, item) => {
    if (!api) return;
    if (mode === "Rejected" && !editRemark.trim()) {
      alert("Please enter a remark for rejection");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/dpo-bp-demand/`, {
        id: item.id,
        dir_status: mode === "approve" ? "Approved" : "Rejected",
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
          {visibleColumns.project && <td>{item.project_name}</td>}
          {visibleColumns.sector && <td>{item.sector}</td>}
          {visibleColumns.fin_yr && <td>{item.fin_yr}</td>}
          {visibleColumns.qtr && <td>{item.qtr_dmd}</td>}
          {visibleColumns.kela && <td>{item.kela_chips_bene ?? "0"}</td>}
          {visibleColumns.egg && <td>{item.egg_bene ?? "0"}</td>}
          {visibleColumns.non_egg && <td>{item.not_eat_egg_bene ?? "0"}</td>}
          {visibleColumns.cdpo_status && <td>{getStatusBadge(item.cdpo_status)}</td>}
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
      const actualIndex = approvedStartIndex + index + 1;
      return (
        <tr key={item.id ?? actualIndex}>
          {visibleColumns.sno && <td>{actualIndex}</td>}
          {visibleColumns.district && <td>{item.district}</td>}
          {visibleColumns.project && <td>{item.project_name}</td>}
          {visibleColumns.sector && <td>{item.sector}</td>}
          {visibleColumns.fin_yr && <td>{item.fin_yr}</td>}
          {visibleColumns.qtr && <td>{item.qtr_dmd}</td>}
          {visibleColumns.kela && <td>{item.kela_chips_bene ?? "0"}</td>}
          {visibleColumns.egg && <td>{item.egg_bene ?? "0"}</td>}
          {visibleColumns.non_egg && <td>{item.not_eat_egg_bene ?? "0"}</td>}
          {visibleColumns.cdpo_status && <td>{getStatusBadge(item.cdpo_status)}</td>}
          {visibleColumns.dir_status && <td>{getStatusBadge(item.dir_status || item.dpo_status)}</td>}
        </tr>
      );
    });
  };

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approve" || s === "approved") return <Badge bg="success">Approved</Badge>;
    if (s === "pending") return <Badge bg="warning">Pending</Badge>;
    if (s === "rejected" || s === "reject") return <Badge bg="danger">Rejected</Badge>;
    return <Badge bg="secondary">{status || "-"}</Badge>;
  };

  const renderPagination = (currentPage, totalPages, onPageChange) => {
    if (totalPages <= 1) return null;
    const items = [];
    items.push(<Pagination.First key="first" onClick={() => onPageChange(1)} disabled={currentPage === 1} />);
    items.push(<Pagination.Prev key="prev" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />);
    items.push(<Pagination.Item key={1} active={1 === currentPage} onClick={() => onPageChange(1)}>1</Pagination.Item>);
    if (totalPages > 1) {
      items.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <Pagination.Item key={i} active={i === currentPage} onClick={() => onPageChange(i)}>
            {i}
          </Pagination.Item>
        );
      }
      if (totalPages > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
      }
      items.push(<Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => onPageChange(totalPages)}>{totalPages}</Pagination.Item>);
    }
    items.push(<Pagination.Next key="next" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />);
    items.push(<Pagination.Last key="last" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} />);
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
              <h3 className="mb-4 fw-bold">मुख्यमंत्री बाल पोषण योजना अवलोकन(डिमांड पेनल)</h3>
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
                        {visibleColumns.sector && <th>Sector name</th>}
                        {visibleColumns.fin_yr && <th>Financial Year</th>}
                        {visibleColumns.qtr && <th>Qtr Demand</th>}
                        {visibleColumns.kela && <th>Kela Chips Bene</th>}
                        {visibleColumns.egg && <th>Egg Bene</th>}
                        {visibleColumns.non_egg && <th>Not Eat Egg Bene</th>}
                        {visibleColumns.cdpo_status && <th>CDPO Status</th>}
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>{renderDemandTable()}</tbody>
                  </Table>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white border-0 py-2">
                <small className="text-muted">Showing {pendingFilteredData.length === 0 ? 0 : pendingStartIndex + 1} to {Math.min(pendingStartIndex + itemsPerPage, pendingFilteredData.length)} of {pendingFilteredData.length} entries</small>
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
                        {visibleColumns.sector && <th>Sector name</th>}
                        {visibleColumns.fin_yr && <th>Financial Year</th>}
                        {visibleColumns.qtr && <th>Qtr Demand</th>}
                        {visibleColumns.kela && <th>Kela Chips Bene</th>}
                        {visibleColumns.egg && <th>Egg Bene</th>}
                        {visibleColumns.non_egg && <th>Not Eat Egg Bene</th>}
                        {visibleColumns.cdpo_status && <th>CDPO Status</th>}
                        {visibleColumns.dir_status && <th>DIR Status (DPO)</th>}
                      </tr>
                    </thead>
                    <tbody>{renderApprovalTable()}</tbody>
                  </Table>
                </div>
              </Card.Body>
              <Card.Footer className="bg-white border-0 py-2">
                <small className="text-muted">Showing {statusFilteredData.length === 0 ? 0 : approvedStartIndex + 1} to {Math.min(approvedStartIndex + itemsPerPage, statusFilteredData.length)} of {statusFilteredData.length} entries</small>
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

export default DemandBalPoshanDistrict;
