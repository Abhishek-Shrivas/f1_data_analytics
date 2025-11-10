import { useEffect, useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, Label } from 'recharts'
import { getDriversFromDataset } from '../lib/f1data.js'

const DRIVERS = [
	{ id: 'verstappen', name: 'Max Verstappen', style: 'aggressive', color: '#f97316' },
	{ id: 'hamilton', name: 'Lewis Hamilton', style: 'smooth', color: '#22d3ee' },
	{ id: 'leclerc', name: 'Charles Leclerc', style: 'late-braker', color: '#ef4444' },
	{ id: 'norris', name: 'Lando Norris', style: 'balanced', color: '#f59e0b' },
]

function synthLap(driverStyle = 'balanced') {
	const lengthM = 3000
	const step = 100
	const data = []
	const styleFactor = driverStyle === 'aggressive' ? 1.03 : driverStyle === 'smooth' ? 0.99 : driverStyle === 'late-braker' ? 1.02 : 1.0
	for (let d = 0; d <= lengthM; d += step) {
		const base = Math.min(320, 110 + 0.13 * d + 12 * Math.sin(d / 260))
		const speed = Math.round(base * styleFactor)
		data.push({ distance: d, speed })
	}
	return data
}

function metricsFromLap(data) {
	const topSpeed = Math.max(...data.map(p => p.speed))
	const avgSpeed = Math.round(data.reduce((a, b) => a + b.speed, 0) / data.length)
	const sector = Math.floor(data.length / 3)
	const s1 = Math.round(data.slice(0, sector).reduce((a, b) => a + b.speed, 0) / sector)
	const s2 = Math.round(data.slice(sector, sector * 2).reduce((a, b) => a + b.speed, 0) / sector)
	const s3 = Math.round(data.slice(sector * 2).reduce((a, b) => a + b.speed, 0) / (data.length - sector * 2))
	return { topSpeed, avgSpeed, s1, s2, s3 }
}

export default function Comparison() {
	const [selected, setSelected] = useState(['verstappen', 'hamilton'])
	const [driverCatalog, setDriverCatalog] = useState(DRIVERS)

	useEffect(() => {
		getDriversFromDataset().then(list => {
			if (Array.isArray(list) && list.length > 0) {
				// Map dataset list onto our palette if matching names exist, else default color
				const palette = ['#f97316', '#22d3ee', '#ef4444', '#f59e0b', '#84cc16', '#a78bfa', '#60a5fa']
				const enriched = list.slice(0, 8).map((d, i) => ({
					id: d.id,
					name: d.name,
					style: 'balanced',
					color: palette[i % palette.length],
				}))
				setDriverCatalog(enriched)
			}
		}).catch(() => {})
	}, [])
	const driverData = useMemo(() => {
		return selected.map(id => {
			const d = DRIVERS.find(x => x.id === id)
			const lap = synthLap(d?.style)
			return { id, name: d?.name || id, color: d?.color || '#60a5fa', lap, metrics: metricsFromLap(lap) }
		})
	}, [selected])

	const handleToggle = (id) => {
		setSelected((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
	}

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-semibold futuristic">Competitor Comparison</h2>

			<div className="card p-4 space-y-3">
				<p className="text-sm text-neutral-400">Select Drivers</p>
				<div className="flex flex-wrap gap-2">
					{driverCatalog.map(d => (
						<button
							key={d.id}
							onClick={() => handleToggle(d.id)}
							className={`px-3 py-1 rounded-md border ${selected.includes(d.id) ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-900 border-neutral-800'}`}
							style={{ boxShadow: selected.includes(d.id) ? `inset 0 0 0 1px ${d.color}` : undefined }}
						>
							<span className="inline-block h-2 w-2 rounded-full mr-2" style={{ backgroundColor: d.color }} />
							{d.name}
						</button>
					))}
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="card p-4">
					<p className="text-sm text-neutral-400">Driver Metrics</p>
					<div className="mt-2 grid grid-cols-1 gap-3">
						{driverData.map(d => (
							<div key={d.id} className="p-3 rounded-md bg-neutral-900">
								<p className="font-medium" style={{ color: d.color }}>{d.name}</p>
								<div className="mt-2 grid grid-cols-4 gap-2 text-xs">
									<div>
										<p className="text-neutral-400">Top</p>
										<p className="font-semibold">{d.metrics.topSpeed} km/h</p>
									</div>
									<div>
										<p className="text-neutral-400">Avg</p>
										<p className="font-semibold">{d.metrics.avgSpeed} km/h</p>
									</div>
									<div>
										<p className="text-neutral-400">S1</p>
										<p className="font-semibold">{d.metrics.s1}</p>
									</div>
									<div>
										<p className="text-neutral-400">S2</p>
										<p className="font-semibold">{d.metrics.s2}</p>
									</div>
								</div>
								<div className="mt-2 text-xs">
									<p className="text-neutral-400">Description</p>
									<p className="text-neutral-300">{d.name} shows {d.metrics.topSpeed} km/h top speed with {d.metrics.avgSpeed} km/h average pace. Sector strengths: S1 {d.metrics.s1}, S2 {d.metrics.s2}, S3 {d.metrics.s3}. Style influences corner exit and Vmax.</p>
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="card p-4 lg:col-span-2">
					<p className="text-sm font-medium mb-2">Speed vs Distance (Comparison)</p>
					<div className="h-72">
						<ResponsiveContainer width="100%" height="100%">
							<LineChart margin={{ top: 8, right: 28, bottom: 52, left: 12 }}>
								<CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
								<XAxis dataKey="distance" type="number" stroke="#a3a3a3" tickMargin={8} allowDecimals={false}>
									<Label value="Distance (m)" position="insideBottom" dy={30} fill="#a3a3a3" />
								</XAxis>
								<YAxis stroke="#a3a3a3" tickMargin={6} width={56}>
									<Label value="Speed (km/h)" angle={-90} position="insideLeft" dy={12} fill="#a3a3a3" />
								</YAxis>
								<Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #262626' }} />
								<Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ color: '#d4d4d4', paddingBottom: 8 }} />
								{driverData.map(d => (
									<Line key={d.id} data={d.lap} type="monotone" dataKey="speed" name={d.name} stroke={d.color} strokeWidth={2} dot={false} />
								))}
							</LineChart>
						</ResponsiveContainer>
					</div>
					<p className="mt-2 text-xs text-neutral-400">Chart: Speed vs Distance for selected drivers. Differences reflect style assumptions.</p>
				</div>
			</div>

			<div className="card p-4">
				<p className="text-sm font-medium mb-2">Sector Pace Comparison</p>
				<div className="text-sm text-neutral-300">Shows average speed per sector for each driver and a textual summary below.</div>
				<div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
					{driverData.map(d => (
						<div key={d.id} className="p-3 rounded-md bg-neutral-900">
							<p className="font-medium" style={{ color: d.color }}>{d.name}</p>
							<div className="mt-2 grid grid-cols-3 gap-2 text-xs">
								<div>
									<p className="text-neutral-400">S1</p>
									<p className="font-semibold">{d.metrics.s1} km/h</p>
								</div>
								<div>
									<p className="text-neutral-400">S2</p>
									<p className="font-semibold">{d.metrics.s2} km/h</p>
								</div>
								<div>
									<p className="text-neutral-400">S3</p>
									<p className="font-semibold">{d.metrics.s3} km/h</p>
								</div>
							</div>
							<p className="mt-2 text-xs text-neutral-400">Summary: Strongest in {Math.max(d.metrics.s1, d.metrics.s2, d.metrics.s3) === d.metrics.s1 ? 'S1' : Math.max(d.metrics.s1, d.metrics.s2, d.metrics.s3) === d.metrics.s2 ? 'S2' : 'S3'}; opportunity in other sectors.</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

