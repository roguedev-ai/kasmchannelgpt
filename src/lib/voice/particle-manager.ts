const sphereRad = 280 // 20..500
const radius_sp = 1 // 1..2
let framesPerRotation = 5000
let r = 52, g = 235, b = 222  // particle color (initialized with idle colors)
let targetR = 52, targetG = 235, targetB = 222 // for smooth color transitions
let colorTransitionSpeed = 0.05

// Mouse interaction state
let mouseX = 0
let mouseY = 0
let mouseInfluence = 0
let targetMouseInfluence = 0
let isHovering = false

// Color scheme configuration
let currentColorScheme = 'gemini' // default

// Color schemes matching the voice settings
const colorSchemes: Record<string, { idle: any; userSpeaking: any; processing: any; aiSpeaking: any; hover: any }> = {
    gemini: {
        idle: { r: 66, g: 133, b: 244, gradient: [66, 133, 244, 52, 168, 83] }, // Google blue to green
        userSpeaking: { r: 234, g: 67, b: 53, gradient: [234, 67, 53, 251, 188, 5] }, // Google red to yellow
        processing: { r: 155, g: 64, b: 224, gradient: [155, 64, 224, 66, 133, 244] }, // Purple to blue
        aiSpeaking: { r: 52, g: 168, b: 83, gradient: [52, 168, 83, 66, 133, 244] }, // Google green to blue
        hover: { r: 251, g: 188, b: 5, gradient: [251, 188, 5, 234, 67, 53] } // Google yellow to red
    },
    instagram: {
        idle: { r: 228, g: 64, b: 95, gradient: [228, 64, 95, 247, 119, 55] }, // Instagram pink to orange
        userSpeaking: { r: 247, g: 119, b: 55, gradient: [247, 119, 55, 252, 175, 69] }, // Orange to yellow
        processing: { r: 193, g: 53, b: 132, gradient: [193, 53, 132, 228, 64, 95] }, // Purple to pink
        aiSpeaking: { r: 252, g: 175, b: 69, gradient: [252, 175, 69, 247, 119, 55] }, // Yellow to orange
        hover: { r: 131, g: 58, b: 180, gradient: [131, 58, 180, 193, 53, 132] } // Purple gradient
    },
    ocean: {
        idle: { r: 0, g: 119, b: 190, gradient: [0, 119, 190, 0, 168, 232] }, // Ocean blue gradient
        userSpeaking: { r: 0, g: 168, b: 232, gradient: [0, 168, 232, 0, 201, 255] }, // Light blue gradient
        processing: { r: 0, g: 201, b: 255, gradient: [0, 201, 255, 100, 255, 218] }, // Cyan gradient
        aiSpeaking: { r: 100, g: 255, b: 218, gradient: [100, 255, 218, 0, 168, 232] }, // Aqua to blue
        hover: { r: 0, g: 150, b: 199, gradient: [0, 150, 199, 0, 201, 255] } // Deep ocean blue
    },
    sunset: {
        idle: { r: 255, g: 107, b: 107, gradient: [255, 107, 107, 255, 193, 7] }, // Coral to yellow
        userSpeaking: { r: 255, g: 193, b: 7, gradient: [255, 193, 7, 255, 142, 83] }, // Yellow to orange
        processing: { r: 255, g: 142, b: 83, gradient: [255, 142, 83, 255, 107, 107] }, // Orange to coral
        aiSpeaking: { r: 255, g: 230, b: 109, gradient: [255, 230, 109, 255, 193, 7] }, // Light yellow gradient
        hover: { r: 255, g: 171, b: 64, gradient: [255, 171, 64, 255, 107, 107] } // Golden sunset
    },
    aurora: {
        idle: { r: 0, g: 201, b: 255, gradient: [0, 201, 255, 146, 254, 157] }, // Cyan to light green
        userSpeaking: { r: 146, g: 254, b: 157, gradient: [146, 254, 157, 0, 255, 193] }, // Light green to aqua
        processing: { r: 0, g: 255, b: 193, gradient: [0, 255, 193, 186, 85, 255] }, // Aqua to purple
        aiSpeaking: { r: 186, g: 85, b: 255, gradient: [186, 85, 255, 0, 201, 255] }, // Purple to cyan
        hover: { r: 120, g: 255, b: 214, gradient: [120, 255, 214, 186, 85, 255] } // Aurora green to purple
    }
}

// Get the current color palette based on selected scheme
const getColorPalette = () => colorSchemes[currentColorScheme] || colorSchemes.gemini

const setColor = (palette: any) => {
    targetR = palette.r
    targetG = palette.g
    targetB = palette.b
}

const updateColor = () => {
    // Smooth color transitions
    r += (targetR - r) * colorTransitionSpeed
    g += (targetG - g) * colorTransitionSpeed
    b += (targetB - b) * colorTransitionSpeed
}

// Function to update color scheme
const setColorScheme = (scheme: string) => {
    currentColorScheme = scheme
    // Update current color based on current state
    const palette = getColorPalette()
    if (targetR === 255 && targetG === 105 && targetB === 97) { // user speaking state
        setColor(palette.userSpeaking)
    } else if (targetR === 138 && targetG === 43 && targetB === 226) { // processing state
        setColor(palette.processing)
    } else if (targetR === 233 && targetG === 30 && targetB === 99) { // AI speaking state
        setColor(palette.aiSpeaking)
    } else { // idle state
        setColor(palette.idle)
    }
}

// Initialize with idle colors from default scheme
setColor(getColorPalette().idle)

const turnSpeed = () => 2 * Math.PI / framesPerRotation //the sphere will rotate at this speed (one complete rotation every 1600 frames).

// Mouse interaction handlers
const setMousePosition = (x: number, y: number, canvasWidth: number, canvasHeight: number) => {
    mouseX = (x / canvasWidth) * 2 - 1 // Normalize to -1 to 1
    mouseY = (y / canvasHeight) * 2 - 1
    targetMouseInfluence = isHovering ? 1 : 0.3
}

const setHovering = (hovering: boolean) => {
    isHovering = hovering
    targetMouseInfluence = hovering ? 1 : 0
}

// Enhanced state functions with smooth transitions and dynamic effects
const onUserSpeaking = () => {
    const palette = getColorPalette()
    console.log("🎤 [PARTICLE] User speaking - dynamic color scheme:", currentColorScheme)
    framesPerRotation = 2000 // Fast rotation for energy
    colorTransitionSpeed = 0.15 // Faster color transitions
    setColor(palette.userSpeaking)
    // Increase particle creation
    numToAddEachFrame = 5
    particleAlpha = 1.2
    particleRad = 3.5 // Larger particles for recording
    gravity = 0.1 // Slight upward movement
}

const onProcessing = () => {
    const palette = getColorPalette()
    console.log("⚙️ [PARTICLE] Processing - dynamic color scheme:", currentColorScheme)
    framesPerRotation = 500 // Very fast rotation for processing
    colorTransitionSpeed = 0.2 // Very fast color transitions
    setColor(palette.processing)
    // Maximum particles for processing effect
    numToAddEachFrame = 8
    particleAlpha = 1.5
    particleRad = 4 // Even larger particles for emphasis
    gravity = 0 // No gravity for floating effect
}

const onAiSpeaking = () => {
    const palette = getColorPalette()
    console.log("🤖 [PARTICLE] AI speaking - dynamic color scheme:", currentColorScheme)
    framesPerRotation = 2500 // Smooth moderate speed
    colorTransitionSpeed = 0.1 // Smooth transitions
    setColor(palette.aiSpeaking)
    // Moderate particle creation with glow
    numToAddEachFrame = 4
    particleAlpha = 1.3
    particleRad = 3 // Medium particles
    gravity = -0.05 // Gentle floating
}

const reset = () => {
    const palette = getColorPalette()
    console.log("🔄 [PARTICLE] Reset - dynamic color scheme:", currentColorScheme)
    framesPerRotation = 5000
    colorTransitionSpeed = 0.05 // Back to default
    setColor(palette.idle)
    // Reset to defaults
    numToAddEachFrame = 3
    particleAlpha = 1
    particleRad = 2.5
    gravity = 0
}

const wait = 2 // Increase wait time between particle creation
let count = wait - 1
let numToAddEachFrame = 3 // Reduce particles created per frame - now mutable for state changes
const maxParticles = 200 // Maximum number of particles - increased for more dramatic effects
let currentParticleCount = 0
const particleList: any = {
    first: undefined
}
const recycleBin: any = {
    first: undefined
}
let particleAlpha = 1 // maximum alpha - now mutable for state changes
const fLen = 320 // represents the distance from the viewer to z=0 depth.
let m: number

// we will not draw coordinates if they have too large of a z-coordinate (which means they are very close to the observer).
const zMax = fLen - 2
let turnAngle = 1 //initial angle
const sphereCenterY = 0, sphereCenterZ = -3 - sphereRad
let particleRad = 2.5 // Made mutable for state-based sizing

//alpha values will lessen as particles move further back, causing depth-based darkening:
const zeroAlphaDepth = -750

//random acceleration factors - causes some random motion
const randAccelX = 0.1, randAccelY = 0.1, randAccelZ = 0.1
let gravity = -0 //try changing to a positive number (not too large, for example 0.3), or negative for floating upwards. Made mutable for state changes
const rgbString = () => "rgba(" + r + "," + g + "," + b + "," //partial string for color which will be completed by appending alpha value.
//we are defining a lot of variables used in the screen update functions globally so that they don't have to be redefined every frame.
let p: any
let outsideTest: boolean
let nextParticle: any
let sinAngle: number
let cosAngle: number
let rotX: number, rotZ: number
let depthAlphaFactor: number
let i: number
let theta: number, phi: number
let x0: number, y0: number, z0: number

function draw(context: CanvasRenderingContext2D, displayWidth: number, displayHeight: number, projCenterX: number, projCenterY: number) {
    // Update smooth color transitions
    updateColor()
    
    // Update mouse influence smoothly
    mouseInfluence += (targetMouseInfluence - mouseInfluence) * 0.1
    
    // Dynamic particle generation based on state and mouse interaction
    const dynamicNumParticles = Math.floor(numToAddEachFrame * (1 + mouseInfluence * 0.5))
    
    //if enough time has elapsed, we will add new particles.
    count++
    if (count >= wait && currentParticleCount < maxParticles) {

        count = 0
        // Limit particle creation based on current count
        const particlesToCreate = Math.min(dynamicNumParticles, maxParticles - currentParticleCount)
        for (i = 0; i < particlesToCreate; i++) {
            theta = Math.random() * 2 * Math.PI
            phi = Math.acos(Math.random() * 2 - 1)
            
            // Add mouse influence to particle positioning
            const mouseDistortion = mouseInfluence * 0.3
            const mouseBias = {
                x: mouseX * mouseDistortion * sphereRad * 0.5,
                y: mouseY * mouseDistortion * sphereRad * 0.5,
                z: 0
            }
            
            x0 = sphereRad * Math.sin(phi) * Math.cos(theta) + mouseBias.x
            y0 = sphereRad * Math.sin(phi) * Math.sin(theta) + mouseBias.y
            z0 = sphereRad * Math.cos(phi) + mouseBias.z

            //We use the addParticle function to add a new particle. The parameters set the position and velocity components.
            //Note that the velocity parameters will cause the particle to initially fly outwards away from the sphere center (after
            //it becomes unstuck).
            const velocityMultiplier = 0.002 * (1 + mouseInfluence * 0.5)
            const p = addParticle(
                x0, 
                sphereCenterY + y0, 
                sphereCenterZ + z0, 
                velocityMultiplier * x0, 
                velocityMultiplier * y0, 
                velocityMultiplier * z0
            )

            //we set some "envelope" parameters which will control the evolving alpha of the particles.
            // Make particles more vibrant when hovering
            const alphaMultiplier = 1 + mouseInfluence * 0.3
            p.attack = Math.floor(30 / (1 + mouseInfluence * 0.5))  // Faster attack when hovering
            p.hold = Math.floor(30 * (1 + mouseInfluence * 0.5))   // Longer hold when hovering
            p.decay = 60
            p.initValue = 0
            p.holdValue = particleAlpha * alphaMultiplier
            p.lastValue = 0

            //the particle will be stuck in one place until this time has elapsed:
            p.stuckTime = Math.floor((45 + Math.random() * 15) / (1 + mouseInfluence * 0.3))

            // Enhanced acceleration with mouse influence
            p.accelX = mouseX * mouseInfluence * 0.001
            p.accelY = gravity + (mouseY * mouseInfluence * 0.001)
            p.accelZ = 0
        }
    }

    //update viewing angle with mouse influence
    const dynamicTurnSpeed = turnSpeed() * (1 + mouseInfluence * 0.3)
    turnAngle = (turnAngle + dynamicTurnSpeed) % (2 * Math.PI)
    sinAngle = Math.sin(turnAngle)
    cosAngle = Math.cos(turnAngle)

    //background fill - transparent to show gradient behind
    context.clearRect(0, 0, displayWidth, displayHeight)

    //update and draw particles
    p = particleList.first
    while (p != null) {
        //before list is altered record next particle
        nextParticle = p.next

        //update age
        p.age++

        //if the particle is past its "stuck" time, it will begin to move.
        if (p.age > p.stuckTime) {
            p.velX += p.accelX + randAccelX * (Math.random() * 2 - 1)
            p.velY += p.accelY + randAccelY * (Math.random() * 2 - 1)
            p.velZ += p.accelZ + randAccelZ * (Math.random() * 2 - 1)

            p.x += p.velX
            p.y += p.velY
            p.z += p.velZ
        }

        /*
        We are doing two things here to calculate display coordinates.
        The whole display is being rotated around a vertical axis, so we first calculate rotated coordinates for
        x and z (but the y coordinate will not change).
        Then, we take the new coordinates (rotX, y, rotZ), and project these onto the 2D view plane.
        */
        rotX = cosAngle * p.x + sinAngle * (p.z - sphereCenterZ)
        rotZ = -sinAngle * p.x + cosAngle * (p.z - sphereCenterZ) + sphereCenterZ
        m = radius_sp * fLen / (fLen - rotZ)
        p.projX = rotX * m + projCenterX
        p.projY = p.y * m + projCenterY

        //update alpha according to envelope parameters.
        if (p.age < p.attack + p.hold + p.decay) {
            if (p.age < p.attack) {
                p.alpha = (p.holdValue - p.initValue) / p.attack * p.age + p.initValue
            } else if (p.age < p.attack + p.hold) {
                p.alpha = p.holdValue
            } else if (p.age < p.attack + p.hold + p.decay) {
                p.alpha = (p.lastValue - p.holdValue) / p.decay * (p.age - p.attack - p.hold) + p.holdValue
            }
        } else {
            p.dead = true
        }

        //see if the particle is still within the viewable range.
        outsideTest = (p.projX > displayWidth) || (p.projX < 0) || (p.projY < 0) || (p.projY > displayHeight) || (rotZ > zMax);

        if (outsideTest || p.dead) {
            recycle(p)
        } else {
            //depth-dependent darkening
            depthAlphaFactor = (1 - rotZ / zeroAlphaDepth)
            depthAlphaFactor = (depthAlphaFactor > 1) ? 1 : ((depthAlphaFactor < 0) ? 0 : depthAlphaFactor)
            
            // Optimized particle rendering with solid colors
            const finalAlpha = depthAlphaFactor * p.alpha
            const particleSize = m * particleRad * (1 + mouseInfluence * 0.2)
            
            // Use solid color with alpha for better performance
            context.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${finalAlpha})`

            //draw enhanced particle with glow
            context.beginPath()
            context.arc(p.projX, p.projY, particleSize, 0, 2 * Math.PI, false)
            context.closePath()
            context.fill()
            
            // Simple glow effect without shadow blur for better performance
            if (mouseInfluence > 0.5 && finalAlpha > 0.3) {
                // Draw a larger, more transparent circle as glow
                context.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${finalAlpha * 0.3})`
                context.beginPath()
                context.arc(p.projX, p.projY, particleSize * 1.5, 0, 2 * Math.PI, false)
                context.closePath()
                context.fill()
                
                // Reset fill style for the main particle
                context.fillStyle = `rgba(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)}, ${finalAlpha})`
            }
        }

        p = nextParticle
    }
}

function addParticle(x0: number, y0: number, z0: number, vx0: number, vy0: number, vz0: number) {
    let newParticle: any
    
    currentParticleCount++

    //check recycle bin for available drop:
    if (recycleBin.first != null) {
        newParticle = recycleBin.first
        //remove from bin
        if (newParticle.next != null) {
            recycleBin.first = newParticle.next
            newParticle.next.prev = null
        } else {
            recycleBin.first = null
        }
    }
    //if the recycle bin is empty, create a new particle (a new empty object):
    else {
        newParticle = {}
    }

    //add to beginning of particle list
    if (particleList.first == null) {
        particleList.first = newParticle
        newParticle.prev = null
        newParticle.next = null
    } else {
        newParticle.next = particleList.first
        particleList.first.prev = newParticle
        particleList.first = newParticle
        newParticle.prev = null
    }

    //initialize
    newParticle.x = x0
    newParticle.y = y0
    newParticle.z = z0
    newParticle.velX = vx0
    newParticle.velY = vy0
    newParticle.velZ = vz0
    newParticle.age = 0
    newParticle.dead = false
    newParticle.right = Math.random() < 0.5;
    return newParticle
}

function recycle(p: any) {
    currentParticleCount = Math.max(0, currentParticleCount - 1)
    
    //remove from particleList
    if (particleList.first === p) {
        if (p.next != null) {
            p.next.prev = null
            particleList.first = p.next
        } else {
            particleList.first = null
        }
    } else {
        if (p.next == null) {
            p.prev.next = null
        } else {
            p.prev.next = p.next
            p.next.prev = p.prev
        }
    }
    //add to recycle bin
    if (recycleBin.first == null) {
        recycleBin.first = p
        p.prev = null
        p.next = null
    } else {
        p.next = recycleBin.first
        recycleBin.first.prev = p
        recycleBin.first = p
        p.prev = null
    }
}

export const particleActions = {
    onUserSpeaking,
    onProcessing,
    onAiSpeaking,
    reset,
    draw,
    setMousePosition,
    setHovering,
    setColorScheme,
    init: () => {} // No initialization needed for this implementation
};