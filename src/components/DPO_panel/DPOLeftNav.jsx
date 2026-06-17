import React, { useState } from "react";
import { Nav, Offcanvas, Collapse } from "react-bootstrap";
import {
  FaTachometerAlt,
  FaSignOutAlt,
  FaChevronDown,
  FaChevronRight,
  FaImages,
  FaUsers,
  FaBook,
  FaBuilding,
  FaImage,
  FaTools,
  FaComments,
  FaCube,
  FaProjectDiagram,
  FaServer,
  FaUserCircle,
  FaCalendarAlt,
  FaPlusSquare,
  FaEdit,
  FaMusic,
  FaGlassCheers,
  FaIndustry,
  FaQuestionCircle,
  FaTrophy,
  FaBriefcase,
  FaGraduationCap,
  FaTasks,
  FaClock
} from "react-icons/fa";
import axios from "axios";

import "../../assets/css/supervisorleftnav.css";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaInfoCircle,
  FaBullseye,
  
} from "react-icons/fa";

import UkLogo from "../../assets/images/uk_logo_2.jpeg"
import Womenlogo from "../../assets/images/women_logo.jpeg";

import { useAuth } from "../all_login/AuthContext";


const DPOLeftNav = ({ sidebarOpen, setSidebarOpen, isMobile, isTablet, onNavClick }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = user ? user.role : null;
  const [openSubmenu, setOpenSubmenu] = useState([]);
  const toggleSubmenu = (index) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
    }
    setOpenSubmenu((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Helper to check if a menu item or any of its submenus are active
  const isItemActive = (item) => {
    if (item.path && item.path !== "#" && location.pathname === item.path) return true;
    if (item.submenu) {
      return item.submenu.some(sub => {
        if (sub.path && sub.path !== "#" && location.pathname === sub.path) return true;
        if (sub.submenu) return sub.submenu.some(nested => nested.path === location.pathname);
        return false;
      });
    }
    return false;
  };

  const handleItemClick = (e, path, isActive) => {
    if (!sidebarOpen) {
      setSidebarOpen(true);
    }
    if (onNavClick) {
      e.preventDefault();
      onNavClick(path);
    }
  };

 const menuItems = [
      {
        icon: <FaTachometerAlt />,
        label: "DashBoard",
        path: "/DPODashboard",
      },

      //  {
      //   icon: <FaTachometerAlt />,
      //   label: "Our Projects  ",
      //   path: "/OurCdpoProject",
      // },
      {
        icon: <FaTachometerAlt />,
        label: "Our Sectors  ",
        path: "/OurSectors",
      },
      
     
    
     
  {
    icon: <FaUsers />,
    label: "Demand Request",
    submenu: [
      {
        label: "Mahalakshmi Kit",
        path: "/DemandMahalakshmi",
        icon: <FaPlusSquare />,
      },
       {
        label: "Mahila Poshan",
        path: "/DemandMahilaPoshanDistirct",
        icon: <FaPlusSquare />,
      },
       {
         label: "Bal Poshan",
         path: "/DemandBalPoshanDistrict",
         icon: <FaPlusSquare />,
       },
      {
        label: "Anchal Amrit",
        path: "/DemandAmritAnchalDistrict",
        icon: <FaPlusSquare />,
      },
    ],
  },

   {
    icon: <FaUsers />,
    label: "Demand & Distribution",
    submenu: [
      {
        label: "Mahila Poshan",
        path: "#",
        icon: <FaPlusSquare />,
        submenu: [
          {
            label: "Project Wise",
            path: "/MahilaPoshanDemandProj",
          },
          {
            label: "Sector Wise",
            path: "/MahilaPoshanDemandSector",
          },
        ],
      },
        {
          label: "Bal Poshan",
          path: "#",
          icon: <FaPlusSquare />,
          submenu: [
          {
            label: "Project Wise",
            path: "/BalPosDemandProj",
          },
          {
            label: "Sector Wise",
            path: "/BalPosDemandSector",
          },
           
          ],
        },
       {
        label: "Amrit Anchal",
        path: "#",
        icon: <FaPlusSquare />,
        submenu: [
          {
            label: "Project Wise",
            path: "/DemandAnchalProj",
          },
          {
            label: "Sector Wise",
            path: "/DemandAnchalSec",
          },
        ],
      },
      {
        label: "Mahalaxmi Kit",
        path: "#",
        icon: <FaPlusSquare />,
        submenu: [
          {
            label: "Project Wise",
            path: "/DemandkitProject",
          },
         
        ],
      },
    ],
  },

     
      
       
      
     ];

  //  Auto-close sidebar when switching to mobile or tablet

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={`user-left-nav ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        onClick={() => !sidebarOpen && setSidebarOpen(true)}
      >
            <div className="sidebar-header">
             {sidebarOpen ? (
               <div className="logo-container">
                 <img
                   src={UkLogo}
                   alt="UK Logo"
                   className="sidebar-uk-logo"
                 />
           
                 <img
                   src={Womenlogo}
                   alt="Women Logo"
                   className="sidebar-women-logo"
                 />
               </div>
             ) : (
               <div className="logo-container logo-collapsed">
                 <img
                   src={UkLogo}
                   alt="UK Logo"
                   className="sidebar-uk-logo"
                 />
               </div>
              
             )}
              
           </div>

        <Nav className="sidebar-nav flex-column">
          
         {menuItems
  .filter(item =>
    item.allowedRoles ? item.allowedRoles.includes(userRole) : true
  )
  .map((item, index) => (
    <div key={index} className={`nav-item-wrapper ${isItemActive(item) ? "active-parent" : ""}`}>
      {/* If submenu exists */}
      {item.submenu ? (
        <Nav.Link
          className={`nav-item ${isItemActive(item) ? "active" : ""}`}
          onClick={() => toggleSubmenu(index)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-text">{item.label}</span>
          <span className="submenu-arrow">
            {openSubmenu.includes(index) ? <FaChevronDown /> : <FaChevronRight />}
          </span>
        </Nav.Link>
      ) : (
         <Link
           to={item.path}
           className={`nav-item nav-link ${isItemActive(item) ? "active" : ""}`}
           onClick={(e) => handleItemClick(e, item.path, isItemActive(item))}
         >
           <span className="nav-icon">{item.icon}</span>
           <span className="nav-text">{item.label}</span>
         </Link>
      )}

      {/* Submenu */}
       {sidebarOpen && item.submenu && item.submenu.length > 0 && (
         <Collapse in={openSubmenu.includes(index)}>
           <div className="submenu-container-user">
             {item.submenu.map((subItem, subIndex) => {
               const subItemId = `${index}-${subIndex}`;
               return (
                 <div key={subIndex}>
                   {subItem.submenu ? (
                      <Nav.Link
                        className="submenu-item-user nav-link"
                        onClick={() => toggleSubmenu(subItemId)}
                      >
                        <span className="submenu-icon">{subItem.icon}</span>
                        <span className="nav-text br-text-sub">{subItem.label}</span>
                        <span className="submenu-arrow">
                          {openSubmenu.includes(subItemId) ? <FaChevronDown /> : <FaChevronRight />}
                        </span>
                      </Nav.Link>
                    ) : (
                      <Link
                        to={subItem.path}
                        className={`submenu-item-user nav-link ${location.pathname === subItem.path ? "active" : ""}`}
                        onClick={(e) => handleItemClick(e, subItem.path, false)}
                      >
                        <span className="submenu-icon">{subItem.icon}</span>
                        <span className="nav-text br-text-sub">{subItem.label}</span>
                      </Link>
                    )}
                    {/* Nested submenu collapse */}
                    {subItem.submenu && (
                      <Collapse in={openSubmenu.includes(subItemId)}>
                       <div className="submenu-container-user">
                         {subItem.submenu.map((nestedItem, nestedIndex) => (
                           <Link
                             key={nestedIndex}
                             to={nestedItem.path}
                             className="submenu-item-user nav-link"
                             onClick={(e) => handleItemClick(e, nestedItem.path, false)}
                           >
                             <span className="submenu-icon">{nestedItem.icon}</span>
                             <span className="nav-text br-text-sub">{nestedItem.label}</span>
                           </Link>
                         ))}
                       </div>
                     </Collapse>
                   )}
                 </div>
               );
             })}
           </div>
         </Collapse>
       )}

      {/* Flyout for Collapsed State */}
      {!sidebarOpen && !isMobile && !isTablet && (
        <div className="sidebar-flyout">
          <div 
            className="flyout-header-title" 
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSidebarOpen(true);
              if (item.path && item.path !== "#") {
                navigate(item.path);
              }
            }}
          >
            {item.label}
          </div>
          {item.submenu && item.submenu.length > 0 && (
            <div className="flyout-body">
              {item.submenu.map((subItem, subIndex) => {
                const hasNested = subItem.submenu && subItem.submenu.length > 0;
                return (
                  <div key={subIndex}>
                    <Link
                      to={subItem.path}
                      className={`flyout-item ${location.pathname === subItem.path ? "active" : ""}`}
                      onClick={(e) => handleItemClick(e, subItem.path, false)}
                    >
                      {subItem.icon && <span className="flyout-icon-small">{subItem.icon}</span>}
                      <span>{subItem.label}</span>
                    </Link>
                    {hasNested && (
                      <div className="flyout-nested-menu">
                        {subItem.submenu.map((nested, nIdx) => (
                          <Link
                            key={nIdx}
                            to={nested.path}
                            className={`flyout-nested-item ${location.pathname === nested.path ? "active" : ""}`}
                            onClick={(e) => handleItemClick(e, nested.path, false)}
                          >
                            {nested.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  ))}

        </Nav>

        <div className="sidebar-footer">
          <div className="nav-item-wrapper">
          <Nav.Link
            className="nav-item logout-btn"
            onClick={() => {
              if (typeof logout === "function") {
                logout();
                navigate("/login");
              }
            }}
          >
            <span className="nav-icon">
              <FaSignOutAlt />
            </span>
            <span className="nav-text">Logout</span>
          </Nav.Link>
          {!sidebarOpen && !isMobile && !isTablet && (
            <div className="sidebar-flyout">
              <div className="flyout-header-title">Logout</div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/*  Mobile / Tablet Sidebar (Offcanvas) */}
  <Offcanvas
  show={(isMobile || isTablet) && sidebarOpen}
  onHide={() => setSidebarOpen(false)}
  className="user-mobile-offcanvas"
  placement="start"
  backdrop={true}
  scroll={false}
  enforceFocus={false} //  ADD THIS LINE — fixes close button focus issue
>
  <Offcanvas.Header closeButton className="user-offcanvas-header">
    <Offcanvas.Title className="br-off-title">Menu</Offcanvas.Title>
  </Offcanvas.Header>

  <Offcanvas.Body className="user-offcanvas-body">
    <Nav className="flex-column">
      {menuItems.map((item, index) => (
        <div key={index}>
          {item.submenu ? (
            <Nav.Link
              className={`nav-item ${item.active ? "active" : ""}`}
              onClick={() => toggleSubmenu(index)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text br-nav-text-mob">{item.label}</span>
              <span className="submenu-arrow">
            {openSubmenu.includes(index) ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            </Nav.Link>
          ) : (
             <Link
               to={item.path}
               className={`nav-item nav-link ${item.active ? "active" : ""}`}
               onClick={(e) => handleItemClick(e, item.path, item.active)}
             >
               <span className="nav-icon">{item.icon}</span>
               <span className="nav-text br-nav-text-mob">{item.label}</span>
             </Link>
          )}

          {item.submenu && item.submenu.length > 0 && (
            <Collapse in={openSubmenu.includes(index)}>
              <div className="submenu-container-user">
                {item.submenu.map((subItem, subIndex) => {
                  const subItemId = `${index}-${subIndex}`;
                  return (
                    <div key={subIndex}>
                      {subItem.submenu ? (
                          <Nav.Link
                            className="submenu-item-user nav-link"
                            onClick={() => toggleSubmenu(subItemId)}
                          >
                            <span className="nav-text">{subItem.label}</span>
                            <span className="submenu-arrow">
                              {openSubmenu.includes(subItemId) ? <FaChevronDown /> : <FaChevronRight />}
                            </span>
                          </Nav.Link>
                      ) : (
                        <Link
                          to={subItem.path}
                          className="submenu-item nav-link"
                          onClick={(e) => handleItemClick(e, subItem.path, false)}
                        >
                          <span className="nav-text">{subItem.label}</span>
                        </Link>
                      )}
                      {subItem.submenu && (
                        <Collapse in={openSubmenu.includes(subItemId)}>
                          <div className="submenu-container-user">
                            {subItem.submenu.map((nestedItem, nestedIndex) => (
                              <Link
                                key={nestedIndex}
                                to={nestedItem.path}
                                className="submenu-item nav-link"
                                onClick={(e) => handleItemClick(e, nestedItem.path, false)}
                              >
                                <span className="nav-text">{nestedItem.label}</span>
                              </Link>
                            ))}
                          </div>
                        </Collapse>
                      )}
                    </div>
                  );
                })}
              </div>
            </Collapse>
          )}
        </div>
      ))}
    </Nav>
  </Offcanvas.Body>
</Offcanvas>

    </>
  );
};

export default DPOLeftNav;