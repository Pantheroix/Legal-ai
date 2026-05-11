function NavBar() {
  return (
    <>
      <nav
        className="navbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>SIMPLYLAW</h1>

        <select>
          <option>English</option>
          <option>Hindi</option>
          <option>Kannada</option>
        </select>
      </nav>
    </>
  );
}

export default NavBar;
