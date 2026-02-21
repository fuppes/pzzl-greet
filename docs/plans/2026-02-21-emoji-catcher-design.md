# Emoji Catcher — Design Document

**Datum:** 2026-02-21
**Status:** Approved

## Spielkonzept

Emojis fallen von oben herab. Der Spieler bewegt einen Korb am unteren Bildschirmrand per Touch-Drag, um die richtigen Emojis zu fangen. Der Admin wählt ein Thema (z.B. "Tiere"), und nur passende Emojis geben Punkte — falsche Emojis ziehen Punkte ab.

**Plattform:** Mobile-First (Touch-Drag), Desktop-Fallback (Maus-Drag)
**Spielmodus:** Solo & Multiplayer (jeder spielt individuell, Scores werden verglichen)

## Steuerung

- Touch-Drag auf dem Korb-Element (primär)
- Maus-Drag als Desktop-Fallback
- Korb bewegt sich nur horizontal am unteren Rand

## Punktesystem

| Aktion | Punkte |
|--------|--------|
| Richtiges Emoji gefangen | +10 |
| Falsches Emoji gefangen | -5 |
| Richtiges Emoji verpasst | 0 |

## Themen (Admin-konfigurierbar)

Der Admin wählt im GameEditor ein Thema. Jedes Thema hat "richtige" und "falsche" Emojis:

| Thema | Richtige Emojis | Falsche Emojis |
|-------|----------------|----------------|
| Tiere | 🐶🐱🐭🐹🐰🐻🐼🐨🐯🦁 | 🌸🚗💎🔥⚡🎸🏠📱 |
| Essen | 🍕🍔🌮🍣🍩🍪🎂🍓🍎🥑 | 🐶⚽🎵🚗💎🔥📱🏠 |
| Sport | ⚽🏀🎾🏈⚾🏐🎱🏓🥊🏋️ | 🍕🌸🐶💎🔥🎸📱🏠 |
| Party | 🎉🎊🥳🎈🎁🍾🥂🎆🎇✨ | 🐶🍕⚽🚗🏠📱🔧📚 |
| Natur | 🌸🌺🌻🌲🌴🍀☘️🌈⭐🌙 | 🍕🚗⚽💎🎸📱🏠🔧 |

## Architektur

### Neue Dateien

| Datei | Zweck |
|-------|-------|
| `components/puzzles/EmojiCatcherPuzzle.tsx` | Spiel-Logik & Rendering |
| `components/puzzles/EmojiCatcherWithLeaderboard.tsx` | Wrapper: Spiel → Warten → Leaderboard |
| `lib/puzzles/emoji-catcher-data.ts` | Themen-Definitionen (Emoji-Listen) |

### Bestehende Dateien (Anpassungen)

| Datei | Änderung |
|-------|----------|
| `types/games.ts` | Neuer GameType `emoji_catcher` + `EmojiCatcherConfig` |
| `components/GameEditor.tsx` | Konfigurationsformular für Emoji Catcher |
| `app/session/[code]/GameSession.tsx` | Emoji Catcher in Game-Routing einbinden |

### Config-Interface

```typescript
interface EmojiCatcherConfig {
  theme: 'animals' | 'food' | 'sports' | 'party' | 'nature'
  duration: number       // Spielzeit in Sekunden (30-120)
  spawnRate: number      // Emojis pro Sekunde (1-5)
  fallSpeed: number      // Fallgeschwindigkeit (1-5, langsam bis schnell)
}
```

## Spielablauf (technisch)

1. **Start:** Timer läuft, Emojis spawnen oben mit zufälliger X-Position
2. **Fallen:** CSS `transform: translateY()` Animation, Dauer abhängig von `fallSpeed`
3. **Fangen:** Kollisionserkennung: Emoji-Position vs. Korb-Position (Bounding-Box)
4. **Ende:** Timer abgelaufen → Score als `player_action` speichern
5. **Sync:** Bestehender Leaderboard-Flow über `getLeaderboardScores()`

### Rendering

- Spielfeld: `relative`-Container, volle Breite, feste Höhe
- Emojis: `absolute`-positionierte `<span>`s mit CSS `transition` / `animation`
- Korb: `absolute` am unteren Rand, Touch-Drag via `onTouchMove` / `onMouseMove`
- Cleanup: Emojis die den unteren Rand passieren werden aus dem State entfernt
- Max ~15 Emojis gleichzeitig im DOM

### DB-Action

- `action_type: 'emoji_catcher_finished'`
- `action_data: { score: number }`

## Multiplayer-Sync

- Jeder Spieler spielt individuell auf seinem Gerät (kein shared State während des Spiels)
- Am Ende wird der Score als `player_action` gespeichert
- Gleicher Warte-/Leaderboard-Flow wie bei den anderen Spielen

## Edge Cases

| Situation | Verhalten |
|-----------|-----------|
| Emoji erreicht Boden (nicht gefangen) | Wird entfernt, kein Punkteabzug |
| Spieler bewegt Korb aus dem Spielfeld | Korb wird auf Min/Max X geclampt |
| Viele Emojis gleichzeitig | Max ~15 gleichzeitig im DOM |
| Timer läuft ab während Emoji fällt | Spiel endet sofort, alle Emojis verschwinden |
| Desktop ohne Touch | Mouse-Drag als Fallback |

## Visuelle Effekte

- Richtiges Emoji gefangen: kurzer grüner Flash + `+10` Floating-Text
- Falsches Emoji gefangen: kurzer roter Flash + `-5` Floating-Text
- Score-Counter oben sichtbar + verbleibende Zeit
