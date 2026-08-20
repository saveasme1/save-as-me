# 3D cockpit attribution

The flight-deck mesh `assets/models/a320-cockpit.glb` (and `public/models/a320-cockpit.glb`)
is converted from the FlightGear **IDG-A32X** flightdeck model:

- Source: https://github.com/FGDATA/IDG-A32X
- Original path: `Models/FlightDeck/res/fd_complete.ac` (+ cockpit textures in the same folder)
- License: **GNU GPL v2** (see upstream `LICENSE`)
- Upstream authors / contributors: see IDG-A32X `THANKS.md` / commit history (incl. Joshua Davidson / it0uchpods and others)

Conversion: AC3D → Blender 5.2 (`io_scene_ac3d`) → glTF Binary (GLB), cockpit interior only
(no fuselage / wings / engines / cabin extracted for this site).

Related reference clone also kept locally: https://github.com/YV3399/737-800YV (GPL-2.0).

If you redistribute this site or the GLB, you must comply with GPL-2.0
(source offer / license notice for the covered work).
