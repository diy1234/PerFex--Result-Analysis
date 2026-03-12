import React from "react";

function AdminDashboard({setDashboard, darkMode, setDarkMode}){

return(

<div style={{textAlign:"center",padding:"50px"}}>

<h1>Admin Dashboard</h1>

<p>Welcome Admin</p>

<button onClick={()=>setDashboard(null)}>
Logout
</button>

</div>

)

}

export default AdminDashboard;