import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, FormControl, Spinner, Pagination, Modal } from "react-bootstrap";
import { FaSearch, FaCopy, FaFileExcel, FaFilePdf, FaEye, FaArrowUp, FaArrowDown, FaChevronLeft, FaChevronRight, FaCheck } from "react-icons/fa";
import DPOLeftNav from "../../DPOLeftNav";
import DPOHeader from "../../DPOHeader";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";

const MahilaPoshanDemandSector = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api } = useAuth();
  const [data, setData] = useState([]);
  const [district, setDistrict] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("2025-2026");
  const [selectedQuarter, setSelectedQuarter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'sector', direction: 'asc' });
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);
  const distTableRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project: true,
    sector: true,
    quarter: true,
    total_beneficiary: true,
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

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const tablet = window.innerWidth > 768 && window.innerWidth <= 992;
      setIsMobile(mobile);
      setIsTablet(tablet);
      setSidebarOpen(!mobile);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/mp-sector-wise/");
      if (response.data && response.data.success) {
        setData(response.data.data || []);
        setDistrict(response.data.district || "");
      }
    } catch (err) {
      console.error("Error fetching sector-wise data:", err);
    } finally {
      setLoading(false);
    }
  };

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

    // Flatten all records to ensure we handle different data structures consistently
    const allSectors = [];
    data.forEach(project => {
      const sectorsList = project.sectors || (Array.isArray(project) ? project : []);
      if (Array.isArray(sectorsList)) {
        sectorsList.forEach(s => {
          allSectors.push({
            ...s,
            project_name: project.project_name || s.project_name || "Unknown Project"
          });
        });
      }
    });

    // Filter based on selected year, quarter, and search term
    const filtered = allSectors.filter(s => {
      const matchesYear = !selectedYear || s.financial_year === selectedYear;
      const matchesQuarter = selectedQuarter === "All" || s.quarter === selectedQuarter;
      const matchesSearch = !searchTerm ||
        (s.sector && s.sector.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.project_name && s.project_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesYear && matchesQuarter && matchesSearch;
    });

    // Group by project_name to ensure proper subtotal insertion
    const groupedByProject = filtered.reduce((acc, curr) => {
      const proj = curr.project_name;
      if (!acc[proj]) acc[proj] = [];
      acc[proj].push(curr);
      return acc;
    }, {});

    const groupedResult = [];
    const sortedProjectNames = Object.keys(groupedByProject).sort();

    sortedProjectNames.forEach(projectName => {
      const sectorsInProject = groupedByProject[projectName];
      
      // Sort sectors within each project group based on current config
      sectorsInProject.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });

      let pTotal = 0, pEgg = 0, pNonEgg = 0;
      sectorsInProject.forEach(s => {
        pTotal += Number(s.khajur_beneficiary || 0);
        pEgg += Number(s.egg_beneficiary || 0);
        pNonEgg += Number(s.not_eat_egg_beneficiary || 0);
        groupedResult.push({
          ...s,
          project_name: projectName,
          type: 'row',
          rowKey: `row-${projectName}-${s.demand_id || s.id || Math.random()}`
        });
      });

      // Generate a summary row for EVERY project
      groupedResult.push({
        project_name: projectName,
        total_bene: pTotal,
        egg_bene: pEgg,
        non_egg_bene: pNonEgg,
        type: 'subtotal',
        rowKey: `subtotal-${projectName}`
      });
    });

    return groupedResult;
  }, [data, searchTerm, selectedYear, selectedQuarter, sortConfig]);

  const mainTableColumns = [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "project", label: "Project" },
    { key: "sector", label: "Sector" },
    { key: "quarter", label: "Quarter" },
    { key: "total_beneficiary", label: "Total Beneficiary" },
    { key: "egg_beneficiary", label: "Egg Beneficiary" },
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

  const allColumns = [...mainTableColumns, ...distTableColumns];

  const handleCopy = async () => {
    if (paginatedData.length === 0) return;
    const mHeaders = mainTableColumns.filter(c => visibleColumns[c.key]).map(c => c.label);
    const mRows = paginatedData.map((item, idx) => {
      if (item.type === 'row') {
        const rowNumber = [...paginatedData].slice(0, idx).filter(i => i.type === 'row').length + rowsBeforePage + 1;
        const row = [];
        if (visibleColumns.sno) row.push(rowNumber);
        if (visibleColumns.district) row.push(district || "-");
        if (visibleColumns.project) row.push(item.project_name || "-");
        if (visibleColumns.sector) row.push(item.sector || "-");
        if (visibleColumns.quarter) row.push(item.quarter || "-");
        if (visibleColumns.total_beneficiary) row.push(item.khajur_beneficiary || "0");
        if (visibleColumns.egg_beneficiary) row.push(item.egg_beneficiary || "0");
        if (visibleColumns.non_egg_beneficiary) row.push(item.not_eat_egg_beneficiary || "0");
        return row;
      } else {
        const subRow = [`Total for Project: ${item.project_name}`];
        const paddingCount = [visibleColumns.sno, visibleColumns.district, visibleColumns.project, visibleColumns.sector, visibleColumns.quarter].filter(Boolean).length;
        for (let i = 1; i < paddingCount; i++) subRow.push("");
        if (visibleColumns.total_beneficiary) subRow.push(item.total_bene);
        if (visibleColumns.egg_beneficiary) subRow.push(item.egg_bene);
        if (visibleColumns.non_egg_beneficiary) subRow.push(item.non_egg_bene);
        return subRow;
      }
    });

    let text = "MAHILA POSHAN DEMAND DATA (SECTOR WISE)\n" + [mHeaders.join("\t"), ...mRows.map(r => r.join("\t"))].join("\n");

    const distItems = paginatedData.filter(i => i.type === 'row' && i.distribution?.length > 0);
    if (distItems.length > 0) {
      text += "\n\nDISTRIBUTION DETAILS FOR APPROVED DEMANDS\n";
      const dHeaders = distTableColumns.filter(c => visibleColumns[c.key]).map(c => c.label);
      text += dHeaders.join("\t") + "\n";
      distItems.forEach(row => {
        row.distribution.forEach(dist => {
          const dRow = [];
          if (visibleColumns.dist_sector) dRow.push(row.sector);
          if (visibleColumns.dist_month) dRow.push(dist.month);
          if (visibleColumns.dist_awc_no) dRow.push(dist.awc_no);
          if (visibleColumns.dist_total_beneficiary) dRow.push(dist.total_beneficiary);
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
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleExcel = () => {
    if (paginatedData.length === 0) return;
    const mHeaders = mainTableColumns.filter(c => visibleColumns[c.key]).map(c => c.label);
    let csv = "MAHILA POSHAN DEMAND DATA (SECTOR WISE)\n" + mHeaders.join(",") + "\n";

    paginatedData.forEach((item, idx) => {
      let row = [];
      if (item.type === 'row') {
        const rowNum = rowsBeforePage + paginatedData.slice(0, idx).filter(i => i.type === 'row').length + 1;
        if (visibleColumns.sno) row.push(rowNum);
        if (visibleColumns.district) row.push(district || "-");
        if (visibleColumns.project) row.push(item.project_name || "-");
        if (visibleColumns.sector) row.push(item.sector || "-");
        if (visibleColumns.quarter) row.push(item.quarter || "-");
        if (visibleColumns.total_beneficiary) row.push(item.khajur_beneficiary || "0");
        if (visibleColumns.egg_beneficiary) row.push(item.egg_beneficiary || "0");
        if (visibleColumns.non_egg_beneficiary) row.push(item.not_eat_egg_beneficiary || "0");
      } else {
        row = [`Total for Project: ${item.project_name}`];
        const paddingCount = [visibleColumns.sno, visibleColumns.district, visibleColumns.project, visibleColumns.sector, visibleColumns.quarter].filter(Boolean).length;
        for (let i = 1; i < paddingCount; i++) row.push("");
        if (visibleColumns.total_beneficiary) row.push(item.total_bene);
        if (visibleColumns.egg_beneficiary) row.push(item.egg_bene);
        if (visibleColumns.non_egg_beneficiary) row.push(item.non_egg_bene);
      }
      csv += row.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",") + "\n";
    });

    const distItems = paginatedData.filter(i => i.type === 'row' && i.distribution?.length > 0);
    if (distItems.length > 0) {
      csv += "\nDISTRIBUTION DETAILS FOR APPROVED DEMANDS\n";
      const dHeaders = distTableColumns.filter(c => visibleColumns[c.key]).map(c => c.label);
      csv += dHeaders.join(",") + "\n";
      distItems.forEach(row => {
        row.distribution.forEach(dist => {
          const dRow = [];
          if (visibleColumns.dist_sector) dRow.push(row.sector);
          if (visibleColumns.dist_month) dRow.push(dist.month);
          if (visibleColumns.dist_awc_no) dRow.push(dist.awc_no);
          if (visibleColumns.dist_total_beneficiary) dRow.push(dist.total_beneficiary);
          if (visibleColumns.dist_allotted) dRow.push(`${dist.allotted_khajur}/${dist.allotted_egg}/${dist.allotted_not_eat_egg}`);
          if (visibleColumns.dist_distributed) dRow.push(`${dist.khajur_distribution_beneficiary}/${dist.egg_distribution_beneficiary}/${dist.not_eat_egg_distribution_beneficiary}`);
          csv += dRow.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",") + "\n";
        });
      });
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Mahila_Poshan_Sector_Report_${selectedYear}.csv`;
    link.click();
  };

  const handlePDF = () => {
    if (!tableRef.current) return;
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;

    let distTableHtml = "";
    if (distTableRef.current) {
      distTableHtml = `<div style="margin-top: 30px;">
          <h3 style="color: #64748b; font-family: sans-serif;">Distribution Details for Approved Demands</h3>
          ${distTableRef.current.outerHTML}
      </div>`;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Mahila Poshan Demand & Distribution Report</title>
          <style>
            table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9; }
            .bg-light { background-color: #f8fafc; font-weight: bold; }
            h2, h4 { font-family: sans-serif; text-align: center; }
          </style>
        </head>
        <body>
          <h2 style="color: #dc2626;">Mahila Poshan Report (Sector Wise)</h2>
          <h4>Year: ${selectedYear} | Quarter: ${selectedQuarter}</h4>
          ${tableRef.current.outerHTML}
          ${distTableHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalEntries = processedData.filter(i => i.type === 'row').length;
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const rowsBeforePage = processedData
    .slice(0, (currentPage - 1) * itemsPerPage)
    .filter(i => i.type === 'row').length;

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
          
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>
              Mahila Poshan Demand Data | <span className="text-muted fw-normal">Sector wise</span>
            </h4>
          </div>

          {/* Filtering Row */}
          <div className="d-flex align-items-end gap-3 mb-4 flex-wrap">
            <Form.Group style={{ width: '200px' }}>
              <Form.Label className="small fw-bold text-muted">Choose Financial Year</Form.Label>
              <Form.Select size="sm" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="border-light shadow-sm">
                <option value="">Select Year</option>
                <option value="2024-25">2024-2025</option>
                <option value="2025-26">2025-2026</option>
                <option value="2026-27">2026-2027</option>
              </Form.Select>
            </Form.Group>
            <Form.Group style={{ width: '200px' }}>
              <Form.Label className="small fw-bold text-muted">Choose Quarter</Form.Label>
              <Form.Select size="sm" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)} className="border-light shadow-sm">
                <option value="All">All Quarters</option>
                <option value="Apr-May-June">Apr-May-June</option>
                <option value="July-Aug-Sept">July-Aug-Sept</option>
                <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                <option value="Jan-Feb-March">Jan-Feb-March</option>
              </Form.Select>
            </Form.Group>
            <Button 
              className="fw-bold px-4 border-0 shadow-sm" 
              style={{ backgroundColor: '#f59e0b', color: 'white', height: '31px', fontSize: '13px' }}
              onClick={fetchData}
            >
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
              <Button 
                size="sm" 
                className="border-0 px-3 py-1" 
                style={{ backgroundColor: '#64748b', fontSize: '12px' }}
                onClick={handleCopy}
              >
                {copySuccess ? <FaCheck className="me-1" /> : <FaCopy className="me-1" />}
                {copySuccess ? "Copied" : "Copy"}
              </Button>
              <Button 
                size="sm" 
                className="border-0 px-3 py-1" 
                style={{ backgroundColor: '#64748b', fontSize: '12px' }}
                onClick={handleExcel}
              >
                <FaFileExcel className="me-1" />
                Excel
              </Button>
              <Button 
                size="sm" 
                className="border-0 px-3 py-1" 
                style={{ backgroundColor: '#64748b', fontSize: '12px' }}
                onClick={handlePDF}
              >
                <FaFilePdf className="me-1" />
                PDF
              </Button>
              <Button 
                size="sm" 
                className="border-0 px-3 py-1" 
                style={{ backgroundColor: '#64748b', fontSize: '12px' }}
                onClick={() => setShowColumnModal(true)}
              >
                <FaEye className="me-1" />
                Column visibility
              </Button>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="small fw-bold text-muted">Search:</span>
              <FormControl 
                size="sm" 
                placeholder="" 
                style={{ width: '180px' }} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <Table hover className="align-middle border-top" style={{ fontSize: '13px' }} ref={tableRef}>
                <thead className="bg-white">
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {visibleColumns.sno && <th className="py-3 text-muted" onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>S.no <SortIcon colKey="id" /></th>}
                    {visibleColumns.district && <th className="py-3 text-muted">District</th>}
                    {visibleColumns.project && <th className="py-3 text-muted" onClick={() => handleSort('project_name')} style={{ cursor: 'pointer' }}>Project <SortIcon colKey="project_name" /></th>}
                    {visibleColumns.sector && <th className="py-3 text-muted" onClick={() => handleSort('sector')} style={{ cursor: 'pointer' }}>Sector <SortIcon colKey="sector" /></th>}
                    {visibleColumns.quarter && <th className="py-3 text-muted">Quarter</th>}
                    {visibleColumns.total_beneficiary && <th className="py-3 text-muted">Total Beneficiary</th>}
                    {visibleColumns.egg_beneficiary && <th className="py-3 text-muted">Egg Beneficiary</th>}
                    {visibleColumns.non_egg_beneficiary && <th className="py-3 text-muted">Non Egg Eating Beneficiary</th>}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, idx) => {
                    if (item.type === 'row') {
                      const rowNumber = rowsBeforePage + idx + 1;
                      return (
                        <tr key={item.rowKey || `row-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          {visibleColumns.sno && <td>{rowNumber}</td>}
                          {visibleColumns.district && <td>{district}</td>}
                          {visibleColumns.project && <td>{item.project_name}</td>}
                          {visibleColumns.sector && <td>{item.sector}</td>}
                          {visibleColumns.quarter && <td>{item.quarter}</td>}
                          {visibleColumns.total_beneficiary && <td className="fw-bold">{item.khajur_beneficiary}</td>}
                          {visibleColumns.egg_beneficiary && <td className="fw-bold">{item.egg_beneficiary}</td>}
                          {visibleColumns.non_egg_beneficiary && <td className="fw-bold">{item.not_eat_egg_beneficiary}</td>}
                        </tr>
                      );
                    }
                    return (
                      <tr key={item.rowKey || `sub-${idx}`} className="bg-light" style={{ backgroundColor: '#f8fafc', fontWeight: 'bold' }}>
                        <td
                          colSpan={[visibleColumns.sno, visibleColumns.district, visibleColumns.project, visibleColumns.sector, visibleColumns.quarter].filter(Boolean).length}
                          className="text-end py-2"
                        >
                          Total for Project: {item.project_name}
                        </td>
                        {visibleColumns.total_beneficiary && <td>{item.total_bene}</td>}
                        {visibleColumns.egg_beneficiary && <td>{item.egg_bene}</td>}
                        {visibleColumns.non_egg_beneficiary && <td>{item.non_egg_bene}</td>}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </div>

          {/* Footer Tracking & Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="small text-muted">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} entries
              <span className="ms-2">(Rows: {totalEntries})</span>
            </div>
            <div className="custom-pagination d-flex align-items-center gap-2">
              <Button 
                variant="link" 
                className="text-muted p-0" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <FaChevronLeft size={12} />
              </Button>
              
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Simple pagination display logic
                if (totalPages > 7 && Math.abs(currentPage - pageNum) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                  if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum}>...</span>;
                  return null;
                }
                return (
                  <div 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      fontSize: '13px',
                      fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                      backgroundColor: currentPage === pageNum ? '#14b8a6' : 'transparent',
                      color: currentPage === pageNum ? 'white' : '#64748b'
                    }}
                  >
                    {pageNum}
                  </div>
                );
              })}

              <Button 
                variant="link" 
                className="text-muted p-0"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                <FaChevronRight size={12} />
              </Button>
            </div>
          </div>

          {/* Detailed Distribution View (Optional integration based on requirement) */}
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
                  {paginatedData
                    .filter(i => i.type === 'row' && i.distribution?.length > 0)
                    .map(row => row.distribution.map(dist => (
                      <tr key={dist.distribution_id}>
                        {visibleColumns.dist_sector && <td>{row.sector}</td>}
                        {visibleColumns.dist_month && <td>{dist.month}</td>}
                        {visibleColumns.dist_awc_no && <td>{dist.awc_no}</td>}
                        {visibleColumns.dist_total_beneficiary && <td>{dist.total_beneficiary}</td>}
                        {visibleColumns.dist_allotted && <td>{dist.allotted_khajur}/{dist.allotted_egg}/{dist.allotted_not_eat_egg}</td>}
                        {visibleColumns.dist_distributed && <td>{dist.khajur_distribution_beneficiary}/{dist.egg_distribution_beneficiary}/{dist.not_eat_egg_distribution_beneficiary}</td>}
                      </tr>
                    )))
                  }
                </tbody>
              </Table>
            </div>
          )}
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
        .custom-pagination div:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }
        .custom-pagination div[style*="background-color: rgb(20, 184, 166)"]:hover {
          background-color: #0d9488 !important;
          color: white !important;
        }
        .table thead th {
          border-bottom: none;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
        }
        .bg-light td {
          color: #334155;
        }
      `}} />
    </div>
  );
};

export default MahilaPoshanDemandSector;