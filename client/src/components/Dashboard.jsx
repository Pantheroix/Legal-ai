import { NavLink, Outlet, useNavigate } from "react-router-dom";
import ChatBot from "./ChatBot";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <>
      <div
        className="rounded-4 bg-white p-4 p-md-5 shadow w-100"
        style={{
          maxWidth: "920px",
          border: "1px solid rgba(22, 48, 87, 0.12)",
        }}
      >
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-4">
          <h2 className="h3 mb-0" style={{ color: "#1d3557" }}>
            Dashboard
          </h2>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => navigate("/")}
          >
            Back to Landing
          </button>
        </div>

        <div className="d-flex gap-2 mb-4">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) =>
              `btn ${isActive ? "btn-primary" : "btn-outline-primary"}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              `btn ${isActive ? "btn-primary" : "btn-outline-primary"}`
            }
          >
            Settings
          </NavLink>
        </div>

        <Outlet />
      </div>
      <ChatBot />
    </>
  );
}

export default Dashboard;
