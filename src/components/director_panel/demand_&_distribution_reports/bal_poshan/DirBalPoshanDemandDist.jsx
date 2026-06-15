import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";

// import "../../../assets/css/supervisorleftnav.css";

import DirectorLeftNav from "../../DirectorLeftNav";
import DirectorHeader from "../../DirectorHeader";
import { useAuth } from "../../../all_login/AuthContext";


const DIRECTOR_DASHBOARD_API = "director/dashboard/";

const DirBalPoshanDemandDist = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  const { api, isReady } = useAuth();
  const [districtCount, setDistrictCount] = useState(null);
  const [projectCount, setProjectCount] = useState(null);
  const [sectorCount, setSectorCount] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(false);



  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };



  const getDistributionCount = (financialYear) => {
    if (loading) return "Loading...";

    const data = distributionData?.find((item) => item.financial_year === financialYear);
    return data?.distributed_mahalaxmi_kits ?? "No data available";
  };



  return (
    <div className="dashboard-container">
      <DirectorLeftNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isTablet={isTablet}
      />
      <div className="main-content-dash">
        <DirectorHeader toggleSidebar={toggleSidebar} />

        <Container fluid className="dashboard-box mt-3">
       Mahila poshan demand distribution 

        </Container>
       

        
      </div>
    </div>
  );
};

export default DirBalPoshanDemandDist;