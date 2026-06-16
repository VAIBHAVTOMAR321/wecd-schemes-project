import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button, Form, InputGroup, FormControl, Badge } from "react-bootstrap";
import { useAuth } from "../../../all_login/AuthContext";
import "../../../../assets/css/supervisorleftnav.css";
import "../../../../assets/css/cdpo.css";
import CDPOLeftNav from "../../CDPOLeftNav";
import CDPOHeader from "../../CDPOHeader";

const DemandAmritAnchalProject = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [demandData, setDemandData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editRemark, setEditRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

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
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/cdpo-am-demand/");
      setDemandData(response.data || []);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [api]);

  const handleActionClick = (id, status) => {
    setEditingId(id);
    setPendingAction(status);
    setEditRemark("");
  };

  const handleActionSubmit = async () => {
    if (!editRemark.trim()) {
      alert("Please enter a remark");
      return;
    }
    if (!pendingAction) {
      alert("Please select an action");
      return;
    }
    setSubmitting(true);
    try {
      await api.put("/cdpo-am-demand/", {
        id: editingId,
        remark_cdpo: editRemark.trim(),
        cdpo_status: pendingAction,
      });
      setEditingId(null);
      setPendingAction(null);
      setEditRemark("");
      fetchData();
    } catch (err) {
      console.error("Action failed:", err);
      alert("Action failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setPendingAction(null);
    setEditRemark("");
  };

  const filteredData = demandData.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.district || "").toLowerCase().includes(term) ||
      (item.project_name || "").toLowerCase().includes(term) ||
      (item.sector || "").toLowerCase().includes(term) ||
      (item.fin_yr || "").toLowerCase().includes(term) ||
      (item.qtr_dmd || "").toLowerCase().includes(term) ||
      String(item.id || "").toLowerCase().includes(term)
    );
  });

  const pendingData = filteredData.filter((item) => item.cdpo_status === "Pending");
  const approvedData = filteredData.filter((item) => (item.cdpo_status || "").toLowerCase() === "approve");

  const getStatusBadge = (status) => {
    if (status === "Approve") return <Badge bg="success">Approve</Badge>;
    if (status === "Pending") return <Badge bg="warning">Pending</Badge>;
    if (status === "Rejected") return <Badge bg="danger">Reject</Badge>;
    return <Badge bg="secondary">{status}</Badge>;
  };

  const renderDemandTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="12" className="text-center py-4">
            <Spinner animation="border" size="sm" /> Loading...
          </td>
        </tr>
      );
    }
    if (pendingData.length === 0) {
      return (
        <tr>
          <td colSpan="12" className="text-center py-4 text-muted">No data available in table</td>
        </tr>
      );
    }
    return pendingData.map((item, index) => (
      <tr key={item.id}>
        <td>{index + 1}</td>
        <td>{item.district}</td>
        <td>{item.project_name}</td>
        <td>{item.sector}</td>
        <td>{item.fin_yr}</td>
        <td>{item.qtr_dmd}</td>
        <td>{item.avl_month || "-"}</td>
        <td>{item.milk_bene || "0"}</td>
        <td>{item.avl_milk || "0"}</td>
        <td>{getStatusBadge(item.sec_status || item.cdpo_status)}</td>
        <td>
          {editingId === item.id ? (
            <div className="d-flex flex-column gap-1">
              <FormControl
                size="sm"
                placeholder="Enter remark"
                value={editRemark}
                onChange={(e) => setEditRemark(e.target.value)}
              />
              <div className="d-flex gap-1">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => handleActionSubmit(item.id)}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="secondary" onClick={handleCancel} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-1">
              {editingId === item.id && pendingAction && (
                <Badge bg={pendingAction === "Approve" ? "success" : "danger"}>
                  {pendingAction}
                </Badge>
              )}
              <div className="d-flex gap-1">
                <Button
                  size="sm"
                  variant="outline-success"
                  onClick={() => handleActionClick(item.id, "Approve")}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => handleActionClick(item.id, "Rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
        </td>
      </tr>
    ));
  };

  const renderApprovalTable = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="12" className="text-center py-4">
            <Spinner animation="border" size="sm" /> Loading...
          </td>
        </tr>
      );
    }
    if (approvedData.length === 0) {
      return (
        <tr>
          <td colSpan="12" className="text-center py-4 text-muted">No approved records found</td>
        </tr>
      );
    }
    return approvedData.map((item, index) => (
      <tr key={item.id}>
        <td>{index + 1}</td>
        <td>{item.district}</td>
        <td>{item.project_name}</td>
        <td>{item.sector}</td>
        <td>{item.fin_yr}</td>
        <td>{item.qtr_dmd}</td>
        <td>{item.avl_month || "-"}</td>
        <td>{item.milk_bene || "0"}</td>
        <td>{item.avl_milk || "0"}</td>
        <td>{getStatusBadge(item.cdpo_status)}</td>
        <td>{getStatusBadge(item.dir_status)}</td>
        <td>-</td>
      </tr>
    ));
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
            <h3 className="mb-4 fw-bold">
              मुख्यमंत्री आंचल आमृत योजना अवलोकन(डिमांड पैनल)
            </h3>
          </div>

          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body>
              <Row className="align-items-center g-3">
                <Col md={4} sm={6} xs={12}>
                  <h6 className="mb-0 fw-semibold">Almora/Bhaisiyachana</h6>
                </Col>
                <Col md={4} sm={6} xs={12}>
                  <span className="badge bg-warning text-dark fs-6 px-3 py-2">Demandfrom Supervisor(Pending)</span>
                </Col>
                <Col md={4} sm={12} xs={12}>
                  <InputGroup size="sm">
                    <FormControl
                      placeholder="Search: S.no, District, Project name, Sector name, Financial Year..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="primary">Search</Button>
                  </InputGroup>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {error && <div className="alert alert-danger">{error}</div>}

          <h5 className="mb-3 fw-bold">Demand Panel</h5>
          <Card className="mb-4 border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table striped bordered hover size="sm" className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>S.no</th>
                      <th>District</th>
                      <th>Project name</th>
                      <th>Sector name</th>
                      <th>Financial Year</th>
                      <th>Qtr Demand</th>
                      <th>Avl Month</th>
                      <th>Milk Bene</th>
                      <th>Avl Milk</th>
                      <th>Current Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>{renderDemandTable()}</tbody>
                </Table>
              </div>
            </Card.Body>
            <Card.Footer className="bg-white border-0 py-2">
              <small className="text-muted">Showing {pendingData.length} entries</small>
            </Card.Footer>
          </Card>

          <h5 className="mb-3 fw-bold">Approve List By CDPO</h5>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table striped bordered hover size="sm" className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>S.no</th>
                      <th>District</th>
                      <th>Project name</th>
                      <th>Sector name</th>
                      <th>Financial Year</th>
                      <th>Qtr Demand</th>
                      <th>Avl Month</th>
                      <th>Milk Bene</th>
                      <th>Avl Milk</th>
                      <th>CDPO Status</th>
                      <th>DPO Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>{renderApprovalTable()}</tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>
  );
};

export default DemandAmritAnchalProject;
