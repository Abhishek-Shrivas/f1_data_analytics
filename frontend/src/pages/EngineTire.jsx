import { useEffect, useMemo, useState } from 'react'
import { Area, AreaChart, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Label } from 'recharts'
import { getFerrariFromKaggle } from '../lib/f1data.js'

const ENGINE_DB = [
	{ maker: 'Ferrari', models: [ { code: '066/12', year: 2024, maxRpm: 15000, peakPowerKw: 735, ersKw: 120, torqueNm: 680, throttleResponse: 1.05 } ] },
	{ maker: 'Mercedes', models: [ { code: 'M14 E Performance', year: 2024, maxRpm: 15000, peakPowerKw: 730, ersKw: 120, torqueNm: 670, throttleResponse: 1.03 } ] },
	{ maker: 'Honda RBPT', models: [ { code: 'RA624H', year: 2024, maxRpm: 15000, peakPowerKw: 740, ersKw: 120, torqueNm: 685, throttleResponse: 1.06 } ] },
	{ maker: 'Renault', models: [ { code: 'E-Tech RE24', year: 2024, maxRpm: 15000, peakPowerKw: 720, ersKw: 120, torqueNm: 660, throttleResponse: 1.02 } ] },
]

const TIRES = [
	{ id: 'soft', label: 'Soft (C5)', grip: 1.05, degradation: 0.02 },
	{ id: 'medium', label: 'Medium (C3)', grip: 1.0, degradation: 0.015 },
	{ id: 'hard', label: 'Hard (C1)', grip: 0.96, degradation: 0.01 },
]

function synthRun({ maxRpm, throttleResponse, grip, length = 50 }) {
	return Array.from({ length }, (_, i) => {
		const t = i * 0.1
		const throttle = Math.max(0, Math.sin(i / 8)) * throttleResponse
		const brake = Math.max(0, Math.cos(i / 10) - 0.85)
		const rpm = Math.min(maxRpm, 9000 + throttle * 6000 - brake * 3000)
		const baseSpeed = 90 + throttle * 200 - brake * 120
		const speed = Math.max(0, baseSpeed * grip)
		return { t, speed, throttle, brake, rpm }
	})
}

export default function EngineTire() {
	const [makerIdx, setMakerIdx] = useState(0)
	const [modelIdx, setModelIdx] = useState(0)
	const [tireId, setTireId] = useState('soft')
    const [db, setDb] = useState(ENGINE_DB)

	const maker = db[makerIdx]
	const model = maker.models[modelIdx]
	const tire = TIRES.find(t => t.id === tireId) || TIRES[0]

	const data = useMemo(() => synthRun({
		maxRpm: model.maxRpm,
		throttleResponse: model.throttleResponse,
		grip: tire.grip,
	}), [model, tire])

	useEffect(() => {
		// If a Kaggle CSV URL is provided via env, enrich Ferrari entries
		getFerrariFromKaggle().then(list => {
			if (Array.isArray(list) && list.length) {
				const ferrari = { maker: 'Ferrari', models: list.map(x => ({
					code: x.code,
					year: x.year,
					maxRpm: x.maxRpm,
					peakPowerKw: x.peakPowerKw,
					ersKw: x.ersKw,
					torqueNm: x.torqueNm,
					throttleResponse: x.throttleResponse,
				})) }
				const others = ENGINE_DB.filter(m => m.maker !== 'Ferrari')
				setDb([ferrari, ...others])
			}
		}).catch(() => {})
	}, [])

	return (
		<div className="space-y-4">
			<h2 className="text-xl font-semibold futuristic">Engine & Tire Analytics</h2>

			<div className="card p-4 space-y-3">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
					<div>
						<label className="text-sm font-medium">Engine Manufacturer</label>
						<select value={makerIdx} onChange={(e) => { setMakerIdx(Number(e.target.value)); setModelIdx(0) }} className="mt-1 w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-900">
							{ENGINE_DB.map((m, i) => <option key={m.maker} value={i}>{m.maker}</option>)}
						</select>
					</div>
					<div>
						<label className="text-sm font-medium">Engine Model</label>
						<select value={modelIdx} onChange={(e) => setModelIdx(Number(e.target.value))} className="mt-1 w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-900">
							{maker.models.map((m, i) => <option key={m.code} value={i}>{m.code} ({m.year})</option>)}
						</select>
					</div>
					<div>
						<label className="text-sm font-medium">Tire Compound</label>
						<select value={tireId} onChange={(e) => setTireId(e.target.value)} className="mt-1 w-full border border-neutral-800 rounded-md px-3 py-2 bg-neutral-900">
							{TIRES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
						</select>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-neutral-300">
					<div className="p-3 rounded-md bg-neutral-900">
						<p className="text-neutral-400">Peak Power</p>
						<p className="font-semibold">{model.peakPowerKw} kW + ERS {model.ersKw} kW</p>
					</div>
					<div className="p-3 rounded-md bg-neutral-900">
						<p className="text-neutral-400">Torque</p>
						<p className="font-semibold">{model.torqueNm} Nm</p>
					</div>
					<div className="p-3 rounded-md bg-neutral-900">
						<p className="text-neutral-400">Max RPM</p>
						<p className="font-semibold">{model.maxRpm} rpm</p>
					</div>
				</div>
				<p className="text-xs text-neutral-400">Data modeled from common F1 PU specs; you can switch to Kaggle engine dataset for exact figures.</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div className="card p-4">
					<h3 className="font-medium mb-2">Throttle / Brake</h3>
					<div className="h-48">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={data} margin={{ top: 8, right: 16, bottom: 36, left: 8 }}>
								<XAxis dataKey="t" tickMargin={6}>
									<Label value="Time (s)" position="insideBottom" dy={24} fill="#a3a3a3" />
								</XAxis>
								<YAxis tickMargin={6}>
									<Label value="Ratio" angle={-90} position="insideLeft" dy={12} fill="#a3a3a3" />
								</YAxis>
								<Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #262626' }} />
								<Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ color: '#d4d4d4', paddingBottom: 6 }} />
								<Area dataKey="throttle" name="Throttle" stroke="#22c55e" fill="#22c55e33" />
								<Area dataKey="brake" name="Brake" stroke="#ef4444" fill="#ef444433" />
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
				<div className="card p-4">
					<h3 className="font-medium mb-2">Speed / RPM</h3>
					<div className="h-48">
						<ResponsiveContainer width="100%" height="100%">
							<AreaChart data={data} margin={{ top: 8, right: 36, bottom: 36, left: 8 }}>
								<XAxis dataKey="t" tickMargin={6}>
									<Label value="Time (s)" position="insideBottom" dy={24} fill="#a3a3a3" />
								</XAxis>
								<YAxis yAxisId="left" tickMargin={6}>
									<Label value="Speed (km/h)" angle={-90} position="insideLeft" dy={12} fill="#a3a3a3" />
								</YAxis>
								<YAxis yAxisId="right" orientation="right" tickMargin={6}>
									<Label value="RPM" angle={-90} position="insideRight" dy={12} fill="#a3a3a3" />
								</YAxis>
								<Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #262626' }} />
								<Legend verticalAlign="top" align="center" iconType="circle" wrapperStyle={{ color: '#d4d4d4', paddingBottom: 6 }} />
								<Area yAxisId="left" dataKey="speed" name="Speed (km/h)" stroke="#3b82f6" fill="#3b82f633" />
								<Area yAxisId="right" dataKey="rpm" name="RPM" stroke="#9333ea" fill="#9333ea33" />
							</AreaChart>
						</ResponsiveContainer>
					</div>
				</div>
			</div>
		</div>
	)
}

