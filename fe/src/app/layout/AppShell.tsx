import { Outlet } from 'react-router-dom';

import Header from './Header';
import Footer from './Footer';

import styles from './AppShell.module.css';

function AppShell() {
  return (
    <div className={styles.shell}>
      <Header />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default AppShell;
