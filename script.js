function get(id)    { return document.getElementById(id) }
function make(type) { return document.createElement(type) }

function getBoardHeight() {
    return Math.floor(
        board.offsetHeight /
        helperBlock.offsetHeight
    )
}

function getBoardWidth() {
    return Math.floor(
        board.offsetWidth /
        helperBlock.offsetWidth
    )
}

function throttle(f, wait, args) {
    let timeout

    if(timeout) { return }

    timeout = true
    f.apply(null, args)
    setTimeout(() => timeout = false , wait)
}



function getBlock(y, x) {
    let blocks = get(rowPre + y).children

    for(let i = 0; i < blocks.length; i++) {
        if(blocks[i].children[0].id == blockPre + x) {
            return blocks[i].children[0]
        }
    }
}

function calcBlock(block, value) {
    let text, color

    if(value < 70)      { text = ""; color = "" }
    else if(value < 75) { text = "."; color = "dark_grey" }
    else if(value < 85) { text = ","; color = "grey" }
    else if(value < 95) { text = ":"; color = "light_grey" }
    else if(value < 97) { text = ";"; color = "white" }
    else                { text = "!"; color = "red" }

    block.textContent   = text
    block.className     = color
}

function genBlock(block) {
    let r = Math.floor(Math.random() * 100) + 1
    calcBlock(block, r)
}

function makePlayer(block) {
    playerBlock         = block
    block.textContent   = "@"
    block.className     = "blue"
}



function gen() {
    let calc = (size, margin) => {
        if(size <= margin * 2) {
            return Math.floor(size / 2)
        } else {
            return Math.round(
                Math.random() *
                (size - margin * 2) +
                margin
            )
        }
    }

    playerY = calc(boardHeight, margin)
    playerX = calc(boardWidth, margin)

    for(let h = 0; h < boardHeight; h++) {
        let row         = make("div")
        row.id          = rowPre + h
        row.className   = rowPre

        for(let w = 0; w < boardWidth; w++) {
            let block       = make("div")
            block.className = "block"

            row.appendChild(block)
            block.appendChild(make("p"))
            let text    = block.children[0]
            text.id     = blockPre + w

            let isWithinRadius = (
                Math.pow(h - playerY, 2) +
                Math.pow(w - playerX, 2) <=
                Math.pow(radius, 2)
            )

            if(isWithinRadius) {
                if(h == playerY && w == playerX) {
                    makePlayer(text)
                }
            } else { genBlock(text) }
        }

        board.appendChild(row)
    }
}

function regen() {
    board.replaceChildren()
    board.style     = null
    board.className = "generating"

    window.requestAnimationFrame(() => {
        boardHeight         = getBoardHeight()
        boardWidth          = getBoardWidth()
        board.style.height  = boardHeight * helperBlock.offsetHeight
        board.style.width   = boardWidth * helperBlock.offsetWidth

        gen()

        board.className = "generated"
    })
}



function move(y, x) {
    if(playerIsMoving) { return }

    playerIsMoving = true

    let nextY = playerY + y
    let nextX = playerX + x

    let withinY = nextY >= 0 && nextY < boardHeight
    let withinX = nextX >= 0 && nextX < boardWidth

    if(withinY && withinX) {
        playerBlock.animate([
            {
                transform: "translate(" +
                    x * helperBlock.offsetWidth + "px," +
                    y * helperBlock.offsetHeight + "px)"
            }
        ], { duration: animationTime })

        setTimeout(
            () => {
                calcBlock(playerBlock, 0)
                playerY = nextY
                playerX = nextX
                makePlayer(getBlock(playerY, playerX))
                playerIsMoving = false
            },
            animationTime
        )
    } else { playerIsMoving = false }
}

function moveUp()       { move(-1, 0) }
function moveDown()     { move(1, 0) }
function moveLeft()     { move(0, -1) }
function moveRight()    { move(0, 1) }



function loopTouch(func) {
    if(stopLoopTouch) { return }
    func.apply()
    setTimeout( () => { loopTouch(func) }, 1)
}

window.addEventListener("touchstart", (e) => {
    e.preventDefault()
    animationTime = maxAnimationTime;

    initialSwipeY = e.touches[0].pageY
    initialSwipeX = e.touches[0].pageX
}, { passive: false })

window.addEventListener("touchmove", (e) => {
    e.preventDefault()

    let currentY    = e.touches[0].pageY
    let currentX    = e.touches[0].pageX
    let deltaY      = currentY - initialSwipeY
    let deltaX      = currentX - initialSwipeX

    let absY        = Math.abs(deltaY)
    let absX        = Math.abs(deltaX)

    let isYSwipe    = absY > absX

    let oneIfLess = (n) => {
        if(n < 1)   { return 1 }
        else        { return n }
    }

    if(isYSwipe) {
        distance = absY / oneIfLess(absX - swipeRatioForgiveness)
    } else {
        distance = absX / oneIfLess(absY - swipeRatioForgiveness)
    }
    
    let time = (maxSwipeDistance - distance) * swipeFriction

    if(time > maxAnimationTime) {
        stopLoopTouch = true
        return
    } else if(time < minAnimationTime) {
        animationTime = minAnimationTime
    } else {
        animationTime = time
    }

    let swipeDirection, moveDirection

    if(isYSwipe) {
        if(deltaY < 0)  {
            swipeDirection  = "up"
            moveDirection   = moveUp
        } else {
            swipeDirection  = "down"
            moveDirection   = moveDown
        }
    } else {
        if(deltaX < 0) {
            swipeDirection  = "left"
            moveDirection   = moveLeft
        } else {
            swipeDirection  = "right"
            moveDirection   = moveRight
        }
    }

    if(swipeDirection != lastSwipeDirection) {
        stopLoopTouch = true
    } else {
        stopLoopTouch = false
        loopTouch(moveDirection)
    }

    lastSwipeDirection = swipeDirection
}, { passive: false })

window.addEventListener("touchend", (e) => {
    e.preventDefault()

    stopLoopTouch   = true
    initialSwipeY   = null
    initialSwipeX   = null
}, { passive: false })



onclick = (e) => {}



onkeydown = (e) => {
    let key = e.key.toLowerCase()

    animationTime = minAnimationTime

    switch(key) {
        case "arrowup":
        case "w": moveUp()
        break

        case "arrowleft":
        case "a": moveLeft()
        break

        case "arrowdown":
        case "s": moveDown()
        break

        case "arrowright":
        case "d": moveRight()
        break
    }
}



onload = () => {
    board          = get("board")
    helperBlock    = get("helper_block")
    regen()
}



playerIsMoving          = false
stopLoopTouch           = true
swipeFriction           = 2
maxSwipeDistance        = 100
swipeRatioForgiveness   = 20

minAnimationTime    = 70
maxAnimationTime    = 250

radius      = 7.5
margin      = 15
blockPre    = "block"
rowPre      = "row"

let animationTime,
    board,
    boardWidth,
    boardHeight,
    initialSwipeY,
    initialSwipeX,
    lastSwipeDirection,
    helperBlock,
    playerBlock,
    playerY,
    playerX
