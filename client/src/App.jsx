// import { BrowserRouter, Route, Routes } from "react-router-dom";
// import Dashboard from "./components/Dashboard";
// import Home from "./components/Home";
// import LandingPage from "./components/LandingPage";
// import Settings from "./components/Settings";
// import SchemeFinder from "./components/SchemeFinder";

// function App() {
//   return (
//     <BrowserRouter>
//       <div
//         className="d-flex justify-content-center align-items-start min-vh-100 px-3 py-4"
//         style={{
//           background:
//             "radial-gradient(180px 180px at 12% 16%, rgba(213, 164, 69, 0.18), transparent 70%), radial-gradient(280px 280px at 86% 24%, rgba(79, 134, 207, 0.2), transparent 75%), linear-gradient(140deg, #edf4ff 0%, #f8fbff 46%, #ffffff 100%)",
//         }}
//       >
//         <Routes>
//           <Route path="/" element={<LandingPage />} />
//           <Route path="scheme" element={<SchemeFinder />} />
//           <Route path="dashboard" element={<Dashboard />}>
//             <Route index element={<Home />} />
//             <Route path="settings" element={<Settings />} />
//           </Route>
//         </Routes>
//       </div>
//     </BrowserRouter>
//   );
// }

// export default App;
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Home from "./components/Home";
import LandingPage from "./components/LandingPage";
import SchemeFinder from "./components/SchemeFinder";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="scheme" element={<SchemeFinder />} />

        <Route path="dashboard" element={<Dashboard />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
