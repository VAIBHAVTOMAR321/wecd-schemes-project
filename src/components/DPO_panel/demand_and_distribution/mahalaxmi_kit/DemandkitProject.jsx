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
  const [viewMode, setViewMode] = useState("demand");

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
    receivedKits: true,
    prevBalance: true,
    distributedKits: true,
    availableBalance: true,
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
      const endpoint = viewMode === "demand" 
        ? "/dpo-demand-kit-report/"
        : "/dpo-mahalaxmi-stock-report/";
        
      const response = await api.get(endpoint);
      let rawData = [];
      if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else if (Array.isArray(response.data)) {
        rawData = response.data;
      }

      const normalizedData = rawData.map(item => ({
        ...item,
        fin_year: item.fin_year || item.financial_year || ""
      }));
      setData(normalizedData);

      const years = [...new Set(normalizedData.map(item => item.fin_year).filter(Boolean))].sort();
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
  }, [viewMode]);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchesYear = !selectedYear || item.fin_year === selectedYear;
      const matchesQuarter = selectedQuarter === "All" || item.quarter === quarterReverseMap[selectedQuarter];
      const matchesSearch = !searchTerm ||
        (item.district && item.district.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.project && item.project.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesYear && matchesQuarter && matchesSearch;
    });

    if (selectedQuarter !== "All") return filtered;

    // Aggregate data by project when "All" quarters are selected to ensure unique project entries
    const aggregated = filtered.reduce((acc, curr) => {
      const key = curr.sdname || `${curr.district}-${curr.project}`;
      if (!acc[key]) {
        acc[key] = {
          ...curr,
          quarter: "Overall",
          req_kit_count: 0,
          beneficiary: 0,
          req_kit: 0,
          demand_kits: 0,
          received_kits: 0,
          distributed_kits: 0,
          available_balance: 0,
        };
      }
      acc[key].req_kit_count = (parseInt(acc[key].req_kit_count) || 0) + (parseInt(curr.req_kit_count) || 0);
      acc[key].beneficiary = (parseInt(acc[key].beneficiary) || 0) + (parseInt(curr.beneficiary) || 0);
      acc[key].req_kit = (parseInt(acc[key].req_kit) || 0) + (parseInt(curr.req_kit) || 0);
      acc[key].demand_kits = (parseInt(acc[key].demand_kits) || 0) + (parseInt(curr.demand_kits) || 0);
      acc[key].received_kits = (parseInt(acc[key].received_kits) || 0) + (parseInt(curr.received_kits) || 0);
      acc[key].distributed_kits = (parseInt(acc[key].distributed_kits) || 0) + (parseInt(curr.distributed_kits) || 0);
      acc[key].available_balance = (parseInt(acc[key].available_balance) || 0) + (parseInt(curr.available_balance) || 0);
      return acc;
    }, {});

    return Object.values(aggregated);
  }, [data, selectedYear, selectedQuarter, searchTerm]);

  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aVal, bVal;
      if (sortColumn === "sno") {
        aVal = viewMode === "demand" ? (a.id || 0) : (a.s_no || 0);
        bVal = viewMode === "demand" ? (b.id || 0) : (b.s_no || 0);
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
        aVal = parseInt(a.req_kit_count || a.beneficiary) || 0;
        bVal = parseInt(b.req_kit_count || b.beneficiary) || 0;
      } else if (sortColumn === "demandKits") {
        aVal = parseInt(a.req_kit || a.demand_kits) || 0;
        bVal = parseInt(b.req_kit || b.demand_kits) || 0;
      } else if (sortColumn === "receivedKits") {
        aVal = parseInt(a.received_kits) || 0;
        bVal = parseInt(b.received_kits) || 0;
      } else if (sortColumn === "prevBalance") {
        aVal = 0; // Placeholder as API sample doesn't show balance field explicitly
        bVal = 0;
      } else if (sortColumn === "distributedKits") {
        aVal = parseInt(a.distributed_kits) || 0;
        bVal = parseInt(b.distributed_kits) || 0;
      } else if (sortColumn === "availableBalance") {
        aVal = parseInt(a.available_balance) || 0;
        bVal = parseInt(b.available_balance) || 0;
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
  }, [filteredData, sortColumn, sortDirection, viewMode]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => {
      acc.beneficiary += (parseInt(item.req_kit_count || item.beneficiary) || 0);
      acc.demandKits += (parseInt(item.req_kit || item.demand_kits) || 0);
      acc.receivedKits += (parseInt(item.received_kits) || 0);
      acc.distributedKits += (parseInt(item.distributed_kits) || 0);
      acc.availableBalance += (parseInt(item.available_balance) || 0);
      return acc;
    }, { beneficiary: 0, demandKits: 0, receivedKits: 0, distributedKits: 0, availableBalance: 0 });
  }, [filteredData]);

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
    if (filteredData.length === 0) return; // Use filteredData for total count
    const activeCols = (viewMode === "demand" ? allColumns : distributionColumns).filter(c => visibleColumns[c.key]);
    const headers = activeCols.map(c => c.label);
    const rows = sortedData.map((item, index) => { // Use sortedData for actual rows
      return activeCols.map(col => {
        if (col.key === "sno") return startIndex + index + 1;
        if (col.key === "district") return item.district || "-";
        if (col.key === "project") return item.project || "-";
        if (col.key === "quarter") return item.quarter || "-";
        if (col.key === "beneficiary") return item.req_kit_count || item.beneficiary || "0";
        if (col.key === "demandKits") return item.req_kit || item.demand_kits || "0";
        if (col.key === "receivedKits") return item.received_kits || "0";
        if (col.key === "prevBalance") return "0";
        if (col.key === "distributedKits") return item.distributed_kits || "0";
        if (col.key === "availableBalance") return item.available_balance || "0";
        return "-";
      });
    });
    const title = viewMode === "demand" ? "MAHALAXMI KIT DEMAND DATA" : "MAHALAXMI KIT DISTRIBUTION DATA";
    const text = `${title}\n` + [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleExcel = () => {
    if (filteredData.length === 0) return; // Use filteredData for total count
    const activeCols = (viewMode === "demand" ? allColumns : distributionColumns).filter(c => visibleColumns[c.key]);
    const headers = activeCols.map(c => c.label);
    const rows = sortedData.map((item, index) => { // Use sortedData for actual rows
      return activeCols.map(col => {
        if (col.key === "sno") return startIndex + index + 1;
        if (col.key === "district") return item.district || "-";
        if (col.key === "project") return item.project || "-";
        if (col.key === "quarter") return item.quarter || "-";
        if (col.key === "beneficiary") return item.req_kit_count || item.beneficiary || "0";
        if (col.key === "demandKits") return item.req_kit || item.demand_kits || "0";
        if (col.key === "receivedKits") return item.received_kits || "0";
        if (col.key === "prevBalance") return "0";
        if (col.key === "distributedKits") return item.distributed_kits || "0";
        if (col.key === "availableBalance") return item.available_balance || "0";
        return "-";
      });
    });
    let csv = headers.join(",") + "\n";
    rows.forEach(row => {
      csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    const reportType = viewMode === "demand" ? "Demand" : "Distribution";
    link.download = `${reportType}_Kit_Report_${selectedYear || "All"}_${selectedQuarter || "All"}_${timestamp}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePDF = () => {
    if (filteredData.length === 0) return; // Use filteredData for total count
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    const doc = printWindow.document;
    const activeCols = (viewMode === "demand" ? allColumns : distributionColumns).filter(c => visibleColumns[c.key]);
    const mHeaders = activeCols.map(c => `<th>${c.label}</th>`).join(""); // Use activeCols for headers
    const mRows = sortedData.map((item, idx) => { // Use sortedData for all rows
      let r = "<tr>";
      activeCols.forEach(col => {
        let val = "-";
        if (col.key === "sno") val = idx + 1;
        else if (col.key === "district") val = item.district;
        else if (col.key === "project") val = item.project;
        else if (col.key === "quarter") val = item.quarter;
        else if (col.key === "beneficiary") val = item.req_kit_count || item.beneficiary || "0";
        else if (col.key === "demandKits") val = item.req_kit || item.demand_kits || "0";
        else if (col.key === "receivedKits") val = item.received_kits || "0";
        else if (col.key === "prevBalance") val = "0";
        else if (col.key === "distributedKits") val = item.distributed_kits || "0";
        else if (col.key === "availableBalance") val = item.available_balance || "0";
        r += `<td>${val}</td>`;
      });
      return r + "</tr>";
    }).join("");
    
    let totalRowHtml = '';
    if (sortedData.length > 0) {
      const totalCells = activeCols.map(col => {
        if (col.key === "sno") return `<td class="text-end" style="padding: 8px 6px; border-top: 2px solid #dee2e6;">Total &rarr;</td>`;
        if (col.key === "beneficiary") return `<td class="text-center" style="padding: 8px 6px; border-top: 2px solid #dee2e6;">${totals.beneficiary}</td>`;
        if (col.key === "demandKits") return `<td class="text-center" style="padding: 8px 6px; border-top: 2px solid #dee2e6;">${totals.demandKits}</td>`;
        return `<td></td>`; // Empty cell for other columns in the total row
      }).join("");
      totalRowHtml = `<tr class="total-row fw-bold">${totalCells}</tr>`;
    }
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mahalaxmi Kit Report</title>
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
        <h3>${viewMode === 'demand' ? 'Mahalaxmi Kit Demand Data' : 'Mahalaxmi Kit Distribution Data'}</h3>
        <h5>Demand for the year : ${selectedYear || "All"} and Quarter : ${selectedQuarter === "All" ? "All" : getDisplayQuarter(selectedQuarter)}</h5>
        <table><thead><tr>${mHeaders}</tr></thead><tbody>${mRows}${totalRowHtml}</tbody></table>
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

  const distributionColumns = [
    { key: "sno", label: "S.no" },
    { key: "district", label: "District" },
    { key: "project", label: "Project" },
    { key: "quarter", label: "Quarter" },
    { key: "beneficiary", label: "Beneficiary" },
    { key: "demandKits", label: "Demand Kits" },
    { key: "receivedKits", label: "Recieved Kits" },
    { key: "prevBalance", label: "Balance (पिछ्ला वित्तीय वर्ष)" },
    { key: "distributedKits", label: "Distributed Kits" },
    { key: "availableBalance", label: "Available Balance" },
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
                {viewMode === "demand" ? "Mahalaxmi Kit Demand Data" : "Mahalaxmi Kit Distribution Data"}
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
                    style={{ backgroundColor: viewMode === 'demand' ? '#009688' : '#6c757d', borderColor: viewMode === 'demand' ? '#009688' : '#6c757d', color: 'white', fontSize: '12px', padding: '5px 14px', fontWeight: 600 }}
                    onClick={() => { setViewMode(viewMode === "demand" ? "distribution" : "demand"); setCurrentPage(1); }}
                  >
                    <FaListAlt className="me-2" size={13} /> {viewMode === "demand" ? "Distribution Report" : "Demand Report"}
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
                size="sm"
                className="d-flex align-items-center border-0"
                style={{ backgroundColor: '#64748b', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '4px' }}
                onClick={handleCopy}
              >
                {copySuccess ? <FaCheck className="me-2" size={11} /> : <FaCopy className="me-2" size={11} />}
                {copySuccess ? "Copied" : "Copy"}
              </Button>
              <Button
                size="sm"
                className="d-flex align-items-center border-0"
                style={{ backgroundColor: '#64748b', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '4px' }}
                onClick={handleExcel}
              >
                <FaFileExcel className="me-2" size={11} /> Excel
              </Button>
              <Button
                size="sm"
                className="d-flex align-items-center border-0"
                style={{ backgroundColor: '#64748b', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '4px' }}
                onClick={handlePDF}
              >
                <FaFilePdf className="me-2" size={11} /> PDF
              </Button>
              <Button
                size="sm"
                className="d-flex align-items-center border-0"
                style={{ backgroundColor: '#64748b', color: 'white', fontSize: '11px', padding: '4px 12px', borderRadius: '4px' }}
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
              {(viewMode === "demand" ? allColumns : distributionColumns).map(col => (
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
                    {(viewMode === "demand" ? allColumns : distributionColumns).map(col => 
                      visibleColumns[col.key] && (
                        <th key={col.key} style={{ cursor: 'pointer', userSelect: 'none', padding: '7px 6px', whiteSpace: 'nowrap' }} onClick={() => handleSort(col.key)} className="text-center">
                          {col.label} <SortIcon column={col.key} />
                        </th>
                      )
                    )}
                  </tr>
                  {viewMode === "distribution" && (
                    <tr style={{ backgroundColor: '#f8f9fa', fontSize: '11px' }}>
                      {distributionColumns.map((col, idx) => {
                        const formula = ['(a)', '(b)', '(c)', '(d)', '(e)', '(f)', '(g)', '(h)', '(i)', '(j=(g+h)-i)'];
                        return visibleColumns[col.key] && <th key={`formula-${idx}`} className="text-center py-1 fw-normal text-muted">{formula[idx]}</th>;
                      })}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => {
                      const activeCols = (viewMode === "demand" ? allColumns : distributionColumns).filter(c => visibleColumns[c.key]);
                      return (
                        <tr key={item.id || item.s_no || `row-${index}`} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                          {activeCols.map(col => {
                            let value = "-";
                            if (col.key === "sno") value = startIndex + index + 1;
                            else if (col.key === "district") value = item.district;
                            else if (col.key === "project") value = item.project;
                            else if (col.key === "quarter") value = item.quarter;
                            else if (col.key === "beneficiary") value = item.req_kit_count || item.beneficiary || "0";
                            else if (col.key === "demandKits") value = item.req_kit || item.demand_kits || "0";
                            else if (col.key === "receivedKits") value = item.received_kits || "0";
                            else if (col.key === "prevBalance") value = "0";
                            else if (col.key === "distributedKits") value = item.distributed_kits || "0";
                            else if (col.key === "availableBalance") value = item.available_balance || "0";
                            return <td key={col.key} className="text-center" style={{ padding: '6px' }}>{value}</td>;
                          })}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-5 text-muted text-center">कोई डेटा उपलब्ध नहीं है।</td>
                    </tr>
                  )}
                  {paginatedData.length > 0 && (
                    <tr style={{ backgroundColor: '#ffffff', fontWeight: 'bold', fontSize: '12px' }}>
                      <td className="text-end" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>Total &rarr;</td>
                      {visibleColumns.district && <td></td>}
                      {visibleColumns.project && <td></td>}
                      {visibleColumns.quarter && <td></td>}
                      {visibleColumns.beneficiary && (
                        <td className="text-center" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>{totals.beneficiary}</td>
                      )}
                      {visibleColumns.demandKits && (
                        <td className="text-center" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>{totals.demandKits}</td>
                      )}
                      {viewMode === "distribution" && visibleColumns.receivedKits && (
                        <td className="text-center" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>{totals.receivedKits}</td>
                      )}
                      {viewMode === "distribution" && visibleColumns.prevBalance && (
                        <td className="text-center" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>0</td>
                      )}
                      {viewMode === "distribution" && visibleColumns.distributedKits && (
                        <td className="text-center" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>{totals.distributedKits}</td>
                      )}
                      {viewMode === "distribution" && visibleColumns.availableBalance && (
                        <td className="text-center" style={{ padding: '8px 6px', borderTop: '2px solid #dee2e6' }}>{totals.availableBalance}</td>
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