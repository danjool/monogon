# Issues:

## max-edge-score seems to always be 0, even when the diagram clearly has edges

## node-edge intersections don't always seem correct, eg the vector space concepts example
after optimizing a few times and stopping, I found manually 1 node-edge intersection, but saw zero in the analytics and weights:
```
<path d="M1381.896,344.655L1275.487,338.712C1169.079,332.77,956.262,320.885,849.854,309.192C743.446,297.5,743.446,286,786.561,273.872C829.676,261.744,915.906,248.988,959.021,242.61L1002.136,236.232" id="L-PGA-NVS-0" class=" edge-thickness-normal edge-pattern-solid flowchart-link LS-PGA LE-NVS" style="fill:none;" marker-end="url(#render-temp-5_flowchart-pointEnd)"></path>
```
clearly intersects
```
<g class="node default default flowchart-label" id="flowchart-DistMeasure-2293" data-node="true" data-id="DistMeasure" transform="translate(1200.5249786376953, 351)"><rect class="basic label-container" style="" rx="0" ry="0" x="-89.2750015258789" y="-17" width="178.5500030517578" height="34"></rect><g class="label" style="" transform="translate(-81.7750015258789, -9.5)"><rect></rect><foreignObject width="163.5500030517578" height="19"><div style="display: inline-block; white-space: nowrap;" xmlns="http://www.w3.org/1999/xhtml"><span class="nodeLabel">Distance measurement</span></div></foreignObject></g></g>
```
from 
```
flowchart BT
Addition[Addition]
Dimension[Dimension n]
ScalarMult[Scalar Multiplication]
    Vec[Vectors] -->|belong to| VS[Vector Space]
    SBF -->|is a| BForm
    PGA[Projective Geometric Algebra] -->|founded on| VS
    VS -->|has| Dimension
    CoVec[Co-vectors] -->|belong to| DVS[Dual Vector Space]
    DVS <-->|isomorphic to| VS
    IP -->|defined by| SBF
    VS -->|closed under| Addition
    BL1["f(αu₁ + βu₂, v) = αf(u₁, v) + βf(u₂, v)"] -->|property of| BForm[Bilinear Form]
    BL2["f(u, αv₁ + βv₂) = αf(u, v₁) + βf(u, v₂)"] -->|property of| BForm
    DistMeasure[Distance measurement] -->|enabled by| NVS
    Symmetry["B(u,v) = B(v,u)"] -->|property of| SBF[Symmetric Bilinear Form]
    NormFormula["‖u‖ := √|u·u|"] -->|formula for| Norm["Norm ‖u‖"]
    Norm -->|defined by| IP
    AngleMeasure[Angle measurement] -->|enabled by| NVS[Normed Vector Space]
    PGA -->|founded on| DVS
    SBF -->|belongs to| NVS
    NVS -->|is a| VS
    VS -->|closed under| ScalarMult
    IPNotation["u·v := B(u,v)"] -->|notation for| IP[Inner Product]
    PGA -->|uses metrics from| NVS
subgraph Example3D[3D Geometric Interpretation]
Lines[Lines through origin] -->|represented by| Vec
Planes[Planes through origin] -->|represented by| CoVec
IncidenceCondition["Line lies in Plane <br> ⟨θ, v⟩ = 0"] -->|both| Lines
IncidenceCondition -->|both| Planes
end
```
showing an edge-node-count of 0, also of note when the diagram first loads it does show a edge-node value of 6, which appears valid, so it doesn't always fail

### max clue:  the blue dots indicating where node-edge intersections occur aren't always visible or in the right place