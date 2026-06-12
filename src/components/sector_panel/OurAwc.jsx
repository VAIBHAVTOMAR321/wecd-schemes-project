import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner, Table, Button } from "react-bootstrap";
import { useAuth } from "../all_login/AuthContext";
import "../../assets/css/supervisorleftnav.css";
import SectorHeader from "./SectorHeader";
import SectorLeftNav from "./SectorLeftNav";

const OurAwc = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const awcRows = [];
  
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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };



  return (
    <div className="dashboard-container">
      <SectorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <SectorHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3 p-3">
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3 d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
              <h3 className="fw-bold mb-0" style={{ color: "#60a5fa" }}>आंगनवाड़ी केंद्र</h3>
              <p className="mb-0 small fw-bold text-muted text-sm-end">सेक्टर के केंद्र : Almora</p>
            </Card.Header>

            <Card.Body className="p-0">
              <div className="table-responsive">
                <Table bordered hover className="mb-0 text-center align-middle" style={{ tableLayout: "fixed", fontSize: "11px" }}>
                  <thead className="bg-light text-uppercase">
                    <tr>
                      <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>क्रम संख्या</th>
                      <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>आंगनवाड़ी केंद्र कोड</th>
                      <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>आंगनवाड़ी</th>
                      <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>आंगनवाड़ी प्रकार</th>
                      <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>अनुदान</th>
                      <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>सेक्टर का नाम</th>
                      <th className="py-2" style={{ backgroundColor: "#e0f2fe" }}>प्रोजेक्ट का नाम</th>
                      <th className="py-2" style={{ backgroundColor: "#eef2ff" }}>जिला</th>
                    </tr>
                  </thead>
                  <tbody>
                    {awcRows.length > 0 ? (
                      awcRows.map((row, index) => (
                        <tr key={index}>
                          <td className="py-2">{index + 1}</td>
                          <td>{row.awcCode}</td>
                          <td>{row.awcName}</td>
                          <td>{row.awcType}</td>
                          <td>{row.grant}</td>
                          <td>{row.sectorName}</td>
                          <td>{row.projectName}</td>
                          <td>{row.district}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-4 text-muted small">No records found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Container>

        
      </div>
    </div>
  );
};

export default OurAwc;