import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'

const sample = [
	{ lap: 1, s1: 30.1, s2: 31.0, s3: 31.1, total: 92.2 },
	{ lap: 2, s1: 29.9, s2: 30.8, s3: 30.8, total: 91.5 },
	{ lap: 3, s1: 30.0, s2: 30.9, s3: 31.0, total: 91.9 },
]

export default function LapBreakdown() {
	return (
		<div className="space-y-4">
			<h2 className="text-xl font-semibold">Lap Time Breakdown</h2>
			<div className="card p-4">
				<div className="h-64">
					<ResponsiveContainer width="100%" height="100%">
						<LineChart data={sample}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="lap" />
							<YAxis />
							<Tooltip />
							<Line type="monotone" dataKey="s1" stroke="#ef4444" />
							<Line type="monotone" dataKey="s2" stroke="#22c55e" />
							<Line type="monotone" dataKey="s3" stroke="#3b82f6" />
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	)
}

