import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, Form, Table, Spinner, Modal } from "react-bootstrap";

import "../../../assets/css/supervisorleftnav.css";

import { useAuth } from "../../all_login/AuthContext";
import SectorHeader from "../SectorHeader";
import SectorLeftNav from "../SectorLeftNav";

const MahalakshmiKit = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [editingBeneficiaryId, setEditingBeneficiaryId] = useState(null);
  const [editingBeneficiaryForm, setEditingBeneficiaryForm] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [awcList, setAwcList] = useState([]);
  const [awcLoading, setAwcLoading] = useState(false);

  const [searchParams, setSearchParams] = useState({
    financialYear: "2025-2026",
    quarter: ""
  });

  const [entryData, setEntryData] = useState({
    totalKitsDemand: "", eligibleBeneCount: "",
    awcCount: "", kitsDistributed: "", beneficiariesServed: ""
  });

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({
    name: "", dob: "", month: "", fin_year: "2025-2026", kit_date: new Date().toISOString().split('T')[0],
    caste_category: "", ben_mob: "", adhar_num: "", del_no: "", del_date: "",
    child_born: "", child_gender: "", address: "", awc_code: ""
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
    const fetchBeneficiaries = async () => {
      setLoading(true);
      try {
        const res = await api.get('/maha-beneficiary/', {
          params: {
            page: currentPage, 
            page_size: 50,
            fin_year: searchParams.financialYear 
          }
        });
        
        // Handle paginated response wrapper (standard results/count pattern)
        if (res.data && res.data.results) {
          setBeneficiaries(res.data.results);
          setTotalCount(res.data.count || 0);
        } else {
          const data = Array.isArray(res.data) ? res.data : [];
          setBeneficiaries(data);
          setTotalCount(data.length);
        }
      } catch (err) {
        console.error("Failed to fetch beneficiaries:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBeneficiaries();
  }, [api, searchParams.financialYear, currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams.financialYear]);

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

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  const handleEntryChange = (e) => {
    const { name, value } = e.target;
    setEntryData(prev => ({ ...prev, [name]: value }));
  };

  const fetchDistributionData = useCallback(async () => {
    if (!searchParams.quarter) {
      alert("कृपया त्रैमासिक मांग का चयन करें");
      return;
    }

    setLoading(true);
    try {
      const distRes = await api.get('/mk-distribution/');
      const allDistributions = Array.isArray(distRes.data) ? distRes.data : [];
      const filteredDistributions = allDistributions.filter(d =>
        d.fin_yr === searchParams.financialYear && d.qtr_dmd === searchParams.quarter
      );
      setTableData(filteredDistributions);
      setShowEntryForm(true);
    } catch (error) {
      console.error("Error fetching distribution data:", error);
      alert("डेटा प्राप्त करने में विफल। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  }, [api, searchParams.financialYear, searchParams.quarter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      fin_yr: searchParams.financialYear,
      qtr_dmd: searchParams.quarter,
      month: searchParams.quarter,
      total_kits_demand: entryData.totalKitsDemand,
      eligible_bene_count: entryData.eligibleBeneCount,
      awc_no: entryData.awcCount,
      kits_distributed: entryData.kitsDistributed,
      beneficiaries_served: entryData.beneficiariesServed
    };

    try {
      if (editingId) {
        await api.put('/mk-distribution/', { ...payload, id: editingId });
        alert("डेटा सफलतापूर्वक अपडेट किया गया");
      } else {
        await api.post('/mk-distribution/', payload);
        alert("डेटा सफलतापूर्वक सबमिट किया गया");
      }
      setEditingId(null);
      fetchDistributionData();
    } catch (err) {
      console.error("Submit error:", err);
      alert("सबमिट करने में विफल");
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setEntryData({
      totalKitsDemand: row.total_kits_demand,
      eligibleBeneCount: row.eligible_bene_count,
      awcCount: row.awc_no,
      kitsDistributed: row.kits_distributed,
      beneficiariesServed: row.beneficiaries_served
    });
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("क्या आप वाकई इस वितरण रिकॉर्ड को हटाना चाहते हैं?")) {
      try {
        await api.delete('/mk-distribution/', { data: { id } });
        fetchDistributionData();
      } catch (err) {
        alert("डिलीट करने में विफल");
      }
    }
  };

  const handleEditBeneficiary = (row) => {
    setEditingBeneficiaryId(row.id);
    setEditingBeneficiaryForm({ ...row });
  };

  const handleEditBeneficiaryChange = (e) => {
    const { name, value } = e.target;
    setEditingBeneficiaryForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateBeneficiary = async () => {
    if (!editingBeneficiaryId) return;
    try {
      await api.put('/maha-beneficiary/', { ...editingBeneficiaryForm, id: editingBeneficiaryId });
      alert("सफलतापूर्वक अपडेट किया गया");
      setEditingBeneficiaryId(null);
      setEditingBeneficiaryForm({});
      setBeneficiaries(prev => prev.map(b => (b.id === editingBeneficiaryId ? editingBeneficiaryForm : b)));
    } catch (err) {
      alert("अपडेट विफल");
    }
  };

  const handleDeleteBeneficiary = async (id) => {
    if (window.confirm("क्या आप वाकई इस लाभार्थी को हटाना चाहते हैं?")) {
      try {
        await api.delete('/maha-beneficiary/', { data: { id } });
        setBeneficiaries(prev => prev.filter(b => b.id !== id));
        alert("सफलतापूर्वक हटाया गया");
      } catch (err) {
        alert("डिलीट विफल");
      }
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const finYear = registerForm.fin_year.replace(/^(\d{4})-(\d{4})$/, "$1-$2");
      const payload = {
        name: registerForm.name,
        dob: registerForm.dob,
        fin_year: finYear,
        kit_date: registerForm.kit_date,
        caste_category: registerForm.caste_category,
        ben_mob: registerForm.ben_mob,
        adhar_num: registerForm.adhar_num,
        del_no: registerForm.del_no,
        del_date: registerForm.del_date,
        child_born: registerForm.child_born ? parseInt(registerForm.child_born) : 0,
        child_gender: registerForm.child_gender,
        address: registerForm.address,
        awc_code: registerForm.awc_code
      };
      const response = await api.post('/maha-beneficiary/', payload);
      alert("लाभार्थी सफलतापूर्वक पंजीकृत हो गया");
      setShowRegisterModal(false);
      setRegisterForm({
        name: "", dob: "", fin_year: searchParams.financialYear, kit_date: new Date().toISOString().split('T')[0],
        caste_category: "", ben_mob: "", adhar_num: "", del_no: "", del_date: "",
        child_born: "", child_gender: "", address: "", awc_code: ""
      });
      if (response.data) {
        setBeneficiaries(prev => [...prev, response.data]);
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("पंजीकरण विफल");
    }
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div className="text-center">
              <h3 className="fw-bold text-uppercase mb-1" style={{ color: "#60a5fa", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
                वितरण पैनल
              </h3>
              <h5 className="fw-bold text-uppercase mb-0" style={{ color: "#93c5fd", fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}>महालक्ष्मी किट वितरण हेतु</h5>
            </div>
            <Button variant="light" size="sm" className="fw-bold shadow-sm text-white" style={{ fontSize: '12px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }} onClick={() => { setEditingBeneficiaryId(null); setShowRegisterModal(true); }}>
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
                        <option value="">--वित्तीय वर्ष चुनें--</option>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2026-2027">2026-2027</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="small fw-bold text-muted text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>त्रैमासिक मांग</Form.Label>
                      <Form.Select
                        size="sm"
                        name="quarter"
                        value={searchParams.quarter}
                        onChange={handleSearchChange}
                        className="border-2"
                      >
                        <option value="">-- चयन करें --</option>
                        <option value="All">All</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="text-center mt-3">
                  <Button
                    variant="light"
                    className="px-4 py-1 fw-bold shadow-sm text-white"
                    style={{ fontSize: '13px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }}
                    onClick={fetchDistributionData}
                    disabled={loading}
                  >
                    {loading ? "Searching..." : "Search"}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {showEntryForm && (
            <Card className="mb-3 shadow-sm border animate-in fade-in slide-in-from-top-2 duration-300" style={{ borderLeft: '4px solid #60a5fa', borderColor: "#dbeafe" }}>
              <Card.Header className="py-2" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                <h6 className="mb-0 fw-bold"><i className="bi bi-pencil-square me-2"></i>महालक्ष्मी किट वितरण (वितरण वर्ष: {searchParams.financialYear})</h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Form onSubmit={handleSubmit}>
                  <Row className="g-2 mb-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>वितरण वर्ष</Form.Label>
                        <Form.Control size="sm" type="text" value={searchParams.financialYear} readOnly className="fw-bold text-dark border-0" style={{ fontSize: '12px', backgroundColor: '#bfdbfe' }} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>त्रैमासिक मांग</Form.Label>
                        <Form.Control size="sm" type="text" value={searchParams.quarter} readOnly className="fw-bold text-dark border-0" style={{ fontSize: '12px', backgroundColor: '#bfdbfe' }} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-2 mb-2">
                    {[
                      { label: "Total Kits Demand", name: "totalKitsDemand", type: "number" },
                      { label: "Eligible Beneficiary Count", name: "eligibleBeneCount", type: "number" },
                      { label: "AWC Count", name: "awcCount", type: "number" },
                      { label: "Kits Distributed", name: "kitsDistributed", type: "number" },
                      { label: "Beneficiaries Served", name: "beneficiariesServed", type: "number" }
                    ].map((f) => (
                      <Col md={4} key={f.name}>
                        <Form.Group>
                          <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>{f.label}</Form.Label>
                          <Form.Control
                            size="sm"
                            type={f.type}
                            name={f.name}
                            value={entryData[f.name]}
                            onChange={handleEntryChange}
                            placeholder="0"
                          />
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>

                  <div className="text-center mt-3">
                    <Button type="submit" variant={editingId ? "warning" : "light"} className="px-4 py-1 fw-bold shadow-sm text-white" style={{ fontSize: '13px', backgroundColor: editingId ? "#f59e0b" : "#60a5fa", borderColor: editingId ? "#f59e0b" : "#60a5fa" }}>
                      {editingId ? "Update (अपडेट करें)" : "Submit (सबमिट करें)"}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          <div className="bg-white p-2 rounded shadow-sm border border-light overflow-hidden mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2 px-2">
              <h6 className="fw-bold mb-0 border-start border-4 ps-2" style={{ color: "#60a5fa", borderLeftColor: "#60a5fa !important" }}>
                Beneficiary List
              </h6>
            </div>

            <div className="w-100">
              <Table bordered hover size="sm" className="mb-0 text-center align-middle w-100" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="text-uppercase fw-bold bg-light" style={{ lineHeight: '1.1', fontSize: '10px' }}>
                    <th className="py-1">S.No</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>नाम</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>जन्म तिथि</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>माह</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>वित्तीय वर्ष</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>किट दिनांक</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>जाति श्रेणी</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>मोबाइल</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>आधार</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>डिलीवरी नं</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>बच्चा लिंग</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>AWC कोड</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>सेक्टर</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>प्रोजेक्ट</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>जिला</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>स्टेटस</th>
                    <th className="py-1 bg-slate-50">Action</th>

                  </tr>
                  
                </thead>
                <tbody style={{ fontSize: "10px" }}>
                  {loading ? (
                    <tr>
                      <td colSpan="17" className="py-4 text-center">
                        <Spinner animation="border" size="sm" className="me-2" /> डेटा लोड हो रहा है...
                      </td>
                    </tr>
                  ) : beneficiaries.length > 0 ? (
                    beneficiaries.map((row, index) => (
                      editingBeneficiaryId === row.id ? (
                        <tr key={row.id}>
                          <td className="fw-bold text-muted py-1">{index + 1 + (currentPage - 1) * 50}</td>
                          {['name','dob','month','fin_year','kit_date','caste_category','ben_mob','adhar_num','del_no','child_gender','awc_code','sector','project','district','status'].map(field => (
                            <td key={field} style={{ backgroundColor: "#f0f9ff" }}>
                              <Form.Control size="sm" type="text" name={field} value={editingBeneficiaryForm[field] || ''} onChange={handleEditBeneficiaryChange} />
                            </td>
                          ))}
                          <td className="d-flex gap-1 justify-content-center">
                            <Button variant="link" size="sm" className="text-success p-0" onClick={handleUpdateBeneficiary}><i className="bi bi-check-lg"></i></Button>
                            <Button variant="link" size="sm" className="text-danger p-0" onClick={() => setEditingBeneficiaryId(null)}><i className="bi bi-x-lg"></i></Button>
                          </td>
                        </tr>
                      ) : (
                        <tr key={row.id}>
                          <td className="fw-bold text-muted py-1">{index + 1 + (currentPage - 1) * 50}</td>
                          <td style={{ backgroundColor: "#f0f9ff" }}>{row.name}</td>
                          <td style={{ backgroundColor: "#f5f3ff" }}>{row.dob}</td>
                          <td style={{ backgroundColor: "#f0f9ff" }}>{row.month}</td>
                          <td style={{ backgroundColor: "#f5f3ff" }}>{row.fin_year}</td>
                          <td style={{ backgroundColor: "#f0f9ff" }}>{row.kit_date}</td>
                          <td style={{ backgroundColor: "#f5f3ff" }}>{row.caste_category}</td>
                          <td style={{ backgroundColor: "#f0f9ff" }}>{row.ben_mob}</td>
                          <td style={{ backgroundColor: "#f5f3ff" }}>{row.adhar_num}</td>
                          <td style={{ backgroundColor: "#f0f9ff" }}>{row.del_no}</td>
                          <td style={{ backgroundColor: "#f5f3ff" }}>{row.child_gender}</td>
                          <td style={{ backgroundColor: "#f0f9ff" }}>{row.awc_code}</td>
                          <td style={{ backgroundColor: "#f5f3ff" }}>{row.sector}</td>
                          <td style={{ backgroundColor: "#f0f9ff" }}>{row.project}</td>
                          <td style={{ backgroundColor: "#f5f3ff" }}>{row.district}</td>
                          <td style={{ backgroundColor: "#f0f9ff" }}>{row.status}</td>
                          <td className="d-flex gap-1 justify-content-center">
                            <Button variant="link" size="sm" className="text-primary p-0" onClick={() => handleEditBeneficiary(row)}><i className="bi bi-pencil-square"></i></Button>
                            <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDeleteBeneficiary(row.id)}><i className="bi bi-trash3-fill"></i></Button>
                          </td>
                        </tr>
                      )
                    ))
                  ) : (
                    <tr>
                      <td colSpan="17" className="py-4 text-muted small">No beneficiaries found</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="d-flex justify-content-between align-items-center mt-3 px-2 border-top pt-2">
              <span className="text-muted small">
                कुल लाभार्थी: <strong>{totalCount}</strong> | दिखा रहा है: {beneficiaries.length}
              </span>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  disabled={currentPage === 1 || loading} 
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  <i className="bi bi-chevron-left"></i> पिछला
                </Button>
                <span className="align-self-center small fw-bold px-2">पृष्ठ {currentPage}</span>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  disabled={beneficiaries.length < 50 || (currentPage * 50 >= totalCount) || loading} 
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  अगला <i className="bi bi-chevron-right"></i>
                </Button>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-2">
              <span className="text-muted font-bold tracking-widest uppercase opacity-50" style={{ fontSize: "9px" }}>
                Portal Distribution Manager v2.0
              </span>
            </div>
          </div>

          <div className="bg-white p-2 rounded shadow-sm border border-light overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-2 px-2">
              <h6 className="fw-bold mb-0 border-start border-4 ps-2" style={{ color: "#60a5fa", borderLeftColor: "#60a5fa !important" }}>
                Monthly Distribution
              </h6>
              <i className="bi bi-info-circle text-muted" title="Metrics are based on approved sector demands"></i>
            </div>

            <div className="w-100">
              <Table bordered hover size="sm" className="mb-0 text-center align-middle w-100" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="text-uppercase fw-bold bg-light" style={{ lineHeight: '1.1', fontSize: '10px' }}>
                    <th className="py-1">S.No</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Fin. Yr</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Month</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Total Kits (Dmd)</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Eligible Bene (Dmd)</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>AWC Count</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Kits Distributed</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Beneficiaries Served</th>
                    <th className="py-1 bg-slate-50">Action</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "10px" }}>
                  {tableData.length > 0 ? (
                    tableData.map((row, index) => (
                      <tr key={row.id}>
                        <td className="fw-bold text-muted py-1">{index + 1}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.fin_yr}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{row.month}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.total_kits_demand}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{row.eligible_bene_count}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.awc_no}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{row.kits_distributed}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.beneficiaries_served}</td>
                        <td className="d-flex gap-1 justify-content-center">
                          <Button variant="link" size="sm" className="text-primary p-0" onClick={() => handleEdit(row)}><i className="bi bi-pencil-square"></i></Button>
                          <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDelete(row.id)}><i className="bi bi-trash3-fill"></i></Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="py-4 text-muted small">
                        {loading ? <Spinner animation="border" size="sm" /> : "No records found. Please use the search filters above."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            <div className="d-flex justify-content-end mt-2">
              <span className="text-muted font-bold tracking-widest uppercase opacity-50" style={{ fontSize: "9px" }}>
                Portal Distribution Manager v2.0
              </span>
            </div>
          </div>

          <Modal show={showRegisterModal} onHide={() => setShowRegisterModal(false)} size="lg" centered>
            <Modal.Header closeButton style={{ backgroundColor: '#dbeafe' }}>
              <Modal.Title className="fw-bold" style={{ color: '#1e40af' }}>नया लाभार्थी पंजीकरण</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleRegisterSubmit}>
                <Row className="g-2">
                  {[
                    { label: "लाभार्थी का नाम", name: "name", type: "text", md: 6 },
                    { label: "जन्म तिथि", name: "dob", type: "date", md: 6 },
                    { label: "वित्तीय वर्ष", name: "fin_year", type: "select", md: 6,
                      options: ["", "2025-2026", "2026-2027"] },
                    { label: "किट दिनांक", name: "kit_date", type: "date", md: 6 },
                    { label: "जाति श्रेणी", name: "caste_category", type: "select", md: 4,
                      options: ["", "Gen", "OBC", "SC", "ST", "Other"] },
                    { label: "लाभार्थी मोबाइल", name: "ben_mob", type: "text", md: 4 },
                    { label: "आधार नंबर", name: "adhar_num", type: "text", md: 4 },
                    { label: "डिलीवरी नंबर", name: "del_no", type: "text", md: 4 },
                    { label: "डिलीवरी दिनांक", name: "del_date", type: "date", md: 4 },
                    { label: "जन्मित बच्चा", name: "child_born", type: "number", md: 4 },
                    { label: "बच्चा लिंग", name: "child_gender", type: "select", md: 4,
                      options: ["", "Male", "Female"] },
                    { label: "पता", name: "address", type: "text", md: 6 },
                    { label: "आंगनवाड़ी केंद्र", name: "awc_code", type: "select", md: 6,
                      options: ["", ...awcList.map(a => ({ value: a.awc_code, label: `${a.awc_name} (${a.awc_code})` }))] }
                  ].map((f) => (
                    <Col md={f.md} key={f.name}>
                      <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>{f.label}</Form.Label>
                        {f.type === "select" ? (
                          <Form.Select size="sm" name={f.name} value={registerForm[f.name]} onChange={handleRegisterChange}>
                            {(f.options || []).map(opt => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt || "-- चयन करें --"}</option>)}
                          </Form.Select>
                      ) : (
                        <Form.Control size="sm" type={f.type} name={f.name} value={registerForm[f.name]} onChange={handleRegisterChange} placeholder={`${f.label} दर्ज करें`} />
                      )}
                    </Col>
                  ))}
                </Row>
                <div className="text-center mt-4">
                  <Button type="submit" variant="light" className="px-4 py-1 fw-bold shadow-sm text-white" style={{ fontSize: '13px', backgroundColor: "#60a5fa", borderColor: "#60a5fa" }}>
                    सबमिट करें
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

        </Container>
      </div>
    </div>
  );
};

export default MahalakshmiKit;
