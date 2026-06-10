import React, { useState, useEffect, useCallback } from "react";
import { Container, Row, Col, Card, Button, Form, Table, Spinner } from "react-bootstrap";

import "../../../assets/css/supervisorleftnav.css";

import { useAuth } from "../../all_login/AuthContext";
import SectorHeader from "../SectorHeader";
import SectorLeftNav from "../SectorLeftNav";

const DistributionBalPoshan = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [searchParams, setSearchParams] = useState({
    financialYear: "2024-25",
    quarter: ""
  });

  const [entryData, setEntryData] = useState({
    allotKelaChipsDemand: "", allotEggDemand: "", allotKhajurDemand: "",
    totalKelaBeneMonth: "", totalEggBeneMonth: "", totalKhajurBeneMonth: "",
    selectedMonth: "", awcCount: "", eligibleBeneCount: "", // These are for the month-wise distribution entry
    kelaChips20gBene: "", eggBeneCount: "", kelaChips30gBene: "",
    kela_disti: "0", egg_disti: "0", tot_noteat_kela_disti: "0"
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

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
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
      // 1. Fetch Demand Data for autofilling allotments
      const demandRes = await api.get('/bp-demand/'); // Bal Poshan Demand API
      const allDemands = Array.isArray(demandRes.data) ? demandRes.data : [];
      const matchingDemand = allDemands.find(d => 
        d.fin_yr === searchParams.financialYear && 
        d.qtr_dmd === searchParams.quarter && 
        d.sec_status === "Approve"
      );

      // 2. Fetch Distribution Data for the table
      const distRes = await api.get('/bp-distribution/'); // Bal Poshan Distribution API
      const allDistributions = Array.isArray(distRes.data) ? distRes.data : [];
      const filteredDistributions = allDistributions.filter(d => 
        d.fin_yr === searchParams.financialYear && d.qtr_dmd === searchParams.quarter
      );

      setTableData(filteredDistributions);

      if (matchingDemand) {
        const kelaBene = parseInt(matchingDemand.kela_chips_bene) || 0;
        const eggBene = parseInt(matchingDemand.egg_bene) || 0;
        const notEatEggBene = parseInt(matchingDemand.not_eat_egg_bene) || 0; // Those who get Khajur instead of egg

        setEntryData(prev => ({
          ...prev, // Keep existing values for other fields
          totalKelaBeneMonth: kelaBene.toString(),
          totalEggBeneMonth: eggBene.toString(),
          totalKhajurBeneMonth: notEatEggBene.toString(),
          allotKelaChipsDemand: (kelaBene * 24).toString(), // Assuming 24 months for total allotment
          allotEggDemand: (eggBene * 24).toString(),
          allotKhajurDemand: (notEatEggBene * 24).toString(),
        }));
        // Reset month-specific fields when demand changes
        setEntryData(prev => ({ ...prev, selectedMonth: "", awcCount: "", eligibleBeneCount: "", kelaChips20gBene: "", eggBeneCount: "", kelaChips30gBene: "" }));
        setShowEntryForm(true);
      } else {
        alert("चयनित वित्तीय वर्ष और त्रैमास के लिए कोई स्वीकृत मांग नहीं मिली। आवंटन डेटा मैन्युअल रूप से दर्ज करें।");
        setShowEntryForm(true); // Allow manual entry even if demand missing
        // Clear autofilled fields if no demand found
        setEntryData(prev => ({ ...prev, allotKelaChipsDemand: "", allotEggDemand: "", allotKhajurDemand: "", totalKelaBeneMonth: "", totalEggBeneMonth: "", totalKhajurBeneMonth: "" }));
      }
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
      allot_kela: entryData.allotKelaChipsDemand,
      allot_egg: entryData.allotEggDemand,
      allot_khajur: entryData.allotKhajurDemand,
      kela_bene: entryData.totalKelaBeneMonth, // This is the demand per month
      egg_bene: entryData.totalEggBeneMonth, // This is the demand per month
      khajur_bene: entryData.totalKhajurBeneMonth, // This is the demand per month
      kela_disti_bene: entryData.kelaChips20gBene,
      egg_disti_bene: entryData.eggBeneCount,
      khajur_disti_bene: entryData.kelaChips30gBene,
      awc_no: entryData.awcCount,
      tot_bene: entryData.eligibleBeneCount,
      kela_disti: (parseInt(entryData.kelaChips20gBene) * 8 || 0).toString(),
      egg_disti: (parseInt(entryData.eggBeneCount) * 8 || 0).toString(),
      khajur_disti: (parseInt(entryData.kelaChips30gBene) * 8 || 0).toString(),
      month: entryData.selectedMonth
    };

    try {
      if (editingId) {
        await api.put('/bp-distribution/', { ...payload, id: editingId });
        alert("डेटा सफलतापूर्वक अपडेट किया गया");
      } else {
        await api.post('/bp-distribution/', payload);
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
      allotKelaChipsDemand: row.allot_kela,
      allotEggDemand: row.allot_egg,
      allotKhajurDemand: row.allot_khajur,
      totalKelaBeneMonth: row.kela_bene,
      totalEggBeneMonth: row.egg_bene,
      totalKhajurBeneMonth: row.khajur_bene,
      selectedMonth: row.month,
      awcCount: row.awc_no,
      eligibleBeneCount: row.tot_bene,
      kelaChips20gBene: row.kela_disti_bene,
      eggBeneCount: row.egg_disti_bene,
      kelaChips30gBene: row.khajur_disti_bene,
      kela_disti: row.kela_disti,
      egg_disti: row.egg_disti,
      tot_noteat_kela_disti: row.khajur_disti
    });
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("क्या आप वाकई इस वितरण रिकॉर्ड को हटाना चाहते हैं?")) {
      try {
        await api.delete('/bp-distribution/', { data: { id } });
        fetchDistributionData();
      } catch (err) {
        alert("डिलीट करने में विफल");
      }
    }
  };

  const resetEntryForm = () => {
    setEditingId(null);
    setEntryData({
      allotKelaChipsDemand: "", allotEggDemand: "", allotKhajurDemand: "",
      totalKelaBeneMonth: "", totalEggBeneMonth: "", totalKhajurBeneMonth: "",
      selectedMonth: "", awcCount: "", eligibleBeneCount: "",
      kelaChips20gBene: "", eggBeneCount: "", kelaChips30gBene: "",
      kela_disti: "0", egg_disti: "0", tot_noteat_kela_disti: "0"
    });
    setShowEntryForm(false);
    setTableData([]);
  };

  const quarterMonthMap = {
    "Apr-May-June": ["April", "May", "June"],
    "July-Aug-Sept": ["July", "August", "September"],
    "Oct-Nov-Dec": ["October", "November", "December"],
    "Jan-Feb-March": ["January", "February", "March"]
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
          {/* Primary Headings */}
          <div className="text-center mb-4">
            <h3 className="fw-bold text-uppercase mb-1" style={{ color: "#60a5fa", fontSize: "clamp(1rem, 2.5vw, 1.5rem)" }}>
              वितरण पैनल
            </h3>
            <h5 className="fw-bold text-uppercase mb-0" style={{ color: "#93c5fd", fontSize: "clamp(0.85rem, 2vw, 1.1rem)" }}>मुख्यमंत्री बाल पोषण योजना हेतु</h5>
          </div>

          {/* Section Subheading */}
          <div className="mb-2">
            <h6 className="fw-bold d-flex align-items-center border-bottom pb-1 mb-0" style={{ fontSize: '14px', color: "#60a5fa" }}>
              <i className="bi bi-box-seam-fill me-2"></i> सैक्टर वितरण
            </h6>
          </div>

          {/* Form Selection Card */}
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
                        <option value="2024-25">2024-25</option>
                        <option value="2025-26">2025-26</option>
                        <option value="2026-27">2026-27</option>
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
                        <option value="Apr-May-June">Apr-May-June</option>
                        <option value="July-Aug-Sept">July-Aug-Sept</option>
                        <option value="Oct-Nov-Dec">Oct-Nov-Dec</option>
                        <option value="Jan-Feb-March">Jan-Feb-March</option>
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

          {/* Data Entry Form - Appears after Search */}
          {showEntryForm && (
            <Card className="mb-3 shadow-sm border animate-in fade-in slide-in-from-top-2 duration-300" style={{ borderLeft: '4px solid #60a5fa', borderColor: "#dbeafe" }}>
              <Card.Header className="py-2" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                <h6 className="mb-0 fw-bold"><i className="bi bi-pencil-square me-2"></i>सैक्टर वितरण (वितरण वर्ष: {searchParams.financialYear})</h6>
              </Card.Header>
              <Card.Body className="p-3">
                <Form onSubmit={handleSubmit}>
                  <Row className="g-2 mb-2">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Distribution Year</Form.Label>
                        <Form.Control size="sm" type="text" value={searchParams.financialYear} readOnly className="fw-bold text-dark border-0" style={{ fontSize: '12px', backgroundColor: '#bfdbfe' }} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="small fw-bold text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left', color: "#60a5fa" }}>Quarter Demand</Form.Label>
                        <Form.Control size="sm" type="text" value={searchParams.quarter} readOnly className="fw-bold text-dark border-0" style={{ fontSize: '12px', backgroundColor: '#bfdbfe' }} />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row className="g-2 mb-2">
                    {[
                      { label: "Total Allot Kela Chips", name: "allotKelaChipsDemand", type: "number" },
                      { label: "Total Allot Egg", name: "allotEggDemand", type: "number" },
                      { label: "Total Allot Khajur", name: "allotKhajurDemand", type: "number" },
                      { label: "Total Kela Beneficiary(per Month)", name: "totalKelaBeneMonth", type: "number", disabled: true },
                      { label: "Total Egg Beneficiary (per Month)", name: "totalEggBeneMonth", type: "number", disabled: true },
                      { label: "Total Khajur Bene (per Month)", name: "totalKhajurBeneMonth", type: "number", disabled: true }
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
                            disabled={f.disabled}
                          />
                        </Form.Group>
                      </Col>
                    ))}
                  </Row>

                  <div className="pt-2 border-top mt-3">
                    <h6 className="fw-bold text-dark text-uppercase mb-2" style={{ fontSize: '12px', borderBottom: '1px solid #eee', paddingBottom: '4px' }}>
                      Month wise Distribution ({searchParams.quarter})
                    </h6>
                    <Row className="g-2">
                      <Col md={4}>
                        <Form.Group className="mb-1">
                          <Form.Label className="small fw-bold text-dark text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>Select Month</Form.Label>
                          <Form.Select size="sm" name="selectedMonth" value={entryData.selectedMonth} onChange={handleEntryChange}>
                            <option value="">-- चयन करें --</option>
                            {searchParams.quarter &&
                              quarterMonthMap[searchParams.quarter]
                                ?.filter(
                                  (month) =>
                                    !tableData.some((item) => item.month === month && item.fin_yr === searchParams.financialYear && item.qtr_dmd === searchParams.quarter) ||
                                    (editingId && tableData.find(item => item.id === editingId)?.month === month)
                                )
                                .map((month) => <option key={month} value={month}>{month}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      {[
                        { label: "केला चिप्स खाने वाले लाभार्थियों की संख्यां (20 ग्राम)", name: "kelaChips20gBene", type: "number" }, // Kela Chips Beneficiaries (20g)
                        { label: "अंडा खाने वाले लाभार्थियों की संख्या", name: "eggBeneCount", type: "number" }, // Egg Beneficiaries
                        { label: "अंडे के स्थान पर केला चिप्स खाने वाले लाभार्थियों की संख्यां (30 ग्राम)", name: "kelaChips30gBene", type: "number" } // Kela Chips instead of Egg Beneficiaries (30g)
                      ].map((f) => (
                        <Col md={4} key={f.name}>
                          <Form.Group>
                            <Form.Label className="small fw-bold text-dark text-uppercase" style={{ fontSize: '11px', display: 'block', textAlign: 'left' }}>{f.label}</Form.Label>
                            <Form.Control size="sm" type={f.type} name={f.name} value={entryData[f.name]} onChange={handleEntryChange} placeholder="0" />
                          </Form.Group>
                        </Col>
                      ))}
                    </Row>
                    <div className="text-center mt-3">
                      <Button type="submit" variant={editingId ? "warning" : "light"} className="px-4 py-1 fw-bold shadow-sm text-white" style={{ fontSize: '13px', backgroundColor: editingId ? "" : "#60a5fa", borderColor: editingId ? "" : "#60a5fa" }}>
                        {editingId ? "Update (अपडेट करें)" : "Submit (सबमिट करें)"}
                      </Button>
                    </div>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          )}

          {/* Data Table Section */}
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
                  <tr className="text-[9px] text-uppercase fw-black bg-light" style={{ lineHeight: '1.1' }}>
                    <th className="py-1 bg-slate-50">S.No</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Fin. Yr</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Month</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Kela Bene (Dmd)</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Egg Bene (Dmd)</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Khajur Bene (Dmd)</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Allot Kela (for Qtr)</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Allot Egg(for Qtr)</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Allot Khajur(for Qtr)</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Kela Bene(D)</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Egg Bene(D)</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Khajur Bene(D)</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Distribute Kela (M)</th>
                    <th className="py-1" style={{ backgroundColor: "#e0f2fe" }}>Distribut Egg(M)</th>
                    <th className="py-1" style={{ backgroundColor: "#eef2ff" }}>Distribut Khajur(M)</th>
                    <th className="py-1 bg-slate-50">Del</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: "10px" }}>
                  {tableData.length > 0 ? (
                    tableData.map((row, index) => (
                      <tr key={row.id}>
                        <td className="fw-bold text-muted py-1">{index + 1}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.fin_yr}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{row.month}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.kela_bene}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{row.egg_bene}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.khajur_bene}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{row.allot_kela}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.allot_egg}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{row.allot_khajur}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.kela_disti_bene}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{row.egg_disti_bene}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{row.khajur_disti_bene}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{(parseInt(row.kela_disti_bene) || 0) * 8}</td>
                        <td style={{ backgroundColor: "#f0f9ff" }}>{(parseInt(row.egg_disti_bene) || 0) * 8}</td>
                        <td style={{ backgroundColor: "#f5f3ff" }}>{(parseInt(row.khajur_disti_bene) || 0) * 8}</td>
                        <td className="d-flex gap-1 justify-content-center">
                          <Button variant="link" size="sm" className="text-primary p-0" onClick={() => handleEdit(row)}><i className="bi bi-pencil-square"></i></Button>
                          <Button variant="link" size="sm" className="text-danger p-0" onClick={() => handleDelete(row.id)}><i className="bi bi-trash3-fill"></i></Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="16" className="py-4 text-muted small">
                        {loading ? <Spinner animation="border" size="sm" /> : "No records found. Please use the search filters above."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Table Footer Branding */}
            <div className="d-flex justify-content-end mt-2">
               <span className="text-muted font-bold tracking-widest uppercase opacity-50" style={{ fontSize: "9px" }}>
                 Portal Distribution Manager v2.0
               </span>
            </div>
          </div>
        </Container>
      </div>
    </div>
  );
};

export default DistributionBalPoshan;