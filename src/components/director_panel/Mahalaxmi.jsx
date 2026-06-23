import React, { useState, useEffect, useCallback, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, InputGroup, Table, Pagination, Badge, Alert, Modal } from "react-bootstrap";
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

  // Entries per page - 100 as requested
  const entriesPerPage = 100;

  const tableRef = useRef(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    sector: true,
    awc_name: true,
    name: true,
    dob: true,
    mobile: true,
    adhar: true,
    delivery_date: true,
  });

  const columns = [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "project", label: "Project" },
    { key: "sector", label: "Sector" },
    { key: "awc_name", label: "AWC Name" },
    { key: "name", label: "Name" },
    { key: "dob", label: "DOB" },
    { key: "mobile", label: "Mobile" },
    { key: "adhar", label: "Adhar Num" },
    { key: "delivery_date", label: "Delivery Date" },
  ];

  // Fetch data from API with pagination
  const fetchBeneficiaryData = useCallback(async (page = 1) => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`director/beneficiary-summary/`, {
        params: {
          fin_year: financialYear,
          quarter: quarter,
          page: page,
          page_size: entriesPerPage
        }
      });
      setTableData(response.data?.results?.data || []);
      setTotalEntries(response.data?.count || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("Error fetching beneficiary data:", err);
      setError("Failed to fetch beneficiary records. Please try again.");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [api, financialYear, quarter, entriesPerPage]);

  // Filter data for search (client-side filtering)
  const allFilteredData = tableData.filter((item) => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      item.district?.toLowerCase().includes(search) ||
      item.project?.toLowerCase().includes(search) ||
      item.sector?.toLowerCase().includes(search) ||
      item.name?.toLowerCase().includes(search) ||
      item.ben_mob?.toLowerCase().includes(search) ||
      item.adhar_num?.toLowerCase().includes(search)
    );
  });

  // Display data based on whether search is active
  const displayData = searchTerm.trim() 
    ? allFilteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
    : tableData;

  // Total pages calculation
  const displayTotal = searchTerm.trim() ? allFilteredData.length : totalEntries;
  const totalPages = Math.max(1, Math.ceil(displayTotal / entriesPerPage));

  // Generate pagination numbers with ellipsis
  const getPaginationRange = () => {
    const delta = 2;
    const range = [];
    const left = Math.max(1, currentPage - delta);
    const right = Math.min(totalPages, currentPage + delta);

    // Always show first page
    if (left > 1) {
      range.push(1);
      if (left > 2) {
        range.push("...");
      }
    }

    // Pages around current
    for (let i = left; i <= right; i++) {
      range.push(i);
    }

    // Always show last page
    if (right < totalPages) {
      if (right < totalPages - 1) {
        range.push("...");
      }
      range.push(totalPages);
    }

    return range;
  };

  // Handle search term change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Reset to page 1 when searching
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    // If no search term, fetch from API
    if (!searchTerm.trim()) {
      fetchBeneficiaryData(pageNumber);
    }
    // If search term, just change page (client-side pagination)
  };

  // Handle filter button click
  const handleFilter = () => {
    setSearchTerm("");
    setCurrentPage(1);
    fetchBeneficiaryData(1);
  };

  // Handle copy
  const handleCopy = async () => {
    if (displayData.length === 0) return;
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    const mRows = displayData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push((currentPage - 1) * entriesPerPage + idx + 1);
      if (visibleColumns.district) row.push(item.district || "-");
      if (visibleColumns.project) row.push(item.project || "-");
      if (visibleColumns.sector) row.push(item.sector || "-");
      if (visibleColumns.awc_name) row.push(item.awc_name || "-");
      if (visibleColumns.name) row.push(item.name || "-");
      if (visibleColumns.dob) row.push(item.dob || "-");
      if (visibleColumns.mobile) row.push(item.ben_mob || "-");
      if (visibleColumns.adhar) row.push(item.adhar_num || "-");
      if (visibleColumns.delivery_date) row.push(item.del_date || "-");
      return row.join("\t");
    });

    const text = "Mahalaxmi Beneficiary Report\n" + [mHeaders.join("\t"), ...mRows].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Excel export
  const handleExcel = () => {
    if (displayData.length === 0) return;
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => c.label);
    let csv = "Mahalaxmi Beneficiary Report\n" + mHeaders.join(",") + "\n";

    displayData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push((currentPage - 1) * entriesPerPage + idx + 1);
      if (visibleColumns.district) row.push(`"${item.district || "-"}"`);
      if (visibleColumns.project) row.push(`"${item.project || "-"}"`);
      if (visibleColumns.sector) row.push(`"${item.sector || "-"}"`);
      if (visibleColumns.awc_name) row.push(`"${item.awc_name || "-"}"`);
      if (visibleColumns.name) row.push(`"${item.name || "-"}"`);
      if (visibleColumns.dob) row.push(`"${item.dob || "-"}"`);
      if (visibleColumns.mobile) row.push(`"${item.ben_mob || "-"}"`);
      if (visibleColumns.adhar) row.push(`"${item.adhar_num || "-"}"`);
      if (visibleColumns.delivery_date) row.push(`"${item.del_date || "-"}"`);
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Mahalaxmi_Beneficiary_Report.csv";
    link.click();
  };

  // Handle PDF export
  const handlePDF = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => `<th>${c.label}</th>`).join("");
    const mRows = displayData.map((item, idx) => {
      let row = "<tr>";
      if (visibleColumns.sno) row += `<td>${(currentPage - 1) * entriesPerPage + idx + 1}</td>`;
      if (visibleColumns.district) row += `<td>${item.district || "-"}</td>`;
      if (visibleColumns.project) row += `<td>${item.project || "-"}</td>`;
      if (visibleColumns.sector) row += `<td>${item.sector || "-"}</td>`;
      if (visibleColumns.awc_name) row += `<td>${item.awc_name || "-"}</td>`;
      if (visibleColumns.name) row += `<td>${item.name || "-"}</td>`;
      if (visibleColumns.dob) row += `<td>${item.dob || "-"}</td>`;
      if (visibleColumns.mobile) row += `<td>${item.ben_mob || "-"}</td>`;
      if (visibleColumns.adhar) row += `<td>${item.adhar_num || "-"}</td>`;
      if (visibleColumns.delivery_date) row += `<td>${item.del_date || "-"}</td>`;
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
          <h2>Mahalaxmi Beneficiary Report</h2>
          <h4>FY: ${financialYear} | Quarter: ${quarter_month_map[quarter]}</h4>
          <p style="text-align: center;">Page ${currentPage} of ${totalPages} | Showing ${displayData.length} entries</p>
          <table><thead><tr>${mHeaders}</tr></thead><tbody>${mRows}</tbody></table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Handle resize
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

  // Initial data fetch
  useEffect(() => {
    fetchBeneficiaryData(1);
  }, [fetchBeneficiaryData]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Calculate showing range
  const showingFrom = displayTotal === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1;
  const showingTo = Math.min(currentPage * entriesPerPage, displayTotal);

  const paginationRange = getPaginationRange();

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
          {/* Header Section */}
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

          {/* Filtering Row */}
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
                    {loading ? <><Spinner size="sm" className="me-1" /> Loading...</> : "Filter Now"}
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
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copySuccess ? <><FaCheck className="me-1 text-success" /> Copied!</> : <><FaCopy className="me-1" /> Copy</>}
              </Button>
              <Button variant="secondary" size="sm" onClick={handleExcel}><FaFileExcel className="me-1" /> Excel</Button>
              <Button variant="secondary" size="sm" onClick={handlePDF}><FaFilePdf className="me-1" /> PDF</Button>
              <Button variant="secondary" size="sm" onClick={() => setShowColumnModal(true)}><FaColumns className="me-1" /> Columns</Button>
            </Col>
            <Col md={6}>
              <InputGroup size="sm" className="justify-content-end">
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  placeholder="Search..."
                  aria-label="Search"
                  size="sm"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  style={{ maxWidth: '250px' }}
                />
                {searchTerm && (
                  <Button variant="outline-secondary" size="sm" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}>
                    ✕
                  </Button>
                )}
              </InputGroup>
            </Col>
          </Row>

          {/* Search active indicator */}
          {searchTerm.trim() && (
            <Alert variant="info" className="py-2 px-3 mb-2">
              <small>
                <strong>Search Active:</strong> Showing {allFilteredData.length} results for "{searchTerm}" 
                <Button variant="link" size="sm" className="p-0 ms-2" onClick={() => { setSearchTerm(""); setCurrentPage(1); }}>
                  Clear Search
                </Button>
              </small>
            </Alert>
          )}

          {/* Data Table */}
          <div className="table-responsive shadow-sm rounded">
            {error && <Alert variant="danger" className="m-2">{error}</Alert>}
            
            <Table striped bordered hover size="sm" className="mb-0 custom-table" ref={tableRef}>
              <thead style={{ backgroundColor: "#f1f4f9", position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  {visibleColumns.sno && <th className="text-center py-2" style={{ minWidth: '50px' }}>S.no</th>}
                  {visibleColumns.district && <th className="text-center py-2" style={{ minWidth: '120px' }}>District</th>}
                  {visibleColumns.project && <th className="text-center py-2" style={{ minWidth: '120px' }}>Project</th>}
                  {visibleColumns.sector && <th className="text-center py-2" style={{ minWidth: '120px' }}>Sector</th>}
                  {visibleColumns.awc_name && <th className="text-center py-2" style={{ minWidth: '150px' }}>AWC Name</th>}
                  {visibleColumns.name && <th className="text-center py-2" style={{ minWidth: '150px' }}>Name</th>}
                  {visibleColumns.dob && <th className="text-center py-2" style={{ minWidth: '100px' }}>DOB</th>}
                  {visibleColumns.mobile && <th className="text-center py-2" style={{ minWidth: '120px' }}>Mobile</th>}
                  {visibleColumns.adhar && <th className="text-center py-2" style={{ minWidth: '130px' }}>Adhar Num</th>}
                  {visibleColumns.delivery_date && <th className="text-center py-2" style={{ minWidth: '120px' }}>Delivery Date</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2 mb-0">Loading beneficiary data... (Page {currentPage})</p>
                    </td>
                  </tr>
                ) : displayData.length > 0 ? (
                  displayData.map((row, index) => (
                    <tr key={row.id || `${currentPage}-${index}`}>
                      {visibleColumns.sno && <td className="text-center">{(currentPage - 1) * entriesPerPage + index + 1}</td>}
                      {visibleColumns.district && <td>{row.district}</td>}
                      {visibleColumns.project && <td>{row.project}</td>}
                      {visibleColumns.sector && <td>{row.sector}</td>}
                      {visibleColumns.awc_name && <td>{row.awc_name}</td>}
                      {visibleColumns.name && <td>{row.name}</td>}
                      {visibleColumns.dob && <td className="text-center">{row.dob}</td>}
                      {visibleColumns.mobile && <td className="text-center">{row.ben_mob}</td>}
                      {visibleColumns.adhar && <td className="text-center">{row.adhar_num}</td>}
                      {visibleColumns.delivery_date && <td className="text-center">{row.del_date}</td>}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center py-4 text-muted">
                      {searchTerm.trim() ? "No results found for your search." : "No beneficiary records found for the selected criteria."}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls - Enhanced */}
          <Card className="mt-3 border-0 shadow-sm">
            <Card.Body className="py-2">
              <Row className="align-items-center">
                <Col md={4}>
                  <div className="text-muted small">
                    Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of <strong>{displayTotal}</strong> entries
                    {searchTerm.trim() && <span className="text-info"> (filtered)</span>}
                  </div>
                </Col>
                <Col md={4} className="text-center">
                  <div className="d-flex align-items-center justify-content-center gap-2">
                    <span className="text-muted small">Entries per page:</span>
                    <span className="badge bg-primary">100</span>
                  </div>
                </Col>
                <Col md={4} className="d-flex justify-content-end">
                  <Pagination size="sm" className="mb-0">
                    {/* First Page */}
                    <Pagination.First 
                      onClick={() => handlePageChange(1)} 
                      disabled={currentPage === 1 || loading} 
                      title="First Page"
                    />
                    {/* Previous Page */}
                    <Pagination.Prev 
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1 || loading} 
                      title="Previous Page"
                    />
                    
                    {/* Page Numbers with Ellipsis */}
                    {paginationRange.map((page, idx) => (
                      page === "..." ? (
                        <Pagination.Ellipsis key={`ellipsis-${idx}`} disabled />
                      ) : (
                        <Pagination.Item 
                          key={page} 
                          active={page === currentPage} 
                          onClick={() => handlePageChange(page)}
                          disabled={loading}
                        >
                          {page}
                        </Pagination.Item>
                      )
                    ))}
                    
                    {/* Next Page */}
                    <Pagination.Next 
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages || loading} 
                      title="Next Page"
                    />
                    {/* Last Page */}
                    <Pagination.Last 
                      onClick={() => handlePageChange(totalPages)} 
                      disabled={currentPage === totalPages || loading} 
                      title="Last Page"
                    />
                  </Pagination>
                </Col>
              </Row>
              
              {/* Page Jump for large datasets */}
              {totalPages > 10 && (
                <Row className="mt-2">
                  <Col className="text-center">
                    <Form.Group as={Row} className="align-items-center justify-content-center g-2">
                      <Form.Label column xs="auto" className="text-muted small mb-0">
                        Jump to page:
                      </Form.Label>
                      <Col xs="auto">
                        <Form.Control
                          type="number"
                          min="1"
                          max={totalPages}
                          size="sm"
                          style={{ width: '70px', textAlign: 'center' }}
                          placeholder={currentPage.toString()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const page = parseInt(e.target.value);
                              if (page >= 1 && page <= totalPages) {
                                handlePageChange(page);
                                e.target.value = '';
                              }
                            }
                          }}
                        />
                      </Col>
                      <Col xs="auto">
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          onClick={(e) => {
                            const input = e.target.closest('.input-group, .col')?.querySelector('input[type="number"]') 
                              || document.querySelector('input[type="number"][min="1"]');
                            if (input) {
                              const page = parseInt(input.value);
                              if (page >= 1 && page <= totalPages) {
                                handlePageChange(page);
                                input.value = '';
                              }
                            }
                          }}
                          disabled={loading}
                        >
                          Go
                        </Button>
                      </Col>
                      <Col xs="auto">
                        <span className="text-muted small">of {totalPages} pages</span>
                      </Col>
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>

      {/* Column Visibility Modal */}
      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: '16px' }}>Column Visibility</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {columns.map(col => (
            <Form.Check 
              key={col.key} 
              type="checkbox" 
              label={col.label}
              checked={visibleColumns[col.key]}
              onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
              className="mb-2"
            />
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button size="sm" variant="secondary" onClick={() => setVisibleColumns({
            sno: true, district: true, project: true, sector: true,
            awc_name: true, name: true, dob: true, mobile: true,
            adhar: true, delivery_date: true
          })}>
            Reset All
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowColumnModal(false)}>Done</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Mahalaxmi;