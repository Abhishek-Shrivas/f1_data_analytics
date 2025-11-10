export async function fetchCsv(url) {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Failed to fetch ${url}`)
    const text = await res.text()
    const [headerLine, ...lines] = text.trim().split(/\r?\n/)
    const headers = headerLine.split(',').map(h => h.trim())
    return lines.map((line) => {
        const values = line.split(',').map(v => v.trim())
        const obj = {}
        headers.forEach((h, i) => { obj[h] = values[i] })
        return obj
    })
}

async function tryUrls(urls) {
    for (const url of urls) {
        try {
            const data = await fetchCsv(url)
            return data
        } catch (_) {
            // try next
        }
    }
    return []
}

export async function getDriversFromDataset() {
    // Try a few likely CSV locations in the dataset repo (years may change)
    const base = 'https://raw.githubusercontent.com/toUpperCase78/formula1-datasets/master'
    const candidates = [
        `${base}/F1%202025%20Season%20Drivers/F1_2025_Drivers.csv`,
        `${base}/F1%202024%20Season%20Drivers/F1_2024_Drivers.csv`,
        `${base}/formula1_2021season_drivers.csv`,
    ]
    const rows = await tryUrls(candidates)
    // Normalize: expect columns like Driver, Team, Country, Number (varies by file)
    const nameFields = ['Driver', 'driver', 'Name', 'name']
    const teamFields = ['Team', 'team']
    const countryFields = ['Country', 'Nationality', 'country']
    const numberFields = ['Number', 'number', 'No']
    return rows.map((r, idx) => {
        const name = nameFields.find(k => r[k] != null && r[k] !== '')
        const team = teamFields.find(k => r[k] != null && r[k] !== '')
        const country = countryFields.find(k => r[k] != null && r[k] !== '')
        const number = numberFields.find(k => r[k] != null && r[k] !== '')
        return {
            id: (r[name] || `driver-${idx}`).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: r[name] || r.Driver || r.Name || `Driver ${idx + 1}`,
            team: r[team] || 'Unknown',
            country: r[country] || '—',
            number: r[number] || '—',
        }
    })
}

export async function getTracksFromDataset() {
    const base = 'https://raw.githubusercontent.com/toUpperCase78/formula1-datasets/master'
    const candidates = [
        `${base}/F1%20Race%20Tracks/F1_Tracks.csv`,
        `${base}/formula1_2019season_tracks.csv`,
    ]
    const rows = await tryUrls(candidates)
    const nameFields = ['Track', 'track', 'Name', 'name', 'Circuit', 'circuit']
    const countryFields = ['Country', 'country', 'Location']
    return rows.map((r, idx) => {
        const name = nameFields.find(k => r[k] != null && r[k] !== '')
        const country = countryFields.find(k => r[k] != null && r[k] !== '')
        return {
            id: (r[name] || `track-${idx}`).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            name: r[name] || `Track ${idx + 1}`,
            country: r[country] || '—',
        }
    })
}

export async function getFerrariFromKaggle() {
    // Allow user to paste a raw CSV URL from Kaggle download served locally or via CDN.
    // As Kaggle usually requires auth, provide fallback to a mirror/raw link if supplied via env.
    const url = import.meta.env.VITE_FERRARI_CSV_URL
    if (!url) return []
    const rows = await fetchCsv(url)
    // Try to normalize likely columns from cars dataset: Make, Model, Year, Engine Power, Torque, Top Speed
    const makeKey = Object.keys(rows[0] || {}).find(k => /make/i.test(k))
    const powerKey = Object.keys(rows[0] || {}).find(k => /(power|hp|kw)/i.test(k))
    const torqueKey = Object.keys(rows[0] || {}).find(k => /torque/i.test(k))
    const yearKey = Object.keys(rows[0] || {}).find(k => /year/i.test(k))
    const modelKey = Object.keys(rows[0] || {}).find(k => /model/i.test(k))
    const rpmKey = Object.keys(rows[0] || {}).find(k => /rpm/i.test(k))

    return rows
        .filter(r => String(r[makeKey] || '').toLowerCase().includes('ferrari'))
        .map((r, i) => ({
            maker: 'Ferrari',
            code: String(r[modelKey] || `Ferrari-${i + 1}`),
            year: Number(r[yearKey]) || 2025,
            peakPowerKw: Number(r[powerKey]) || 720,
            torqueNm: Number(r[torqueKey]) || 650,
            maxRpm: Number(r[rpmKey]) || 15000,
            ersKw: 120,
            throttleResponse: 1.05,
        }))
}


