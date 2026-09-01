import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Form, Pagination, InputGroup, FormControl, Modal } from "react-bootstrap";
import { FaSyncAlt, FaChevronLeft, FaChevronRight, FaCopy, FaFileExcel, FaFilePdf, FaEye, FaCheck } from "react-icons/fa";
import "../../../../assets/css/supervisorleftnav.css";
import DPOLeftNav from "../../DPOLeftNav";
import DPOHeader from "../../DPOHeader";
import { useAuth } from "../../../all_login/AuthContext";


const DemandAnchalSec = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { user, api, uniqueId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("All");
  const [availableYears, setAvailableYears] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const tableRef = useRef(null);

  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    sector: true,
    quarter: true,
    beneficiary: true,
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

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const quarterReverseMap = {
    "First Quarter(Apr/May/June)": "Apr-May-June",
    "Second Quarter(July/Aug/Sept)": "July-Aug-Sept",
    "Third Quarter(Oct/Nov/Dec)": "Oct-Nov-Dec",
    "Fourth Quarter(Jan/Feb/March)": "Jan-Feb-March"
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/dpo-am-demand/");
      let rawData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setData(rawData);

      const years = [...new Set(rawData.map(item => item.fin_yr).filter(Boolean))].sort();
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
    if (api) fetchData();
  }, [api]);

  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchesYear = !selectedYear || item.fin_yr === selectedYear;
      const matchesQuarter = selectedQuarter === "All" || 
                            selectedQuarter === "All Quarters" || 
                            item.qtr_dmd === quarterReverseMap[selectedQuarter];
      const matchesSearch = !searchTerm ||
        (item.district?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.project_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.sector?.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesYear && matchesQuarter && matchesSearch;
    });

    if (selectedQuarter !== "All" && selectedQuarter !== "All Quarters") return filtered;

    // Aggregate data by unique sectors across all quarters
    const aggregated = filtered.reduce((acc, curr) => {
      const key = `${curr.district}-${curr.project_name}-${curr.sector}`;
      if (!acc[key]) {
        acc[key] = {
          ...curr,
          qtr_dmd: "All",
          milk_bene: 0
        };
      }
      acc[key].milk_bene = (parseInt(acc[key].milk_bene) || 0) + (parseInt(curr.milk_bene) || 0);
      return acc;
    }, {});

    return Object.values(aggregated);
  }, [data, selectedYear, selectedQuarter, searchTerm]);

  const totalBeneficiaries = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (parseInt(item.milk_bene) || 0), 0);
  }, [filteredData]);

  const tableColumns = [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "project", label: "Project" },
    { key: "sector", label: "Sector" },
    { key: "quarter", label: "Quarter" },
    { key: "beneficiary", label: "Beneficiary" },
  ];

  const handleCopy = async () => {
    if (filteredData.length === 0) return; // Use filteredData for all data
    const mHeaders = tableColumns.filter((c) => visibleColumns[c.key]).map((c) => c.label);
    const mRows = filteredData.map((item, idx) => {
      const rowNum = startIndex + idx + 1;
      const row = [];
      if (visibleColumns.sno) row.push(rowNum);
      if (visibleColumns.district) row.push(item.district || "-");
      if (visibleColumns.project) row.push(item.project_name || "-");
      if (visibleColumns.sector) row.push(item.sector || "-");
      if (visibleColumns.quarter) row.push(item.qtr_dmd || "-");
      if (visibleColumns.beneficiary) row.push(item.milk_bene || "0");
      return row.join("\t");
    });

    const totalRow = ["Total", "", "", "", "", totalBeneficiaries.toLocaleString()].join("\t");
    let text = "ANCHAL AMRIT DEMAND DATA | SECTOR WISE\n" + [mHeaders.join("\t"), ...mRows, totalRow].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) { console.error(err); }
  };

  const handleExcel = () => {
    if (filteredData.length === 0) return; // Use filteredData for all data
    const mHeaders = tableColumns.filter((c) => visibleColumns[c.key]).map((c) => c.label);
    let csv = "ANCHAL AMRIT DEMAND DATA | SECTOR WISE\n" + mHeaders.join(",") + "\n";

    filteredData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(startIndex + idx + 1);
      if (visibleColumns.district) row.push(item.district || "-");
      if (visibleColumns.project) row.push(item.project_name || "-");
      if (visibleColumns.sector) row.push(item.sector || "-");
      if (visibleColumns.quarter) row.push(item.qtr_dmd || "-");
      if (visibleColumns.beneficiary) row.push(item.milk_bene || 0);
      csv += row.join(",") + "\n";
    });

    csv += `Total,,,,,${totalBeneficiaries}\n`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Anchal_Amrit_Sector_Report.csv";
    link.click();
  };

  const handlePDF = () => {
    if (filteredData.length === 0) return; // Use filteredData for all data
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const mHeaders = tableColumns.filter(c => visibleColumns[c.key]).map(c => `<th>${c.label}</th>`).join("");
    const mRows = filteredData.map((item, idx) => {
      let r = "<tr>";
      if (visibleColumns.sno) r += `<td>${idx + 1}</td>`;
      if (visibleColumns.district) r += `<td>${item.district || "-"}</td>`;
      if (visibleColumns.project) r += `<td>${item.project_name || "-"}</td>`;
      if (visibleColumns.sector) r += `<td>${item.sector || "-"}</td>`;
      if (visibleColumns.quarter) r += `<td>${item.qtr_dmd || "-"}</td>`;
      if (visibleColumns.beneficiary) r += `<td class="fw-bold">${item.milk_bene || "0"}</td>`;
      r += "</tr>";
      return r;
    }).join("");

    const totalRowHtml = `<tr class="table-secondary fw-bold"><td colspan="${tableColumns.filter(c => visibleColumns[c.key]).length - 1}" class="text-end px-4">Total</td><td>${totalBeneficiaries.toLocaleString()}</td></tr>`;

    printWindow.document.write(`
      <html>
        <head><title>Report</title><style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
          h2, h4 { text-align: center; font-family: sans-serif; }
        </style></head>
        <body>
          <h2>Anchal Amrit Demand Data | Sector wise</h2>
          <h4>Year: ${selectedYear} | Quarter: ${selectedQuarter}</h4>
          <table>
            <thead><tr>${mHeaders}</tr></thead>
            <tbody>${mRows}${totalRowHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getDisplayQuarter = (val) => {
    if (val === "All" || val === "All Quarters") return "All";
    if (val === "First Quarter(Apr/May/June)") return "First Quarter(Apr/May/June)";
    if (val === "Second Quarter(July/Aug/Sept)") return "Second Quarter(July/Aug/Sept)";
    if (val === "Third Quarter(Oct/Nov/Dec)") return "Third Quarter(Oct/Nov/Dec)";
    if (val === "Fourth Quarter(Jan/Feb/March)") return "Fourth Quarter(Jan/Feb/March)";
    return val;
  };

  const renderActiveFilterText = () => {
    const year = selectedYear || "____";
    const qtr = getDisplayQuarter(selectedQuarter);
    return `For the year : ${year} and Quarter : ${qtr}`;
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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
          <div className="main-heading text-center mb-4">
            <h3 className="fw-bold" style={{ color: "#343a40" }}>
              District Wise Stock Demand : Anchal Amrit Yojana
            </h3>
          </div>

          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-3">
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">Financial Year</Form.Label>
                    <Form.Select 
                      value={selectedYear} 
                      onChange={(e) => setSelectedYear(e.target.value)}
                      size="sm"
                    >
                      <option value="">Select Financial Year</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">Quarter</Form.Label>
                    <Form.Select 
                      value={selectedQuarter} 
                      onChange={(e) => setSelectedQuarter(e.target.value)}
                      size="sm"
                    >
                      <option value="">Select Any One</option>
                      <option value="All Quarters">All Quarters</option>
                      <option value="First Quarter(Apr/May/June)">First Quarter(Apr/May/June)</option>
                      <option value="Second Quarter(July/Aug/Sept)">Second Quarter(July/Aug/Sept)</option>
                      <option value="Third Quarter(Oct/Nov/Dec)">Third Quarter(Oct/Nov/Dec)</option>
                      <option value="Fourth Quarter(Jan/Feb/March)">Fourth Quarter(Jan/Feb/March)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Button variant="primary" className="w-100 fw-bold shadow-sm" size="sm" onClick={fetchData} disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : <><FaSyncAlt className="me-2" /> Filter Now</>}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="mb-3">
            <h5 className="fw-bold text-center" style={{ color: "#dc3545" }}>
              {renderActiveFilterText()}
            </h5>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex gap-1">
              <Button size="sm" className="border-0 px-3 py-1" style={{ backgroundColor: '#64748b', fontSize: '12px' }} onClick={handleCopy}>
                {copySuccess ? <FaCheck className="me-1" /> : <FaCopy className="me-1" />} {copySuccess ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" className="border-0 px-3 py-1" style={{ backgroundColor: '#64748b', fontSize: '12px' }} onClick={handleExcel}><FaFileExcel className="me-1" /> Excel</Button>
              <Button size="sm" className="border-0 px-3 py-1" style={{ backgroundColor: '#64748b', fontSize: '12px' }} onClick={handlePDF}><FaFilePdf className="me-1" /> PDF</Button>
              <Button size="sm" className="border-0 px-3 py-1" style={{ backgroundColor: '#64748b', fontSize: '12px' }} onClick={() => setShowColumnModal(true)}><FaEye className="me-1" /> Column visibility</Button>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-bold text-muted">Search:</span>
              <FormControl size="sm" style={{ width: '200px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="table-responsive shadow-sm rounded border bg-white">
            <Table bordered hover className="align-middle text-center mb-0" style={{ fontSize: '13px' }} ref={tableRef}>
              <thead className="table-light">
                <tr className="fw-bold">
                  {visibleColumns.sno && <th>S.no</th>}
                  {visibleColumns.district && <th>District</th>} 
                  {visibleColumns.project && <th>Project</th>}
                  {visibleColumns.sector && <th>Sector</th>}
                  {visibleColumns.quarter && <th>Quarter</th>}
                  {visibleColumns.beneficiary && <th>Beneficiary</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-4 text-center"><Spinner animation="border" variant="primary" /></td></tr>
                ) : paginatedData.length > 0 ? (
                  <>
                    {paginatedData.map((item, index) => (
                      <tr key={index}>
                        {visibleColumns.sno && <td>{startIndex + index + 1}</td>}
                        {visibleColumns.district && <td>{item.district}</td>}
                        {visibleColumns.project && <td>{item.project_name}</td>}
                        {visibleColumns.sector && <td>{item.sector}</td>}
                        {visibleColumns.quarter && <td>{item.qtr_dmd}</td>}
                        {visibleColumns.beneficiary && <td className="fw-bold">{item.milk_bene}</td>}
                      </tr>
                    ))} 
                    <tr className="table-secondary fw-bold">
                      <td colSpan={Object.values(visibleColumns).filter(Boolean).length - 1} className="text-end px-4">Total</td>
                      {visibleColumns.beneficiary && <td>{totalBeneficiaries.toLocaleString()}</td>}
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="py-5 text-muted text-center italic">
                      कोई डेटा उपलब्ध नहीं है।
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {!loading && filteredData.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3 px-2 border-top pt-3">
              <span className="text-muted small">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </span>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPage === 1} 
                  onClick={() => { setCurrentPage(prev => prev - 1); tableRef.current.scrollIntoView({ behavior: 'smooth' }); }}
                >
                  <FaChevronLeft size={10} /> Previous
                </Button>
                <Pagination size="sm" className="mb-0">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Pagination.Item
                      key={page}
                      active={currentPage === page}
                      onClick={() => { setCurrentPage(page); tableRef.current.scrollIntoView({ behavior: 'smooth' }); }}
                    >
                      {page}
                    </Pagination.Item>
                  ))}
                </Pagination>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPage >= totalPages} 
                  onClick={() => { setCurrentPage(prev => prev + 1); tableRef.current.scrollIntoView({ behavior: 'smooth' }); }}
                >
                  Next <FaChevronRight size={10} />
                </Button>
              </div>
            </div>
          )}
        </Container>

        <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
          <Modal.Header closeButton className="border-0 pb-2">
            <Modal.Title style={{ fontSize: '14px', fontWeight: 'bold' }}>Column Visibility</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-0">
            {tableColumns.map(col => (
              <Form.Check
                key={col.key}
                type="checkbox"
                id={`col-${col.key}`}
                label={col.label}
                checked={visibleColumns[col.key]}
                onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                className="mb-2"
                style={{ fontSize: '13px' }}
              />
            ))}
          </Modal.Body>
        </Modal>
      </div>
    </div>
  );
};

export default DemandAnchalSec;
