import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, InputGroup, Table, Pagination, Alert, Modal } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaEye, FaCheck, FaSearch } from "react-icons/fa";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";
import "../../../../assets/css/dashboard.css";
import DirectorHeader from "../../DirectorHeader";
import DirectorLeftNav from "../../DirectorLeftNav";

const DirDemandkitDistrict = () => {
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
    { key: "financial_year", label: "Financial Year" },
    { key: "quarter", label: "Quarter" },
    { key: "no_of_beneficiaries", label: "No of Beneficiaries" },
    { key: "required_kits", label: "Required Kits" },
  ];

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    financial_year: true,
    quarter: true,
    no_of_beneficiaries: true,
    required_kits: true,
  });

  const getQuarterMonths = (quarter) => {
    switch (quarter) {
      case "Apr-May-June": return ["Apr-May-Jun"];
      case "July-Aug-Sept": return ["Jul-Aug-Sep"];
      case "Oct-Nov-Dec": return ["Oct-Nov-Dec"];
      case "Jan-Feb-March": return ["Jan-Feb-Mar"];
      default: return [];
    }
  };

  const filteredData = tableData.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      item.district?.toLowerCase().includes(search) ||
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
        acc.beneficiaries += Number(item.no_of_beneficiaries || 0);
        acc.kits += Number(item.required_kits || 0);
        return acc;
      },
      { beneficiaries: 0, kits: 0 }
    );
  }, [filteredData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / entriesPerPage));

  const fetchDemandData = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const params = { page_size: 5000 };
      if (financialYear !== "All") params.fin_yr = financialYear;

      const response = await api.get(`director/mahalaxmi-demand/district-wise/`, { params });

      const fetchedData = response.data?.data || [];

      const mappedData = fetchedData.map(item => ({
        ...item,
        financial_year: item.financial_year || "",
        quarter: item.quarter || "",
        no_of_beneficiaries: item.no_of_beneficiaries || 0,
        required_kits: item.required_kits || 0,
        _display_quarter: quarter === "All" ? "All" : (item.quarter || ""),
      }));

      setTableData(mappedData);
      setTotalEntries(fetchedData.length || 0);

      if (fetchedData.length > 0 && (financialYear === "All" || uniqueYears.length === 0)) {
        const years = [...new Set(fetchedData.map(item => item.financial_year))].filter(Boolean);
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
          {visibleColumns.sno && <td className="text-center">{(currentPage - 1) * entriesPerPage + index + 1}</td>}
          {visibleColumns.district && <td>{row.district}</td>}
          {visibleColumns.financial_year && <td className="text-center">{row.financial_year}</td>}
          {visibleColumns.quarter && <td className="text-center">{row._display_quarter || row.quarter}</td>}
          {visibleColumns.no_of_beneficiaries && <td className="text-center">{row.no_of_beneficiaries}</td>}
          {visibleColumns.required_kits && <td className="text-center">{row.required_kits}</td>}
        </tr>
      );
    });

    rows.push(
      <tr key="overall-total" style={{ backgroundColor: "#004d4d", color: "#fff", fontWeight: "bold" }}>
        {visibleColumns.sno && <td></td>}
        {visibleColumns.district && <td className="text-start py-3">Overall Total</td>}
        {visibleColumns.financial_year && <td></td>}
        {visibleColumns.quarter && <td></td>}
        {visibleColumns.no_of_beneficiaries && <td className="text-center">{overallTotals.beneficiaries}</td>}
        {visibleColumns.required_kits && <td className="text-center">{overallTotals.kits}</td>}
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
      sno: index + 1,
      district: row.district ?? "",
      financial_year: row.financial_year ?? "",
      quarter: (row._display_quarter || row.quarter) ?? "",
      no_of_beneficiaries: row.no_of_beneficiaries ?? "",
      required_kits: row.required_kits ?? "",
    }));
  };

  const handleCopy = async () => {
    const visibleCols = tableColumns.filter((col) => visibleColumns[col.key]);
    const escapeCsv = (value) => String(value ?? "");

    const rows = getExportData();

    const totalRow = {
      sno: "",
      district: "",
      financial_year: "",
      quarter: "",
      no_of_beneficiaries: overallTotals.beneficiaries,
      required_kits: overallTotals.kits,
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
      financial_year: "",
      quarter: "",
      no_of_beneficiaries: overallTotals.beneficiaries,
      required_kits: overallTotals.kits,
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
        <td class="text-center">${row.financial_year}</td>
        <td class="text-center">${row.quarter}</td>
        <td class="text-center">${row.no_of_beneficiaries}</td>
        <td class="text-center">${row.required_kits}</td>
      </tr>
    `).join("");

    const overallRow = `
      <tr style="background-color:#004d4d;color:#fff;font-weight:bold;">
        <td></td>
        <td class="text-start" style="padding:8px;">Overall Total</td>
        <td></td><td></td>
        <td class="text-center">${overallTotals.beneficiaries}</td>
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
                <th style="padding:6px;">Financial Year</th>
                <th style="padding:6px;">Quarter</th>
                <th style="padding:6px;">No of Beneficiaries</th>
                <th style="padding:6px;">Required Kits</th>
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
                {activeView === "demand" ? "Mahalaxmi Kit Demand Data | District wise" : "Mahalaxmi Kit Distribution Data | District wise"}
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
                        {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
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
                        {visibleColumns.financial_year && <th className="py-2">Financial Year</th>}
                        {visibleColumns.quarter && <th className="py-2">Quarter</th>}
                        {visibleColumns.no_of_beneficiaries && <th className="py-2">No of Beneficiaries</th>}
                        {visibleColumns.required_kits && <th className="py-2">Required Kits</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr><td colSpan="6" className="text-center py-5"><Spinner animation="border" /></td></tr>
                      ) : filteredData.length > 0 ? (
                        renderTableRows(filteredData.slice(startIndex, endIndex))
                      ) : (
                        <tr><td colSpan="6" className="text-center py-4 text-muted">No records found.</td></tr>
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
  const [distTableData, setDistTableData] = useState([]);
  const [distUniqueYears, setDistUniqueYears] = useState([]);
  const [distLoading, setDistLoading] = useState(false);
  const [distCurrentPage, setDistCurrentPage] = useState(1);
  const distEntriesPerPage = 50;

  const distVisibleColumns = {
    sno: true,
    district: true,
    financial_year: true,
    quarter: true,
    beneficiary: true,
    demand_kits: true,
    received_kits: true,
    distributed_kits: true,
    available_balance: true,
  };

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
      if (financialYear !== "All") params.fin_yr = financialYear;

      const response = await api.get(`director/mahalaxmi-district/stock-report/`, { params });
      const fetchedData = response.data?.data || [];
      const quarterMonths = quarter === "All" ? null : getQuarterMonths(quarter);

      const filteredData = fetchedData.filter((item) => {
        const itemYear = item.financial_year || item.fin_yr || "";
        const matchesYear = financialYear === "All" || itemYear === financialYear;
        const matchesQuarter = quarter === "All" || (quarterMonths && quarterMonths.includes(item.quarter));
        return matchesYear && matchesQuarter;
      });

      const mappedData = filteredData.map(item => ({
        ...item,
        financial_year: item.financial_year || item.fin_yr || "",
        quarter: item.quarter || "",
        beneficiary: item.beneficiary || 0,
        demand_kits: item.demand_kits || 0,
        received_kits: item.received_kits || 0,
        distributed_kits: item.distributed_kits || 0,
        available_balance: item.available_balance || 0,
        _display_quarter: quarter === "All" ? "All" : (item.quarter || ""),
      }));
      setDistTableData(mappedData);
      setDistUniqueYears([...new Set(fetchedData.map(item => item.financial_year || item.fin_yr))].filter(Boolean).sort());
    } catch (err) {
      console.error("Error fetching distribution report:", err);
      setDistTableData([]);
    } finally {
      setDistLoading(false);
    }
  }, [api, financialYear, quarter]);

  useEffect(() => {
    setDistCurrentPage(1);
    fetchData();
  }, [fetchData]);

  const handleDistFilter = () => {
    setDistCurrentPage(1);
    fetchData();
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
              <Form.Select size="sm" value={financialYear} onChange={(e) => setFinancialYear(e.target.value)}>
                <option value="All">All Financial Years</option>
                {distUniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
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
              <Button variant="warning" size="sm" className="px-4 fw-bold text-white shadow-sm" onClick={handleDistFilter} disabled={distLoading} style={{ backgroundColor: "#fd7e14", border: "none" }}>
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

      <Row className="mb-3 align-items-center">
        <Col md={6} className="d-flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => {}}>
            <FaCopy className="me-1" />
            Copy
          </Button>
          <Button variant="success" size="sm" onClick={() => {}}>
            <FaFileExcel className="me-1" />
            Excel
          </Button>
          <Button variant="danger" size="sm" onClick={() => {}}>
            <FaFilePdf className="me-1" />
            PDF
          </Button>
        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered hover size="sm" className="mb-0">
          <thead style={{ backgroundColor: "#004d4d", color: "#fff" }}>
            <tr className="text-center">
              <th className="py-2">S.No</th>
              <th className="py-2">District</th>
              <th className="py-2">Financial Year</th>
              <th className="py-2">Quarter</th>
              <th className="py-2">Beneficiary</th>
              <th className="py-2">Demand Kits</th>
              <th className="py-2">Received Kits</th>
              <th className="py-2">Distributed Kits</th>
              <th className="py-2">Available Balance</th>
            </tr>
          </thead>
          <tbody>
            {distLoading ? (
              <tr><td colSpan="9" className="text-center py-5"><Spinner animation="border" /></td></tr>
            ) : distTableData.length > 0 ? (
              renderDistTableRows(distTableData.slice((distCurrentPage - 1) * distEntriesPerPage, distCurrentPage * distEntriesPerPage))
            ) : (
              <tr><td colSpan="9" className="text-center py-4 text-muted">No records found.</td></tr>
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
    </div>
  );
};

export default DirDemandkitDistrict;
