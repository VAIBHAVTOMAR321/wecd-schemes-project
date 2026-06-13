import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Form, FormControl, Modal } from "react-bootstrap";
import { 
  FaBuilding, FaLayerGroup, FaSearch, FaCopy, FaFileExcel, FaFilePdf, FaEye, 
  FaArrowUp, FaArrowDown, FaChevronLeft, FaChevronRight, FaCheck 
} from "react-icons/fa";
import { useAuth } from "../../all_login/AuthContext";
import "../../../assets/css/supervisorleftnav.css";
import "../../../assets/css/dashboard.css";
import DirectorLeftNav from "../DirectorLeftNav";
import DirectorHeader from "../DirectorHeader";


const DirectorOurSector = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const { api } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: 'project_name', direction: 'asc' });
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const tableRef = useRef(null);

  const [visibleColumns, setVisibleColumns] = useState({
    sno: true,
    district: true,
    project_name: true,
    sector_name: true,
    supervisor_incharge: true,
    supervisor_mobile: true,
    status: true,
  });

  const itemsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get("https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/director/sectors/");
      if (response.data?.success) {
        setData(response.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching sectors:", err);
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
    fetchData();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const filteredData = useMemo(() => {
    let result = data.filter(item => {
      const matchesSearch = !searchTerm || 
        item.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sector_incharge?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    return result.sort((a, b) => {
      const valA = a[sortConfig.key] || "";
      const valB = b[sortConfig.key] || "";
      return sortConfig.direction === 'asc' 
        ? valA.toString().localeCompare(valB.toString()) 
        : valB.toString().localeCompare(valA.toString());
    });
  }, [data, searchTerm, sortConfig]);

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handleCopy = async () => {
    const headers = ["S.no", "District", "Project name", "Sector name", "Supervisor Incharge", "Supervisor Mobile", "Status"];
    const rows = paginatedData.map((item, idx) => [
      (currentPage - 1) * itemsPerPage + idx + 1,
      item.district, item.project_name, item.sector, item.sector_incharge, item.incharge_mob, "Active"
    ]);
    const text = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    await navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleExcel = () => {
    const headers = ["S.no", "District", "Project name", "Sector name", "Supervisor Incharge", "Supervisor Mobile", "Status"];
    let csv = headers.join(",") + "\n";
    paginatedData.forEach((item, idx) => {
      const row = [(currentPage - 1) * itemsPerPage + idx + 1, item.district, item.project_name, item.sector, item.sector_incharge, item.incharge_mob, "Active"];
      csv += row.join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Supervisor_Sectors_Report.csv";
    link.click();
  };

  const handlePDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head><title>Supervisor Sectors Report</title><style>
          table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f1f5f9; }
        </style></head>
        <body>
          <h2 style="text-align:center">Sector | Supervisor Incharge Report</h2>
          ${tableRef.current.outerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
            <div className="p-2 rounded me-3 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#e0f2f1', width: '40px', height: '40px' }}>
              <FaBuilding style={{ color: '#14b8a6' }} size={16} />
              <FaLayerGroup style={{ color: '#14b8a6', marginLeft: '-4px', marginTop: '4px' }} size={12} />
            </div>
            <h4 className="fw-bold text-dark m-0" style={{ letterSpacing: '-0.5px' }}>Sector | Supervisor Incharge</h4>
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
                    {visibleColumns.district && <th className="py-3 text-muted" onClick={() => handleSort('district')} style={{ cursor: 'pointer' }}>District <SortIcon colKey="district" /></th>}
                    {visibleColumns.project_name && <th className="py-3 text-muted" onClick={() => handleSort('project_name')} style={{ cursor: 'pointer' }}>Project name <SortIcon colKey="project_name" /></th>}
                    {visibleColumns.sector_name && <th className="py-3 text-muted" onClick={() => handleSort('sector')} style={{ cursor: 'pointer' }}>Sector name <SortIcon colKey="sector" /></th>}
                    {visibleColumns.supervisor_incharge && <th className="py-3 text-muted" onClick={() => handleSort('sector_incharge')} style={{ cursor: 'pointer' }}>Supervisor Incharge <SortIcon colKey="sector_incharge" /></th>}
                    {visibleColumns.supervisor_mobile && <th className="py-3 text-muted">Supervisor Mobile</th>}
                    {visibleColumns.status && <th className="py-3 text-muted">Status</th>}
                  </tr>
                </thead>
                <tbody style={{ backgroundColor: '#f8fafc' }}>
                  {paginatedData.map((item, idx) => (
                    <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#f8fafc' : '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
                      {visibleColumns.sno && <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>}
                      {visibleColumns.district && <td>{item.district}</td>}
                      {visibleColumns.project_name && <td className="fw-bold">{item.project_name}</td>}
                      {visibleColumns.sector_name && <td>{item.sector}</td>}
                      {visibleColumns.supervisor_incharge && <td>{item.sector_incharge}</td>}
                      {visibleColumns.supervisor_mobile && <td>{item.incharge_mob}</td>}
                      {visibleColumns.status && <td>Active</td>}
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

export default DirectorOurSector;