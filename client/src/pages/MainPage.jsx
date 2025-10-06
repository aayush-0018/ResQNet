import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Phone, FileText, MapPin, Clock, User, Shield } from 'lucide-react';
// import EmergencyForm from './components/EmergencyForm';
// import SOSButton from './components/SOSButton';
import './MainPage.css';

function MainPage() {
    const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('home');

  const handleSOSClick = () => navigate('/emergency');
  const handleFormClick = () => navigate('/form');
  const handleBackToHome = () => setCurrentView('home');

//   if (currentView === 'sos') return <SOSButton onBack={handleBackToHome} />;
//   if (currentView === 'form') return <EmergencyForm onBack={handleBackToHome} />;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
  <div className="header-inner">
    <div className="header-brand">
      <Shield className="icon-shield" />
      <div>
        <h1>ResQNet</h1>
        <p>Community Emergency Network</p>
      </div>
    </div>

    <div className="header-right">
      <div className="header-info">
        <Clock className="icon-clock" />
        <span>24/7 Emergency Response</span>
      </div>

      <div className="auth-buttons">
        <button className="header-btn login-btn" onClick={() => navigate('/login')}>
          Login
        </button>
        <button className="header-btn register-btn" onClick={() => navigate('/register')}>
          Register
        </button>
      </div>
    </div>
  </div>
</header>


      {/* Hero Section */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <AlertTriangle className="hero-icon" />
            <h2>Emergency Response at Your Fingertips</h2>
            <p>Connect instantly with emergency services or provide detailed information about your situation. Every second counts in an emergency.</p>
          </div>

          <div className="hero-cards">
            <div className="card sos-card" onClick={handleSOSClick}>
              <div className="card-icon red">
                <Phone className="icon" />
              </div>
              <h3>Emergency SOS</h3>
              <p>Immediate emergency alert with automatic location sharing and instant connection to emergency services.</p>
              <div className="card-button red">ACTIVATE SOS</div>
            </div>

            <div className="card form-card" onClick={handleFormClick}>
              <div className="card-icon blue">
                <FileText className="icon" />
              </div>
              <h3>Resource Request</h3>
              <p>Enter the details of your resource request such as resource type, required amount, urgency, and delivery location.”</p>
              <div className="card-button blue">FILL FORM</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h3>How ResQNet Protects You</h3>
        <p>Advanced emergency response features designed for your safety</p>
        <div className="feature-cards">
          <div className="feature-card">
            <div className="feature-icon green">
              <MapPin className="icon" />
            </div>
            <h4>GPS Location Tracking</h4>
            <p>Automatic location sharing ensures first responders can find you quickly.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon purple">
              <User className="icon" />
            </div>
            <h4>Personal Profiles</h4>
            <p>Store medical information and emergency contacts for faster response.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon orange">
              <Clock className="icon" />
            </div>
            <h4>Instant Response</h4>
            <p>Connect to emergency services in seconds with priority routing.</p>
          </div>
        </div>
      </section>

      {/* Emergency Numbers */}
      <section className="emergency-numbers">
        <h3>Emergency Contact Numbers</h3>
        <div className="number-cards">
          <div className="number-card">
            <p>Police</p>
            <p className="number">100</p>
          </div>
          <div className="number-card">
            <p>Fire Department</p>
            <p className="number">101</p>
          </div>
          <div className="number-card">
            <p>Medical Emergency</p>
            <p className="number">102</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Shield className="icon-shield" />
            <span>ResQNet</span>
          </div>
          <p>© 2025 ResQNet Community Emergency Network. Protecting communities 24/7.</p>
        </div>
      </footer>
    </div>
  );
}

export default MainPage;
