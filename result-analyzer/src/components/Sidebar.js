import React, { useState, useEffect } from "react";


function Sidebar({ setDashboard, setView, setPage, activeView, downloadCSV, downloadPDF }) {

	const [saved, setSaved] = useState(null);
	const [openKey, setOpenKey] = useState(null);
	const [navTop, setNavTop] = useState(0);

	useEffect(()=>{
		const load = () => {
			try{ setSaved(JSON.parse(localStorage.getItem('profile'))); }catch(e){ setSaved(null); }
		};
		load();

		// compute navbar height so sidebar doesn't overlap it
		const nav = document.querySelector('.navbar');
		setNavTop(nav ? nav.offsetHeight : 0);

		const handler = (e) => {
			if(e && e.detail) setSaved(e.detail);
			else load();
		};

		window.addEventListener('profileUpdated', handler);
		// also listen to storage events in case another tab changed it
		const storageHandler = (ev) => { if(ev.key === 'profile') load(); };
		window.addEventListener('storage', storageHandler);

		return () => { window.removeEventListener('profileUpdated', handler); window.removeEventListener('storage', storageHandler); };
	}, []);

	const goToProfile = () => {
		if(setPage) setPage('profile');
		else if(setView) setView('profile');
	};

	const items = [
		{key:'dashboard', label:'Dashboard'},
		{key:'results', label:'Results'},
		{key:'analysis', label:'Analysis'},
		{key:'progress', label:'Progress'},
		{key:'download', label:'Download'},
	];

	return (

		<div className="sidebar" style={{position:'sticky', top:navTop, width:260, flex:'0 0 260px', background:'#2f4250', color:'#fff', height:`calc(100vh - ${navTop}px)`, paddingBottom:20, overflow:'auto', zIndex:10}}>

			<div style={{padding:28, textAlign:'center', cursor:'pointer'}} onClick={goToProfile}>
				{saved && saved.profileImage ? (
					<div style={{width:120,height:120,display:'inline-block',borderRadius:999,background:'#fff',padding:8}}>
						<img src={saved.profileImage} alt="profile" style={{width:104,height:104,objectFit:'cover',borderRadius:999,display:'block',margin:'0 auto'}} />
					</div>
				) : (
					<div style={{width:120,height:120,background:'#fff',borderRadius:999,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
						<div style={{width:100,height:100,background:'#ddd',borderRadius:999,display:'inline-flex',alignItems:'center',justifyContent:'center'}}>User</div>
					</div>
				)}

				<div style={{marginTop:12,fontWeight:700,fontSize:22,color:'#fff'}}>{(saved && saved.fullName) || 'Profile'}</div>
				{saved && saved.email && <div style={{fontSize:13, color:'#bfc9cd', marginTop:6}}>{saved.email}</div>}
				<div style={{marginTop:8,fontSize:13,color:'#9faeb6'}}>
					{saved && saved.rollNo ? `Roll: ${saved.rollNo}` : ''}
					{saved && saved.course ? ` • ${saved.course}` : ''}
					{saved && saved.semester ? ` • ${saved.semester}` : ''}
				</div>
			</div>

			<div style={{padding:'0 18px'}}>
				<h3 style={{color:'#fff', fontSize:22, marginTop:8}}>Menu</h3>

					<ul style={{listStyle:'none', padding:0, marginTop:8}}>
						{items.map(it=>{
							const isActive = activeView === it.key;
							if (it.key === 'download') {
								return (
									<li key={it.key} style={{position:'relative'}}>
										<div
											onClick={() => { if(setView) setView(it.key); setOpenKey(openKey === 'download' ? null : 'download'); }}
											style={{padding:'18px 8px 18px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:isActive? '#fff':'#e6f0f5', fontSize:18, fontWeight:isActive?700:400}}
										>
											{it.label}
										</div>
										{openKey === 'download' && (
											<ul style={{position:'absolute', left:'100%', top:0, background:'#fff', color:'#333', minWidth:180, boxShadow:'0 6px 18px rgba(0,0,0,0.12)', listStyle:'none', padding:0, margin:0, borderRadius:6, overflow:'hidden', zIndex:30}}>
												<li style={{padding:10, cursor:'pointer'}} onClick={() => { downloadCSV && downloadCSV(); setOpenKey(null); }}>Download Excel (CSV)</li>
												<li style={{padding:10, cursor:'pointer'}} onClick={() => { downloadPDF && downloadPDF(); setOpenKey(null); }}>Download PDF</li>
											</ul>
										)}
									</li>
								)
							}
							return (
								<li key={it.key}
									onClick={() => { if(setView) setView(it.key); if(setPage && it.key==='profile') setPage('profile'); setOpenKey(null); }}
									style={{padding:'18px 8px 18px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', cursor:'pointer', color:isActive? '#fff':'#e6f0f5', fontSize:18, fontWeight:isActive?700:400}}
								>
									{it.label}
								</li>
							)
							})}

						<li onClick={() => setDashboard && setDashboard(null)} style={{padding:'18px 8px 18px 12px', borderTop:'1px solid rgba(255,255,255,0.06)', marginTop:12, cursor:'pointer', color:'#e6f0f5', fontSize:18}}>
							Logout
						</li>

					</ul>
			</div>

		</div>

	);

}

export default Sidebar;