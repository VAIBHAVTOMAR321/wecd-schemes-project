import React, { useState, useEffect } from "react";
import { Container, Row, Col, Spinner, Table, Badge, Form } from "react-bootstrap";

import "../../../../assets/css/supervisorleftnav.css";
import CDPOLeftNav from "../../CDPOLeftNav";
import CDPOHeader from "../../CDPOHeader";
import { useAuth } from "../../../all_login/AuthContext";


const StockBal = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [demandData, setDemandData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedQuarter, setSelectedQuarter] = useState("All");
  
  const { user, api, uniqueId } = useAuth();

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetching Bal Poshan demand and distribution data
        const response = await api.get("/cdpo/demand-distribution-bp/");
        if (response.data.success) {
          setDemandData(response.data.data);
        } else {
          setError("Failed to fetch data.");
        }
      } catch (err) {
        setError("An error occurred while fetching data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get unique values for filter dropdowns
  const financialYears = [...new Set(demandData.map(item => item.financial_year))].sort();
  const quarters = [...new Set(demandData.map(item => item.quarter))].sort();

  // Filter logic for table display
  const filteredData = demandData.filter(item => {
    const yearMatch = selectedYear === "All" || item.financial_year === selectedYear;
    const quarterMatch = selectedQuarter === "All" || item.quarter === selectedQuarter;
    return yearMatch && quarterMatch;
  });

  return (
    <div className="dashboard-container">
      <CDPOLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <CDPOHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3">
          <div className="main-heading">
            <h3 className="mb-0 fw-bold">
              Demand & Distribution (Bal Poshan)
            </h3>
            <p className="text-muted mb-4 small">Quarterly breakdown of demand requests and monthly distribution</p>
          </div>

          <Row className="mb-4">
            <Col md={4} lg={3}>
              <Form.Group controlId="financialYearFilter">
                <Form.Label className="fw-bold small">Filter by Financial Year</Form.Label>
                <Form.Select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="All">All Financial Years</option>
                  {financialYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4} lg={3}>
              <Form.Group controlId="quarterFilter">
                <Form.Label className="fw-bold small">Filter by Quarter</Form.Label>
                <Form.Select 
                  value={selectedQuarter} 
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                >
                  <option value="All">All Quarters</option>
                  {quarters.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading records...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : demandData.length === 0 ? (
            <div className="text-center py-5 text-muted">No records found.</div>
          ) : (
            <div className="table-responsive shadow-sm rounded border bg-white">
              <Table hover bordered className="align-middle text-center mb-0" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th rowSpan="2" className="bg-primary text-white">FY</th>
                    <th rowSpan="2" className="bg-primary text-white">Quarter</th>
                    <th rowSpan="2" className="bg-primary text-white">Sector</th>
                    <th rowSpan="2" className="bg-primary text-white">Status</th>
                    <th rowSpan="2" className="bg-primary text-white">Month</th>
                    <th rowSpan="2" className="bg-primary text-white">AWC</th>
                    <th rowSpan="2" className="bg-primary text-white">Total Bene</th>
                    <th colSpan="3" className="bg-success text-white">Kela Chips Distribution</th>
                    <th colSpan="3" className="bg-danger text-white">Egg Distribution</th>
                    <th colSpan="3" className="bg-warning text-dark">Khajur Distribution</th>
                  </tr>
                  <tr className="small font-weight-bold">
                    <th className="bg-success-subtle text-dark">Target</th>
                    <th className="bg-success-subtle text-dark">Bene</th>
                    <th className="bg-success-subtle text-dark">Qty</th>
                    <th className="bg-danger-subtle text-dark">Target</th>
                    <th className="bg-danger-subtle text-dark">Bene</th>
                    <th className="bg-danger-subtle text-dark">Qty</th>
                    <th className="bg-warning-subtle text-dark">Target</th>
                    <th className="bg-warning-subtle text-dark">Bene</th>
                    <th className="bg-warning-subtle text-dark">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    filteredData.map((demand) => (
                      demand.distribution && demand.distribution.length > 0 ? (
                        demand.distribution.map((dist, dIdx) => (
                          <tr key={`${demand.demand_id}-${dist.id || dIdx}`} className="table-light">
                            {dIdx === 0 ? (
                              <>
                                <td rowSpan={demand.distribution.length} className="fw-bold bg-light">{demand.financial_year}</td>
                                <td rowSpan={demand.distribution.length}><Badge bg="info">{demand.quarter}</Badge></td>
                                <td rowSpan={demand.distribution.length} className="text-primary fw-medium bg-light">{demand.sector}</td>
                                <td rowSpan={demand.distribution.length}>
                                  <Badge bg={demand.cdpo_status === "Approve" ? "success" : demand.cdpo_status === "Pending" ? "warning" : "danger"}>
                                    {demand.cdpo_status}
                                  </Badge>
                                </td>
                              </>
                            ) : null}
                            <td className="fw-bold">{dist.month}</td>
                            <td>{dist.awc_no || "0"}</td>
                            <td>{dist.tot_bene || "0"}</td>
                            {/* Kela Chips Details */}
                            <td>{demand.kela_chips_beneficiary}</td>
                            <td>{dist.kela_disti_bene}</td>
                            <td className="fw-bold text-success">{dist.kela_disti}</td>
                            {/* Egg Details */}
                            <td>{demand.egg_beneficiary}</td>
                            <td>{dist.egg_disti_bene}</td>
                            <td className="fw-bold text-danger">{dist.egg_disti}</td>
                            {/* Khajur Details */}
                            <td>{demand.not_eat_egg_beneficiary}</td>
                            <td>{dist.khajur_disti_bene}</td>
                            <td className="fw-bold text-dark">{dist.khajur_disti}</td>
                          </tr>
                        ))
                      ) : (
                        <tr key={demand.demand_id} className="table-light">
                          <td className="fw-bold bg-light">{demand.financial_year}</td>
                          <td><Badge bg="info">{demand.quarter}</Badge></td>
                          <td className="text-primary fw-medium bg-light">{demand.sector}</td>
                          <td>
                            <Badge bg={demand.cdpo_status === "Approve" ? "success" : demand.cdpo_status === "Pending" ? "warning" : "danger"}>
                              {demand.cdpo_status}
                            </Badge>
                          </td>
                          <td colSpan="12" className="text-center text-muted italic">No distribution recorded</td>
                        </tr>
                      )
                    ))
                  ) : (
                    <tr>
                      <td colSpan="16" className="text-center py-4">No records found for the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
};

export default StockBal;