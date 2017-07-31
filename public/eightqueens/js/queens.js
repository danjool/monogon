/*
It's called the n queens problem (from chess). Here's how we did it for my A.I. class (as did a lot of others here I'm guessing):
-Populate the grid randomly by putting exactly one in every row randomly, disregarding surroundings, then iterate the next steps until a solution is found.
-Pick a random row where the queen has a conflict.
-Find the spots in the that row that tie for the least number of conflicts if the queen is placed there, then place it in one randomly. (this last bit of randomness is important, otherwise you can get stuck in a loop if you're biased, like choosing the first, for example)
It solves it in a fraction of a second for a 100x100 board. For a 1000x1000, it does it in 6 minutes. This is using Python, but I was told Java is MUCH faster, solving the latter in a few seconds.

https://www.reddit.com/r/math/comments/6qdnwn/i_found_a_nifty_math_problem_at_this_science/dkwi5ie/
*/
let keepLooking = true
let speed = 1
let n = 80;
let cells;
let wrapper = document.getElementsByClassName("wrapper")[0]
let steps = 0

let randint = function(min, max){ return Math.floor(Math.random() * (max - min) + min)}

let init = function( n ){

	//set the css variables
	document.documentElement.style.setProperty("--rowNum", n);
	document.documentElement.style.setProperty("--colNum", n);

	//clear the cell divs
	while (wrapper.firstChild) { wrapper.removeChild( wrapper.firstChild ); }
	//add the cell divs
	for (let i = 0; i < n*n; i++){
		let newcell = document.createElement("div");
		newcell.className = "cell";
		newcell.id = "";
		newcell.dataset.val = "0"
		wrapper.appendChild( newcell )
	}
	cells = document.getElementsByClassName("cell")

	randomlyPlaceNQueens()
} /*end init*/

let randomlyPlaceNQueens = function(){
	for (let y = 0; y < n; y++){
		let x = randint(0 , n)
		toggleQueen( x, y )
	}
}

let toggleQueen= function( x, y ){
	//handles the shadows in all directions
	cells[ y * n + x ].classList.toggle("queen")
	let incr = 0
	if ( cells[ y * n + x ].classList.contains("queen") ) {
		incr = 1
		cells[ y * n + x ].id = ""
	} else {
		incr = -1
		let val = cells[ y * n + x ].dataset.val
		cells[ y * n + x ].id = String.fromCharCode( 96 + Math.min( val, 6 ) )
	}

	for (let i = 1; i < n; i++){
		//for all the cells above and below
		vy = ( y + i ) % n
		incrementCell( x, vy, incr )
		//for all the cells left and right
		hx = ( x + i ) % n
		incrementCell( hx, y, incr )
		//for all the cells diag \
		if (!( hx === (x+i) ^ vy === (y + i) )) 
			incrementCell( hx, vy, incr )
		//for all the cells diag /
		b = y + x
		dx = i - 1
		dy = b - i + 1
		if ( dx >= 0 && dx <= n && dy >= 0 && dy < n ) 
			incrementCell( dx, dy, incr )
	}
}

let incrementCell = function( x, y, amt ){
	amt = typeof amt !== "undefined" ? amt : 1
	j = y * n + x
	if ( j >= n * n ) return
	let cellState = cells[ j ].dataset.val
	
	if ( cellState === "" || cellState === "NaN" ) cellState = "0"
	let val = parseInt( cellState, 10 ) 
	val += amt
	cells[ j ].dataset.val = "" + val
	// min to take care of there only being a few shades of red
	if ( ! cells[j].classList.contains("queen") ) 
		cells[ j ].id = String.fromCharCode( 96 + Math.min( val, 6 ) )
}

let findLeastConflicts = function( y ){
	leastConflicts = []
	least = 999
	for (var x = 0; x < n; x++){
		let cellState = cells[ y * n + x ].dataset.val
		// if ( cells[ y * n + x ].classList.contains("queen") ) continue
		let val = parseInt( cellState, 10 )
		if ( val < least && val >= 0 ){
			least = val
			leastConflicts = [ x ]
		} else if ( val === least && val >= 0 ) {
			leastConflicts.push( x )
		}
	}
	return leastConflicts
}

let findQueen = function( y ){
	for (var x = 0; x < n; x++){
		if ( cells[ y * n + x ].classList.contains("queen") ) return x
	}
}

let moveAQueen = function(){
	let y = randint( 0, n )
	leastConflicts = findLeastConflicts( y )
	let newX = leastConflicts[ randint( 0, leastConflicts.length ) ]

	let oldX = findQueen( y )

	toggleQueen( oldX, y )
	toggleQueen( newX, y )

	steps += 1
	// console.log(steps)
	if (isDone()){
		keepLooking = false
		console.log('steps: ', steps)
	} 

	if (keepLooking) 
		setTimeout( moveAQueen, speed)
}

let isDone = function(){
	for (let i = 0; i < n*n; i++){
		let val = parseInt(cells[i].dataset.val, 10)
		if ( cells[i].classList.contains("queen") && val > 1) {
			// console.log('q', val)
			return false
		}
	}
	// console.log('true')
	return true
}

init(n)

setTimeout( moveAQueen, speed)