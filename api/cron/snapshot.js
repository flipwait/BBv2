const { fetchAllSportsEvents } = require('../../lib/polymarket');
const { pushPrice, store } = require('../../lib/store');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  try {
    const events = await fetchAllSportsEvents({ limitPerLeague: 12 });
    let n = 0;
    for (const ev of events) {
      for (const m of ev.markets || []) {
        if (m.yesPrice == null) continue;
        const id = String(m.id || m.question || ev.id);
        pushPrice(id, m.yesPrice);
        if (ev.id) pushPrice(String(ev.id), m.yesPrice);
        n++;
      }
    }
    store.meta.lastSnapshot = new Date().toISOString();
    return res.status(200).json({
      ok: true,
      snapped: n,
      marketsTracked: Object.keys(store.prices || {}).length,
      at: store.meta.lastSnapshot,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message || String(e) });
  }
};
