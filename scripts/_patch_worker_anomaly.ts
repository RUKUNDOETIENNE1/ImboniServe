// @ts-nocheck
import * as fs from 'fs'

const file = 'src/lib/die/orchestrator/worker-start.ts'
let content = fs.readFileSync(file, 'utf8')
const hasCRLF = content.includes('\r\n')
const normalized = content.replace(/\r\n/g, '\n')

const oldBlock = `    } catch (reconErr) {
      console.error(\`[DIE-Intel] Procurement reconciliation failed for \${scannedDocumentId}:\`, reconErr)
    }

    const durationMs = Date.now() - started`

const newBlock = `    } catch (reconErr) {
      console.error(\`[DIE-Intel] Procurement reconciliation failed for \${scannedDocumentId}:\`, reconErr)
    }

    // Stage 8: Anomaly Detection (Block 4E) - deterministic, idempotent, never blocks reconciliation
    let anomalyResult: Awaited<ReturnType<typeof DocumentAnomalyService.detectAnomalies>> | undefined
    try {
      anomalyResult = await DocumentAnomalyService.detectAnomalies(scannedDocumentId)
      await p.documentProcessingLog.create({
        data: {
          scanJobId,
          stage: 'anomaly_detection',
          level: anomalyResult.success ? 'info' : 'warn',
          message: anomalyResult.success
            ? \`Anomaly detection: \${anomalyResult.alertsCreated} alerts created [\${anomalyResult.alertTypes.join(', ')}]\`
            : \`Anomaly detection failed: \${anomalyResult.error || 'unknown error'}\`,
        },
      })
    } catch (anomalyErr) {
      console.error(\`[DIE-Intel] Anomaly detection failed for \${scannedDocumentId}:\`, anomalyErr)
      // Anomaly detection failures must never block the pipeline
      await p.documentProcessingLog.create({
        data: {
          scanJobId,
          stage: 'anomaly_detection',
          level: 'error',
          message: \`Anomaly detection error: \${anomalyErr instanceof Error ? anomalyErr.message : 'Unknown'}\`,
        },
      }).catch(() => {})
    }

    const durationMs = Date.now() - started`

if (!normalized.includes(oldBlock)) {
  console.error('ERROR: Could not find target block')
  process.exit(1)
}

let patched = normalized.replace(oldBlock, newBlock)
if (hasCRLF) patched = patched.replace(/\n/g, '\r\n')
fs.writeFileSync(file, patched, 'utf8')
console.log('Worker patched successfully')
