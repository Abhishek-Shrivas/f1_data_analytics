import { useEffect, useMemo, useState } from 'react'
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	Label,
} from 'recharts'

import { getTracksFromDataset } from '../lib/f1data.js'
import { postJson } from '../lib/api.js'

const TRACKS = [
	{ id: 'monza', name: 'Monza (Italy)', type: 'low-drag-high-speed' },
	{ id: 'monaco', name: 'Monaco (Monte Carlo)', type: 'street-high-downforce' },
	{ id: 'silverstone', name: 'Silverstone (UK)', type: 'balanced-high-downforce' },
	{ id: 'spa', name: 'Spa-Francorchamps (Belgium)', type: 'high-speed-variance' },
	{ id: 'suzuka', name: 'Suzuka (Japan)', type: 'technical-flow' },
]

// Simplified corner data: radius (m), camber (deg), elevation (m), typical corner number
const TRACK_TURNS = {
	monza: [
		{ corner: 'T1-2 Chicane', radiusM: 45, camberDeg: 1.0, elevationM: 0 },
		{ corner: 'Lesmo 1', radiusM: 140, camberDeg: 2.0, elevationM: -3 },
		{ corner: 'Lesmo 2', radiusM: 120, camberDeg: 2.0, elevationM: -2 },
		{ corner: 'Ascari', radiusM: 170, camberDeg: 1.5, elevationM: 1 },
		{ corner: 'Parabolica', radiusM: 250, camberDeg: 2.0, elevationM: 0 },
	],
	monaco: [
		{ corner: 'Sainte Devote', radiusM: 60, camberDeg: 2.0, elevationM: 2 },
		{ corner: 'Mirabeau', radiusM: 35, camberDeg: 3.0, elevationM: -5 },
		{ corner: 'Loews Hairpin', radiusM: 15, camberDeg: 4.0, elevationM: -2 },
		{ corner: 'Tabac', radiusM: 90, camberDeg: 1.0, elevationM: 0 },
		{ corner: 'Swimming Pool', radiusM: 80, camberDeg: 1.0, elevationM: 0 },
	],
	silverstone: [
		{ corner: 'Copse', radiusM: 220, camberDeg: 1.0, elevationM: 0 },
		{ corner: 'Maggotts/Becketts', radiusM: 180, camberDeg: 1.0, elevationM: 1 },
		{ corner: 'Stowe', radiusM: 180, camberDeg: 1.0, elevationM: -3 },
		{ corner: 'Club', radiusM: 140, camberDeg: 1.0, elevationM: 0 },
	],
	spa: [
		{ corner: 'La Source', radiusM: 40, camberDeg: 3.0, elevationM: 0 },
		{ corner: 'Eau Rouge/Raidillon', radiusM: 250, camberDeg: 1.0, elevationM: 20 },
		{ corner: 'Pouhon', radiusM: 190, camberDeg: 1.0, elevationM: -5 },
		{ corner: 'Blanchimont', radiusM: 350, camberDeg: 1.0, elevationM: 0 },
	],
	suzuka: [
		{ corner: 'S Curves', radiusM: 140, camberDeg: 1.0, elevationM: 3 },
		{ corner: 'Degner', radiusM: 95, camberDeg: 1.0, elevationM: -2 },
		{ corner: 'Spoon', radiusM: 230, camberDeg: 1.0, elevationM: 0 },
		{ corner: '130R', radiusM: 300, camberDeg: 1.0, elevationM: 0 },
	],
}

function computeRecommendedSpeedKmh(radiusM, camberDeg, elevationM, grip = 1.65) {
	// Very simplified: v = sqrt(mu * g * r) then adjust for camber and elevation
	const g = 9.81
	const camberFactor = 1 + Math.min(camberDeg, 6) * 0.01
	const elevationFactor = 1 - Math.max(Math.min(elevationM / 20, 0.1), -0.1)
	const effectiveMu = grip * camberFactor * elevationFactor
	const v = Math.sqrt(Math.max(effectiveMu, 0.9) * g * Math.max(radiusM, 10))
	return Math.round(v * 3.6)
}

function engineRecommendation(trackType) {
	switch (trackType) {
		case 'low-drag-high-speed':
			return {
				engine: 'ICE low-drag mapping, shorter 7th-8th gear, aggressive ERS deploy',
				parts: [
					'Low-drag rear wing + trimmed beam wing',
					'Low cooling louvres (watch temps)',
					'Brake ducts minimal drag spec',
				],
			}
		case 'street-high-downforce':
			return {
				engine: 'Higher downforce mapping, shorter gearing for traction, conservative ERS',
				parts: [
					'High-downforce rear wing + larger flap',
					'Max mechanical grip: softer suspension, higher rake',
					'High cooling louvres for low speed airflow',
				],
			}
		case 'balanced-high-downforce':
			return {
				engine: 'Balanced map, mid-high downforce, ERS split deploy/harvest across lap',
				parts: [
					'Medium rear wing + efficient beam wing',
					'Robust floor edge + mid-corner stability setup',
					'Brake cooling medium spec',
				],
			}
		case 'high-speed-variance':
			return {
				engine: 'Strong ICE efficiency, flexible ERS for hills, taller top gear',
				parts: [
					'Medium-low downforce wing compromise',
					'High-efficiency cooling for long full-throttle',
					'Brake ducts medium for heavy stops',
				],
			}
		case 'technical-flow':
			return {
				engine: 'Responsive throttle map, strong mid-range torque, ERS recovery focus',
				parts: [
					'Mid-high downforce package',
					'Stable front end with stiffer front ARB',
					'Cooling medium spec',
				],
			}
		default:
			return { engine: 'Balanced map', parts: ['Medium wing', 'Standard cooling', 'Standard brake ducts'] }
	}
}

export default function Tracks() {
	const [trackId, setTrackId] = useState('monza')
	const [engineMap, setEngineMap] = useState('balanced') // balanced | quali | endurance
	const [tireType, setTireType] = useState('soft') // soft | medium | hard
	const [trackCatalog, setTrackCatalog] = useState(TRACKS)
	const selectedTrack = useMemo(() => trackCatalog.find(t => t.id === trackId) || trackCatalog[0] || TRACKS[0], [trackId, trackCatalog])
	useEffect(() => {
		getTracksFromDataset().then(list => {
			if (Array.isArray(list) && list.length > 0) {
				setTrackCatalog(list)
				setTrackId(list[0].id)
			}
		}).catch(() => {})
	}, [])
	const turns = TRACK_TURNS[selectedTrack.id] || []
	const rec = engineRecommendation(selectedTrack.type)

	const [winProb, setWinProb] = useState(null)

	async function predictWin() {
		try {
			const resp = await postJson('/ml/predict-win-probability', {
				driver_rating: 92,
				team_rating: 90,
				engine_power_kw: 740,
				track_top_speed_kmh: selectedTrack.type === 'low-drag-high-speed' ? 340 : 315,
				downforce_setup: engineMap === 'quali' ? 0.9 : engineMap === 'endurance' ? 0.6 : 0.75,
				tire_choice: tireType,
			})
			setWinProb(resp.win_probability)
		} catch (_) {
			setWinProb(null)
		}
	}

	const profile = useMemo(() => {
		// Simple pseudo-physics: base speed profile by distance modified by engine and tire
		const lengthM = 3000
		const step = 100
		const data = []
		const engineFactor = engineMap === 'quali' ? 1.08 : engineMap === 'endurance' ? 0.95 : 1.0
		const gripFactor = tireType === 'soft' ? 1.05 : tireType === 'hard' ? 0.97 : 1.0
		const trackTop = selectedTrack.type === 'low-drag-high-speed' ? 340 : selectedTrack.type === 'street-high-downforce' ? 290 : 315
		for (let d = 0; d <= lengthM; d += step) {
			// Baseline speed curve (accelerate then oscillate slightly)
			const base = Math.min(trackTop, 120 + 0.12 * d + 10 * Math.sin(d / 250))
			const speed = Math.max(60, Math.round(base * engineFactor * gripFactor))
			// Throttle approximation (higher at lower speeds during accel, dips in corners)
			const throttle = Math.max(20, Math.min(100, Math.round(60 + 40 * Math.cos(d / 220))))
			// RPM approximation: 290 rpm per km/h, capped at 15500
			const rpm = Math.min(15500, Math.round(speed * 290))
			data.push({ distance: d, speed, rpm, throttle })
		}
		return data
	}, [engineMap, tireType, selectedTrack])

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-semibold futuristic">Race Engineering Dashboard</h2>
			<div className="card p-4 space-y-3">
				<label className="text-sm font-medium" htmlFor="track">Select Track</label>
				<select
					id="track"
					value={trackId}
					onChange={(e) => setTrackId(e.target.value)}
					className="w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-900"
				>
					{trackCatalog.map(t => (
						<option key={t.id} value={t.id}>{t.name}{t.country ? ` (${t.country})` : ''}</option>
					))}
				</select>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div>
						<label className="text-sm font-medium" htmlFor="engine">Engine Map</label>
						<select
							id="engine"
							value={engineMap}
							onChange={(e) => setEngineMap(e.target.value)}
							className="mt-1 w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-900"
						>
							<option value="balanced">Balanced (race)</option>
							<option value="quali">Qualifying (max deploy)</option>
							<option value="endurance">Endurance (fuel/thermal save)</option>
						</select>
					</div>
					<div>
						<label className="text-sm font-medium" htmlFor="tire">Tire Compound</label>
						<select
							id="tire"
							value={tireType}
							onChange={(e) => setTireType(e.target.value)}
							className="mt-1 w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-900"
						>
							<option value="soft">Soft (C5)</option>
							<option value="medium">Medium (C3)</option>
							<option value="hard">Hard (C1)</option>
						</select>
					</div>
					<div>
						<label className="text-sm font-medium" htmlFor="fuel">Fuel Load</label>
						<select
							id="fuel"
							defaultValue="race"
							className="mt-1 w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-900"
						>
							<option value="race">Race (100kg)</option>
							<option value="mid">Mid (60kg)</option>
							<option value="low">Low (20kg)</option>
						</select>
					</div>
					<div className="flex items-center gap-3">
						<button className="btn" onClick={predictWin}>Predict Win Probability</button>
						{winProb != null && (
							<span className="text-sm">Win Probability: <span className="font-semibold">{Math.round(winProb * 100)}%</span></span>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
				<div className="card p-4">
					<p className="text-sm text-neutral-400">Package Recommendation</p>
					<p className="mt-2 font-medium">{rec.engine}</p>
					<ul className="mt-2 list-disc list-inside text-sm text-neutral-300 space-y-1">
						{rec.parts.map((p, i) => <li key={i}>{p}</li>)}
					</ul>
				</div>
				<div className="card p-4">
					<p className="text-sm text-neutral-400">Quick Metrics</p>
					<div className="mt-2 grid grid-cols-3 gap-2 text-center">
						<div className="p-3 rounded-md bg-neutral-900">
							<p className="text-xs text-neutral-400">Corners</p>
							<p className="text-lg font-semibold">{turns.length}</p>
						</div>
						<div className="p-3 rounded-md bg-neutral-900">
							<p className="text-xs text-neutral-400">Grip index</p>
							<p className="text-lg font-semibold">1.65</p>
						</div>
						<div className="p-3 rounded-md bg-neutral-900">
							<p className="text-xs text-neutral-400">Typical top speed</p>
							<p className="text-lg font-semibold">330+ km/h</p>
						</div>
					</div>
				</div>
				<div className="card p-4">
					<p className="text-sm text-neutral-400">Notes</p>
					<p className="mt-2 text-sm text-neutral-300">Calculations use a simplified lateral grip model with camber/elevation modifiers for indicative setup guidance.</p>
				</div>
			</div>

			<div className="card p-4">
				<p className="text-sm font-medium futuristic">Turn-by-Turn Recommended Corner Speeds</p>
				<div className="mt-3 overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="text-left text-neutral-400">
								<th className="py-2 pr-4">Corner</th>
								<th className="py-2 pr-4">Radius (m)</th>
								<th className="py-2 pr-4">Camber (°)</th>
								<th className="py-2 pr-4">Elevation (m)</th>
								<th className="py-2 pr-4">Recommended apex speed (km/h)</th>
							</tr>
						</thead>
						<tbody>
							{turns.map((t) => {
								const v = computeRecommendedSpeedKmh(t.radiusM, t.camberDeg, t.elevationM)
								return (
									<tr key={t.corner} className="border-t border-neutral-800">
										<td className="py-2 pr-4">{t.corner}</td>
										<td className="py-2 pr-4">{t.radiusM}</td>
										<td className="py-2 pr-4">{t.camberDeg}</td>
										<td className="py-2 pr-4">{t.elevationM}</td>
										<td className="py-2 pr-4 font-medium">{v}</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			</div>

			<div className="card p-4">
				<p className="text-sm font-medium mb-2">Speed and RPM Profile by Distance</p>
				<div className="h-72">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={profile} margin={{ top: 8, right: 36, bottom: 52, left: 12 }}>
							<CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
							<XAxis dataKey="distance" stroke="#a3a3a3" tickMargin={8} allowDecimals={false}>
								<Label value="Distance (m)" position="insideBottom" dy={30} fill="#a3a3a3" />
							</XAxis>
							<YAxis yAxisId="left" stroke="#a3a3a3" tickMargin={6} width={56}>
								<Label value="Speed (km/h)" angle={-90} position="insideLeft" dy={12} fill="#a3a3a3" />
							</YAxis>
							<YAxis yAxisId="right" orientation="right" stroke="#a3a3a3" width={56} tickMargin={6}>
								<Label value="RPM" angle={-90} position="insideRight" dy={12} fill="#a3a3a3" />
							</YAxis>
							<Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #262626' }} />
							<Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ color: '#d4d4d4', paddingBottom: 8 }} />
							<Line yAxisId="left" type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#ef4444" strokeWidth={2} dot={false} />
							<Line yAxisId="right" type="monotone" dataKey="rpm" name="RPM" stroke="#60a5fa" strokeWidth={2} dot={false} />
						</LineChart>
					</ResponsiveContainer>
				</div>
				<p className="mt-2 text-xs text-neutral-400">Chart: Speed and RPM vs Distance (engine map and tire compound applied)</p>
			</div>
		</div>
	)
}

