import React, { useState, useEffect, useMemo } from "react";
import { Container, Row, Col, Spinner, Table, Badge, Form } from "react-bootstrap";
 
import "../../../../assets/css/supervisorleftnav.css";
import CDPOLeftNav from "../../CDPOLeftNav";
import CDPOHeader from "../../CDPOHeader";
import { useAuth } from "../../../all_login/AuthContext";


const StockMahalakshmi = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [distributionData, setDistributionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedQuarter, setSelectedQuarter] = useState("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/cdpo-distributed-kits-report/");
        if (response.data) {
          setDistributionData(response.data);
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

  // Get unique financial years for the filter dropdown
  const financialYears = [...new Set(distributionData.map(item => item.financial_year))].sort();
  // Get unique quarters for the filter dropdown
  const quarters = [...new Set(distributionData.map(item => item.quarter))].sort();

  // Process data to aggregate by unique sector and handle display logic for filters
  const processedData = useMemo(() => {
    const filtered = distributionData.filter(item => {
      const yearMatch = selectedYear === "All" || item.financial_year === selectedYear;
      const quarterMatch = selectedQuarter === "All" || item.quarter === selectedQuarter;
      return yearMatch && quarterMatch;
    });

    const aggregated = filtered.reduce((acc, curr) => {
      const key = `${curr.district}-${curr.project_name}-${curr.sector}`;
      if (!acc[key]) {
        acc[key] = {
          ...curr,
          distributed_kits: 0,
          financial_year: selectedYear === "All" ? "Overall" : curr.financial_year,
          quarter: selectedQuarter === "All" ? "Overall" : curr.quarter
        };
      }
      acc[key].distributed_kits += Number(curr.distributed_kits || 0);
      return acc;
    }, {});

    return Object.values(aggregated);
  }, [distributionData, selectedYear, selectedQuarter]);

  // Data Analyst Summary Logic
  const analysis = useMemo(() => {
    if (processedData.length === 0) return { total: 0, topSector: "N/A" };
    const total = processedData.reduce((sum, item) => sum + (Number(item.distributed_kits) || 0), 0);
    // Finding the sector with the highest volume
    const sorted = [...processedData].sort((a, b) => (Number(b.distributed_kits) || 0) - (Number(a.distributed_kits) || 0));
    return { total, topSector: sorted[0]?.sector || "N/A" };
  }, [processedData]);

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

        <Container fluid className="dashboard-box mt-3 p-4">
          <header className="mb-4">
            <h3 className="fw-bold text-primary mb-1">
              Sector Wise Distribution - Mahalakshmi Kit Yojana
            </h3>
            <p className="text-muted mb-0 fs-6">
              <strong>Active Filter Criteria:</strong> Financial Year {selectedYear === "All" ? "All Financial Years" : selectedYear}, Quarter {selectedQuarter === "All" ? "All Quarters" : selectedQuarter}
            </p>
          </header>

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
              <p className="mt-2">Loading distribution records...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : distributionData.length === 0 ? (
            <div className="text-center py-5 text-muted">No distribution records found.</div>
          ) : (
            <div className="table-responsive shadow-sm rounded border bg-white">
              <Table hover bordered className="align-middle text-center mb-0" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th className="bg-primary text-white">S.No</th>
                    <th className="bg-primary text-white">Financial Year</th>
                    <th className="bg-primary text-white">District</th>
                    <th className="bg-primary text-white">Project Name</th>
                    <th className="bg-primary text-white">Sector</th>
                    <th className="bg-primary text-white">Quarter</th>
                    <th className="bg-primary text-white">Distributed Kits</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.length > 0 ? (
                    processedData.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.financial_year}</td>
                        <td>{item.district}</td>
                        <td>{item.project_name}</td>
                        <td>{item.sector}</td>
                        <td><Badge bg="info">{item.quarter}</Badge></td>
                        <td>{item.distributed_kits}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">No records found for the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}

          {!loading && processedData.length > 0 && (
            <div className="mt-4 p-3 rounded shadow-sm border" style={{ backgroundColor: "#f8f9fa", borderLeft: "5px solid #0d6efd" }}>
              <h5 className="fw-bold text-dark border-bottom pb-2 mb-3">Distribution Summary</h5>
              <p className="mb-2 fs-6">The total kit distribution for this period is <strong className="text-primary">{analysis.total}</strong>.</p>
              <p className="mb-0 fs-6">The specific sector that received the highest volume is <strong className="text-success">{analysis.topSector}</strong>.</p>
            </div>
          )}
        </Container>

        
      </div>
    </div>
  );
};

export default StockMahalakshmi;