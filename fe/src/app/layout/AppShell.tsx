import { Outlet } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';

function AppShell() {
  return (
    <>
      <Header />

      <main>
        <Outlet />
      </main>

      <Footer />
    </>
  );
}

export default AppShell;
