import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Form, InputGroup, FormControl, Badge, Modal, Alert } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns } from "react-icons/fa";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";
import "../../../../assets/css/cdpo.css";
import CDPOLeftNav from "../../CDPOLeftNav";
import CDPOHeader from "../../CDPOHeader";

const DemandMahilaPoshanProject = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [demandData, setDemandData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editRemark, setEditRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    khajur: true,
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
    { key: "khajur", label: "Khajur Bene" },
    { key: "egg", label: "Egg Bene" },
    { key: "non_egg", label: "Not Cosume Egg Bene" },
    { key: "cdpo_status", label: "CDPO Status" },
    { key: "dir_status", label: "DIR Status (DPO)" },
  ];

  // Define filtered lists for tables and exports (only Pending for first table)
  const filteredData = demandData.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.district || "").toLowerCase().includes(term) ||
      (item.project_name || "").toLowerCase().includes(term) ||
      (item.sector || "").toLowerCase().includes(term) ||
      (item.fin_yr || "").toLowerCase().includes(term) ||
      (item.qtr_dmd || "").toLowerCase().includes(term) ||
      String(item.id || "").toLowerCase().includes(term)
    );
  });

  const pendingData = filteredData.filter((item) => item.cdpo_status === "Pending");
  const approvedData = filteredData.filter((item) => (item.cdpo_status || "").toLowerCase() === "approve");

  // New state for export alerts
  const [showExportAlert, setShowExportAlert] = useState(false);
  const [exportAlertMessage, setExportAlertMessage] = useState("");

  const handleExportNoData = (message) => {
    setExportAlertMessage(message);
    setShowExportAlert(true);
    setTimeout(() => setShowExportAlert(false), 3000); // Hide after 3 seconds
  };

  const handleCopy = async () => {
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    const mRows = pendingData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(item.district || "-");
      if (visibleColumns.project) row.push(item.project_name || "-");
      if (visibleColumns.sector) row.push(item.sector || "-");
      if (visibleColumns.fin_yr) row.push(item.fin_yr || "-");
      if (visibleColumns.qtr) row.push(item.qtr_dmd || "-");
      if (visibleColumns.khajur) row.push(item.khajur_bene ?? "0");
      if (visibleColumns.egg) row.push(item.egg_bene ?? "0");
      if (visibleColumns.non_egg) row.push(item.tot_noteat_egg_bene ?? "0");
      if (visibleColumns.cdpo_status) row.push(item.cdpo_status || "-");
      if (visibleColumns.dir_status) row.push(item.dir_status || "-");
      return row.join("\t");
    });
    const text = "Mahila Poshan Project Demand Report\n" + [mHeaders.join("\t"), ...mRows].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000); // Hide "Copied!" badge
    } catch (err) {
      console.error(err);
      handleExportNoData("Failed to copy data. Please try again.");
    }
  };

  const handleExcel = () => {
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    let csv = "Mahila Poshan Project Demand Report\n" + mHeaders.join(",") + "\n";
    pendingData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(`"${item.district || "-"}"`);
      if (visibleColumns.project) row.push(`"${item.project_name || "-"}"`);
      if (visibleColumns.sector) row.push(`"${item.sector || "-"}"`);
      if (visibleColumns.fin_yr) row.push(`"${item.fin_yr || "-"}"`);
      if (visibleColumns.qtr) row.push(`"${item.qtr_dmd || "-"}"`);
      if (visibleColumns.khajur) row.push(item.khajur_bene ?? 0);
      if (visibleColumns.egg) row.push(item.egg_bene ?? 0);
      if (visibleColumns.non_egg) row.push(item.tot_noteat_egg_bene ?? 0);
      if (visibleColumns.cdpo_status) row.push(`"${item.cdpo_status || "-"}"`);
      if (visibleColumns.dir_status) row.push(`"${item.dir_status || "-"}"`);
      csv += row.join(",") + "\n";
    });
    if (pendingData.length === 0) {
      csv += "No data available in table\n";
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Mahila_Poshan_Project_Demand_Report.csv";
    link.click();
  };

  const handlePDF = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) {
      handleExportNoData("Pop-up blocked! Please allow pop-ups for this site to generate PDF.");
      return;
    }
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => `<th>${c.label}</th>`).join("");
    const mRows = pendingData.length > 0 ? pendingData.map((item, idx) => {
      let row = "<tr>";
      columns.filter(c => visibleColumns[c.key]).forEach(col => {
        let val = "-";
        if (col.key === "sno") val = idx + 1;
        else if (col.key === "district") val = item.district;
        else if (col.key === "project") val = item.project_name;
        else if (col.key === "sector") val = item.sector;
        else if (col.key === "fin_yr") val = item.fin_yr;
        else if (col.key === "qtr") val = item.qtr_dmd;
        else if (col.key === "khajur") val = item.khajur_bene ?? 0;
        else if (col.key === "egg") val = item.egg_bene ?? 0;
        else if (col.key === "non_egg") val = item.tot_noteat_egg_bene ?? 0;
        else if (col.key === "cdpo_status") val = item.cdpo_status;
        else if (col.key === "dir_status") val = item.dir_status;
        row += `<td>${val || "-"}</td>`;
      });
      row += "</tr>";
      return row;
    }).join("") : `<tr><td colspan="${columns.filter(c => visibleColumns[c.key]).length}" style="text-align:center; padding: 20px;">No data available in table</td></tr>`;
    printWindow.document.write(`
      <html>
        <head><title>Report</title><style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
          h2 { text-align: center; font-family: sans-serif; }
        </style></head>
        <body>
          <h2>Mahila Poshan Project Demand Report</h2>
          <table><thead><tr>${mHeaders}</tr></thead><tbody>${mRows}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
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
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/cdpo-mp-demand/");
      setDemandData(response.data || []);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [api]);

  const handleActionClick = (id, status) => {
    setEditingId(id);
    setEditRemark("");
  };

  const handleActionSubmit = async (id, status) => {
    if (!editRemark.trim()) {
      alert("Please enter a remark");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/cdpo-mp-demand/`, {
        id: id,
        remark_cdpo: editRemark.trim(),
        cdpo_status: status,
      });
      setEditingId(null);
      setEditRemark("");
      fetchData();
    } catch (err) {
      console.error("Action failed:", err);
      alert("Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditRemark("");
  };

  const getStatusBadge = (status) => {
    if (status === "Approve") return <Badge bg="success">Approve</Badge>;
    if (status === "Pending") return <Badge bg="warning">Pending</Badge>;
    if (status === "Rejected") return <Badge bg="danger">Reject</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
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
    if (pendingData.length === 0) {
      return (
        <tr>
          <td colSpan="11" className="text-center py-4 text-muted">No data available in table</td>
        </tr>
      );
    }
    return pendingData.map((item, index) => (
      <tr key={item.id}>
        {visibleColumns.sno && <td>{index + 1}</td>}
        {visibleColumns.district && <td>{item.district}</td>}
        {visibleColumns.project && <td>{item.project_name}</td>}
        {visibleColumns.sector && <td>{item.sector}</td>}
        {visibleColumns.fin_yr && <td>{item.fin_yr}</td>}
        {visibleColumns.qtr && <td>{item.qtr_dmd}</td>}
        {visibleColumns.khajur && <td>{item.khajur_bene || "0"}</td>}
        {visibleColumns.egg && <td>{item.egg_bene || "0"}</td>}
        {visibleColumns.non_egg && <td>{item.tot_noteat_egg_bene || "0"}</td>}
        <td>{getStatusBadge(item.sec_status || item.cdpo_status)}</td>
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
                  onClick={() => handleActionSubmit(item.id, "Approve")}
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
                onClick={() => handleActionClick(item.id, "Approve")}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                  onClick={() => handleActionClick(item.id, "Rejected")}
              >
                Reject
              </Button>
            </div>
          )}
        </td>
      </tr>
    ));
  };

  const renderApprovalTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="12" className="text-center py-4">
            <Spinner animation="border" size="sm" /> Loading...
          </td>
        </tr>
      );
    }
    if (approvedData.length === 0) {
      return (
        <tr>
          <td colSpan="12" className="text-center py-4 text-muted">No approved records found</td>
        </tr>
      );
    }
    return approvedData.map((item, index) => (
      <tr key={item.id}>
        {visibleColumns.sno && <td>{index + 1}</td>}
        {visibleColumns.district && <td>{item.district}</td>}
        {visibleColumns.project && <td>{item.project_name}</td>}
        {visibleColumns.sector && <td>{item.sector}</td>}
        {visibleColumns.fin_yr && <td>{item.fin_yr}</td>}
        {visibleColumns.qtr && <td>{item.qtr_dmd}</td>}
        {visibleColumns.khajur && <td>{item.khajur_bene || "0"}</td>}
        {visibleColumns.egg && <td>{item.egg_bene || "0"}</td>}
        {visibleColumns.non_egg && <td>{item.tot_noteat_egg_bene || "0"}</td>}
        {visibleColumns.cdpo_status && <td>{getStatusBadge(item.cdpo_status)}</td>}
        {visibleColumns.dir_status && <td>{getStatusBadge(item.dir_status)}</td>}
        <td>-</td>
      </tr>
    ));
  };

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

        <Container fluid className="dashboard-box mt-3">
          <div className="main-heading">
            <h3 className="mb-4 fw-bold">
              मुख्यमंत्री महिला पोषण योजना अवलोकन(डिमांड पैनल)
            </h3>
          </div>

          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <Row className="align-items-center g-3">
                <Col md={4} sm={6} xs={12}>
                  <h6 className="mb-0 fw-semibold">Almora/Bhaisiyachana</h6>
                </Col>
                <Col md={4} sm={6} xs={12}>
                  <span className="badge bg-warning text-dark fs-6 px-3 py-2">Demand from Supervisor(Pending)</span>
                </Col>
                <Col md={4} sm={12} xs={12}>
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

          {showExportAlert && (
            <Alert variant="info" onClose={() => setShowExportAlert(false)} dismissible>
              {exportAlertMessage}
            </Alert>
          )}

          <Row className="mb-3 align-items-center">
            <Col md={6} className="d-flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleCopy}>{copySuccess ? <Badge bg="success">Copied!</Badge> : <><FaCopy className="me-1" /> Copy</>}</Button>
              <Button variant="secondary" size="sm" onClick={handleExcel}><FaFileExcel className="me-1" /> Excel</Button>
              <Button variant="secondary" size="sm" onClick={handlePDF}><FaFilePdf className="me-1" /> PDF</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowColumnModal(true)}><FaColumns className="me-1" /> Column visibility</Button>
            </Col>
          </Row>

          {error && <div className="alert alert-danger">{error}</div>}

          <h5 className="mb-3 fw-bold">Demand Panel</h5>
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
                      {visibleColumns.khajur && <th>Khajur Bene</th>}
                      {visibleColumns.egg && <th>Egg Bene</th>}
                      {visibleColumns.non_egg && <th>Not Cosume Egg Bene</th>}
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>{renderDemandTable()}</tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white border-0 py-2">
              <small className="text-muted">Showing {pendingData.length} entries</small>
            </Card.Footer>
          </Card>

          <h5 className="mb-3 fw-bold">Approve List By CDPO</h5>
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
                      {visibleColumns.khajur && <th>Khajur Bene</th>}
                      {visibleColumns.egg && <th>Egg Bene</th>}
                      {visibleColumns.non_egg && <th>Not Cosume Egg Bene</th>}
                      {visibleColumns.cdpo_status && <th>CDPO Status</th>}
                      {visibleColumns.dir_status && <th>DPO Status</th>}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>{renderApprovalTable()}</tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>
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
              columns.forEach(col => { newVisibility[col.key] = isChecked; });
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

export default DemandMahilaPoshanProject;
