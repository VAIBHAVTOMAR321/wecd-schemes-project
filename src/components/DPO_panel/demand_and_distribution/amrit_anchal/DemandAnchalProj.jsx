import React, { useState, useEffect, useMemo, useRef } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Form, Pagination } from "react-bootstrap";
import { FaSyncAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "../../../../assets/css/supervisorleftnav.css";
import DPOLeftNav from "../../DPOLeftNav";
import DPOHeader from "../../DPOHeader";
import { useAuth } from "../../../all_login/AuthContext";


const DemandAnchalProj = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { user, api, uniqueId } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedQuarter, setSelectedQuarter] = useState("All");
  const [availableYears, setAvailableYears] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const tableRef = useRef(null);

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

  const quarterMapDisplayToApi = {
    "All Quarters": "All", // Special case for aggregation
    "First Quarter(Apr/May/June)": "Apr-May-June",
    "Second Quarter(July/Aug/Sept)": "Jul-Aug-Sep",
    "Third Quarter(Oct/Nov/Dec)": "Oct-Nov-Dec",
    "Fourth Quarter(Jan/Feb/March)": "Jan-Feb-Mar"
  };

  const quarterMapApiToDisplay = {
    "All": "All Quarters",
    "Apr-May-June": "First Quarter(Apr/May/June)",
    "Jul-Aug-Sep": "Second Quarter(July/Aug/Sept)",
    "Oct-Nov-Dec": "Third Quarter(Oct/Nov/Dec)",
    "Jan-Feb-Mar": "Fourth Quarter(Jan/Feb/March)"
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // New API endpoint for project-wise data
      const response = await api.get("https://mahadevaaya.com/wecdschemes/wecdschemes_backend/api/dpo/am-demand/project-wise/");
      let rawData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setData(rawData);

      const years = [...new Set(rawData.map(item => item.financial_year).filter(Boolean))].sort();
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
    if (api) fetchData();
  }, [api]);

  const filteredData = useMemo(() => {
    const filtered = data.filter((item) => {
      const matchesYear = !selectedYear || item.financial_year === selectedYear;
      const apiQuarterValue = quarterMapDisplayToApi[selectedQuarter] || selectedQuarter;
      const matchesQuarter = apiQuarterValue === "All" || item.quarter === apiQuarterValue;
      return matchesYear && matchesQuarter;
    });

    if (selectedQuarter !== "All Quarters") {
      // If a specific quarter is selected, return filtered data as is
      return filtered;
    }

    // Aggregate data by project when "All Quarters" is selected
    const aggregated = filtered.reduce((acc, curr) => {
      const key = `${curr.district}-${curr.project}`; // Group by district and project
      if (!acc[key]) {
        acc[key] = {
          ...curr,
          quarter: "Overall", // Display "Overall" for aggregated quarters
          beneficiary: 0 // Initialize beneficiary count for aggregation
        };
      }
      acc[key].beneficiary = (parseInt(acc[key].beneficiary) || 0) + (parseInt(curr.beneficiary) || 0);
      return acc;
    }, {});

    return Object.values(aggregated);
  }, [data, selectedYear, selectedQuarter]);

  const totalBeneficiaries = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + (parseInt(item.beneficiary) || 0), 0);
  }, [filteredData]);

  const renderActiveFilterText = () => {
    const year = selectedYear || "____";
    const qtr = selectedQuarter === "All Quarters" ? "All" : (selectedQuarter || "____");
    return `For the year : ${year} and Quarter : ${qtr}`;
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

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
          <div className="main-heading text-center mb-4">
            <h3 className="fw-bold" style={{ color: "#343a40" }}>
              District Wise Stock Demand : Anchal Amrit Yojana
            </h3>
          </div>

          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-3">
              <Row className="g-3 align-items-end">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">Financial Year</Form.Label>
                    <Form.Select 
                      value={selectedYear} 
                      onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
                      size="sm"
                    >
                      <option value="">Select Financial Year</option>
                      {availableYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">Quarter</Form.Label>
                    <Form.Select 
                      value={selectedQuarter} 
                      onChange={(e) => { setSelectedQuarter(e.target.value); setCurrentPage(1); }}
                      size="sm"
                    >
                      <option value="">Select Any One</option>
                      <option value="All Quarters">All Quarters</option>
                      <option value="First Quarter(Apr/May/June)">First Quarter(Apr/May/June)</option>
                      <option value="Second Quarter(July/Aug/Sept)">Second Quarter(July/Aug/Sept)</option>
                      <option value="Third Quarter(Oct/Nov/Dec)">Third Quarter(Oct/Nov/Dec)</option>
                      <option value="Fourth Quarter(Jan/Feb/March)">Fourth Quarter(Jan/Feb/March)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Button variant="primary" className="w-100 fw-bold shadow-sm" size="sm" onClick={fetchData} disabled={loading}>
                    {loading ? <Spinner animation="border" size="sm" /> : <><FaSyncAlt className="me-2" /> View Demand</>}
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <div className="mb-3">
            <h5 className="fw-bold text-center" style={{ color: "#dc3545" }}>
              {renderActiveFilterText()}
            </h5>
          </div>

          <div className="table-responsive shadow-sm rounded border bg-white">
            <Table bordered hover className="align-middle text-center mb-0" style={{ fontSize: '13px' }} ref={tableRef}>
              <thead className="table-light">
                <tr className="fw-bold">
                  <th>S.no</th>
                  <th>District</th> 
                  <th>Project</th>
                  <th>Quarter</th>
                  <th>Beneficiary</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" className="py-4 text-center"><Spinner animation="border" variant="primary" /></td></tr>
                ) : paginatedData.length > 0 ? (
                  <>
                    {paginatedData.map((item, index) => (
                      <tr key={index}>
                        <td>{startIndex + index + 1}</td>
                        <td>{item.district}</td>
                        <td>{item.project}</td>
                        <td>{item.quarter === "Overall" ? "All" : (quarterMapApiToDisplay[item.quarter] || item.quarter)}</td>
                        <td className="fw-bold">{item.beneficiary}</td>
                      </tr>
                    ))} 
                    <tr className="table-secondary fw-bold">
                      <td colSpan="4" className="text-end px-4">Total</td>
                      <td>{totalBeneficiaries.toLocaleString()}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" className="py-5 text-muted text-center italic">
                      कोई डेटा उपलब्ध नहीं है।
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {!loading && filteredData.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3 px-2 border-top pt-3">
              <span className="text-muted small">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} entries
              </span>
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPage === 1} 
                  onClick={() => { setCurrentPage(prev => prev - 1); tableRef.current.scrollIntoView({ behavior: 'smooth' }); }}
                >
                  <FaChevronLeft size={10} /> Previous
                </Button>
                <Pagination size="sm" className="mb-0">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Pagination.Item
                      key={page}
                      active={currentPage === page}
                      onClick={() => { setCurrentPage(page); tableRef.current.scrollIntoView({ behavior: 'smooth' }); }}
                    >
                      {page}
                    </Pagination.Item>
                  ))}
                </Pagination>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  disabled={currentPage >= totalPages} 
                  onClick={() => { setCurrentPage(prev => prev + 1); tableRef.current.scrollIntoView({ behavior: 'smooth' }); }}
                >
                  Next <FaChevronRight size={10} />
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
};

export default DemandAnchalProj;
