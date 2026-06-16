import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Container, Row, Col, Card, Spinner, Form, Button, InputGroup, Table, Pagination, Alert, Modal } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaColumns, FaSearch, FaCheck, FaEye } from "react-icons/fa";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";
import "../../../../assets/css/dashboard.css";
import DirectorHeader from "../../DirectorHeader";
import DirectorLeftNav from "../../DirectorLeftNav";

const DirMahilaPoshanDemandProj = () => {
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
  const [dataLoaded, setDataLoaded] = useState(false);

  const entriesPerPage = 50;
  const tableRef = useRef(null);

  const tableColumns = [
    { key: "sno", label: "S.No" },
    { key: "district", label: "District" },
    { key: "project", label: "Project" },
    { key: "financial_year", label: "Financial Year" },
    { key: "quarter", label: "Quarter" },
    { key: "khajur_beneficiary", label: "Total Beneficiary" },
    { key: "egg_eating_beneficiary", label: "Egg Beneficiary" },
    { key: "non_egg_eating_beneficiary", label: "Non Egg Eating Beneficiary" },
  ];

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    financial_year: true,
    quarter: true,
    khajur_beneficiary: true,
    egg_eating_beneficiary: true,
    non_egg_eating_beneficiary: true,
  });

  const filteredData = tableData.filter((item) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = (
      item.district?.toLowerCase().includes(search) ||
      item.project?.toLowerCase().includes(search) ||
      item.financial_year?.toLowerCase().includes(search)
    );
    const matchesYear = financialYear === "All" || item.financial_year === financialYear;
    const matchesQuarter = quarter === "All" || item.quarter === quarter;

    return matchesSearch && matchesYear && matchesQuarter;
  });

  const overallTotals = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.khajur += Number(item.khajur_beneficiary || 0);
        acc.egg += Number(item.egg_eating_beneficiary || 0);
        acc.nonEgg += Number(item.non_egg_eating_beneficiary || 0);
        return acc;
      },
      { khajur: 0, egg: 0, nonEgg: 0 }
    );
  }, [filteredData]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / entriesPerPage));

  const fetchDemandData = useCallback(async () => {
    if (!api) return;
    setLoading(true);
    setError(null);
    try {
      const params = { page_size: 5000 };
      if (financialYear !== "All") params.fin_year = financialYear;
      if (quarter !== "All") params.quarter = quarter;

      const response = await api.get(`director/mp-project-wise-demand/`, { params });
      
      const fetchedData = response.data?.data || [];
      
      const mappedData = fetchedData.map(item => ({
        ...item,
        khajur_beneficiary: item.khajur_beneficiary || 0,
        egg_eating_beneficiary: item.egg_eating_beneficiary || 0,
        non_egg_eating_beneficiary: item.non_egg_eating_beneficiary || 0
      }));
      
      setTableData(mappedData);
      setTotalEntries(response.data?.count || 0);

      if (fetchedData.length > 0 && (financialYear === "All" || uniqueYears.length === 0)) {
        const years = [...new Set(fetchedData.map(item => item.financial_year))].filter(Boolean);
        setUniqueYears(years.sort());
      }
    } catch (err) {
      console.error("Error fetching demand data:", err);
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
    fetchDemandData();
  }, [fetchDemandData]);

  const handleFilter = () => {
    setCurrentPage(1);
    fetchDemandData();
  };

  const getColSpanCount = () => {
    let count = 0;
    if (visibleColumns.sno) count++;
    if (visibleColumns.district) count++;
    if (visibleColumns.project) count++;
    if (visibleColumns.financial_year) count++;
    if (visibleColumns.quarter) count++;
    return count;
  };

  const renderTableRows = (data) => {
    if (data.length === 0) return null;

    const rows = data.map((row, index) => (
      <tr key={row.id || index}>
        {visibleColumns.sno && <td className="text-center">{(currentPage - 1) * entriesPerPage + index + 1}</td>}
        {visibleColumns.district && <td>{row.district}</td>}
        {visibleColumns.project && <td>{row.project}</td>}
        {visibleColumns.financial_year && <td className="text-center">{row.financial_year}</td>}
        {visibleColumns.quarter && <td className="text-center">{row.quarter}</td>}
        {visibleColumns.khajur_beneficiary && <td className="text-center">{row.khajur_beneficiary}</td>}
        {visibleColumns.egg_eating_beneficiary && <td className="text-center">{row.egg_eating_beneficiary}</td>}
        {visibleColumns.non_egg_eating_beneficiary && <td className="text-center">{row.non_egg_eating_beneficiary}</td>}
      </tr>
    ));

    rows.push(
      <tr key="overall-total" style={{ backgroundColor: "#004d4d", color: "#fff", fontWeight: "bold" }}>
        <td colSpan={getColSpanCount()} className="text-end py-3">Overall Total</td>
        {visibleColumns.khajur_beneficiary && <td className="text-center">{overallTotals.khajur}</td>}
        {visibleColumns.egg_eating_beneficiary && <td className="text-center">{overallTotals.egg}</td>}
        {visibleColumns.non_egg_eating_beneficiary && <td className="text-center">{overallTotals.nonEgg}</td>}
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
        <Pagination.Item key={1} active={1 === currentPage} onClick={() => setCurrentPage(1)}>1</Pagination.Item>
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
      project: row.project ?? "",
      financial_year: row.financial_year ?? "",
      quarter: row.quarter ?? "",
      khajur_beneficiary: row.khajur_beneficiary ?? "",
      egg_eating_beneficiary: row.egg_eating_beneficiary ?? "",
      non_egg_eating_beneficiary: row.non_egg_eating_beneficiary ?? "",
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
      khajur_beneficiary: overallTotals.khajur,
      egg_eating_beneficiary: overallTotals.egg,
      non_egg_eating_beneficiary: overallTotals.nonEgg,
    };

    const text = [
      "MAHILA POSHAN DEMAND DATA (PROJECT WISE)",
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
      khajur_beneficiary: overallTotals.khajur,
      egg_eating_beneficiary: overallTotals.egg,
      non_egg_eating_beneficiary: overallTotals.nonEgg,
    };

    let csv = "MAHILA POSHAN DEMAND DATA (PROJECT WISE)\n";
    csv += `For the year: ${financialYear}, Quarter: ${quarter}\n\n`;
    csv += visibleCols.map((col) => escapeCsv(col.label)).join(",") + "\n";
    csv += rows.map((row) => visibleCols.map((col) => escapeCsv(row[col.key])).join(",")).join("\n");
    csv += visibleCols.map((col) => escapeCsv(totalRow[col.key])).join(",");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Mahila_Poshan_Project_Report_${financialYear || "All"}.csv`;
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
        <td class="text-center">${row.khajur_beneficiary}</td>
        <td class="text-center">${row.egg_eating_beneficiary}</td>
        <td class="text-center">${row.non_egg_eating_beneficiary}</td>
      </tr>
    `).join("");

    const overallRow = `
      <tr style="background-color:#004d4d;color:#fff;font-weight:bold;">
        <td></td>
        <td class="text-start" style="padding:8px;">Overall Total</td>
        <td></td><td></td><td></td>
        <td class="text-center">${overallTotals.khajur}</td>
        <td class="text-center">${overallTotals.egg}</td>
        <td class="text-center">${overallTotals.nonEgg}</td>
      </tr>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Mahila Poshan Project Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            th { background-color: #f1f5f9; }
            h2 { text-align: center; color: #004d4d; }
          </style>
        </head>
        <body>
          <h2>Mahila Poshan Demand Data | Project Wise</h2>
          <h4 style="text-align:center;color:#dc2626;">For the year: ${financialYear} and Quarter: ${quarter}</h4>
          <table>
            <thead>
              <tr style="background-color:#004d4d;color:#fff;">
                <th style="padding:6px;">S.No</th>
                <th style="padding:6px;">District</th>
                <th style="padding:6px;">Project</th>
                <th style="padding:6px;">Financial Year</th>
                <th style="padding:6px;">Quarter</th>
                <th style="padding:6px;">Total Beneficiary</th>
                <th style="padding:6px;">Egg Beneficiary</th>
                <th style="padding:6px;">Non Egg Eating Beneficiary</th>
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
          <div className="text-center mb-4">
            <h2 className="fw-bold" style={{ color: "#004d4d", letterSpacing: "1px" }}>
              Mahila Poshan Demand Data | Project wise
            </h2>
            <div style={{ height: "3px", width: "80px", backgroundColor: "#fd7e14", margin: "10px auto" }}></div>
          </div>

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
                    {visibleColumns.project && <th className="py-2">Project</th>}
                    {visibleColumns.financial_year && <th className="py-2">Financial Year</th>}
                    {visibleColumns.quarter && <th className="py-2">Quarter</th>}
                    {visibleColumns.khajur_beneficiary && <th className="py-2">Total Beneficiary</th>}
                    {visibleColumns.egg_eating_beneficiary && <th className="py-2">Egg Beneficiary</th>}
                    {visibleColumns.non_egg_eating_beneficiary && <th className="py-2">Non Egg Eating Beneficiary</th>}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="8" className="text-center py-5"><Spinner animation="border" /></td></tr>
                  ) : filteredData.length > 0 ? (
                    renderTableRows(
                      filteredData.slice(startIndex, endIndex)
                    )
                  ) : (
                    <tr><td colSpan="8" className="text-center py-4 text-muted">No records found.</td></tr>
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

export default DirMahilaPoshanDemandProj;