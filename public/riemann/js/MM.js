var MM = {
	"factorials": [1,1,2,6],

	//Sine Integral Expansion Approximation
	// https://en.wikipedia.org/wiki/Trigonometric_integral#Expansion
	"Si": function (x, terms){
		var terms = typeof terms !== "undefined" ? terms : 4;
		var evens = 0;
		var odds = 0;
		sign = 1.0;
		for (var i = 0; i < terms; i++){
			var j = 2*i;
			var k = j+1;
			evens += sign*MM.fact(j)/Math.pow(x, j)
			odds +=  sign*MM.fact(k)/Math.pow(x, k)
			sign *= -1.0;
		}
		return Math.PI/2.0 -(Math.cos(x)/x)*evens -(Math.sin(x)/x)*odds;
	},

	//factorial either returns a stored factorial of x,
	//or builds up and stored the entries up to x
	//because JS Numbers are doubles, good up to 170!
	"fact": function(x){
		if (MM.factorials.length > x) {
			return MM.factorials[ x ];
		} else {
			var index = MM.factorials.length - 1;
			var product = MM.factorials[ index ];
			for (var i = index +1; i <= x; i++){
				product *= i;
				MM.factorials.push(product);
			};
			console.log(MM.factorials);
			return product;
		}
	}
};