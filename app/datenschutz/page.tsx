import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Datenschutz - Greetings',
  description: 'Informationen zum Datenschutz',
}

export default function DatenschutzPage() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Zurück zur Startseite
          </Link>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-4xl font-bold text-white mb-8">Datenschutz</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-gray-300">

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Über diese App</h2>
              <p>
                Diese App ist ein privates Projekt für Freunde und Familie. Wir nehmen den Schutz deiner Daten ernst
                und sammeln nur die Informationen, die für den Spielbetrieb notwendig sind.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Welche Daten werden gesammelt?</h2>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Beim Spielen</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Spielername:</strong> Den Namen, den du beim Beitreten eingibst</li>
                <li><strong>Avatar:</strong> Deine Emoji-Auswahl</li>
                <li><strong>Spielstände:</strong> Punkte, Antworten, Spielzeit</li>
                <li><strong>Nachrichten:</strong> Grüße und Nachrichten, die du sendest</li>
                <li><strong>Selfies:</strong> Bilder, die du hochlädst (optional)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-6 mb-3">Technische Daten</h3>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Session-Daten:</strong> Um dich während des Spiels zu identifizieren</li>
                <li><strong>Cookies:</strong> Zur Speicherung deiner Cookie-Präferenzen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Wie werden die Daten verwendet?</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Um die Spiele zu ermöglichen und Spielstände anzuzeigen</li>
                <li>Um Nachrichten und Grüße an andere Spieler zu übermitteln</li>
                <li>Um die App technisch funktionsfähig zu halten</li>
              </ul>
              <p className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <strong className="text-green-400">✓ Wir nutzen deine Daten NICHT für:</strong><br />
                - Werbung oder Marketing<br />
                - Verkauf an Dritte<br />
                - Tracking über mehrere Websites hinweg
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Wo werden die Daten gespeichert?</h2>
              <p>
                Wir nutzen <strong>Supabase</strong> (ein Cloud-Datenbank-Dienst) zur Speicherung:
              </p>
              <ul className="list-disc ml-6 space-y-2 mt-4">
                <li>Anbieter: Supabase, Inc.</li>
                <li>Standort: Cloud-Server (EU/weltweit)</li>
                <li>
                  Datenschutzerklärung:{' '}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    supabase.com/privacy
                  </a>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Wie lange werden Daten gespeichert?</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li><strong>Spieldaten:</strong> Werden nach Ende der Session gespeichert, bis der Raum geschlossen wird</li>
                <li><strong>Nachrichten & Selfies:</strong> Bleiben gespeichert, bis sie vom Admin gelöscht werden</li>
                <li><strong>Cookies:</strong> Bis zu 365 Tage oder bis du sie selbst löschst</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Cookies</h2>
              <p>
                Wir verwenden Cookies, um deine Cookie-Präferenzen zu speichern. Du kannst im Cookie-Banner auswählen,
                welche Cookies du akzeptieren möchtest:
              </p>
              <ul className="list-disc ml-6 space-y-2 mt-4">
                <li><strong>Notwendige Cookies:</strong> Für grundlegende Funktionen (können nicht deaktiviert werden)</li>
                <li><strong>Analyse-Cookies:</strong> Optional, um die App zu verbessern (aktuell nicht aktiv)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Deine Rechte</h2>
              <p>Du hast folgende Rechte bezüglich deiner Daten:</p>
              <ul className="list-disc ml-6 space-y-2 mt-4">
                <li><strong>Auskunft:</strong> Du kannst fragen, welche Daten über dich gespeichert sind</li>
                <li><strong>Löschung:</strong> Du kannst verlangen, dass deine Daten gelöscht werden</li>
                <li><strong>Berichtigung:</strong> Du kannst falsche Daten korrigieren lassen</li>
                <li><strong>Widerruf:</strong> Du kannst deine Einwilligung jederzeit widerrufen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Kontakt</h2>
              <p>
                Wenn du Fragen zum Datenschutz hast oder deine Rechte ausüben möchtest, kannst du uns kontaktieren:
              </p>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 my-4">
                <p className="text-sm text-gray-400 mb-2">
                  Bitte hinterlege hier deine bevorzugte Kontaktmöglichkeit:
                </p>
                <p className="font-mono text-white">
                  E-Mail: <span className="text-blue-400">[deine-email@beispiel.de]</span>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Sicherheit</h2>
              <p>
                Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um deine Daten zu schützen:
              </p>
              <ul className="list-disc ml-6 space-y-2 mt-4">
                <li>Verschlüsselte Verbindungen (HTTPS)</li>
                <li>Sichere Datenbank mit Zugriffskontrollen</li>
                <li>Regelmäßige Sicherheitsupdates</li>
                <li>Zugriff nur für autorisierte Personen (Admin-Bereich)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Änderungen dieser Datenschutzerklärung</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung zu aktualisieren, um Änderungen in der App oder
                gesetzliche Anforderungen zu berücksichtigen. Die aktuelle Version findest du immer auf dieser Seite.
              </p>
            </section>

            <section className="mt-12 pt-6 border-t border-white/10">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">💡 Wichtiger Hinweis</h3>
                <p className="text-sm">
                  Diese App ist ein privates Projekt für einen geschlossenen Nutzerkreis. Wir sammeln nur die minimal
                  notwendigen Daten für den Spielbetrieb. Es erfolgt keine kommerzielle Nutzung oder Weitergabe deiner Daten.
                </p>
              </div>
            </section>

            <p className="text-sm text-gray-400 mt-8">
              Stand: {new Date().toLocaleDateString('de-DE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
