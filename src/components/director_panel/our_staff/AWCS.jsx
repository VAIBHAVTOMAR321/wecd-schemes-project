import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Form, FormControl, Modal } from "react-bootstrap";
import {
  FaBuilding, FaSearch, FaCopy, FaFileExcel, FaFilePdf, FaEye,
  FaArrowUp, FaArrowDown, FaChevronLeft, FaChevronRight, FaCheck
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../../all_login/AuthContext";
import "../../../assets/css/supervisorleftnav.css";
import "../../../assets/css/dashboard.css";
import DirectorLeftNav from "../DirectorLeftNav";
import DirectorHeader from "../DirectorHeader";

const AWCS = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { api } = useAuth();
  const [data, setData] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [appliedDistrict, setAppliedDistrict] = useState("All");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'awc_code', direction: 'asc' });
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    awc_code: true,
    awc_name: true,
    awc_type: true,
    grant: true,
    sector: true,
    project: true,
    district: true,
  });

  const itemsPerPage = 1000;

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [distRes, awcRes] = await Promise.all([
        api.get("/director/districts/"),
        api.get("/director/awc-dropdown/")
      ]);

      if (distRes.data?.success) setDistricts(distRes.data.data || []);
      if (awcRes.data?.success) setData(awcRes.data.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
    fetchInitialData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const districtMap = useMemo(() => {
    return districts.reduce((acc, d) => ({ ...acc, [d.code]: d.district }), {});
  }, [districts]);

  const filteredData = useMemo(() => {
    let result = data.filter(item => {
      const matchesDistrict = appliedDistrict === "All" || item.district_code === appliedDistrict;
      const matchesSearch = !searchTerm || 
        item.awc_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.awc_code?.includes(searchTerm) ||
        item.project?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDistrict && matchesSearch;
    });

    return result.sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      return sortConfig.direction === 'asc' 
        ? valA.toString().localeCompare(valB.toString()) 
        : valB.toString().localeCompare(valA.toString());
    });
  }, [data, searchTerm, appliedDistrict, sortConfig]);

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleCopy = async () => {
    if (filteredData.length === 0) return;
    const headers = [];
    if (visibleColumns.sno) headers.push("S.no");
    if (visibleColumns.awc_code) headers.push("AWC Code");
    if (visibleColumns.awc_name) headers.push("AWC");
    if (visibleColumns.awc_type) headers.push("AWC Type");
    if (visibleColumns.grant) headers.push("Grant");
    if (visibleColumns.sector) headers.push("Sector name");
    if (visibleColumns.project) headers.push("Project name");
    if (visibleColumns.district) headers.push("District");

    const rows = filteredData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.awc_code) row.push(item.awc_code || "-");
      if (visibleColumns.awc_name) row.push(item.awc_name || "-");
      if (visibleColumns.awc_type) row.push(item.awc_type || "-");
      if (visibleColumns.grant) row.push(item.code1 || "-");
      if (visibleColumns.sector) row.push(item.sector || "-");
      if (visibleColumns.project) row.push(item.project || "-");
      if (visibleColumns.district) row.push(districtMap[item.district_code] || "-");
      return row;
    });
    const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExcel = () => {
    if (filteredData.length === 0) return;
    const headers = [];
    if (visibleColumns.sno) headers.push("S.no");
    if (visibleColumns.awc_code) headers.push("AWC Code");
    if (visibleColumns.awc_name) headers.push("AWC");
    if (visibleColumns.awc_type) headers.push("AWC Type");
    if (visibleColumns.grant) headers.push("Grant");
    if (visibleColumns.sector) headers.push("Sector name");
    if (visibleColumns.project) headers.push("Project name");
    if (visibleColumns.district) headers.push("District");

    let csv = headers.join(",") + "\n";
    filteredData.forEach((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.awc_code) row.push(`"${item.awc_code || "-"}"`);
      if (visibleColumns.awc_name) row.push(`"${item.awc_name || "-"}"`);
      if (visibleColumns.awc_type) row.push(`"${item.awc_type || "-"}"`);
      if (visibleColumns.grant) row.push(`"${item.code1 || "-"}"`);
      if (visibleColumns.sector) row.push(`"${item.sector || "-"}"`);
      if (visibleColumns.project) row.push(`"${item.project || "-"}"`);
      if (visibleColumns.district) row.push(`"${districtMap[item.district_code] || "-"}"`);
      csv += row.map(cell => cell).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Anganwadi_Centers_Report.csv";
    link.click();
  };

  const handlePDF = () => {
    if (filteredData.length === 0) return;

    const doc = new jsPDF({ orientation: "landscape" });

    const title = `Anganwadi Centers - District: ${appliedDistrict === "All" ? "All" : districtMap[appliedDistrict]}`;
    const subtitle = `Total Records: ${filteredData.length}`;

    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(subtitle, doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

    const headers = [];
    if (visibleColumns.sno) headers.push("S.no");
    if (visibleColumns.awc_code) headers.push("AWC Code");
    if (visibleColumns.awc_name) headers.push("AWC");
    if (visibleColumns.awc_type) headers.push("AWC Type");
    if (visibleColumns.grant) headers.push("Grant");
    if (visibleColumns.sector) headers.push("Sector name");
    if (visibleColumns.project) headers.push("Project name");
    if (visibleColumns.district) headers.push("District");

    const body = filteredData.map((item, idx) => {
      const row = [];
      if (visibleColumns.sno) row.push(idx + 1);
      if (visibleColumns.awc_code) row.push(item.awc_code || "-");
      if (visibleColumns.awc_name) row.push(item.awc_name || "-");
      if (visibleColumns.awc_type) row.push(item.awc_type || "-");
      if (visibleColumns.grant) row.push(item.code1 || "-");
      if (visibleColumns.sector) row.push(item.sector || "-");
      if (visibleColumns.project) row.push(item.project || "-");
      if (visibleColumns.district) row.push(districtMap[item.district_code] || "-");
      return row;
    });

    autoTable(doc, {
      head: [headers],
      body: body,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0], fontStyle: 'bold' },
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const SortIcon = ({ colKey }) => (
    <span className="ms-1" style={{ fontSize: '10px', color: '#94a3b8' }}>
      {sortConfig.key === colKey ? (sortConfig.direction === 'asc' ? <FaArrowUp /> : <FaArrowDown />) : <><FaArrowUp /><FaArrowDown /></>}
    </span>
  );

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

        <Container fluid className="p-4 bg-white" style={{ minHeight: '100vh' }}>
          <div className="d-flex align-items-center mb-4">
            <FaBuilding className="text-muted me-2" size={20} />
            <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Anganwadi Centers</h4>
          </div>

          <div className="d-flex align-items-center gap-2 mb-4">
            <Form.Select 
              size="sm" 
              style={{ width: '200px' }} 
              className="border-light shadow-sm"
              value={appliedDistrict === "All" ? "" : appliedDistrict}
              onChange={(e) => {
                setAppliedDistrict(e.target.value || "All");
                setCurrentPage(1);
              }}
            >
              <option value="">Filter District</option>
              {districts.map(d => <option key={d.id} value={d.code}>{d.district}</option>)}
            </Form.Select>
          </div>

          <div className="text-center mb-4">
            <h5 className="fw-bold" style={{ color: '#dc2626' }}>
              Centers of District : {appliedDistrict === "All" ? "All" : (districtMap[appliedDistrict] || appliedDistrict)}
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
              <FormControl size="sm" style={{ width: '180px' }} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
            ) : (
              <Table hover className="align-middle border-top" style={{ fontSize: '13px' }} ref={tableRef}>
                <thead className="bg-white">
                  <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
                    {visibleColumns.sno && <th className="py-3 text-muted">S.no</th>}
                    {visibleColumns.awc_code && <th className="py-3 text-muted" onClick={() => handleSort('awc_code')} style={{ cursor: 'pointer' }}>AWC Code <SortIcon colKey="awc_code" /></th>}
                    {visibleColumns.awc_name && <th className="py-3 text-muted" onClick={() => handleSort('awc_name')} style={{ cursor: 'pointer' }}>AWC <SortIcon colKey="awc_name" /></th>}
                    {visibleColumns.awc_type && <th className="py-3 text-muted">AWC Type</th>}
                    {visibleColumns.grant && <th className="py-3 text-muted">Grant</th>}
                    {visibleColumns.sector && <th className="py-3 text-muted">Sector name</th>}
                    {visibleColumns.project && <th className="py-3 text-muted">Project name</th>}
                    {visibleColumns.district && <th className="py-3 text-muted">District</th>}
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#f8fafc' }}>
                  {paginatedData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                      {visibleColumns.sno && <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>}
                      {visibleColumns.awc_code && <td>{item.awc_code}</td>}
                      {visibleColumns.awc_name && <td className="fw-bold">{item.awc_name}</td>}
                      {visibleColumns.awc_type && <td>{item.awc_type}</td>}
                      {visibleColumns.grant && <td>{item.code1}</td>}
                      {visibleColumns.sector && <td>{item.sector}</td>}
                      {visibleColumns.project && <td>{item.project}</td>}
                      {visibleColumns.district && <td>{districtMap[item.district_code] || "-"}</td>}
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <div className="small text-muted">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length.toLocaleString()} entries
            </div>
            <div className="custom-pagination d-flex align-items-center gap-2">
              <Button variant="link" className="text-muted p-0" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                <FaChevronLeft size={12} />
              </Button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <div 
                    key={pageNum} onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%', fontSize: '13px',
                      backgroundColor: currentPage === pageNum ? '#14b8a6' : 'transparent',
                      color: currentPage === pageNum ? 'white' : '#64748b', fontWeight: currentPage === pageNum ? 'bold' : 'normal'
                    }}
                  >{pageNum}</div>
                );
              })}
              {totalPages > 5 && <span className="text-muted">...</span>}
              {totalPages > 5 && (
                <div 
                  onClick={() => setCurrentPage(totalPages)}
                  style={{
                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '50%', fontSize: '13px',
                    color: '#64748b'
                  }}
                >{totalPages}</div>
              )}
              <Button variant="link" className="text-muted p-0" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                <FaChevronRight size={12} />
              </Button>
            </div>
          </div>
        </Container>
      </div>

      <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
        <Modal.Header closeButton className="border-0 pb-2">
          <Modal.Title style={{ fontSize: '14px', fontWeight: 'bold' }}>Column Visibility</Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-0">
          {Object.keys(visibleColumns).map(key => (
            <Form.Check
              key={key} type="checkbox" id={`col-${key}`} label={key.replace('_', ' ').toUpperCase()}
              checked={visibleColumns[key]}
              onChange={() => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }))}
              className="mb-2" style={{ fontSize: '13px' }}
            />
          ))}
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
        .table tbody tr:nth-of-type(odd) {
          background-color: #f8fafc;
        }
      `}} />
    </div>
  );
};

export default AWCS;