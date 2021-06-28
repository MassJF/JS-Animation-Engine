//Create at 2014/04/14 by Ma

//Abstract Canvas class
function Canvas(canvas, fps, width, height){
	this.width = width;
	this.height = height;
	this.context = canvas.getContext("2d");
	this.fps = fps;
	this.timer = null;
	this.graphicObjects = [];
	this.movingGraphicObjects = [];
	this.erase = true;
}

Canvas.prototype = {
		
		//canvas begin animation
		begin:function(){
			
			if(!this.timer){
				this.timer = setInterval((function(canvas){
					return function(){canvas.startRender();}
				})(this), 1000 / this.fps);
			}
		},
		
		//start render 
		startRender:function(){
			if(this.erase){
				this.context.clearRect(0, 0, this.width, this.height);
			}

			for(var i = 0; i < this.graphicObjects.length; i++){
				var gpcObj = this.graphicObjects[i];
				
				if(typeof(gpcObj) == "function")
					continue;
				
				if(gpcObj.deformWithAnimated){
					gpcObj.deform();
				}else if(gpcObj.moving){
					gpcObj.move();
//					alert("moving");
				}
				
				gpcObj.draw();
			}
		},
		
		addGraphicObject:function(graphicObject){
			this.graphicObjects.push(graphicObject);
		},
		
		stopRender:function(){
			clearInterval(this.timer);
			this.timer = null;
//			alert("render had stopped");
		},
		
		clear:function(){
			this.graphicObjects.empty();
		},
}

function GraphicObject(context){
	this.speed = {x:0, y:0};
	this.context = context;
	this.childs = [];
//	this.moving = false;
	this.deformWithAnimated = false;
	this.style = null;
}

GraphicObject.prototype = {
		
		draw:function(){
			
		},
		
		deform:function(){
			
		},
		
		move:function(){
			this.moving = true;
			this.x += this.speed.x;
			this.y += this.speed.y;
			
			if(this.childs != null && this.childs.length > 0){
				
				for(var i = 0; i < this.childs.length; i++){
					this.childs[i].speed = this.speed;
					this.childs[i].move();
				}
			}
		},
		
		deformEachTopPoints:function(points, duration){
			
		},
		
		stopMove:function(){
			this.moving = false;
		},
		
		appendChild:function(child){
			this.childs.push(child);
		},
		
		drawChilds:function(){
			
			for(var i = 0; i < this.childs.length; i++){
				this.childs[i].draw();
			}
		},
}

//PolygonGraghicObject
function PolygonGraghicObject(canvas, points, style){
	if(canvas == null) return;

	GraphicObject.call(this, canvas.context);
	this.canvas = canvas;
	this.currentPoints = points;
	this.toPoints = null;
	this.pointCount = this.currentPoints.length;
	
	if(style){
		this.style = style;
	}
	
	this.draw = function(){
		var context = this.canvas.context;
		context.fillStyle = this.style.fillStyle;
		context.strokeStyle = this.style.strokeStyle;
		context.lineWidth = this.style.lineWidth;
		
		context.beginPath();
		context.moveTo(this.currentPoints[0].x, this.currentPoints[0].y);
		
		for(var i = 1; i < this.currentPoints.length; i++){
			context.lineTo(this.currentPoints[i].x, this.currentPoints[i].y);
		}
		
		context.lineTo(this.currentPoints[0].x, this.currentPoints[0].y);
		context.closePath();
		context.stroke();
		context.fill();
	}
	
	this.deform = function(){
		this.deformWithAnimated = false;
		
		for(var i = 0; i < this.currentPoints.length; i++){
			var pi = this.currentPoints[i];
			var newX = pi.x;
			var newY = pi.y;
			
			if(pi.dx != 0 && Math.abs(pi.x - this.toPoints[i].x) >= Math.abs(pi.dx)){
				newX = pi.x + pi.dx;
				this.deformWithAnimated = true;
			}else{
				newX = this.toPoints[i].x;
			}
			
			if(pi.dy != 0 && Math.abs(pi.y - this.toPoints[i].y) >= Math.abs(pi.dy)){
				newY = pi.y + pi.dy;
				this.deformWithAnimated = true;
			}else{
				newY = this.toPoints[i].y;
			}
			this.currentPoints[i] = {x:newX, y:newY, dx:pi.dx, dy:pi.dy};
		}
	}
	
	this.deformEachTopPoints = function(toPoints, duration){
		this.deformWithAnimated = true;
		this.toPoints = toPoints;

		if(duration == 0 || this.canvas.fps == 0)
			return ;

		for(var i = 0; i < this.currentPoints.length; i++){
			var dx = (this.toPoints[i].x - this.currentPoints[i].x) / duration * 1000 / this.canvas.fps;
			var dy = (this.toPoints[i].y - this.currentPoints[i].y) / duration * 1000 / this.canvas.fps;
			this.currentPoints[i] = {x:this.currentPoints[i].x, y:this.currentPoints[i].y, dx:dx, dy:dy};
		}
	}

	this.move = function(){
//		this.moving = true;

		for(var i = 0; i < this.currentPoints.length; i++){
			this.currentPoints[i] = {x:this.currentPoints[i].x + this.speed.x, y:this.currentPoints[i].y + this.speed.y};
			this.toPoints[i] = {x:this.toPoints[i].x + this.speed.x, y:this.toPoints[i].y + this.speed.y};
		}

		if(this.childs != null && this.childs.length > 0){

			for(var i = 0; i < this.childs.length; i++){
				this.childs[i].speed = this.speed;
				this.childs[i].move();
			}
		}
	}

}
PolygonGraghicObject.prototype = new GraphicObject();
PolygonGraghicObject.prototype.constructor = PolygonGraghicObject;

//RectPolygonGraphicObject
function RectPolygonGraphicObject(canvas, center, width, height, style){
	
	this.canvas = canvas;
	this.center = center;
	this.width = width;
	this.height = height;
	if(style){
		this.style = style;
	}
	
	this.rectPointsMaker = function(center, width, height){
		if(center == null) return;
		var points = [{x:center.x - width / 2, y:center.y - height / 2},
		              {x:center.x + width / 2, y:center.y - height / 2},
		              {x:center.x + width / 2, y:center.y + height / 2},
		              {x:center.x - width / 2, y:center.y + height / 2}];
		
		return points;
	}
	
	this.deformRect = function(center, width, height, duration){
		this.center = center;
		this.width = width;
		this.height = height;
		
		this.deformEachTopPoints(this.rectPointsMaker(center, width, height), duration);
	}
	
	var points = this.rectPointsMaker(center, width, height);
	PolygonGraghicObject.call(this, canvas, this.rectPointsMaker(center, width, height), style);
}

RectPolygonGraphicObject.prototype = new PolygonGraghicObject();
RectPolygonGraphicObject.prototype.constructor = RectPolygonGraphicObject;


//RectGraphicObject
function RectGraphicObject(context, x, y, width, height, style){
	this.context = context;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.center = {x:x + width / 2, y:y + height / 2};
	
	if(style){
		this.style = style;
	}
}

RectGraphicObject.prototype = new GraphicObject(RectGraphicObject.context);
RectGraphicObject.prototype.constructor = RectGraphicObject;

RectGraphicObject.prototype.draw = function(){

	this.context.fillStyle = this.style.fillStyle;
	this.context.strokeStyle = this.style.strokeStyle;
	this.context.lineWidth = this.style.lineWidth;
	this.context.fillRect(this.x, this.y, this.width, this.height);
	this.context.strokeRect(this.x, this.y, this.width, this.height);
}


function Pen(canvas, style){
	this.canvas = canvas;
	this.points = [];
	this.differentialPoints = [];
	this.step = 0;
//	this.canvas.erase = false;

	if(style){
		this.style = style;
	}
	
	this.draw = function(){
		
		if(this.differentialPoints.length > this.step + 1){
			var startPoint = this.differentialPoints[this.step];
			var endPoint = this.differentialPoints[this.step + 1];
			
			this.drawLine(startPoint, endPoint);
			this.step++;
		}else{
			step = 0;
		}
	}
	
	this.stroke = function(points){
		
		for(var i = 0; i < points.length - 1; i++){
			this.drawLine(points[i], points[i + 1]);
			
		}
	}
	
	this.animatedStroke = function(points, duration){
		this.points = points;
		
		var sublineDuration = duration / this.points.length;
		
		for(var i = 0; i < this.points.length - 1; i++){
			var points = this.differentialPoint(this.points[i], this.points[i + 1], sublineDuration * this.canvas.fps)
			
			for(var j = 0; j < points.length; j++){
				this.differentialPoints.push(points[j]);
			}
			
		}
	}
	
	this.drawLine = function(startPoint, endPoint){
		var context = this.canvas.context;
		context.fillStyle = this.style.fillStyle;
		context.strokeStyle = this.style.strokeStyle;
		context.lineWidth = this.style.lineWidth;
		
		context.beginPath();
		context.moveTo(startPoint.x, startPoint.y);
		context.lineTo(endPoint.x, endPoint.y);
		context.closePath();
		context.stroke();
		
	}
	
	this.differentialPoint = function(startPoint, endPoint, times){
		var dx = (endPoint.x - startPoint.x) / times;
		var dy = (endPoint.y - startPoint.y) / times;
		
		var points = [];
		var currentPoint = {x:startPoint.x, y:startPoint.y};
		points.push(currentPoint);
		
		while(Math.abs(currentPoint.x - endPoint.x) > Math.abs(dx) || Math.abs(currentPoint.y - endPoint.y) > Math.abs(dy)){
			currentPoint = {x:currentPoint.x + dx, y:currentPoint.y + dy};
			points.push(currentPoint);
		}
		
		return points;
	}
}

Pen.prototype = new GraphicObject();
Pen.prototype.constructor = GraphicObject;


//------------------------------

function HashTable(){
	var size = 0;
	var entry = new Object();
	
	this.add = function(key, value){
		
		if(!this.containsKey(key)){
			size++ ;
		}
		entry[key] = value;
	}
	
	this.getValue = function(key){
		return this.containsKey(key) ? entry[key] : null;
	}
	
	this.remove = function(key){
		if(this.containsKey(key) && (delete entry[key])){
			size--;
		}
	}
	
	this.containsKey = function(key){
		return (key in entry);
	}
	
	this.containsValue = function(value){
		
		for(var prop in entry){
			if(entry[prop] == value){
				return true;
			}
		}
		return false;
	}
	
	this.getValues = function(){
		var values = new Array();
		
		for(var prop in entry){
			values.push(entry[prop]);
		}
		return values;
	}
	
	this.getKeys = function(){
		var keys = new Array();
		
		for(var prop in entry){
			keys.push(prop);
		}
		return keys;
	}
	
	this.getSize = function(){
		return size;
	}
	
	this.clear = function(){
		size = 0;
		entry = new Object();
	}
} 