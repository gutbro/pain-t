
// TODO:
// Herramienta linea
// Organizar colores arrastrándolos
// Tamaño de paleta
// Reemplazar color arrastrándolo


class PainT {

	result = [];
	history = [];
	temp = [];
	tool = "pencil";
	mouse = {pressed: false, click: false};

	tpl = {
		"layout"	: `
			<div id="layout">
				<div id="toolsWrap">
					<button class="tool pencil" data-tool="pencil"></button>
					<button class="tool bucket" data-tool="bucket"></button>
					<button class="tool line" data-tool="line"></button>
				</div>
				<div id="paletteWrap"></div>
				<div id="propertiesWrap"></div>
				<div id="canvasWrap"></div>
				<div id="colorWrap"></div>
			</div>
		`,
		"form"	: `<div>Width: <input type="text" name="width" value="16" /><br/>Height: <input type="text" name="height" value="32" /></div>`,
		"palette"	: `{{#colors}}<button class="palette-color" style="background-color: {{color}}" data-color="{{color}}">{{n}}</button>{{/colors}}`
	};

	constructor(){
		this.size = {
			w: 16,
			h: 32,
			z: 25
		};

		this.result = new Array(this.size.w * this.size.h).fill("#ffffff");
		this.clearTemp();

		this.layout = $(Mustache.render(this.tpl.layout)).appendTo(document.body);

		$("<canvas>").attr("id", "pain-t").appendTo("#canvasWrap");
		
		this.canvas = $("#pain-t");
		this.palette = $("#paletteWrap");

		this.ctx = this.canvas[0].getContext("2d");
		this.clear();
		this.setColor("000000");
		this.showPalette();
		this.setTool("line");
		this.setZoom(this.size.z);

		$(Mustache.render(this.tpl.form)).appendTo("#propertiesWrap");


		$(document).on("mousedown", "#pain-t", this.start.bind(this));
		$(document).on("mousemove", "#pain-t", this.move.bind(this));
		$(document).on("mouseup", "#pain-t", this.end.bind(this));
		$(document).on("mouseleave", "#pain-t", this.end.bind(this));
		$(document).on("click", ".palette-color", this.setColor2.bind(this));
		$(document).on("click", ".tool", this.setTool2.bind(this));
		$(document).on("contextmenu", "#pain-t", e=>e.preventDefault());
		$(document).on("wheel", "#layout", this.wheel.bind(this));

		$(document).on("keydown", this.keys.bind(this));
		$(document).on("keyup", this.keys2.bind(this));

		$("<div>").attr("id", "colorPalette").appendTo("#colorWrap");

		$("#colorPalette").colpick({
			flat: true,
			layout: "hex",
			height: 220,
			onChange: (C, hexvalue, rgb, A, E) => this.setColor(hexvalue)
		});
	}


	setZoom(zoom){
		this.size.z = zoom;
		this.canvas.attr("width", this.size.w * this.size.z);
		this.canvas.attr("height", this.size.h * this.size.z);
		this.canvas.css({width: this.size.w * this.size.z, height: this.size.h * this.size.z});
		this._reDraw();
	}


	wheel(e){
		if(e.shiftKey){

			e.preventDefault();
			e.stopPropagation();
			e.originalEvent.preventDefault();
			e.originalEvent.stopPropagation();
			
			let neu = this.size.z + (e.originalEvent.deltaY < 0 ? 3 : -3);
			if(neu > 30) neu = 30;
			if(neu < 1) neu = 1;

			this.setZoom(neu);

			return false;
		}
	}

	start(e){
		e.preventDefault();

		// Pick color
		if(e.button == 0 && e.shiftKey){
			
			return false;
		}

		if(["pencil", "line"].includes(this.tool)){
			
			// Click Normal
			if(e.button == 0 && !e.shiftKey){
				this.mouse.pressed = true;
				this.mouse.click = 0;

			// Click Derecho
			} else if(e.button == 2){
				this.mouse.pressed = true;
				this.mouse.click = 2;
			}
		}

		if(this.mouse.pressed && this.tool == "pencil"){
			let pos = this._getPos(e);
			this.tempDot(pos.x, pos.y, this.mouse.click);
		}

		this._reDraw();
		
		if(this.mouse.pressed && this.tool == "line"){
			this.lineStart =this._getPos(e);
		}

	}

	move(e){
		let pos = this._getPos(e);

		if(this.tool == "pencil"){
			
			// Dibuja en el array temporal
			if(this.mouse.pressed){
				this.tempDot(pos.x, pos.y, this.mouse.click);
				this._reDraw();
			}
			else {
			}
		}

		if(this.tool == "line"){
			if(this.mouse.pressed){
				this.clearTemp();
				this._reDraw();
				
				this.lineEnd = this._getPos(e);
				let line = this.line(this.lineStart.x, this.lineStart.y, this.lineEnd.x, this.lineEnd.y);
				for(let i in line){
					this.tempDot(line[i].x, line[i].y, 0);
				}
				this._reDraw();
			}
		}

				this._reDraw();
				this.dot(pos.x, pos.y, "rgba(128,128,128,.5)");
		
	}

	end(e){

		// Pick color
		if(e.shiftKey){
			this.setColor(this.result[this._getOffset(e)]);

			return false;
		}

		if(this.tool == "bucket"){

			if(e.type != "mouseleave"){

				this.pushHistory();

				// Rellena
				let pos = this._getPos(e);

				let offset = (pos.y * this.size.w) + pos.x;
				if(this.result[offset] == this.currentColor) return true;

				this.temp = this.result;

				this.fill(offset, this.result[offset]);

				this.canonize();
			}
		}


		else if(this.tool == "pencil"){

			// SI PRESIONANDO
			if(this.mouse.pressed){

				// SI NO FUE POR ABANDONO
				if(e.type != "mouseleave"){
					let pos = this._getPos(e);
					this.tempDot(pos.x, pos.y, this.mouse.click);
				}

				// Copia TEMP
				if(this.temp.filter(e=>e)){

					// Guarda captura
					this.pushHistory();
					this.canonize();

				}
			}
		}
		
		if(this.tool == "line"){
			if(this.mouse.pressed){
				if(e.type != "mouseleave"){
					this.pushHistory();
					console.log("LINE END");
					this.canonize();
				}
			}
		}


		this.mouse.pressed = false;
		this._reDraw();
		this.showPalette();
	}
	
	fill(offset, color){
		
		// Busca adyacentes
		// Colorea cada uno si coinciden con punto
		// Cada coloreado busca adyacentes

		let adjacent = getAdjacentIndices(offset, this.size.w, this.size.h);

		this.tempPos(offset, 0);

		for(let i in adjacent){
			let it = adjacent[i];

			// Si el punto existe y es el mismo color, cambia
			if(it != null && this.temp[it] == color) {
				this.tempPos(it, 0);
				
				this.fill(it, color);
			}
		}

	}


	canonize(){

		// Copia los items existentes de temp al result
		for(let i in this.temp) {
			let it = this.temp[i];

			if(typeof it !== "boolean") this.result[i] = it;
			if(it === true) this.result[i] = "#ffffff";
		}

		// Vacía temp
		this.clearTemp();
	}




	line(x1, y1, x2, y2) {
		let points = [];

		const dx = x2 - x1;
		const dy = y2 - y1;

		const steps = Math.max(Math.abs(dx), Math.abs(dy));

		for (let i = 0; i <= steps; i++) {
			let x = Math.round(x1 + dx * (i / steps));
			let y = Math.round(y1 + dy * (i / steps));
			points.push({x: x, y: y});
		}

		return points;
	}
	


	keys(e){
		
		// SET COLOR
		if(e.keyCode >= 49 && e.keyCode <= 57){
			e.preventDefault();
			
			let i = e.keyCode - 48;
			let color = this.palette.find(".palette-color:nth-child(" + i + ")").data("color");
			this.setColor(color);
			
			return true;
		}



		if(e.shiftKey){
			this.canvas.addClass("eyedropper");
		} else {
			this.canvas.removeClass("eyedropper");
		}

		switch(e.keyCode){
			case 81: // q
				this.setTool("pencil");
			break;
			case 87: // w
				this.setTool("bucket");
			break;
			case 69: // e
				this.tool = "";
			break;
			case 82: // r
				this.tool = "";
			break;
		}

		// UNDO
		if(e.ctrlKey == true && e.keyCode == 90){
			e.preventDefault;
			this.stepBack();
			this._reDraw();
			return false;
		}
	}
	
	keys2(e){
		if(!e.shiftKey){
			this.canvas.removeClass("eyedropper");
		}
	}


	showPalette(){
		let palette = this.result.reduce((acc, curr) => acc.includes(curr) ? acc : [...acc, curr], []);

		for(let i in palette){
			palette[i] = {color: palette[i], n: parseInt(i) + 1};
		}

		$("#paletteWrap").empty().append(Mustache.render(this.tpl.palette, {colors: palette}))

		this.setColor(this.currentColor);
	}


	setTool2(e){
		this.setTool($(e.currentTarget).data("tool"));
	}

	setTool(tool){
		this.tool = tool;
		$(".tool").removeClass("current");
		$("." + tool).addClass("current");
		this.canvas.removeClass("bucket pencil eyedropper").addClass(tool);
		this._reDraw();
	}


	_reDraw(){
		this.clear();

		for(let i in this.result	) this.dot(i % this.size.w, Math.floor(i / this.size.w), this.result[i]);
		if(this.temp.filter(e=>e))
		for(let i in this.temp		) if(this.temp[i]) this.dot(i % this.size.w, Math.floor(i / this.size.w), this.temp[i]);
	}
	
	clear(){
		this.ctx.fillStyle = "white";
		this.ctx.fillRect(0, 0, this.size.w * this.size.z, this.size.h * this.size.z);
	}

	setColor(color){
		this.currentColor = color.charAt(0) !== '#' ? '#' + color : color;
		this.ctx.fillStyle = this.currentColor;
		this.palette.find(".palette-color").removeClass("current");
		this.palette.find("[data-color=" + this.currentColor + "]").addClass("current");
	}
	
	setColor2(e){
		this.setColor($(e.currentTarget).data("color"));
	}



	pushHistory(){
		this.history.push([...this.result]);
	}

	stepBack(){
		if(this.history.length) this.result = [...this.history.pop()];
	}

	dot(x, y, color) {
		this.ctx.fillStyle = color;
		this.ctx.fillRect(x * this.size.z, y * this.size.z, this.size.z, this.size.z);
	}


	clearTemp(){
		this.temp = new Array(this.size.w * this.size.h).fill(false);
	}

	tempDot(x, y, draw) {
		this.tempPos((y * this.size.w) + x, draw);
	}

	tempPos(offset, draw){
		this.temp[offset] = draw == 0 ? this.currentColor : true;
	}


	// Devuelve la posición del resultado (no del canvas)
	_getPos(e){
		const rect = this.canvas[0].getBoundingClientRect();

		// Calcular el offset según el zoom
		let pos = {
			x: Math.floor((e.clientX - rect.left) / this.size.z),
			y: Math.floor((e.clientY - rect.top ) / this.size.z)
		};

		return pos;
	}
	
	_getOffset(e){
		let pos = this._getPos(e);
		return (pos.y * this.size.w) + pos.x;
	}
}
function getAdjacentIndices(index, width, height) {
		const rowSize = width; // En este caso, 16
		const totalSize = width * height; // En este caso, 256

		const up = index - rowSize >= 0 ? index - rowSize : null;
		const down = index + rowSize < totalSize ? index + rowSize : null;
		const left = index % rowSize !== 0 ? index - 1 : null;
		const right = (index + 1) % rowSize !== 0 ? index + 1 : null;

		return { up, down, left, right };
	}