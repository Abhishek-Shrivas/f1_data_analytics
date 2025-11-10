import { NavLink, Route, Routes } from 'react-router-dom'
import { BarChart2, Map, Gauge, GitCompare, Brain, FileText } from 'lucide-react'
import Tracks from './pages/Tracks.jsx'
import LapBreakdown from './pages/LapBreakdown.jsx'
import EngineTire from './pages/EngineTire.jsx'
import Comparison from './pages/Comparison.jsx'
import Strategy from './pages/Strategy.jsx'
import Reports from './pages/Reports.jsx'

function SidebarLink({ to, icon: Icon, label }) {
	return (
		<NavLink
			to={to}
			className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-md transition ${isActive ? 'bg-red-600/20 text-red-400' : 'hover:bg-neutral-800'}`}
		>
			<Icon size={18} className="text-red-500" />
			<span>{label}</span>
		</NavLink>
	)
}

export default function App() {
	return (
		<div className="h-full grid grid-cols-1 md:grid-cols-[260px_1fr]">
			<aside className="border-b md:border-b-0 md:border-r border-neutral-800 bg-neutral-950 p-4 space-y-4 sticky top-0 z-10">
				<div className="flex items-center gap-3 futuristic">
					<div className="h-3 w-3 rounded-full bg-red-600 animate-pulse" />
					<img src="https://www.formula1.com/etc/designs/fom-website/images/f1_logo.svg" alt="F1" className="h-4" />
					<h1 className="text-base font-bold tracking-wide">Race Analytics</h1>
				</div>
				<nav className="grid grid-cols-2 md:block gap-2 text-sm">
					<SidebarLink to="/" icon={Map} label="Dashboard" />
					<SidebarLink to="/lap" icon={BarChart2} label="Lap Breakdown" />
					<SidebarLink to="/engine" icon={Gauge} label="Engine & Tire" />
					<SidebarLink to="/compare" icon={GitCompare} label="Comparison" />
					<SidebarLink to="/strategy" icon={Brain} label="Strategy" />
					<SidebarLink to="/reports" icon={FileText} label="Reports" />
				</nav>
			</aside>
			<main className="p-4 md:p-6 overflow-auto bg-neutral-950">
				<div className="mb-4 h-1 bg-gradient-to-r from-red-600 via-red-400 to-transparent rounded" />
				<Routes>
					<Route index element={<Tracks />} />
					<Route path="/lap" element={<LapBreakdown />} />
					<Route path="/engine" element={<EngineTire />} />
					<Route path="/compare" element={<Comparison />} />
					<Route path="/strategy" element={<Strategy />} />
					<Route path="/reports" element={<Reports />} />
				</Routes>
			</main>
		</div>
	)
}
