import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, InputGroup, Table, Pagination, Badge, Alert, Modal } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns, FaSearch, FaExpand, FaBell, FaSignOutAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DirectorLeftNav from "../../DirectorLeftNav";
import DirectorHeader from "../../DirectorHeader";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";
import "../../../../assets/css/dashboard.css";

const DirMahilaPoshanDemandDist = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api, isReady } = useAuth();
  const [tableData, setTableData] = useState([]);
  const [viewMode, setViewMode] = useState("demand"); // "demand" or "distribution"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter & Search State
  const [financialYear, setFinancialYear] = useState("2025-26");
  const [quarter, setQuarter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // UI State
  const tableRef = useRef(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    quarter: true,
    khajur: true,
    egg: true,
    non_egg: true,
    total_demand: true,
    total_distribution: true,
  });

  const columns = viewMode === "demand" ? [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "quarter", label: "Quarter" },
    { key: "khajur", label: "Khajur Beneficiary" },
    { key: "egg", label: "Egg Eating Beneficiary" },
    { key: "non_egg", label: "Non Egg Eating Beneficiary" },
  ] : [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "quarter", label: "Month" },
    { key: "total_demand", label: "Total Demand" },
    { key: "total_distribution", label: "Total Distribution" },
  ];

  const fetchData = useCallback(async () => {
    if (!api || !isReady) return;
    setLoading(true);
    setError(null);
    try {
      const endpoint = viewMode === "demand" 
        ? "director/mp-district-wise-demand/" 
        : "director/mp-demand-distribution-district-wise/";
      
      const response = await api.get(endpoint);
      if (response.data && response.data.success) {
        setTableData(response.data.data || []);
      }
    } catch (err) {
      setError("Failed to fetch data from the server.");
    } finally {
      setLoading(false);
    }
  }, [api, isReady, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData, viewMode]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const processedData = useMemo(() => {
    let filtered = tableData.filter(item => {
      const matchesYear = financialYear === "All" || item.financial_year === financialYear;
      const matchesSearch = !searchTerm || 
        item.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.quarter?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesYear && matchesSearch;
    });

    if (quarter === "All") {
      const grouped = filtered.reduce((acc, curr) => {
        const dist = curr.district || "Unknown";
        if (!acc[dist]) {
          acc[dist] = { 
            ...curr, 
            quarter: "All",
            khajur_beneficiary: 0, 
            egg_eating_beneficiary: 0, 
            non_egg_eating_beneficiary: 0,
            demand_khajur_beneficiary: 0,
            distributed_khajur_beneficiary: 0
          };
        }
        acc[dist].khajur_beneficiary += Number(curr.khajur_beneficiary || 0);
        acc[dist].egg_eating_beneficiary += Number(curr.egg_eating_beneficiary || 0);
        acc[dist].non_egg_eating_beneficiary += Number(curr.non_egg_eating_beneficiary || 0);
        acc[dist].demand_khajur_beneficiary += Number(curr.demand_khajur_beneficiary || 0);
        acc[dist].distributed_khajur_beneficiary += Number(curr.distributed_khajur_beneficiary || 0);
        return acc;
      }, {});
      return Object.values(grouped);
    }

    return filtered.filter(item => item.quarter === quarter);
  }, [tableData, financialYear, quarter, searchTerm]);

  const totals = useMemo(() => {
    return processedData.reduce((acc, curr) => {
      if (viewMode === "demand") {
        acc.khajur += Number(curr.khajur_beneficiary || 0);
        acc.egg += Number(curr.egg_eating_beneficiary || 0);
        acc.non_egg += Number(curr.non_egg_eating_beneficiary || 0);
      } else {
        acc.total_demand += Number(curr.demand_khajur_beneficiary || 0);
        acc.total_distribution += Number(curr.distributed_khajur_beneficiary || 0);
      }
      return acc;
    }, { khajur: 0, egg: 0, non_egg: 0, total_demand: 0, total_distribution: 0 });
  }, [processedData, viewMode]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCopy = async () => {
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    const mRows = processedData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(item.district || "-");
      if (visibleColumns.quarter) row.push(item.quarter || "-");
      if (viewMode === "demand") {
        if (visibleColumns.khajur) row.push(item.khajur_beneficiary || 0);
        if (visibleColumns.egg) row.push(item.egg_eating_beneficiary || 0);
        if (visibleColumns.non_egg) row.push(item.non_egg_eating_beneficiary || 0);
      } else {
        if (visibleColumns.total_demand) row.push(item.demand_khajur_beneficiary || 0);
        if (visibleColumns.total_distribution) row.push(item.distributed_khajur_beneficiary || 0);
      }
      return row.join("\t");
    });
    const text = [`Mahila Poshan ${viewMode === "demand" ? "Demand" : "Distribution"} Data | District wise`, mHeaders.join("\t"), ...mRows].join("\n");
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExcel = () => {
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    let csv = `Mahila Poshan ${viewMode === "demand" ? "Demand" : "Distribution"} Data | District wise\n` + mHeaders.join(",") + "\n";
    processedData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(`"${item.district}"`);
      if (visibleColumns.quarter) row.push(`"${item.quarter}"`);
      if (viewMode === "demand") {
        if (visibleColumns.khajur) row.push(item.khajur_beneficiary);
        if (visibleColumns.egg) row.push(item.egg_eating_beneficiary);
        if (visibleColumns.non_egg) row.push(item.non_egg_eating_beneficiary);
      } else {
        if (visibleColumns.total_demand) row.push(item.demand_khajur_beneficiary);
        if (visibleColumns.total_distribution) row.push(item.distributed_khajur_beneficiary);
      }
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Mahila_Poshan_District_Report.csv";
    link.click();
  };

  const handlePDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Report</title><style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          .total-row { font-weight: bold; background-color: #fff3cd; }
        </style></head>
        <body>
          <h2 style="text-align:center">Mahila Poshan ${viewMode === "demand" ? "Demand" : "Distribution"} Data | District wise</h2>
          <p style="text-align:center">Year: ${financialYear} | Quarter: ${quarter}</p>
          ${tableRef.current.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="dashboard-container">
      <DirectorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
        style={{ backgroundColor: "#004d4d" }} // Thin dark-teal sidebar hint
      />
      <div className="main-content-dash" style={{ backgroundColor: "#f4f7f6" }}>
        <DirectorHeader toggleSidebar={toggleSidebar} logoutText="LOGOUT" />

        <Container fluid className="mt-4 p-4">
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: "#004d4d", borderBottom: "3px solid #fd7e14", display: "inline-block", paddingBottom: "5px" }}>
              Mahila Poshan {viewMode === "demand" ? "Demand" : "Distribution"} Data | District wise
            </h2>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
              <Row className="g-3 align-items-end justify-content-center">
                <Col md={3}>
                  <Form.Label className="small fw-bold text-muted">Choose Financial Year</Form.Label>
                  <Form.Select size="sm" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                    <option value="All">All Years</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-bold text-muted">Choose Month</Form.Label>
                  <Form.Select size="sm" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                    <option value="All">All Months</option>
                    <option value="Apr-May-June">Apr-May-June (Q1)</option>
                    <option value="July-Aug-Sept">July-Aug-Sept (Q2)</option>
                    <option value="Oct-Nov-Dec">Oct-Nov-Dec (Q3)</option>
                    <option value="Jan-Feb-March">Jan-Feb-March (Q4)</option>
                  </Form.Select>
                </Col>
                <Col md="auto">
                  <Button variant="warning" size="sm" className="px-4 fw-bold text-white" onClick={() => setCurrentPage(1)} style={{ backgroundColor: "#fd7e14", border: "none" }}>
                    Filter Now
                  </Button>
                </Col>
                <Col md="auto">
                  <Button 
                    variant={viewMode === "demand" ? "info" : "success"}
                    size="sm" 
                    className="px-3 fw-bold text-white" 
                    style={{ backgroundColor: viewMode === "demand" ? "#008080" : "#20c997", border: "none" }}
                    onClick={() => setViewMode(viewMode === "demand" ? "distribution" : "demand")}
                  >
                    {viewMode === "demand" ? "Distribution Report" : "Demand Report"}
                  </Button>
                </Col>
              </Row>
              <div className="text-center mt-3">
                <h6 className="mb-0">
                  For the year : <span className="text-danger fw-bold">{financialYear}</span> and Quarter : <span className="text-danger fw-bold">{quarter}</span>
                </h6>
              </div>
            </Card.Body>
          </Card>

          {/* Table Tools */}
          <div className="bg-white p-3 rounded shadow-sm">
            <Row className="mb-3 align-items-center">
              <Col md={6} className="d-flex gap-2">
                <Button variant="outline-secondary" size="sm" onClick={handleCopy}>{copySuccess ? "Copied!" : "Copy"}</Button>
                <Button variant="outline-secondary" size="sm" onClick={handleExcel}>Excel</Button>
                <Button variant="outline-secondary" size="sm" onClick={handlePDF}>PDF</Button>
                <Button variant="outline-secondary" size="sm" onClick={() => setShowColumnModal(true)}>Column visibility</Button>
              </Col>
              <Col md={6}>
                <InputGroup size="sm" className="justify-content-end">
                  <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                  <Form.Control 
                    placeholder="Search District..." 
                    className="border-start-0" 
                    style={{ maxWidth: "250px" }} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>

            {/* Table */}
            <div className="table-responsive">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="teal" /></div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : (
                <Table striped bordered hover size="sm" className="mb-0" ref={tableRef}>
                  <thead style={{ backgroundColor: "#004d4d", color: "#fff" }}>
                    <tr className="text-center">
                      {columns.map(col => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" }}>
                        {visibleColumns.sno && <td className="text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>}
                        {visibleColumns.district && <td>{item.district}</td>}
                        {visibleColumns.quarter && <td className="text-center">{item.quarter}</td>}
                        {viewMode === "demand" ? (
                          <>
                            {visibleColumns.khajur && <td className="text-end">{item.khajur_beneficiary?.toLocaleString()}</td>}
                            {visibleColumns.egg && <td className="text-end">{item.egg_eating_beneficiary?.toLocaleString()}</td>}
                            {visibleColumns.non_egg && <td className="text-end">{item.non_egg_eating_beneficiary?.toLocaleString()}</td>}
                          </>
                        ) : (
                          <>
                            {visibleColumns.total_demand && <td className="text-end">{item.demand_khajur_beneficiary?.toLocaleString()}</td>}
                            {visibleColumns.total_distribution && <td className="text-end">{item.distributed_khajur_beneficiary?.toLocaleString()}</td>}
                          </>
                        )}
                      </tr>
                    ))}
                    <tr className="fw-bold" style={{ backgroundColor: "#fff3cd" }}>
                      <td colSpan={visibleColumns.sno + visibleColumns.district + visibleColumns.quarter} className="text-end">Total -&gt;</td>
                      {viewMode === "demand" ? (
                        <>
                          {visibleColumns.khajur && <td className="text-end">{totals.khajur.toLocaleString()}</td>}
                          {visibleColumns.egg && <td className="text-end">{totals.egg.toLocaleString()}</td>}
                          {visibleColumns.non_egg && <td className="text-end">{totals.non_egg.toLocaleString()}</td>}
                        </>
                      ) : (
                        <>
                          {visibleColumns.total_demand && <td className="text-end">{totals.total_demand.toLocaleString()}</td>}
                          {visibleColumns.total_distribution && <td className="text-end">{totals.total_distribution.toLocaleString()}</td>}
                        </>
                      )}
                    </tr>
                  </tbody>
                </Table>
              )}
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, processedData.length)} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
              </div>
              <Pagination size="sm" className="mb-0">
                <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                {[...Array(totalPages)].map((_, i) => (
                  <Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Pagination.Item>
                ))}
                <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          </div>
        </Container>
      </div>

      {/* Column Modal */}
      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: "16px" }}>Column Visibility</Modal.Title></Modal.Header>
        <Modal.Body>
          {columns.map(col => (
            <Form.Check key={col.key} type="checkbox" label={col.label} checked={visibleColumns[col.key]}
              onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))} />
          ))}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DirMahilaPoshanDemandDist;