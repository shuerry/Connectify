import './index.css';
import { Outlet } from 'react-router-dom';
import SideBarNav from '../main/sideBarNav';
import Header from '../header';

/**
 * Modern Layout component with improved responsive design and clean structure.
 */
const Layout = () => (
  <div className='app-layout'>
    <Header />
    <div className='layout-container'>
      <SideBarNav />
      <main className='main-content'>
        <div className='content-wrapper'>
          <Outlet />
        </div>
      </main>
    </div>
  </div>
);

export default Layout;
