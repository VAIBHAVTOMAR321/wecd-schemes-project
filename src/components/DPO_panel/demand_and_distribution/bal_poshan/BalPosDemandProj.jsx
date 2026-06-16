import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Card, Table, Form, InputGroup, FormControl, Spinner, Button, Alert, Modal } from "react-bootstrap";
import Pagination from "react-bootstrap/Pagination";
import { FaCopy, FaFileExcel, FaFilePdf, FaCheck, FaEye } from "react-icons/fa";
import DPOLeftNav from "../../DPOLeftNav";
import DPOHeader from "../../DPOHeader";
import { useAuth } from "../../../all_login/AuthContext";

const financialYears = ["2024-25", "2025-26", "2026-27"];
const quarters = [
  { value: "All", label: "All Quarters" },
  { value: "Apr-May-June", label: "First Quarter(Apr/May/June)" },
  { value: "July-Aug-Sept", label: "Second Quarter(July/Aug/Sept)" },
  { value: "Oct-Nov-Dec", label: "Third Quarter(Oct/Nov/Dec)" },
  { value: "Jan-Feb-March", label: "Fourth Quarter(Jan/Feb/March)" },
];

const mainTableColumns = [
  { key: "sno", label: "S.No" },
  { key: "demandId", label: "Demand ID" },
  { key: "projectName", label: "Project Name" },
  { key: "sector", label: "Sector" },
  { key: "financialYear", label: "Financial Year" },
  { key: "quarter", label: "Quarter" },
  { key: "oldBalance", label: "Old Balance" },
  { key: "kelaBeneficiary", label: "Kela Chips Beneficiary" },
  { key: "eggBeneficiary", label: "Egg Beneficiary" },
  { key: "nonEggBeneficiary", label: "Not Eat Egg Beneficiary" },
];

const distTableColumns = [
  { key: "distProjectName", label: "Project Name" },
  { key: "distSector", label: "Sector" },
  { key: "distMonth", label: "Month" },
  { key: "allottedKela", label: "Allotted Kela" },
  { key: "allottedEgg", label: "Allotted Egg" },
  { key: "allottedKhajur", label: "Allotted Khajur" },
  { key: "kelaBene", label: "Kela Bene" },
  { key: "eggBene", label: "Egg Bene" },
  { key: "khajurBene", label: "Khajur Bene" },
  { key: "kelaDist", label: "Kela Dist" },
  { key: "eggDist", label: "Egg Dist" },
  { key: "khajurDist", label: "Khajur Dist" },
];

const BalPosDemandProj = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [totalDemands, setTotalDemands] = useState(null);

  const [selectedFinYear, setSelectedFinYear] = useState("2025-26");
  const [selectedQuarter, setSelectedQuarter] = useState("All");
  const [fetchKey, setFetchKey] = useState(0);
  const [hasAppliedFilter, setHasAppliedFilter] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const tableRef = useRef(null);
  const distTableRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    demandId: true,
    projectName: true,
    sector: true,
    financialYear: true,
    quarter: true,
    oldBalance: true,
    kelaBeneficiary: true,
    eggBeneficiary: true,
    nonEggBeneficiary: true,
    distProjectName: true,
    distSector: true,
    distMonth: true,
    allottedKela: true,
    allottedEgg: true,
    allottedKhajur: true,
    kelaBene: true,
    eggBene: true,
    khajurBene: true,
    kelaDist: true,
    eggDist: true,
    khajurDist: true,
  });

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
      setIsMobile(mobile);
      setIsTablet(tablet);
      setSidebarOpen(mobile ? false : true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);
    
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  useEffect(() => {
    if (!api || !hasAppliedFilter) return;
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = {};
        if (selectedFinYear) params.fin_yr = selectedFinYear;
        if (selectedQuarter) params.qtr = selectedQuarter;
        const response = await api.get("/bal-poshan-project-wise/", { params });
        if (cancelled) return;
        const payload = response.data;
        setTotalDemands(payload?.total_demands ?? null);
        setData(Array.isArray(payload?.data) ? payload.data : []);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch Bal Poshan project-wise data:", err);
          setData([]);
          setTotalDemands(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    setCurrentPage(1);
    return () => { cancelled = true; };
  }, [api, fetchKey, hasAppliedFilter]);

  const filteredData = data.filter((item) => {
    const itemFinancialYear = String(item.financial_year || "").replace(
      /^(\d{4})-(\d{2})(\d{2})$/,
      "$1-$3"
    );
    const itemQuarter = String(item.quarter || "").replace(/\//g, "-").toLowerCase();
    const selectedQuarterValue = selectedQuarter.toLowerCase();

    if (selectedFinYear && itemFinancialYear !== selectedFinYear && !itemFinancialYear.includes(selectedFinYear)) {
      return false;
    }

    if (
      selectedQuarter &&
      selectedQuarter !== "All" &&
      itemQuarter !== selectedQuarterValue &&
      !itemQuarter.includes(selectedQuarterValue)
    ) {
      return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.project_name || "").toLowerCase().includes(term) ||
      (item.sector || "").toLowerCase().includes(term) ||
      (item.financial_year || "").toLowerCase().includes(term) ||
      (item.quarter || "").toLowerCase().includes(term) ||
      String(item.demand_id || "").toLowerCase().includes(term)
    );
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));

  const mainRows = paginatedData.map((item, idx) => {
    const rowNumber = filteredData.findIndex(
      (row) => row.demand_id === item.demand_id && row.project_name === item.project_name && row.sector === item.sector
    );
    return {
      sno: rowNumber >= 0 ? rowNumber + 1 : startIndex + idx + 1,
      demandId: item.demand_id ?? "",
      projectName: item.project_name ?? "",
      sector: item.sector ?? "",
      financialYear: item.financial_year ?? "",
      quarter: item.quarter ?? "",
      oldBalance: item.old_balance ?? "",
      kelaBeneficiary: item.kela_chips_beneficiary ?? "",
      eggBeneficiary: item.egg_beneficiary ?? "",
      nonEggBeneficiary: item.not_eat_egg_beneficiary ?? "",
    };
  });

  const distributionRows = paginatedData.flatMap((item) => {
    if (!Array.isArray(item.distribution)) return [];
    return item.distribution.map((dist) => ({
      distProjectName: item.project_name || "",
      distSector: item.sector || "",
      distMonth: dist.month || "",
      allottedKela: dist.allotted_kela ?? "",
      allottedEgg: dist.allotted_egg ?? "",
      allottedKhajur: dist.allotted_khajur ?? "",
      kelaBene: dist.kela_beneficiary ?? "",
      eggBene: dist.egg_beneficiary ?? "",
      khajurBene: dist.khajur_beneficiary ?? "",
      kelaDist: dist.kela_distribution ?? "",
      eggDist: dist.egg_distribution ?? "",
      khajurDist: dist.khajur_distribution ?? "",
    }));
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleFilterClick = () => {
    if (!selectedFinYear && selectedQuarter === "All") return;
    setHasAppliedFilter(true);
    setFetchKey((prev) => prev + 1);
  };

  const emptyMessage = hasAppliedFilter ? "No records found." : "Select Financial Year or Quarter and click Filter.";

  const displayFinancialYear = (year) => {
    if (!year) return "All";
    return year.replace(/^(\d{4})-(\d{2})$/, "$1-20$2");
  };

  const getVisibleRows = (rows, columns) => rows.map((row) => columns.map((col) => row[col.key] ?? ""));

  const handleCopy = async () => {
    const visibleMainColumns = mainTableColumns.filter((col) => visibleColumns[col.key]);
    const visibleDistColumns = distTableColumns.filter((col) => visibleColumns[col.key]);
    const text = [
      "BAL POSHAN DEMAND DATA (PROJECT WISE)",
      `For the year : ${displayFinancialYear(selectedFinYear)} and Quarter : ${selectedQuarter || "All"}`,
      "",
      visibleMainColumns.map((col) => col.label).join("\t"),
      ...getVisibleRows(mainRows, visibleMainColumns).map((row) => row.join("\t")),
      "",
      "DISTRIBUTION DETAILS",
      visibleDistColumns.map((col) => col.label).join("\t"),
      ...getVisibleRows(distributionRows, visibleDistColumns).map((row) => row.join("\t")),
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
    const visibleMainColumns = mainTableColumns.filter((col) => visibleColumns[col.key]);
    const visibleDistColumns = distTableColumns.filter((col) => visibleColumns[col.key]);
    const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    let csv = "BAL POSHAN DEMAND DATA (PROJECT WISE)\n";
    csv += `For the year : ${displayFinancialYear(selectedFinYear)}, Quarter : ${selectedQuarter || "All"}\n\n`;
    csv += visibleMainColumns.map((col) => escapeCsv(col.label)).join(",") + "\n";
    csv += getVisibleRows(mainRows, visibleMainColumns).map((row) => row.map(escapeCsv).join(",")).join("\n");
    csv += "\n\nDISTRIBUTION DETAILS\n";
    csv += visibleDistColumns.map((col) => escapeCsv(col.label)).join(",") + "\n";
    csv += getVisibleRows(distributionRows, visibleDistColumns).map((row) => row.map(escapeCsv).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bal_Poshan_Project_Report_${selectedFinYear || "All"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePDF = () => {
    if (!tableRef.current) return;
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const distHtml = distributionRows.length > 0 && distTableRef.current
      ? `<div style="margin-top:30px;"><h4 style="color:#dc2626;">Distribution Details</h4>${distTableRef.current.outerHTML}</div>`
      : "";

    printWindow.document.write(`
      <html>
        <head>
          <title>Bal Poshan Project Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: center; }
            th { background-color: #f1f5f9; }
            h2, h4 { text-align: center; color: #dc2626; }
          </style>
        </head>
        <body>
          <h2>Bal Poshan Demand Data | Project Wise</h2>
          <h4>For the year : ${displayFinancialYear(selectedFinYear)} and Quarter : ${selectedQuarter || "All"}</h4>
          ${tableRef.current.outerHTML}
          ${distHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const renderPaginationItems = () => {
    const pages = [];

    if (totalPages <= 7) {
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
      return pages;
    }

    pages.push(
      <Pagination.Item
        key={1}
        active={1 === currentPage}
        onClick={() => setCurrentPage(1)}
      >
        1
      </Pagination.Item>
    );

    if (currentPage > 4) {
      pages.push(<Pagination.Ellipsis key="start-ellipsis" disabled />);
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let page = start; page <= end; page++) {
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

    if (currentPage < totalPages - 3) {
      pages.push(<Pagination.Ellipsis key="end-ellipsis" disabled />);
    }

    pages.push(
      <Pagination.Item
        key={totalPages}
        active={totalPages === currentPage}
        onClick={() => setCurrentPage(totalPages)}
      >
        {totalPages}
      </Pagination.Item>
    );

    return pages;
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

        <Container fluid className="dashboard-box mt-3">
          <div className="main-heading">
            <h3 className="mb-2 fw-bold">Bal Poshan Demand Data | Project Wise</h3>
          </div>

          <Row className="g-3 mb-3 align-items-end">
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">
                  Choose Financial Year
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedFinYear}
                  onChange={(e) => setSelectedFinYear(e.target.value)}
                >
                  <option value="">Select Financial Year</option>
                  {financialYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-bold text-muted text-uppercase">
                  Choose Quarter
                </Form.Label>
                <Form.Select
                  size="sm"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                >
                  <option value="">Select Quarter to view report</option>
                  {quarters.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {(selectedFinYear || selectedQuarter !== "All") && (
              <Col md={2}>
                <Button size="sm" variant="primary" onClick={handleFilterClick} disabled={loading} style={{ fontSize: "8px" }}>
                  Filter
                </Button>
              </Col>
            )}
            <Col md={3}>
              <Card className="border-0 shadow-sm stats-card h-100">
                <Card.Body className="text-center">
                  <Card.Title className="stats-title">Total Demand</Card.Title>
                  <Card.Text className="stats-count">
                    {typeof totalDemands === "number" ? totalDemands : "-"}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-3 mb-3 align-items-center">
            <Col md={12}>
              <p className="mb-0" style={{ color: "red", fontWeight: 600 }}>
                For the year : {displayFinancialYear(selectedFinYear)} and Quarter : {selectedQuarter || "All"}
              </p>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" />
            </div>
          ) : data.length === 0 ? (
            <Alert variant="info" className="mt-2">
              {emptyMessage}
            </Alert>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center gap-2 mb-3 flex-wrap">
                <div className="d-flex gap-2">
                  <Button size="sm" variant="secondary" onClick={handleCopy}>
                    {copySuccess ? <FaCheck className="me-1" /> : <FaCopy className="me-1" />}
                    {copySuccess ? "Copied" : "Copy"}
                  </Button>
                  <Button size="sm" variant="success" onClick={handleExcel}>
                    <FaFileExcel className="me-1" />
                    Excel
                  </Button>
                  <Button size="sm" variant="danger" onClick={handlePDF}>
                    <FaFilePdf className="me-1" />
                    PDF
                  </Button>
                  <Button size="sm" variant="info" onClick={() => setShowColumnModal(true)}>
                    <FaEye className="me-1" />
                    Column visibility
                  </Button>
                </div>
                <InputGroup style={{ maxWidth: "260px" }}>
                  <FormControl
                    size="sm"
                    placeholder="Search by Project, Sector, Demand ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>

              <div className="table-responsive">
                <Table bordered hover size="sm" className="mb-0" ref={tableRef}>
                  <thead className="table-light">
                    <tr>
                      {visibleColumns.sno && <th>S.No</th>}
                      {visibleColumns.demandId && <th>Demand ID</th>}
                      {visibleColumns.projectName && <th>Project Name</th>}
                      {visibleColumns.sector && <th>Sector</th>}
                      {visibleColumns.financialYear && <th>Financial Year</th>}
                      {visibleColumns.quarter && <th>Quarter</th>}
                      {visibleColumns.oldBalance && <th>Old Balance</th>}
                      {visibleColumns.kelaBeneficiary && <th>Kela Chips Beneficiary</th>}
                      {visibleColumns.eggBeneficiary && <th>Egg Beneficiary</th>}
                      {visibleColumns.nonEggBeneficiary && <th>Not Eat Egg Beneficiary</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {mainRows.map((row, idx) => (
                      <tr key={`${row.demandId}-${idx}`}>
                        {visibleColumns.sno && <td>{row.sno}</td>}
                        {visibleColumns.demandId && <td>{row.demandId}</td>}
                        {visibleColumns.projectName && <td>{row.projectName}</td>}
                        {visibleColumns.sector && <td>{row.sector}</td>}
                        {visibleColumns.financialYear && <td>{row.financialYear}</td>}
                        {visibleColumns.quarter && <td>{row.quarter}</td>}
                        {visibleColumns.oldBalance && <td>{row.oldBalance}</td>}
                        {visibleColumns.kelaBeneficiary && <td>{row.kelaBeneficiary}</td>}
                        {visibleColumns.eggBeneficiary && <td>{row.eggBeneficiary}</td>}
                        {visibleColumns.nonEggBeneficiary && <td>{row.nonEggBeneficiary}</td>}
                      </tr>
                    ))}
                    {mainRows.length === 0 && (
                      <tr>
                        <td colSpan={mainTableColumns.filter((col) => visibleColumns[col.key]).length} className="text-center">
                          No matching records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {distributionRows.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold text-danger mb-3">Distribution Details</h6>
                  <div className="table-responsive">
                    <Table bordered hover size="sm" className="mb-0" ref={distTableRef}>
                      <thead className="table-light">
                        <tr>
                          {visibleColumns.distProjectName && <th>Project Name</th>}
                          {visibleColumns.distSector && <th>Sector</th>}
                          {visibleColumns.distMonth && <th>Month</th>}
                          {visibleColumns.allottedKela && <th>Allotted Kela</th>}
                          {visibleColumns.allottedEgg && <th>Allotted Egg</th>}
                          {visibleColumns.allottedKhajur && <th>Allotted Khajur</th>}
                          {visibleColumns.kelaBene && <th>Kela Bene</th>}
                          {visibleColumns.eggBene && <th>Egg Bene</th>}
                          {visibleColumns.khajurBene && <th>Khajur Bene</th>}
                          {visibleColumns.kelaDist && <th>Kela Dist</th>}
                          {visibleColumns.eggDist && <th>Egg Dist</th>}
                          {visibleColumns.khajurDist && <th>Khajur Dist</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {distributionRows.map((dist, idx) => (
                          <tr key={`${dist.distProjectName}-${dist.distSector}-${idx}`}>
                            {visibleColumns.distProjectName && <td>{dist.distProjectName}</td>}
                            {visibleColumns.distSector && <td>{dist.distSector}</td>}
                            {visibleColumns.distMonth && <td>{dist.distMonth}</td>}
                            {visibleColumns.allottedKela && <td>{dist.allottedKela}</td>}
                            {visibleColumns.allottedEgg && <td>{dist.allottedEgg}</td>}
                            {visibleColumns.allottedKhajur && <td>{dist.allottedKhajur}</td>}
                            {visibleColumns.kelaBene && <td>{dist.kelaBene}</td>}
                            {visibleColumns.eggBene && <td>{dist.eggBene}</td>}
                            {visibleColumns.khajurBene && <td>{dist.khajurBene}</td>}
                            {visibleColumns.kelaDist && <td>{dist.kelaDist}</td>}
                            {visibleColumns.eggDist && <td>{dist.eggDist}</td>}
                            {visibleColumns.khajurDist && <td>{dist.khajurDist}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              )}

              <Row className="mt-3">
                <Col className="d-flex justify-content-between align-items-center">
                  <span className="small text-muted">
                    Showing {filteredData.length ? startIndex + 1 : 0}-
                    {Math.min(endIndex, filteredData.length)} of {filteredData.length}
                  </span>
                  <Pagination size="sm">
                    <Pagination.First
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(1)}
                    />
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    />
                    {renderPaginationItems()}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    />
                    <Pagination.Last
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(totalPages)}
                    />
                  </Pagination>
                </Col>
              </Row>
            </>
          )}
        </Container>
      </div>

      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title style={{ fontSize: "14px", fontWeight: "bold" }}>Column Visibility</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="mb-3">
            <h6 className="fw-bold small text-primary border-bottom pb-1">Demand Table</h6>
            {mainTableColumns.map((col) => (
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
          </div>
          <div>
            <h6 className="fw-bold small text-success border-bottom pb-1">Distribution Table</h6>
            {distTableColumns.map((col) => (
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
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BalPosDemandProj;
