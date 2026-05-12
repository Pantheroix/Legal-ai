import ChatBot from "./ChatBot";
import { useNavigate } from "react-router-dom";
import "../css/LandingPage.css";

function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="landing">
        {/* Navbar */}
        <nav className="navbar">
          <h1 className="logo">LAWGLIDER</h1>
        </nav>

        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-left">
            <p className="hero-eyebrow">Your AI Legal Companion</p>
            <h1 className="hero-title">Bridge Justice for Every Citizen</h1>
            <p className="hero-subtitle">
              Lawglider helps citizens understand legal documents, discover
              government schemes, and communicate in their own language.
            </p>
            <div className="hero-buttons">
              <button
                className="hero-btn primary-btn"
                onClick={() => navigate("/dashboard")}
              >
                Doc Simplifier
              </button>
              <button
                className="hero-btn secondary-btn"
                onClick={() => navigate("/scheme")}
              >
                Find Schemes
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="chat-preview">
              <div className="chat-preview-header">
                <span className="chat-dot" />
                <span className="chat-dot" />
                <span className="chat-dot" />
                <span className="chat-preview-title">LAWGLIDER AI</span>
              </div>
              <div className="message left">Explain this FIR in Kannada</div>
              <div className="message right">
                ಈ FIR ಆಸ್ತಿ ಹಾನಿ ಕುರಿತು ದಾಖಲಾಗಿರುವ ದೂರು ಮತ್ತು ತನಿಖೆ ಆರಂಭವಾಗಿದೆ
                ಎಂದು ತಿಳಿಸುತ್ತದೆ.
              </div>
              <div className="message left">What should I do next?</div>
              <div className="message right">
                You may need to visit the nearest police station and provide
                supporting documents.
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="features-section">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Document Simplification</h3>
            <p>
              Upload legal notices, FIRs, and agreements and receive simple
              multilingual explanations.
            </p>
            <button
              className="feature-link"
              onClick={() => navigate("/dashboard")}
            >
              Try it →
            </button>
          </div>
          {/* <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Legal Assistant</h3>
            <p>
              Ask legal and government-related doubts in natural language, any
              time you need.
            </p>
            <button className="feature-link">Chat now →</button>
          </div> */}
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Scheme Finder</h3>
            <p>
              Discover government schemes based on your eligibility and personal
              profile.
            </p>
            <button
              className="feature-link"
              onClick={() => navigate("/scheme")}
            >
              Find schemes →
            </button>
          </div>
        </div>
      </div>
      <ChatBot />
    </>
  );
}

export default LandingPage;
