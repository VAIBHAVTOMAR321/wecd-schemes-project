import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, InputGroup, Table, Pagination, Modal, Alert } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns, FaSearch } from "react-icons/fa";
import DirectorLeftNav from "../../DirectorLeftNav";
import DirectorHeader from "../../DirectorHeader";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";
import "../../../../assets/css/dashboard.css";

const DirBalPoshanDemandDist = () => {
  const { api, isReady } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const [tableData, setTableData] = useState([]);
  const [viewMode, setViewMode] = useState("demand"); // "demand" or "distribution"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter & Pagination State
  const [financialYear, setFinancialYear] = useState("2024-25"); // Default to a valid year from API
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
    kela: true,
    egg: true,
    non_egg: true,
    total_demand: true,
    total_distribution: true,
  });

  const columns = useMemo(() => viewMode === "demand" ? [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "quarter", label: "Quarter" },
    { key: "kela", label: "Kela chips Beneficiary" },
    { key: "egg", label: "Egg Eating Beneficiary" },
    { key: "non_egg", label: "Non Egg Eating Beneficiary" },
  ] : [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "quarter", label: "Month" },
    { key: "total_demand", label: "Total Demand" },
    { key: "total_distribution", label: "Total Distribution" },
  ], [viewMode]);

  const fetchData = useCallback(async () => {
    if (!api || !isReady) return;
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("director/bp-demand-distribution-district-wise/");
      if (response.data && response.data.success) {
        setTableData(response.data.data || []);
      }
    } catch (err) {
      setError("Failed to fetch data from the server.");
    } finally {
      setLoading(false);
    }
  }, [api, isReady]);

  useEffect(() => {
    fetchData();

    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 992);
      if (mobile) setSidebarOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fetchData]);

  const processedData = useMemo(() => {
    const monthToQuarterMap = {
      "January": "Jan-Feb-March", "February": "Jan-Feb-March", "March": "Jan-Feb-March",
      "April": "Apr-May-June", "May": "Apr-May-June", "June": "Apr-May-June",
      "July": "July-Aug-Sept", "August": "July-Aug-Sept", "September": "July-Aug-Sept",
      "October": "Oct-Nov-Dec", "November": "Oct-Nov-Dec", "December": "Oct-Nov-Dec",
    };

    const currentPeriodFilter = viewMode === "demand" ? quarter : (monthToQuarterMap[quarter] || quarter);

    let filtered = tableData.filter(item => {
      const matchesYear = financialYear === "All" || item.financial_year === financialYear;
      const matchesSearch = !searchTerm || 
        item.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.quarter?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesYear && matchesSearch;
    });
    
    let result = [];
    if (quarter === "All" || quarter === "Select Any One") { // Aggregate when "All" is selected for either demand or distribution
      const grouped = filtered.reduce((acc, curr) => {
        const dist = curr.district || "Unknown";
        if (!acc[dist]) {
          // Initialize with default values for aggregation
          // Ensure all relevant fields are initialized to 0 for summing
          // and quarter is set to "All" for the aggregated row display
          // Also add a displayPeriod for consistent rendering
          acc[dist] = { 
            ...curr, 
            quarter: "All",
            demand_kela_chips_beneficiary: 0,
            demand_egg_beneficiary: 0,
            demand_non_egg_beneficiary: 0,
            distributed_kela_chips_beneficiary: 0,
            distributed_egg_beneficiary: 0,
            distributed_non_egg_beneficiary: 0,
          };
        }
        acc[dist].demand_kela_chips_beneficiary += Number(curr.demand_kela_chips_beneficiary || 0);
        acc[dist].demand_egg_beneficiary += Number(curr.demand_egg_beneficiary || 0);
        acc[dist].demand_non_egg_beneficiary += Number(curr.demand_non_egg_beneficiary || 0);
        acc[dist].distributed_kela_chips_beneficiary += Number(curr.distributed_kela_chips_beneficiary || 0);
        acc[dist].distributed_egg_beneficiary += Number(curr.distributed_egg_beneficiary || 0);
        acc[dist].distributed_non_egg_beneficiary += Number(curr.distributed_non_egg_beneficiary || 0);
        acc[dist].distributed_non_egg_beneficiary += Number(curr.distributed_non_egg_beneficiary || 0);
        return acc;
      }, {});
      result = Object.values(grouped);
    } else {
      // Filter by specific quarter (demand) or mapped quarter (distribution)
      result = filtered.filter(item => item.quarter === currentPeriodFilter);
      // Map to add displayPeriod for specific month selection in distribution view
      result = result.map(item => ({
        ...item,
        displayPeriod: viewMode === "demand" ? item.quarter : quarter // Show selected month if distribution, else actual quarter
      }));
    }
    return result.sort((a, b) => (a.district || "").localeCompare(b.district || ""));
  }, [tableData, financialYear, quarter, searchTerm]);

  const totals = useMemo(() => {
    return processedData.reduce((acc, curr) => {
      if (viewMode === "demand") {
        acc.kela += Number(curr.demand_kela_chips_beneficiary || 0);
        acc.egg += Number(curr.demand_egg_beneficiary || 0);
        acc.non_egg += Number(curr.demand_non_egg_beneficiary || 0);
      } else {
        acc.total_demand += Number(curr.demand_kela_chips_beneficiary || 0);
        acc.total_distribution += Number(curr.distributed_kela_chips_beneficiary || 0);
      }
      return acc;
    }, { kela: 0, egg: 0, non_egg: 0, total_demand: 0, total_distribution: 0 });
  }, [processedData, viewMode]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCopy = async () => {
    const activeCols = columns.filter(c => visibleColumns[c.key]);
    const headers = activeCols.map(c => c.label).join("\t");
    const rows = processedData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(item.district || "-");
      if (visibleColumns.quarter) row.push(item.displayPeriod || item.quarter || "-"); // Use displayPeriod
      if (viewMode === "demand") {
        if (visibleColumns.kela) row.push(item.demand_kela_chips_beneficiary || 0);
        if (visibleColumns.egg) row.push(item.demand_egg_beneficiary || 0);
        if (visibleColumns.non_egg) row.push(item.demand_non_egg_beneficiary || 0);
      } else {
        if (visibleColumns.total_demand) row.push(item.demand_kela_chips_beneficiary || 0);
        if (visibleColumns.total_distribution) row.push(item.distributed_kela_chips_beneficiary || 0);
      }
      return row.join("\t");
    }).join("\n");
    await navigator.clipboard.writeText(headers + "\n" + rows);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExcel = () => {
    const activeCols = columns.filter(c => visibleColumns[c.key]);
    let csv = activeCols.map(c => c.label).join(",") + "\n";
    processedData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.district) row.push(`"${item.district}"`);
      if (visibleColumns.quarter) row.push(`"${item.displayPeriod || item.quarter}"`); // Use displayPeriod
      if (viewMode === "demand") {
        if (visibleColumns.kela) row.push(item.demand_kela_chips_beneficiary);
        if (visibleColumns.egg) row.push(item.demand_egg_beneficiary);
        if (visibleColumns.non_egg) row.push(item.demand_non_egg_beneficiary);
      } else {
        if (visibleColumns.total_demand) row.push(item.demand_kela_chips_beneficiary);
        if (visibleColumns.total_distribution) row.push(item.distributed_kela_chips_beneficiary);
      }
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Bal_Poshan_${viewMode}_District_Report.csv`;
    link.click();
  };

  const handlePDF = () => {
    const mHeaders = columns.filter(c => visibleColumns[c.key]).map(c => `<th>${c.label}</th>`).join("");
    const mRows = processedData.map((item, index) => {
      let rowHtml = "<tr>";
      if (visibleColumns.sno) rowHtml += `<td>${index + 1}</td>`;
      if (visibleColumns.district) rowHtml += `<td>${item.district || "-"}</td>`;
      if (visibleColumns.quarter) rowHtml += `<td>${item.displayPeriod || item.quarter || "-"}</td>`; // Use displayPeriod
      if (viewMode === "demand") {
        if (visibleColumns.kela) rowHtml += `<td>${item.demand_kela_chips_beneficiary?.toLocaleString() || 0}</td>`;
        if (visibleColumns.egg) rowHtml += `<td>${item.demand_egg_beneficiary?.toLocaleString() || 0}</td>`;
        if (visibleColumns.non_egg) rowHtml += `<td>${item.demand_non_egg_beneficiary?.toLocaleString() || 0}</td>`;
      } else {
        if (visibleColumns.total_demand) rowHtml += `<td>${item.demand_kela_chips_beneficiary?.toLocaleString() || 0}</td>`;
        if (visibleColumns.total_distribution) rowHtml += `<td>${item.distributed_kela_chips_beneficiary?.toLocaleString() || 0}</td>`;
      }
      rowHtml += "</tr>";
      return rowHtml;
    }).join("");

    const totalRow = `<tr class="total-row"><td colspan="${(visibleColumns.sno?1:0)+(visibleColumns.district?1:0)+(visibleColumns.quarter?1:0)}">Total -></td>${viewMode === "demand" ? `${visibleColumns.kela ? `<td>${totals.kela.toLocaleString()}</td>` : ""}${visibleColumns.egg ? `<td>${totals.egg.toLocaleString()}</td>` : ""}${visibleColumns.non_egg ? `<td>${totals.non_egg.toLocaleString()}</td>` : ""}` : `${visibleColumns.total_demand ? `<td>${totals.total_demand.toLocaleString()}</td>` : ""}${visibleColumns.total_distribution ? `<td>${totals.total_distribution.toLocaleString()}</td>` : ""}`}</tr>`;

    const printWindow = window.open("", "_blank", "width=1200,height=800");
    printWindow.document.write(`<html><head><title>Report</title><style>table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #f4f4f4; } .total-row { font-weight: bold; background-color: #fff3cd; }</style></head><body><h2 style="text-align:center">Bal Poshan ${viewMode === "demand" ? "Demand" : "Distribution"} Data | District wise</h2><p style="text-align:center">Year: ${financialYear} | Quarter: ${quarter}</p><table><thead><tr>${mHeaders}</tr></thead><tbody>${mRows}${totalRow}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: "#f4f7f6" }}>
      <DirectorLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} style={{ backgroundColor: "#004d4d" }} />
      <div className="main-content-dash" style={{ backgroundColor: "#f4f7f6" }}>
        <DirectorHeader toggleSidebar={toggleSidebar} logoutText="LOGOUT" />
        <Container fluid className="mt-4 p-4">
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: "#004d4d", borderBottom: "3px solid #fd7e14", display: "inline-block", paddingBottom: "5px" }}>
              Bal Poshan {viewMode === "demand" ? "Demand" : "Distribution"} Data | District wise
            </h2>
          </div>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3">
              <Row className="g-3 align-items-end justify-content-center">
                <Col md={3}>
                  <Form.Label className="small fw-bold text-muted">Choose Financial Year</Form.Label>
                  <Form.Select size="sm" value={financialYear} onChange={(e) => { setFinancialYear(e.target.value); setCurrentPage(1); }}>
                    <option value="All">All Years</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                    <option value="2026-27">2026-27</option>
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-bold text-muted">Choose {viewMode === "demand" ? "Quarter" : "Month"}</Form.Label>
                  <Form.Select size="sm" value={quarter} onChange={(e) => { setQuarter(e.target.value); setCurrentPage(1); }}>
                    {viewMode === "demand" ? (
                      <>
                        <option value="All">All Quarters</option>
                        <option value="Apr-May-June">Apr-May-June</option>
                        <option value="July-Aug-Sept">July-Aug-Sept</option>
                        <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                        <option value="Jan-Feb-March">Jan-Feb-March</option>
                      </>
                    ) : (
                      <>
                        <option value="Select Any One">Select Any One</option>
                        <option value="All">All Months</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                      </>
                    )}
                  </Form.Select>
                </Col>
                <Col md="auto">
                  <Button variant="warning" size="sm" className="px-4 fw-bold text-white" onClick={() => setCurrentPage(1)} style={{ backgroundColor: "#fd7e14", border: "none" }}>Filter Now</Button>
                </Col>
                {viewMode === "demand" && (
                  <Col md="auto">
                    <Button variant="info" size="sm" className="px-3 fw-bold text-white" style={{ backgroundColor: "#008080", border: "none" }} onClick={() => { setViewMode("distribution"); setCurrentPage(1); }}>Distribution Report</Button>
                  </Col>
                )}
              </Row>
              <div className="text-center mt-3">
                <h6 className="mb-0">For the year : <span className="text-danger fw-bold">{financialYear}</span> and {viewMode === "demand" ? "Quarter" : "Month"} : <span className="text-danger fw-bold">{quarter === "Select Any One" ? "All" : quarter}</span></h6>
              </div>
            </Card.Body>
          </Card>
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
                  <Form.Control placeholder="Search District..." className="border-start-0" style={{ maxWidth: "250px" }} value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                </InputGroup>
              </Col>
            </Row>
            <div className="table-responsive">
              {loading ? (
                <div className="text-center py-5"><Spinner animation="border" variant="teal" /></div>
              ) : (
                <Table striped bordered hover size="sm" className="mb-0">
                  <thead style={{ backgroundColor: "#004d4d", color: "#fff" }}>
                    <tr className="text-center">{columns.map(col => visibleColumns[col.key] && <th key={col.key}>{col.label}</th>)}</tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((item, index) => (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa" }}>
                        {visibleColumns.sno && <td className="text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>}
                        {visibleColumns.district && <td>{item.district}</td>}
                        {visibleColumns.quarter && <td className="text-center">{item.displayPeriod || item.quarter}</td>}
                        {viewMode === "demand" ? (
                          <>
                            {visibleColumns.kela && <td className="text-end">{item.demand_kela_chips_beneficiary?.toLocaleString()}</td>}
                            {visibleColumns.egg && <td className="text-end">{item.demand_egg_beneficiary?.toLocaleString()}</td>}
                            {visibleColumns.non_egg && <td className="text-end">{item.demand_non_egg_beneficiary?.toLocaleString()}</td>}
                          </>
                        ) : (
                          <>
                            {visibleColumns.total_demand && <td className="text-end">{item.demand_kela_chips_beneficiary?.toLocaleString()}</td>}
                            {visibleColumns.total_distribution && <td className="text-end">{item.distributed_kela_chips_beneficiary?.toLocaleString()}</td>}
                          </>
                        )}
                      </tr>
                    ))}
                    <tr className="fw-bold" style={{ backgroundColor: "#fff3cd" }}>
                      <td colSpan={(visibleColumns.sno?1:0)+(visibleColumns.district?1:0)+(visibleColumns.quarter?1:0)} className="text-end">Total -&gt;</td>
                      {viewMode === "demand" ? (
                        <>
                          {visibleColumns.kela && <td className="text-end">{totals.kela.toLocaleString()}</td>}
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
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-muted small">Showing {processedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries</div>
              <Pagination size="sm" className="mb-0">
                <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                {[...Array(totalPages)].map((_, i) => (<Pagination.Item key={i + 1} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Pagination.Item>))}
                <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          </div>
        </Container>
      </div>
      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton><Modal.Title style={{ fontSize: "16px" }}>Column Visibility</Modal.Title></Modal.Header>
        <Modal.Body>{columns.map(col => (<Form.Check key={col.key} type="checkbox" label={col.label} checked={visibleColumns[col.key]} onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))} />))}</Modal.Body>
      </Modal>
    </div>
  );
};

export default DirBalPoshanDemandDist;