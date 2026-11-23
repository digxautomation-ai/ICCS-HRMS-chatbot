
const DEMO_USERS = [
    {
      id: 1,
      email: "admin@iccs.demo",
      password: "Admin@123",
      name: "Demo Administrator",
      role: "admin"
    },
    {
      id: 2,
      email: "employee@iccs.demo",
      password: "User@123",
      name: "Demo Employee",
      role: "employee"
    }
  ];
  
  const SESSION_KEY = "iccs_demo_session";
  
  function login(email, password) {
    const user = DEMO_USERS.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase()
        && u.password === password
    );
  
    if (!user) {
      return { success: false, message: "Invalid email or password." };
    }
  
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
  
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  
    return { success: true, user: session };
  }
  
  function getCurrentUser() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }
  
  function getDashboard(role) {
    return role === "admin" ? "admin.html" : "user.html";
  }
  
  function requireRole(role) {
    const user = getCurrentUser();
  
    if (!user || user.role !== role) {
      window.location.replace("index.html");
      return false;
    }
  
    return true;
  }
  
  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace("index.html");
  }
  