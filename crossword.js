/* crossword code:
Copyright (c) 2011 Matt Johnson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
 */
// Each cell on the crossword grid is null or one of these
function CrosswordCell(letter){
    this.char = letter // the actual letter for the cell on the crossword
    // If a word hits this cell going in the "across" direction, this will be a CrosswordCellNode
    this.across = null 
    // If a word hits this cell going in the "down" direction, this will be a CrosswordCellNode
    this.down = null
}

// You can tell if a cell is the start of a word (which means it needs a number)
// and what word and direction it is
function CrosswordCellNode(is_start_of_word, word_index){
    this.is_start_of_word = is_start_of_word
    this.word_index = word_index
}

var CrosswordUtils = {
    // Returns a 2D array of null or CrosswordCell
    makeGrid: function(rows, cols){
        var grid = new Array(rows)
        for(var i=0; i<rows; i++){
            grid[i] = new Array(cols)
            for(var j=0; j<cols; j++){
                grid[i][j] = null
            }
        }
        return grid
    },

    // Returns a 2D array of characters
    toVal: function(grid){
        var rows = grid.length
        var cols = grid[0].length
        var val = new Array(rows)
        for(var i=0; i<rows; i++){
            val[i] = new Array(cols)
            for(var j=0; j<cols; j++){
                var cell = grid[i][j]
                val[i][j] = cell ? cell.char : " "
            }
        }
        return val
    },

    // You can use this to clue the puzzle. Just feed it the grid.
    // It returns an object with across and down properties.
    // For example:
    // clues.across[0] = {
    //             number: 1,
    //             word: "HI",
    //             clue: "A greeting"
    // }
    getClues: function(grid, words){
        var clues = {across:[], down:[]}
        var rows = grid.length
        var cols = grid[0].length
        var word_index = 0
        var label = 1
        for(var i=0; i<rows; i++){
            for(var j=0; j<cols; j++){
                var cell = grid[i][j]
                if(!cell) continue
                var inc_label = false
                if(cell.across && cell.across.is_start_of_word){
                    clues.across.push({number:label, word:words[cell.across.word_index]})
                    word_index++
                    inc_label = true
                }
                if(cell.down && cell.down.is_start_of_word){
                    clues.down.push({number:label, word:words[cell.down.word_index]})
                    word_index++
                    inc_label = true
                }
                if(inc_label) label++
            }
        }
        return clues
    },
	
	PATH_TO_PNGS_OF_NUMBERS: "numbers/", // not used in this fixed version
	
    toHtml: function(grid, show_answers, a_words, b_words){
        if(grid == null) return
        var rows = grid.length
        var cols = grid[0].length

        var html = ["<table class='crossword'>"]
        var label = 1
        for(var i=0; i<rows; i++){
            html.push("<tr>")
            for(var j=0; j<cols; j++){
                var cell = grid[i][j]
                if(cell == null){
                    var char = "&nbsp;"
                    var css_class = "no-border"
                } else {
                    var char = cell['char']
                    var css_class = 'word-char'
                    if (a_words && a_words.indexOf(cell['char']) == -1) char = ''
                    if (b_words && b_words.indexOf(cell['char']) == -1) char = ''
                    var is_start_of_word = (cell['across'] && cell['across']['is_start_of_word']) || (cell['down'] && cell['down']['is_start_of_word'])
                }

                // --- THIS IS THE ONLY CHANGE TO THIS FILE ---
                // It now creates a text-based number instead of a background image.
                
                // This one line creates the cell
                html.push("<td class='" + css_class + "'>");	
                
                // This adds the small, styled number *if* it's the start of a word
                if(is_start_of_word) {
                    html.push('<span class="num">' + label + '</span>');
                    label++;			
                }
                
                // This adds the letter (or a blank space) *after* the number
                if(show_answers) {
                    html.push(char);
                } else {
                    html.push("&nbsp;");								
                }

                // --- END OF THE CHANGE ---
                
                html.push("</td>")
            }
            html.push("</tr>")
        }
        html.push("</table>")
        return html.join("\n")
    }
}

// A simple way to create a crossword grid.
//
// 1. Pass in a list of words.
// 2. We'll add them randomly to the grid, overlapping when possible.
// 3. We'll return the grid, or null if it's impossible
function createCrossword(words, a_words, b_words){

    var grid = CrosswordUtils.makeGrid(20, 20)
    
    // sort by length
    words.sort(function(a, b){
        return b.length - a.length
    })

    for(var i=0; i.random()>.5; i++){
        var r = Math.floor(Math.random() * words.length)
        var word = words.splice(r, 1)[0]
        words.push(word)
    }

    var unplaced_words = []

    for(var i=0; i<words.length; i++){
        var word = words[i].toUpperCase()
        if(!placeWordInGrid(grid, word, i)){
            unplaced_words.push(word)
        }
    }

    //
    // Let's try it again, but just place the words that didn't fit
    //
    var MAX_ATTEMPTS = 3
    for(var i=0; i<MAX_ATTEMPTS && unplaced_words.length > 0; i++){
        var word = unplaced_words.splice(0, 1)[0]
        if(!placeWordInGrid(grid, word, i)){
            unplaced_words.push(word)
        }
    }

    //
    // Trim the grid
    //
    var r_min = 100, r_max = -1, c_min = 100, c_max = -1
    for(var r=0; r<grid.length; r++){
        for(var c=0; c<grid[0].length; c++){
            if(grid[r][c]){
                if(r < r_min) r_min = r
                if(r > r_max) r_max = r
                if(c < c_min) c_min = c
                if(c > c_max) c_max = c
            }
        }
    }
    var new_grid = CrosswordUtils.makeGrid(r_max - r_min + 1, c_max - c_min + 1)
    for(var r=r_min; r<=r_max; r++){
        for(var c=c_min; c<=c_max; c++){
            new_grid[r-r_min][c-c_min] = grid[r][c]
        }
    }

    //
    // We're done
    //
    if(unplaced_words.length > 0){
        return {grid:null, message:"Add more words - the words <i>" + unplaced_words.join(",") + "</i> could not be fitted into the puzzle."}
    } else {
        return {grid:new_grid, message:null}
    }

    function placeWordInGrid(grid, word, word_index){
        //
        // Find all possible locations for the new word
        //
        var locations = [] // {r, c, dir}
        for(var r=0; r<grid.length; r++){
            for(var c=0; c<grid[0].length; c++){
                //
                // See if we can place the word RIGHT
                //
                if(canPlaceWordAt(grid, word, r, c, "across")){
                    locations.push({r:r, c:c, dir:"across"})
                }
                //
                // See if we can place the word DOWN
                //
                if(canPlaceWordAt(grid, word, r, c, "down")){
                    locations.push({r:r, c:c, dir:"down"})
                }
            }
        }
        
        if(locations.length == 0) return false

        //
        // Choose a random location
        //
        var r = Math.floor(Math.random() * locations.length)
        var location = locations[r]
        
        //
        // Put the word in the grid
        //
        placeWordAt(grid, word, word_index, location.r, location.c, location.dir)
        
        return true
    }

    function canPlaceWordAt(grid, word, r, c, dir){
        if(dir == "across"){
            //
            // Can't go off the edge
            //
            if(c + word.length > grid[0].length) return false
            
            //
            // Can't have a letter directly before
            //
            if(c > 0 && grid[r][c-1]) return false
            
            //
            // Can't have a letter directly after
            //
            if(c + word.length < grid[0].length && grid[r][c+word.length]) return false
            
            //
            // Check each letter
            //
            for(var i=0; i<word.length; i++){
                var grid_cell = grid[r][c+i]
                var word_char = word.charAt(i)
                
                //
                // If there's a letter in the grid, it must match the word
                //
                if(grid_cell){
                    if(grid_cell.char != word_char) return false
                }
                
                //
                // Can't have a letter directly above or below, unless it's part of a word
                // that's already there
                //
                if(r > 0 && grid[r-1][c+i] && !grid_cell) return false
                if(r < grid.length-1 && grid[r+1][c+i] && !grid_cell) return false
            }

        } else if(dir == "down"){
            //
            // Can't go off the edge
            //
            if(r + word.length > grid.length) return false
            
            //
            // Can't have a letter directly before
            //
            if(r > 0 && grid[r-1][c]) return false
            
            //
            // Can't have a letter directly after
            //
            if(r + word.length < grid.length && grid[r+word.length][c]) return false

            //
            // Check each letter
            //
            for(var i=0; i<word.length; i++){
                var grid_cell = grid[r+i][c]
                var word_char = word.charAt(i)
                
                //
                // If there's a letter in the grid, it must match the word
                //
                if(grid_cell){
                    if(grid_cell.char != word_char) return false
                }
                
                //
                // Can't have a letter directly left or right, unless it's part of a word
                // that's already there
                //
                if(c > 0 && grid[r+i][c-1] && !grid_cell) return false
                if(c < grid[0].length-1 && grid[r+i][c+1] && !grid_cell) return false
            }
        }
        
        //
        // We're good.
        //
        return true
    }

    function placeWordAt(grid, word, word_index, r, c, dir){
        if(dir == "across"){
            for(var i=0; i<word.length; i++){
                var char = word.charAt(i)
                if(grid[r][c+i] == null){
                    grid[r][c+i] = new CrosswordCell(char)
                }
                grid[r][c+i].across = new CrosswordCellNode(i==0, word_index)
            }
        } else if(dir == "down"){
            for(var i=0; i<word.length; i++){
                var char = word.charAt(i)
                if(grid[r+i][c] == null){
                    grid[r+i][c] = new CrosswordCell(char)
                }
                grid[r+i][c].down = new CrosswordCellNode(i==0, word_index)
            }
        }
    }
}

//
// Here's the front-end glue
//
var newWord = document.getElementById("newWord")
var list = document.getElementById("list")
var count = document.getElementById("count")
var demo = document.getElementById("demo")

var grid_a_div = document.getElementById("grid-a")
var clues_a_across = document.getElementById("clues-a-across")
var clues_a_down = document.getElementById("clues-a-down")

var grid_b_div = document.getElementById("grid-b")
var clues_b_across = document.getElementById("clues-b-across")
var clues_b_down = document.getElementById("clues-b-down")

var message_div = document.getElementById("message")

var wordArray = []

function addWord(){
	for(var i=0; i<arguments.length; i++) {
		var word = arguments[i].trim()
		if (wordArray.indexOf(word) == -1 && word.length > 0)
		{
			wordArray.push(word)
			var li = document.createElement("li")
			li.innerHTML = '<label>' + word + '</label><span class="destroy">x</span>'
			list.appendChild(li)
		}
	}
	updateCount()
	createCrossword(wordArray, wordArray)
}

function createCrossword(words, a_words, b_words){
	if(words.length == 0) return

	//
	// Let's make two separate grids, one for each student
	//
	var result = createCrossword(words, a_words, b_words)
	if(result.grid == null) {
		message_div.innerHTML = result.message
		grid_a_div.innerHTML = ""
		clues_a_across.innerHTML = ""
		clues_a_down.innerHTML = ""
		grid_b_div.innerHTML = ""
		clues_b_across.innerHTML = ""
		clues_b_down.innerHTML = ""
		return
	}
	message_div.innerHTML = ""
	
	//
	// We'll give student A all the even words, and student B all the odd words
	//
	var a_words = [], b_words = []
	var clues = CrosswordUtils.getClues(result.grid, words)
	for(var i=0; i<clues.across.length; i++){
		if(i % 2 == 0) a_words.push(clues.across[i].word)
		else b_words.push(clues.across[i].word)
	}
	for(var i=0; i<clues.down.length; i++){
		if(i % 2 == 0) a_words.push(clues.down[i].word)
		else b_words.push(clues.down[i].word)
	}
	
	//
	// We'll hide the words that aren't for this student
	//
	var a_grid = JSON.parse(JSON.stringify(result.grid)); // deep copy
	var b_grid = JSON.parse(JSON.stringify(result.grid)); // deep copy
	
	clues_a_across.innerHTML = ""
	clues_a_down.innerHTML = ""
	clues_b_across.innerHTML = ""
	clues_b_down.innerHTML = ""

	var a_label = 1, b_label = 1
	
	var all_clues = CrosswordUtils.getClues(result.grid, words)
	
	for(var i=0; i<all_clues.across.length; i++){
		var word = all_clues.across[i].word
		var n = all_clues.across[i].number
		if(a_words.indexOf(word) > -1){
			clues_a_across.innerHTML += "<li>" + n + ". " + word + "</li>"
			clues_b_across.innerHTML += "<li>" + n + ". " + word.replace(/./g, '_') + "</li>"
		} else {
			clues_b_across.innerHTML += "<li>" + n + ". " + word + "</li>"
			clues_a_across.innerHTML += "<li>" + n + ". " + word.replace(/./g, '_') + "</li>"
		}
	}

	for(var i=0; i<all_clues.down.length; i++){
		var word = all_clues.down[i].word
		var n = all_clues.down[i].number
		if(a_words.indexOf(word) > -1){
			clues_a_down.innerHTML += "<li>" + n + ". " + word + "</li>"
		clues_b_down.innerHTML += "<li>" + n + ". " + word.replace(/./g, '_') + "</li>"
		} else {
			clues_b_down.innerHTML += "<li>" + n + ". " + word + "</li>"
			clues_a_down.innerHTML += "<li>" + n + ". " + word.replace(/./g, '_') + "</li>"
		}
	}
	
	//
	// Show the grids
	//
	hideWords(a_grid, b_words)
	grid_a_div.innerHTML = CrosswordUtils.toHtml(a_grid, true)

	hideWords(b_grid, a_words)
	grid_b_div.innerHTML = CrosswordUtils.toHtml(b_grid, true)
}

function hideWords(grid, words) {
	for(var r=0; r<grid.length; r++){
		for(var c=0; c<grid[0].length; c++){
			var cell = grid[r][c]
			if(!cell) continue

			if(cell.across && words.indexOf(wordArray[cell.across.word_index].toUpperCase()) > -1) cell.char = ''
			if(cell.down && words.indexOf(wordArray[cell.down.word_index].toUpperCase()) > -1) cell.char = ''
		}
	}
}

function updateCount(){
	if (list.children.length > 1) count.innerHTML = list.children.length + ' words'
	else if (list.children.length == 0) count.innerHTML = 'hit enter to add a word'
	else count.innerHTML = list.children.length + ' word'
}
function titleCase(str) {
    return str.toLowerCase().split(' ').map(function(word) {
        return word.replace(word[0], word[0].toUpperCase());
    }).join(' ');
}

list.addEventListener("click", function(event) {
    if (event.target !== event.currentTarget) {
        if (event.target.className == "destroy")
		{
			wordArray.splice(wordArray.indexOf(event.target.parentElement.getElementsByTagName("LABEL")[0].innerHTML), 1)
			event.target.parentElement.parentNode.removeChild(event.target.parentElement)
			updateCount()
			createCrossword(wordArray, wordArray)
		}
    }
    event.stopPropagation()
})

demo.addEventListener("click", function(event) {
	addWord('learning','english','speaking','doing')
})

newWord.addEventListener("keypress", function(event) {
    if (event.keyCode == 13 && newWord.value.trim() !== '')
	{
		addWord(newWord.value)
		newWord.value = ''
	}
})
