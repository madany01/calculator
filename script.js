'use strict'

const STAGE_A = 0
const STAGE_A_OP = 1
const STAGE_A_OP_B = 2
const STAGE_R_A_OP_B = 3


const ADD_OPTION = '+'
const SUB_OPTION = '-'
const MUL_OPTION = '*'
const DIV_OPTION = '/'
const BACKSPACE_OPTION = 'Backspace'
const CE_OPTION = ' '
const C_OPTION = 'C'
const EQUAL_OPTION = '='
const DOT_OPTION = '.'
const NEG_OPTION = '`'



const keyHandlerMap = new Map([
	[ADD_OPTION, handleOperatorInput],
	[SUB_OPTION, handleOperatorInput],
	[MUL_OPTION, handleOperatorInput],
	[DIV_OPTION, handleOperatorInput],
	[BACKSPACE_OPTION, handleBackspaceInput],
	[CE_OPTION, handleCEInput],
	[C_OPTION, handleCInput],
	[EQUAL_OPTION, handleEqualInput],
	[DOT_OPTION, handleDotInput],
	[NEG_OPTION, handleNegInput],
])

const operatorFunctionMap = new Map([
	[ADD_OPTION, add],
	[SUB_OPTION, sub],
	[MUL_OPTION, mul],
	[DIV_OPTION, div],
])

const operatorSignMap = new Map([
	[ADD_OPTION, '+'],
	[SUB_OPTION, '-'],
	[MUL_OPTION, '×'],
	[DIV_OPTION, '÷'],
])

const state = {
	a: '0',
	op: null,
	b: null,
	r: null,
	stage: STAGE_A,
	prevStage: null,
	error: false,

	moveToStage(stage) {
		[this.stage, this.prevStage] = [stage, this.stage]
	},
	reset() {
		this.a = '0'
		this.b = this.op = this.r = null
		this.stage = STAGE_A
		this.prevStage = null
		this.error = false
	}
}

const calcContainer = document.querySelector('.calc')
const keypadContainer = document.querySelector('.cells')
const historyScreenElt = document.querySelector('.screen .history')
const resultScreenElt = document.querySelector('.screen .result')




function displayMainValue() {
	let value = state.a
	if (state.stage === STAGE_A_OP_B) value = state.b
	else if (state.stage === STAGE_R_A_OP_B) value = state.r

	resultScreenElt.innerHTML = value
}


function displayPreviousValues() {
	if (![STAGE_A_OP, STAGE_R_A_OP_B].includes(state.stage)) return

	historyScreenElt.scrollTop = historyScreenElt.scrollHeight

	if (state.stage === STAGE_R_A_OP_B) {
		historyScreenElt.innerHTML = ''
		return
	}

	if (state.prevStage === state.stage) {
		historyScreenElt.lastElementChild.textContent = operatorSignMap.get(state.op)
		return
	}

	const value = state.prevStage === STAGE_A_OP_B ? state.b : state.a

	historyScreenElt.insertAdjacentHTML('beforeend', `
		<span class="number">${value}</span>
		<span class="operator">${operatorSignMap.get(state.op)}</span>
	`)
}


function clearScreen() {
	calcContainer.classList.remove('error')
	historyScreenElt.innerHTML = ''
	resultScreenElt.innerHTML = '0'
}


function renderAll() {
	displayMainValue()
	displayPreviousValues()
}


function renderError() {
	historyScreenElt.innerHTML = ''
	resultScreenElt.innerHTML = 'Math Error ♾'
	calcContainer.classList.add('error')
}


function isNumeric(str) {
	return /^\d+$/.test(str)
}


function add(a, b) {
	return a + b
}


function sub(a, b) {
	return a - b
}


function mul(a, b) {
	return a * b
}


function div(a, b) {
	const res = a / b
	if (isFinite(res)) return res
	throw new TypeError
}


function flipSign(number) {
	if (typeof number === 'string') {
		if (number.includes('-')) return number.replace('-', '')
		return `-${number}`
	}

	return -number
}




function addDigit(number, digit) {
	return `${number === '0' ? '' : number}${digit}`
}


function backspace(number) {
	number = number.slice(0, -1)
	number = number === '' || number === '-' ? '0' : number
	return number
}


function addDot(number) {
	if (number.includes('.')) return number
	return `${number}.`
}





function operate(op, a, b) {
	return operatorFunctionMap.get(op)(Number(a), Number(b))
}




function handleDigitInput(digit) {
	let nextStage = state.stage

	switch (state.stage) {
		case STAGE_A:
			state.a = addDigit(state.a, digit)
			break

		case STAGE_A_OP:
			state.b = digit
			nextStage = STAGE_A_OP_B
			break

		case STAGE_A_OP_B:
			if(typeof state.b === 'string'){
				state.b = addDigit(state.b, digit)
			}
			else{
				state.b = digit
			}
			break

		case STAGE_R_A_OP_B:
			state.a = digit
			nextStage = STAGE_A
			break
	}

	state.moveToStage(nextStage)
}


function handleOperatorInput(op) {
	let nextStage = state.stage

	switch (state.stage) {
		case STAGE_A:
			state.op = op
			nextStage = STAGE_A_OP
			break

		case STAGE_A_OP:
			state.op = op
			break

		case STAGE_A_OP_B:
			state.a = operate(state.op, state.a, state.b)
			state.op = op
			nextStage = STAGE_A_OP
			break

		case STAGE_R_A_OP_B:
			state.a = state.r
			state.op = op
			nextStage = STAGE_A_OP
			break
	}
	state.moveToStage(nextStage)
}


function handleEqualInput() {
	let nextStage = state.stage

	switch (state.stage) {
		case STAGE_A:
			if (state.b !== null && state.op !== null) {
				state.r = operate(state.op, state.a, state.b)
				nextStage = STAGE_R_A_OP_B
			}
			break

		case STAGE_A_OP:
			state.b = state.a
			state.r = operate(state.op, state.a, state.b)
			nextStage = STAGE_R_A_OP_B
			break

		case STAGE_A_OP_B:
			state.r = operate(state.op, state.a, state.b)
			nextStage = STAGE_R_A_OP_B
			break

		case STAGE_R_A_OP_B:
			state.a = state.r
			state.r = operate(state.op, state.a, state.b)
			break
	}
	state.moveToStage(nextStage)
}


function handleCEInput() {
	let nextStage = state.stage

	switch (state.stage) {
		case STAGE_A:
			state.a = '0'
			break

		case STAGE_A_OP:
			state.b = '0'
			nextStage = STAGE_A_OP_B
			break

		case STAGE_A_OP_B:
			state.b = '0'
			break

		case STAGE_R_A_OP_B:
			state.a = '0'
			nextStage = STAGE_A
			break
	}
	state.moveToStage(nextStage)
}


function handleDotInput() {
	let nextStage = state.stage

	switch (state.stage) {
		case STAGE_A:
			state.a = addDot(state.a)
			break

		case STAGE_A_OP:
			state.b = '0.'
			nextStage = STAGE_A_OP_B
			break

		case STAGE_A_OP_B:
			if(typeof state.b !== 'string'){
				state.b = '0'
			}
			state.b = addDot(state.b)
			break

		case STAGE_R_A_OP_B:
			state.a = '0.'
			nextStage = STAGE_A
			break
	}
	state.moveToStage(nextStage)
}


function handleBackspaceInput() {
	let nextStage = state.stage

	switch (state.stage) {
		case STAGE_A:
			state.a = backspace(state.a)
			break

		case STAGE_A_OP:
			// not allowed
			break

		case STAGE_A_OP_B:
			if(typeof state.b === 'string'){
				state.b = backspace(state.b)
			}
			break

		case STAGE_R_A_OP_B:
			// not allowed
			break
	}
	state.moveToStage(nextStage)
}


function handleNegInput() {
	let nextStage = state.stage

	switch (state.stage) {
		case STAGE_A:
			state.a = flipSign(state.a)
			break

		case STAGE_A_OP:
			state.b = flipSign(state.a)
			nextStage = STAGE_A_OP_B
			break

		case STAGE_A_OP_B:
			state.b = flipSign(state.b)
			break

		case STAGE_R_A_OP_B:
			state.r = flipSign(state.r)
			break
	}
	state.moveToStage(nextStage)
}


function handleCInput() {
	clearScreen()
	state.reset()
}


function handleInput(input, isDigit) {
	const handler = isDigit ? handleDigitInput : keyHandlerMap.get(input)

	if (state.error && input !== C_OPTION) return

	try {
		handler(input)
	} catch (error) {
		state.error = true
		renderError()
		return
	}

	renderAll()
}




keypadContainer.addEventListener('click', e => {
	const target = e.target
	const numberBtn = target.closest('.number')
	const optionBtn = target.closest('.option')

	if (!numberBtn && !optionBtn) return

	if (numberBtn) {
		const digit = numberBtn.dataset.digit
		handleInput(digit, true)
	} else {
		const option = optionBtn.dataset.option
		handleInput(option, false)
	}
})


window.addEventListener('keydown', e => {
	// e.preventDefault()
	const key = e.key
	if (isNumeric(key)) {
		handleInput(key, true)
		return
	}

	if (key.toUpperCase() === C_OPTION) handleInput(C_OPTION, false)
	else if (key === 'Enter') handleInput(EQUAL_OPTION, false)
	else if (keyHandlerMap.has(key)) handleInput(key, false)
})

