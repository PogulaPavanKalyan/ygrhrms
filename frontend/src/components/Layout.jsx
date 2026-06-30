import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <>
      {/* SHARED ENTERPRISE HEADER */}
      <Header />

      <div className="layout">
        {/* SHARED SIDEBAR */}
        <Sidebar />

        {/* LAYOUT CONTENT AREA */}
        <main className="main">
          <Outlet />
        </main>
      </div>

      {/* TOASTS CONTAINER */}
      <div id="toastContainer"></div>
    </>
  );
};

export default Layout;
