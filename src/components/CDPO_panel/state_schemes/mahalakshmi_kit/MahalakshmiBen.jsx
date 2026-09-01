import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Badge, Alert, Form, InputGroup, FormControl } from "react-bootstrap";
import { FaArrowLeft, FaTrashAlt, FaSyncAlt, FaSearch } from "react-icons/fa";
import "../../../../assets/css/supervisorleftnav.css";
import CDPOLeftNav from "../../CDPOLeftNav";
import CDPOHeader from "../../CDPOHeader";
import { useAuth } from "../../../all_login/AuthContext";

const MahalakshmiBen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { user, api } = useAuth();

  const [beneficiaryData, setBeneficiaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchBeneficiaries = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/cdpo-beneficiary/");
      let rawData = [];
      if (response.data && Array.isArray(response.data.data)) {
        rawData = response.data.data;
      } else if (Array.isArray(response.data)) {
        rawData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        rawData = response.data.results;
      }
      setBeneficiaryData(rawData);
    } catch (err) {
      setError("डेटा प्राप्त करने में विफल। कृपया पुनः प्रयास करें।");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(`क्या आप सच में लाभार्थी "${name}" को हटाना चाहते हैं?`);
    if (!confirmed) return;

    try {
      await api.delete("/cpdo-delete-beneficiary/", { data: { id } });
      alert("लाभार्थी सफलतापूर्वक हटा दिया गया है।");
      fetchBeneficiaries();
    } catch (err) {
      console.error("Delete error:", err);
      alert("हटाने में त्रुटि हुई। कृपया पुनः प्रयास करें।");
    }
  };

  const filteredData = beneficiaryData.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      (item.name && item.name.toLowerCase().includes(term)) ||
      (item.awc_name && item.awc_name.toLowerCase().includes(term)) ||
      (item.awc_code && String(item.awc_code).includes(term)) ||
      (item.mob && String(item.mob).includes(term)) ||
      (item.adhar && String(item.adhar).includes(term))
    );
  });

  const totalChildBorn = filteredData.reduce((sum, item) => sum + (parseInt(item.child_born) || 0), 0);
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusBadge = (status) => {
    if (status === "ToDelete") {
      return <Badge bg="danger" className="text-uppercase">{status}</Badge>;
    }
    return <Badge bg="secondary" className="text-uppercase">{status || "Active"}</Badge>;
  };

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
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="mb-0 fw-bold" style={{ color: "#1b4a8f" }}>
                हमारे लाभार्थी: महालक्ष्मी किट
              </h3>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={fetchBeneficiaries}
                disabled={loading}
                className="d-flex align-items-center"
              >
                {loading ? <Spinner animation="border" size="sm" className="me-2" /> : <FaSyncAlt className="me-2" />}
                रिफ्रेश
              </Button>
            </div>
          </div>

          <Alert variant="info" className="mb-3 small">
            <strong>नोट:</strong> नीचे दिए गए लॉग में हर लाभार्थी की जानकारी दिखाई गई है। किसी भी लाभार्थी को हटाने के लिए डिलीट बटन पर क्लिक करें।
          </Alert>

          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-3">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
                <div className="text-muted small fw-bold">
                  कुल लाभार्थी: <strong>{filteredData.length}</strong>
                </div>
                <div style={{ width: "280px" }}>
                  <InputGroup size="sm">
                    <InputGroup.Text className="bg-white border-end-0">
                      <FaSearch className="text-muted" />
                    </InputGroup.Text>
                    <FormControl
                      placeholder="खोजें..."
                      className="border-start-0 ps-0"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </InputGroup>
                </div>
              </div>
            </Card.Body>
          </Card>

          <div className="table-responsive shadow-sm rounded border bg-white">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2 text-muted">डेटा लोड हो रहा है...</p>
              </div>
            ) : error ? (
              <Alert variant="danger" className="m-3">
                <FaSyncAlt className="me-2" spin /> {error}
              </Alert>
            ) : filteredData.length === 0 ? (
              <div className="text-center py-5 text-muted">
                कोई लाभार्थी डेटा उपलब्ध नहीं है।
              </div>
            ) : (
              <Table bordered hover className="mb-0 align-middle text-center" style={{ fontSize: "13px" }}>
                <thead style={{ backgroundColor: "#e3f2fd" }}>
                  <tr className="fw-bold">
                    <th>क्रम संख्या</th>
                    <th>अनुरोध</th>
                    <th>नाम</th>
                    <th>जन्म तिथि</th>
                    <th>मोबाइल नंबर</th>
                    <th>आधार नंबर</th>
                    <th>आंगनवाड़ी केंद्र का नाम</th>
                    <th>आंगनवाड़ी केंद्र कोड</th>
                    <th>पता</th>
                    <th>क्रिया</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <tr key={item.id || `ben-${index}`} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa" }}>
                      <td>{startIndex + index + 1}</td>
                      <td>किट</td>
                      <td className="text-start fw-bold">{item.name || "-"}</td>
                      <td>{item.dob || item.kit_date || "-"}</td>
                      <td className="text-nowrap">{item.ben_mob || item.mob || "-"}</td>
                      <td className="text-nowrap">{item.adhar_num || item.adhar || "-"}</td>
                      <td>{item.awc_name || "-"}</td>
                      <td>{item.awc_code || "-"}</td>
                      <td className="text-start" style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.address || "-"}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1 align-items-center">
                          
                          <Button
                            variant="link"
                            className="text-danger p-0"
                            title="डिलीट करें"
                            onClick={() => handleDelete(item.id, item.name)}
                          >
                            <FaTrashAlt /> 
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>

          {!loading && !error && filteredData.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3 px-2 border-top pt-3">
              <span className="text-muted small">
                दिखा रहा है {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} की {filteredData.length} रिकॉर्ड
              </span>
              <div className="fw-bold" style={{ color: "#1b4a8f" }}>
                कुल बच्चों की संख्या: <span className="text-danger">{totalChildBorn}</span>
              </div>
              <div className="d-flex gap-2">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  ← पिछला
                </Button>
                <span className="align-self-center small fw-bold px-2">
                  पृष्ठ {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  अगला →
                </Button>
              </div>
            </div>
          )}
        </Container>

        <div style={{ height: "30px" }} />
      </div>
    </div>
  );
};

export default MahalakshmiBen;