import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, InputGroup, Table, Pagination, Alert, Modal } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaEye, FaCheck, FaSearch } from "react-icons/fa";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";
import "../../../../assets/css/dashboard.css";
import DirectorHeader from "../../DirectorHeader";
import DirectorLeftNav from "../../DirectorLeftNav";

const defaultFinancialYearOptions = ["2024-2025", "2025-2026", "2026-2027"];

const normalizeFinancialYear = (year) => {
  switch (year) {
    case "2024-2025": return "24-25";
    case "2025-2026": return "25-26";
    case "2026-2027": return "26-27";
    case "2024-25": return "24-25";
    case "2025-26": return "25-26";
    case "2026-27": return "26-27";
    default: return year;
  }
};

const displayFinancialYear = (year) => {
  switch (year) {
    case "24-25": return "2024-2025";
    case "25-26": return "2025-2026";
    case "26-27": return "2026-2027";
    case "2024-25": return "2024-2025";
    case "2025-26": return "2025-2026";
    case "2026-27": return "2026-2027";
    default: return year;
  }
};

const getFinancialYearOptions = (years) => {
  return [...new Set([...defaultFinancialYearOptions, ...(years || []).map(displayFinancialYear)].filter(Boolean))];
};

const getResponseData = (response) => Array.isArray(response.data) ? response.data : response.data?.data || [];

const getFinancialYearValue = (item) => item.financial_year || item.fin_year || item.fin_yr || "";

const getQuarterValue = (item) => item.quarter || item.qtr_dmd || item.qtr || "";

const getQuarterMonths = (quarter) => {
  switch (quarter) {
    case "Apr-May-June": return ["Apr-May-Jun", "Apr-May-June", "April-May-June", "April-May-Jun", "First"];
    case "July-Aug-Sept": return ["Jul-Aug-Sep", "July-Aug-Sept", "July-Aug-Sep", "Jul-Aug-Sept", "Second"];
    case "Oct-Nov-Dec": return ["Oct-Nov-Dec", "October-November-December", "Oct-Nov-December", "Third"];
    case "Jan-Feb-March": return ["Jan-Feb-Mar", "Jan-Feb-March", "January-February-March", "Jan-February-March", "Fourth"];
    default: return [];
  }
};

const DirDemandkitProject = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const { api } = useAuth();

  const [financialYear, setFinancialYear] = useState("All");
  const [quarter, setQuarter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tableData, setTableData] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalEntries, setTotalEntries] = useState(0);
  const [error, setError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [activeView, setActiveView] = useState("demand");

  const entriesPerPage = 50;
  const tableRef = useRef(null);

  const tableColumns = [
    { key: "sno", label: "S.No" },
    { key: "district", label: "District" },
    { key: "project", label: "Project" },
    { key: "financial_year", label: "Financial Year" },
    { key: "quarter", label: "Quarter" },
    { key: "beneficiary", label: "Beneficiary" },
    { key: "demand_kits", label: "Demand Kits" },
  ];

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    financial_year: true,
    quarter: true,
    beneficiary: true,
    demand_kits: true,
  });

  const financialYearOptions = useMemo(() => getFinancialYearOptions(uniqueYears), [uniqueYears]);

  const filteredData = tableData.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      item.district?.toLowerCase().includes(search) ||
      item.project?.toLowerCase().includes(search) ||
      item.financial_year?.toLowerCase().includes(search) ||
      item.quarter?.toLowerCase().includes(search)
    );
    const matchesYear = financialYear === "All" || item.financial_year === financialYear;
    const quarterMonths = quarter === "All" ? null : getQuarterMonths(quarter);
    const matchesQuarter = quarter === "All" || (quarterMonths && quarterMonths.includes(item.quarter));

    return matchesSearch && matchesYear && matchesQuarter;
  });

  const overallTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.beneficiary += Number(item.beneficiary || 0);
        acc.kits += Number(item.demand_kits || 0);
        return acc;
      },
      { beneficiary: 0, kits: 0 }
    );
  }, [filteredData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / entriesPerPage));

  const fetchDemandData = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const params = { page_size: 5000 };
      if (financialYear !== "All") params.fin_yr = normalizeFinancialYear(financialYear);

      const response = await api.get(`director/mahalaxmi-demand/project-wise/`, { params });

      const fetchedData = getResponseData(response);

      const mappedData = fetchedData.map(item => ({
        ...item,
        sno: item.sno || item.s_no || "",
        financial_year: displayFinancialYear(getFinancialYearValue(item)),
        quarter: getQuarterValue(item),
        project: item.project || "",
        beneficiary: item.beneficiary || 0,
        demand_kits: item.demand_kits || 0,
        _display_quarter: quarter === "All" ? "All" : getQuarterValue(item),
      }));

      setTableData(mappedData);
      setTotalEntries(fetchedData.length || 0);

      if (fetchedData.length > 0 && (financialYear === "All" || uniqueYears.length === 0)) {
        const years = [...new Set(fetchedData.map(getFinancialYearValue))].filter(Boolean).map(displayFinancialYear);
        setUniqueYears(years.sort());
      }
    } catch (err) {
      console.error("Error fetching mahalaxmi district demand data:", err);
      setError("Failed to fetch demand records. Please try again.");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  }, [api, financialYear, quarter, uniqueYears.length]);

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

  useEffect(() => {
    if (activeView === "demand") {
      fetchDemandData();
    }
  }, [activeView, fetchDemandData]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchDemandData();
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setCurrentPage(1);
    setSearchTerm("");
    setFinancialYear("All");
    setQuarter("All");
    setUniqueYears([]);
  };

  const renderTableRows = (data) => {
    if (data.length === 0) return null;

    const sortedData = [...data].sort((a, b) => (a.district || "").localeCompare(b.district || ""));
    const rows = [];

    sortedData.forEach((row, index) => {
      rows.push(
        <tr key={row.sno || index}>
          {visibleColumns.sno && <td className="text-center">{row.sno}</td>}
          {visibleColumns.district && <td>{row.district}</td>}
          {visibleColumns.project && <td>{row.project}</td>}
          {visibleColumns.financial_year && <td className="text-center">{row.financial_year}</td>}
          {visibleColumns.quarter && <td className="text-center">{row._display_quarter || row.quarter}</td>}
          {visibleColumns.beneficiary && <td className="text-center">{row.beneficiary}</td>}
          {visibleColumns.demand_kits && <td className="text-center">{row.demand_kits}</td>}
        </tr>
      );
    });

    rows.push(
      <tr key="overall-total" style={{ backgroundColor: "#004d4d", color: "#fff", fontWeight: "bold" }}>
        {visibleColumns.sno && <td></td>}
        {visibleColumns.district && <td className="text-start py-3">Overall Total</td>}
        {visibleColumns.project && <td></td>}
        {visibleColumns.financial_year && <td></td>}
        {visibleColumns.quarter && <td></td>}
        {visibleColumns.beneficiary && <td className="text-center">{overallTotals.beneficiary}</td>}
        {visibleColumns.demand_kits && <td className="text-center">{overallTotals.kits}</td>}
      </tr>
    );

    return rows;
  };

  const renderPaginationItems = () => {
    const pages = [];
    const maxPageButtons = 5;
    const halfMaxPageButtons = Math.floor(maxPageButtons / 2);

    if (totalPages <= maxPageButtons + 2) {
      for (let page = 1; page <= totalPages; page++) {
        pages.push(
          <Pagination.Item
            key={page}
            active={page === currentPage}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </Pagination.Item>
        );
      }
    } else {
      pages.push(
        <Pagination.Item key="1" active={1 === currentPage} onClick={() => setCurrentPage(1)}>1</Pagination.Item>
      );

      if (currentPage > halfMaxPageButtons + 2) {
        pages.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
      }

      let startPage = Math.max(2, currentPage - halfMaxPageButtons);
      let endPage = Math.min(totalPages - 1, currentPage + halfMaxPageButtons);

      if (currentPage <= halfMaxPageButtons + 1) {
        endPage = maxPageButtons;
      } else if (currentPage >= totalPages - halfMaxPageButtons) {
        startPage = totalPages - maxPageButtons + 1;
      }

      for (let page = startPage; page <= endPage; page++) {
        pages.push(
          <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
            {page}
          </Pagination.Item>
        );
      }

      if (currentPage < totalPages - halfMaxPageButtons - 1) {
        pages.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
      }

      pages.push(
        <Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => setCurrentPage(totalPages)}>{totalPages}</Pagination.Item>
      );
    }

    return pages;
  };

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;

  const getExportData = () => {
    const sortedData = [...filteredData].sort((a, b) => (a.district || "").localeCompare(b.district || ""));
    return sortedData.map((row, index) => ({
      sno: row.sno ?? "",
      district: row.district ?? "",
      project: row.project ?? "",
      financial_year: row.financial_year ?? "",
      quarter: (row._display_quarter || row.quarter) ?? "",
      beneficiary: row.beneficiary ?? "",
      demand_kits: row.demand_kits ?? "",
    }));
  };

  const handleCopy = async () => {
    const visibleCols = tableColumns.filter((col) => visibleColumns[col.key]);
    const escapeCsv = (value) => String(value ?? "");

    const rows = getExportData();

    const totalRow = {
      sno: "",
      district: "",
      project: "",
      financial_year: "",
      quarter: "",
      beneficiary: overallTotals.beneficiary,
      demand_kits: overallTotals.kits,
    };

    const text = [
      "MAHALAXMI KIT DEMAND DATA (DISTRICT WISE)",
      `For the year: ${financialYear} and Quarter: ${quarter}`,
      "",
      visibleCols.map((col) => col.label).join("\t"),
      ...rows.map((row) => visibleCols.map((col) => escapeCsv(row[col.key])).join("\t")),
      visibleCols.map((col) => escapeCsv(totalRow[col.key])).join("\t"),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleExcel = () => {
    const visibleCols = tableColumns.filter((col) => visibleColumns[col.key]);
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = getExportData();

    const totalRow = {
      sno: "",
      district: "",
      project: "",
      financial_year: "",
      quarter: "",
      beneficiary: overallTotals.beneficiary,
      demand_kits: overallTotals.kits,
    };

    let csv = "MAHALAXMI KIT DEMAND DATA (DISTRICT WISE)\n";
    csv += `For the year: ${financialYear}, Quarter: ${quarter}\n\n`;
    csv += visibleCols.map((col) => escapeCsv(col.label)).join(",") + "\n";
    csv += rows.map((row) => visibleCols.map((col) => escapeCsv(row[col.key])).join(",")).join("\n");
    csv += visibleCols.map((col) => escapeCsv(totalRow[col.key])).join(",");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Mahalaxmi_Kit_District_Report_${financialYear || "All"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePDF = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const rows = getExportData();

    const tbodyRows = rows.map((row) => `
      <tr>
        <td class="text-center">${row.sno}</td>
        <td>${row.district}</td>
        <td>${row.project}</td>
        <td class="text-center">${row.financial_year}</td>
        <td class="text-center">${row.quarter}</td>
        <td class="text-center">${row.beneficiary}</td>
        <td class="text-center">${row.demand_kits}</td>
      </tr>
    `).join("");

    const overallRow = `
      <tr style="background-color:#004d4d;color:#fff;font-weight:bold;">
        <td></td>
        <td class="text-start" style="padding:8px;">Overall Total</td>
        <td></td>
        <td></td><td></td>
        <td class="text-center">${overallTotals.beneficiary}</td>
        <td class="text-center">${overallTotals.kits}</td>
      </tr>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Mahalaxmi Kit District Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            th { background-color: #f1f5f9; }
            h2 { text-align: center; color: #004d4d; }
          </style>
        </head>
        <body>
          <h2>Mahalaxmi Kit Demand Data | District Wise</h2>
          <h4 style="text-align:center;color:#dc2626;">For the year: ${financialYear} and Quarter: ${quarter}</h4>
          <table>
            <thead>
              <tr style="background-color:#004d4d;color:#fff;">
                <th style="padding:6px;">S.No</th>
                <th style="padding:6px;">District</th>
                <th style="padding:6px;">Project</th>
                <th style="padding:6px;">Financial Year</th>
                <th style="padding:6px;">Quarter</th>
                <th style="padding:6px;">Beneficiary</th>
                <th style="padding:6px;">Demand Kits</th>
              </tr>
            </thead>
            <tbody>${tbodyRows}${overallRow}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: "#f4f7f6" }}>
      <DirectorLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />

      <div className="main-content-dash">
        <DirectorHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <Container fluid className="mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-0" style={{ color: "#004d4d", letterSpacing: "1px" }}>
                {activeView === "demand" ? "Mahalaxmi Kit Demand Data | " : "Mahalaxmi Kit Distribution Data | "}
              </h2>
              <div style={{ height: "3px", width: "80px", backgroundColor: "#fd7e14", margin: "10px 0" }}></div>
            </div>
            <div className="d-flex gap-2">
              <Button 
                variant={activeView === "demand" ? "primary" : "outline-primary"} 
                size="sm" 
                className="px-4 fw-bold text-white shadow-sm" 
                style={{ backgroundColor: activeView === "demand" ? "#004d4d" : "#6c757d", border: "none" }}
                onClick={() => handleViewChange("demand")}
              >
                Demand Data
              </Button>
              <Button 
                variant={activeView === "distribution" ? "success" : "outline-success"} 
                size="sm" 
                className="px-4 fw-bold text-white shadow-sm" 
                style={{ backgroundColor: activeView === "distribution" ? "#28a745" : "#6c757d", border: "none" }}
                onClick={() => handleViewChange("distribution")}
              >
                Distribution Report
              </Button>
            </div>
          </div>

          {activeView === "demand" && (
            <>
              <Card className="border-0 shadow-sm mb-4">
                <Card.Body className="p-4">
                  <Row className="g-3 align-items-end justify-content-center">
                    <Col md={3}>
                      <Form.Label className="fw-bold small">Choose Financial Year</Form.Label>
                      <Form.Select size="sm" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                        <option value="All">All Financial Years</option>
                        {financialYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <Form.Label className="fw-bold small">Choose Quarter</Form.Label>
                      <Form.Select size="sm" value={quarter} onChange={(e) => setQuarter(e.target.value)}>
                        <option value="All">All Quarters</option>
                        <option value="Apr-May-June">Apr-May-June</option>
                        <option value="July-Aug-Sept">July-Aug-Sept</option>
                        <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                        <option value="Jan-Feb-March">Jan-Feb-March</option>
                      </Form.Select>
                    </Col>
                    <Col md="auto">
                      <Button variant="warning" size="sm" className="px-4 fw-bold text-white shadow-sm" onClick={handleFilter} disabled={loading} style={{ backgroundColor: "#fd7e14", border: "none" }}>
                        Filter
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

              <div className="bg-white p-3 rounded shadow-sm">
                <Row className="mb-3 align-items-center">
                  <Col md={6} className="d-flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handleCopy}>
                      {copySuccess ? <FaCheck className="me-1" /> : <FaCopy className="me-1" />}
                      {copySuccess ? "Copied" : "Copy"}
                    </Button>
                    <Button variant="success" size="sm" onClick={handleExcel}>
                      <FaFileExcel className="me-1" />
                      Excel
                    </Button>
                    <Button variant="danger" size="sm" onClick={handlePDF}>
                      <FaFilePdf className="me-1" />
                      PDF
                    </Button>
                    <Button variant="info" size="sm" onClick={() => setShowColumnModal(true)}>
                      <FaEye className="me-1" />
                      Column visibility
                    </Button>
                  </Col>
                  <Col md={6}>
                    <InputGroup size="sm" className="justify-content-end">
                      <InputGroup.Text className="bg-white border-end-0"><FaSearch className="text-muted" /></InputGroup.Text>
                      <Form.Control placeholder="Search..." className="border-start-0" style={{ maxWidth: "250px" }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </InputGroup>
                  </Col>
                </Row>

                {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

                <div className="table-responsive">
                  <Table striped bordered hover size="sm" className="mb-0" ref={tableRef}>
                    <thead style={{ backgroundColor: "#004d4d", color: "#fff" }}>
                      <tr className="text-center">
                        {visibleColumns.sno && <th className="py-2">S.No</th>}
                        {visibleColumns.district && <th className="py-2">District</th>}
                        {visibleColumns.project && <th className="py-2">Project</th>}
                        {visibleColumns.financial_year && <th className="py-2">Financial Year</th>}
                        {visibleColumns.quarter && <th className="py-2">Quarter</th>}
                        {visibleColumns.beneficiary && <th className="py-2">Beneficiary</th>}
                        {visibleColumns.demand_kits && <th className="py-2">Demand Kits</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="7" className="text-center py-5"><Spinner animation="border" /></td></tr>
                      ) : filteredData.length > 0 ? (
                        renderTableRows(filteredData.slice(startIndex, endIndex))
                      ) : (
                        <tr><td colSpan="7" className="text-center py-4 text-muted">No records found.</td></tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                <div className="d-flex justify-content-between align-items-center mt-3">
                  <div className="text-muted small">
                    Showing {filteredData.length ? startIndex + 1 : 0} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} entries
                  </div>
                  <Pagination size="sm" className="mb-0">
                    <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
                    {renderPaginationItems()}
                    <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                  </Pagination>
                </div>
              </div>
            </>
          )}

          {activeView === "distribution" && (
            <DistributionReportView 
              api={api} 
              quarter={quarter} 
              financialYear={financialYear}
            />
          )}
        </Container>
      </div>

      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title style={{ fontSize: "14px", fontWeight: "bold" }}>Column Visibility</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {tableColumns.map((col) => (
            <Form.Check
              key={col.key}
              type="checkbox"
              id={`col-${col.key}`}
              label={col.label}
              checked={visibleColumns[col.key]}
              onChange={() => setVisibleColumns((prev) => ({ ...prev, [col.key]: !prev[col.key] }))}
              className="mb-2"
              style={{ fontSize: "13px" }}
            />
          ))}
        </Modal.Body>
      </Modal>
    </div>
  );
};

const DistributionReportView = ({ api, quarter, financialYear }) => {
  const [distFinancialYear, setDistFinancialYear] = useState("All");
  const [distQuarter, setDistQuarter] = useState(quarter);
  const [distTableData, setDistTableData] = useState([]);
  const [distUniqueYears, setDistUniqueYears] = useState([]);
  const [distLoading, setDistLoading] = useState(false);
  const [distCopySuccess, setDistCopySuccess] = useState(false);
  const [distCurrentPage, setDistCurrentPage] = useState(1);
  const [showDistColumnModal, setShowDistColumnModal] = useState(false);
  const distEntriesPerPage = 50;

  useEffect(() => {
    setDistFinancialYear(displayFinancialYear(financialYear) || "All");
    setDistQuarter(quarter || "All");
  }, [financialYear, quarter]);

  const distTableColumns = [
    { key: "sno", label: "S.No" },
    { key: "district", label: "District" },
    { key: "financial_year", label: "Financial Year" },
    { key: "quarter", label: "Quarter" },
    { key: "beneficiary", label: "Beneficiary" },
    { key: "demand_kits", label: "Demand Kits" },
    { key: "received_kits", label: "Received Kits" },
    { key: "distributed_kits", label: "Distributed Kits" },
    { key: "available_balance", label: "Available Balance" },
  ];

  const [distVisibleColumns, setDistVisibleColumns] = useState({
    sno: true,
    district: true,
    financial_year: true,
    quarter: true,
    beneficiary: true,
    demand_kits: true,
    received_kits: true,
    distributed_kits: true,
    available_balance: true,
  });

  const distFinancialYearOptions = useMemo(() => getFinancialYearOptions(distUniqueYears), [distUniqueYears]);

  const distOverallTotals = useMemo(() => {
    return distTableData.reduce(
      (acc, item) => {
        acc.beneficiary += Number(item.beneficiary || 0);
        acc.demandKits += Number(item.demand_kits || 0);
        acc.receivedKits += Number(item.received_kits || 0);
        acc.distributedKits += Number(item.distributed_kits || 0);
        acc.availableBalance += Number(item.available_balance || 0);
        return acc;
      },
      { beneficiary: 0, demandKits: 0, receivedKits: 0, distributedKits: 0, availableBalance: 0 }
    );
  }, [distTableData]);

  const distTotalPages = Math.max(1, Math.ceil(distTableData.length / distEntriesPerPage));

  const fetchData = useCallback(async () => {
    if (!api) return;
    setDistLoading(true);
    try {
      const params = { page_size: 5000 };
      if (distFinancialYear !== "All") params.fin_yr = normalizeFinancialYear(distFinancialYear);

      let response = await api.get(`director/mahalaxmi-district/stock-report/`, { params });
      let fetchedData = getResponseData(response);

      if (distFinancialYear !== "All" && fetchedData.length === 0) {
        response = await api.get(`director/mahalaxmi-district/stock-report/`, { params: { page_size: 5000 } });
        fetchedData = getResponseData(response);
      }

      const quarterMonths = distQuarter === "All" ? null : getQuarterMonths(distQuarter);

      const filteredData = fetchedData.filter((item) => {
        const itemYear = displayFinancialYear(getFinancialYearValue(item));
        const itemQuarter = getQuarterValue(item);
        const matchesYear = distFinancialYear === "All" || itemYear === distFinancialYear;
        const matchesQuarter = distQuarter === "All" || (quarterMonths && quarterMonths.includes(itemQuarter));
        return matchesYear && matchesQuarter;
      });

      const mappedData = filteredData.map(item => ({
        ...item,
        financial_year: displayFinancialYear(getFinancialYearValue(item)),
        quarter: getQuarterValue(item),
        beneficiary: item.beneficiary || 0,
        demand_kits: item.demand_kits || 0,
        received_kits: item.received_kits || 0,
        distributed_kits: item.distributed_kits || 0,
        available_balance: item.available_balance || 0,
        _display_quarter: distQuarter === "All" ? "All" : getQuarterValue(item),
      }));
      setDistTableData(mappedData);
      setDistUniqueYears([...new Set(fetchedData.map(getFinancialYearValue))].filter(Boolean).map(displayFinancialYear).sort());
    } catch (err) {
      console.error("Error fetching distribution report:", err);
      setDistTableData([]);
    } finally {
      setDistLoading(false);
    }
  }, [api, distFinancialYear, distQuarter]);

  useEffect(() => {
    setDistCurrentPage(1);
    fetchData();
  }, [fetchData]);

  const handleDistFilter = () => {
    setDistCurrentPage(1);
    fetchData();
  };

  const getDistExportData = () => {
    return distTableData.map((row, index) => ({
      sno: index + 1,
      district: row.district ?? "",
      financial_year: row.financial_year ?? "",
      quarter: (row._display_quarter || row.quarter) ?? "",
      beneficiary: row.beneficiary ?? "",
      demand_kits: row.demand_kits ?? "",
      received_kits: row.received_kits ?? "",
      distributed_kits: row.distributed_kits ?? "",
      available_balance: row.available_balance ?? "",
    }));
  };

  const handleDistCopy = async () => {
    const visibleCols = distTableColumns.filter((col) => distVisibleColumns[col.key]);
    const escapeCsv = (value) => String(value ?? "");
    const rows = getDistExportData();
    const totalRow = {
      sno: "",
      district: "",
      financial_year: "",
      quarter: "",
      beneficiary: distOverallTotals.beneficiary,
      demand_kits: distOverallTotals.demandKits,
      received_kits: distOverallTotals.receivedKits,
      distributed_kits: distOverallTotals.distributedKits,
      available_balance: distOverallTotals.availableBalance,
    };

    const text = [
      "MAHALAXMI KIT DISTRIBUTION DATA (DISTRICT WISE)",
      `For the year: ${distFinancialYear} and Quarter: ${distQuarter}`,
      "",
      visibleCols.map((col) => col.label).join("\t"),
      ...rows.map((row) => visibleCols.map((col) => escapeCsv(row[col.key])).join("\t")),
      visibleCols.map((col) => escapeCsv(totalRow[col.key])).join("\t"),
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setDistCopySuccess(true);
      setTimeout(() => setDistCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDistExcel = () => {
    const visibleCols = distTableColumns.filter((col) => distVisibleColumns[col.key]);
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = getDistExportData();
    const totalRow = {
      sno: "",
      district: "",
      financial_year: "",
      quarter: "",
      beneficiary: distOverallTotals.beneficiary,
      demand_kits: distOverallTotals.demandKits,
      received_kits: distOverallTotals.receivedKits,
      distributed_kits: distOverallTotals.distributedKits,
      available_balance: distOverallTotals.availableBalance,
    };

    let csv = "MAHALAXMI KIT DISTRIBUTION DATA (DISTRICT WISE)\n";
    csv += `For the year: ${distFinancialYear}, Quarter: ${distQuarter}\n\n`;
    csv += visibleCols.map((col) => escapeCsv(col.label)).join(",") + "\n";
    csv += rows.map((row) => visibleCols.map((col) => escapeCsv(row[col.key])).join(",")).join("\n");
    csv += visibleCols.map((col) => escapeCsv(totalRow[col.key])).join(",");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Mahalaxmi_Kit_Distribution_Report_${financialYear || "All"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDistPDF = () => {
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const rows = getDistExportData();
    const tbodyRows = rows.map((row) => `
      <tr>
        <td class="text-center">${row.sno}</td>
        <td>${row.district}</td>
        <td class="text-center">${row.financial_year}</td>
        <td class="text-center">${row.quarter}</td>
        <td class="text-center">${row.beneficiary}</td>
        <td class="text-center">${row.demand_kits}</td>
        <td class="text-center">${row.received_kits}</td>
        <td class="text-center">${row.distributed_kits}</td>
        <td class="text-center">${row.available_balance}</td>
      </tr>
    `).join("");

    const overallRow = `
      <tr style="background-color:#004d4d;color:#fff;font-weight:bold;">
        <td></td>
        <td class="text-start" style="padding:8px;">Overall Total</td>
        <td></td><td></td>
        <td class="text-center">${distOverallTotals.beneficiary}</td>
        <td class="text-center">${distOverallTotals.demandKits}</td>
        <td class="text-center">${distOverallTotals.receivedKits}</td>
        <td class="text-center">${distOverallTotals.distributedKits}</td>
        <td class="text-center">${distOverallTotals.availableBalance}</td>
      </tr>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Mahalaxmi Kit Distribution Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            th { background-color: #f1f5f9; }
            h2 { text-align: center; color: #004d4d; }
          </style>
        </head>
        <body>
          <h2>Mahalaxmi Kit Distribution Data | District Wise</h2>
          <h4 style="text-align:center;color:#dc2626;">For the year: ${distFinancialYear} and Quarter: ${distQuarter}</h4>
          <table>
            <thead>
              <tr style="background-color:#004d4d;color:#fff;">
                <th style="padding:6px;">S.No</th>
                <th style="padding:6px;">District</th>
                <th style="padding:6px;">Financial Year</th>
                <th style="padding:6px;">Quarter</th>
                <th style="padding:6px;">Beneficiary</th>
                <th style="padding:6px;">Demand Kits</th>
                <th style="padding:6px;">Received Kits</th>
                <th style="padding:6px;">Distributed Kits</th>
                <th style="padding:6px;">Available Balance</th>
              </tr>
            </thead>
            <tbody>${tbodyRows}${overallRow}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderDistTableRows = (data) => {
    if (data.length === 0) return null;
    const rows = data.map((row, index) => (
      <tr key={row.sno || index}>
        {distVisibleColumns.sno && <td className="text-center">{(distCurrentPage - 1) * distEntriesPerPage + index + 1}</td>}
        {distVisibleColumns.district && <td>{row.district}</td>}
        {distVisibleColumns.financial_year && <td className="text-center">{row.financial_year}</td>}
        {distVisibleColumns.quarter && <td className="text-center">{row._display_quarter || row.quarter}</td>}
        {distVisibleColumns.beneficiary && <td className="text-center">{row.beneficiary}</td>}
        {distVisibleColumns.demand_kits && <td className="text-center">{row.demand_kits}</td>}
        {distVisibleColumns.received_kits && <td className="text-center">{row.received_kits}</td>}
        {distVisibleColumns.distributed_kits && <td className="text-center">{row.distributed_kits}</td>}
        {distVisibleColumns.available_balance && <td className="text-center">{row.available_balance}</td>}
      </tr>
    ));
    rows.push(
      <tr key="overall-total" style={{ backgroundColor: "#004d4d", color: "#fff", fontWeight: "bold" }}>
        {distVisibleColumns.sno && <td></td>}
        {distVisibleColumns.district && <td className="text-start py-3">Overall Total</td>}
        {distVisibleColumns.financial_year && <td></td>}
        {distVisibleColumns.quarter && <td></td>}
        {distVisibleColumns.beneficiary && <td className="text-center">{distOverallTotals.beneficiary}</td>}
        {distVisibleColumns.demand_kits && <td className="text-center">{distOverallTotals.demandKits}</td>}
        {distVisibleColumns.received_kits && <td className="text-center">{distOverallTotals.receivedKits}</td>}
        {distVisibleColumns.distributed_kits && <td className="text-center">{distOverallTotals.distributedKits}</td>}
        {distVisibleColumns.available_balance && <td className="text-center">{distOverallTotals.availableBalance}</td>}
      </tr>
    );
    return rows;
  };

  const renderDistPaginationItems = () => {
    const pages = [];
    const maxPageButtons = 5;
    const halfMaxPageButtons = Math.floor(maxPageButtons / 2);

    if (distTotalPages <= maxPageButtons + 2) {
      for (let page = 1; page <= distTotalPages; page++) {
        pages.push(
          <Pagination.Item
            key={page}
            active={page === distCurrentPage}
            onClick={() => setDistCurrentPage(page)}
          >
            {page}
          </Pagination.Item>
        );
      }
    } else {
      pages.push(
        <Pagination.Item key="1" active={1 === distCurrentPage} onClick={() => setDistCurrentPage(1)}>1</Pagination.Item>
      );

      if (distCurrentPage > halfMaxPageButtons + 2) {
        pages.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
      }

      let startPage = Math.max(2, distCurrentPage - halfMaxPageButtons);
      let endPage = Math.min(distTotalPages - 1, distCurrentPage + halfMaxPageButtons);

      if (distCurrentPage <= halfMaxPageButtons + 1) {
        endPage = maxPageButtons;
      } else if (distCurrentPage >= distTotalPages - halfMaxPageButtons) {
        startPage = distTotalPages - maxPageButtons + 1;
      }

      for (let page = startPage; page <= endPage; page++) {
        pages.push(
          <Pagination.Item key={page} active={page === distCurrentPage} onClick={() => setDistCurrentPage(page)}>
            {page}
          </Pagination.Item>
        );
      }

      if (distCurrentPage < distTotalPages - halfMaxPageButtons - 1) {
        pages.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
      }

      pages.push(
        <Pagination.Item key={distTotalPages} active={distTotalPages === distCurrentPage} onClick={() => setDistCurrentPage(distTotalPages)}>{distTotalPages}</Pagination.Item>
      );
    }

    return pages;
  };

  return (
    <div className="bg-white p-3 rounded shadow-sm">
      <Card className="border-0 shadow-sm mb-4">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-end justify-content-center">
            <Col md={3}>
              <Form.Label className="fw-bold small">Choose Financial Year</Form.Label>
              <Form.Select size="sm" value={distFinancialYear} onChange={(e) => setDistFinancialYear(e.target.value)}>
                <option value="All">All Financial Years</option>
                {distFinancialYearOptions.map(year => <option key={year} value={year}>{year}</option>)}
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label className="fw-bold small">Choose Quarter</Form.Label>
              <Form.Select size="sm" value={distQuarter} onChange={(e) => setDistQuarter(e.target.value)}>
                <option value="All">All Quarters</option>
                <option value="Apr-May-June">Apr-May-June</option>
                <option value="July-Aug-Sept">July-Aug-Sept</option>
                <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                <option value="Jan-Feb-March">Jan-Feb-March</option>
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button variant="warning" size="sm" className="px-4 fw-bold text-white shadow-sm" onClick={handleDistFilter} disabled={distLoading} style={{ backgroundColor: "#fd7e14", border: "none" }}>
                Filter
              </Button>
            </Col>
          </Row>
          <div className="text-center mt-3">
            <h6 className="mb-0">
              For the year : <span className="text-danger fw-bold">{distFinancialYear}</span> and Quarter : <span className="text-danger fw-bold">{distQuarter}</span>
            </h6>
          </div>
        </Card.Body>
      </Card>

      <Row className="mb-3 align-items-center">
        <Col md={6} className="d-flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleDistCopy}>
            {distCopySuccess ? <FaCheck className="me-1" /> : <FaCopy className="me-1" />}
            {distCopySuccess ? "Copied" : "Copy"}
          </Button>
          <Button variant="success" size="sm" onClick={handleDistExcel}>
            <FaFileExcel className="me-1" />
            Excel
          </Button>
          <Button variant="danger" size="sm" onClick={handleDistPDF}>
            <FaFilePdf className="me-1" />
            PDF
          </Button>
          <Button variant="info" size="sm" onClick={() => setShowDistColumnModal(true)}>
            <FaEye className="me-1" />
            Column visibility
          </Button>
        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered hover size="sm" className="mb-0">
          <thead style={{ backgroundColor: "#004d4d", color: "#fff" }}>
            <tr className="text-center">
              {distVisibleColumns.sno && <th className="py-2">S.No</th>}
              {distVisibleColumns.district && <th className="py-2">District</th>}
              {distVisibleColumns.financial_year && <th className="py-2">Financial Year</th>}
              {distVisibleColumns.quarter && <th className="py-2">Quarter</th>}
              {distVisibleColumns.beneficiary && <th className="py-2">Beneficiary</th>}
              {distVisibleColumns.demand_kits && <th className="py-2">Demand Kits</th>}
              {distVisibleColumns.received_kits && <th className="py-2">Received Kits</th>}
              {distVisibleColumns.distributed_kits && <th className="py-2">Distributed Kits</th>}
              {distVisibleColumns.available_balance && <th className="py-2">Available Balance</th>}
            </tr>
          </thead>
          <tbody>
            {distLoading ? (
              <tr><td colSpan={distTableColumns.filter((col) => distVisibleColumns[col.key]).length} className="text-center py-5"><Spinner animation="border" /></td></tr>
            ) : distTableData.length > 0 ? (
              renderDistTableRows(distTableData.slice((distCurrentPage - 1) * distEntriesPerPage, distCurrentPage * distEntriesPerPage))
            ) : (
              <tr><td colSpan={distTableColumns.filter((col) => distVisibleColumns[col.key]).length} className="text-center py-4 text-muted">No records found.</td></tr>
            )}
          </tbody>
        </Table>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted small">
          Showing {distTableData.length ? (distCurrentPage - 1) * distEntriesPerPage + 1 : 0} to {Math.min(distCurrentPage * distEntriesPerPage, distTableData.length)} of {distTableData.length} entries
        </div>
        <Pagination size="sm" className="mb-0">
          <Pagination.First onClick={() => setDistCurrentPage(1)} disabled={distCurrentPage === 1} />
          <Pagination.Prev onClick={() => setDistCurrentPage(prev => Math.max(prev - 1, 1))} disabled={distCurrentPage === 1} />
          {renderDistPaginationItems()}
          <Pagination.Next onClick={() => setDistCurrentPage(prev => Math.min(prev + 1, distTotalPages))} disabled={distCurrentPage === distTotalPages} />
          <Pagination.Last onClick={() => setDistCurrentPage(distTotalPages)} disabled={distCurrentPage === distTotalPages} />
        </Pagination>
      </div>

      <Modal show={showDistColumnModal} onHide={() => setShowDistColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title style={{ fontSize: "14px", fontWeight: "bold" }}>Column Visibility</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {distTableColumns.map((col) => (
            <Form.Check
              key={col.key}
              type="checkbox"
              id={`dist-col-${col.key}`}
              label={col.label}
              checked={distVisibleColumns[col.key]}
              onChange={() => setDistVisibleColumns((prev) => ({ ...prev, [col.key]: !prev[col.key] }))}
              className="mb-2"
              style={{ fontSize: "13px" }}
            />
          ))}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default DirDemandkitProject;
