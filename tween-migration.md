# Migrating from Old TWEEN.js to Modern Three.js TWEEN Module

## Key API Changes & Solutions

### 1. **Import Method**
```javascript
// Old: Global script tag
<script src="js/tween.min.js"></script>

// Modern: ES6 module import  
import * as TWEEN from 'three/addons/libs/tween.module.js';
```

### 2. **Callback Context (`this`) Issue**
**Problem:** `this.t` no longer works in modern TWEEN callbacks
```javascript
// OLD - BROKEN:
new TWEEN.Tween({t:0}).to({t:1}, 1000)
  .onUpdate(function(){ 
    someValue = this.t; // this.t is undefined!
  })

// MODERN - FIXED:
var tweenObj = {t:0};
new TWEEN.Tween(tweenObj).to({t:1}, 1000)
  .onUpdate(() => { 
    someValue = tweenObj.t; // Use explicit reference
  })
```

### 3. **Three.js Object Tweening**
**Problem:** Can't directly tween Three.js Vector3/Quaternion objects
```javascript
// OLD - BROKEN:
new TWEEN.Tween(object.position).to({x:10, y:20, z:30}, 1000)

// MODERN - FIXED:
var pos = {x: object.position.x, y: object.position.y, z: object.position.z};
new TWEEN.Tween(pos).to({x:10, y:20, z:30}, 1000)
  .onUpdate(() => {
    object.position.set(pos.x, pos.y, pos.z);
  })
```

### 4. **Function vs Arrow Functions**
Use **arrow functions** to avoid `this` binding issues:
```javascript
// Prefer arrow functions
.onUpdate(() => { /* code */ })
.onComplete(() => { /* code */ })
```

### 5. **Essential Migration Checklist**
- ✅ Replace script tag with ES6 import
- ✅ Create explicit tween objects instead of using `this.t`
- ✅ Use arrow functions in callbacks
- ✅ Convert Three.js object tweens to plain object + manual updates
- ✅ Keep `TWEEN.update()` in your render loop
- ✅ Test all animations thoroughly

## Common Patterns

### Quaternion Interpolation
```javascript
// OLD:
new TWEEN.Tween({t:0}).to({t:1}, 1000)
  .onUpdate(function(){
    THREE.Quaternion.slerp(qa, qb, result, this.t);
  })

// MODERN:
var tweenObj = {t:0};
new TWEEN.Tween(tweenObj).to({t:1}, 1000)
  .onUpdate(() => {
    result.slerpQuaternions(qa, qb, tweenObj.t);
  })
```

### Position Animation
```javascript
// OLD:
new TWEEN.Tween(mesh.position).to({x:100, y:50, z:0}, 1000)

// MODERN:
var startPos = {x: mesh.position.x, y: mesh.position.y, z: mesh.position.z};
new TWEEN.Tween(startPos).to({x:100, y:50, z:0}, 1000)
  .onUpdate(() => {
    mesh.position.set(startPos.x, startPos.y, startPos.z);
  })
```

## Troubleshooting

**Issue:** Animations not running
- ✅ Ensure `TWEEN.update()` is called in your render loop
- ✅ Check that tweens are properly started with `.start()`

**Issue:** `this` is undefined in callbacks
- ✅ Use arrow functions instead of regular functions
- ✅ Create explicit tween objects to reference values

**Issue:** Three.js objects not animating
- ✅ Don't tween Three.js objects directly
- ✅ Use plain objects and manual updates via `.set()` or `.copy()`

The core issue: **callback context changed** - `this` no longer refers to the tween object in modern versions.