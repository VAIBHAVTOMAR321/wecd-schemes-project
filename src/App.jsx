import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';


import Home from './components/pages/Home';
import { AuthProvider, useAuth } from './components/all_login/AuthContext';
import SectorDashBoard from "./components/sector_panel/SectorDashBoard";
import NavBar from './components/nav_bar/NavBar';
import Login from "./components/all_login/Login";
import SectorProfile from "./components/sector_panel/SectorProfile";
import OurAwc from "./components/sector_panel/OurAwc";
import MahalakshmiKit from "./components/sector_panel/Stock_manager_distribution/MahalakshmiKit";
import DemandanchalAamrit from "./components/sector_panel/demand/DemandanchalAamrit";
import DemandPoshanFinal from "./components/sector_panel/demand/DemandPoshanFinal";
import DemandBalPoshan from "./components/sector_panel/demand/DemandBalPoshan";
import DistributionMahilaPoshFinal from "./components/sector_panel/Stock_manager_distribution/DistributionMahilaPoshFinal";
import DistributionBalPoshan from "./components/sector_panel/Stock_manager_distribution/DistributionBalPoshan";
import DPODashboard from "./components/DPO_panel/DPODashboard";

import CDPODashboard from "./components/CDPO_panel/CDPODashboard";
import DirectorDashboard from "./components/director_panel/DirectorDashboard";
import Footer from "./components/footer/Footer";
import CDPOProfile from "./components/CDPO_panel/CDPOProfile";
import DemandMahilaPoshanProject from "./components/CDPO_panel/state_schemes/mahila_poshan/DemandMahilaPoshanProject";
import Stockmahila from "./components/CDPO_panel/state_schemes/mahila_poshan/Stockmahila";
import DemandBalPoshanProject from "./components/CDPO_panel/state_schemes/bal_poshan/DemandBalPoshanProject";
import StockBal from "./components/CDPO_panel/state_schemes/bal_poshan/StockBal";
import DemandAmritAnchalProject from "./components/CDPO_panel/state_schemes/anchal_amrit/DemandAmritAnchalProject";
import StockAnchal from "./components/CDPO_panel/state_schemes/anchal_amrit/StockAnchal";
import MahalakshmiBen from "./components/CDPO_panel/state_schemes/mahalakshmi_kit/MahalakshmiBen";
import MahalaxmiYear from "./components/CDPO_panel/state_schemes/mahalakshmi_kit/MahalaxmiYear";
import OurBenReq from "./components/CDPO_panel/state_schemes/mahalakshmi_kit/OurBenReq";
import StockMahalakshmi from "./components/CDPO_panel/state_schemes/mahalakshmi_kit/StockMahalakshmi";
import DemandMahilaPoshanDistirct from "./components/DPO_panel/demand_rqu/DemandMahilaPoshanDistirct";
import DemandBalPoshanDistrict from "./components/DPO_panel/demand_rqu/DemandBalPoshanDistrict";
import DemandAmritAnchalDistrict from "./components/DPO_panel/demand_rqu/DemandAmritAnchalDistrict";
import DemandMahalakshmi from "./components/DPO_panel/demand_rqu/DemandMahalakshmi";
import OurAwcProject from "./components/CDPO_panel/OurAwcProject";
import OurDpo from "./components/director_panel/our_staff/OurDpo";
import OURSector from "./components/CDPO_panel/OURSector";
import OurCdpoProject from "./components/DPO_panel/OurCdpoProject";
import OurSectors from "./components/DPO_panel/OurSectors";
import DemandkitProject from "./components/DPO_panel/demand_and_distribution/mahalaxmi_kit/DemandkitProject";
import DemandAnchalProj from "./components/DPO_panel/demand_and_distribution/amrit_anchal/DemandAnchalProj";
import DemandAnchalSec from "./components/DPO_panel/demand_and_distribution/amrit_anchal/DemandAnchalSec";
import MahilaPoshanDemandSector from "./components/DPO_panel/demand_and_distribution/mahila_poshan/MahilaPoshanDemandSector";
import MahilaPoshanDemandProj from "./components/DPO_panel/demand_and_distribution/mahila_poshan/MahilaPoshanDemandProj";
import BalPosDemandSector from "./components/DPO_panel/demand_and_distribution/bal_poshan/BalPosDemandSector";
import BalPosDemandProj from "./components/DPO_panel/demand_and_distribution/bal_poshan/BalPosDemandProj";
import DirMahilaPoshanDemandSector from "./components/director_panel/demand_&_distribution_reports/mahila_poshan/DirMahilaPoshanDemandSector";
import DirMahilaPoshanDemandDist from "./components/director_panel/demand_&_distribution_reports/mahila_poshan/DirMahilaPoshanDemandDist";
import DirMahilaPoshanDemandProj from "./components/director_panel/demand_&_distribution_reports/mahila_poshan/DirMahilaPoshanDemandProj";
import DirBalPoshanDemandSector from "./components/director_panel/demand_&_distribution_reports/bal_poshan/DirBalPoshanDemandSector";
import DirBalPoshanDemandProj from "./components/director_panel/demand_&_distribution_reports/bal_poshan/DirBalPoshanDemandProj";
import OurSector from "./components/director_panel/our_staff/DirectorOurSector";
import OurCdpo from "./components/director_panel/our_staff/OurCdpo";
import DirectorOurSector from "./components/director_panel/our_staff/DirectorOurSector";
import AWCS from "./components/director_panel/our_staff/AWCS";
import Mahalaxmi from "./components/director_panel/Mahalaxmi";
import DirBalPoshanDemandDist from "./components/director_panel/demand_&_distribution_reports/bal_poshan/DirBalPoshanDemandDist";


//  Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isReady } = useAuth();
  const location = useLocation();

  // While checking auth state, show nothing (prevents flash of wrong content)
  if (!isReady) {
    return null;
  }

  // If not authenticated, redirect to login (with return URL)
  if (!isAuthenticated) {
    return <Navigate to="/Login" state={{ from: location }} replace />;
  }

  return children;
};

function AppContent() {
  const location = useLocation();

  const hideNavbarRoutes = ["/SectorDashBoard", "/DemandAmritAnchalDistrict", "/StockAnchal", "/DemandAmritAnchalProject", "/MahalakshmiBen",
     "/SectorProfile", "/StockBal", "/OurDpo", "/OURSector",
      "/OurAwc", "/MahalakshmiKit", "/OurSector",
      "/DemandMahilaPoshanProject",
       "/MahalakshmiBen",
       "/DemandanchalAamrit", "/DirBalPoshanDemandDist",
       "/DemandPoshanFinal", "/DemandkitProject", "/DemandAnchalSec", "/DemandAnchalProj",
       "/MahalaxmiYear",
        "/DemandBalPoshan", "/OurAwcProject", "/OurCdpo", "/DirectorOurSector",
         "/DistributionMahilaPoshFinal", "/OurCdpoProject", "/OurSectors",
           "/DemandBalPoshanProject", "/OurBenReq", "/StockMahalakshmi", "/Mahalaxmi",
            "/Stockmahila", "/DistributionBalPoshan","/AWCS",
             "/DPODashboard", "/DemandMahalakshmi", "/CDPODashboard", "/DirectorDashboard", "/CDPOProfile",      "/DemandMahilaPoshanDistirct", "/DemandBalPoshanDistrict", "/MahilaPoshanDemandSector", "/MahilaPoshanDemandProj", "/BalPosDemandSector", "/BalPosDemandProj", "/DirMahilaPoshanDemandSector", "/DirMahilaPoshanDemandDist", "/DirMahilaPoshanDemandProj", "/DirBalPoshanDemandSector", "/DirBalPoshanDemandProj"];
  const hideFooterRoutes = ["/SectorDashBoard", "/DemandAmritAnchalDistrict", "/DemandAnchalProj",
    "/StockBal", "/OurBenReq", "/StockMahalakshmi", "/OurAwcProject", "/OurSector",
       "/StockAnchal", "/OurCdpoProject", "/OurSectors", "/OurCdpo", "/DirectorOurSector",
      "/DemandAmritAnchalProject", "/OurDpo", "/OURSector","/AWCS",
       "/MahalaxmiYear", "/DemandkitProject", "/DemandAnchalSec", "/Mahalaxmi", "/DirBalPoshanDemandDist",
       "/Stockmahila", "/SectorProfile", "/DemandBalPoshanProject","/DemandMahilaPoshanProject", "/OurAwc", "/MahalakshmiKit", "/DemandanchalAamrit", "/DemandPoshanFinal", "/DemandBalPoshan", "/DistributionMahilaPoshFinal", "/DistributionBalPoshan", "/DPODashboard", "/DemandMahalakshmi", "/CDPODashboard", "/DirectorDashboard", "/CDPOProfile", "/DemandMahilaPoshanDistirct", "/DemandBalPoshanDistrict", "/MahilaPoshanDemandSector", "/MahilaPoshanDemandProj", "/BalPosDemandSector", "/BalPosDemandProj", "/DirMahilaPoshanDemandSector", "/DirMahilaPoshanDemandDist", "/DirMahilaPoshanDemandProj", "/DirBalPoshanDemandSector", "/DirBalPoshanDemandProj"];
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <NavBar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/SectorDashBoard" element={<SectorDashBoard />} />
        <Route path="/CDPOProfile" element={<CDPOProfile />} />
        <Route path="/DemandBalPoshanProject" element={<DemandBalPoshanProject />} />
        <Route path="/StockBal" element={<StockBal />} />
     
        <Route path="/DemandMahilaPoshanProject" element={<DemandMahilaPoshanProject />} />
        <Route path="/Stockmahila" element={<Stockmahila />} />
         <Route path="/MahalakshmiBen" element={
          <ProtectedRoute>
            <MahalakshmiBen />
          </ProtectedRoute>
        } />
         <Route path="/DirectorOurSector" element={
          <ProtectedRoute>
            <DirectorOurSector />
          </ProtectedRoute>
        } />
          <Route path="/OurCdpo" element={
          <ProtectedRoute>
            <OurCdpo />
          </ProtectedRoute>
        } />
        
         <Route path="/OURSector" element={
          <ProtectedRoute>
            <OURSector />
          </ProtectedRoute>
        } />
          <Route path="/Mahalaxmi" element={
          <ProtectedRoute>
            <Mahalaxmi />
          </ProtectedRoute>
        } />
        <Route path="/OurSector" element={
          <ProtectedRoute>
            <OurSector />
          </ProtectedRoute>
        } />
         <Route path="/OurDpo" element={
          <ProtectedRoute>
            <OurDpo />
          </ProtectedRoute>
        } />
         <Route path="/StockMahalakshmi" element={
          <ProtectedRoute>
            <StockMahalakshmi />
          </ProtectedRoute>
        } />
          <Route path="/OurBenReq" element={
          <ProtectedRoute>
            <OurBenReq />
          </ProtectedRoute>
        } />

         <Route path="/MahalaxmiYear" element={
          <ProtectedRoute>
            <MahalaxmiYear />
          </ProtectedRoute>
        } />
          <Route path="/DemandkitProject" element={
          <ProtectedRoute>
            <DemandkitProject />
          </ProtectedRoute>
        } />

          <Route path="/OurAwcProject" element={
          <ProtectedRoute>
            <OurAwcProject />
          </ProtectedRoute>
        } />
         <Route path="/DemandAnchalProj" element={
          <ProtectedRoute>
            <DemandAnchalProj />
          </ProtectedRoute>
        } />
         <Route path="/DemandAnchalSec" element={
           <ProtectedRoute>
             <DemandAnchalSec />
           </ProtectedRoute>
         } />
         <Route path="/BalPosDemandSector" element={
           <ProtectedRoute>
             <BalPosDemandSector />
           </ProtectedRoute>
         } />
         <Route path="/BalPosDemandProj" element={
           <ProtectedRoute>
             <BalPosDemandProj />
           </ProtectedRoute>
         } />
         <Route path="/MahilaPoshanDemandSector" element={
           <ProtectedRoute>
             <MahilaPoshanDemandSector />
           </ProtectedRoute>
         } />
         <Route path="/MahilaPoshanDemandProj" element={
           <ProtectedRoute>
             <MahilaPoshanDemandProj />
           </ProtectedRoute>
         } />
          <Route path="/DirMahilaPoshanDemandSector" element={
            <ProtectedRoute>
              <DirMahilaPoshanDemandSector />
            </ProtectedRoute>
          } />
          <Route path="/DirMahilaPoshanDemandDist" element={
            <ProtectedRoute>
              <DirMahilaPoshanDemandDist />
            </ProtectedRoute>
          } />
          <Route path="/DirMahilaPoshanDemandProj" element={
            <ProtectedRoute>
              <DirMahilaPoshanDemandProj />
            </ProtectedRoute>
          } />
          <Route path="/DirBalPoshanDemandSector" element={
            <ProtectedRoute>
              <DirBalPoshanDemandSector />
            </ProtectedRoute>
          } />
          <Route path="/DirBalPoshanDemandProj" element={
            <ProtectedRoute>
              <DirBalPoshanDemandProj />
            </ProtectedRoute>
          } />
          <Route path="/DemandAmritAnchalProject" element={
          <ProtectedRoute>
            <DemandAmritAnchalProject />
          </ProtectedRoute>
        } />
         <Route path="/StockAnchal" element={
          <ProtectedRoute>
            <StockAnchal />
          </ProtectedRoute>
        } />
         <Route path="/OurCdpoProject" element={
           <ProtectedRoute>
             <OurCdpoProject />
           </ProtectedRoute>
         } />
         <Route path="/OurSectors" element={
           <ProtectedRoute>
             <OurSectors />
           </ProtectedRoute>
         } />
        
        {/* <Route path="/SectorDashBoard" element={
          <ProtectedRoute>
            <SectorDashBoard />
          </ProtectedRoute>
        } /> */}
        
        <Route path="/SectorProfile" element={
          <ProtectedRoute>
            <SectorProfile />
          </ProtectedRoute>
        } />
        <Route path="/OurAwc" element={
          <ProtectedRoute>
            <OurAwc />
          </ProtectedRoute>
        } />
        <Route path="/AWCS" element={
          <ProtectedRoute>
            <AWCS />
          </ProtectedRoute>
        } />
        <Route path="/MahalakshmiKit" element={
          <ProtectedRoute>
            <MahalakshmiKit />
          </ProtectedRoute>
        } />
        <Route path="/DemandanchalAamrit" element={
          <ProtectedRoute>
            <DemandanchalAamrit />
          </ProtectedRoute>
        } />
        <Route path="/DemandPoshanFinal" element={
          <ProtectedRoute>
            <DemandPoshanFinal />
          </ProtectedRoute>
        } />
        <Route path="/DemandBalPoshan" element={
          <ProtectedRoute>
            <DemandBalPoshan />
          </ProtectedRoute>
        } />
        <Route path="/DistributionMahilaPoshFinal" element={
          <ProtectedRoute>
            <DistributionMahilaPoshFinal />
          </ProtectedRoute>
        } />
           <Route path="/DirBalPoshanDemandDist" element={
          <ProtectedRoute>
            <DirBalPoshanDemandDist />
          </ProtectedRoute>
        } />
        <Route path="/DistributionBalPoshan" element={
          <ProtectedRoute>
            <DistributionBalPoshan />
          </ProtectedRoute>
        } />
         <Route path="/DemandAmritAnchalDistrict" element={
          <ProtectedRoute>
            <DemandAmritAnchalDistrict />
          </ProtectedRoute>
        } />
        
        <Route path="/DPODashboard" element={<DPODashboard />} />
        <Route path="/DemandMahalakshmi" element={<DemandMahalakshmi />} />
        <Route path="/DemandMahilaPoshanDistirct" element={<DemandMahilaPoshanDistirct />} />
        <Route path="/DemandBalPoshanDistrict" element={<DemandBalPoshanDistrict />} />
        <Route path="/CDPODashboard" element={<CDPODashboard />} />
        <Route path="/DirectorDashboard" element={<DirectorDashboard />} />
        <Route path="/Login" element={<Login />} />
      </Routes>
      {!shouldHideFooter && <Footer />}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router basename="/wecdschemes">
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
