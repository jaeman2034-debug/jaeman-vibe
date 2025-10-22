$hub = "http://127.0.0.1:4450/emulators"
$running = $false
try { $resp = Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 $hub; if ($resp.StatusCode -eq 200) { $running = $true } } catch {}
if ($running) {
  Write-Host "[EMU] Already running on 4450 — skipping start."
  exit 0
}
npx firebase-tools@latest emulators:start --config ./firebase.json --only auth,firestore,storage,ui --import ./.seed --export-on-exit