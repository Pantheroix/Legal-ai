import { Outlet, useNavigate } from "react-router-dom";
import ChatBot from "./ChatBot";
import "../css/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      <div className="dashboard-page">
        <div className="dashboard-topbar">
          <h1 className="dashboard-title">Document Simplifier</h1>

          <button className="back-btn" onClick={() => navigate("/")}>
            Back to Home
          </button>
        </div>

        <div className="upload-card">
          <Outlet />
        </div>
      </div>

      <ChatBot />
    </>
  );
}

export default Dashboard;
