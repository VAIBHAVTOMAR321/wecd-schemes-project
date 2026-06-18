import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Container, Row, Col, Card, Button, Form, Table, Spinner, Modal, InputGroup, FormControl, Pagination } from "react-bootstrap";
import { FaCopy, FaFileExcel, FaFilePdf, FaCheck, FaEye } from "react-icons/fa";
 
import "../../../assets/css/supervisorleftnav.css";

import { useAuth } from "../../all_login/AuthContext";
import SectorHeader from "../SectorHeader";
import SectorLeftNav from "../SectorLeftNav";

const MahalakshmiKit = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);  
  const [loading, setLoading] = useState(false);
  const [editingBeneficiaryId, setEditingBeneficiaryId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [refreshBeneficiaryTrigger, setRefreshBeneficiaryTrigger] = useState(0);
  const [availableFinancialYears, setAvailableFinancialYears] = useState([]);
  const [availableQuarters, setAvailableQuarters] = useState([]);
  const [fullFilteredBeneficiaries, setFullFilteredBeneficiaries] = useState([]); // To store all filtered data before pagination

  const tableColumns = [
    { key: "sno", label: "S.No" },
    { key: "name", label: "नाम" },
    { key: "dob", label: "जन्म तिथि" },
    { key: "month", label: "माह" },
    { key: "fin_year", label: "वित्तीय वर्ष" },
    { key: "kit_date", label: "किट दिनांक" },
    { key: "caste_category", label: "जाति वर्ग" },
    { key: "ben_mob", label: "मोबाइल" },
    { key: "adhar_num", label: "आधार" },
    { key: "del_no", label: "डिलीवरी नं" },
    { key: "child_gender", label: "बच्चा लिंग" },
    { key: "awc_code", label: "AWC कोड" },
    { key: "sector", label: "सेक्टर" },
    { key: "project", label: "प्रोजेक्ट" },
    { key: "district", label: "जिला" },
    { key: "status", label: "स्टेटस" },
  ];
  const [awcList, setAwcList] = useState([]);
  const [awcLoading, setAwcLoading] = useState(false);

  // State for the dropdown selections
  const [searchParams, setSearchParams] = useState({
    financialYear: "",
    quarter: ""
  });

  // State for the actual API query parameters applied on Search
  const [appliedFilters, setAppliedFilters] = useState({
    financialYear: "",
    quarter: ""
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initialVisibility = {};
    tableColumns.forEach(col => { initialVisibility[col.key] = true; });
    return initialVisibility;
  });

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "", dob: "", month: "", fin_year: "",
    caste_category: "", ben_mob: "", adhar_num: "", del_no: "", del_date: "", child_born: 0, child_gender: [], address: "", awc_code: ""
  });

  const { user, api } = useAuth();

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
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!api) return;

    const fetchInitialDataForDropdowns = async () => {
        try {
            const beneRes = await api.get('/maha-beneficiary/', { params: { page_size: 9999 } });
            const allBeneficiaries = beneRes.data.results || beneRes.data;

            const years = [...new Set(allBeneficiaries.map(item => item.fin_year))].sort((a, b) => b.localeCompare(a));
            setAvailableFinancialYears(years);

            // Populate available quarters with all month names
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            setAvailableQuarters(months);

            // Set initial form state and applied filters to the latest year automatically
            setSearchParams(prev => {
                let newFinYear = prev.financialYear;
                if (!newFinYear && years.length > 0) {
                    newFinYear = years[0];
                } else if (newFinYear && !years.includes(newFinYear)) {
                    newFinYear = years[0];
                }
                return { ...prev, financialYear: newFinYear };
            });

            setAppliedFilters(prev => {
                let newFinYear = prev.financialYear;
                if (!newFinYear && years.length > 0) {
                    newFinYear = years[0];
                } else if (newFinYear && !years.includes(newFinYear)) {
                    newFinYear = years[0];
                }
                return { ...prev, financialYear: newFinYear };
            });

            setRegisterForm(prev => ({ ...prev, fin_year: years.length > 0 ? years[0] : "" }));
        } catch (err) {
            console.error("Failed to fetch initial data for dropdowns:", err);
        }
    };
    fetchInitialDataForDropdowns();
  }, [api]);

  // Fetch beneficiaries whenever applied filters, page, or refresh trigger changes
  useEffect(() => {
    if (!api) return;
    const fetchBeneficiaries = async () => {
      setLoading(true);
      try {
        // Initialize params with only filter criteria, assuming API returns all matching data
        // and client-side pagination will be applied.
        const params = {};
        
        // Strictly append parameters only if they have valid values
        if (appliedFilters.financialYear) {
          params.fin_year = appliedFilters.financialYear;
        }
        // If a month is selected, send it directly for backend filtering
        if (appliedFilters.quarter && appliedFilters.quarter !== "All") {
          params.month = appliedFilters.quarter; // Directly use the selected month
        }

        // Fetch all data matching the filters
        const res = await api.get('/maha-beneficiary/', { params });
        
        let rawData = [];
        if (Array.isArray(res.data)) {
          rawData = res.data;
        } else if (res.data && Array.isArray(res.data.results)) {
          rawData = res.data.results;
        }

        // Perform explicit client-side filtering to ensure "overall data" isn't shown
        let allFilteredData = rawData;
        
        if (appliedFilters.financialYear) {
          allFilteredData = allFilteredData.filter(item => item.fin_year === appliedFilters.financialYear);
        }
        
        // Client-side filter by month
        if (appliedFilters.quarter && appliedFilters.quarter !== "All") { // appliedFilters.quarter now holds a month name
          allFilteredData = allFilteredData.filter(item => item.month === appliedFilters.quarter);
        }

        setFullFilteredBeneficiaries(allFilteredData); // Store the full filtered data
      } catch (err) {
        console.error("Failed to fetch beneficiaries:", err);
        setFullFilteredBeneficiaries([]);
      } finally {
        setLoading(false);
      } 
    }; 
    fetchBeneficiaries();
  }, [api, appliedFilters, currentPage, refreshBeneficiaryTrigger]);

  // Apply local search filter (searchTerm) to the data fetched from API
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return fullFilteredBeneficiaries;
    const term = searchTerm.toLowerCase();
    return fullFilteredBeneficiaries.filter(item =>
      Object.values(item).some(val => String(val).toLowerCase().includes(term))
    );
  }, [fullFilteredBeneficiaries, searchTerm]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Fetch AWC List dynamically based on the selected year in the search form
  useEffect(() => {
    if (!api || !searchParams.financialYear) return;
    const fetchAwc = async () => {
      setAwcLoading(true);
      try {
        const res = await api.get('/sector-awc-dropdown/', { params: { fin_year: searchParams.financialYear } });
        if (res.data?.success) {
          setAwcList(res.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch AWC list:", err);
      } finally {
        setAwcLoading(false);
      }
    };
    fetchAwc();
  }, [api, searchParams.financialYear]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const getShortMonth = (dateString) => {
    if (!dateString) return "";
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const parts = dateString.split('-');
    return parts.length === 3 ? monthNames[parseInt(parts[1], 10) - 1] : "";
  };

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const getVisibleRows = (rows, columns) => rows.map((row) => columns.map((col) => row[col.key] ?? ""));

  const handleCopy = async () => {
    const visibleCols = tableColumns.filter((col) => visibleColumns[col.key]);
    const header = visibleCols.map((col) => col.label).join("\t");
    const rows = filteredData.map((item, idx) => {
      const rowData = {
        sno: idx + 1,
        name: item.name,
        dob: item.dob,
        month: item.month,
        fin_year: item.fin_year,
        kit_date: item.kit_date,
        caste_category: item.caste_category,
        ben_mob: item.ben_mob,
        adhar_num: item.adhar_num,
        del_no: item.del_no,
        child_gender: item.child_gender,
        awc_code: item.awc_code,
        sector: item.sector,
        project: item.project,
        district: item.district,
        status: item.status,
      };
      return visibleCols.map((col) => rowData[col.key]).join("\t");
    }).join("\n");
  
    const text = `${header}\n${rows}`;
  
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
  
    let csv = visibleCols.map((col) => escapeCsv(col.label)).join(",") + "\n";
    csv += filteredData.map((item, idx) => {
      const rowData = {
        sno: idx + 1,
        name: item.name,
        dob: item.dob,
        month: item.month,
        fin_year: item.fin_year,
        kit_date: item.kit_date,
        caste_category: item.caste_category,
        ben_mob: item.ben_mob,
        adhar_num: item.adhar_num,
        del_no: item.del_no,
        child_gender: item.child_gender,
        awc_code: item.awc_code,
        sector: item.sector,
        project: item.project,
        district: item.district,
        status: item.status,
      };
      return visibleCols.map((col) => escapeCsv(rowData[col.key])).join(",");
    }).join("\n");
  
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Mahalakshmi_Kit_Beneficiaries_${appliedFilters.financialYear}_${appliedFilters.quarter || "All"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  
  const handlePDF = () => {
    if (filteredData.length === 0) return;
    const printWindow = window.open("", "_blank", "width=1200,height=800");
    if (!printWindow) return;
  
    const visibleCols = tableColumns.filter(c => visibleColumns[c.key]);
    const headersHtml = visibleCols.map(c => `<th>${c.label}</th>`).join("");
    const rowsHtml = filteredData.map((item, idx) => {
      const rowData = {
        sno: idx + 1, name: item.name, dob: item.dob, month: item.month, fin_year: item.fin_year,
        kit_date: item.kit_date, caste_category: item.caste_category, ben_mob: item.ben_mob, adhar_num: item.adhar_num,
        del_no: item.del_no, child_gender: item.child_gender, awc_code: item.awc_code, sector: item.sector,
        project: item.project, district: item.district, status: item.status,
      };
      return `<tr>${visibleCols.map(col => `<td>${rowData[col.key]}</td>`).join("")}</tr>`;
    }).join("");
  
    printWindow.document.write(`<html><head><title>Mahalakshmi Kit Beneficiaries Report</title><style>body { font-family: Arial, sans-serif; padding: 20px; } table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; } th, td { border: 1px solid #ddd; padding: 6px; text-align: center; } th { background-color: #f1f5f9; font-weight: bold; } h2, h4 { text-align: center; color: #dc2626; }</style></head><body><h2>Mahalakshmi Kit Beneficiaries Report</h2><h4>वित्तीय वर्ष: ${appliedFilters.financialYear} | माह: ${appliedFilters.quarter || "All"}</h4><table><thead><tr>${headersHtml}</tr></thead><tbody>${rowsHtml}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };


  const handleFilterClick = () => {
    // Apply the dropdown selections to the actual API query state
    setAppliedFilters(searchParams);
    setCurrentPage(1); // Always reset to the first page on a new search
  };

  const resetRegisterForm = useCallback(() => {
    setRegisterForm({
      name: "", dob: "", month: "", fin_year: searchParams.financialYear,
      caste_category: "", ben_mob: "", adhar_num: "", del_no: "", del_date: "", child_born: 0, child_gender: [], address: "", awc_code: ""
    });
    setEditingBeneficiaryId(null);
  }, [searchParams.financialYear]);

  const handleEditBeneficiary = (row) => {
    setEditingBeneficiaryId(row.id);
    setRegisterForm({
      name: row.name || "",
      dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : "",
      month: row.month || "",
      fin_year: row.fin_year || "",
      kit_date: row.kit_date || "",
      caste_category: row.caste_category || "",
      ben_mob: row.ben_mob || "",
      adhar_num: row.adhar_num || "",
      del_no: row.del_no || "",
      del_date: row.del_date || "",
      child_born: parseInt(row.child_born, 10) || 0,
      child_gender: typeof row.child_gender === 'string' ? row.child_gender.split(',').filter(g => g) : [],
      address: row.address || "",
      awc_code: row.awc_code || "",
      awc_name: row.awc_name || "",
      awc_type: row.awc_type || ""
    });
    setShowRegisterModal(true);
  };

  const handleDeleteBeneficiary = async (id) => {
    if (window.confirm("क्या आप वाकई इस लाभार्थी को डिलीट करने का अनुरोध भेजना चाहते हैं?")) {
      try {
        await api.delete('/maha-beneficiary/', { data: { id } });
        
        // If we delete the last item on a page that isn't page 1, go back one page
        if (paginatedData.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        } else {
          setRefreshBeneficiaryTrigger(prev => prev + 1);
        }
        alert("सफलतापूर्वक हटाया गया");
      } catch (err) {
        alert("डिलीट विफल");
      }
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    if (name === "ben_mob" && value && !/^\d{0,10}$/.test(value)) return;
    if (name === "adhar_num" && value && !/^\d{0,12}$/.test(value)) return;
    if (name === "child_born") {
      const numChildren = parseInt(value, 10);
      setRegisterForm(prev => ({
        ...prev,
        child_born: isNaN(numChildren) ? 0 : numChildren,
        child_gender: Array(isNaN(numChildren) ? 0 : numChildren).fill("female"),
      }));
    } else {
      setRegisterForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleChildGenderChange = (index, gender) => {
    setRegisterForm(prev => {
      const newChildGender = [...prev.child_gender];
      newChildGender[index] = gender;
      return { ...prev, child_gender: newChildGender };
    });
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedAwc = awcList.find(a => a.awc_code === registerForm.awc_code);
      const kitMonth = getShortMonth(registerForm.kit_date) || registerForm.month;

      const payload = {
        name: registerForm.name.trim(),
        dob: registerForm.dob,
        fin_year: registerForm.fin_year,
        kit_date: registerForm.kit_date,
        month: kitMonth,
        caste_category: registerForm.caste_category,
        ben_mob: registerForm.ben_mob,
        adhar_num: registerForm.adhar_num,
        del_no: registerForm.del_no,
        del_date: registerForm.del_date,
        child_born: registerForm.child_born,
        child_gender: registerForm.child_gender.join(','),
        address: registerForm.address,
        awc_code: registerForm.awc_code,
        awc_name: selectedAwc ? selectedAwc.awc_name : (editingBeneficiaryId ? registerForm.awc_name : ""),
        awc_type: selectedAwc ? selectedAwc.awc_type : (editingBeneficiaryId ? registerForm.awc_type : "AWC")
      };

      if (editingBeneficiaryId) {
        await api.put('/maha-beneficiary/', { ...payload, id: editingBeneficiaryId });
        alert("लाभार्थी का विवरण सफलतापूर्वक अपडेट किया गया");
      } else {
        await api.post('/maha-beneficiary/', payload);
        alert("लाभार्थी सफलतापूर्वक पंजीकृत हो गया");
      }
      
      setRefreshBeneficiaryTrigger(prev => prev + 1);
      setShowRegisterModal(false);
      resetRegisterForm();
    } catch (err) {
      console.error("Registration error:", err);
      if (err.response && err.response.data) {
        console.error("Server error details:", err.response.data);
        let errorMessages = [];
        if (typeof err.response.data === 'object') {
          for (const key in err.response.data) {
            if (Array.isArray(err.response.data[key])) {
              errorMessages.push(`${key}: ${err.response.data[key].join(', ')}`);
            } else {
              errorMessages.push(`${key}: ${err.response.data[key]}`);
            }
          }
          alert("पंजीकरण विफल: " + errorMessages.join('; '));
        } else {
          alert("पंजीकरण विफल: " + err.response.data);
        }
      } else {
        alert("पंजीकरण विफल। कृपया पुनः प्रयास करें।");
      }
    }
  };

  const renderPaginationItems = () => {
    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
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
      <Pagination.Item key={1} active={1 === currentPage} onClick={() => setCurrentPage(1)}>1</Pagination.Item>
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
      <Pagination.Item key={totalPages} active={totalPages === currentPage} onClick={() => setCurrentPage(totalPages)}>
        {totalPages}
      </Pagination.Item>
    );

    return pages;
  };

  return (
    <div className="dashboard-container" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <SectorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <SectorHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="p-4">
          <div className="d-flex align-items-center mb-4">
            <div className="flex-grow-1 text-center">
              <h3 className="fw-bold text-uppercase mb-1" style={{ color: "#60a5fa", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
                वितरण पैनल
              </h3>
              <h5 className="fw-bold text-uppercase mb-0" style={{ color: "#93c5fd", fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}>महालक्ष्मी किट वितरण हेतु</h5>
            </div>
            <Button variant="light" size="sm" className="fw-bold shadow-sm text-white flex-shrink-0" style={{ fontSize: '12px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }} onClick={() => { resetRegisterForm(); setShowRegisterModal(true); }}>
              <i className="bi bi-person-plus me-1"></i> नये लाभार्थी का पंजीकरण करें
            </Button>
          </div>

          <div className="mb-2">
            <h6 className="fw-bold d-flex align-items-center border-bottom pb-1 mb-0" style={{ fontSize: '14px', color: "#60a5fa" }}>
              <i className="bi bi-box-seam-fill me-2"></i> सैक्टर वितरण
            </h6>
          </div>

          <Card className="border-0 shadow-sm mb-3">
            <Card.Body className="p-3">
              <Form onSubmit={(e) => e.preventDefault()}>
                <Row className="g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>वित्तीय वर्ष</Form.Label>
                      <Form.Select
                        size="sm"
                        name="financialYear"
                        value={searchParams.financialYear}
                        onChange={handleSearchChange}
                        className="border-2"
                      >
                        <option value="">-- वित्तीय वर्ष चुनें --</option>
                        {availableFinancialYears.map(year => (<option key={year} value={year}>{year}</option>))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>माह</Form.Label>
                      <Form.Select
                        size="sm"
                        name="quarter"
                        value={searchParams.quarter}
                        onChange={handleSearchChange}
                        className="border-2"
                      >
                        <option value="">-- चयन करें --</option>
                        <option value="All">All</option>
                        {availableQuarters.map(month => (<option key={month} value={month}>{month}</option>))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-center mt-3">
                  <Button
                    variant="light"
                    className="px-4 py-1 fw-bold shadow-sm text-white"
                    style={{ fontSize: '13px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }}
                    onClick={handleFilterClick}
                    disabled={loading}
                  >
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

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
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>
          </div>

          <div className="bg-white p-2 rounded shadow-sm border border-light overflow-auto mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2 px-2">
              <h6 className="fw-bold mb-0 border-start border-4 ps-2" style={{ color: "#60a5fa", borderLeftColor: "#60a5fa !important" }}>
                Beneficiary List
              </h6>
            </div>
            
            <div className="w-100">
              <Table bordered hover size="sm" className="mb-0 text-center align-middle w-100">
                <thead>
                  <tr className="text-uppercase fw-bold bg-light" style={{ lineHeight: '1.1', fontSize: '10px' }}>
                    {tableColumns.filter(col => visibleColumns[col.key]).map(col => (
                      <th key={col.key} className="py-1" style={{ backgroundColor: col.key === "sno" ? "" : "#e0f2fe" }}>
                        {col.label}
                      </th>
                    ))}
                    <th className="py-1 bg-slate-50">Action</th> {/* Action column is always visible */}
                  </tr>
                </thead>
                <tbody style={{ fontSize: "10px" }}>
                  {loading ? (
                    <tr>
                      <td colSpan={tableColumns.filter(col => visibleColumns[col.key]).length + 1} className="py-4 text-center">
                        <Spinner animation="border" size="sm" className="me-2" /> डेटा लोड हो रहा है...
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((row, index) => (
                      <tr key={row.id || `row-${index}`}>
                        {visibleColumns.sno && <td className="fw-bold text-muted py-1">{index + 1 + (currentPage - 1) * itemsPerPage}</td>}
                        {visibleColumns.name && <td style={{ backgroundColor: "#f0f9ff" }}>{row.name}</td>}
                        {visibleColumns.dob && <td style={{ backgroundColor: "#f5f3ff" }}>{row.dob}</td>}
                        {visibleColumns.month && <td style={{ backgroundColor: "#f0f9ff" }}>{row.month}</td>}
                        {visibleColumns.fin_year && <td style={{ backgroundColor: "#f5f3ff" }}>{row.fin_year}</td>}
                        {visibleColumns.kit_date && <td style={{ backgroundColor: "#f0f9ff" }}>{row.kit_date}</td>}
                        {visibleColumns.caste_category && <td style={{ backgroundColor: "#f5f3ff" }}>{row.caste_category}</td>}
                        {visibleColumns.ben_mob && <td style={{ backgroundColor: "#f0f9ff" }}>{row.ben_mob}</td>}
                        {visibleColumns.adhar_num && <td style={{ backgroundColor: "#f5f3ff" }}>{row.adhar_num}</td>}
                        {visibleColumns.del_no && <td style={{ backgroundColor: "#f0f9ff" }}>{row.del_no}</td>}
                        {visibleColumns.child_gender && <td style={{ backgroundColor: "#f5f3ff" }}>{row.child_gender}</td>}
                        {visibleColumns.awc_code && <td style={{ backgroundColor: "#f0f9ff" }}>{row.awc_code}</td>}
                        {visibleColumns.sector && <td style={{ backgroundColor: "#f5f3ff" }}>{row.sector}</td>}
                        {visibleColumns.project && <td style={{ backgroundColor: "#f0f9ff" }}>{row.project}</td>}
                        {visibleColumns.district && <td style={{ backgroundColor: "#f5f3ff" }}>{row.district}</td>}
                        {visibleColumns.status && <td style={{ backgroundColor: "#f0f9ff" }}>{row.status}</td>}
                        <td className="d-flex gap-1 justify-content-center">
                          <Button variant="link" size="sm" className="text-primary p-0" onClick={() => handleEditBeneficiary(row)}><i className="bi bi-pencil-square"></i></Button>
                          <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDeleteBeneficiary(row.id)}><i className="bi bi-trash3-fill"></i></Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableColumns.filter(col => visibleColumns[col.key]).length + 1} className="py-4 text-muted small">No beneficiaries found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="d-flex justify-content-between align-items-center mt-3 px-2 border-top pt-2">
              <span className="text-muted small">
                कुल लाभार्थी: <strong>{filteredData.length}</strong> | दिखा रहा है: {paginatedData.length}
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
                  disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredData.length / itemsPerPage), p + 1))}
                />
                <Pagination.Last
                  disabled={currentPage === Math.ceil(filteredData.length / itemsPerPage)}
                  onClick={() => setCurrentPage(Math.ceil(filteredData.length / itemsPerPage))}
                />
              </Pagination>
            </div>

            <div className="d-flex justify-content-end mt-2">
              <span className="text-muted font-bold tracking-widest uppercase opacity-50" style={{ fontSize: "9px" }}>
                Portal Distribution Manager v2.0
              </span>
            </div>
          </div>

          <Modal show={showRegisterModal} onHide={() => setShowRegisterModal(false)} size="lg" centered>
            <Modal.Header closeButton style={{ backgroundColor: '#dbeafe' }}>
              <Modal.Title className="fw-bold" style={{ color: '#1e40af' }}>
                {editingBeneficiaryId ? "लाभार्थी विवरण अपडेट करें" : "नया लाभार्थी पंजीकरण"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleRegisterSubmit}>
                <Row className="g-2">
                  {[
                    { label: "लाभार्थी का नाम", name: "name", type: "text", md: 6 },
                    { label: "जन्म तिथि", name: "dob", type: "date", md: 6 },
                    { label: "वित्तीय वर्ष", name: "fin_year", type: "select", md: 6, options: ["", ...availableFinancialYears] },
                    { label: "किट दिनांक", name: "kit_date", type: "date", md: 6 },
                    { label: "जाति वर्ग", name: "caste_category", type: "select", md: 4,
                      options: [{ value: "", label: "--जाति वर्ग चुनें--" }, { value: "GEN", label: "जनरल" }, { value: "SC", label: "अनुसूचित जाति" }, { value: "ST", label: "अनुसूचित जनजाति" }, { value: "OBC", label: "अन्य पिछड़ा वर्ग" }, { value: "Other", label: "अन्य" }] },
                    { label: "लाभार्थी मोबाइल", name: "ben_mob", type: "text", md: 4, maxLength: 10 },
                    { label: "आधार नंबर", name: "adhar_num", type: "text", md: 4, maxLength: 12 },
                    { label: "डिलीवरी संख्या", name: "del_no", type: "select", md: 4,
                      options: [{ value: "", label: "--चयन करें--" }, { value: "First", label: "प्रथम" }, { value: "Second", label: "द्वितीय" }] },
                    { label: "डिलीवरी दिनांक", name: "del_date", type: "date", md: 4 },
                    { label: "जन्मित बच्चा", name: "child_born", type: "number", md: 4 },
                    { label: "पता", name: "address", type: "text", md: 6 },
                    { label: "आंगनवाड़ी केंद्र", name: "awc_code", type: "select", md: 6,
                      options: ["", ...awcList.map(a => ({ value: a.awc_code, label: `${a.awc_name} (${a.awc_code})` }))] }
                  ].map((f) => (
                    <Col md={f.md} key={f.name}>
                      <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>{f.label}</Form.Label>
                      {f.type === "select" ? (
                        <Form.Select size="sm" name={f.name} value={registerForm[f.name]} onChange={handleRegisterChange}>
                          {(f.options || []).map((opt, idx) => {
                            const val = typeof opt === 'object' ? opt.value : opt;
                            const label = typeof opt === 'object' ? opt.label : (opt || "-- चयन करें --");
                            return <option key={idx} value={val}>{label}</option>;
                          })}
                        </Form.Select>
                      ) : (
                        <Form.Control 
                          size="sm" 
                          type={f.type} 
                          name={f.name} 
                          value={registerForm[f.name]} 
                          onChange={handleRegisterChange} 
                          placeholder={`${f.label} दर्ज करें`}
                          maxLength={f.maxLength || undefined}
                        />
                      )}
                    </Col>
                  ))}
                </Row>
                <Row className="g-2 mt-2">
                  {Array.from({ length: registerForm.child_born }).map((_, index) => (
                    <Col md={4} key={`child-gender-${index}`}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>
                          बच्चा {index + 1} लिंग
                        </Form.Label>
                        <div>
                          <Form.Check
                            inline
                            type="radio"
                            label="Female"
                            name={`child_gender_${index}`}
                            value="female"
                            checked={registerForm.child_gender[index] === "female"}
                            onChange={() => handleChildGenderChange(index, "female")}
                          />
                          <Form.Check
                            inline
                            type="radio"
                            label="Male"
                            name={`child_gender_${index}`}
                            value="male"
                            checked={registerForm.child_gender[index] === "male"}
                            onChange={() => handleChildGenderChange(index, "male")}
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  ))}
                </Row>
                <div className="text-center mt-4">
                  <Button type="submit" variant="light" className="px-4 py-1 fw-bold shadow-sm text-white" style={{ fontSize: '13px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }}>
                    {editingBeneficiaryId ? "अपडेट करें" : "सबमिट करें"}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)} size="sm" centered>
            <Modal.Header closeButton className="border-0 pb-2">
              <Modal.Title style={{ fontSize: "14px", fontWeight: "bold" }}>Column Visibility</Modal.Title>
            </Modal.Header>
            <Modal.Body className="pt-0">
              <div>
                <h6 className="fw-bold small text-primary border-bottom pb-1">Beneficiary Table</h6>
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
              </div>
            </Modal.Body>
          </Modal>

        </Container>
      </div>
    </div>
  );
};

export default MahalakshmiKit;
