import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Form, InputGroup, FormControl, Modal, Dropdown } from "react-bootstrap";
import { FaListAlt, FaSearch, FaCopy, FaFileExcel, FaFilePdf, FaEye, FaArrowUp, FaArrowDown, FaChevronLeft, FaChevronRight, FaTimes, FaCheck } from "react-icons/fa";
import "../../../../assets/css/supervisorleftnav.css";
import DPOLeftNav from "../../DPOLeftNav";
import DPOHeader from "../../DPOHeader";
import { useAuth } from "../../../all_login/AuthContext";

const DemandkitProject = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { user, api } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("All");
  const [availableYears, setAvailableYears] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState("district");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    quarter: true,
    beneficiary: true,
    demandKits: true,
  });

  const ITEMS_PER_PAGE = 10;

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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const quarterMap = {
    "Apr-May-Jun": "First",
    "Jul-Aug-Sep": "Second",
    "Oct-Nov-Dec": "Third",
    "Jan-Feb-Mar": "Fourth"
  };

  const quarterReverseMap = {
    "First": "Apr-May-Jun",
    "Second": "Jul-Aug-Sep",
    "Third": "Oct-Nov-Dec",
    "Fourth": "Jan-Feb-Mar"
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/dpo-demand-kit-report/");
      let rawData = [];
      if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else if (Array.isArray(response.data)) {
        rawData = response.data;
      }
      setData(rawData);

      const years = [...new Set(rawData.map(item => item.fin_year).filter(Boolean))].sort();
      setAvailableYears(years);
      if (years.length > 0 && !selectedYear) {
        setSelectedYear(years[0]);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getFilteredData = () => {
    return data.filter((item) => {
      const matchesYear = !selectedYear || item.fin_year === selectedYear;
      const matchesQuarter = selectedQuarter === "All" || item.quarter === quarterReverseMap[selectedQuarter];
      const matchesSearch = !searchTerm ||
        (item.district && item.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.project && item.project.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesYear && matchesQuarter && matchesSearch;
    });
  };

  const filteredData = useMemo(() => getFilteredData(), [data, selectedYear, selectedQuarter, searchTerm]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal, bVal;
      if (sortColumn === "sno") {
        aVal = a.id || 0;
        bVal = b.id || 0;
      } else if (sortColumn === "district") {
        aVal = a.district || "";
        bVal = b.district || "";
      } else if (sortColumn === "project") {
        aVal = a.project || "";
        bVal = b.project || "";
      } else if (sortColumn === "quarter") {
        aVal = a.quarter || "";
        bVal = b.quarter || "";
      } else if (sortColumn === "beneficiary") {
        aVal = parseInt(a.req_kit_count) || 0;
        bVal = parseInt(b.req_kit_count) || 0;
      } else if (sortColumn === "demandKits") {
        aVal = parseInt(a.req_kit) || 0;
        bVal = parseInt(b.req_kit) || 0;
      } else {
        aVal = "";
        bVal = "";
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [filteredData, sortColumn, sortDirection]);

  const totalBeneficiary = filteredData.reduce((sum, item) => sum + (parseInt(item.req_kit_count) || 0), 0);
  const totalDemandKits = filteredData.reduce((sum, item) => sum + (parseInt(item.req_kit) || 0), 0);
  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const toggleColumn = (column) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const getDisplayQuarter = (q) => {
    if (q === "All") return "All";
    return quarterMap[q] || q;
  };

  const SortIcon = ({ column }) => {
    if (sortColumn !== column) return <><FaArrowUp size={10} style={{ opacity: 0.3 }} /><FaArrowDown size={10} style={{ opacity: 0.3, marginTop: '-2px' }} /></>;
    return sortDirection === "asc" ? <FaArrowUp size={10} className="ms-1" style={{ color: '#6c757d' }} /> : <FaArrowDown size={10} className="ms-1" style={{ color: '#6c757d' }} />;
  };

  const handleCopy = async () => {
    if (paginatedData.length === 0) return;
    const headers = ["S.no", "District", "Project", "Quarter", "Beneficiary", "Demand Kits"];
    const rows = paginatedData.map(item => [
      startIndex + paginatedData.indexOf(item) + 1,
      item.district || "-",
      item.project || "-",
      item.quarter || "-",
      item.req_kit_count || "0",
      item.req_kit || "0",
    ]);
    const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleExcel = () => {
    if (paginatedData.length === 0) return;
    const headers = ["S.no", "District", "Project", "Quarter", "Beneficiary", "Demand Kits"];
    const rows = paginatedData.map(item => [
      startIndex + paginatedData.indexOf(item) + 1,
      item.district || "-",
      item.project || "-",
      item.quarter || "-",
      item.req_kit_count || "0",
      item.req_kit || "0",
    ]);
    let csv = headers.join(",") + "\n";
    rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `Demand_Kit_Report_${selectedYear || "All"}_${selectedQuarter || "All"}_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePDF = () => {
    if (!tableRef.current) return;
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
    const doc = printWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mahalaxmi Kit Demand Data</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h3 { text-align: center; font-size: 22px; margin-bottom: 4px; }
          h5 { text-align: center; font-size: 15px; color: #dc3545; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background-color: #f1f3f5; padding: 8px 6px; border: 1px solid #dee2e6; font-weight: bold; }
          td { padding: 7px 6px; border: 1px solid #dee2e6; text-align: center; }
          tr:nth-child(even) { background-color: #f8f9fa; }
          .total-row td { font-weight: bold; border-top: 2px solid #dee2e6; background-color: #ffffff; }
          .total-label { text-align: right; }
        </style>
      </head>
      <body>
        <h3>Mahalaxmi Kit Demand Data</h3>
        <h5>Demand for the year : ${selectedYear || "All"} and Quarter : ${selectedQuarter === "All" ? "All" : getDisplayQuarter(selectedQuarter)}</h5>
        ${tableRef.current.outerHTML}
      </body>
      </html>
    `);
    doc.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  const allColumns = [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "project", label: "Project" },
    { key: "quarter", label: "Quarter" },
    { key: "beneficiary", label: "Beneficiary" },
    { key: "demandKits", label: "Demand Kits" },
  ];

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
          {/* Main Heading */}
          <div className="main-heading">
            <div className="text-center mb-4">
              <h3 className="mb-0 fw-bold" style={{ color: "#343a40" }}>
                Mahalaxmi Kit Demand Data
              </h3>
            </div>
          </div>

          {/* Filter Section */}
          <Card className="shadow-sm border-0 mb-4" style={{ border: '1px solid #e9ecef' }}>
            <Card.Body className="p-3">
              <Row className="g-2 align-items-center">
                <Col md={3}>
                  <Form.Group className="mb-0">
                    <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '12px' }}>Choose Financial Year</Form.Label>
                    <Form.Select
                      value={selectedYear}
                      onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                      size="sm"
                      className="border-2"
                      style={{ borderColor: '#ced4da' }}
                    >
                      <option value="">Select Financial Year</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-0">
                    <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '12px' }}>Choose Quarter</Form.Label>
                    <Form.Select
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                      size="sm"
                      className="border-2"
                      style={{ borderColor: '#ced4da' }}
                    >
                      <option value="">Select Any One</option>
                      <option value="All">All Quarters</option>
                      <option value="First">First Quarter(Apr/May/June)</option>
                      <option value="Second">Second Quarter(July/Aug/Sept)</option>
                      <option value="Third">Third Quarter(Oct/Nov/Dec)</option>
                      <option value="Fourth">Fourth Quarter(Jan/Feb/March)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2} className="d-flex flex-column justify-content-center">
                  <Button
                    variant="warning"
                    className="w-100 fw-bold shadow-sm"
                    size="sm"
                    style={{ backgroundColor: '#ff9800', borderColor: '#ff9800', color: 'white', fontSize: '12px', fontWeight: 600 }}
                    onClick={() => setCurrentPage(1)}
                  >
                    Filter Now
                  </Button>
                </Col>
                <Col md={4} className="d-flex flex-column justify-content-center">
                  <Button
                    variant="teal"
                    className="fw-bold shadow-sm d-flex align-items-center justify-content-center"
                    size="sm"
                    style={{ backgroundColor: '#009688', borderColor: '#009688', color: 'white', fontSize: '12px', padding: '5px 14px', fontWeight: 600 }}
                  >
                    <FaListAlt className="me-2" size={13} /> Distribution Report
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Sub Heading */}
          <div className="mb-3">
            <h5 className="fw-bold text-center" style={{ color: "#dc3545", fontSize: '15px' }}>
              Demand for the year : {selectedYear || "____"} and Quarter : {selectedQuarter === "All" ? "All" : getDisplayQuarter(selectedQuarter)}
            </h5>
          </div>

          {/* Data Utilities Row */}
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div className="d-flex flex-wrap gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="d-flex align-items-center"
                style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '20px' }}
                onClick={handleCopy}
              >
                {copySuccess ? <FaCheck className="me-2" size={11} /> : <FaCopy className="me-2" size={11} />}
                {copySuccess ? "Copied" : "Copy"}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="d-flex align-items-center"
                style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '20px' }}
                onClick={handleExcel}
              >
                <FaFileExcel className="me-2" size={11} /> Excel
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="d-flex align-items-center"
                style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '20px' }}
                onClick={handlePDF}
              >
                <FaFilePdf className="me-2" size={11} /> PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="d-flex align-items-center"
                style={{ backgroundColor: '#6c757d', borderColor: '#6c757d', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '20px' }}
                onClick={() => setShowColumnModal(true)}
              >
                <FaEye className="me-2" size={11} /> Column visibility
              </Button>
            </div>
            <div style={{ width: '220px' }}>
              <InputGroup size="sm">
                <InputGroup.Text className="bg-white border-end-0" style={{ fontSize: '11px', padding: '4px 8px' }}>Search:</InputGroup.Text>
                <FormControl
                  placeholder=""
                  className="border-start-0 ps-0"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ fontSize: '12px' }}
                />
              </InputGroup>
            </div>
          </div>

          {/* Column Visibility Modal */}
          <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
            <Modal.Header closeButton className="border-0 pb-2">
              <Modal.Title style={{ fontSize: '14px', fontWeight: 'bold' }}>Column Visibility</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
              {allColumns.map(col => (
                <Form.Check
                  key={col.key}
                  type="checkbox"
                  id={`col-${col.key}`}
                  label={col.label}
                  checked={visibleColumns[col.key]}
                  onChange={() => toggleColumn(col.key)}
                  className="mb-2"
                  style={{ fontSize: '13px' }}
                />
              ))}
            </Modal.Body>
          </Modal>

          {/* Data Table */}
          <div className="table-responsive shadow-sm rounded border bg-white" style={{ border: '1px solid #dee2e6' }}>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" size="sm" />
                <p className="mt-2 text-muted" style={{ fontSize: '12px' }}>डेटा लोड हो रहा है...</p>
              </div>
            ) : (
              <Table bordered hover className="mb-0 align-middle text-center" style={{ fontSize: '12px', borderColor: '#dee2e6' }} ref={tableRef}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f3f5' }} className="fw-bold text-dark">
                    {visibleColumns.sno && (
                      <th style={{ cursor: 'pointer', userSelect: 'none', padding: '7px 6px', whiteSpace: 'nowrap' }} onClick={() => handleSort("sno")} className="text-center">
                        S.no <SortIcon column="sno" />
                      </th>
                    )}
                    {visibleColumns.district && (
                      <th style={{ cursor: 'pointer', userSelect: 'none', padding: '7px 6px', whiteSpace: 'nowrap' }} onClick={() => handleSort("district")} className="text-center">
                        District <SortIcon column="district" />
                      </th>
                    )}
                    {visibleColumns.project && (
                      <th style={{ cursor: 'pointer', userSelect: 'none', padding: '7px 6px', whiteSpace: 'nowrap' }} onClick={() => handleSort("project")} className="text-center">
                        Project <SortIcon column="project" />
                      </th>
                    )}
                    {visibleColumns.quarter && (
                      <th style={{ cursor: 'pointer', userSelect: 'none', padding: '7px 6px', whiteSpace: 'nowrap' }} onClick={() => handleSort("quarter")} className="text-center">
                        Quarter <SortIcon column="quarter" />
                      </th>
                    )}
                    {visibleColumns.beneficiary && (
                      <th style={{ cursor: 'pointer', userSelect: 'none', padding: '7px 6px', whiteSpace: 'nowrap' }} onClick={() => handleSort("beneficiary")} className="text-center">
                        Beneficiary <SortIcon column="beneficiary" />
                      </th>
                    )}
                    {visibleColumns.demandKits && (
                      <th style={{ cursor: 'pointer', userSelect: 'none', padding: '7px 6px', whiteSpace: 'nowrap' }} onClick={() => handleSort("demandKits")} className="text-center">
                        Demand Kits <SortIcon column="demandKits" />
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => {
                      const visibleCols = allColumns.filter(c => visibleColumns[c.key]);
                      return (
                        <tr key={item.id || `row-${index}`} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                          {visibleCols.map(col => {
                            let value = "";
                            if (col.key === "sno") value = startIndex + index + 1;
                            else if (col.key === "district") value = item.district || "-";
                            else if (col.key === "project") value = item.project || "-";
                            else if (col.key === "quarter") value = item.quarter || "-";
                            else if (col.key === "beneficiary") value = item.req_kit_count || "0";
                            else if (col.key === "demandKits") value = item.req_kit || "0";
                            return (
                              <td key={col.key} className="text-center" style={{ padding: '6px' }}>{col.key === "district" || col.key === "project" ? value : value}</td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-5 text-muted text-center">कोई डेटा उपलब्ध नहीं है।</td>
                    </tr>
                  )}
                  {paginatedData.length > 0 && (
                    <tr style={{ backgroundColor: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>
                      <td className="text-end" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>Total -&gt;</td>
                      {visibleColumns.district && <td></td>}
                      {visibleColumns.project && <td></td>}
                      {visibleColumns.quarter && <td></td>}
                      {visibleColumns.beneficiary && (
                        <td className="text-center" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>{totalBeneficiary}</td>
                      )}
                      {visibleColumns.demandKits && (
                        <td className="text-center" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>{totalDemandKits}</td>
                      )}
                    </tr>
                  )}
                </tbody>
              </Table>
            )}
          </div>

          {/* Footer with Entries and Pagination */}
          {!loading && sortedData.length > 0 && (
            <div className="d-flex flex-wrap justify-content-between align-items-center mt-3 px-2 gap-3">
              <div className="text-muted small">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, sortedData.length)} of {sortedData.length} entries
              </div>

              <div className="d-flex gap-1 align-items-center">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                >
                  <FaChevronLeft size={10} />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "primary" : "outline-secondary"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      style={{ minWidth: '30px', padding: '2px 6px', fontSize: '11px' }}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <span className="px-1" style={{ fontSize: '11px' }}>...</span>
                )}
                {totalPages > 5 && currentPage < totalPages - 1 && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    style={{ minWidth: '30px', padding: '2px 6px', fontSize: '11px' }}
                  >
                    {totalPages}
                  </Button>
                )}
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                >
                  <FaChevronRight size={10} />
                </Button>
              </div>
            </div>
          )}

          {!loading && sortedData.length === 0 && (
            <div className="text-center py-5 text-muted mt-3">
              कोई डेटा उपलब्ध नहीं है।
            </div>
          )}
        </Container>

        <div style={{ height: "30px" }} />
      </div>
    </div>
  );
};

export default DemandkitProject;