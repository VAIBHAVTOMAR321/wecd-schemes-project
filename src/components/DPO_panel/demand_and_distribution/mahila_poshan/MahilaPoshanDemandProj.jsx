import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Table, Button, Form, FormControl, Spinner, Modal } from "react-bootstrap";
import { FaSearch, FaCopy, FaFileExcel, FaFilePdf, FaEye, FaArrowUp, FaArrowDown, FaChevronLeft, FaChevronRight, FaCheck } from "react-icons/fa";
import DPOLeftNav from "../../DPOLeftNav";
import DPOHeader from "../../DPOHeader";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";

const MahilaPoshanDemandProj = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [data, setData] = useState([]);
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'project_name', direction: 'asc' });
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);
  const distTableRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    quarter: true,
    khajur_beneficiary: true,
    egg_beneficiary: true,
    non_egg_beneficiary: true,
    dist_sector: true,
    dist_month: true,
    dist_awc_no: true,
    dist_total_beneficiary: true,
    dist_allotted: true,
    dist_distributed: true,
  });

  const itemsPerPage = 25;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/mp-project-wise/");
      if (response.data && response.data.success) {
        setData(response.data.data || []);
        setDistrict(response.data.district || "");
      }
    } catch (err) {
      console.error("Error fetching project-wise data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 992);
      setSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    
    // Group and aggregate by Project + Quarter + Year for true "Project Wise" view
    const aggregated = data.reduce((acc, curr) => {
      const key = `${curr.project_name}-${curr.quarter}-${curr.financial_year}`;
      if (!acc[key]) {
        acc[key] = {
          ...curr,
          khajur_beneficiary: 0,
          egg_beneficiary: 0,
          not_eat_egg_beneficiary: 0,
          distribution: []
        };
      }
      // Sum beneficiaries
      acc[key].khajur_beneficiary += Number(curr.khajur_beneficiary || 0);
      acc[key].egg_beneficiary += Number(curr.egg_beneficiary || 0);
      acc[key].not_eat_egg_beneficiary += Number(curr.not_eat_egg_beneficiary || 0);

      // Merge distributions and inject sector name for clarity in the distribution table
      if (curr.distribution && Array.isArray(curr.distribution)) {
        curr.distribution.forEach(dist => {
          acc[key].distribution.push({ ...dist, sector_name: curr.sector });
        });
      }
      return acc;
    }, {});

    const filtered = Object.values(aggregated).filter(item => {
      const matchesYear = !selectedYear || item.financial_year === selectedYear;
      const matchesQuarter = selectedQuarter === "All" || item.quarter === selectedQuarter;
      const matchesSearch = !searchTerm ||
        (item.project_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.district?.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesYear && matchesQuarter && matchesSearch;
    });

    return filtered.sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, searchTerm, selectedYear, selectedQuarter, sortConfig]);

  const mainTableColumns = [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "project", label: "Project" },
    { key: "quarter", label: "Quarter" },
    { key: "khajur_beneficiary", label: "Khajur Beneficiary" },
    { key: "egg_beneficiary", label: "Egg Eating Beneficiary" },
    { key: "non_egg_beneficiary", label: "Non Egg Eating Beneficiary" },
  ];

  const distTableColumns = [
    { key: "dist_sector", label: "Sector" },
    { key: "dist_month", label: "Month" },
    { key: "dist_awc_no", label: "AWC Count" },
    { key: "dist_total_beneficiary", label: "Total Bene" },
    { key: "dist_allotted", label: "Allotted (K/E/N)" },
    { key: "dist_distributed", label: "Dist. Bene (K/E/N)" },
  ];

  const handleCopy = async () => {
    if (processedData.length === 0) return; // Use processedData for all data
    const mHeaders = mainTableColumns.filter(c => visibleColumns[c.key]).map(c => c.label);
    const mRows = processedData.map((item, idx) => { // Use processedData for all data
      const rowNum = idx + 1; // Simple index for full data
      const row = [];
      if (visibleColumns.sno) row.push(rowNum);
      if (visibleColumns.district) row.push(item.district || district || "-");
      if (visibleColumns.project) row.push(item.project_name || "-");
      if (visibleColumns.quarter) row.push(item.quarter || "-");
      if (visibleColumns.khajur_beneficiary) row.push(item.khajur_beneficiary || "0");
      if (visibleColumns.egg_beneficiary) row.push(item.egg_beneficiary || "0");
      if (visibleColumns.non_egg_beneficiary) row.push(item.not_eat_egg_beneficiary || "0");
      return row.join("\t");
    });

    // Add Grand Total row to copy
    const totalRow = ["Grand Total", "", "", "", totals.khajur, totals.egg, totals.nonEgg].join("\t");

    let text = "MAHILA POSHAN DEMAND DATA | PROJECT WISE\n" + [mHeaders.join("\t"), ...mRows, totalRow].join("\n");

    const distItems = processedData.filter(i => i.distribution?.length > 0); // Use processedData for all data
    if (distItems.length > 0) {
      text += "\n\nDISTRIBUTION DETAILS FOR APPROVED DEMANDS\n";
      const dHeaders = distTableColumns.filter(c => visibleColumns[c.key]).map(c => c.label);
      text += dHeaders.join("\t") + "\n";
      distItems.forEach(row => {
        row.distribution.forEach(dist => {
          const dRow = [];
          if (visibleColumns.dist_sector) dRow.push(dist.sector_name || row.sector || "-");
          if (visibleColumns.dist_month) dRow.push(dist.month || "-");
          if (visibleColumns.dist_awc_no) dRow.push(dist.awc_no || "0");
          if (visibleColumns.dist_total_beneficiary) dRow.push(dist.total_beneficiary || "0");
          if (visibleColumns.dist_allotted) dRow.push(`${dist.allotted_khajur}/${dist.allotted_egg}/${dist.allotted_not_eat_egg}`);
          if (visibleColumns.dist_distributed) dRow.push(`${dist.khajur_distribution_beneficiary}/${dist.egg_distribution_beneficiary}/${dist.not_eat_egg_distribution_beneficiary}`);
          text += dRow.join("\t") + "\n";
        });
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) { console.error(err); }
  };

  const handleExcel = () => {
    if (processedData.length === 0) return; // Use processedData for all data
    const mHeaders = mainTableColumns.filter(c => visibleColumns[c.key]).map(c => c.label);
    let csv = "MAHILA POSHAN DEMAND DATA | PROJECT WISE\n" + mHeaders.join(",") + "\n";

    processedData.forEach((item, idx) => { // Use processedData for all data
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1); // Simple index for full data
      if (visibleColumns.district) row.push(item.district || district || "-");
      if (visibleColumns.project) row.push(item.project_name || "-");
      if (visibleColumns.quarter) row.push(item.quarter || "-");
      if (visibleColumns.khajur_beneficiary) row.push(item.khajur_beneficiary || 0);
      if (visibleColumns.egg_beneficiary) row.push(item.egg_beneficiary || 0);
      if (visibleColumns.non_egg_beneficiary) row.push(item.not_eat_egg_beneficiary || 0);
      csv += row.join(",") + "\n";
    });

    // Add Grand Total Row
    csv += `Grand Total,,,,${totals.khajur},${totals.egg},${totals.nonEgg}\n`;

    const distItems = processedData.filter(i => i.distribution?.length > 0); // Use processedData for all data
    if (distItems.length > 0) {
      csv += "\nDISTRIBUTION DETAILS FOR APPROVED DEMANDS\n";
      const dHeaders = distTableColumns.filter(c => visibleColumns[c.key]).map(c => c.label);
      csv += dHeaders.join(",") + "\n";
      distItems.forEach(row => {
        row.distribution.forEach(dist => {
          const dRow = [];
          if (visibleColumns.dist_sector) dRow.push(`"${dist.sector_name || row.sector || "-"}"`);
          if (visibleColumns.dist_month) dRow.push(`"${dist.month || "-"}"`);
          if (visibleColumns.dist_awc_no) dRow.push(dist.awc_no || 0);
          if (visibleColumns.dist_total_beneficiary) dRow.push(dist.total_beneficiary || 0);
          if (visibleColumns.dist_allotted) dRow.push(`"${dist.allotted_khajur}/${dist.allotted_egg}/${dist.allotted_not_eat_egg}"`);
          if (visibleColumns.dist_distributed) dRow.push(`"${dist.khajur_distribution_beneficiary}/${dist.egg_distribution_beneficiary}/${dist.not_eat_egg_distribution_beneficiary}"`);
          csv += dRow.join(",") + "\n";
        });
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Mahila_Poshan_Project_Report.csv";
    link.click();
  };

  const handlePDF = () => {
    if (processedData.length === 0) return; // Use processedData for all data
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    const activeMainCols = mainTableColumns.filter(c => visibleColumns[c.key]);
    const mainHeaders = activeMainCols.map(c => `<th>${c.label}</th>`).join("");
    const mainRows = processedData.map((item, idx) => {
      let r = "<tr>";
      activeMainCols.forEach(col => {
        let val = "-";
        if (col.key === "sno") val = idx + 1;
        else if (col.key === "district") val = item.district || district || "-";
        else if (col.key === "project") val = item.project_name || "-";
        else if (col.key === "quarter") val = item.quarter || "-";
        else if (col.key === "khajur_beneficiary") val = item.khajur_beneficiary || "0";
        else if (col.key === "egg_beneficiary") val = item.egg_beneficiary || "0";
        else if (col.key === "non_egg_beneficiary") val = item.not_eat_egg_beneficiary || "0";
        r += `<td>${val}</td>`;
      });
      return r + "</tr>";
    }).join("");

    const mainTotalRowHtml = `<tr class="table-light fw-bold border-top-2">
      <td colspan="${activeMainCols.length - 3}" class="text-end py-3">Grand Total</td>
      ${visibleColumns.khajur_beneficiary ? `<td>${totals.khajur || 0}</td>` : ''}
      ${visibleColumns.egg_beneficiary ? `<td>${totals.egg || 0}</td>` : ''}
      ${visibleColumns.non_egg_beneficiary ? `<td>${totals.nonEgg || 0}</td>` : ''}
    </tr>`;

    let distTableHtml = "";
    const distItems = processedData.filter(i => i.distribution?.length > 0);
    if (distItems.length > 0) {
      const activeDistCols = distTableColumns.filter(c => visibleColumns[c.key]);
      const distHeaders = activeDistCols.map(c => `<th>${c.label}</th>`).join("");
      const distRows = distItems.flatMap(row => row.distribution.map(dist => {
        let r = "<tr>";
        if (visibleColumns.dist_sector) r += `<td>${dist.sector_name || row.sector || "-"}</td>`;
        if (visibleColumns.dist_month) r += `<td>${dist.month || "-"}</td>`;
        if (visibleColumns.dist_awc_no) r += `<td>${dist.awc_no || "0"}</td>`;
        if (visibleColumns.dist_total_beneficiary) r += `<td>${dist.total_beneficiary || "0"}</td>`;
        if (visibleColumns.dist_allotted) r += `<td>${dist.allotted_khajur}/${dist.allotted_egg}/${dist.allotted_not_eat_egg}</td>`;
        if (visibleColumns.dist_distributed) r += `<td>${dist.khajur_distribution_beneficiary}/${dist.egg_distribution_beneficiary}/${dist.not_eat_egg_distribution_beneficiary}</td>`;
        r += "</tr>";
        return r;
      })).join("");

      distTableHtml = `<div style="margin-top: 30px;">
          <h3 style="color: #64748b; font-family: sans-serif;">Distribution Details for Approved Demands</h3>
          <table><thead><tr>${distHeaders}</tr></thead><tbody>${distRows}</tbody></table>
      </div>`;
    }

    printWindow.document.write(`
      <html>
        <head><title>Report</title><style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 11px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
          .table-light { background-color: #f8fafc; font-weight: bold; }
          h2, h4 { text-align: center; font-family: sans-serif; }
        </style></head>
        <body>
          <h2>Mahila Poshan Demand Data | Project wise</h2>
          <h4>Year: ${selectedYear} | Quarter: ${selectedQuarter}</h4>
          <table><thead><tr>${mainHeaders}</tr></thead><tbody>${mainRows}${mainTotalRowHtml}</tbody></table>
          ${distTableHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totals = useMemo(() => {
    return processedData.reduce((acc, curr) => {
      acc.khajur += Number(curr.khajur_beneficiary || 0);
      acc.egg += Number(curr.egg_beneficiary || 0);
      acc.nonEgg += Number(curr.not_eat_egg_beneficiary || 0);
      return acc;
    }, { khajur: 0, egg: 0, nonEgg: 0 });
  }, [processedData]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SortIcon = ({ colKey }) => (
    <span className="ms-1" style={{ fontSize: '10px', color: '#94a3b8' }}>
      {sortConfig.key === colKey ? (sortConfig.direction === 'asc' ? <FaArrowUp /> : <FaArrowDown />) : <><FaArrowUp /><FaArrowDown /></>}
    </span>
  );

  return (
    <div className="dashboard-container">
      <DPOLeftNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isTablet={isTablet} />
      <div className="main-content-dash">
        <DPOHeader toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <Container fluid className="p-4 bg-white" style={{ minHeight: '100vh' }}>
          
          <div className="text-center mb-4">
            <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>
              Mahila Poshan Demand Data | <span className="text-muted fw-normal">Project wise</span>
            </h4>
          </div>

          {/* Filtering Row */}
          <div className="d-flex align-items-end gap-3 mb-4 flex-wrap justify-content-center">
            <Form.Group style={{ width: '220px' }}>
              <Form.Label className="small fw-bold text-muted">Choose Financial Year</Form.Label>
              <Form.Select size="sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border-light shadow-sm">
                <option value="">Select Year</option>
                <option value="2024-25">2024-2025</option>
                <option value="2025-26">2025-2026</option>
                <option value="2026-27">2026-2027</option>
              </Form.Select>
            </Form.Group>
            <Form.Group style={{ width: '220px' }}>
              <Form.Label className="small fw-bold text-muted">Choose Quarter</Form.Label>
              <Form.Select size="sm" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="border-light shadow-sm">
                <option value="All">All Quarters</option>
                <option value="Apr-May-June">Apr-May-June</option>
                <option value="July-Aug-Sept">July-Aug-Sept</option>
                <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                <option value="Jan-Feb-March">Jan-Feb-March</option>
              </Form.Select>
            </Form.Group>
            <Button className="fw-bold px-4 border-0 shadow-sm" style={{ backgroundColor: '#f59e0b', color: 'white', height: '31px', fontSize: '13px' }} onClick={fetchData}>
              Filter Now
            </Button>
          </div>

          <div className="text-center mb-4">
            <h5 className="fw-bold" style={{ color: '#dc2626' }}>
              For the year : {selectedYear || '2025-2026'} and Quarter : {selectedQuarter}
            </h5>
          </div>

          {/* Utilities Row */}
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

          {/* Data Table */}
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <Table striped hover className="align-middle border-top" style={{ fontSize: '13px' }} ref={tableRef}>
                <thead className="bg-white">
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {visibleColumns.sno && <th className="py-3 text-muted" onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>S.no <SortIcon colKey="id" /></th>}
                    {visibleColumns.district && <th className="py-3 text-muted">District</th>}
                    {visibleColumns.project && <th className="py-3 text-muted" onClick={() => handleSort('project_name')} style={{ cursor: 'pointer' }}>Project <SortIcon colKey="project_name" /></th>}
                    {visibleColumns.quarter && <th className="py-3 text-muted">Quarter</th>}
                    {visibleColumns.khajur_beneficiary && <th className="py-3 text-muted">Khajur Beneficiary</th>}
                    {visibleColumns.egg_beneficiary && <th className="py-3 text-muted">Egg Eating Beneficiary</th>}
                    {visibleColumns.non_egg_beneficiary && <th className="py-3 text-muted">Non Egg Eating Beneficiary</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {visibleColumns.sno && <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>}
                      {visibleColumns.district && <td>{item.district || district || "-"}</td>}
                      {visibleColumns.project && <td>{item.project_name}</td>}
                      {visibleColumns.quarter && <td>{item.quarter}</td>}
                      {visibleColumns.khajur_beneficiary && <td className="fw-bold">{item.khajur_beneficiary || <span className="text-danger">Entry Pending</span>}</td>}
                      {visibleColumns.egg_beneficiary && <td className="fw-bold">{item.egg_beneficiary || <span className="text-danger">Entry Pending</span>}</td>}
                      {visibleColumns.non_egg_beneficiary && <td className="fw-bold">{item.not_eat_egg_beneficiary || <span className="text-danger">Entry Pending</span>}</td>}
                    </tr>
                  ))}
                  {/* Final Total Row */}
                  <tr className="table-light fw-bold border-top-2">
                    <td colSpan={[visibleColumns.sno, visibleColumns.district, visibleColumns.project, visibleColumns.quarter].filter(Boolean).length} className="text-end py-3">Grand Total</td>
                    {visibleColumns.khajur_beneficiary && <td>{totals.khajur || 0}</td>}
                    {visibleColumns.egg_beneficiary && <td>{totals.egg || 0}</td>}
                    {visibleColumns.non_egg_beneficiary && <td>{totals.nonEgg || 0}</td>}
                  </tr>
                </tbody>
              </Table>
            )}
          </div>

          {/* Detailed Distribution View */}
          {paginatedData.some(i => i.distribution?.length > 0) && (
            <div className="mt-5 pt-4 border-top">
              <h6 className="fw-bold text-muted mb-3">Distribution Details for Approved Demands</h6>
              <Table size="sm" bordered hover style={{ fontSize: '11px' }} ref={distTableRef}>
                <thead className="table-secondary">
                  <tr>
                    {visibleColumns.dist_sector && <th>Sector</th>}
                    {visibleColumns.dist_month && <th>Month</th>}
                    {visibleColumns.dist_awc_no && <th>AWC Count</th>}
                    {visibleColumns.dist_total_beneficiary && <th>Total Bene</th>}
                    {visibleColumns.dist_allotted && <th>Allotted (K/E/N)</th>}
                    {visibleColumns.dist_distributed && <th>Dist. Bene (K/E/N)</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.flatMap((row) => row.distribution?.map((dist) => (
                    <tr key={dist.distribution_id}>
                      {visibleColumns.dist_sector && <td>{dist.sector_name || row.sector || "-"}</td>}
                      {visibleColumns.dist_month && <td>{dist.month}</td>}
                      {visibleColumns.dist_awc_no && <td>{dist.awc_no}</td>}
                      {visibleColumns.dist_total_beneficiary && <td>{dist.total_beneficiary}</td>}
                      {visibleColumns.dist_allotted && <td>{dist.allotted_khajur}/{dist.allotted_egg}/{dist.allotted_not_eat_egg}</td>}
                      {visibleColumns.dist_distributed && <td>{dist.khajur_distribution_beneficiary}/{dist.egg_distribution_beneficiary}/{dist.not_eat_egg_distribution_beneficiary}</td>}
                    </tr>
                  )) || [])}
                </tbody>
              </Table>
            </div>
          )}

          {/* Bottom Pagination & Tracking */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="small text-muted">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
            </div>
            <div className="d-flex align-items-center gap-2">
              <Button variant="outline-light" size="sm" className="text-muted border shadow-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                <FaChevronLeft size={10} />
              </Button>
              {[...Array(totalPages)].map((_, i) => (
                <Button key={i} size="sm" variant={currentPage === i + 1 ? "teal" : "outline-light"} className={`px-2 py-1 shadow-sm ${currentPage === i + 1 ? 'bg-teal text-white' : 'text-muted border'}`} onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </Button>
              ))}
              <Button variant="outline-light" size="sm" className="text-muted border shadow-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                <FaChevronRight size={10} />
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Column Visibility Modal */}
      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title style={{ fontSize: '14px', fontWeight: 'bold' }}>Column Visibility</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          <div className="mb-3">
            <h6 className="fw-bold small text-primary border-bottom pb-1">Demand Table</h6>
            {mainTableColumns.map(col => (
              <Form.Check
                key={col.key} type="checkbox" id={`col-${col.key}`} label={col.label}
                checked={visibleColumns[col.key]}
                onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                className="mb-2" style={{ fontSize: '13px' }}
              />
            ))}
          </div>
          <div>
            <h6 className="fw-bold small text-success border-bottom pb-1">Distribution Table</h6>
            {distTableColumns.map(col => (
              <Form.Check
                key={col.key} type="checkbox" id={`col-${col.key}`} label={col.label}
                checked={visibleColumns[col.key]}
                onChange={() => setVisibleColumns(prev => ({ ...prev, [col.key]: !prev[col.key] }))}
                className="mb-2" style={{ fontSize: '13px' }}
              />
            ))}
          </div>
        </Modal.Body>
      </Modal>

      <style dangerouslySetInnerHTML={{ __html: `
        .bg-teal { background-color: #14b8a6 !important; }
        .text-teal { color: #14b8a6 !important; }
        .table thead th { border-bottom: none; font-weight: 600; }
        .status-pending { color: #dc2626; font-style: italic; }
      `}} />
    </div>
  );
};

export default MahilaPoshanDemandProj;
