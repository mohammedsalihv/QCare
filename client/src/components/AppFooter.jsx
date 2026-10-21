import { Link } from 'react-router-dom';
import qcareLogo from '../assets/qcare-brand-logo.png';
import '../footer.css';

export default function AppFooter() {
  return (
    <footer className="qc-page-footer" aria-label="Application footer">
      <div className="qc-footer-main">
        <div className="qc-footer-brand">
          <Link to="/dashboard" aria-label="QCare home">
            <img src={qcareLogo} alt="QCare" width="150" height="50" />
          </Link>
          <p>Healthcare quality, safety and organizational readiness.<br />Connected. Measured. Improved.</p>
        </div>
        <nav className="qc-footer-links" aria-label="Help and resources">
          <h2>Help & resources</h2>
          <Link to="/dashboard/manuals">User guides</Link>
          <Link to="/dashboard/support">Help & support</Link>
          <a href="mailto:support@canadiancmc.com">support@canadiancmc.com</a>
        </nav>
        <div className="qc-footer-organization">
          <h2>CMC Holding</h2>
          <p>Developed by<br /><strong>Enterprise IT Department</strong></p>
        </div>
      </div>
      <div className="qc-footer-bottom">
        <p>&copy; {new Date().getFullYear()} CMC Holding. All rights reserved.</p>
        <span>QCare · Healthcare Quality Management</span>
      </div>
    </footer>
  );
}
