# Plan de refactor visual — alineamiento con sistema de diseño DCaC

**Fecha:** 2026-05-04
**Autor:** Auditoría automatizada + Chiara
**Estado:** Borrador para revisión del equipo

---

## Contexto

El frontend del compliance-system está actualmente desalineado del sistema de diseño DCaC (`Agents/Design/Condiciones de diseño.md` + `tokens.json` + `icons.json`). Esta auditoría cuantifica el desvío y propone un plan en sprints.

### Reglas DCaC violadas (resumen)

1. **Sin gradientes.** El sistema los prohíbe explícitamente. Hoy hay 61 distribuidos en 9 archivos.
2. **Color con función semántica, no decorativa.** Hoy se usa color para "vestir" filas, fondos, separadores.
3. **Tokens DCaC.** El brand DCaC es `#3179a7`. Hoy hay 222 ocurrencias del hex incorrecto `#3879a3` en 12 archivos.
4. **Iconografía:** `icons.json` o Material Symbols Outlined. Hoy se usa `lucide-react` en 49 archivos.
5. **Tailwind config:** la paleta `primary` apunta a `#3b82f6` (azul Tailwind), no a `#3179a7`. Las utilidades semánticas DCaC (`positive`, `negative`, `warning`, `notice`, `brand`) no existen como utilidades.

### Métricas globales

| Métrica | Total | Archivos |
|---|---|---|
| Gradientes (regla: 0) | 61 | 9 |
| Hex codes hardcodeados | 232 | 13 |
| `#3879a3` (azul incorrecto) | 222 | 12 |
| Imports de `lucide-react` | — | 49 |

---

## Sprint 1 — Foundation + Quick Wins (~5 hs)

**Objetivo:** sentar las bases para que los siguientes sprints sean rápidos y consistentes. Casi sin impacto visual en producción salvo el quick win de color.

### Tareas

**1.1 Find-replace `#3879a3` → `#3179a7`** *(30 min)*
- Reemplazo global en los 12 archivos afectados: 222 ocurrencias.
- Resuelve casi toda la inconsistencia cromática del color de marca de un saque.
- Archivos: `ClientOnboarding.jsx`, `ClientDetail.jsx`, `Dashboard.jsx`, `DueDiligence.jsx`, `ClientList.jsx`, `RiskAssessment.jsx`, `Users.jsx`, `Layout.jsx`, `DocumentForm.jsx`, `UnusualOperationList.jsx`, `UnusualOperationForm.jsx`, `PendingClientsList.jsx`.

**1.2 Tailwind config con tokens DCaC** *(2 hs)*
- Mapear paleta primitiva (`brandDCaC`, `green`, `red`, `orange`, `yellow`, neutrales) y semántica (`positive`, `negative`, `warning`, `notice`, `brand`) en `tailwind.config.js`.
- Crear utilidades: `bg-brand`, `text-positive`, `border-warning`, etc.
- Mantener compatibilidad con CSS variables de shadcn pero apuntando a colores DCaC.
- Documentar mapping en un comentario inicial del config.

**1.3 Material Symbols + componente Icon** *(2 hs)*
- Agregar Material Symbols Outlined como font (Google Fonts CDN o paquete local).
- Crear componente `<Icon name="..." size={...} />` que prioriza `icons.json` y cae a Material Symbols.
- Documentar la API y el patrón de migración.

**1.4 Verificación visual** *(30 min)*
- Recorrido manual del producto post-cambios para detectar regressions.
- Si algo se rompió, anotar y arreglar en Sprint 2.

### Criterio de done
- 0 hex codes `#3879a3` en el codebase.
- Tailwind config con utilidades DCaC funcionando.
- `<Icon />` disponible y documentado.
- Build sin errores, app funcionalmente igual a antes.

---

## Sprint 2 — High-impact pages (~8 hs)

**Objetivo:** refactorear las pantallas con mayor concentración de violaciones (gradientes + hex), que también son las más visibles.

### Tareas (en orden)

**2.1 `ClientOnboarding.jsx`** *(3 hs)* — peor archivo del proyecto
- 25 gradientes a remover.
- 79 hex codes (la mayoría `#3879a3`, ya resueltos en sprint 1).
- Reemplazar `from-emerald-500 to-teal-600` por `bg-positive`, etc.
- Sacar gradientes de fondo de filas.
- Simplificar sombras decorativas.
- Reemplazar lucide → Material Symbols (~30 íconos en este archivo).

**2.2 `RiskAssessment.jsx`** *(2 hs)*
- 21 gradientes — alta densidad en un solo componente.
- Probable que use gradientes para representar niveles de riesgo. Reemplazar por colores planos del sistema (`bg-positive` / `bg-warning` / `bg-negative`).

**2.3 `ClientDetail.jsx`** *(2 hs)*
- 4 gradientes (header hero + 2 avatares + risk card).
- 33 hex codes (mayormente `#3879a3`).
- 37 íconos lucide → Material Symbols.
- Simplificar 4 stat cards (que hoy usan 4 colores sin razón semántica).

**2.4 `Dashboard.jsx`** *(1 h)*
- Sin gradientes, pero 30 hex codes (todos `#3879a3`, resueltos en sprint 1).
- Refactor menor: revisar uso de Tailwind defaults y reemplazar por tokens.

### Criterio de done
- 0 gradientes en estos 4 archivos.
- 0 colores Tailwind defaults (emerald, teal, blue, purple, etc.) — todo via tokens DCaC.
- 0 imports de `lucide-react` en estos 4 archivos.
- QA visual contra Condiciones de diseño.md.

---

## Sprint 3 — Medium-impact pages (~6 hs)

**Objetivo:** terminar el refactor de las pantallas restantes y los componentes compartidos.

### Tareas

**3.1 Pantallas con gradientes restantes** *(3 hs)*
- `ClientList.jsx` (2 gradientes, 19 hex)
- `DueDiligence.jsx` (5 gradientes, 26 hex)
- `Login.jsx` (1 gradiente)
- `ClientReview.jsx` (1 gradiente)
- `UnusualOperationDetail.jsx` (1 gradiente)
- `FinalDecisionCard.jsx` (1 gradiente)

**3.2 Pantallas con hex pero sin gradientes** *(2 hs)*
- `Users.jsx` (11 hex)
- `UnusualOperationList.jsx` (7 hex)
- `PendingClientsList.jsx` (2 hex)

**3.3 Componentes compartidos** *(1 h)*
- `Layout.jsx` (5 hex)
- `DocumentForm.jsx` (4 hex)
- Componentes UI (`button.jsx`, `badge.jsx`, etc.) — verificar que usen tokens.

### Criterio de done
- 0 gradientes en todo el codebase.
- 0 hex codes hardcodeados (todos via tokens).
- Coherencia visual entre pantallas.

---

## Sprint 4 — Lucide → Material Symbols + polish (~10-15 hs)

**Objetivo:** completar la migración de iconografía. Es la tarea más cara pero sin riesgos funcionales.

### Tareas

**4.1 Migración de íconos** *(8-12 hs)*
- 49 archivos importan `lucide-react`. Tomar archivo por archivo.
- Mapear cada ícono lucide a su equivalente en `icons.json` o Material Symbols.
- Mantener el componente `<Icon />` de Sprint 1 como interfaz única.
- Tabla de mapping sugerida (a completar):
  - `Check` → Material Symbols `check`
  - `X` → Material Symbols `close`
  - `ChevronRight` → icons.json `Arrow Forward`
  - `Building2` → Material Symbols `apartment`
  - `User` → icons.json o Material Symbols `person`
  - …

**4.2 Cleanup final** *(2-3 hs)*
- Eliminar `lucide-react` de `package.json` cuando 0 archivos lo importen.
- Revisar `shadow-*`, `animate-*`, `scale-*` decorativos remanentes.
- Verificar contraste 4:1 en todos los textos (audit con axe DevTools o similar).
- Asegurar que estados activos/seleccionados son inequívocos.

### Criterio de done
- 0 imports de `lucide-react`.
- `lucide-react` removido de dependencias.
- Auditoría de contraste sin issues críticos.
- Documento de mapping `lucide → Material Symbols / icons.json` en `agents/Design/`.

---

## Riesgos y mitigaciones

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Find-replace masivo rompe algo no detectado | Media | Hacer commit por sprint, QA visual entre sprints |
| Cambio de Tailwind config rompe estilos en pantallas no auditadas | Alta | Mantener fallbacks con CSS variables; QA en todas las pantallas tras Sprint 1 |
| Migración de íconos cambia tamaños/proporciones | Media | Componente `<Icon />` con prop `size` consistente |
| Equipo dev ya está trabajando en otras features | Alta | Coordinar timing con product manager para evitar conflictos de merge |

---

## Decisiones pendientes para el equipo

1. **¿Quién aprueba los refactors de cada sprint?** (PR review por dev senior, QA visual por diseño, ambos).
2. **¿En qué orden las pantallas dentro de Sprint 2/3?** El plan propone uno, pero puede priorizarse por tráfico de usuario o por roadmap.
3. **¿Algún componente UI base (`button`, `badge`, `card`) que ya esté en uso y no haya que tocar?** Para entender efectos en cascada.
4. **¿Hay un Storybook o equivalente?** Si no, vale la pena crearlo durante Sprint 1 para que los nuevos tokens y componentes queden documentados.

---

## Esfuerzo total estimado

| Sprint | Horas |
|---|---|
| Sprint 1 — Foundation + Quick Wins | 5 |
| Sprint 2 — High-impact pages | 8 |
| Sprint 3 — Medium-impact pages | 6 |
| Sprint 4 — Lucide migration + polish | 10-15 |
| **Total** | **29-34 hs** |

---

## Próximo paso sugerido

Aprobar Sprint 1 y arrancar con Quick Win + Foundation. Si todo bien después de Sprint 1, el equipo puede paralelizar Sprints 2 y 4 (icon migration en background, refactor visual en foreground).
